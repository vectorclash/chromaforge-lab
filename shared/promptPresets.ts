// Starting points for motion prompts. Edit freely -- nothing stored depends on these.
export const MOTION_PRESETS: { name: string; prompt: string }[] = [
  {
    name: 'Slow push-in',
    prompt: 'Slow drifting camera push-in; the stars twinkle and the geometric shards rotate gently, colors shimmer.'
  },
  {
    name: 'Parallax drift',
    prompt: 'Gentle lateral camera drift with parallax: the translucent shards separate into layers at different depths, the starfield glides behind them.'
  },
  {
    name: 'Kaleidoscope turn',
    prompt: 'The whole composition rotates slowly around its center like a kaleidoscope, facets catching light, colors cycling smoothly.'
  },
  {
    name: 'Still camera, living light',
    prompt: 'Locked-off static camera. Nothing moves except light: stars pulse and flare, gradients breathe and shift hue slowly.'
  },
  {
    name: 'Warp forward',
    prompt: 'Accelerating flight forward through the artwork, shards streaming past the camera, stars stretching into streaks.'
  }
];

export const AUDIO_PRESETS: { name: string; prompt: string }[] = [
  {
    name: 'Ethereal retro synth',
    prompt: 'an ethereal, retro synth soundscape -- warm analog pads, slow shimmering arpeggios, soft tape-saturated ambience, no vocals, no percussion.'
  },
  { name: 'Deep space drone', prompt: 'a deep, slowly evolving ambient drone with distant chimes, no vocals, no percussion.' },
  { name: 'Glassy chimes', prompt: 'delicate glassy chimes and soft crystalline bells over airy reverb, no vocals.' }
];
