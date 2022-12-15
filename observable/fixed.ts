import * as d3 from 'd3';
import * as topojson from 'topojson';
import * as shapefile from 'shapefile';
import { GeoPath, geoPath } from 'd3-geo';
import { geoAirocean } from 'd3-geo-polygon';
import star, { pointsToPath } from './star';
import { State, Style, Text } from './State';
import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

const DOM = {
    element(n) {
        return document.createElement(n);
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

function renderer(width, height, mode) {
    if (mode === 'svg') {
        return svgRenderer(width, height);
    }
    return dataRenderer();
}

const dataRenderer = () => {
    const state: State = { layers: [] };

    return {
        context: null,
        rawPath: (name: string, style: Style, paths: string[]) => {
            state.layers.push({
                name,
                style,
                contents: {
                    type: 'Path',
                    items: paths,
                },
                visible: true,
            });
        },
        features: (
            path: GeoPath,
            name: string,
            style: Style,
            item: FeatureCollection<Geometry, GeoJsonProperties>,
        ) => {
            state.layers.push({
                name,
                style,
                visible: true,
                contents: {
                    type: 'Path',
                    items: item.features.map((f) => path(f.geometry)),
                },
            });
        },
        circles: (
            path: GeoPath,
            projection,
            name: string,
            radius: number,
            style: Style,
            features: FeatureCollection<
                Geometry,
                GeoJsonProperties
            >['features'],
        ) => {
            state.layers.push({
                name,
                style,
                visible: true,
                contents: {
                    type: 'Path',
                    items: features.map((f) => {
                        const [x, y] = path.centroid(f.geometry);
                        return pointsToPath(
                            star(
                                { x, y },
                                radius,
                                radius / 2,
                                5,
                                labelAngle(projection, [x, y]) + Math.PI,
                            ),
                        );
                    }),
                },
            });
        },
        node: () => state,
        labels: (
            path: GeoPath,
            projection,
            name: string,
            fontSize: number,
            style: Style,
            item: FeatureCollection<Geometry, GeoJsonProperties>,
        ) => {
            const items: Text[] = item.features.map((f) => {
                const pos = path.centroid(mainGeometry(path, f.geometry));
                const angle =
                    ((labelAngle(projection, pos) - Math.PI / 2) * 180) /
                    Math.PI;
                return {
                    type: 'Text',
                    text: f.properties.NAME,
                    pos: { x: pos[0], y: pos[1] },
                    rotate: angle,
                };
            });
            state.layers.push({
                name,
                style: {
                    ...style,
                },
                visible: true,
                contents: {
                    type: 'Text',
                    font: { size: fontSize, family: 'sans-serif' },
                    items,
                },
            });
        },
    };
};

function svgRenderer(width: number, height: number) {
    const svg = d3
        .select(DOM.svg(width, height))
        .attr('title', 'test2')
        .attr('version', 1.1)
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .attr('xmlns:inkscape', 'http://www.inkscape.org/namespaces/inkscape');
    const group = (name, style: Style) => {
        var g = svg
            .append('g')
            .attr(':inkscape:groupmode', 'layer')
            .attr(':inkscape:label', name)
            .attr('fill', style.fill ? style.fill : 'none')
            .attr('stroke', style.stroke ? style.stroke.color : 'none');
        if (style.stroke) return g.attr('stroke-width', style.stroke.width);
        return g;
    };
    return {
        context: null,
        svg,
        group,
        rawPath: (title: string, style: Style, paths: string[]) => {
            group(title, style)
                .selectAll('path')
                .data(paths)
                .enter()
                .append('path')
                .attr('d', (d) => d);
        },
        features: (path, title: string, style: Style, item) => {
            group(title, style)
                .selectAll('path')
                .data(item.features)
                .enter()
                .append('path')
                .attr('stroke-width', (d) => d.properties.strokeweig)
                .attr('d', (d) => path(d.geometry));
        },
        circles: (
            path,
            projection,
            title: string,
            radius: number,
            style: Style,
            features,
        ) => {
            group(title, style)
                .selectAll('path')
                .data(features)
                .enter()
                .append('path')
                .attr('d', (d) => {
                    const [x, y] = path.centroid(d.geometry);
                    return pointsToPath(
                        star(
                            { x, y },
                            radius,
                            radius / 2,
                            5,
                            labelAngle(projection, [x, y]) + Math.PI,
                        ),
                    );
                });
        },
        labels: (path, projection, title, fontSize, style, item) => {
            const ty = fontSize / 2;
            const data = item.features.map((f) => {
                const pos = path.centroid(mainGeometry(path, f.geometry));
                const angle =
                    ((labelAngle(projection, pos) - Math.PI / 2) * 180) /
                    Math.PI;
                return { ...f, center: [pos[0], pos[1]], angle };
            });
            if (style.stroke) {
                group(title + '_shadow', {
                    fill: style.fill,
                    stroke: style.stroke,
                })
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
            group(title, { fill: style.fill })
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

export const output = async (kind) => {
    var width = 3500;
    var height = width * 2.15;
    const detail = true;

    var render = renderer(width, height, kind);

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
    // console.log('names', names);
    // console.log(
    //     'more',
    //     (window.morenames = await getShape(
    //         '50m_cultural/ne_50m_populated_places',
    //     )),
    // );

    render.rawPath('Border', { stroke: { color: 'red', width: 3 } }, [
        await fetch('./110-bevel-outline.path').then((r) => r.text()),
    ]);

    render.features(
        path,
        'Land',
        { fill: '#fafafa', stroke: { color: '#777', width: 1 } },
        await getShape('110m_physical/ne_110m_land'),
    );

    render.features(
        path,
        'Countries Outlines',
        { fill: '#aaf', stroke: { color: 'rgba(0, 0, 255, 0.3)', width: 1 } },
        await getShape('110m_cultural/ne_110m_admin_0_countries'),
    );

    if (detail) {
        render.features(
            path,
            'Country boundaries',
            { stroke: { color: 'red', width: 0.5 } },
            await getShape('110m_cultural/ne_110m_admin_0_boundary_lines_land'),
        );

        // render.features(
        //     path,
        //     'Coastline 10m',
        //     { fill: 'none', stroke: { color: 'magenta', width: 0.5 } },
        //     await getShape('10m_physical/ne_10m_land'),
        // );

        render.features(
            path,
            'Coastline 50m',
            { fill: 'none', stroke: { color: 'magenta', width: 0.5 } },
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
            'Rivers 10m',
            { stroke: { color: '#0af', width: 0.5 } },
            await getShape(
                '10m_physical/ne_10m_rivers_lake_centerlines_scale_rank',
            ),
        );

        render.features(
            path,
            'Rivers 50m',
            { stroke: { color: '#0af', width: 0.5 } },
            await getShape(
                '50m_physical/ne_50m_rivers_lake_centerlines_scale_rank',
            ),
        );

        render.circles(
            path,
            projection,
            'Capitals',
            3,
            { fill: 'magenta' },
            names.features.filter(
                (f) => f.properties!.FEATURECLA === 'Admin-0 capital',
            ),
        );

        render.features(
            path,
            'States lines',
            { stroke: { color: '#fa0', width: 0.5 } },
            await getShape(
                '50m_cultural/ne_50m_admin_1_states_provinces_lines',
            ),
        );

        render.labels(
            path,
            projection,
            'Country Names',
            8,
            { fill: '#aaa', stroke: { color: 'white', width: 2 } },
            await getShape('110m_cultural/ne_110m_admin_0_countries'),
        );
    }

    return render.node();
};

export default () => output('svg').then((node) => document.body.append(node));
