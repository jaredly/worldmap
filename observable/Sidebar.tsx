import * as React from 'react';
import { State } from './State';

export function Sidebar({
    data,
    setData,
}: {
    data: State;
    setData: React.Dispatch<React.SetStateAction<State>>;
}) {
    return (
        <div>
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
