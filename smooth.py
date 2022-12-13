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

def stroke(path, width, join=skia.Paint.kMiter_Join, simplify=True):
    paint = skia.Paint(
        StrokeWidth=width,
        StrokeJoin=join,
        Style=skia.Paint.kStroke_Style,
    )
    np = skia.Path()
    paint.getFillPath(path, np)
    if not simplify:
        return np
    return skia.Simplify(np)

def union(one, two):
    return skia.Op(one, two, skia.PathOp.kUnion_PathOp)

bevel = skia.Paint.kBevel_Join
round = skia.Paint.kRound_Join

def expand(path, width, join=round):
    return union(stroke(path, width, join), path)

def contract(outline, width, join=round, simplify=True):
    return skia.Op(outline, stroke(outline, width, join, simplify), skia.PathOp.kDifference_PathOp)

def fill(r, g, b, a=1.0):
    return skia.Paint(Color=skia.Color(r, g, b), Alphaf=a)

def line(r, g, b, w=0.5):
    return skia.Paint(Color=skia.Color(r, g, b), Style=skia.Paint.kStroke_Style, StrokeWidth=w)


width = 3500
height = width * 2.15 

def coastline(file, ex, con, width):
    print(">>", file)
    stream = skia.FILEWStream(file)
    canvas = skia.SVGCanvas.Make((width, int(height)), stream)

    outlined = skia.Path()
    unioned = skia.Path()

    separate = [from_cmds(cmds) for i, cmds in enumerate(json.load(open('separate.cmds'))) if i != 1378]
    print("Loaded land masses")

    for path in separate[:40]:
        uninioned = union(unioned, path)
        exp = expand(path, width, ex)
        outlined = union(outlined, exp)
        canvas.drawPath(path, line(255, 0, 0))

    canvas.drawPath(union(unioned, contract(outlined, width, con)), fill(0,0,255,0.5))

    del canvas
    stream.flush()

# coastline('round-round-20.svg', round, round, 20)
coastline('round-round-10.svg', round, round, 10)
coastline('round-bevel-10.svg', round, bevel, 10)


def olds():
    surface = skia.Surface(width, int(height))

    for (path, simplified) in ok:
    # with surface as canvas:
        if simplified:
            paint = skia.Paint(Color=skia.Color(0, 0, 255))
            canvas.drawPath(simplified, paint)
        paint = skia.Paint(Color=skia.Color(255, 255, 255), Alphaf=0.2)
        canvas.drawPath(path, paint)
        paint = skia.Paint(Color=skia.Color(255, 0, 0), Style=skia.Paint.kStroke_Style, StrokeWidth=0.5)
        canvas.drawPath(path, paint)

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
