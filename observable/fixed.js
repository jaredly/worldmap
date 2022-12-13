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
    svg(width, height) {
        const s = document.createElement('div');
        s.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg"
		version="1.1" width="${width}" height="${height}"></svg>`;
        document.body.append(s);
        return s.firstElementChild;
    },
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
        group,
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
                    return pointsToPath(star({ x, y }, radius, radius / 2, 3));
                });
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

async function getShape(name) {
    const get = (url) => fetch(url).then((res) => res.arrayBuffer());
    const shp = await get(`./naturalearth-mirror/${name}.shp`);
    const dbf = await get(`./naturalearth-mirror/${name}.dbf`);
    const geojson = shapefile.read(shp, dbf, { encoding: 'utf-8' });
    return geojson;
}

const skip = 30;

const inversePoint = () => {
    const p = geoAirocean();
    return p.invert(p([0, 0]));
};

// function consolidate_features(features) {
//     return features.map((f) => {
//         if (f.geometry.type === 'MultiLineString') {
//             return {
//                 ...f,
//                 geometry: {
//                     ...f.geometry,
//                     coordinates: f.geometry.coordinates.map((line) => {
//                         const shorter = [];
//                         for (var i = 0; i < line.length - 1; i += skip) {
//                             shorter.push(line[i]);
//                         }
//                         shorter.push(line[line.length - 1]);
//                         return shorter;
//                     }),
//                 },
//             };
//         } else {
//             return f;
//         }
//     });
// }

// const large_countries = [
//     'Canada',
//     'Brazil',
//     'Russia',
//     'China',
//     'India',
//     'Argentina',
//     'Australia',
// ];

// const detailed_provinces = await getShape(
//     '10m_cultural/ne_10m_admin_1_states_provinces_lines',
// );

// const show_provinces = {
//     ...detailed_provinces,
//     features: consolidate_features(
//         detailed_provinces.features.filter((f) =>
//             large_countries.includes(f.properties.adm0_name),
//         ),
//     ),
// };

const output = async () => {
    var huge = true;
    var width = 3500;
    var height = width * 2.15;
    const detail = false;

    var render = renderer(width, height, 'svg');

    var projection = geoAirocean();
    var path = geoPath(projection, render.context);

    var angle = projection.angle();
    projection.angle(angle - 90);

    projection.fitExtent(
        [
            [0, 0],
            [width, height],
        ],
        { type: 'Sphere' },
    );

    const names = await getShape('110m_cultural/ne_110m_populated_places');

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

    render
        .group('Border', { stroke: 'red', strokeWidth: 3 })
        .selectAll('path')
        .data([await fetch('./110-bevel-outline.path').then((r) => r.text())])
        .enter()
        .append('path')
        .attr('d', (d) => d);

    render.features(
        path,
        'Land',
        { fill: '#fafafa', stroke: '#777', strokeWidth: 1 },
        await getShape('110m_physical/ne_110m_land'),
    );

    render.features(
        path,
        'Countries',
        { fill: '#aaf', stroke: 'rgba(0, 0, 255, 0.3)', strokeWidth: 1 },
        await getShape('110m_cultural/ne_110m_admin_0_countries'),
    );

    if (detail) {
        render.features(
            path,
            'Land boundaries',
            { stroke: 'red', strokeWidth: 0.5 },
            await getShape('110m_cultural/ne_110m_admin_0_boundary_lines_land'),
        );

        render.features(
            path,
            'Land detail',
            { fill: 'none', stroke: 'magenta', strokeWidth: 0.5 },
            await getShape('50m_physical/ne_50m_land'),
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
            await getShape(
                '10m_physical/ne_10m_rivers_lake_centerlines_scale_rank',
            ),
        );
        render.features(
            path,
            'Rivers',
            { stroke: '#000', strokeWidth: 0.5 },
            await getShape(
                '50m_physical/ne_50m_rivers_lake_centerlines_scale_rank',
            ),
        );

        render.circles(
            path,
            '1mil',
            2,
            { fill: 'red', strokeWidth: 0.5, stroke: 'black' },
            names.features.filter(
                (f) =>
                    f.properties.POP_OTHER > 1 * 1000 * 1000 &&
                    f.properties.POP_OTHER < 5 * 1000 * 1000,
            ),
        );
        render.circles(
            path,
            '5mil',
            3,
            { fill: 'magenta', strokeWidth: 0.5, stroke: 'black' },
            names.features.filter(
                (f) => f.properties.POP_OTHER >= 5 * 1000 * 1000,
            ),
        );

        render.features(
            path,
            'States',
            { stroke: '#fa0', strokeWidth: 0.5 },
            await getShape(
                '50m_cultural/ne_50m_admin_1_states_provinces_lines',
            ),
        );
    }

    return render.node();
};

output().then((node) => document.body.append(node));
