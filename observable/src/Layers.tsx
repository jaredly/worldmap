import * as React from 'react';
import { Drag } from './Editor';
import { TextLayer, PathLayer, State, Mods, Text } from './State';

const PathLayerV = React.memo(({ layer }: { layer: PathLayer }) => {
    return (
        <g
            fill={layer.style.fill ?? 'none'}
            data-name={layer.name}
            stroke={layer.style.stroke?.color}
            strokeWidth={layer.style.stroke?.width}
        >
            {layer.contents.items.map((item, j) => (
                <path key={j} d={item} />
            ))}
        </g>
    );
});

const TextLayerV = ({
    layer,
    mods,
    setMods,
    drag,
    startDrag,
}: {
    layer: TextLayer;
    mods: Mods;
    setMods: (mods: Mods) => void;
    drag: Drag | null;
    startDrag: (text: Text, evt: React.MouseEvent) => void;
}) => {
    return (
        <g
            style={{
                font: `${layer.contents.font.size}px ${layer.contents.font.family}`,
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
                    item = maybeDrag(item, drag);
                    return (
                        <text
                            key={j}
                            x={item.pos.x}
                            y={item.pos.y}
                            textAnchor="middle"
                            style={{
                                transformOrigin: `${item.pos.x}px ${item.pos.y}px`,
                            }}
                            transform={`rotate(${item.rotate}) ${
                                item.scale ? `scale(${item.scale})` : ''
                            }`}
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
                    item = maybeDrag(item, drag);
                    return (
                        <text
                            key={j}
                            x={item.pos.x}
                            y={item.pos.y}
                            textAnchor="middle"
                            style={{
                                transformOrigin: `${item.pos.x}px ${item.pos.y}px`,
                            }}
                            transform={`rotate(${item.rotate}) ${
                                item.scale ? `scale(${item.scale})` : ''
                            }`}
                            onMouseDown={(e) => {
                                startDrag(item, e);
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

const maybeDrag = (item: Text, drag: Drag | null) => {
    if (drag?.text === item) {
        if (drag.mode === 'rotate') {
            return { ...item, rotate: item.rotate + (drag.s1.x - drag.s0.x) };
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
    }
    return item;
};

export const Layers = ({
    data,
    mods,
    setMods,
    drag,
    startDrag,
}: {
    data: State;
    mods: Mods;
    setMods: (mods: Mods) => void;
    drag: Drag | null;
    startDrag: (text: Text, evt: React.MouseEvent) => void;
}) => {
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
                    />
                ) : (
                    <PathLayerV key={i} layer={layer as PathLayer} />
                ),
            )}
        </>
    );
};
