import { useMemo } from 'react';
import {
  FileBarChart,
  Download,
  Printer,
  Activity,
  Share2,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { RiskBadge, StatusBadge } from '@/components/shared/Badges';
import { AuraLogo } from '@/components/shared/AuraLogo';
import { calculateMetrics, getPlatformBreakdown } from '@/lib/metrics';
import { exportFullReportCSV, exportDetectionsCSV } from '@/lib/csvExport';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function ReportsPage() {
  const { detections, brandProfile, lastScanTime, settings, scanHistory } = useApp();
  const metrics = calculateMetrics(detections);
  const platformBreakdown = getPlatformBreakdown(detections);

  const reportRows = useMemo(() => {
    return detections.filter((d) => !d.isOfficial || d.riskScore > 0);
  }, [detections]);

  function handleFullExport() {
    exportFullReportCSV(detections, brandProfile.companyName, lastScanTime, settings.demoMode ? 'Demo Dataset' : 'Live Source');
  }

  function handleFilteredExport() {
    const filtered = detections.filter((d) => !d.isOfficial && d.riskScore >= 25);
    exportDetectionsCSV(filtered, `trustguard_threats_${Date.now()}.csv`);
  }

  function handlePrint() {
    window.print();
  }

  if (detections.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Reports</h1>
          <p className="text-slate-400 text-sm">Export and review threat detection reports</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 mb-4">
            <FileBarChart size={32} className="text-sky-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No report data yet</h2>
          <p className="text-slate-400 text-sm">Run a scan to generate reports.</p>
        </div>
      </div>
    );
  }

  const summaryItems = [
    { label: 'Total Records Scanned', value: metrics.totalScanned, icon: Activity, color: 'text-sky-400' },
    { label: 'Social Threats', value: metrics.suspiciousSocial, icon: Share2, color: 'text-orange-400' },
    { label: 'Suspicious Apps', value: metrics.suspiciousApps, icon: Smartphone, color: 'text-red-400' },
    { label: 'High + Critical', value: metrics.criticalCount + metrics.highCount, icon: AlertTriangle, color: 'text-amber-400' },
    { label: 'Official Excluded', value: metrics.officialProtected, icon: CheckCircle2, color: 'text-emerald-400' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Reports</h1>
          <p className="text-slate-400 text-sm">Threat detection summary and export</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            <Printer size={16} /> Print
          </button>
          <button
            onClick={handleFilteredExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            <Download size={16} /> Export Threats
          </button>
          <button
            onClick={handleFullExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-blue-500 transition-all"
          >
            <Download size={16} /> Full Report
          </button>
        </div>
      </div>

      {/* Report header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <AuraLogo size={48} className="flex-shrink-0 print:opacity-90" />
            <div>
              <h2 className="text-lg font-bold text-white">Trustguard AI — Threat Report</h2>
              <p className="text-sm text-slate-400 mt-1">Brand: {brandProfile.companyName}</p>
              <p className="text-xs text-cyan-400 mt-0.5">AURA_X · HacXLerate 2026</p>
            </div>
          </div>
          <div className="flex flex-col gap-1 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Clock size={12} />
              {lastScanTime ? new Date(lastScanTime).toLocaleString() : 'No scan yet'}
            </div>
            <div className="flex items-center gap-2">
              <Database size={12} />
              {settings.demoMode ? 'Demo Dataset' : 'Live Source'}
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {summaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <Icon size={18} className={`${item.color} mb-2`} />
                <p className="text-2xl font-bold text-white">{item.value}</p>
                <p className="text-xs text-slate-400 mt-1">{item.label}</p>
              </div>
            );
          })}
        </div>

        {/* Platform breakdown */}
        {platformBreakdown.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white mb-3">Threat Breakdown by Platform</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={platformBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-6 py-4">
          <h3 className="text-sm font-semibold text-white">Recent Scan History</h3>
          <p className="mt-1 text-xs text-slate-500">Stored by the backend in SQLite, including source availability.</p>
        </div>
        {scanHistory.length === 0 ? (
          <p className="px-6 py-5 text-sm text-slate-400">No backend scan history is available yet. Run a scan while the API is connected.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
                  <th className="px-5 py-3 font-medium">Scan time</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3 font-medium">Assets</th>
                  <th className="px-5 py-3 font-medium">Threats</th>
                  <th className="px-5 py-3 font-medium">Official excluded</th>
                </tr>
              </thead>
              <tbody>
                {scanHistory.map((scan) => (
                  <tr key={scan.id} className="border-b border-slate-800/70 last:border-0">
                    <td className="whitespace-nowrap px-5 py-3 text-slate-300">{new Date(scan.timestamp).toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-400">
                      {scan.liveSourceAvailable ? 'Public API + demo' : 'Demo dataset'}
                    </td>
                    <td className="px-5 py-3 text-slate-300">{scan.totalScanned}</td>
                    <td className="px-5 py-3 text-slate-300">{scan.threatsDetected}</td>
                    <td className="px-5 py-3 text-emerald-400">{scan.officialExcluded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Detailed detections table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white">Detection Details ({reportRows.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs">
                <th className="text-left px-4 py-3 font-medium">Asset Name</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Platform</th>
                <th className="text-left px-4 py-3 font-medium">Risk</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Detection Reasons</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.map((det) => (
                <tr key={det.id} className="border-b border-slate-800/50">
                  <td className="px-4 py-3 text-white font-medium">
                    {det.candidateName}
                    {det.isOfficial && <span className="ml-2 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">OFFICIAL</span>}
                  </td>
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
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-xs text-slate-400 line-clamp-1 max-w-xs">{det.detectionReasons.join('; ')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-500 text-center">
        Report generated by Trustguard AI · {new Date().toLocaleString()} · Synthetic demonstration data
      </p>
    </div>
  );
}
