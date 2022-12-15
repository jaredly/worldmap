import * as React from 'react';
import PathKitInit from 'pathkit-wasm';
import { usePromise } from './app';
import localforage from 'localforage';

export const useLocalforage = <T,>(
    key: string,
    initial: T,
): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [value, setValue] = React.useState(initial);
    React.useEffect(() => {
        localforage.getItem(key).then((data) => {
            if (data) {
                setValue(data as T);
            }
        });
    }, []);
    React.useEffect(() => {
        if (value !== initial) {
            localforage.setItem(key, value);
        }
    }, [value]);
    return [value, setValue];
};

export const useLocalStorage = <T,>(
    key: string,
    initial: T,
): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [value, setValue] = React.useState((): T => {
        const data = localStorage[key];
        if (data) {
            return JSON.parse(data);
        }
        return initial;
    });
    React.useEffect(() => {
        if (value !== initial) {
            localStorage[key] = JSON.stringify(value);
        }
    }, [value]);
    return [value, setValue];
};

type Item =
    | {
          type: 'Path';
          path: string;
      }
    | {
          type: 'Text';
          text: string;
          rotate: number;
          pos: { x: number; y: number };
      };

type Layer = {
    name: string;
    items: Item[];
    visible: boolean;
    fill?: string;
    stroke?: { color: string; width: number };
    font?: string;
};
type State = {
    layers: Layer[];
};

const parseSVG = (raw: string): State => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, 'image/svg+xml');
    const svg = doc.firstElementChild as SVGSVGElement;
    const state: State = { layers: [] };
    svg.childNodes.forEach((child) => {
        const g = child as SVGGElement;
        const label = g.getAttribute('inkscape:label')!;
        const layer: Layer = {
            name: label,
            items: [],
            visible: true,
            fill: g.getAttribute('fill') ?? undefined,
            font: g.style.font,
            stroke: g.getAttribute('stroke')
                ? {
                      color: g.getAttribute('stroke')!,
                      width: +g.getAttribute('stroke-width')!,
                  }
                : undefined,
        };
        state.layers.push(layer);
        g.childNodes.forEach((child) => {
            const item = child as SVGElement;
            if (item.tagName === 'path') {
                layer.items.push({
                    type: 'Path',
                    path: item.getAttribute('d')!,
                });
            } else {
                const rotate = item
                    .getAttribute('transform')
                    ?.match(/rotate\((-?\d+(\.\d+)),/);
                if (!rotate) {
                    console.log('notate', item.getAttribute('transform'));
                    return;
                }
                layer.items.push({
                    type: 'Text',
                    text: item.textContent!,
                    rotate: +rotate[1],
                    pos: {
                        x: +item.getAttribute('x')!,
                        y: +item.getAttribute('y')!,
                    },
                });
            }
        });
    });
    return state;
};

export const Wrapper = () => {
    const [data, setData] = useLocalforage<State>('worldmap', { layers: [] });
    // const width = 1000;
    // const height = 1000;
    const width = 3500;
    const height = width * 2.15;

    const [pos, setPos] = React.useState({ x: 0, y: 0 });

    const scale = 4;

    // const dpi = 96;
    const dpi = 120;

    const sheetW = (280 / 25.4) * dpi;
    const sheetH = (200 / 25.4) * dpi;

    return (
        <div>
            <input
                type="file"
                onChange={(evt) => {
                    const file = evt.target.files![0];
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        setData(parseSVG(reader.result as string));
                    };
                    reader.readAsText(file);
                }}
            />
            Ok data
            <svg
                width={width / scale}
                height={height / scale}
                viewBox={`0 0 ${width} ${height}`}
                onMouseMove={(evt) => {
                    const box = evt.currentTarget.getBoundingClientRect();
                    setPos({
                        x: (evt.clientX - box.left) * scale,
                        y: (evt.clientY - box.top) * scale,
                    });
                }}
            >
                <Layers data={data} />
                <circle cx={pos.x} cy={pos.y} r={10} fill="red" />
                <rect
                    stroke="red"
                    strokeWidth={1}
                    fill="none"
                    x={pos.x}
                    y={pos.y}
                    width={sheetW}
                    height={sheetH}
                />
            </svg>
        </div>
    );
};

const Layers = React.memo(({ data }: { data: State }) => {
    return (
        <>
            {data.layers.map((layer, i) => (
                <g
                    key={i}
                    style={layer.font ? { font: layer.font } : undefined}
                    fill={layer.fill}
                    stroke={layer.stroke?.color}
                    strokeWidth={layer.stroke?.width}
                >
                    {layer.items.map((item, j) =>
                        item.type === 'Path' ? (
                            <path key={j} d={item.path} />
                        ) : (
                            <text
                                key={j}
                                x={item.pos.x}
                                y={item.pos.y}
                                textAnchor="middle"
                                transform={`rotate(${item.rotate}, ${item.pos.x}, ${item.pos.y})`}
                            >
                                {item.text}
                            </text>
                        ),
                    )}
                </g>
            ))}
        </>
    );
});

export const Editor = () => {
    const PathKit = usePromise(() =>
        PathKitInit({
            locateFile: (file: string) =>
                './node_modules/pathkit-wasm/bin/' + file,
        }),
    );
    if (!PathKit) {
        return <div>Loading</div>;
    }
    const width = 1000;
    const height = 1000;
    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
        ></svg>
    );
};
