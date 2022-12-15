import * as React from 'react';
import { output } from './fixed';
import { usePanZoom } from './usePanZoom';
import { dragItem, Layers } from './Layers';
import { Sidebar } from './Sidebar';
import { Mods, State, Text } from './State';
import { useLocalforage } from './useLocalforage';
import { Coord } from './star';

export type Drag = {
    type: 'label';
    text: Text;
    p0: Coord;
    p1: Coord;
    s0: Coord;
    s1: Coord;
    mode: 'move' | 'rotate' | 'scale';
};

export const Wrapper = () => {
    const [data, setData] = useLocalforage<State>('worldmap', { layers: [] });
    const [mods, setMods] = useLocalforage<Mods>('worldmap-mods', {
        labels: {},
        paths: [],
    });

    const [drag, setDrag] = React.useState<Drag | null>(null);

    const width = 1000;
    const height = 1000;

    const [pos, setPos] = React.useState({ x: 0, y: 0 });
    // const dpi = 96;
    const dpi = 120;

    const sheetW = (280 / 25.4) * dpi;
    const sheetH = (200 / 25.4) * dpi;
    const pz = usePanZoom(width, height);

    const startDrag = React.useCallback(
        (text: Text, evt: React.MouseEvent) => {
            evt.preventDefault();
            let top = evt.currentTarget as HTMLElement;
            while (top.nodeName !== 'svg') {
                top = top.parentElement as HTMLElement;
            }
            const box = top.getBoundingClientRect();
            const pos = pz.fromScreen(
                evt.clientX - box.left,
                evt.clientY - box.top,
            );
            setDrag({
                type: 'label',
                text: text,
                p0: pos,
                p1: pos,
                s0: { x: evt.clientX, y: evt.clientY },
                s1: { x: evt.clientX, y: evt.clientY },
                mode: evt.shiftKey ? 'rotate' : evt.metaKey ? 'scale' : 'move',
            });
        },
        [pz],
    );

    return (
        <div>
            <div>
                <button
                    onClick={() => {
                        output('data').then((node) => setData(node));
                    }}
                >
                    Load data again please
                </button>
                <button onClick={() => setData({ layers: [] })}>
                    Clear data
                </button>
            </div>
            <div
                style={{
                    display: 'flex',
                }}
            >
                <svg
                    width={width}
                    height={height}
                    onMouseMove={(evt) => {
                        const box = evt.currentTarget.getBoundingClientRect();
                        const pos = pz.fromScreen(
                            evt.clientX - box.left,
                            evt.clientY - box.top,
                        );
                        const spos = { x: evt.clientX, y: evt.clientY };
                        setPos(pos);
                        setDrag((drag) =>
                            drag ? { ...drag, p1: pos, s1: spos } : drag,
                        );
                    }}
                    onMouseUp={(evt) => {
                        if (drag) {
                            const changed = dragItem(drag.text, drag);
                            setMods({
                                ...mods,
                                labels: {
                                    ...mods.labels,
                                    [drag.text.text]: {
                                        scale: changed.scale ?? 1,
                                        pos: changed.pos,
                                        rotate: changed.rotate,
                                    },
                                },
                            });
                        }
                        setDrag(null);
                    }}
                    {...pz.props}
                >
                    <g transform={`translate(${-pz.tl.x}, ${-pz.tl.y})`}>
                        <Layers
                            data={data}
                            mods={mods}
                            setMods={setMods}
                            drag={drag}
                            startDrag={startDrag}
                        />
                        {/* <rect
                            stroke="red"
                            strokeWidth={1}
                            fill="none"
                            x={pos.x}
                            y={pos.y}
                            width={sheetW}
                            height={sheetH}
                        /> */}
                    </g>
                </svg>
                <Sidebar data={data} setData={setData} />
            </div>
        </div>
    );
};
