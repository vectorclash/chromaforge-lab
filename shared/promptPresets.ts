// Starting points for motion prompts. Edit freely -- nothing stored depends on these.
// Starting points for motion prompts, written for fast, crystalline, colour-shifting flight
// through a starfield. Each names a camera move, what the artwork itself does, and the
// speed, and asks the model to keep the source's hard-edged translucent facets -- video
// models drift toward generic soft CGI unless told what to preserve.
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
    name: 'Crystal warp',
    prompt:
      'The camera rockets forward at high speed through a dense starfield; stars streak past into bright lines. The translucent geometric shards grow into a crystalline fractal structure that keeps subdividing into smaller facets as we fly through it. Colors shift continuously across the full spectrum, neon pink to lime to electric blue. Keep the hard-edged, glassy, translucent facets of the original artwork.'
  },
  {
    name: 'Fractal bloom',
    prompt:
      'Fast forward camera surge. From the bright center, crystal facets bloom outward in a recursive fractal pattern, each shard splitting into smaller self-similar shards that rush past the camera. Stars twinkle and streak in the background. Hues cycle rapidly through vivid neon colors. Sharp, faceted, prismatic crystal, not smoke or liquid.'
  },
  {
    name: 'Prism tunnel',
    prompt:
      'The shards assemble into a long crystalline tunnel of refracting glass facets, and the camera races through it at high speed. Light splits into rainbow spectra on every facet edge, and colors ripple along the tunnel walls in waves. Stars flash past between the crystals. Continuous, fast, hypnotic motion with hard geometric edges.'
  },
  {
    name: 'Hyperspace refraction',
    prompt:
      'Jump to hyperspace: the starfield stretches into long radiating light streaks rushing toward the camera. The crystal geometry refracts the streaks into prismatic spectral colors, facets rotating and catching light as they fly by. Colors cycle from magenta to cyan to acid green. Fast, energetic, glassy and sharp.'
  },
  {
    name: 'Kaleidoscope dive',
    prompt:
      'An endless dive into a symmetrical crystalline kaleidoscope: mirrored fractal facets rotate and zoom inward continuously, new layers of crystal emerging from the center. Stars sparkle through the translucent glass. Rapid, smooth hue shifting across the whole image. Hard-edged geometric crystal, vivid neon palette.'
  },
  {
    name: 'Shatter and reform',
    prompt:
      'The crystal composition shatters into thousands of glittering shards that fly past the camera at speed through a starfield, then reassemble ahead of us into a new crystalline fractal form. Colors shift with every fracture. Sharp translucent facets, bright refracted light, fast dynamic motion.'
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
