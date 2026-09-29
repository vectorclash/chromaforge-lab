import type { ParamSpec, ParamValue } from '../../shared/models.config';

export function ParamField({ spec, value, onChange }: { spec: ParamSpec; value: ParamValue; onChange: (v: ParamValue) => void }) {
  switch (spec.kind) {
    case 'enum':
      return (
        <label className="field">
          <span>{spec.label}</span>
          <select
            value={String(value)}
            onChange={(e) => onChange(spec.options.find((o) => String(o) === e.target.value) ?? e.target.value)}
          >
            {spec.options.map((o) => (
              <option key={String(o)} value={String(o)}>
                {String(o)}
              </option>
            ))}
          </select>
        </label>
      );
    case 'boolean':
      return (
        <label className="field field-check">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span>{spec.label}</span>
        </label>
      );
    case 'number':
      return (
        <label className="field">
          <span>
            {spec.label} <em>{Number(value).toFixed(2)}</em>
          </span>
          <input
            type="range"
            min={spec.min}
            max={spec.max}
            step={spec.step}
            value={Number(value)}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </label>
      );
    case 'text':
      return (
        <label className="field">
          <span>{spec.label}</span>
          <input type="text" value={String(value)} onChange={(e) => onChange(e.target.value)} />
        </label>
      );
  }
}
