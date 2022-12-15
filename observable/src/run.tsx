import { createRoot } from 'react-dom/client';
// import { App } from './app';
import { Wrapper } from './Editor';
import * as React from 'react';
import 'primereact/resources/themes/bootstrap4-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

// @ts-ignore
const root = (window.rr =
    // @ts-ignore
    window.rr || createRoot(document.getElementById('root')!));
root.render(<Wrapper />);
