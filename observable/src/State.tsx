// Ok types

import { Coord } from './star';

export type Text = {
    type: 'Text';
    text: string;
    rotate: number;
    pos: { x: number; y: number };
};

export type Style = {
    fill?: string;
    stroke?: { color: string; width: number };
};

export type Layer = {
    name: string;
    visible: boolean;
    contents:
        | {
              type: 'Text';
              font: { size: number; family: string };
              items: Text[];
          }
        | { type: 'Path'; items: string[] };
    style: Style;
};

export type State = {
    layers: Layer[];
};

export type Mods = {
    labels: {
        [key: string]: {
            rotate: number;
            pos: { x: number; y: number };
        };
    };
    paths: {
        points: Coord[];
        stroke: { color: string; width: number };
    }[];
};
