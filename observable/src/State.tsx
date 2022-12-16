// Ok types

import { Coord } from './star';

export type Text = {
    type: 'Text';
    text: string;
    rotate: number;
    pos: { x: number; y: number };
    scale?: number;
};

export type Style = {
    fill?: string;
    stroke?: { color: string; width: number; dotted?: boolean };
};

export type Layer<Contents> = {
    name: string;
    visible: boolean;
    contents: Contents;
    style: Style;
};

export type TextLayer = Layer<{
    type: 'Text';
    font: { size: number; family: string };
    items: Text[];
}>;

export type PathLayer = Layer<{
    type: 'Path';
    items: string[];
    vector?: boolean;
}>;

export type EitherLayer = TextLayer | PathLayer;

export type State = {
    layers: (TextLayer | PathLayer)[];
};

export type Mods = {
    labels: {
        [key: string]: {
            rotate: number;
            pos: { x: number; y: number };
            scale: number;
        };
    };
    layers: {
        name: string;
        style: Style;
        paths: Coord[][];
        moved: {
            [layerName: string]: {
                [pathIndex: number]: boolean;
            };
        };
    }[];
};
