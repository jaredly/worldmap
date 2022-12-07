function _1(md){return(
md`# Airocean Map for Laser Cutting`
)}

function _2(md){return(
md`-----------
_Play zone_`
)}

function _V(renderer,d3,land,lakes,lakes_50,rivers_50,rivers,country_dividers,names,countries,united_states)
{
  var huge = false
  var width = 3500;
  var height = huge ? width * 2.15 : width / 2;
  //var height = 5654
  
  var render = renderer(width, height, 'svg')

  var projection = d3.geoAirocean();
  var path = d3.geoPath(projection, render.context);
  
  
  var angle = projection.angle();
  if (huge) projection.angle(angle - 90);
  
  projection.fitExtent([[0,0],[width, height]], {type:"Sphere"});
  //projection.translate([0, 2000]);
  // projection.fitExtent([[2,2],[2000, 4000]], {type:"Sphere"});
  // projection.scale(200).translate([200, 800])//.scale(100);
  // projection.scale(200).translate([200, 250])//.scale(100);

  render.features(path, 'Land', {fill: '#eee'}, land);
  render.features(path, 'Lakes', {fill: '#0fa'}, lakes);
  render.features(path, 'Lakes', {fill: '#0af'}, lakes_50);
  render.features(path, 'Rivers', {stroke: '#0af', strokeWidth: 0.5}, rivers_50);
  render.features(path, 'Rivers', {stroke: '#0fa', strokeWidth: 0.5}, rivers);
  render.features(path, 'Countries', {stroke: '#f00', strokeWidth: 0.5}, country_dividers);
  
  render.circles(path, '2mil', 1, {stroke: '#aaa', strokeWidth: 0.5}, names.features.filter(f => f.properties.POP_OTHER > 2 * 1000 * 1000));
  render.circles(path, '5mil', 2, {stroke: '#aaa', strokeWidth: 0.5}, names.features.filter(f => f.properties.POP_OTHER > 5 * 1000 * 1000));
  
  render.labels(path, projection, 'Countries', 8, {fill: '#aaa', stroke: 'white', strokeWidth: 2}, countries);

  render.features(path, 'US', {stroke: '#fa0', strokeWidth: 0.5}, united_states);
  // render.features(path, svg, 'Provinces', null, '#fa0', 0.5, show_provinces);
  
  return render.node()
}


function _renderer(DOM,circle,mainGeometry,labelAngle,d3_){return(
function renderer(width, height, mode) {
  if (mode == 'canvas') {
    const context = DOM.context2d(width, height);
    context.clearRect(0,0,width, height);
    return {
      context,
      features: (path, title, {fill, stroke, strokeWidth}, item) => {
        if (fill) {
          context.beginPath();
          path(item);
          context.fillStyle = fill;
          context.fill();
        }
        if (stroke) {
          if (strokeWidth) context.lineWidth = strokeWidth
          context.beginPath();
          path(item);
          context.strokeStyle = stroke;
          context.stroke();
        }
      },
      circles: (path, title, radius, {fill, stroke, strokeWidth}, features) => {
        if (fill) {
          context.fillStyle = fill;
          features.forEach(f => {
            context.beginPath();
            circle(context, path.centroid(f.geometry), radius);
            context.fill();
          });
        }
        if (stroke) {
          if (strokeWidth) context.lineWidth = strokeWidth
          context.strokeStyle = stroke;
          features.forEach(f => {
            context.beginPath();
            circle(context, path.centroid(f.geometry), radius);
            context.stroke();
          });
        }
      },
      labels: (path, projection, title, fontSize, {fill, stroke, strokeWidth, above}, item) => {
        context.fillStyle = fill;
        context.strokeStyle = stroke;
        context.lineWidth = strokeWidth

        // labelPoints(context, projection, path, 8, false,
        //             countries.features.map(f => ({geometry: f.geometry, label: f.properties.NAME})));

        item.features.forEach(feature => {
          const [x, y] = path.centroid(mainGeometry(path, feature.geometry));
          const angle = labelAngle(projection, [x, y])

          context.save();
          context.translate(x, y);
          context.rotate(angle - Math.PI/2);

          context.font = `${fontSize}px sans-serif`;
          const ty = above ? -fontSize/2 : fontSize/2
          const text = feature.properties.NAME;
          const {width} = context.measureText(text)
          context.strokeText(text, -width/2, ty);
          context.fillText(text, -width/2, ty);

          context.restore();
        })

      },
      node: () => context.canvas
    }
  } else {
    const svg = d3_.select(DOM.svg(width, height))
    .attr("title", "test2")
    .attr("version", 1.1)
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr('xmlns:inkscape', "http://www.inkscape.org/namespaces/inkscape");
    const group = (name, style) => {
      var g = svg.append('g')
      .attr(':inkscape:groupmode', 'layer')
      .attr(':inkscape:label', name)
      .attr('fill', style.fill ? style.fill : 'none')
      .attr('stroke', style.stroke ? style.stroke : 'none')
      if (style.strokeWidth) return g.attr('stroke-width', style.strokeWidth)
      return g
    }
    return {
      context: null,
      svg,
      features: (path, title, style, item) => {
        group(title, style).selectAll("path")
          .data(item.features)
          .enter().append("path")
          .attr("stroke-width", d => d.properties.strokeweig)
          .attr("d", d => path(d.geometry));
      },
      circles: (path, title, radius, style, features) => {
        group(title, style).selectAll('circle')
          .data(features)
          .enter()
          .append('circle')
          .attr('r', radius)
          .attr('cx', d => path.centroid(d.geometry)[0])
          .attr('cy', d => path.centroid(d.geometry)[1])
      },
      labels: (path, projection, title, fontSize, {fill, stroke, strokeWidth, above}, item) => {
        const ty = above ? -fontSize/2 : fontSize/2
        const data = item.features.map(f => {
            const pos = path.centroid(mainGeometry(path, f.geometry));
            const angle = (labelAngle(projection, pos) - Math.PI/2) * 180 / Math.PI
            return {...f, center: [pos[0], pos[1]], angle}
          })
        if (stroke) {
          group(title+'_shadow', {fill, stroke, strokeWidth})
          .attr('style', `font: ${fontSize}px sans-serif`)
          .selectAll('text')
          .data(data)
          .enter().append('text')
          .text(d => d.properties.NAME)
          .attr('text-anchor', 'middle')
          .attr('transform', d => `rotate(${d.angle}, ${d.center[0]}, ${d.center[1]})`)
          .attr('dy', ty)
          .attr('x', d => d.center[0])
          .attr('y', d => d.center[1])
        }
        group(title, {fill})
          .attr('style', `font: ${fontSize}px sans-serif`)
          .selectAll('text')
          .data(data)
          .enter().append('text')
          .text(d => d.properties.NAME)
          .attr('text-anchor', 'middle')
          .attr('transform', d => `rotate(${d.angle}, ${d.center[0]}, ${d.center[1]})`)
          .attr('dy', ty)
          .attr('x', d => d.center[0])
          .attr('y', d => d.center[1])

      },
      node: () => {
        var node = svg.node()
        var source = node.outerHTML
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

//convert svg source to URI data scheme.
// var url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);

//set url value to a element's href attribute.
        var blob = new Blob([source], {type: 'image/svg+xml'});
        var url = URL.createObjectURL(blob);
        var link = DOM.element('a');
        link.href=  url
        link.textContent = 'Download now'
        link.target = '_blank'
        link.download = 'WorldMap.svg'
        var div = DOM.element('div')
        div.appendChild(node)
        div.appendChild(link);
        return div
        },
    }
  }
}
)}

function _skip(){return(
30
)}

function _d3_(require){return(
require('d3')
)}

function _renderCanvas(){return(
context => (path, title, fill, stroke, strokeWidth, item) => {
  if (fill) {
    context.beginPath();
    path(item);
    context.fillStyle = fill;
    context.fill();
  }
  if (stroke) {
    if (strokeWidth) context.lineWidth = strokeWidth
    context.beginPath();
    path(item);
    context.strokeStyle = stroke;
    context.stroke();
  }
}
)}

function _map(width,DOM,d3,renderCanvas,land,lakes,rivers,names,circle,labelPoints,countries,country_dividers){return(
function map() {
  var huge = true
  var height = huge ? width * 2.15 : width / 2;

  const context = DOM.context2d(width, height);
  var projection = d3.geoAirocean();
  var path = d3.geoPath(projection, context);
  
  var angle = projection.angle();
  if (huge) projection.angle(angle - 90);
  
  projection.fitExtent([[2,2],[width-2, height-2]], {type:"Sphere"});
  projection.scale(200).translate([200, 800])//.scale(100);
  // projection.scale(200).translate([200, 250])//.scale(100);

  path.pointRadius(2);
  draw(path)
  
  function draw(path) {
    context.clearRect(0,0,width, width/2);
    context.lineWidth = 0.5

    renderCanvas(context)(path, 'Land', '#eee', null, null, land);
    // context.beginPath();
    // path(land);
    // context.fillStyle = "#eee";
    // context.fill();


    context.lineWidth = 0.5
//     context.beginPath();
//     path(show_provinces);
//     context.strokeStyle = "#faa";
//     context.stroke();

//     context.beginPath();
//     path(united_states);
//     context.strokeStyle = "#f00";
//     context.stroke();

    context.beginPath();
    path(lakes);
    context.fillStyle = "#0af";
    context.fill();

    context.beginPath();
    path(rivers);
    context.strokeStyle = "#0af";
    context.stroke();
    
    context.strokeStyle = '#aaa'
    context.fillStyle = '#aaa'
    names.features.filter(f => f.properties.POP_OTHER > 2 * 1000 * 1000).forEach(f => {
      context.beginPath();
      circle(context, path.centroid(f.geometry), 1);
      context.stroke();
    });
    names.features.filter(f => f.properties.POP_OTHER > 5 * 1000 * 1000).forEach(f => {
      context.beginPath();
      circle(context, path.centroid(f.geometry), 2);
      context.stroke();
    });
    
    
    context.fillStyle = '#aaa';
    context.strokeStyle = 'white';
    context.lineWidth = 2

    labelPoints(context, projection, path, 8, false,
                countries.features.map(f => ({geometry: f.geometry, label: f.properties.NAME})));

    
    context.lineWidth = .5
    context.beginPath();
    path(country_dividers);
    context.strokeStyle = "red";
    context.stroke();
    
    
    context.fillStyle = 'green';
    // labelPoints(context, projection, path, 8, true,
    //             bigNames.map(f => ({geometry: f.geometry, label: f.properties.NAME})));
    
  }
  projection.angle(angle);

  return context.canvas;
}
)}

function _mainGeometry(){return(
function mainGeometry(path, geometry) {
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map(poly => ({type: 'Polygon', coordinates: poly}))
    .map(geo => ({area: path.area(geo), geo}))
    .sort((a, b) => b.area - a.area)[0].geo
  } else {
    return geometry
  }
}
)}

function _labelAngle(){return(
function labelAngle(projection, [x,y]) {
  const [a, b] = projection.invert([x, y]);
  const [x2, y2] = projection([a, b - 1]);
  return Math.atan2(y2-y, x2-x); 
}
)}

function _borderedCenteredText(){return(
function borderedCenteredText(context, text, x, y) {
  const {width} = context.measureText(text)
  context.strokeText(text, x-width/2, y);
  context.fillText(text, x-width/2, y);
}
)}

function _labelPoints(mainGeometry,labelAngle){return(
function labelPoints(context, projection, path, fontSize, above, points) {
  points.forEach(point => {

    const [x, y] = path.centroid(mainGeometry(path, point.geometry));
    const angle = labelAngle(projection, [x, y])

    context.save();
    context.translate(x, y);
    context.rotate(angle - Math.PI/2);
    
    context.font = `${fontSize}px sans-serif`;
    const ty = above ? -fontSize/2 : fontSize/2
    const {width} = context.measureText(point.label)
    context.strokeText(point.label, -width/2, ty);
    context.fillText(point.label, -width/2, ty);

    context.restore();
  })
}
)}

function _projection(d3){return(
d3.geoAirocean().fitExtent([[0, 0], [500, 500]], {type: 'Sphere'})
)}

function _circle(){return(
function circle(context, [x, y], rad) {
      context.moveTo(x + rad, y);
      context.arc(x, y, rad, 0, Math.PI*2);
}
)}

function _inversePoint(d3)
{
  const p = d3.geoAirocean();
  return p.invert(p([0,0]))
}


function _getShape(require){return(
async function getShape(name) {
  const get = url => fetch(url).then(res => res.arrayBuffer());
  const topojson = await require('topojson');
  const shp = await get(`https://cdn.rawgit.com/jaredly/naturalearth-mirror/master/${name}.shp`);
  const dbf = await get(`https://cdn.rawgit.com/jaredly/naturalearth-mirror/master/${name}.dbf`);
  const shapefile = await require('shapefile');
  const geojson = shapefile.read(shp, dbf, {encoding: 'utf-8'});
  return geojson
}
)}

function _countries(getShape){return(
getShape("110m_cultural/ne_110m_admin_0_countries")
)}

function _country_dividers(getShape){return(
getShape("110m_cultural/ne_110m_admin_0_boundary_lines_land")
)}

function _united_states(getShape){return(
getShape("110m_cultural/ne_110m_admin_1_states_provinces_lines")
)}

function _detailed_provinces(getShape){return(
getShape("10m_cultural/ne_10m_admin_1_states_provinces_lines")
)}

function _show_provinces(detailed_provinces,consolidate_features,large_countries)
{
  return {
    ...detailed_provinces, 
    features: consolidate_features(
      detailed_provinces.features
      .filter(f => large_countries.includes(f.properties.adm0_name)))
    
  }
}


function _consolidate_features(skip){return(
function consolidate_features(features) {
  return features.map(f => {
    if (f.geometry.type === 'MultiLineString') {
      return {
        ...f,
        geometry: {
          ...f.geometry,
          coordinates: f.geometry.coordinates.map(line => {
            const shorter = []
            for (var i = 0; i < line.length - 1; i += skip) {
              shorter.push(line[i])
            }
            shorter.push(line[line.length - 1])
            return shorter
          })
        },
      }
    } else {
      return f
    }
  })
  // const byC = {}
  // features.forEach(f => {
  //   if (!byC[f.properties.adm0_name]) {
  //     byC[f.properties.adm0_name] = [f]
  //   } else {
  //     byC[f.properties.adm0_name].push(f)
  //   }
  // });
  // const order = ([a, b]) => a < b ? [a, b] : [b, a];
  // const merged = [].concat(...Object.keys(byC).map(name => {
  //   const features = byC[name];
  //   const joined = {...features[0]};
  //   const unmerged = [];
  //   joined.properties.shape_leng = undefined
  //   joined.geometry = {
  //     type: 'MutliLineString',
  //     coordinates: [].concat(...features.map(f => {
  //       switch (f.geometry.type) {
  //         case 'LineString':
  //           return [f.geometry.coordinates]
  //         default:
  //           unmerged.push(f)
  //           return []
  //           //return f.geometry.coordinates
  //       }
  //     })),
  //   }
  //   return [joined, ...unmerged]
  // }));
  
  // const starts = {}
  //   features.forEach(f => {
  //     if (f.geometry.type == 'LineString') {
  //       f.geometry.coordinates = order(f.geometry.coordinates);
  //       f.properties.used = false;
  //       starts[f.geometry.coordinates[0]] = f
  //     }
  //   });
  //   features.forEach(f => {
  //   });
  // return merged
}
)}

function _lakes(getShape){return(
getShape("110m_physical/ne_110m_lakes")
)}

function _lakes_50(getShape){return(
getShape("50m_physical/ne_50m_lakes")
)}

function _rivers_50(getShape){return(
getShape("50m_physical/ne_50m_rivers_lake_centerlines_scale_rank")
)}

function _land(getShape){return(
getShape("110m_physical/ne_110m_land")
)}

function _rivers(getShape){return(
getShape("110m_physical/ne_110m_rivers_lake_centerlines")
)}

function _28(md){return(
md`*Population size of each named place*`
)}

function _A(names){return(
names.features.filter(f => f.properties.SCALERANK == 0)
)}

async function _chart(require,names,DOM)
{
  var d3 = await require('d3@5')
  var width = 500
  var height = 200
  var data = names.features.map(f => f.properties.LABELRANK)
  const svg = d3.select(DOM.svg(width, height));
  var margin = ({top: 20, right: 20, bottom: 30, left: 40})
  var x = x = d3.scaleLinear()
    .domain(d3.extent(data)).nice()
    .range([margin.left, width - margin.right])
  var bins = d3.histogram()
    .domain(x.domain())
    .thresholds(x.ticks(40))(data)
  var y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)]).nice()
    .range([height - margin.bottom, margin.top])
  const bar = svg.append("g")
      .attr("fill", "steelblue")
    .selectAll("rect")
    .data(bins)
    .enter().append("rect")
      .attr("x", d => x(d.x0) + 1)
      .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("y", d => y(d.length))
      .attr("height", d => y(0) - y(d.length));

  var yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 4)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(data.y))
  
  var  xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(1))
    .call(g => g.append("text")
        .attr("x", width - margin.right)
        .attr("y", -4)
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
        .text(data.x))
  
  svg.append("g")
      .call(xAxis);
  
  svg.append("g")
      .call(yAxis);
  
  return svg.node();
}


function __(projection,names){return(
projection.invert(projection(names.features[0].geometry.coordinates))
)}

function _names(getShape){return(
getShape("110m_cultural/ne_110m_populated_places")
)}

function _d3(require){return(
require("d3-fetch", "d3-geo", "d3-geo-polygon")
)}

function _large_countries(){return(
['Canada', 'Brazil', 'Russia', 'China', 'India', 'Argentina', 'Australia']
)}

function _all_names(detailed_provinces)
{
  let x = {}
detailed_provinces.features.forEach(f => x[f.properties.adm0_name]=true);
return x
}


export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer("V")).define("V", ["renderer","d3","land","lakes","lakes_50","rivers_50","rivers","country_dividers","names","countries","united_states"], _V);
  main.variable(observer("renderer")).define("renderer", ["DOM","circle","mainGeometry","labelAngle","d3_"], _renderer);
  main.variable(observer("skip")).define("skip", _skip);
  main.variable(observer("d3_")).define("d3_", ["require"], _d3_);
  main.variable(observer("renderCanvas")).define("renderCanvas", _renderCanvas);
  main.variable(observer("map")).define("map", ["width","DOM","d3","renderCanvas","land","lakes","rivers","names","circle","labelPoints","countries","country_dividers"], _map);
  main.variable(observer("mainGeometry")).define("mainGeometry", _mainGeometry);
  main.variable(observer("labelAngle")).define("labelAngle", _labelAngle);
  main.variable(observer("borderedCenteredText")).define("borderedCenteredText", _borderedCenteredText);
  main.variable(observer("labelPoints")).define("labelPoints", ["mainGeometry","labelAngle"], _labelPoints);
  main.variable(observer("projection")).define("projection", ["d3"], _projection);
  main.variable(observer("circle")).define("circle", _circle);
  main.variable(observer("inversePoint")).define("inversePoint", ["d3"], _inversePoint);
  main.variable(observer("getShape")).define("getShape", ["require"], _getShape);
  main.variable(observer("countries")).define("countries", ["getShape"], _countries);
  main.variable(observer("country_dividers")).define("country_dividers", ["getShape"], _country_dividers);
  main.variable(observer("united_states")).define("united_states", ["getShape"], _united_states);
  main.variable(observer("detailed_provinces")).define("detailed_provinces", ["getShape"], _detailed_provinces);
  main.variable(observer("show_provinces")).define("show_provinces", ["detailed_provinces","consolidate_features","large_countries"], _show_provinces);
  main.variable(observer("consolidate_features")).define("consolidate_features", ["skip"], _consolidate_features);
  main.variable(observer("lakes")).define("lakes", ["getShape"], _lakes);
  main.variable(observer("lakes_50")).define("lakes_50", ["getShape"], _lakes_50);
  main.variable(observer("rivers_50")).define("rivers_50", ["getShape"], _rivers_50);
  main.variable(observer("land")).define("land", ["getShape"], _land);
  main.variable(observer("rivers")).define("rivers", ["getShape"], _rivers);
  main.variable(observer()).define(["md"], _28);
  main.variable(observer("A")).define("A", ["names"], _A);
  main.variable(observer("chart")).define("chart", ["require","names","DOM"], _chart);
  main.variable(observer("_")).define("_", ["projection","names"], __);
  main.variable(observer("names")).define("names", ["getShape"], _names);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("large_countries")).define("large_countries", _large_countries);
  main.variable(observer("all_names")).define("all_names", ["detailed_provinces"], _all_names);
  return main;
}
