#!/usr/bin/env python3.8
import skia
import json

def from_cmds(cmds):
	path = skia.Path()
	for cmd in cmds:
		if cmd[0] == 0: # MOVE
			_, x, y = cmd
			path.moveTo(x, y)
		elif cmd[0] == 1: # LINE
			_, x, y = cmd
			path.lineTo(x, y)
		elif cmd[0] == 2: # QUAD
			_, x, y, a, b = cmd
			path.quadTo(x, y, a, b)
		elif cmd[0] == 3: # CONIC
			_, x, y, a, b, w = cmd
			path.conicTo(x, y, a, b, w)
		elif cmd[0] == 4: # CUBIC
			_, x, y, a, b, c, d = cmd
			path.cubicTo(x, y, a, b, c, d)
		elif cmd[0] == 5:
			path.close()
		else:
			print("Bad news", cmd[0])
	return skia.Simplify(path)

def stroke(path, width, join=skia.Paint.kMiter_Join):
	paint = skia.Paint(
		StrokeWidth=width,
		StrokeJoin=join,
		Style=skia.Paint.kStroke_Style,
	)
	np = skia.Path()
	paint.getFillPath(path, np)
	return skia.Simplify(np)

def union(one, two):
    return skia.Op(one, two, skia.PathOp.kUnion_PathOp)

bevel = skia.Paint.kBevel_Join

def expand(path, width):
    return union(stroke(path, width, skia.Paint.kRound_Join ), path)

def contract(outline, width):
    return skia.Op(outline, stroke(outline, width, skia.Paint.kRound_Join ), skia.PathOp.kDifference_PathOp)

def simplify(path, width, i):
    try:
        outline = expand(path, width)
        # print('outlined')
        simplified = contract(outline, width)
        # print('backed')
        simplified = union(simplified, path)
        # print('joined')
        return simplified
    except:
        print('Failed once', i)
        return None

separate = [from_cmds(cmds) for i, cmds in enumerate(json.load(open('separate.cmds'))) if i != 1378]
print("ok")

# outlined = [expand(path, 20) for path in separate]

# ok = [(path, simplify(path, 20, i)) for i, path in enumerate(separate)]#[:100]]


width = 3500
height = width * 2.15 

stream = skia.FILEWStream('tand-4.svg')
canvas = skia.SVGCanvas.Make((width, int(height)), stream)

def fill(r, g, b, a=1.0):
    return skia.Paint(Color=skia.Color(r, g, b), Alphaf=a)

def line(r, g, b, w=0.5):
    return skia.Paint(Color=skia.Color(r, g, b), Style=skia.Paint.kStroke_Style, StrokeWidth=w)

outlined = skia.Path()
unioned = skia.Path()

for path in separate:
    uninioned = union(unioned, path)
    exp = expand(path, 20)
    # canvas.drawPath(exp, fill(0, 0, 255, 0.5))
    outlined = union(outlined, exp)
    canvas.drawPath(path, line(255, 0, 0))

print('intractit')
canvas.drawPath(union(unioned, contract(outlined, 20)), fill(0,0,255,0.5))


# surface = skia.Surface(width, int(height))

# for (path, simplified) in ok:
# # with surface as canvas:
#     if simplified:
#         paint = skia.Paint(Color=skia.Color(0, 0, 255))
#         canvas.drawPath(simplified, paint)
#     paint = skia.Paint(Color=skia.Color(255, 255, 255), Alphaf=0.2)
#     canvas.drawPath(path, paint)
#     paint = skia.Paint(Color=skia.Color(255, 0, 0), Style=skia.Paint.kStroke_Style, StrokeWidth=0.5)
#     canvas.drawPath(path, paint)

del canvas
stream.flush()

fail()







cmds = json.load(open('./ok.cmds'))
path = from_cmds(cmds)
print("Loaded path")

sw = 10
outline = skia.Op(stroke(path, 10), path, skia.PathOp.kUnion_PathOp)
print('mid')
outline = stroke(outline, 10)
print('outlined')
# Ugh this one is breaking?
both = skia.Op(outline, path, skia.PathOp.kUnion_PathOp)
print('oped')
back = stroke(both, sw)
simplified = skia.Op(both, back, skia.PathOp.kDifference_PathOp)
simplified = skia.Op(simplified, path, skia.PathOp.KUnion_PathOp)

width = 3500
height = width * 2.15 

stream = skia.FILEWStream('output-20.svg')
canvas = skia.SVGCanvas.Make((width, int(height)), stream)

# surface = skia.Surface(width, int(height))

if True:
# with surface as canvas:
    paint = skia.Paint(Color=skia.Color(0, 0, 255))
    canvas.drawPath(both, paint)
    paint = skia.Paint(Color=skia.Color(0, 255, 0))
    canvas.drawPath(simplified, paint)
    paint2 = skia.Paint(Color=skia.Color(255, 0, 0), Style=skia.Paint.kStroke_Style, StrokeWidth=0.5)
    canvas.drawPath(path, paint2)

del canvas
stream.flush()

# image = surface.makeImageSnapshot()
# image.save('output.png', skia.kPNG)


'''
JSArray EMSCRIPTEN_KEEPALIVE ToCmds(const SkPath& path) {
    JSArray cmds = emscripten::val::array();
    for (auto [verb, pts, w] : SkPathPriv::Iterate(path)) {
        JSArray cmd = emscripten::val::array();
        switch (verb) {
        case SkPathVerb::kMove:
            cmd.call<void>("push", MOVE, pts[0].x(), pts[0].y());
            break;
        case SkPathVerb::kLine:
            cmd.call<void>("push", LINE, pts[1].x(), pts[1].y());
            break;
        case SkPathVerb::kQuad:
            cmd.call<void>("push", QUAD, pts[1].x(), pts[1].y(), pts[2].x(), pts[2].y());
            break;
        case SkPathVerb::kConic:
            cmd.call<void>("push", CONIC,
                           pts[1].x(), pts[1].y(),
                           pts[2].x(), pts[2].y(), *w);
            break;
        case SkPathVerb::kCubic:
            cmd.call<void>("push", CUBIC,
                           pts[1].x(), pts[1].y(),
                           pts[2].x(), pts[2].y(),
                           pts[3].x(), pts[3].y());
            break;
        case SkPathVerb::kClose:
            cmd.call<void>("push", CLOSE);
            break;
        }
        cmds.call<void>("push", cmd);
    }
    return cmds;
}

static const int MOVE = 0;
static const int LINE = 1;
static const int QUAD = 2;
static const int CONIC = 3;
static const int CUBIC = 4;
static const int CLOSE = 5;
'''

