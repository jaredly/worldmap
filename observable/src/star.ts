export type Coord = { x: number; y: number };
const push = ({ x, y }: Coord, t: number, m: number): Coord => ({
    x: x + Math.cos(t) * m,
    y: y + Math.sin(t) * m,
});

const star = (
    { x, y }: Coord,
    r1: number,
    r2: number,
    n: number,
    t0: number,
) => {
    const points: Coord[] = [];
    const t = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
        points.push(push({ x, y }, t0 + t * i, r1));
        points.push(push({ x, y }, t0 + t * i + t / 2, r2));
    }
    return points;
};

export const pointsToPath = (points: Coord[]) =>
    'M' + points.map(({ x, y }) => `${x},${y}`).join(' L') + ' Z';

export default star;
