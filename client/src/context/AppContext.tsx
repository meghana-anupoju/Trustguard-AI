import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type {
  BrandProfile,
  ThreatDetection,
  AppSettings,
  InvestigationStatus,
  CandidateSocial,
  CandidateApp,
  NavSection,
  DataSourceStatus,
  ScanHistoryEntry,
  HighRiskAlert,
  InvestigationEvent,
} from '@/types';
import { storage } from '@/lib/storage';
import { runScan } from '@/lib/detectionEngine';
import { api } from '@/lib/api';
import {
  DEMO_BRAND_PROFILE,
  createDemoCandidates,
} from '@/data/demoData';

interface AppContextValue {
  // Navigation
  activeSection: NavSection;
  setActiveSection: (section: NavSection) => void;
  openDetection: (detectionId: string) => void;
  focusedDetectionId: string | null;
  clearFocusedDetection: () => void;

  // Auth / loading
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  isLoading: boolean;

  // Brand profile
  brandProfile: BrandProfile;
  saveBrandProfile: (profile: BrandProfile) => Promise<void>;

  // Detections
  detections: ThreatDetection[];
  runScanning: () => void;
  isScanning: boolean;
  lastScanTime: string | null;
  sourceStatuses: DataSourceStatus[];
  scanHistory: ScanHistoryEntry[];
  highRiskAlerts: HighRiskAlert[];
  dismissHighRiskAlert: (detectionId: string) => void;

  // Detection management
  updateDetectionStatus: (id: string, status: InvestigationStatus) => Promise<void>;
  updateDetectionNotes: (id: string, notes: string) => Promise<void>;

  // Settings
  settings: AppSettings;
  saveSettings: (settings: AppSettings) => void;

  // Import
  importCandidates: (socials: CandidateSocial[], apps: CandidateApp[]) => Promise<void>;
  importedSocials: CandidateSocial[];
  importedApps: CandidateApp[];

  // Reset
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<NavSection>('Overview');
  const [focusedDetectionId, setFocusedDetectionId] = useState<string | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile>(storage.getBrandProfile());
  const [detections, setDetections] = useState<ThreatDetection[]>(storage.getDetections());
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<string | null>(storage.getLastScan());
  const [sourceStatuses, setSourceStatuses] = useState<DataSourceStatus[]>([
    { name: 'Built-in demo records', status: 'demo', detail: 'Sample detections are available locally.' },
    { name: 'Bluesky public API', status: 'not_checked', detail: 'Queried only when you run a scan.' },
    { name: 'Apple App Store Search API', status: 'not_checked', detail: 'Queried only when you run a scan.' },
  ]);
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);
  const [highRiskAlerts, setHighRiskAlerts] = useState<HighRiskAlert[]>(storage.getHighRiskAlerts());
  const alertedDetectionIds = useRef(new Set(storage.getAlertedDetectionIds()));
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [importedSocials, setImportedSocials] = useState<CandidateSocial[]>([]);
  const [importedApps, setImportedApps] = useState<CandidateApp[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try { return localStorage.getItem('brandshield_auth') === 'true'; } catch { return false; }
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadInitialData = useCallback(async () => {
    try {
      const [profile, history, investigations, candidates, health] = await Promise.all([
        api.getBrandProfile(),
        api.getScanHistory(),
        api.getInvestigations(),
        api.getCandidates(),
        api.getHealth(),
      ]);
      if (profile) {
        setBrandProfile(profile);
      }
      setScanHistory(history);
      setImportedSocials(candidates.socialCandidates);
      setImportedApps(candidates.appCandidates);
      setSourceStatuses((current) => [
        ...current.filter((source) => source.name !== 'Backend API'),
        {
          name: 'Backend API',
          status: health.status === 'ok' ? 'connected' : 'unavailable',
          detail: health.status === 'ok' ? 'API is responding.' : 'API returned an unhealthy status.',
        },
      ]);
      if (history[0]) {
        const latestScan = await api.getScan(history[0].id);
        const investigationMap = new Map(investigations.map((record) => [record.detectionId, record]));
        setDetections(latestScan.detections.map((detection) => {
          const record = investigationMap.get(detection.id);
          return record
            ? {
              ...detection,
              status: record.status,
              analystNotes: record.analystNotes,
              investigationHistory: record.investigationHistory,
            }
            : detection;
        }));
        setLastScanTime(latestScan.timestamp);
        storage.saveLastScan(latestScan.timestamp);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Backend request failed.';
      setSourceStatuses([
        { name: 'Built-in demo records', status: 'demo', detail: 'Using local sample candidates.' },
        { name: 'Backend API', status: 'unavailable', detail },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1800);
    void loadInitialData();
    return () => clearTimeout(timer);
  }, [loadInitialData]);

  const login = useCallback(() => {
    setIsAuthenticated(true);
    try { localStorage.setItem('brandshield_auth', 'true'); } catch { /* ignore */ }
  }, []);

  const openDetection = useCallback((detectionId: string) => {
    setFocusedDetectionId(detectionId);
    setActiveSection('Threat Intelligence');
  }, []);

  const clearFocusedDetection = useCallback(() => {
    setFocusedDetectionId(null);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    try { localStorage.removeItem('brandshield_auth'); } catch { /* ignore */ }
  }, []);

  // Persist brand profile
  useEffect(() => {
    storage.saveBrandProfile(brandProfile);
  }, [brandProfile]);

  // Persist detections
  useEffect(() => {
    storage.saveDetections(detections);
  }, [detections]);

  // Persist settings
  useEffect(() => {
    storage.saveSettings(settings);
  }, [settings]);

  const saveBrandProfile = useCallback(async (profile: BrandProfile) => {
    const updatedProfile = { ...profile, updatedAt: new Date().toISOString() };
    setBrandProfile(updatedProfile);
    storage.saveBrandProfile(updatedProfile);
    await api.saveBrandProfile(updatedProfile);
  }, []);

  const recordHighRiskAlerts = useCallback((newDetections: ThreatDetection[], existingCandidateIds: Set<string>) => {
    const alerts = newDetections
      .filter((detection) => !detection.isOfficial
        && detection.riskScore >= 50
        && !existingCandidateIds.has(detection.candidateId)
        && !alertedDetectionIds.current.has(detection.id))
      .map((detection) => {
        alertedDetectionIds.current.add(detection.id);
        return { detectionId: detection.id, createdAt: new Date().toISOString() };
      });

    if (alerts.length === 0) return;
    storage.saveAlertedDetectionIds([...alertedDetectionIds.current]);
    setHighRiskAlerts((current) => {
      const updated = [...alerts, ...current];
      storage.saveHighRiskAlerts(updated);
      return updated;
    });
  }, []);

  const runScanning = useCallback(async () => {
    setIsScanning(true);

    try {
      const scanResult = await api.runScan(settings);
      if (scanResult?.detections) {
        if (scanResult.sourceStatuses) setSourceStatuses(scanResult.sourceStatuses);
        const existingMap = new Map(detections.map((d) => [d.candidateId, d]));
        const merged = scanResult.detections.map((det) => {
          const existing = existingMap.get(det.candidateId);
          if (existing) {
            return {
              ...det,
              status: existing.status,
              analystNotes: existing.analystNotes,
              investigationHistory: existing.investigationHistory,
            };
          }
          return det;
        });

        recordHighRiskAlerts(scanResult.detections, new Set(existingMap.keys()));
        setDetections(merged);
        const now = scanResult.timestamp ?? new Date().toISOString();
        setLastScanTime(now);
        storage.saveLastScan(now);
        setScanHistory((history) => [{
          ...scanResult,
          timestamp: now,
        }, ...history.filter((scan) => scan.id !== scanResult.id)].slice(0, 20));
        setIsScanning(false);
        return;
      }
    } catch {
      setSourceStatuses([
        { name: 'Built-in demo records', status: 'demo', detail: 'Using local sample candidates.' },
        { name: 'Backend scan API', status: 'unavailable', detail: 'Could not reach the backend; live providers were not queried.' },
      ]);
    }

    // Simulate scan delay for UX
    setTimeout(() => {
      const demoCandidates = settings.demoMode ? createDemoCandidates(brandProfile) : { socials: [], apps: [] };
      const socialCandidates = [...demoCandidates.socials, ...importedSocials];
      const appCandidates = [...demoCandidates.apps, ...importedApps];

      // Merge existing notes/statuses with new detections
      const existingMap = new Map(detections.map((d) => [d.candidateId, d]));

      const newDetections = runScan({
        socialCandidates,
        appCandidates,
        profile: brandProfile,
        source: settings.demoMode ? 'Demo Dataset' : 'Imported Dataset',
        liveSourceAvailable: false,
      });

      const merged = newDetections.map((det) => {
        const existing = existingMap.get(det.candidateId);
        if (existing) {
          return {
            ...det,
            status: existing.status,
            analystNotes: existing.analystNotes,
            investigationHistory: existing.investigationHistory,
          };
        }
        return det;
      });

      recordHighRiskAlerts(newDetections, new Set(existingMap.keys()));
      setDetections(merged);
      setSourceStatuses([
        ...(settings.demoMode
          ? [{ name: 'Built-in demo records', status: 'demo' as const, detail: 'Brand-aware synthetic examples included in this scan.' }]
          : []),
        { name: 'Imported analyst dataset', status: 'demo', detail: `${importedSocials.length} social and ${importedApps.length} app records` },
        { name: 'External provider APIs', status: 'unavailable', detail: 'Backend unavailable; external searches were not run.' },
      ]);
      const now = new Date().toISOString();
      setLastScanTime(now);
      storage.saveLastScan(now);
      setIsScanning(false);
    }, 1200);
  }, [importedSocials, importedApps, brandProfile, detections, settings, recordHighRiskAlerts]);

  const dismissHighRiskAlert = useCallback((detectionId: string) => {
    setHighRiskAlerts((current) => {
      const updated = current.filter((alert) => alert.detectionId !== detectionId);
      storage.saveHighRiskAlerts(updated);
      return updated;
    });
  }, []);

  const updateDetectionStatus = useCallback(async (id: string, status: InvestigationStatus) => {
    const detection = detections.find((item) => item.id === id);
    if (!detection || detection.status === status) return;
    const timestamp = new Date().toISOString();
    const event: InvestigationEvent = {
      id: `event-${timestamp}-${status}`,
      action: 'Status changed',
      detail: `Status changed from ${detection.status} to ${status}`,
      actor: 'Analyst',
      timestamp,
    };
    setDetections((prev) => prev.map((item) => item.id === id
      ? { ...item, status, investigationHistory: [event, ...(item.investigationHistory ?? [])] }
      : item));
    if (status !== 'New') dismissHighRiskAlert(id);
    const saved = await api.saveInvestigation(id, status, detection.analystNotes);
    setDetections((prev) => prev.map((item) => item.id === id
      ? { ...item, status: saved.status, analystNotes: saved.analystNotes, investigationHistory: saved.investigationHistory }
      : item));
  }, [detections, dismissHighRiskAlert]);

  const updateDetectionNotes = useCallback(async (id: string, notes: string) => {
    const detection = detections.find((item) => item.id === id);
    if (!detection || detection.analystNotes === notes) return;
    const timestamp = new Date().toISOString();
    const event: InvestigationEvent = {
      id: `event-${timestamp}-notes`,
      action: 'Analyst note updated',
      detail: notes.trim() ? notes.trim().slice(0, 240) : 'Analyst notes cleared',
      actor: 'Analyst',
      timestamp,
    };
    setDetections((prev) => prev.map((item) => item.id === id
      ? { ...item, analystNotes: notes, investigationHistory: [event, ...(item.investigationHistory ?? [])] }
      : item));
    const saved = await api.saveInvestigation(id, detection.status, notes);
    setDetections((prev) => prev.map((item) => item.id === id
      ? { ...item, status: saved.status, analystNotes: saved.analystNotes, investigationHistory: saved.investigationHistory }
      : item));
  }, [detections]);

  const saveSettings = useCallback((s: AppSettings) => {
    setSettings(s);
  }, []);

  const importCandidates = useCallback(async (socials: CandidateSocial[], apps: CandidateApp[]) => {
    await api.saveCandidates(socials, apps);
    setImportedSocials((prev) => [...prev, ...socials]);
    setImportedApps((prev) => [...prev, ...apps]);
  }, []);

  const resetDemoData = useCallback(() => {
    storage.resetAll();
    setBrandProfile(DEMO_BRAND_PROFILE);
    setDetections([]);
    setHighRiskAlerts([]);
    alertedDetectionIds.current.clear();
    setLastScanTime(null);
    setImportedSocials([]);
    setImportedApps([]);
    setSettings(storage.getSettings());
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeSection,
        setActiveSection,
        openDetection,
        focusedDetectionId,
        clearFocusedDetection,
        isAuthenticated,
        login,
        logout,
        isLoading,
        brandProfile,
        saveBrandProfile,
        detections,
        runScanning,
        isScanning,
        lastScanTime,
        sourceStatuses,
        scanHistory,
        highRiskAlerts,
        dismissHighRiskAlert,
        updateDetectionStatus,
        updateDetectionNotes,
        settings,
        saveSettings,
        importCandidates,
        importedSocials,
        importedApps,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
