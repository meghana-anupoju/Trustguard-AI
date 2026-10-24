import type { RiskLevel, InvestigationStatus } from '@/types';

const riskColors: Record<RiskLevel, string> = {
  Low: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Medium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  High: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  Critical: 'bg-red-500/15 text-red-300 border-red-500/30',
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${riskColors[level]}`}
    >
      {level}
    </span>
  );
}

const statusColors: Record<InvestigationStatus, string> = {
  New: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  Investigating: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'Confirmed Threat': 'bg-red-500/15 text-red-300 border-red-500/30',
  'False Positive': 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  Resolved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Closed: 'bg-slate-600/20 text-slate-300 border-slate-500/30',
};

export function StatusBadge({ status }: { status: InvestigationStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[status]}`}
    >
      {status}
    </span>
  );
}
