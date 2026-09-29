// Starting points for motion prompts. Living artwork is the conservative one; the rest are
// deliberately wild scenes, each told as beats relative to the clip (so they fit 5s or 8s)
// and each ending with the same style lock, because every model tested drifted toward a
// generic stock look the moment it was not told what to keep.
// Kling caps prompts at 2500 characters; these stay under 1800 to leave room for a Sound line.
// Edit freely -- nothing stored depends on these.
export const MOTION_PRESETS: { name: string; prompt: string }[] = [
  {
    // The opposite approach to the presets below: names what is already in the artwork
    // and asks only for motion within it. Scene-describing prompts made both LTX and Veo
    // discard the source within a second and render a stock scene instead.
    name: 'Living artwork',
    prompt:
      'Keep this exact image: the same layered translucent geometric planes, the same hot pink, lime green, electric blue and white, the same small dark four-pointed star glints. The planes drift slowly and slide over one another like sheets of colored glass, and where they overlap the blended colors shift and shimmer. The bright white core pulses softly. The star glints twinkle. The camera pushes in slowly and steadily. Flat graphic 2D artwork with hard edges, not a 3D render, not photographic, and no new objects appear.'
  },
  {
    name: "Glass leviathan",
    prompt:
      "The translucent planes peel off the canvas and snap together, triangle by triangle, into a colossal whale built of neon stained glass: hot pink ribs, lime green fins, an electric blue belly, white light glowing through it from inside. It swims slowly out of the frame's depth toward the camera through a field of tiny dark stars, its body flexing, every triangular pane catching light and shifting hue as it turns. As it glides past the lens its tail sweeps across the whole frame, and the panes of the tail break away into a spiral of spinning glass triangles that scatter and tumble across the screen. Keep the look of the source artwork throughout: flat, hard-edged, translucent overlapping glass planes in hot pink, lime green, electric blue and white, with small dark four-pointed star glints. Bold graphic style, crisp edges, no lens flares, no blur, no text."
  },
  {
    name: "Stained-glass cathedral",
    prompt:
      "The camera pulls back fast and reveals that the artwork is one enormous stained-glass window set into an impossible cathedral floating in deep space. The cathedral's arches, columns and vaulted ceiling are built from the same translucent colored triangles. Light pours through the window and throws sharp pink, lime and blue triangles across a black mirror floor. The window's panes begin to rotate open like shutters, one after another, and the camera rushes forward through the opening into a second window beyond it, and a third, each one a new geometric arrangement of the same colors. Keep the look of the source artwork throughout: flat, hard-edged, translucent overlapping glass planes in hot pink, lime green, electric blue and white, with small dark four-pointed star glints. Bold graphic style, crisp edges, no lens flares, no blur, no text."
  },
  {
    name: "Infinite dive",
    prompt:
      "The camera plunges straight into the bright white wedge at the center of the composition. Inside it is the entire artwork again, smaller and rotated thirty degrees. The camera keeps diving into the center of each copy, accelerating, every layer rotating further and its colors cycling, pink becoming lime becoming electric blue, so the image becomes an endless spiralling recursive zoom of the same geometric composition nested inside itself, faster and faster, with star glints streaming outward from the center. Keep the look of the source artwork throughout: flat, hard-edged, translucent overlapping glass planes in hot pink, lime green, electric blue and white, with small dark four-pointed star glints. Bold graphic style, crisp edges, no lens flares, no blur, no text."
  },
  {
    name: "Origami supernova",
    prompt:
      "The whole composition folds inward along its straight edges like origami, panel over panel, collapsing toward the center into a single tight knot of layered glass that glows from inside. It holds for a heartbeat, trembling. Then it detonates outward in a flat graphic burst of hundreds of translucent triangles that unfold in mid-flight into geometric flowers and pinwheels, spinning as they fly, before landing and locking together edge to edge into a completely new composition that fills the frame. Keep the look of the source artwork throughout: flat, hard-edged, translucent overlapping glass planes in hot pink, lime green, electric blue and white, with small dark four-pointed star glints. Bold graphic style, crisp edges, no lens flares, no blur, no text."
  },
  {
    name: "Synthwave terrain",
    prompt:
      "The planes tip backward and lie flat, becoming an endless landscape of translucent triangular mountains, lime green and hot pink, stretching to the horizon. Above them rises a huge striped retro sun built from electric blue triangles, and the sky fills with twinkling dark star glints. The camera flies low and fast over the peaks toward the sun, and the mountains ripple up and down beneath it like an audio waveform, their facets flashing brighter on each crest. Retro 1980s album-cover energy. Keep the look of the source artwork throughout: flat, hard-edged, translucent overlapping glass planes in hot pink, lime green, electric blue and white, with small dark four-pointed star glints. Bold graphic style, crisp edges, no lens flares, no blur, no text."
  },
  {
    name: "Tessellation tide",
    prompt:
      "A wave sweeps across the image and every triangle flips over one after another like falling dominoes, each one revealing a different color on its back: pink flips to blue, lime flips to magenta, blue flips to white. A second wave starts from the opposite corner, crosses the first, and where they meet the flipping triangles form shimmering interference patterns of color. The star glints pop and sparkle like camera flashes as each wave passes over them. The camera slowly rotates as the tides of color roll through. Keep the look of the source artwork throughout: flat, hard-edged, translucent overlapping glass planes in hot pink, lime green, electric blue and white, with small dark four-pointed star glints. Bold graphic style, crisp edges, no lens flares, no blur, no text."
  },
  {
    name: "Paper-cut portal",
    prompt:
      "The artwork separates into deep layers like a paper-cut diorama, each translucent plane floating at a different depth with strong parallax. The camera flies forward through a triangular portal cut into the front layer, then through a smaller portal in the next layer, each layer's cutouts becoming more intricate geometric lace, until the final layer opens into a vast rotating mandala built from the same colored triangles. Keep the look of the source artwork throughout: flat, hard-edged, translucent overlapping glass planes in hot pink, lime green, electric blue and white, with small dark four-pointed star glints. Bold graphic style, crisp edges, no lens flares, no blur, no text."
  }
];

export const AUDIO_PRESETS: { name: string; prompt: string }[] = [
  {
    name: 'Ethereal retro synth',
    prompt: 'an ethereal, retro synth soundscape -- warm analog pads, slow shimmering arpeggios, soft tape-saturated ambience, no vocals, no percussion.'
  },
  { name: 'Deep space drone', prompt: 'a deep, slowly evolving ambient drone with distant chimes, no vocals, no percussion.' },
  { name: 'Glassy chimes', prompt: 'delicate glassy chimes and soft crystalline bells over airy reverb, no vocals.' },
  {
    name: 'Hyperdrive synth',
    prompt: 'a driving retro synthwave pulse with a rising whoosh of speed, shimmering glassy arpeggios and deep analog bass, no vocals.'
  }
];
