import * as shapefile from 'shapefile';
import { geoPath } from 'd3-geo';
import { geoAirocean } from 'd3-geo-polygon';
import * as React from 'react';
import PathKitInit from 'pathkit-wasm';

async function getShape(name) {
    const get = (url) => fetch(url).then((res) => res.arrayBuffer());
    const shp = await get(`./naturalearth-mirror/${name}.shp`);
    const dbf = await get(`./naturalearth-mirror/${name}.dbf`);
    const geojson = shapefile.read(shp, dbf, { encoding: 'utf-8' });
    return geojson;
}

export function usePromise<T>(promise: () => Promise<T>) {
    const [value, setValue] = React.useState<T | null>(null);
    React.useEffect(() => {
        promise().then(setValue);
    }, []);
    return value;
}

export const Map = () => {
    const width = 3500;
    const height = width * 2.15;
    const detail = false;

    const path = React.useMemo(() => {
        var projection = geoAirocean();
        var path = geoPath(projection, null);

        var angle = projection.angle();
        projection.angle(angle - 90);

        projection.fitExtent(
            [
                [0, 0],
                [width, height],
            ],
            { type: 'Sphere' },
        );
        return path;
    }, []);

    const data = usePromise(async () => ({
        PathKit: await PathKitInit({
            locateFile: (file: string) =>
                './node_modules/pathkit-wasm/bin/' + file,
        }),
        outline: await fetch('./110-bevel-outline.path').then((r) => r.text()),
        land: await getShape('110m_physical/ne_110m_land'),
        countries: await getShape('110m_cultural/ne_110m_admin_0_countries'),
        land_boundaries: await getShape(
            '110m_cultural/ne_110m_admin_0_boundary_lines_land',
        ),
        land_detail: await getShape('50m_physical/ne_50m_land'),
        lakes: await getShape('10m_physical/ne_10m_lakes'),
        rivers: await getShape(
            '10m_physical/ne_10m_rivers_lake_centerlines_scale_rank',
        ),
    }));

    if (!data) {
        return <div>Loading...</div>;
    }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            width={width}
            height={height}
        >
            <path d={data.outline} fill="none" stroke="black" strokeWidth="1" />
            {data.land.features.map((feature) => {
                return <path d={path(feature.geometry)!} fill="#eee" />;
            })}
            {data.land_boundaries.features.map((feature) => {
                return (
                    <path
                        d={path(feature.geometry)!}
                        stroke="#f00"
                        strokeWidth={0.5}
                        fill="none"
                    />
                );
            })}
            {data.land_detail.features.map((feature) => {
                return (
                    <path
                        d={path(feature.geometry)!}
                        stroke="magenta"
                        strokeWidth={0.5}
                        fill="none"
                    />
                );
            })}
            {data.rivers.features.map((feature) => {
                return (
                    <path
                        d={path(feature.geometry)!}
                        stroke="#0af"
                        strokeWidth={0.5}
                        fill="none"
                    />
                );
            })}
        </svg>
    );
};

export const App = () => {
    return <Map />;
};
