import * as React from 'react';
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
    bounce: number,
): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [value, setValue] = React.useState((): T => {
        const data = localStorage[key];
        if (data) {
            return JSON.parse(data);
        }
        return initial;
    });
    const bound = React.useMemo(
        () =>
            debounce((value) => {
                console.log('ok');
                localStorage[key] = JSON.stringify(value);
            }, bounce),
        [],
    );
    React.useEffect(() => {
        if (value !== initial) {
            bound(value);
        }
    }, [value]);
    return [value, setValue];
};

const debounce = (fn, num) => {
    let last = 0;
    let tid = null as null | NodeJS.Timeout;
    return (...args) => {
        const now = Date.now();
        clearTimeout(tid!);
        if (now - last > num) {
            last = now;
            fn(...args);
        } else {
            tid = setTimeout(() => {
                last = Date.now();
                fn(...args);
            }, num);
        }
    };
};
