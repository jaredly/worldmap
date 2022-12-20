
LASER CUTTING

Test 1:
13%, 100mm/s - I'd love to get this a lot faster
20%, 10mm/s - 3x (didn't fall out, but basically)

Test 2:
14%, 200mm/s -- oooh much better definition, I do like it

Test 3:
17%, 300mm/s - maybe too light?

Test 4:
20%, 300mm/s

Test 5:
25%, 300mm/s

Test 6:
25%, 250mm/s

Test 7:
25%, 250mm/s, Lakes & Captial stars are #555 instead of #000

Test 8:
25%, 250mm/s, Capitals at #111, Lakes at #333

^ I think this is what we'll go with!


US ENG:
250mm/s, 25%. 1:52 start, estimated 40 minutes.
CUT: 25% 10mm/s (12mAmp draw, well below the ~18-20 max that people talk about)
Took 3 passes.
A fair amount of burning, which I don't love a ton. I wonder what I can do.
Like an air fan?

## NEXT ONE : CANADA?

How to reduce burn?
- [-] blow air, somehow made it worse
- [-] mask? ok masking before the engraving is way bad, but maybe I could try masking after engraving?
		feels a little fraught, but maybe.
- [ ] mask after engrave

UGH Why is the red light district twice?
oh maybe that's why? It was in the original layer, and then also in the move?
- [x] fix the double border issue
- [ ] filter out labels that are outside of the bounds


##


FINAL COUNTDOWN

- [ ] I'd maybe like to be able to add some custom text?
  - like french guaiana?


THE EDITOR

- [x] can render stuff
- [x] can render a rect
- [x] zoom and pan pls
- [x] modify color
- [x] show/hide layers
- [x] move text labels
	(also, I want the text label location mods to be ... saved separately from the other data. So I can refresh data and it be ok.)
	(also, any new paths that I make should be similarly in a different place.)
- [x] select certain things that would be CUT
	- and make them NOT CUT
	... maybe this is "MOVE TO CUSTOM LAYER"? Yeah.
- [x] maybe can clip
  - I guess I should validate this first
	- ok so here's an idea. For the big majority of the stuffs, maybe what I want to do is
		just rasterize right there. Render it to a canvas, and embed the image.
		So then I only have to do expensive clipping dealios for the cutting stuff.

		Can I do a "does intersect"?


Ah what about this story.
So loading the data, we go "reload an individual layer"? Maybe?



screen: 20, 20
<!-- pz: {x: -} -->
underlying: 




--

So, I think maybe I'll make a generic SVG editor dealio? ish?
Like, no reason to ... tie in the geo stuff, right? I think.
I mean I guess it could be useful.

Anyway, first order of business is to not do that.

THINGS WE DO:
- draw a rectangle, crop the heck out of it. all paths crop to it stat.
	I hope cropping works, my folks. hope hope hope.
- 


---


Expand 20 round, contract 20 round -- makes tand-5.svg, which is pretty solid tbh.
I'd rather have bevel'ed contract though, because the round contract makes everything
look like it was made by a melon baller. which isn't quite necessary.


Ok, so after I have a basically-working coastline normalizer...

I need to have the other things exported.

