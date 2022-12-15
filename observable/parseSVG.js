
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
            style: {
                fill: g.getAttribute('fill') ?? undefined,
                font: {
                    size: +g.style.fontSize,
                    family: g.style.fontFamily,
                },
                stroke: g.getAttribute('stroke')
                    ? {
                          color: g.getAttribute('stroke')!,
                          width: +g.getAttribute('stroke-width')!,
                      }
                    : undefined,
            },
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
