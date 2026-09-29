import { useState } from 'react';
import type { RunSidecar } from '../../shared/types';
import { getModel } from '../../shared/models.config';
import { outputUrl, sourceUrl } from '../api';

export function ResultPlayer({ run }: { run: RunSidecar }) {
  const [loop, setLoop] = useState(true);
  const model = getModel(run.modelId);
  // Not every model reports dimensions/fps (Veo doesn't), so fall back to what the
  // browser reads off the file itself.
  const reported = run.falVideo as { width?: number; height?: number; fps?: number; duration?: number };
  const [probed, setProbed] = useState<{ w: number; h: number; d: number } | null>(null);
  const width = reported.width ?? probed?.w;
  const height = reported.height ?? probed?.h;
  const seconds = reported.duration ?? probed?.d;
  const facts = [
    width && height ? `${width}×${height}` : null,
    reported.fps ? `${reported.fps}fps` : null,
    seconds ? `${seconds.toFixed(2)}s` : null
  ].filter(Boolean);
  return (
    <section className="panel player">
      <video
        key={run.video}
        src={outputUrl(run.video)}
        controls
        autoPlay
        loop={loop}
        playsInline
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          setProbed({ w: el.videoWidth, h: el.videoHeight, d: el.duration });
        }}
      />
      <div className="player-meta">
        <label className="field-check">
          <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
          <span>Loop</span>
        </label>
        <span>{model?.label ?? run.modelId}</span>
        {facts.length > 0 && <span>{facts.join(' · ')}</span>}
        <span>~${run.estimatedCostUsd.toFixed(2)}</span>
        <a href={outputUrl(run.video)} download>
          Download
        </a>
      </div>
      <p className="player-prompt">{run.prompt}</p>
      <p className="muted mono">
        <img className="player-thumb" src={sourceUrl(run.sourceFile)} alt="" /> {run.sourceFile} · {run.requestId}
      </p>
    </section>
  );
}
