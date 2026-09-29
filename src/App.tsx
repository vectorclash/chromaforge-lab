import { useCallback, useEffect, useMemo, useState } from 'react';
import { MODELS, defaultParams, getModel, type ModelConfig, type ParamValue } from '../shared/models.config';
import { AUDIO_PRESETS, MOTION_PRESETS } from '../shared/promptPresets';
import type { Job, PriceEstimate, RunSidecar, SpendState } from '../shared/types';
import { api, type Uploaded } from './api';
import { SourcePicker } from './components/SourcePicker';
import { ParamField } from './components/ParamField';
import { RunStatus } from './components/RunStatus';
import { ResultPlayer } from './components/ResultPlayer';
import { Gallery } from './components/Gallery';

const PREFS_KEY = 'cf-lab:prefs';
type Prefs = { modelId?: string; motion?: string; sound?: string };

function loadPrefs(): Prefs {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function settingsFor(model: ModelConfig) {
  return { duration: model.defaultDuration, resolution: model.defaultResolution, params: defaultParams(model) };
}

export default function App() {
  const prefs = useMemo(loadPrefs, []);
  const [model, setModel] = useState<ModelConfig>(getModel(prefs.modelId ?? '') ?? MODELS[0]);
  const [settings, setSettings] = useState(() => settingsFor(model));
  const [motion, setMotion] = useState(prefs.motion ?? MOTION_PRESETS[0].prompt);
  const [sound, setSound] = useState(prefs.sound ?? AUDIO_PRESETS[0].prompt);
  const [source, setSource] = useState<Uploaded | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [estimate, setEstimate] = useState<PriceEstimate | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [acceptStale, setAcceptStale] = useState(false);
  const [spend, setSpend] = useState<SpendState | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [runs, setRuns] = useState<RunSidecar[]>([]);
  const [selected, setSelected] = useState<RunSidecar | null>(null);

  const audioOn = Boolean(settings.params.generate_audio);
  const prompt = audioOn && sound.trim() ? `${motion.trim()} Audio: ${sound.trim()}` : motion.trim();
  const invalid = model.validate?.({ ...settings.params, duration: settings.duration, resolution: settings.resolution }) ?? null;
  const jobLive = job !== null && job.status !== 'done' && job.status !== 'failed';

  const refreshSources = useCallback(() => api.sources().then(setSources).catch(() => {}), []);
  const refreshRuns = useCallback(
    () =>
      api
        .runs()
        .then((r) => {
          setRuns(r);
          setSelected((s) => s ?? r[0] ?? null);
        })
        .catch(() => {}),
    []
  );
  const refreshSpend = useCallback(() => api.spend().then(setSpend).catch(() => {}), []);

  useEffect(() => {
    refreshSources();
    refreshRuns();
    refreshSpend();
  }, [refreshSources, refreshRuns, refreshSpend]);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ modelId: model.id, motion, sound }));
    } catch {
      // Private window or blocked storage: prefs just won't persist.
    }
  }, [model.id, motion, sound]);

  // Re-price whenever anything that affects cost changes. The server also checks fal's live
  // price, which is what can flag an estimate as stale.
  useEffect(() => {
    let cancelled = false;
    setAcceptStale(false);
    const t = setTimeout(() => {
      api
        .pricing(model.id, settings.duration, settings.resolution, settings.params)
        .then((e) => {
          if (cancelled) return;
          setEstimate(e);
          setEstimateError(null);
        })
        .catch((err) => {
          if (cancelled) return;
          setEstimate(null);
          setEstimateError(err.message);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [model.id, settings]);

  // Poll the running job.
  useEffect(() => {
    if (!job || !jobLive) return;
    const t = setInterval(async () => {
      try {
        const next = await api.job(job.id);
        setJob(next);
        if (next.status === 'done' || next.status === 'failed') {
          refreshSpend();
          if (next.run) {
            await refreshRuns();
            setSelected(next.run);
          }
        }
      } catch (err) {
        setJob({ ...job, status: 'failed', error: (err as Error).message });
      }
    }, 1500);
    return () => clearInterval(t);
  }, [job, jobLive, refreshRuns, refreshSpend]);

  function pickModel(id: string) {
    const m = getModel(id)!;
    setModel(m);
    setSettings(settingsFor(m));
  }

  const setParam = (key: string, v: ParamValue) => setSettings((s) => ({ ...s, params: { ...s.params, [key]: v } }));

  const overCap = estimate && spend ? estimate.usd > spend.remainingUsd + 1e-9 : false;
  const blocker = !source
    ? 'Choose a source image.'
    : !motion.trim()
      ? 'Write a motion prompt.'
      : prompt.length > model.maxPromptLength
        ? `${model.label} accepts prompts up to ${model.maxPromptLength} characters; this one is ${prompt.length}. Shorten the motion or sound text.`
        : invalid
          ? invalid
        : !estimate
          ? (estimateError ?? 'Pricing…')
          : overCap
            ? `Over the session cap: $${spend!.remainingUsd.toFixed(2)} of $${spend!.capUsd.toFixed(2)} left. Raise SPEND_CAP_USD in .env and restart.`
            : estimate.stale && !acceptStale
              ? 'Confirm the stale price to run.'
              : jobLive
                ? 'A run is in progress.'
                : null;

  async function run() {
    if (blocker || !source) return;
    setRunError(null);
    try {
      const started = await api.animate({
        modelId: model.id,
        imageUrl: source.imageUrl,
        sourceFile: source.sourceFile,
        prompt,
        duration: settings.duration,
        resolution: settings.resolution,
        params: settings.params,
        acceptStalePrice: acceptStale
      });
      setJob(started);
      refreshSpend();
    } catch (err) {
      setRunError((err as Error).message);
      refreshSpend();
    }
  }

  return (
    <div className="app">
      <header className="top">
        <h1>
          <span className="wordmark-a">CHROMA</span>
          <span className="wordmark-b">FORGE</span> <span className="lab">Lab</span>
        </h1>
        {spend && (
          <div className="spend" title="Per server session; resets when the server restarts">
            <span>
              Session spend <strong>${spend.spentUsd.toFixed(2)}</strong> / ${spend.capUsd.toFixed(2)}
            </span>
            <div className="meter">
              <div style={{ width: `${Math.min(100, ((spend.spentUsd + spend.reservedUsd) / spend.capUsd) * 100)}%` }} />
            </div>
          </div>
        )}
      </header>

      <main className="layout">
        <aside className="controls">
          <SourcePicker source={source} sources={sources} onSource={setSource} onSourcesChanged={refreshSources} />

          <section className="panel">
            <h2>Model</h2>
            <label className="field">
              <span>Model</span>
              <select value={model.id} onChange={(e) => pickModel(e.target.value)}>
                {(['iterate', 'premium'] as const).map((tier) => (
                  <optgroup key={tier} label={tier === 'iterate' ? 'Iterate' : 'Premium'}>
                    {MODELS.filter((m) => m.tier === tier).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <p className="muted small">{model.notes}</p>
            <div className="row">
              <label className="field">
                <span>Duration</span>
                <select
                  value={settings.duration}
                  onChange={(e) => setSettings((s) => ({ ...s, duration: Number(e.target.value) }))}
                >
                  {model.durations.map((d) => (
                    <option key={d} value={d}>
                      {d}s
                    </option>
                  ))}
                </select>
              </label>
              {model.resolutions && (
                <label className="field">
                  <span>Resolution</span>
                  <select
                    value={settings.resolution ?? ''}
                    onChange={(e) => setSettings((s) => ({ ...s, resolution: e.target.value }))}
                  >
                    {model.resolutions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {model.params.map((spec) => (
              <ParamField key={spec.key} spec={spec} value={settings.params[spec.key]} onChange={(v) => setParam(spec.key, v)} />
            ))}
          </section>

          <section className="panel">
            <h2>Prompt</h2>
            <div className="chips">
              {MOTION_PRESETS.map((p) => (
                <button key={p.name} className={`chip ${motion === p.prompt ? 'chip-on' : ''}`} onClick={() => setMotion(p.prompt)}>
                  {p.name}
                </button>
              ))}
            </div>
            <textarea value={motion} onChange={(e) => setMotion(e.target.value)} rows={6} placeholder="Describe the motion…" />
            <p className={`small ${prompt.length > model.maxPromptLength ? 'error' : 'muted'}`}>
              {prompt.length.toLocaleString()} / {model.maxPromptLength.toLocaleString()} characters{audioOn ? ' incl. sound' : ''}
            </p>
            {audioOn && (
              <>
                <h3>Sound</h3>
                <div className="chips">
                  {AUDIO_PRESETS.map((p) => (
                    <button key={p.name} className={`chip ${sound === p.prompt ? 'chip-on' : ''}`} onClick={() => setSound(p.prompt)}>
                      {p.name}
                    </button>
                  ))}
                </div>
                <textarea value={sound} onChange={(e) => setSound(e.target.value)} rows={3} placeholder="Describe the audio…" />
                <p className="muted small">Appended to the prompt as “Audio: …” — these models take one prompt for both.</p>
              </>
            )}
          </section>

          <section className="panel run">
            {estimate ? (
              <p className="estimate">
                <span className="muted">Estimate</span> <strong>{estimate.breakdown}</strong>
              </p>
            ) : (
              <p className="muted">{estimateError ?? 'Pricing…'}</p>
            )}
            {estimate?.stale && (
              <label className="stale">
                <input type="checkbox" checked={acceptStale} onChange={(e) => setAcceptStale(e.target.checked)} />
                <span>{estimate.staleReason} Run anyway at this estimate?</span>
              </label>
            )}
            <button className="run-btn" disabled={Boolean(blocker)} onClick={run}>
              {jobLive ? 'Running…' : `Run${estimate ? ` · ~$${estimate.usd.toFixed(2)}` : ''}`}
            </button>
            {blocker && !jobLive && <p className="muted small">{blocker}</p>}
            {runError && <p className="error">{runError}</p>}
            {job && <RunStatus job={job} />}
          </section>
        </aside>

        <section className="results">
          {selected ? <ResultPlayer run={selected} /> : <div className="panel empty">Your clip will play here.</div>}
          <h2 className="gallery-title">Past runs</h2>
          <Gallery runs={runs} selected={selected?.video ?? null} onSelect={setSelected} />
        </section>
      </main>
    </div>
  );
}
