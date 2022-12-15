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
    stroke?: { color: string; width: number };
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

export type PathLayer = Layer<{ type: 'Path'; items: string[] }>;
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
    paths: {
        points: Coord[];
        stroke: { color: string; width: number };
    }[];
};
