import { EitherLayer, Layer, Mods, PathLayer, State, TextLayer } from './State';
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

    const scale = 10;

    const width = drag.width * dpm;
    const height = drag.height * dpm;
    const canvas = document.createElement('canvas');
    // document.body.append(canvas);
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${(width * scale) / 2}px`;
    canvas.style.height = `${(height * scale) / 2}px`;
    const ctx = canvas.getContext('2d')!;

    ctx.scale(scale, scale);
    ctx.translate(-pos.x, -pos.y);

    const PathKit = await PathKitInit({
        locateFile: (file: string) => './node_modules/pathkit-wasm/bin/' + file,
    });

    data.layers.forEach((layer) => {
        if (!layer.visible) {
            return;
        }
        if (layer.contents.type === 'Text') {
            layer.contents.items.forEach((item) => {
                item = maybeDrag(item, null, mods.labels[item.text]);
                ctx.font = `normal ${item.weight ?? 400} ${
                    15 * (item.scale ?? 1)
                }px Cinzel`;
                ctx.strokeStyle = layer.style.stroke!.color;
                ctx.lineWidth = layer.style.stroke!.width * (item.scale ?? 1);
                ctx.lineJoin = 'round';
                ctx.fillStyle = layer.style.fill!;

                ctx.save();

                ctx.translate(item.pos.x, item.pos.y);
                ctx.rotate(((item.rotate ?? 0) * Math.PI) / 180);
                const w = ctx.measureText(item.text).width;
                ctx.strokeText(item.text, -w / 2, 0);
                ctx.fillText(item.text, -w / 2, 0);

                ctx.restore();
            });
            return;
        }
        if (layer.contents.vector) {
            return;
        }
        layer.contents.items.forEach((path) => {
            const p = new Path2D(path);
            if (layer.style.fill && layer.style.fill !== 'none') {
                ctx.fill(p);
            }
            ctx.strokeStyle = layer.style.stroke?.color ?? 'none';
            ctx.lineWidth = layer.style.stroke?.width ?? 1;
            ctx.stroke(p);
        });
    });

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
    <!-- <image x="0" y="0" width="${width * scale}" height="${height * scale}"
        xlink:href="${canvas.toDataURL()}" transform="scale(${
        1 / scale
    })" /> -->
        <g transform="translate(${-pos.x}, ${-pos.y})" >
            ${data.layers
                .filter(
                    (l) =>
                        // l.contents.type === 'Path' &&
                        // l.contents.vector &&
                        l.visible,
                )
                .map(
                    (layer) =>
                        `<g fill="${layer.style.fill ?? 'none'}" stroke="${
                            layer.style.stroke?.color
                        }" stroke-width="${layer.style.stroke?.width}">
                ${svgLayer(PathKit, layer, pos, width, height, mods)}
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
                        ${layer.paths
                            .flatMap((points) =>
                                clipPath(points, pos, width, height),
                            )
                            .map(
                                (path, j) =>
                                    `<polyline
                                    points="${path
                                        .map((p) => `${p.x},${p.y}`)
                                        .join(' ')}"
                                />`,
                            )
                            .concat(
                                Object.entries(layer.moved).flatMap(
                                    ([name, moved]) => {
                                        if (!layersByName[name]) return [];
                                        return Object.keys(moved)
                                            .filter((k) => moved[+k])
                                            .map(
                                                (k) =>
                                                    layersByName[name].contents
                                                        .items[+k] as string,
                                            )
                                            .flatMap(parsePath)
                                            .flatMap((points) =>
                                                clipPath(
                                                    points,
                                                    pos,
                                                    width,
                                                    height,
                                                ),
                                            )
                                            .map(
                                                (path) =>
                                                    `<polyline
                                    points="${path
                                        .map((p) => `${p.x},${p.y}`)
                                        .join(' ')}"
                                />`,
                                            );
                                    },
                                ),
                            )}
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
    // const img = document.createElement('img');
    // document.body.append(img);
    // img.src = canvas.toDataURL();
}

const toNum = (m: string) => {
    const num = parseFloat(m);
    if (isNaN(num)) {
        console.warn('o', m == null ? +m : JSON.stringify(m));
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
const clipPath = (
    points: Coord[],
    pos: Coord,
    width: number,
    height: number,
) => {
    const parts: Coord[][] = [];
    let current: Coord[] = [];
    points.forEach((point) => {
        if (within(point, pos, width, height)) {
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
    pos: Coord,
    width: number,
    height: number,
): 'both' | 'in' | 'out' => {
    let someIn = false;
    let someOut = false;
    for (let run of points) {
        for (let point of run) {
            if (within(point, pos, width, height)) {
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

function svgLayer(
    PathKit: PathKit,
    layer: TextLayer | PathLayer,
    pos: { x: number; y: number },
    width: number,
    height: number,
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
                .flatMap((points) => clipPath(points, pos, width, height))
                .map(
                    (path) =>
                        `<polyline points="${path
                            .map((p) => `${p.x},${p.y}`)
                            .join(' ')}"
                            ${
                                layer.style.stroke?.dotted
                                    ? 'stroke-dasharray="5,5"'
                                    : null
                            }
                             />`,
                )
                .join('\n');
        } else {
            const bounds = PathKit.NewPath();
            bounds.rect(pos.x, pos.y, width, height);
            bounds.close();
            return layer.contents.items
                .map((path) => {
                    const status = overlapStatus(
                        parsePath(path),
                        pos,
                        width,
                        height,
                    );
                    if (status === 'out') {
                        return '';
                    }
                    if (status === 'in') {
                        return `<path d="${path}" />`;
                    }
                    const p = PathKit.FromSVGString(path);
                    p.op(bounds, PathKit.PathOp.INTERSECT);
                    return `<path d="${p.toSVGString()}" fillMode="${p.getFillTypeString()}" />`;
                })
                .join('\n');
        }
    }
    const mapped = layer.contents.items.map((item) =>
        maybeDrag(item, null, mods.labels[item.text]),
    );
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

function within(point: Coord, pos: Coord, width: number, height: number) {
    return (
        point.x >= pos.x &&
        point.x <= pos.x + width &&
        point.y >= pos.y &&
        point.y <= pos.y + height
    );
}
