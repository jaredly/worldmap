import * as d3 from 'd3';
import * as topojson from 'topojson';
import * as shapefile from 'shapefile';
import { geoPath } from 'd3-geo';
import { geoAirocean } from 'd3-geo-polygon';
import star, { pointsToPath } from './star';

const DOM = {
    element(n) {
        return document.createElement(n);
    },
    context2d(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        document.body.append(canvas);
        return canvas.getContext('2d');
    },
    svg(width, height) {
        const s = document.createElement('div');
        s.innerHTML = `<svg
		xmlns="http://www.w3.org/2000/svg"
		version="1.1"
		width="${width}"
		height="${height}"
		></svg>`;
        document.body.append(s);
        return s.firstElementChild;
    },
};

const output = async () => {
    var huge = true;
    var width = 3500;
    var height = huge ? width * 2.15 : width / 2;

    var render = renderer(width, height, 'svg');

    var projection = geoAirocean();
    var path = geoPath(projection, render.context);

    var angle = projection.angle();
    if (huge) projection.angle(angle - 90);

    projection.fitExtent(
        [
            [0, 0],
            [width, height],
        ],
        { type: 'Sphere' },
    );

    // render.features(
    //     path,
    //     'Land',
    //     { fill: '#777' },
    //     await getShape('110m_physical/ne_110m_land'),
    // );
    // render.features(
    //     path,
    //     'Land',
    //     { fill: '#eee' },
    //     await getShape('50m_physical/ne_50m_land'),
    // );

    render.features(
        path,
        'Land',
        { fill: '#eee', stroke: 'magenta', strokeWidth: 0.5 },
        await getShape('50m_cultural/ne_50m_admin_0_countries'),
    );

    render.features(
        path,
        'Lakes',
        { fill: 'black' },
        await getShape('10m_physical/ne_10m_lakes'),
    );
    render.features(
        path,
        'Rivers',
        { stroke: '#0af', strokeWidth: 0.5 },
        await getLocalShape(
            // hmm should I get those locally?
            '10m_physical/ne_10m_rivers_lake_centerlines_scale_rank',
        ),
    );
    render.features(
        path,
        'Rivers',
        { stroke: '#000', strokeWidth: 0.5 },
        await getShape(
            // hmm should I get those locally?
            '50m_physical/ne_50m_rivers_lake_centerlines_scale_rank',
        ),
    );

    // render.features(
    //     path,
    //     'Countries',
    //     { stroke: '#f00', strokeWidth: 0.5 },
    //     await getShape('110m_cultural/ne_110m_admin_0_boundary_lines_land'),
    // );

    render.circles(
        path,
        '1mil',
        2,
        { fill: 'red', strokeWidth: 0.5, stroke: 'black' },
        names.features.filter((f) => f.properties.POP_OTHER > 1 * 1000 * 1000),
    );
    render.circles(
        path,
        '5mil',
        3,
        { fill: 'magenta', strokeWidth: 0.5, stroke: 'black' },
        names.features.filter((f) => f.properties.POP_OTHER > 5 * 1000 * 1000),
    );

    render.labels(
        path,
        projection,
        'Countries',
        8,
        { fill: '#aaa', stroke: 'white', strokeWidth: 2 },
        await getShape('110m_cultural/ne_110m_admin_0_countries'),
    );

    render.features(
        path,
        'US',
        { stroke: '#fa0', strokeWidth: 0.5 },
        await getShape('50m_cultural/ne_50m_admin_1_states_provinces_lines'),
    );

    // render.features(
    //     path,
    //     'US',
    //     { stroke: 'magenta', strokeWidth: 0.5 },
    //     await getShape('10m_cultural/ne_10m_railroads'),
    // );

    // render.features(
    //     path,
    //     'US',
    //     { stroke: '#fa0', strokeWidth: 0.5 },
    //     await getShape('110m_cultural/ne_110m_admin_1_states_provinces_lines'),
    // );

    return render.node();
};

function renderer(width, height, mode) {
    const svg = d3
        .select(DOM.svg(width, height))
        .attr('title', 'test2')
        .attr('version', 1.1)
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .attr('xmlns:inkscape', 'http://www.inkscape.org/namespaces/inkscape');
    const group = (name, style) => {
        var g = svg
            .append('g')
            .attr(':inkscape:groupmode', 'layer')
            .attr(':inkscape:label', name)
            .attr('fill', style.fill ? style.fill : 'none')
            .attr('stroke', style.stroke ? style.stroke : 'none');
        if (style.strokeWidth) return g.attr('stroke-width', style.strokeWidth);
        return g;
    };
    return {
        context: null,
        svg,
        features: (path, title, style, item) => {
            group(title, style)
                .selectAll('path')
                .data(item.features)
                .enter()
                .append('path')
                .attr('stroke-width', (d) => d.properties.strokeweig)
                .attr('d', (d) => path(d.geometry));
        },
        circles: (path, title, radius, style, features) => {
            group(title, style)
                .selectAll('path')
                .data(features)
                .enter()
                .append('path')
                .attr('d', (d) => {
                    const [x, y] = path.centroid(d.geometry);
                    return pointsToPath(star({ x, y }, radius, radius / 2, 5));
                });
            // .attr('transform', (d) => {
            //     return `translate(${x}, ${y})`;
            // });
        },
        labels: (
            path,
            projection,
            title,
            fontSize,
            { fill, stroke, strokeWidth, above },
            item,
        ) => {
            const ty = above ? -fontSize / 2 : fontSize / 2;
            const data = item.features.map((f) => {
                const pos = path.centroid(mainGeometry(path, f.geometry));
                const angle =
                    ((labelAngle(projection, pos) - Math.PI / 2) * 180) /
                    Math.PI;
                return { ...f, center: [pos[0], pos[1]], angle };
            });
            if (stroke) {
                group(title + '_shadow', { fill, stroke, strokeWidth })
                    .attr('style', `font: ${fontSize}px sans-serif`)
                    .selectAll('text')
                    .data(data)
                    .enter()
                    .append('text')
                    .text((d) => d.properties.NAME)
                    .attr('text-anchor', 'middle')
                    .attr(
                        'transform',
                        (d) =>
                            `rotate(${d.angle}, ${d.center[0]}, ${d.center[1]})`,
                    )
                    .attr('dy', ty)
                    .attr('x', (d) => d.center[0])
                    .attr('y', (d) => d.center[1]);
            }
            group(title, { fill })
                .attr('style', `font: ${fontSize}px sans-serif`)
                .selectAll('text')
                .data(data)
                .enter()
                .append('text')
                .text((d) => d.properties.NAME)
                .attr('text-anchor', 'middle')
                .attr(
                    'transform',
                    (d) => `rotate(${d.angle}, ${d.center[0]}, ${d.center[1]})`,
                )
                .attr('dy', ty)
                .attr('x', (d) => d.center[0])
                .attr('y', (d) => d.center[1]);
        },
        node: () => {
            var node = svg.node();
            var source = node.outerHTML;
            source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

            var blob = new Blob([source], { type: 'image/svg+xml' });
            var url = URL.createObjectURL(blob);
            var link = DOM.element('a');
            link.href = url;
            link.textContent = 'Download now';
            link.target = '_blank';
            link.download = 'WorldMap.svg';
            var div = DOM.element('div');
            div.appendChild(node);
            div.appendChild(link);
            return div;
        },
    };
}

function _renderCanvas() {
    return (context) => (path, title, fill, stroke, strokeWidth, item) => {
        if (fill) {
            context.beginPath();
            path(item);
            context.fillStyle = fill;
            context.fill();
        }
        if (stroke) {
            if (strokeWidth) context.lineWidth = strokeWidth;
            context.beginPath();
            path(item);
            context.strokeStyle = stroke;
            context.stroke();
        }
    };
}

function mainGeometry(path, geometry) {
    if (geometry.type === 'MultiPolygon') {
        return geometry.coordinates
            .map((poly) => ({ type: 'Polygon', coordinates: poly }))
            .map((geo) => ({ area: path.area(geo), geo }))
            .sort((a, b) => b.area - a.area)[0].geo;
    } else {
        return geometry;
    }
}

function labelAngle(projection, [x, y]) {
    const [a, b] = projection.invert([x, y]);
    const [x2, y2] = projection([a, b - 1]);
    return Math.atan2(y2 - y, x2 - x);
}

function borderedCenteredText(context, text, x, y) {
    const { width } = context.measureText(text);
    context.strokeText(text, x - width / 2, y);
    context.fillText(text, x - width / 2, y);
}

function labelPoints(context, projection, path, fontSize, above, points) {
    points.forEach((point) => {
        const [x, y] = path.centroid(mainGeometry(path, point.geometry));
        const angle = labelAngle(projection, [x, y]);

        context.save();
        context.translate(x, y);
        context.rotate(angle - Math.PI / 2);

        context.font = `${fontSize}px sans-serif`;
        const ty = above ? -fontSize / 2 : fontSize / 2;
        const { width } = context.measureText(point.label);
        context.strokeText(point.label, -width / 2, ty);
        context.fillText(point.label, -width / 2, ty);

        context.restore();
    });
}

function circle(context, [x, y], rad) {
    context.moveTo(x + rad, y);
    context.arc(x, y, rad, 0, Math.PI * 2);
}

// async function getShape(name) {
//     const get = (url) => fetch(url).then((res) => res.arrayBuffer());
//     const shp = await get(
//         `https://cdn.rawgit.com/jaredly/naturalearth-mirror/master/${name}.shp`,
//     );
//     const dbf = await get(
//         `https://cdn.rawgit.com/jaredly/naturalearth-mirror/master/${name}.dbf`,
//     );
//     const geojson = shapefile.read(shp, dbf, { encoding: 'utf-8' });
//     return geojson;
// }

async function getLocalShape(name) {
    const get = (url) => fetch(url).then((res) => res.arrayBuffer());
    const shp = await get(`./naturalearth-mirror/${name}.shp`);
    const dbf = await get(`./naturalearth-mirror/${name}.dbf`);
    const geojson = shapefile.read(shp, dbf, { encoding: 'utf-8' });
    return geojson;
}

const getShape = getLocalShape;

function consolidate_features(features) {
    return features.map((f) => {
        if (f.geometry.type === 'MultiLineString') {
            return {
                ...f,
                geometry: {
                    ...f.geometry,
                    coordinates: f.geometry.coordinates.map((line) => {
                        const shorter = [];
                        for (var i = 0; i < line.length - 1; i += skip) {
                            shorter.push(line[i]);
                        }
                        shorter.push(line[line.length - 1]);
                        return shorter;
                    }),
                },
            };
        } else {
            return f;
        }
    });
}

const chart = async () => {
    var width = 500;
    var height = 200;
    var data = names.features.map((f) => f.properties.LABELRANK);
    const svg = d3.select(DOM.svg(width, height));
    var margin = { top: 20, right: 20, bottom: 30, left: 40 };
    var x = (x = d3
        .scaleLinear()
        .domain(d3.extent(data))
        .nice()
        .range([margin.left, width - margin.right]));
    var bins = d3.histogram().domain(x.domain()).thresholds(x.ticks(40))(data);
    var y = d3
        .scaleLinear()
        .domain([0, d3.max(bins, (d) => d.length)])
        .nice()
        .range([height - margin.bottom, margin.top]);
    const bar = svg
        .append('g')
        .attr('fill', 'steelblue')
        .selectAll('rect')
        .data(bins)
        .enter()
        .append('rect')
        .attr('x', (d) => x(d.x0) + 1)
        .attr('width', (d) => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr('y', (d) => y(d.length))
        .attr('height', (d) => y(0) - y(d.length));

    var yAxis = (g) =>
        g
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .call((g) => g.select('.domain').remove())
            .call((g) =>
                g
                    .select('.tick:last-of-type text')
                    .clone()
                    .attr('x', 4)
                    .attr('text-anchor', 'start')
                    .attr('font-weight', 'bold')
                    .text(data.y),
            );

    var xAxis = (g) =>
        g
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).tickSizeOuter(1))
            .call((g) =>
                g
                    .append('text')
                    .attr('x', width - margin.right)
                    .attr('y', -4)
                    .attr('fill', '#000')
                    .attr('font-weight', 'bold')
                    .attr('text-anchor', 'end')
                    .text(data.x),
            );

    svg.append('g').call(xAxis);

    svg.append('g').call(yAxis);

    return svg.node();
};

const skip = 30;

const large_countries = [
    'Canada',
    'Brazil',
    'Russia',
    'China',
    'India',
    'Argentina',
    'Australia',
];

console.log('getting shapes');
const names = await getShape('110m_cultural/ne_110m_populated_places');
const detailed_provinces = await getShape(
    '10m_cultural/ne_10m_admin_1_states_provinces_lines',
);
console.log('got shapes');

// const projection = geoAirocean().fitExtent(
//     [
//         [0, 0],
//         [500, 500],
//     ],
//     { type: 'Sphere' },
// );
const inversePoint = () => {
    const p = geoAirocean();
    return p.invert(p([0, 0]));
};

const show_provinces = {
    ...detailed_provinces,
    features: consolidate_features(
        detailed_provinces.features.filter((f) =>
            large_countries.includes(f.properties.adm0_name),
        ),
    ),
};

console.log('outing the put?');
output().then((node) => document.body.append(node));
