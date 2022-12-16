import { Mods, State } from './State';
import { ToolState, dpm } from './Editor';

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

    const scale = 5;

    const width = drag.width * dpm;
    const height = drag.height * dpm;
    const canvas = document.createElement('canvas');
    document.body.append(canvas);
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
        if (layer.contents.type === 'Text' || layer.contents.vector) {
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
}
