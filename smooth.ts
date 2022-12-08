import shapefile from 'shapefile';
import proj4 from 'proj4';
import { geoAirocean } from 'd3-geo-polygon';
import { existsSync, fstat } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { geoPath } from 'd3-geo';
import PathKitInit, { Path, PathKit } from 'pathkit-wasm';

const getShape = async (name) => {
    const shp = await readFile(`./observable/naturalearth-mirror/${name}.shp`);
    const dbf = await readFile(`./observable/naturalearth-mirror/${name}.dbf`);
    const geojson = shapefile.read(shp, dbf, { encoding: 'utf-8' });
    return geojson;
};

const loadOrCompute = async (
    pk: PathKit,
    fileName: string,
    fn: () => Promise<Path> | Path,
): Promise<Path> => {
    if (existsSync(fileName)) {
        console.log(`Found ${fileName}`);
        const text = await readFile(fileName, 'utf8');
        const p = pk.FromSVGString(text);
        p.setFillType(pk.FillType.EVENODD);
        return p;
    }
    console.log(`Computing ${fileName}`);
    const p = await fn();
    console.log(`Finished computing ${fileName}`);
    await writeFile(fileName, p.toSVGString());
    return p;
};

const run = async () => {
    const projection = geoAirocean();

    var huge = true;
    var width = 3500;
    var height = huge ? width * 2.15 : width / 2;

    var angle = projection.angle();
    if (huge) projection.angle(angle - 90);
    projection.fitExtent(
        [
            [0, 0],
            [width, height],
        ],
        { type: 'Sphere' },
    );

    const PathKit = await PathKitInit({
        locateFile: (file: string) => './node_modules/pathkit-wasm/bin/' + file,
    });

    if (true) {
        const shape = await getShape('50m_physical/ne_50m_land');
        const path = geoPath(projection);
        const alls = shape.features.map((item) => {
            const pk = PathKit.FromSVGString(path(item.geometry));
            return pk.toCmds();
        });

        await writeFile('./separate.cmds', JSON.stringify(alls));
        fail;
    }

    const p = await loadOrCompute(PathKit, './ok.path', async () => {
        // const shape = await getShape('50m_cultural/ne_50m_admin_0_countries');
        const shape = await getShape('50m_physical/ne_50m_land');
        const path = geoPath(projection);
        const paths: string[] = [];
        shape.features.forEach((item) => {
            paths.push(path(item.geometry));
        });

        console.log('ok pk');
        const p = PathKit.NewPath();
        paths.forEach((d) => {
            const p2 = PathKit.FromSVGString(d);
            p.op(p2, PathKit.PathOp.UNION);
            p2.delete();
        });

        return p;
    });

    await writeFile('./ok.cmds', JSON.stringify(p.toCmds()));
    fail;

    const size = 10;
    const join = PathKit.StrokeJoin.BEVEL;
    const joinName = 'bevel';
    // const join = PathKit.StrokeJoin.MITER
    // const join = PathKit.StrokeJoin.ROUND

    // console.log('added');
    // console.log('a');
    // outline
    //     .stroke({
    //         width: size,
    //         join,
    //     })
    //     .simplify()
    //     .op(p, PathKit.PathOp.UNION)
    //     .simplify();
    // console.log('b');

    const back = await loadOrCompute(
        PathKit,
        `smoothed-${size}-${joinName}.path`,
        async () => {
            const outline = await loadOrCompute(
                PathKit,
                `outline-${size}-${joinName}.path`,
                async () => {
                    const outline2 = await loadOrCompute(
                        PathKit,
                        `outline2-${size}-${joinName}.path`,
                        async () => {
                            const outline1 = await loadOrCompute(
                                PathKit,
                                `outline1-${size}-${joinName}.path`,
                                async () => {
                                    const outline = p.copy();
                                    outline.stroke({
                                        width: size,
                                        join,
                                    });
                                    return outline;
                                },
                            );

                            outline1.simplify();
                            return outline1;
                        },
                    );

                    outline2.op(p, PathKit.PathOp.UNION).simplify();
                    return outline2;
                },
            );

            const back = outline.copy();
            back.stroke({
                width: size,
                join,
            });
            console.log('c');
            back.op(outline, PathKit.PathOp.REVERSE_DIFFERENCE).op(
                p,
                PathKit.PathOp.UNION,
            );
            return back;
        },
    );

    const file = `
        <svg
		xmlns="http://www.w3.org/2000/svg"
		version="1.1"
		width="${width}"
		height="${height}"
		>
    ${pathit(back, 'black')}
    ${pathit(p, 'red')}
		</svg>
	`;
    // ${pathit(p, 'red')}
    // ${paths
    //     .map(
    //         (d) =>
    //             `<path d="${d}" fill="#aaa" stroke="magenta" stroke-width="0.5" />`,
    //     )
    //     .join('\n')}
    await writeFile(`out-${size}-${joinName}.svg`, file);
};

run();
function pathit(final: Path, color: string) {
    return `<path d="${final.toSVGString()}" fill-rule="${final.getFillTypeString()}" fill="${color}" stroke="magenta" stroke-width="0.5" />`;
}
