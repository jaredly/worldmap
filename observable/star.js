const push = ({ x, y }, t, m) => ({
    x: x + Math.cos(t) * m,
    y: y + Math.sin(t) * m,
});

const star = ({ x, y }, r1, r2, n) => {
    const points = [];
    const t = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
        points.push(push({ x, y }, t * i, r1));
        points.push(push({ x, y }, t * i + t / 2, r2));
    }
    return points;
};

export const pointsToPath = (points) =>
    'M' + points.map(({ x, y }) => `${x},${y}`).join(' L') + ' Z';

export default star;
