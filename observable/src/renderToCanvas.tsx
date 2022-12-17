import { Mods, State } from './State';
import { maybeDrag } from './Layers';

function renderToCanvas(
    width: number,
    scale: number,
    height: number,
    pos: { x: number; y: number },
    data: State,
    mods: Mods,
) {
    const canvas = document.createElement('canvas');
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
    return canvas;
}
