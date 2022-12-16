import * as React from 'react';
import { EitherLayer, Layer, Mods, State, Style } from './State';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { ColorPicker } from 'primereact/colorpicker';
import { BlurInput, ColorChange } from './BlurInput';
import { ToolState } from './Editor';

export function Sidebar({
    data,
    setData,
    mods,
    setMods,
    tool,
    setTool,
}: {
    data: State;
    setData: React.Dispatch<React.SetStateAction<State>>;
    mods: Mods;
    setMods: React.Dispatch<React.SetStateAction<Mods>>;
    tool: ToolState | null;
    setTool: React.Dispatch<React.SetStateAction<ToolState | null>>;
}) {
    const op = React.useRef<OverlayPanel>(null);
    const [editing, setEditing] = React.useState<
        | null
        | {
              type: 'layer';
              index: number;
          }
        | {
              type: 'mod';
              index: number;
          }
    >(null);
    const changeLayer = React.useCallback(
        (i: number, fn: (l: EitherLayer) => EitherLayer) => {
            setData((data) => {
                const newLayers = [...data.layers];
                newLayers[i] = fn(newLayers[i]);
                return { ...data, layers: newLayers };
            });
        },
        [],
    );
    const changeMod = React.useCallback(
        (i: number, fn: (l: Mods['layers'][0]) => Mods['layers'][0]) => {
            setMods((data) => {
                const newLayers = [...data.layers];
                newLayers[i] = fn(newLayers[i]);
                return { ...data, layers: newLayers };
            });
        },
        [],
    );
    return (
        <div>
            <OverlayPanel ref={op} dismissable>
                {editing?.type === 'layer'
                    ? styleEditor(data.layers[editing.index].style, (style) => {
                          changeLayer(editing.index, (l) => ({ ...l, style }));
                      })
                    : editing?.type === 'mod'
                    ? styleEditor(mods.layers[editing.index].style, (style) => {
                          changeMod(editing.index, (l) => ({ ...l, style }));
                      })
                    : null}
            </OverlayPanel>
            {data.layers.map((layer, i) => (
                <div key={i}>
                    <input
                        type="checkbox"
                        checked={layer.visible}
                        style={
                            layer.visible
                                ? { cursor: 'pointer' }
                                : {
                                      cursor: 'pointer',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                  }
                        }
                        onChange={() => {
                            const newLayers = [...data.layers];
                            newLayers[i] = {
                                ...layer,
                                visible: !layer.visible,
                            };
                            setData({ layers: newLayers });
                        }}
                    />
                    <span style={{ marginLeft: 5 }} />
                    <span
                        style={colorSquare(layer.style)}
                        onClick={(evt) => {
                            op.current?.toggle(evt);
                            setEditing({ type: 'layer', index: i });
                        }}
                        data-layer={JSON.stringify(layer.style)}
                    />
                    <span style={{ marginLeft: 5 }} />
                    {layer.name}
                    <span style={{ marginLeft: 5 }} />
                    <button
                        onClick={() => {
                            const newLayers = [...data.layers];
                            newLayers.splice(i, 1);
                            setData({ layers: newLayers });
                        }}
                    >
                        Delete
                    </button>
                </div>
            ))}
            {mods.layers.map((layer, i) => (
                <div key={i}>
                    <span
                        style={colorSquare(layer.style)}
                        onClick={(evt) => {
                            op.current?.toggle(evt);
                            setEditing({ type: 'mod', index: i });
                        }}
                    />
                    <span style={{ marginLeft: 5 }} />
                    <BlurInput
                        value={layer.name}
                        onChange={(value) => {
                            setMods((mods) => {
                                const newLayers = [...mods.layers];
                                newLayers[i] = {
                                    ...layer,
                                    name: value,
                                };
                                return { ...mods, layers: newLayers };
                            });
                        }}
                    />
                    <button
                        onClick={() => {
                            if (tool?.type === 'line' && tool.layer === i) {
                                setTool(null);
                            } else {
                                setTool({
                                    type: 'line',
                                    layer: i,
                                    points: [],
                                });
                            }
                        }}
                        style={
                            tool?.type === 'line' && tool.layer === i
                                ? { backgroundColor: 'red' }
                                : undefined
                        }
                    >
                        <i className="pi pi-pencil" />
                    </button>
                    <button
                        onClick={() => {
                            if (tool?.type === 'move' && tool.layer === i) {
                                setTool(null);
                            } else {
                                setTool({
                                    type: 'move',
                                    layer: i,
                                });
                            }
                        }}
                        style={
                            tool?.type === 'move' && tool.layer === i
                                ? { backgroundColor: 'red' }
                                : undefined
                        }
                    >
                        <i className="pi pi-plus" />
                    </button>
                    {tool?.type === 'line' && tool.layer === i ? (
                        <button
                            onClick={() => {
                                changeMod(i, (layer) => {
                                    return {
                                        ...layer,
                                        paths: [...layer.paths, tool.points],
                                    };
                                });
                                setTool(null);
                            }}
                        >
                            Commit
                        </button>
                    ) : null}
                </div>
            ))}
            <button
                onClick={() => {
                    setMods((mods) => {
                        const newLayers = [...mods.layers];
                        newLayers.push({
                            name: 'New Layer',
                            style: {
                                fill: 'purple',
                                stroke: {
                                    color: 'black',
                                    width: 1,
                                    dotted: false,
                                },
                            },
                            paths: [],
                            moved: {},
                        });
                        return { ...mods, layers: newLayers };
                    });
                }}
            >
                Add Mod Layer
            </button>
            <button
                onClick={() => {
                    setTool({ type: 'crop', rotate: 0 });
                }}
            >
                Clip it now
            </button>
        </div>
    );
}

function colorSquare(style: Style): React.CSSProperties {
    return {
        display: 'inline-block',
        width: 10,
        height: 10,
        backgroundColor: styleColor(style),
        border: '1px solid black',
        cursor: 'pointer',
    };
}

function styleColor(style: Style) {
    return style.fill && style.fill !== 'none'
        ? style.fill
        : style.stroke?.color;
}

function styleEditor(
    style: Style,
    onChange: (style: Style) => void,
): React.ReactNode {
    return (
        <>
            {style.fill && style.fill !== 'none' ? (
                <div>
                    Fill:
                    <ColorChange
                        value={style.fill!}
                        onChange={(value) => {
                            onChange({
                                ...style,
                                fill: value,
                            });
                        }}
                    />
                    <button
                        onClick={() => onChange({ ...style, fill: undefined })}
                    >
                        No Fill
                    </button>
                </div>
            ) : (
                <button onClick={() => onChange({ ...style, fill: 'black' })}>
                    Add fill
                </button>
            )}
            {style.stroke ? (
                <div>
                    Stroke:
                    <ColorChange
                        value={style.stroke.color}
                        onChange={(value) => {
                            onChange({
                                ...style,
                                stroke: {
                                    ...style.stroke!,
                                    color: value,
                                },
                            });
                        }}
                    />
                    Width:
                    <BlurInput
                        value={style.stroke.width.toString()}
                        onChange={(value) => {
                            const n = +value;
                            if (isNaN(n)) return;
                            onChange({
                                ...style,
                                stroke: {
                                    ...style.stroke!,
                                    width: n,
                                },
                            });
                        }}
                    />
                    <button
                        onClick={() => {
                            onChange({
                                ...style,
                                stroke: {
                                    ...style.stroke!,
                                    dotted: !style.stroke!.dotted,
                                },
                            });
                        }}
                    >
                        {style.stroke.dotted ? 'Dotted' : 'Solid'}
                    </button>
                </div>
            ) : null}
        </>
    );
}
