import { useState, useMemo } from 'react';
import {
  Share2,
  Search,
  Filter,
  Zap,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { RiskBadge, StatusBadge } from '@/components/shared/Badges';
import { DataSourceStatus } from '@/components/shared/DataSourceStatus';
import { ThreatDetailDrawer } from '@/components/shared/ThreatDetailDrawer';
import type { ThreatDetection, SocialPlatform, RiskLevel } from '@/types';

const PLATFORMS: (SocialPlatform | 'All')[] = ['All', 'Instagram', 'Facebook', 'LinkedIn', 'X', 'YouTube', 'TikTok', 'Telegram', 'Bluesky'];
const RISK_LEVELS: (RiskLevel | 'All')[] = ['All', 'Critical', 'High', 'Medium', 'Low'];

export function SocialMonitoringPage() {
  const { detections, isScanning, runScanning, sourceStatuses } = useApp();
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<SocialPlatform | 'All'>('All');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'All'>('All');
  const [sortBy, setSortBy] = useState<'risk' | 'name' | 'date'>('risk');
  const [selected, setSelected] = useState<ThreatDetection | null>(null);

  const socialDetections = useMemo(() => {
    let filtered = detections.filter((d) => d.assetType === 'Social Profile');

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.candidateName.toLowerCase().includes(q) ||
          d.platformOrStore.toLowerCase().includes(q) ||
          d.url.toLowerCase().includes(q) ||
          (d.bio || '').toLowerCase().includes(q)
      );
    }
    if (platformFilter !== 'All') {
      filtered = filtered.filter((d) => d.platformOrStore === platformFilter);
    }
    if (riskFilter !== 'All') {
      filtered = filtered.filter((d) => d.riskLevel === riskFilter);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'risk') return b.riskScore - a.riskScore;
      if (sortBy === 'name') return a.candidateName.localeCompare(b.candidateName);
      return new Date(b.lastScanned).getTime() - new Date(a.lastScanned).getTime();
    });

    return filtered;
  }, [detections, search, platformFilter, riskFilter, sortBy]);

  const counts = useMemo(() => {
    const all = detections.filter((d) => d.assetType === 'Social Profile');
    return {
      total: all.length,
      threats: all.filter((d) => !d.isOfficial && d.riskScore >= 25).length,
      official: all.filter((d) => d.isOfficial).length,
    };
  }, [detections]);

  if (detections.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Social Monitoring</h1>
          <p className="text-slate-400 text-sm">Detect fake and impersonating social media profiles</p>
        </div>
        <DataSourceStatus sources={sourceStatuses} />
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 mb-4">
            <Share2 size={32} className="text-sky-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No scan data yet</h2>
          <p className="text-slate-400 text-sm mb-6">Run a scan to detect suspicious social media profiles.</p>
          <button
            onClick={runScanning}
            disabled={isScanning}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-blue-500 transition-all disabled:opacity-50"
          >
            <Zap size={18} /> Run Scan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Social Monitoring</h1>
          <p className="text-xs text-amber-400/90">Bluesky public search plus sample profiles; other social networks are not connected</p>
          <p className="text-slate-400 text-sm">
            {counts.threats} suspicious · {counts.official} official · {counts.total} total
          </p>
        </div>
        <button
          onClick={runScanning}
          disabled={isScanning}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 transition-all"
        >
          {isScanning ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scanning...</>
          ) : (
            <><Zap size={16} /> Run Scan</>
          )}
        </button>
      </div>

      <DataSourceStatus sources={sourceStatuses} />

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, URL, or bio..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as SocialPlatform | 'All')}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none"
          >
            {PLATFORMS.map((p) => <option key={p} value={p}>{p === 'All' ? 'All Platforms' : p}</option>)}
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as RiskLevel | 'All')}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none"
          >
            {RISK_LEVELS.map((r) => <option key={r} value={r}>{r === 'All' ? 'All Risk Levels' : r}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'risk' | 'name' | 'date')}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none"
          >
            <option value="risk">Sort: Risk Score</option>
            <option value="name">Sort: Name</option>
            <option value="date">Sort: Date</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {socialDetections.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Filter size={28} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No profiles match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {socialDetections.map((det) => (
            <button
              key={det.id}
              onClick={() => setSelected(det)}
              className="text-left bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:bg-slate-800/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white truncate group-hover:text-sky-400 transition-colors">
                      {det.candidateName}
                    </h3>
                    {det.isOfficial && <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{det.platformOrStore}</p>
                </div>
                <RiskBadge level={det.riskLevel} />
              </div>

              {det.bio && (
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{det.bio}</p>
              )}

              <div className="flex flex-wrap gap-1.5 mb-3">
                {det.detectionReasons.slice(0, 2).map((reason, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                    {reason.length > 40 ? reason.slice(0, 40) + '...' : reason}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-xs text-slate-500">Score: {det.riskScore}/100 · Sim: {det.similarityScore}%</span>
                <StatusBadge status={det.status} />
              </div>

              {det.isOfficial && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-400">
                  <Info size={10} /> Official registered asset — excluded from alerts
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <ThreatDetailDrawer
        detection={detections.find((detection) => detection.id === selected?.id) ?? selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
