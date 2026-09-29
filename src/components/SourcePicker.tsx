import { useRef, useState } from 'react';
import { api, sourceUrl, type Uploaded } from '../api';

type Props = {
  source: Uploaded | null;
  sources: string[];
  onSource: (s: Uploaded) => void;
  onSourcesChanged: () => void;
};

export function SourcePicker({ source, sources, onSource, onSourcesChanged }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function run(label: string, work: () => Promise<Uploaded>) {
    setBusy(label);
    setError(null);
    try {
      onSource(await work());
      onSourcesChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const takeFile = (file: File | undefined) => file && run(`Uploading ${file.name}…`, () => api.uploadFile(file));

  return (
    <section className="panel">
      <h2>Source</h2>
      <div
        className={`drop ${over ? 'drop-over' : ''} ${source ? 'drop-filled' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          takeFile(e.dataTransfer.files[0]);
        }}
        onClick={() => input.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
      >
        {source ? (
          <img src={sourceUrl(source.sourceFile)} alt={source.sourceFile} />
        ) : (
          <span>Drop a Chromaforge PNG or JPEG here, or click to choose</span>
        )}
        {busy && <div className="drop-busy">{busy}</div>}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(e) => takeFile(e.target.files?.[0])}
      />
      <label className="field">
        <span>From sources/</span>
        <select
          value={source?.sourceFile ?? ''}
          onChange={(e) => e.target.value && run(`Uploading ${e.target.value}…`, () => api.uploadSource(e.target.value))}
        >
          <option value="">Choose a file…</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
