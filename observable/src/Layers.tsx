import * as React from 'react';
import { Drag, ToolState } from './Editor';
import { parsePath } from './rasterize';
import { Coord } from './star';
import { TextLayer, PathLayer, State, Mods, Text } from './State';

const PathLayerV = React.memo(
    ({
        layer,
        tool,
        setTool,
        setMods,
        mlm,
    }: {
        layer: PathLayer;
        tool?: ToolState['type'];
        setTool: React.Dispatch<React.SetStateAction<ToolState | null>>;
        setMods: React.Dispatch<React.SetStateAction<Mods>>;
        mlm?: Mods['layers'][0]['moved'][''];
    }) => {
        return (
            <g
                data-name={layer.name}
                fill={layer.style.fill ?? 'none'}
                stroke={layer.style.stroke?.color}
                strokeWidth={layer.style.stroke?.width}
                strokeDasharray={layer.style.stroke?.dotted ? '5,5' : undefined}
            >
                {layer.contents.items.map((item, j) =>
                    mlm && mlm[j] ? (
                        tool === 'line' && (
                            <React.Fragment key={j}>
                                {toolPoints(layer, setTool)}
                            </React.Fragment>
                        )
                    ) : (
                        <path
                            key={j}
                            d={item}
                            className={tool === 'move' ? 'hover' : undefined}
                            onClick={
                                tool === 'move'
                                    ? () => {
                                          setTool((tool) => {
                                              if (tool?.type !== 'move')
                                                  return tool;

                                              setMods((mods) => {
                                                  const layers = [
                                                      ...mods.layers,
                                                  ];
                                                  layers[tool.layer] = {
                                                      ...layers[tool.layer],
                                                      moved: {
                                                          ...layers[tool.layer]
                                                              .moved,
                                                          [layer.name]: {
                                                              ...layers[
                                                                  tool.layer
                                                              ].moved[
                                                                  layer.name
                                                              ],
                                                              [j]: true,
                                                          },
                                                      },
                                                  };
                                                  return { ...mods, layers };
                                              });
                                              return null;
                                          });
                                      }
                                    : undefined
                            }
                        />
                    ),
                )}
                {tool === 'line' && <>{toolPoints(layer, setTool)}</>}
            </g>
        );
    },
);

const TextLayerV = ({
    layer,
    mods,
    setMods,
    drag,
    startDrag,
    setTool,
}: {
    layer: TextLayer;
    mods: Mods;
    setMods: (mods: Mods) => void;
    drag: ToolState | null;
    startDrag: (text: Text, evt: React.MouseEvent) => void;
    setTool: React.Dispatch<React.SetStateAction<ToolState | null>>;
}) => {
    return (
        <g
            style={{
                font: `15px Cinzel`,
                color: 'black',
            }}
            fill={layer.style.fill ?? 'none'}
            data-name={layer.name}
        >
            <g
                stroke={layer.style.stroke?.color}
                strokeWidth={layer.style.stroke?.width}
                strokeLinejoin="round"
            >
                {layer.contents.items.map((item, j) => {
                    item = maybeDrag(item, drag, mods.labels[item.text]);
                    return (
                        <text
                            key={j}
                            x={item.pos.x}
                            y={item.pos.y}
                            textAnchor="middle"
                            style={{
                                transformOrigin: `${item.pos.x}px ${item.pos.y}px`,
                            }}
                            strokeWidth={
                                (layer.style.stroke?.width ?? 1) *
                                (item.scale ?? 1)
                            }
                            fontWeight={item.weight ?? 'normal'}
                            transform={`rotate(${item.rotate})`}
                            fontSize={15 * (item.scale ?? 1) + 'px'}
                            onMouseDown={(e) => {
                                startDrag(item, e);
                            }}
                        >
                            {item.text}
                        </text>
                    );
                })}
            </g>
            <g>
                {layer.contents.items.map((item, j) => {
                    item = maybeDrag(item, drag, mods.labels[item.text]);
                    return (
                        <text
                            key={j}
                            x={item.pos.x}
                            y={item.pos.y}
                            textAnchor="middle"
                            style={{
                                transformOrigin: `${item.pos.x}px ${item.pos.y}px`,
                            }}
                            fontWeight={item.weight ?? 'normal'}
                            fontSize={15 * (item.scale ?? 1) + 'px'}
                            transform={`rotate(${item.rotate})`}
                            onMouseDown={(e) => {
                                startDrag(item, e);
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                                setTool({ type: 'label', text: item });
                            }}
                        >
                            {item.text}
                        </text>
                    );
                })}
            </g>
        </g>
    );
};

export const dragItem = (item: Text, drag: Drag) => {
    if (drag.mode === 'rotate') {
        return { ...item, rotate: item.rotate + (drag.s1.x - drag.s0.x) / 2 };
    }
    if (drag.mode === 'scale') {
        return {
            ...item,
            scale: (item.scale || 1) * (1 + (drag.s1.x - drag.s0.x) / 100),
        };
    }
    return {
        ...item,
        pos: {
            x: item.pos.x + drag.p1.x - drag.p0.x,
            y: item.pos.y + drag.p1.y - drag.p0.y,
        },
    };
};

export const maybeDrag = (
    item: Text,
    drag: ToolState | null,
    mod?: Mods['labels'][''],
) => {
    if (mod) {
        item = {
            ...item,
            rotate: mod.rotate,
            scale: mod.scale,
            pos: mod.pos,
            weight: mod.weight,
        };
    }
    if (drag?.type === 'label-drag' && drag.text.text === item.text) {
        return dragItem(item, drag);
    }
    return item;
};

export const Layers = ({
    data,
    mods,
    setMods,
    drag,
    startDrag,
    setTool,
}: {
    data: State;
    mods: Mods;
    setMods: React.Dispatch<React.SetStateAction<Mods>>;
    drag: ToolState | null;
    startDrag: (text: Text, evt: React.MouseEvent) => void;
    setTool: React.Dispatch<React.SetStateAction<ToolState | null>>;
}) => {
    const mlm = React.useMemo(() => {
        const byName: Mods['layers'][0]['moved'] = {};
        mods.layers.forEach((layer) => {
            Object.entries(layer.moved).forEach(([name, moved]) => {
                byName[name] = { ...byName[name], ...moved };
            });
        });
        return byName;
    }, [mods]);
    return (
        <>
            {data.layers.map((layer, i) =>
                !layer.visible ? null : layer.contents.type === 'Text' ? (
                    <TextLayerV
                        key={i}
                        layer={layer as TextLayer}
                        mods={mods}
                        setMods={setMods}
                        drag={drag}
                        startDrag={startDrag}
                        setTool={setTool}
                    />
                ) : (
                    <PathLayerV
                        key={i}
                        layer={layer as PathLayer}
                        tool={drag?.type}
                        setTool={setTool}
                        setMods={setMods}
                        mlm={mlm[layer.name]}
                    />
                ),
            )}
        </>
    );
};

function toolPoints(
    layer: PathLayer,
    setTool: React.Dispatch<React.SetStateAction<ToolState | null>>,
) {
    return layer.contents.items.flatMap((item, j) => {
        const points: Coord[] = parsePath(item).flatMap((x) => x);
        return points.map(({ x, y }, i) => (
            <circle
                key={`${j}-${i}`}
                cx={x}
                cy={y}
                r={2}
                strokeWidth={0.5}
                stroke="magenta"
                style={{ cursor: 'pointer' }}
                fill="white"
                onClick={() => {
                    setTool((tool) => {
                        if (tool?.type === 'line') {
                            console.log('um', tool);
                            return {
                                ...tool,
                                points: [...tool.points, { x, y }],
                            };
                        }
                        console.log('um', tool);
                        return tool;
                    });
                }}
            />
        ));
    });
}
