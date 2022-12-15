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
