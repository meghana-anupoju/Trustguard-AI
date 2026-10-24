import type { AppSettings, BrandProfile, CandidateApp, CandidateSocial, InvestigationRecord, InvestigationStatus, ScanHistoryEntry, ScanResult } from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json() as { error?: unknown };
      if (typeof body.error === 'string' && body.error.trim()) detail = body.error;
    } catch {
      // Keep the HTTP status when the response does not contain JSON.
    }
    throw new Error(`Request failed: ${detail}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  getBrandProfile: () => request<BrandProfile | null>('/api/brand-profile'),
  saveBrandProfile: (profile: BrandProfile) =>
    request<BrandProfile>('/api/brand-profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),
  saveCandidates: (socials: CandidateSocial[], apps: CandidateApp[]) =>
    request<{ importedSocials: number; importedApps: number }>('/api/candidates', {
      method: 'POST',
      body: JSON.stringify({ socials, apps }),
    }),
  getCandidates: () => request<{ socialCandidates: CandidateSocial[]; appCandidates: CandidateApp[] }>('/api/candidates'),
  runScan: (settings?: AppSettings) => request<ScanResult>('/api/scan', {
    method: 'POST',
    body: settings ? JSON.stringify({ settings }) : undefined,
  }),
  getScanHistory: () => request<ScanHistoryEntry[]>('/api/scans?limit=20'),
  getScan: (id: string) => request<ScanResult>(`/api/scans/${encodeURIComponent(id)}`),
  getInvestigations: () => request<InvestigationRecord[]>('/api/investigations'),
  saveInvestigation: (detectionId: string, status: InvestigationStatus, analystNotes: string) =>
    request<InvestigationRecord>(`/api/investigations/${encodeURIComponent(detectionId)}`, {
      method: 'PUT',
      body: JSON.stringify({ status, analystNotes }),
    }),
  getHealth: () => request<{ status: string; service: string; timestamp: string }>('/api/health'),
};
