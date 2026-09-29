# Chromaforge Lab

A local tool for animating generative artwork from [Chromaforge](https://chromaforge.app) with fal.ai image-to-video models. It was built in an afternoon to answer one question: can current video models animate abstract generative art without losing it?

[CLIP: the "Living artwork" run from MiniMax H3 Max]

## The short version

I tested six image-to-video models on fal against real Chromaforge artwork. On abstract art, **the prompt decides whether a model treats the image as material or as a disposable first frame.**

- Describe a *new scene* and most models drop the artwork within a second or two and render a generic stock version.
- Describe *what's already there* and they keep it.

[SIDE-BY-SIDE: same source image, "new scene" prompt vs "work with what's there" prompt]

MiniMax H3 Max was the clear standout. Asked for a glass whale, it built one out of the source's own planes and palette. My honest verdict: none of the models beat Chromaforge's own JavaScript animation for this style yet, but "work with what's there" prompting on MiniMax is a promising direction.

Full write-up, including API rough edges: **[FINDINGS.md](FINDINGS.md)**

## What it does

- Drag-and-drop source images, and a model picker generated from a single shared config
- Motion and sound prompt presets, with per-model prompt limits
- A cost estimate for every run, checked against fal's live pricing API
- A session spend cap that reserves estimated cost when a run is submitted, so parallel runs can't overshoot
- Every clip saved alongside a JSON record of the prompt, parameters, exact fal input, estimate and request ID
- A player and a past-runs gallery

**Models tested:** LTX-2 Fast, LTX-2.3 Fast, Veo 3.1 Fast, Kling v3 Pro, Kling O3 Pro, MiniMax H3 Max

## Stack

Vite + React UI, a small Hono server that holds the fal key (it never reaches the browser), and `@fal-ai/client` with the queue API and fal storage.

## Running it

```bash
npm install
cp .env.example .env   # add your FAL_KEY, optionally adjust SPEND_CAP_USD
npm run dev
```

Drop any PNG or JPG into `sources/` or onto the UI. `npm run smoke` runs a command-line test of the full path.

`npm run render-source` renders artwork using Chromaforge's own renderer. It needs the private Chromaforge repo checked out alongside this one, so for anyone else it won't run; any image works as a source.