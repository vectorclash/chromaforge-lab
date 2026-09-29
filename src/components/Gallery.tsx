import type { RunSidecar } from '../../shared/types';
import { getModel } from '../../shared/models.config';
import { outputUrl } from '../api';

// preload="metadata" lets a browser load the dimensions without painting a frame, so an
// idle card was a black box until hovered. Starting at a media-fragment time makes it
// decode and show that frame.
const POSTER_TIME = 0.1;

type Props = { runs: RunSidecar[]; selected: string | null; onSelect: (r: RunSidecar) => void };

export function Gallery({ runs, selected, onSelect }: Props) {
  if (runs.length === 0) return <p className="muted">No runs yet. Finished clips land in outputs/ and show up here.</p>;
  return (
    <div className="gallery">
      {runs.map((r) => (
        <button
          key={r.video}
          className={`card ${selected === r.video ? 'card-selected' : ''}`}
          onClick={() => onSelect(r)}
          onMouseEnter={(e) => e.currentTarget.querySelector('video')?.play().catch(() => {})}
          onMouseLeave={(e) => {
            const v = e.currentTarget.querySelector('video');
            if (v) {
              v.pause();
              v.currentTime = POSTER_TIME;
            }
          }}
        >
          <video src={`${outputUrl(r.video)}#t=${POSTER_TIME}`} muted loop playsInline preload="metadata" />
          <span className="card-title">{getModel(r.modelId)?.label ?? r.modelId}</span>
          <span className="card-meta">
            {r.duration}s · ~${r.estimatedCostUsd.toFixed(2)} · {new Date(r.timestamp).toLocaleString()}
          </span>
          <span className="card-prompt">{r.prompt}</span>
        </button>
      ))}
    </div>
  );
}
