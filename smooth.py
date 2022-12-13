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

def contract(outline, width, join=round, simplify=True, debug=None):
    stroked = stroke(outline, width, join, simplify)
    if debug:
        debug.drawPath(stroked, line(0, 255, 0))
    return skia.Op(outline, stroked, skia.PathOp.kDifference_PathOp)

def fill(r, g, b, a=1.0):
    return skia.Paint(Color=skia.Color(r, g, b), Alphaf=a)

def line(r, g, b, w=0.5):
    return skia.Paint(Color=skia.Color(r, g, b), Style=skia.Paint.kStroke_Style, StrokeWidth=w)



def coastline(file, ex, con, amount, debug=True):
    separate = [from_cmds(cmds) for i, cmds in enumerate(json.load(open('110m_land.cmds')))] # if i != 1378]
    small = [from_cmds(cmds) for i, cmds in enumerate(json.load(open('separate.cmds')))] # if i != 1378]
    print("Loaded land masses")

    width = 3500
    height = width * 2.15 

    print(">>", file)
    stream = skia.FILEWStream(file)
    canvas = skia.SVGCanvas.Make((width, int(height)), stream)

    dc = None # canvas if debug else None

    outlined = skia.Path()
    unioned = skia.Path()

    # for path in small:
    #     canvas.drawPath(path, line(0, 0, 0))

    for path in separate:
        unioned = union(unioned, path)
        exp = expand(path, amount, ex)
        outlined = union(outlined, exp)
        # canvas.drawPath(path, line(255, 0, 0))

    # if debug:
    canvas.drawPath(outlined, line(0, 0, 0))
        # canvas.drawPath(unioned, fill(0, 0, 0))
    # canvas.drawPath(union(unioned, contract(outlined, amount, con, debug=dc)), fill(0,0,255,0.5))

    del canvas
    stream.flush()
    text = open(file).read()
    # open(file, 'w').write(text + '\n</svg>')
    print('done')

# coastline('110_round-bevel-40.svg', round, bevel, 95)
coastline('110_bevel-bevel-40.svg', bevel, bevel, 95)
# coastline('110_round-round-10.svg', round, round, 10)
# coastline('110_round-bevel-10.svg', round, bevel, 10)
# coastline('110_round-bevel-20.svg', round, bevel, 20)
