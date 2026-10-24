import {
  Shield,
  Share2,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Zap,
  ArrowRight,
  Clock,
  TrendingUp,
  X,
  Bell,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { RiskBadge, StatusBadge } from '@/components/shared/Badges';
import { DataSourceStatus } from '@/components/shared/DataSourceStatus';
import {
  calculateMetrics,
  getThreatDistribution,
  getSocialVsAppThreats,
} from '@/lib/metrics';
import type { NavSection } from '@/types';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const RISK_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#10b981',
};

export function OverviewPage() {
  const { detections, lastScanTime, isScanning, runScanning, openDetection, setActiveSection, sourceStatuses, highRiskAlerts, dismissHighRiskAlert } = useApp();
  const metrics = calculateMetrics(detections);
  const threatDist = getThreatDistribution(detections);
  const socialVsApp = getSocialVsAppThreats(detections);
  const recentDetections = [...detections]
    .filter((d) => !d.isOfficial && d.riskScore >= 25)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 8);

  const goTo = (section: NavSection) => setActiveSection(section);

  if (detections.length === 0 && !isScanning) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Overview</h1>
          <p className="text-slate-400 text-sm">Detect impersonation. Protect your brand.</p>
        </div>
        <DataSourceStatus sources={sourceStatuses} />
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 mb-4">
            <Shield size={32} className="text-sky-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No scan data yet</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Run your first scan to detect fake social media accounts, impersonating pages, and suspicious apps targeting your brand.
          </p>
          <button
            onClick={runScanning}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-blue-500 transition-all"
          >
            <Zap size={18} />
            Run First Scan
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Assets Scanned',
      value: metrics.totalScanned,
      icon: Activity,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
    },
    {
      label: 'Suspicious Social Profiles',
      value: metrics.suspiciousSocial,
      icon: Share2,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
    },
    {
      label: 'Suspicious Mobile Apps',
      value: metrics.suspiciousApps,
      icon: Smartphone,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    {
      label: 'Critical + High Risk',
      value: metrics.criticalCount + metrics.highCount,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Official Assets Protected',
      value: metrics.officialProtected,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Total Threats Detected',
      value: metrics.totalThreats,
      icon: TrendingUp,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Overview</h1>
          <p className="text-slate-400 text-sm">Bluesky and Apple App Store public search plus a clearly labeled sample dataset</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 tracking-wider">Team</span>
            <span className="text-xs font-bold text-cyan-400 tracking-wide">AURA_X</span>
          </div>
          {lastScanTime && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock size={14} />
              {new Date(lastScanTime).toLocaleString()}
            </div>
          )}
          <button
            onClick={runScanning}
            disabled={isScanning}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 transition-all"
          >
            {isScanning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Zap size={16} />
                Scan Now
              </>
            )}
          </button>
        </div>
      </div>

      <DataSourceStatus sources={sourceStatuses} />

      {highRiskAlerts.length > 0 && (
        <section aria-label="New high-risk alerts" className="rounded-xl border border-red-500/30 bg-red-950/30 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Bell size={16} className="text-red-300" />
            <h2 className="text-sm font-semibold text-red-100">New high-risk detections</h2>
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-200">{highRiskAlerts.length}</span>
          </div>
          <div className="space-y-2">
            {highRiskAlerts.map((alert) => {
              const detection = detections.find((item) => item.id === alert.detectionId);
              if (!detection) return null;
              return (
                <div key={alert.detectionId} className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/40 px-3 py-2">
                  <button
                    onClick={() => openDetection(detection.id)}
                    className="min-w-0 text-left"
                  >
                    <span className="block truncate text-sm font-medium text-white">{detection.candidateName}</span>
                    <span className="text-xs text-red-200">{detection.platformOrStore} · risk {detection.riskScore}/100</span>
                  </button>
                  <button
                    onClick={() => dismissHighRiskAlert(alert.detectionId)}
                    aria-label={`Dismiss alert for ${detection.candidateName}`}
                    className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-red-200/70">Alerts are generated once per detection at risk score 50 or higher.</p>
        </section>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
            >
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${card.bg} mb-3`}>
                <Icon size={18} className={card.color} />
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-slate-400 mt-1 leading-tight">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Threat Distribution by Risk Level</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={threatDist}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={2}
              >
                {threatDist.map((entry) => (
                  <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Social vs App Threats</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={socialVsApp}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Bar dataKey="threats" name="Threats" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="official" name="Official" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent detections */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Recent Detections</h3>
          <button
            onClick={() => goTo('Threat Intelligence')}
            className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 font-medium"
          >
            View All Threats
            <ArrowRight size={14} />
          </button>
        </div>
        {recentDetections.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No threats detected. Your brand looks clean.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs">
                  <th className="text-left px-6 py-3 font-medium">Asset Name</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Platform</th>
                  <th className="text-left px-4 py-3 font-medium">Risk</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDetections.map((det) => (
                  <tr
                    key={det.id}
                    onClick={() => goTo('Threat Intelligence')}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-3 text-white font-medium">{det.candidateName}</td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{det.assetType}</td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{det.platformOrStore}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <RiskBadge level={det.riskLevel} />
                        <span className="text-xs text-slate-500">{det.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <StatusBadge status={det.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AURA_X footer identity */}
      <div className="flex items-center justify-center gap-2 pt-4 pb-2">
        <span className="text-[10px] text-slate-600 tracking-wider">Powered by</span>
        <span className="text-xs font-bold text-cyan-400/70 tracking-wide">AURA_X</span>
        <span className="text-[10px] text-slate-600">·</span>
        <span className="text-[10px] text-slate-600">Trustguard AI</span>
      </div>
    </div>
  );
}
