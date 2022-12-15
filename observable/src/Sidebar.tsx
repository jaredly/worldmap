import * as React from 'react';
import { Layer, State } from './State';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { ColorPicker } from 'primereact/colorpicker';
import { BlurInput, ColorChange } from './BlurInput';

export function Sidebar({
    data,
    setData,
}: {
    data: State;
    setData: React.Dispatch<React.SetStateAction<State>>;
}) {
    const op = React.useRef<OverlayPanel>(null);
    const [editing, setEditing] = React.useState<null | number>(null);
    const changeLayer = React.useCallback(
        (i: number, fn: (l: Layer) => Layer) => {
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
            {/* <Button
                type="button"
                label="Basic"
                onClick={(e) => op.current?.toggle(e)}
            /> */}

            <OverlayPanel ref={op} dismissable>
                {editing != null ? (
                    <>
                        {/* {JSON.stringify(data.layers[editing].style)} */}
                        {data.layers[editing].style.fill &&
                        data.layers[editing].style.fill !== 'none' ? (
                            <div>
                                Fill:
                                <ColorChange
                                    value={data.layers[editing].style.fill!}
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
                        {data.layers[editing].style.stroke ? (
                            <div>
                                Stroke:
                                <ColorChange
                                    value={
                                        data.layers[editing].style.stroke!.color
                                    }
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
                                    value={data.layers[
                                        editing
                                    ].style.stroke!.width.toString()}
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
                            </div>
                        ) : null}
                    </>
                ) : null}
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
                        style={{
                            display: 'inline-block',
                            width: 10,
                            height: 10,
                            backgroundColor:
                                layer.style.fill && layer.style.fill !== 'none'
                                    ? layer.style.fill
                                    : layer.style.stroke?.color,
                            border: '1px solid black',
                            cursor: 'pointer',
                        }}
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
        </div>
    );
}
