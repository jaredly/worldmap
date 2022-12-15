import * as React from 'react';
import PathKitInit from 'pathkit-wasm';
import { usePromise } from './app';
import localforage from 'localforage';
import { output } from './fixed';
import { usePanZoom } from './usePanZoom';
import { Layers } from './Layers';
import { Sidebar } from './Sidebar';
import { State } from './State';

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

export const Wrapper = () => {
    const [data, setData] = useLocalforage<State>('worldmap', { layers: [] });
    // const width = 1000;
    // const height = 1000;
    const width = 1000;
    // const height = width * 2.15;
    const height = 1000;

    const [pos, setPos] = React.useState({ x: 0, y: 0 });

    // const scale = 4;

    // const dpi = 96;
    const dpi = 120;

    const sheetW = (280 / 25.4) * dpi;
    const sheetH = (200 / 25.4) * dpi;
    const pz = usePanZoom(width, height);

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
                        setPos(
                            pz.fromScreen(
                                evt.clientX - box.left,
                                evt.clientY - box.top,
                            ),
                        );
                    }}
                    {...pz.props}
                >
                    <g transform={`translate(${-pz.tl.x}, ${-pz.tl.y})`}>
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
                    </g>
                </svg>
                <Sidebar data={data} setData={setData} />
            </div>
        </div>
    );
};
