import { CheckCircle2, Database, WifiOff } from 'lucide-react';
import type { DataSourceStatus as DataSourceStatusItem } from '@/types';

export function DataSourceStatus({ sources }: { sources: DataSourceStatusItem[] }) {
  return (
    <section
      aria-label="Scan data sources"
      className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <Database size={15} className="text-slate-400" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Scan data sources</h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {sources.map((source) => {
          const connected = source.status === 'connected';
          const demo = source.status === 'demo';
          const notChecked = source.status === 'not_checked';
          const Icon = connected ? CheckCircle2 : WifiOff;
          const statusLabel = demo ? 'Demo' : connected ? 'Connected' : notChecked ? 'Not checked' : 'Unavailable';
          return (
            <div key={source.name} className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
              <div className="flex items-center gap-2">
                <Icon size={14} className={connected ? 'text-emerald-400' : demo ? 'text-amber-400' : 'text-slate-500'} />
                <p className="truncate text-xs font-medium text-slate-200">{source.name}</p>
                <span className={`ml-auto flex-shrink-0 text-[10px] uppercase ${
                  connected ? 'text-emerald-400' : demo ? 'text-amber-400' : 'text-slate-500'
                }`}>
                  {statusLabel}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">{source.detail}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
