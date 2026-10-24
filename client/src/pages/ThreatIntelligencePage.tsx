import { useState, useMemo, useEffect } from 'react';
import {
  Flag,
  Search,
  Filter,
  Zap,
  Download,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { RiskBadge, StatusBadge } from '@/components/shared/Badges';
import { ThreatDetailDrawer } from '@/components/shared/ThreatDetailDrawer';
import { exportDetectionsCSV } from '@/lib/csvExport';
import type { ThreatDetection, AssetType, RiskLevel, InvestigationStatus } from '@/types';

const ASSET_TYPES: (AssetType | 'All')[] = ['All', 'Social Profile', 'Mobile App'];
const RISK_LEVELS: (RiskLevel | 'All')[] = ['All', 'Critical', 'High', 'Medium', 'Low'];
const STATUSES: (InvestigationStatus | 'All')[] = ['All', 'New', 'Investigating', 'Confirmed Threat', 'False Positive', 'Resolved', 'Closed'];
const PAGE_SIZE = 10;

export function ThreatIntelligencePage() {
  const { detections, isScanning, runScanning, focusedDetectionId, clearFocusedDetection } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<AssetType | 'All'>('All');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<InvestigationStatus | 'All'>('All');
  const [showOfficial, setShowOfficial] = useState(false);
  const [queueView, setQueueView] = useState(true);
  const [sortBy, setSortBy] = useState<'risk' | 'name' | 'date'>('risk');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ThreatDetection | null>(null);

  useEffect(() => {
    if (!focusedDetectionId) return;
    const detection = detections.find((item) => item.id === focusedDetectionId);
    if (!detection) return;
    setQueueView(false);
    setShowOfficial(detection.isOfficial);
    setSelected(detection);
    clearFocusedDetection();
  }, [focusedDetectionId, detections, clearFocusedDetection]);

  const filtered = useMemo(() => {
    let result = [...detections];

    if (!showOfficial) {
      result = result.filter((d) => !d.isOfficial);
    }
    if (queueView) {
      result = result.filter((d) =>
        d.riskScore >= 50 && !['False Positive', 'Resolved', 'Closed'].includes(d.status),
      );
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.candidateName.toLowerCase().includes(q) ||
          d.platformOrStore.toLowerCase().includes(q) ||
          d.url.toLowerCase().includes(q) ||
          d.detectionReasons.some((r) => r.toLowerCase().includes(q))
      );
    }
    if (typeFilter !== 'All') result = result.filter((d) => d.assetType === typeFilter);
    if (riskFilter !== 'All') result = result.filter((d) => d.riskLevel === riskFilter);
    if (statusFilter !== 'All') result = result.filter((d) => d.status === statusFilter);

    result.sort((a, b) => {
      if (sortBy === 'risk') return b.riskScore - a.riskScore;
      if (sortBy === 'name') return a.candidateName.localeCompare(b.candidateName);
      return new Date(b.lastScanned).getTime() - new Date(a.lastScanned).getTime();
    });

    return result;
  }, [detections, search, typeFilter, riskFilter, statusFilter, showOfficial, sortBy, queueView]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const priorityQueueCount = detections.filter((detection) =>
    !detection.isOfficial
    && detection.riskScore >= 50
    && !['False Positive', 'Resolved', 'Closed'].includes(detection.status),
  ).length;
  const inReviewCount = detections.filter((detection) => detection.status === 'Investigating').length;
  const confirmedCount = detections.filter((detection) => detection.status === 'Confirmed Threat').length;

  function handleCSVExport() {
    exportDetectionsCSV(filtered, `threat_intelligence_${Date.now()}.csv`);
  }

  if (detections.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Threat Intelligence</h1>
          <p className="text-slate-400 text-sm">Centralized view of all detected threats</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 mb-4">
            <Flag size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No threat data yet</h2>
          <p className="text-slate-400 text-sm mb-6">Run a scan to populate the threat intelligence center.</p>
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
          <h1 className="text-2xl font-bold text-white mb-1">Threat Intelligence</h1>
          <p className="text-slate-400 text-sm">{filtered.length} records {showOfficial ? '(including official)' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCSVExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
          <button
            onClick={runScanning}
            disabled={isScanning}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 transition-all"
          >
            {isScanning ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scanning...</>
            ) : (
              <><Zap size={16} /> Rescan</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Prioritized open queue', value: priorityQueueCount, description: 'Risk score 50+ · sorted highest first', color: 'text-red-300' },
          { label: 'Under investigation', value: inReviewCount, description: 'Analyst review in progress', color: 'text-violet-300' },
          { label: 'Confirmed threats', value: confirmedCount, description: 'Eligible for evidence-based report drafts', color: 'text-amber-300' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">{item.label}</p>
            <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="mt-1 text-xs text-slate-500">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => { setQueueView(true); setPage(0); }}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${queueView ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          Open priority queue
        </button>
        <button
          onClick={() => { setQueueView(false); setPage(0); }}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${!queueView ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          All detections
        </button>
        {queueView && <span className="text-xs text-slate-500">False positives and closed cases stay out of this queue.</span>}
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search threats..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as AssetType | 'All'); setPage(0); }} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none">
              {ASSET_TYPES.map((t) => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
            </select>
            <select value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value as RiskLevel | 'All'); setPage(0); }} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none">
              {RISK_LEVELS.map((r) => <option key={r} value={r}>{r === 'All' ? 'All Risk' : r}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as InvestigationStatus | 'All'); setPage(0); }} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none">
              {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'risk' | 'name' | 'date')} className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-sky-500 focus:outline-none">
              <option value="risk">Sort: Risk</option>
              <option value="name">Sort: Name</option>
              <option value="date">Sort: Date</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input type="checkbox" checked={showOfficial} onChange={(e) => { setShowOfficial(e.target.checked); setPage(0); }} className="accent-sky-500" />
          Show official/excluded assets
        </label>
      </div>

      {/* Table */}
      {pageData.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Filter size={28} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No threats match your filters.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs">
                  <th className="text-left px-4 py-3 font-medium">Asset Name</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Platform/Store</th>
                  <th className="text-left px-4 py-3 font-medium">Risk</th>
                  <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Detection Reasons</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Last Scanned</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((det) => (
                  <tr
                    key={det.id}
                    onClick={() => setSelected(det)}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{det.candidateName}</span>
                        {det.isOfficial && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">OFFICIAL</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{det.assetType}</td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{det.platformOrStore}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <RiskBadge level={det.riskLevel} />
                        <span className="text-xs text-slate-500">{det.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-slate-400 line-clamp-1 max-w-xs">
                        {det.detectionReasons.join('; ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <StatusBadge status={det.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden xl:table-cell">
                      {new Date(det.lastScanned).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <ExternalLink size={14} className="text-slate-600" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Page {page + 1} of {totalPages} · {filtered.length} records
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
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
