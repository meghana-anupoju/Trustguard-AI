import type { BrandProfile, ThreatDetection, HighRiskAlert, AppSettings } from '@/types';
import { DEMO_BRAND_PROFILE } from '@/data/demoData';

const STORAGE_KEYS = {
  brandProfile: 'brandshield_brand_profile',
  detections: 'brandshield_detections',
  notes: 'brandshield_notes',
  settings: 'brandshield_settings',
  lastScan: 'brandshield_last_scan',
  highRiskAlerts: 'brandshield_high_risk_alerts',
  alertedDetectionIds: 'brandshield_alerted_detection_ids',
};

const DEFAULT_SETTINGS: AppSettings = {
  nameSimilarityThreshold: 70,
  suspiciousKeywordThreshold: 50,
  autoExcludeOfficial: true,
  demoMode: true,
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — non-fatal
  }
}

export const storage = {
  getBrandProfile(): BrandProfile {
    return safeGet<BrandProfile>(STORAGE_KEYS.brandProfile, DEMO_BRAND_PROFILE);
  },
  saveBrandProfile(profile: BrandProfile): void {
    safeSet(STORAGE_KEYS.brandProfile, profile);
  },

  getDetections(): ThreatDetection[] {
    return safeGet<ThreatDetection[]>(STORAGE_KEYS.detections, []);
  },
  saveDetections(detections: ThreatDetection[]): void {
    safeSet(STORAGE_KEYS.detections, detections);
  },

  getNotes(): Record<string, string> {
    return safeGet<Record<string, string>>(STORAGE_KEYS.notes, {});
  },
  saveNotes(notes: Record<string, string>): void {
    safeSet(STORAGE_KEYS.notes, notes);
  },

  getSettings(): AppSettings {
    return safeGet<AppSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  },
  saveSettings(settings: AppSettings): void {
    safeSet(STORAGE_KEYS.settings, settings);
  },

  getLastScan(): string | null {
    return safeGet<string | null>(STORAGE_KEYS.lastScan, null);
  },
  saveLastScan(timestamp: string): void {
    safeSet(STORAGE_KEYS.lastScan, timestamp);
  },

  getHighRiskAlerts(): HighRiskAlert[] {
    return safeGet<HighRiskAlert[]>(STORAGE_KEYS.highRiskAlerts, []);
  },
  saveHighRiskAlerts(alerts: HighRiskAlert[]): void {
    safeSet(STORAGE_KEYS.highRiskAlerts, alerts);
  },
  getAlertedDetectionIds(): string[] {
    return safeGet<string[]>(STORAGE_KEYS.alertedDetectionIds, []);
  },
  saveAlertedDetectionIds(ids: string[]): void {
    safeSet(STORAGE_KEYS.alertedDetectionIds, ids);
  },

  resetAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    });
  },
};
