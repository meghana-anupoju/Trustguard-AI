import type { ThreatDetection } from '@/types';

export interface DashboardMetrics {
  totalScanned: number;
  socialScanned: number;
  appScanned: number;
  suspiciousSocial: number;
  suspiciousApps: number;
  criticalCount: number;
  highCount: number;
  officialProtected: number;
  totalThreats: number;
}

export function calculateMetrics(detections: ThreatDetection[]): DashboardMetrics {
  const socialDetections = detections.filter((d) => d.assetType === 'Social Profile');
  const appDetections = detections.filter((d) => d.assetType === 'Mobile App');
  const nonOfficialThreats = detections.filter((d) => !d.isOfficial && d.riskScore >= 25);

  return {
    totalScanned: detections.length,
    socialScanned: socialDetections.length,
    appScanned: appDetections.length,
    suspiciousSocial: socialDetections.filter((d) => !d.isOfficial && d.riskScore >= 25).length,
    suspiciousApps: appDetections.filter((d) => !d.isOfficial && d.riskScore >= 25).length,
    criticalCount: detections.filter((d) => d.riskLevel === 'Critical').length,
    highCount: detections.filter((d) => d.riskLevel === 'High').length,
    officialProtected: detections.filter((d) => d.isOfficial).length,
    totalThreats: nonOfficialThreats.length,
  };
}

export function getThreatDistribution(detections: ThreatDetection[]) {
  const levels = ['Critical', 'High', 'Medium', 'Low'];
  return levels.map((level) => ({
    name: level,
    count: detections.filter((d) => d.riskLevel === level && !d.isOfficial).length,
  }));
}

export function getSocialVsAppThreats(detections: ThreatDetection[]) {
  const socialThreats = detections.filter((d) => d.assetType === 'Social Profile' && !d.isOfficial && d.riskScore >= 25).length;
  const appThreats = detections.filter((d) => d.assetType === 'Mobile App' && !d.isOfficial && d.riskScore >= 25).length;
  const socialOfficial = detections.filter((d) => d.assetType === 'Social Profile' && d.isOfficial).length;
  const appOfficial = detections.filter((d) => d.assetType === 'Mobile App' && d.isOfficial).length;
  return [
    { name: 'Social', threats: socialThreats, official: socialOfficial },
    { name: 'Apps', threats: appThreats, official: appOfficial },
  ];
}

export function getPlatformBreakdown(detections: ThreatDetection[]) {
  const platforms: Record<string, number> = {};
  for (const d of detections) {
    if (!d.isOfficial && d.riskScore >= 25) {
      platforms[d.platformOrStore] = (platforms[d.platformOrStore] || 0) + 1;
    }
  }
  return Object.entries(platforms).map(([name, count]) => ({ name, count }));
}
