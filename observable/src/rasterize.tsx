import { Mods, PathLayer, State } from './State';
import { ToolState, dpm } from './Editor';
import { maybeDrag } from './Layers';
import { Coord } from './star';

export function rasterize({
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
                // ctx.strokeText(item.text, item.pos.x, item.pos.y);
                // ctx.fillText(item.text, item.pos.x, item.pos.y);
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

    const layersByName = {};
    data.layers.forEach((layer) => {
        layersByName[layer.name] = layer;
    });

    const node = document.createElement('div');
    node.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}">
    <image x="0" y="0" width="${width * scale}" height="${height * scale}"
        xlink:href="${canvas.toDataURL()}" transform="scale(${1 / scale})" />
        <g transform="translate(${-pos.x}, ${-pos.y})" >
            ${data.layers
                .filter(
                    (l) =>
                        l.contents.type === 'Path' &&
                        l.contents.vector &&
                        l.visible,
                )
                .map(
                    (layer) =>
                        `<g fill="${layer.style.fill ?? 'none'}" stroke="${
                            layer.style.stroke?.color
                        }" stroke-width="${layer.style.stroke?.width}">
                ${(layer as PathLayer).contents.items
                    .flatMap(parsePath)
                    .flatMap((points) => clipPath(points, pos, width, height))
                    .map(
                        (path) =>
                            `<polyline points="${path
                                .map((p) => `${p.x},${p.y}`)
                                .join(' ')}" />`,
                    )
                    .join('\n')}
                </g>`,
                )
                .join('\n')}

                ${mods.layers
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
                                            .filter((k) => moved[k])
                                            .map(
                                                (k) =>
                                                    layersByName[name].contents
                                                        .items[k],
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

const toNum = (m) => {
    const num = parseFloat(m);
    if (isNaN(num)) {
        console.warn('o', m);
    }
    return num;
};

const parsePath = (path: string) => {
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
                const [x, y] = point.split(/[,\s]/g).map(toNum);
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

function within(point: Coord, pos: Coord, width: number, height: number) {
    return (
        point.x >= pos.x &&
        point.x <= pos.x + width &&
        point.y >= pos.y &&
        point.y <= pos.y + height
    );
}
