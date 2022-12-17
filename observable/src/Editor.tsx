import * as React from 'react';
import { output } from './fixed';
import { usePanZoom } from './usePanZoom';
import { dragItem, Layers } from './Layers';
import { Sidebar } from './Sidebar';
import { EitherLayer, Mods, State, Text } from './State';
import { useLocalforage } from './useLocalforage';
import { Coord } from './star';
import { rasterize } from './rasterize';

export type ToolState =
    | {
          type: 'crop';
          rotate: number;
          width: number;
          height: number;
      }
    | {
          type: 'line';
          layer: number;
          points: Coord[];
      }
    | {
          type: 'move';
          layer: number;
      }
    | {
          type: 'label';
          text: Text;
          oitem: Text;
      }
    | { type: 'add-label' }
    | Drag;
export type Drag = {
    type: 'label-drag';
    text: Text;
    p0: Coord;
    p1: Coord;
    s0: Coord;
    s1: Coord;
    mode: 'move' | 'rotate' | 'scale';
};

// const dpi = 96;
// const dpi = 120;
export const dpm = 120 / 25.4;

export const Wrapper = () => {
    const [data, setData] = useLocalforage<State>('worldmap', { layers: [] });
    const [mods, setMods] = useLocalforage<Mods>('worldmap-mods', {
        labels: {},
        layers: [],
        extraLabels: [],
    });

    if (!mods.layers) {
        mods.layers = [];
    }
    if (!mods.extraLabels) {
        mods.extraLabels = [];
    }

    const [drag, setDrag] = React.useState<ToolState | null>(null);

    const width = 1000;
    const height = 1000;

    const [pos, setPos] = React.useState({ x: 0, y: 0 });

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
                type: 'label-drag',
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

    const layersByName: { [key: string]: EitherLayer } = {};
    data.layers.forEach((layer) => {
        layersByName[layer.name] = layer;
    });

    const cropState = React.useRef({ drag, pos, data, mods });
    cropState.current = { drag, pos, data, mods };

    React.useEffect(() => {
        const fn = (evt: KeyboardEvent) => {
            if (
                evt.target !== document.body &&
                (evt.target! as HTMLElement).nodeName !== 'BUTTON'
            ) {
                return;
            }
            if (evt.key === 'ArrowLeft') {
                setDrag((drag) => {
                    if (drag?.type === 'crop') {
                        return { ...drag, rotate: drag.rotate - 5 };
                    }
                    return drag;
                });
            }
            if (evt.key === 'ArrowRight') {
                setDrag((drag) => {
                    if (drag?.type === 'crop') {
                        return { ...drag, rotate: drag.rotate + 5 };
                    }
                    return drag;
                });
            }
            if (evt.key === 'Enter') {
                rasterize(cropState.current);
            }
        };
        document.addEventListener('keydown', fn);
        return () => {
            document.removeEventListener('keydown', fn);
        };
    }, [drag]);

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
                {/* {JSON.stringify(pz.pz)} */}
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
                            drag?.type === 'label-drag'
                                ? { ...drag, p1: pos, s1: spos }
                                : drag,
                        );
                    }}
                    onMouseDown={(evt) => {
                        if (drag?.type === 'add-label') {
                            const box =
                                evt.currentTarget.getBoundingClientRect();
                            const pos = pz.fromScreen(
                                evt.clientX - box.left,
                                evt.clientY - box.top,
                            );
                            setMods({
                                ...mods,
                                extraLabels: [
                                    ...mods.extraLabels,
                                    {
                                        text: 'New label',
                                        pos: pos,
                                        rotate: 0,
                                        scale: 1,
                                    },
                                ],
                            });
                            setDrag(null);
                        }
                        if (
                            evt.target === evt.currentTarget &&
                            drag?.type === 'line'
                        ) {
                            const box =
                                evt.currentTarget.getBoundingClientRect();
                            const pos = pz.fromScreen(
                                evt.clientX - box.left,
                                evt.clientY - box.top,
                            );
                            setPos(pos);
                            setDrag({
                                ...drag,
                                points: [...drag.points, pos],
                            });
                        }
                    }}
                    onMouseUp={(evt) => {
                        if (drag?.type === 'label-drag') {
                            const changed = dragItem(drag.text, drag);
                            setMods({
                                ...mods,
                                labels: {
                                    ...mods.labels,
                                    [drag.text.text]: {
                                        ...mods.labels[drag.text.text],
                                        scale: changed.scale ?? 1,
                                        pos: changed.pos,
                                        rotate: changed.rotate,
                                    },
                                },
                            });
                            setDrag(null);
                        }
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
                            setTool={setDrag}
                        />
                        {mods.layers
                            .filter((l) => l.visible)
                            .flatMap((layer, i) => (
                                <g
                                    key={i}
                                    fill={layer.style.fill ?? 'none'}
                                    stroke={layer.style.stroke?.color}
                                    strokeWidth={layer.style.stroke?.width}
                                    strokeDasharray={
                                        layer.style.stroke?.dotted
                                            ? '5,5'
                                            : undefined
                                    }
                                >
                                    {layer.paths
                                        .map((path, j) => (
                                            <polyline
                                                key={`${i}-${j}`}
                                                points={path
                                                    .map((p) => `${p.x},${p.y}`)
                                                    .join(' ')}
                                            />
                                        ))
                                        .concat(
                                            Object.entries(layer.moved).flatMap(
                                                ([name, pos]) => {
                                                    if (!layersByName[name])
                                                        return [];
                                                    return Object.keys(pos)
                                                        .filter((k) => pos[+k])
                                                        .map((k) => (
                                                            <path
                                                                key={`${i}-${name}-${k}`}
                                                                d={
                                                                    layersByName[
                                                                        name
                                                                    ].contents
                                                                        .items[
                                                                        +k
                                                                    ] as string
                                                                }
                                                            />
                                                        ));
                                                },
                                            ),
                                        )}
                                </g>
                            ))}
                        {drag?.type === 'line' ? (
                            <polyline
                                points={drag.points
                                    .map((p) => `${p.x},${p.y}`)
                                    .join(' ')}
                                stroke="magenta"
                                strokeWidth={2}
                                fill="none"
                            />
                        ) : null}
                        {drag?.type === 'crop' ? (
                            <rect
                                x={pos.x}
                                y={pos.y}
                                width={drag.width * dpm}
                                height={drag.height * dpm}
                                style={{
                                    transformOrigin: `${pos.x}px ${pos.y}px`,
                                }}
                                transform={`rotate(${drag.rotate ?? 0})`}
                                stroke="magenta"
                                strokeWidth={2}
                                fill="none"
                            />
                        ) : null}
                    </g>
                </svg>
                <Sidebar
                    data={data}
                    setData={setData}
                    mods={mods}
                    setMods={setMods}
                    tool={drag}
                    setTool={setDrag}
                />
            </div>
        </div>
    );
};
