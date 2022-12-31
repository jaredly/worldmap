import {
    EitherLayer,
    Layer,
    Mods,
    PathLayer,
    State,
    Style,
    Text,
    TextLayer,
} from './State';
import { ToolState, dpm } from './Editor';
import { dragItem, maybeDrag } from './Layers';
import { Coord } from './star';
import PathKitInit, { PathKit } from 'pathkit-wasm';

export async function rasterize({
    drag,
    pos,
    data,
    mods,
}: {
    drag: ToolState | null;
    pos: { x: number; y: number };
    data: State;
    mods: Mods;
}) {
    if (drag?.type !== 'crop') {
        return null;
    }

    const PathKit = await PathKitInit({
        locateFile: (file: string) => './node_modules/pathkit-wasm/bin/' + file,
    });

    const width = drag.width * dpm;
    const height = drag.height * dpm;

    const bounds: Bounds = { width, height, pos, rotate: drag.rotate };

    const layersByName: { [key: string]: EitherLayer } = {};
    data.layers.forEach((layer) => {
        layersByName[layer.name] = layer;
    });

    const node = document.createElement('div');
    node.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${(
        width / dpm
    ).toFixed(2)}mm" height="${(height / dpm).toFixed(
        2,
    )}mm" viewBox="0 0 ${width} ${height}">
        <g transform="translate(${-pos.x}, ${-pos.y}) ${
        drag.rotate != 0 ? `rotate(${-drag.rotate}, ${pos.x}, ${pos.y})` : ''
    }" >
            ${data.layers
                .filter((l) => l.visible)
                .map(
                    (layer) =>
                        `<g fill="${layer.style.fill ?? 'none'}" stroke="${
                            layer.style.stroke?.color
                        }" stroke-width="${layer.style.stroke?.width}">
                ${svgLayer(
                    PathKit,
                    layer.contents.type === 'Text'
                        ? {
                              ...(layer as TextLayer),
                              contents: {
                                  ...layer.contents,
                                  items: layer.contents.items.concat(
                                      mods.extraLabels as Text[],
                                  ),
                              },
                          }
                        : layer,
                    bounds,
                    mods,
                )}
                </g>`,
                )
                .join('\n')}

                ${mods.layers
                    .filter((l) => l.visible)
                    .flatMap(
                        (layer, i) =>
                            `<g
                        fill="${layer.style.fill ?? 'none'}"
                        stroke="${layer.style.stroke?.color}"
                        strokeWidth="${layer.style.stroke?.width}"
                        strokeDasharray="${
                            layer.style.stroke?.dotted ? '5,5' : ''
                        }"
                    >
                        ${svgModLayer(layer, bounds, layersByName)}
                    </g>`,
                    )
                    .join('\n')}
            </g>
    </svg>
    `;
    const url = URL.createObjectURL(
        new Blob([node.innerHTML], { type: 'image/svg+xml' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'map.svg';
    link.append(node);
    document.body.append(link);
}

const toNum = (m: string) => {
    const num = parseFloat(m);
    if (isNaN(num)) {
        console.warn('toNum got a NaN', m == null ? +m : JSON.stringify(m));
    }
    return num;
};

export const parsePath = (path: string): Coord[][] => {
    const parts = path.replace(/\s$/g, '').split('M');
    return parts
        .filter(Boolean)
        .map((line) => {
            let closed = false;
            if (line.endsWith('Z')) {
                closed = true;
                line = line.slice(0, -1);
            }
            const points = line.split('L');
            const parsed = points.map((point) => {
                if (!point.includes(' ') && !point.includes(',')) {
                    console.warn('Not double?', point);
                }
                const [x, y] = point
                    .split(/[,\s]+/g)
                    .filter(Boolean)
                    .map(toNum);
                return { x, y };
            });
            if (closed) {
                parsed.push(parsed[0]);
            }
            return parsed;
        })
        .filter((m) => m.length);
};

// OPEN PATH: if you want closed, append the first point to the end
const clipPath = (points: Coord[], bounds: Bounds) => {
    const parts: Coord[][] = [];
    let current: Coord[] = [];
    points.forEach((point) => {
        if (within(point, bounds)) {
            current.push(point);
        } else {
            if (current.length) {
                parts.push(current);
                current = [];
            }
        }
    });
    if (current.length) {
        parts.push(current);
    }
    return parts;
};

const overlapStatus = (
    points: Coord[][],
    bounds: Bounds,
): 'both' | 'in' | 'out' => {
    let someIn = false;
    let someOut = false;
    for (let run of points) {
        for (let point of run) {
            if (within(point, bounds)) {
                someIn = true;
            } else {
                someOut = true;
            }
            if (someIn && someOut) {
                return 'both';
            }
        }
    }
    return someIn ? 'in' : 'out';
};

const pointsd = (points: Coord[]) =>
    `M${points.map((p) => `${p.x},${p.y}`).join('L')}`;

function svgModLayer(
    layer: {
        name: string;
        style: Style;
        paths: Coord[][];
        visible: boolean;
        moved: { [layerName: string]: { [pathIndex: number]: boolean } };
    },
    bounds: Bounds,
    layersByName: { [key: string]: EitherLayer },
) {
    return layer.paths
        .flatMap((points) => clipPath(points, bounds))
        .map((path, j) => `<path d="${pointsd(path)}" />`)
        .concat(
            Object.entries(layer.moved).flatMap(([name, moved]) => {
                if (!layersByName[name]) return [];
                return Object.keys(moved)
                    .filter((k) => moved[+k])
                    .map((k) => layersByName[name].contents.items[+k] as string)
                    .flatMap(parsePath)
                    .flatMap((points) => clipPath(points, bounds))
                    .map((path) => `<path d="${pointsd(path)}" />`);
            }),
        );
}

function svgLayer(
    PathKit: PathKit,
    layer: TextLayer | PathLayer,
    bounds: Bounds,
    mods: Mods,
) {
    if (layer.contents.type === 'Path') {
        if (
            layer.contents.vector ||
            !layer.style.fill ||
            layer.style.fill === 'none'
        ) {
            return layer.contents.items
                .flatMap(parsePath)
                .flatMap((points) => clipPath(points, bounds))
                .map(
                    (path) =>
                        `<path d="${pointsd(path)}"
                            ${
                                layer.style.stroke?.dotted
                                    ? 'stroke-dasharray="5,5"'
                                    : null
                            }
                             />`,
                )
                .join('\n');
        } else {
            const boundPath = PathKit.NewPath();
            boundPath.rect(
                bounds.pos.x,
                bounds.pos.y,
                bounds.width,
                bounds.height,
            );
            boundPath.close();
            return layer.contents.items
                .map((path) => {
                    const status = overlapStatus(parsePath(path), bounds);
                    if (status === 'out') {
                        return '';
                    }
                    if (status === 'in') {
                        return `<path d="${path}" />`;
                    }
                    const p = PathKit.FromSVGString(path);
                    p.op(boundPath, PathKit.PathOp.INTERSECT);
                    return `<path d="${p.toSVGString()}" fillMode="${p.getFillTypeString()}" />`;
                })
                .join('\n');
        }
    }
    const mapped = layer.contents.items
        .map((item) => maybeDrag(item, null, mods.labels[item.text]))
        .filter((item) => within(item.pos, bounds));
    return mapped
        .map(
            (item) =>
                `<text x="${item.pos.x}" y="${
                    item.pos.y
                }" font-family="Cinzel" font-size="${
                    15 * (item.scale ?? 1)
                }" font-weight="${item.weight ?? 400}" stroke-width="${
                    (layer.style.stroke?.width ?? 1) * (item.scale ?? 1)
                }" transform="rotate(${item.rotate ?? 0}, ${item.pos.x}, ${
                    item.pos.y
                })" text-anchor="middle">${item.text}</text>`,
        )
        .concat(
            mapped.map(
                (item) =>
                    `<text x="${item.pos.x}" y="${
                        item.pos.y
                    }" font-family="Cinzel" font-size="${
                        15 * (item.scale ?? 1)
                    }" font-weight="${item.weight ?? 400}" transform="rotate(${
                        item.rotate ?? 0
                    }, ${item.pos.x}, ${
                        item.pos.y
                    })" stroke="none" text-anchor="middle">${item.text}</text>`,
            ),
        )
        .join('\n');
}

type Bounds = {
    pos: Coord;
    width: number;
    height: number;
    rotate: number;
};

function within(point: Coord, { pos, width, height, rotate }: Bounds) {
    if (rotate != 0) {
        // console.log('within', rotate, point, pos);
        point = rotatePoint(point, pos, -rotate);
    }
    return (
        point.x >= pos.x &&
        point.x <= pos.x + width &&
        point.y >= pos.y &&
        point.y <= pos.y + height
    );
}
function rotatePoint(point: Coord, pos: Coord, rotate: number): Coord {
    /* Rotates a point around pos by rotate radians */
    rotate = (rotate * Math.PI) / 180;
    const x = point.x - pos.x;
    const y = point.y - pos.y;
    const cos = Math.cos(rotate);
    const sin = Math.sin(rotate);
    return {
        x: x * cos - y * sin + pos.x,
        y: x * sin + y * cos + pos.y,
    };
}
