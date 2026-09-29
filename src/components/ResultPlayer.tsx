import { useState } from 'react';
import type { RunSidecar } from '../../shared/types';
import { getModel } from '../../shared/models.config';
import { outputUrl, sourceUrl } from '../api';

export function ResultPlayer({ run }: { run: RunSidecar }) {
  const [loop, setLoop] = useState(true);
  const model = getModel(run.modelId);
  const v = run.falVideo as { width?: number; height?: number; fps?: number; duration?: number };
  return (
    <section className="panel player">
      <video key={run.video} src={outputUrl(run.video)} controls autoPlay loop={loop} playsInline />
      <div className="player-meta">
        <label className="field-check">
          <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
          <span>Loop</span>
        </label>
        <span>{model?.label ?? run.modelId}</span>
        <span>
          {v.width}×{v.height} · {v.fps}fps · {v.duration?.toFixed(2)}s
        </span>
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
