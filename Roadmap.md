
THE EDITOR

- [x] can render stuff
- [x] can render a rect
- [x] zoom and pan pls
- [x] modify color
- [x] show/hide layers
- [x] move text labels
	(also, I want the text label location mods to be ... saved separately from the other data. So I can refresh data and it be ok.)
	(also, any new paths that I make should be similarly in a different place.)
- [ ] select certain things that would be CUT
	- and make them NOT CUT
	... maybe this is "MOVE TO CUSTOM LAYER"? Yeah.
- [ ] maybe can clip
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

