import type { ThreatDetection } from '@/types';

export function exportDetectionsCSV(detections: ThreatDetection[], filename: string = 'trustguard_report.csv') {
  const headers = [
    'Asset Name',
    'Asset Type',
    'Platform/Store',
    'Risk Score',
    'Risk Level',
    'Similarity Score',
    'Is Official',
    'Detection Reasons',
    'Investigation Status',
    'Analyst Notes',
    'URL',
    'Source',
    'Last Scanned',
  ];

  const rows = detections.map((d) => [
    d.candidateName,
    d.assetType,
    d.platformOrStore,
    d.riskScore.toString(),
    d.riskLevel,
    d.similarityScore.toString(),
    d.isOfficial ? 'Yes' : 'No',
    d.detectionReasons.join('; '),
    d.status,
    d.analystNotes,
    d.url,
    d.source,
    new Date(d.lastScanned).toLocaleString(),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportFullReportCSV(
  detections: ThreatDetection[],
  brandName: string,
  lastScan: string | null,
  source: string,
) {
  const totalScanned = detections.length;
  const socialThreats = detections.filter((d) => d.assetType === 'Social Profile' && !d.isOfficial && d.riskScore >= 25).length;
  const appThreats = detections.filter((d) => d.assetType === 'Mobile App' && !d.isOfficial && d.riskScore >= 25).length;
  const highCritical = detections.filter((d) => d.riskLevel === 'High' || d.riskLevel === 'Critical').length;
  const officialExcluded = detections.filter((d) => d.isOfficial).length;

  const summaryLines = [
    ['Trustguard AI — Digital Risk Protection Report'],
    [''],
    ['Brand', brandName],
    ['Scan Timestamp', lastScan ? new Date(lastScan).toLocaleString() : 'No scan yet'],
    ['Data Source', source],
    [''],
    ['Total Records Scanned', totalScanned.toString()],
    ['Social Threats Detected', socialThreats.toString()],
    ['Suspicious Apps Detected', appThreats.toString()],
    ['High & Critical Risk', highCritical.toString()],
    ['Official Assets Excluded', officialExcluded.toString()],
    [''],
    ['--- Detailed Detections ---'],
    [''],
  ];

  const headers = [
    'Asset Name', 'Asset Type', 'Platform/Store', 'Risk Score', 'Risk Level',
    'Similarity', 'Official', 'Detection Reasons', 'Status', 'Notes', 'URL', 'Source', 'Last Scanned',
  ];

  const rows = detections.map((d) => [
    d.candidateName, d.assetType, d.platformOrStore, d.riskScore.toString(), d.riskLevel,
    d.similarityScore.toString(), d.isOfficial ? 'Yes' : 'No', d.detectionReasons.join('; '),
    d.status, d.analystNotes, d.url, d.source, new Date(d.lastScanned).toLocaleString(),
  ]);

  const allLines = [...summaryLines.map((l) => l.join(',')), headers.join(','), ...rows.map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(','))];
  const csv = allLines.join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `trustguard_full_report_${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
