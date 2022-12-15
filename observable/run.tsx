import { createRoot } from 'react-dom/client';
// import { App } from './app';
import { Wrapper } from './Editor';
import * as React from 'react';

// @ts-ignore
const root = (window.rr =
    // @ts-ignore
    window.rr || createRoot(document.getElementById('root')!));
root.render(<Wrapper />);
