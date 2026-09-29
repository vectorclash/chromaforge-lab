import { useEffect, useState } from 'react';
import type { Job } from '../../shared/types';

const LABEL: Record<Job['status'], string> = {
  submitting: 'Submitting',
  IN_QUEUE: 'In queue',
  IN_PROGRESS: 'Generating',
  downloading: 'Downloading',
  done: 'Done',
  failed: 'Failed'
};

export function RunStatus({ job }: { job: Job }) {
  const [now, setNow] = useState(Date.now());
  const live = job.status !== 'done' && job.status !== 'failed';
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [live]);
  const elapsed = Math.round((now - Date.parse(job.startedAt)) / 1000);

  return (
    <div className={`status status-${job.status}`}>
      <div className="status-row">
        {live && <span className="spinner" aria-hidden />}
        <strong>{LABEL[job.status]}</strong>
        {job.queuePosition != null && <span>position {job.queuePosition}</span>}
        {live && <span className="muted">{elapsed}s</span>}
      </div>
      {job.logs.length > 0 && live && <pre className="logs">{job.logs.slice(-4).join('\n')}</pre>}
      {job.error && <p className="error">{job.error}</p>}
      {job.requestId && job.status === 'failed' && <p className="muted mono">fal request {job.requestId}</p>}
    </div>
  );
}
