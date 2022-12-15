import * as React from 'react';
import { Layer, State } from './State';

const LayerView = React.memo(({ layer }: { layer: Layer }) => {
    if (layer.contents.type === 'Text') {
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
                >
                    {layer.contents.items.map((item, j) => (
                        <text
                            key={j}
                            x={item.pos.x}
                            y={item.pos.y}
                            textAnchor="middle"
                            transform={`rotate(${item.rotate}, ${item.pos.x}, ${item.pos.y})`}
                        >
                            {item.text}
                        </text>
                    ))}
                </g>
                <g>
                    {layer.contents.items.map((item, j) => (
                        <text
                            key={j}
                            x={item.pos.x}
                            y={item.pos.y}
                            textAnchor="middle"
                            transform={`rotate(${item.rotate}, ${item.pos.x}, ${item.pos.y})`}
                        >
                            {item.text}
                        </text>
                    ))}
                </g>
            </g>
        );
    }
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
export const Layers = React.memo(({ data }: { data: State }) => {
    return (
        <>
            {data.layers.map((layer, i) =>
                layer.visible ? <LayerView key={i} layer={layer} /> : null,
            )}
        </>
    );
});
