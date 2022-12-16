import * as React from 'react';
import { EitherLayer, Layer, Mods, State, Style } from './State';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { ColorPicker } from 'primereact/colorpicker';
import { BlurInput, ColorChange } from './BlurInput';

export function Sidebar({
    data,
    setData,
    mods,
    setMods,
}: {
    data: State;
    setData: React.Dispatch<React.SetStateAction<State>>;
    mods: Mods;
    setMods: React.Dispatch<React.SetStateAction<Mods>>;
}) {
    const op = React.useRef<OverlayPanel>(null);
    const [editing, setEditing] = React.useState<null | number>(null);
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
    return (
        <div>
            <OverlayPanel ref={op} dismissable>
                {editing != null
                    ? styleEditor(data, editing, changeLayer)
                    : null}
            </OverlayPanel>
            {data.layers.map((layer, i) => (
                <div key={i}>
                    <button
                        style={
                            layer.visible
                                ? { cursor: 'pointer' }
                                : {
                                      cursor: 'pointer',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                  }
                        }
                        onClick={() => {
                            const newLayers = [...data.layers];
                            newLayers[i] = {
                                ...layer,
                                visible: !layer.visible,
                            };
                            setData({ layers: newLayers });
                        }}
                    >
                        {layer.visible ? 'Hide' : 'Show'}
                    </button>
                    <span style={{ marginLeft: 5 }} />
                    <span
                        style={colorSquare(layer.style)}
                        onClick={(evt) => {
                            op.current?.toggle(evt);
                            setEditing(i);
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
                            // op.current?.toggle(evt);
                            // setEditing(i);
                        }}
                    />
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
    data: State,
    editing: number,
    changeLayer: (i: number, fn: (l: EitherLayer) => EitherLayer) => void,
): React.ReactNode {
    const layer = data.layers[editing];
    return (
        <>
            {layer.style.fill && layer.style.fill !== 'none' ? (
                <div>
                    Fill:
                    <ColorChange
                        value={layer.style.fill!}
                        onChange={(value) => {
                            changeLayer(editing!, (layer) => ({
                                ...layer,
                                style: {
                                    ...layer.style,
                                    fill: value,
                                },
                            }));
                        }}
                    />
                </div>
            ) : null}
            {layer.style.stroke ? (
                <div>
                    Stroke:
                    <ColorChange
                        value={layer.style.stroke.color}
                        onChange={(value) => {
                            changeLayer(editing!, (layer) => ({
                                ...layer,
                                style: {
                                    ...layer.style,
                                    stroke: {
                                        ...layer.style.stroke!,
                                        color: value,
                                    },
                                },
                            }));
                        }}
                    />
                    Width:
                    <BlurInput
                        value={layer.style.stroke.width.toString()}
                        onChange={(value) => {
                            const n = +value;
                            if (isNaN(n)) return;
                            changeLayer(editing!, (layer) => ({
                                ...layer,
                                style: {
                                    ...layer.style,
                                    stroke: {
                                        ...layer.style.stroke!,
                                        width: n,
                                    },
                                },
                            }));
                        }}
                    />
                    <button
                        onClick={() => {
                            changeLayer(editing!, (layer) => ({
                                ...layer,
                                style: {
                                    ...layer.style,
                                    stroke: {
                                        ...layer.style.stroke!,
                                        dotted: !layer.style.stroke!.dotted,
                                    },
                                },
                            }));
                        }}
                    >
                        {layer.style.stroke.dotted ? 'Dotted' : 'Solid'}
                    </button>
                </div>
            ) : null}
        </>
    );
}
