# Chromaforge Lab: findings

## What Aaron built (2026-09-29)

In one afternoon, Aaron built **Chromaforge Lab**, working with Claude Code. It's a local-only tool for animating his generative artwork with fal.ai image-to-video models.

- **Chromaforge** (chromaforge.app) is Aaron's live generative art app and merch store. Every artwork is regenerated from a tiny `{ seed, colors, settings }` record, and designs print on garments through Printful.
- **The lab's code** is in a private GitHub repo, `vectorclash/chromaforge-lab`. It's separate from Chromaforge and never touches the live app.

**Stack:** Vite and React for the UI, a small Hono server that holds the fal key (it never reaches the browser), and the `@fal-ai/client` queue API with fal storage uploads.

**Features:**
- Drag-and-drop source images, or pick from a folder.
- A model picker generated from one config file, which the server and UI both use for validation.
- Motion and sound prompt presets.
- Each model's prompt length limit, taken from its schema.
- A cost estimate for every run, checked against fal's live pricing API. If the live price has changed since the config was written, the run is flagged and needs confirmation.
- A session spend cap that reserves each run's estimated cost when it's submitted, so parallel runs can't overshoot together.
- Every finished clip is downloaded with a JSON record of its prompt, parameters, the exact fal input, the estimate and fal's request ID.
- A player and a past-runs gallery.

**Also built:** a command-line smoke test of the full path, and a script that renders source images using Chromaforge's own renderer.

**How it was verified:** in a real browser at desktop and phone widths, with no console errors. The fal key was confirmed absent from the built bundle.

## What was tested

- **Models:** six image-to-video models on fal. LTX-2 Fast, LTX-2.3 Fast, Veo 3.1 Fast, Kling v3 Pro, Kling O3 Pro and MiniMax H3 Max.
- **Runs:** 14 successful runs, plus 3 failures.
- **Source images:** real Chromaforge artwork. These are abstract compositions of translucent, hard-edged overlapping geometric planes in vivid neon colours, with small star glints.

## Findings

1. **The prompt decides everything on abstract art.**
   - Prompts describing a *new scene* (hyperspace, crystals blooming, shattering) made LTX-2.3, Veo 3.1 Fast and Kling O3 Pro drop the artwork, usually within one to two seconds, and render a generic stock version of that scene.
   - Prompts naming what's *already in the image* kept the style.
2. **MiniMax H3 Max was clearly the best** at treating the artwork as material rather than a disposable first frame. Its prompt rewriting was turned off for these runs.
   - Asked to build a glass whale, it built one out of the source's own planes and palette, and kept the original background and stars.
   - An "infinite dive" prompt produced a recursive zoom that stayed in style throughout, though the transitions between layers were boxy.
   - The "Living artwork" prompt (keep the image, drift the planes, slow push-in) produced the one clip Aaron genuinely liked: smooth, continuous motion that never left the artwork.
3. **Kling v3 Pro** kept the artwork but barely moved it, and added an unwanted lens-flare starburst. **Kling O3 Pro** held the artwork for two seconds, then turned it into a generic confetti burst.
4. **Hidden prompt rewriting matters.** LTX-2 adds `enable_prompt_expansion: true` even though it isn't in its published schema. MiniMax rewrites prompts by default. Turning this off seemed to help the model follow what was actually written.

## Rough edges hit (constructive feedback for fal)

- **An outage the status page missed.** `fal-ai/ltx-2/image-to-video/fast` failed every request that day with `downstream_service_error`, across three input variations, while fal's status page showed all systems operational.
- **Pricing.**
  - The pricing API returns one price per model, with no estimate endpoint, so resolution and audio rates had to come from each model page.
  - For Kling v3 Pro the API's $0.14/s matched neither of its page's rates ($0.112 / $0.168), and LTX-2.3's page listed two contradictory rate tables.
  - The final balance showed about 22% more spent than the lab's estimates ($7.78 against $6.10). The per-request usage endpoint needs admin key permissions, so this couldn't be reconciled from the tool.
- **Inconsistencies between models.**
  - The image field is named differently: `image_url` vs `start_image_url`.
  - Duration comes in three forms: `6`, `"5"` and `"4s"`.
  - Veo returns no width, height or fps for its output.
  - MiniMax H3 Max always generates audio, with no switch.

## Where it could go next (untested ideas)

- **First/last-frame generation,** with two real Chromaforge artworks as the endpoints, or the same image at both ends for a seamless loop.
- **Training a LoRA on Chromaforge's own animation exports.** Aaron's app already generates unlimited on-style 2D and 3D animation. fal's LTX-2.3 image-to-video trainer is about $4.80 for its default 2,000 steps.

## Honest bottom line

Aaron's conclusion was that current image-to-video models don't yet beat Chromaforge's own JavaScript animation for his style. He still found the experiment valuable, and he considers MiniMax H3 Max with a "work with what's there" prompt the promising direction.
