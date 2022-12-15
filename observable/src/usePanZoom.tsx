import * as React from 'react';

export const usePanZoom = (width: number, height: number) => {
    type Pz = { x: number; y: number; scale: number };
    const [pz, setPz] = React.useState<Pz>({
        // Top left, in world coordinates
        x: 0,
        y: 0,
        // world * scale = screen
        scale: 0.2,
    });

    const toScreen = (x: number, y: number, pz: Pz) => {
        return {
            x: (x - pz.x) * pz.scale,
            y: (y - pz.y) * pz.scale,
        };
    };
    const fromScreen = (x: number, y: number, pz: Pz) => {
        return {
            x: x / pz.scale + pz.x,
            y: y / pz.scale + pz.y,
        };
    };

    const tl = fromScreen(0, 0, pz);
    const br = fromScreen(width, height, pz);

    const ref = React.useRef<SVGSVGElement>(null);

    React.useEffect(() => {
        if (ref.current) {
            const fn = (evt) => evt.preventDefault();
            ref.current.addEventListener('wheel', fn, { passive: false });
            return () => ref.current?.removeEventListener('wheel', fn);
        }
    }, []);

    return {
        toScreen: (x: number, y: number) => toScreen(x, y, pz),
        fromScreen: (x: number, y: number) => fromScreen(x, y, pz),
        tl,
        props: {
            ref,
            // viewBox: `0 0 ${width} ${height}`,
            // viewBox: `${pz.x} ${pz.y} ${width / pz.scale} ${height / pz.scale}`,
            viewBox: `0 0 ${width / pz.scale} ${height / pz.scale}`,
            onWheel: React.useCallback(
                (evt: React.WheelEvent<SVGSVGElement>) => {
                    if (evt.shiftKey) {
                        const box = evt.currentTarget.getBoundingClientRect();
                        const sx = evt.clientX - box.left;
                        const sy = evt.clientY - box.top;
                        const deltaY = evt.deltaY;
                        setPz((pz) => {
                            const nz = pz.scale * (1 - deltaY / 1000);
                            const world = fromScreen(sx, sy, pz);
                            const p2 = fromScreen(sx, sy, { ...pz, scale: nz });
                            const dx = world.x - p2.x;
                            const dy = world.y - p2.y;
                            return {
                                x: pz.x + dx,
                                y: pz.y + dy,
                                scale: nz,
                            };
                        });
                    } else {
                        setPz((pz) => ({
                            x: pz.x + evt.deltaX / pz.scale,
                            y: pz.y + evt.deltaY / pz.scale,
                            scale: pz.scale,
                        }));
                    }
                },
                [width, height],
            ),
        },
    };
};
