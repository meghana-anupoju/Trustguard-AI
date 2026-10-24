import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { createDemoCandidates } from './data.js';
import { buildDetections } from './detection.js';
import { collectLiveCandidates } from './sources.js';
import {
  getScanById,
  getScanHistory,
  getCandidates,
  getInvestigation,
  getInvestigations,
  initializeDatabase,
  loadBrandProfile,
  persistCandidates,
  persistBrandProfile,
  persistScan,
  saveInvestigation,
} from './database.js';

const app = express();
const port = Number(process.env.PORT || 3001);
let brandProfile;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function isBrandProfile(value) {
  return value
    && typeof value.companyName === 'string'
    && value.companyName.trim().length > 0
    && typeof value.websiteUrl === 'string'
    && Array.isArray(value.officialDomains)
    && Array.isArray(value.officialSocials)
    && Array.isArray(value.officialApps)
    && Array.isArray(value.knownPublishers);
}

const socialPlatforms = new Set(['Instagram', 'Facebook', 'LinkedIn', 'X', 'YouTube', 'TikTok', 'Telegram', 'Bluesky', 'Other']);
const appStores = new Set(['Google Play', 'Apple App Store', 'Amazon Appstore', 'Other']);
const investigationStatuses = new Set(['New', 'Investigating', 'Confirmed Threat', 'False Positive', 'Resolved', 'Closed']);

function validHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function normalizeImportedCandidates(value) {
  if (!value || !Array.isArray(value.socials) || !Array.isArray(value.apps)
    || value.socials.length + value.apps.length > 500) {
    return null;
  }

  const socials = value.socials.map((candidate) => {
    if (!candidate || typeof candidate.id !== 'string' || candidate.id.length > 200
      || !socialPlatforms.has(candidate.platform)
      || typeof candidate.displayName !== 'string' || candidate.displayName.length > 200
      || typeof candidate.username !== 'string' || candidate.username.length > 200
      || typeof candidate.profileUrl !== 'string' || !validHttpUrl(candidate.profileUrl)) return null;
    const logoSimilarity = Number(candidate.logoSimilarity);
    return {
      ...candidate,
      bio: typeof candidate.bio === 'string' ? candidate.bio.slice(0, 4000) : '',
      verified: candidate.verified === true,
      logoSimilarity: Number.isFinite(logoSimilarity) ? Math.min(100, Math.max(0, logoSimilarity)) : undefined,
      source: 'Imported Dataset',
      lastChecked: new Date().toISOString(),
    };
  });

  const apps = value.apps.map((candidate) => {
    if (!candidate || typeof candidate.id !== 'string' || candidate.id.length > 200
      || !appStores.has(candidate.store)
      || typeof candidate.appName !== 'string' || candidate.appName.length > 200
      || typeof candidate.publisher !== 'string' || candidate.publisher.length > 200
      || typeof candidate.storeUrl !== 'string' || !validHttpUrl(candidate.storeUrl)) return null;
    return {
      ...candidate,
      description: typeof candidate.description === 'string' ? candidate.description.slice(0, 4000) : '',
      packageId: typeof candidate.packageId === 'string' ? candidate.packageId.slice(0, 300) : undefined,
      logoSimilarity: Number.isFinite(Number(candidate.logoSimilarity))
        ? Math.min(100, Math.max(0, Number(candidate.logoSimilarity)))
        : undefined,
      source: 'Imported Dataset',
      lastChecked: new Date().toISOString(),
    };
  });

  if (socials.some((candidate) => !candidate) || apps.some((candidate) => !candidate)) return null;
  return { socials, apps };
}

app.get('/', (req, res) => {
  res.json({
    service: 'Trustguard API',
    status: 'ok',
    documentation: {
      health: '/api/health',
      brandProfile: '/api/brand-profile',
      candidates: '/api/candidates',
      scans: '/api/scans',
      scan: '/api/scan',
      frontend: 'http://localhost:5173',
    },
    message: 'Use the frontend app at http://localhost:5173 or call the API endpoints above.',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'trustguard-api',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/brand-profile', (req, res) => {
  res.json(brandProfile);
});

app.put('/api/brand-profile', asyncHandler(async (req, res) => {
  if (!isBrandProfile(req.body)) {
    return res.status(400).json({ error: 'Invalid brand profile.' });
  }

  const updatedProfile = {
    ...req.body,
    companyName: req.body.companyName.trim(),
    updatedAt: new Date().toISOString(),
  };
  await persistBrandProfile(updatedProfile);
  brandProfile = updatedProfile;
  return res.json(brandProfile);
}));

app.get('/api/scans', asyncHandler(async (req, res) => {
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 20;
  res.json(await getScanHistory(limit));
}));

app.get('/api/scans/:id', asyncHandler(async (req, res) => {
  const scan = await getScanById(req.params.id);
  if (!scan) return res.status(404).json({ error: 'Scan not found.' });
  return res.json(scan);
}));

app.post('/api/candidates', asyncHandler(async (req, res) => {
  const candidates = normalizeImportedCandidates(req.body);
  if (!candidates) {
    return res.status(400).json({ error: 'Invalid candidate import. Provide up to 500 valid social profiles and app listings.' });
  }
  await persistCandidates(candidates.socials, candidates.apps);
  return res.status(201).json({
    importedSocials: candidates.socials.length,
    importedApps: candidates.apps.length,
  });
}));

app.get('/api/candidates', asyncHandler(async (req, res) => {
  res.json(await getCandidates());
}));

app.get('/api/investigations', asyncHandler(async (req, res) => {
  res.json(await getInvestigations());
}));

app.put('/api/investigations/:id', asyncHandler(async (req, res) => {
  const { status, analystNotes } = req.body ?? {};
  if (req.params.id.length > 300
    || !investigationStatuses.has(status)
    || typeof analystNotes !== 'string'
    || analystNotes.length > 10000) {
    return res.status(400).json({ error: 'Invalid investigation update.' });
  }

  const previous = await getInvestigation(req.params.id);
  const updatedAt = new Date().toISOString();
  const record = previous ?? {
    detectionId: req.params.id,
    status: 'New',
    analystNotes: '',
    investigationHistory: [],
    updatedAt,
  };
  const history = [...record.investigationHistory];
  if (record.status !== status) {
    history.unshift({
      id: randomUUID(),
      action: 'Status changed',
      detail: `Status changed from ${record.status} to ${status}`,
      actor: 'Analyst',
      timestamp: updatedAt,
    });
  }
  if (record.analystNotes !== analystNotes) {
    history.unshift({
      id: randomUUID(),
      action: 'Analyst note updated',
      detail: analystNotes.trim() ? analystNotes.trim().slice(0, 240) : 'Analyst notes cleared',
      actor: 'Analyst',
      timestamp: updatedAt,
    });
  }
  history.length = Math.min(history.length, 500);

  const updated = {
    detectionId: req.params.id,
    status,
    analystNotes,
    investigationHistory: history,
    updatedAt,
  };
  await saveInvestigation(updated);
  return res.json(updated);
}));

app.post('/api/scan', asyncHandler(async (req, res) => {
  const live = await collectLiveCandidates(brandProfile.companyName);
  const imported = await getCandidates();
  const includeDemoData = req.body?.settings?.demoMode !== false;
  const demoCandidates = includeDemoData
    ? createDemoCandidates(brandProfile)
    : { socialCandidates: [], appCandidates: [] };
  const allSocialCandidates = [
    ...demoCandidates.socialCandidates,
    ...imported.socialCandidates,
    ...live.socialCandidates,
  ];
  const allAppCandidates = [
    ...demoCandidates.appCandidates,
    ...imported.appCandidates,
    ...live.appCandidates,
  ];
  const { detections: scoredDetections, officialExcluded } = buildDetections(
    brandProfile,
    allSocialCandidates,
    allAppCandidates,
    req.body?.settings,
  );
  const investigations = await getInvestigations();
  const investigationMap = new Map(investigations.map((record) => [record.detectionId, record]));
  const detections = scoredDetections.map((detection) => {
    const investigation = investigationMap.get(detection.id);
    return investigation
      ? {
        ...detection,
        status: investigation.status,
        analystNotes: investigation.analystNotes,
        investigationHistory: investigation.investigationHistory,
      }
      : detection;
  });
  const hasLiveSource = live.sourceStatuses.some((source) => source.status === 'connected');
  const activeSourceStatuses = [
    ...(includeDemoData
      ? [{ name: 'Built-in demo records', status: 'demo', detail: `${demoCandidates.socialCandidates.length} social and ${demoCandidates.appCandidates.length} app examples customized for ${brandProfile.companyName}` }]
      : []),
    { name: 'Imported analyst dataset', status: 'demo', detail: `${imported.socialCandidates.length} social and ${imported.appCandidates.length} app records` },
    ...live.sourceStatuses,
  ];
  const scan = {
    id: `scan-${Date.now()}`,
    timestamp: new Date().toISOString(),
    totalScanned: allSocialCandidates.length + allAppCandidates.length,
    socialScanned: allSocialCandidates.length,
    appScanned: allAppCandidates.length,
    threatsDetected: detections.filter((detection) => !detection.isOfficial).length,
    officialExcluded,
    source: hasLiveSource ? 'Sample dataset + external public APIs' : 'Demo Dataset',
    liveSourceAvailable: hasLiveSource,
    sourceStatuses: activeSourceStatuses,
    detections,
  };
  await persistScan(scan);
  return res.json(scan);
}));

app.use((error, req, res, next) => {
  console.error(`Request failed: ${req.method} ${req.path}`, error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ error: 'The request could not be completed.' });
});

async function start() {
  await initializeDatabase();
  brandProfile = await loadBrandProfile();
  app.listen(port, () => {
    console.log(`Trustguard API listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Trustguard API failed to initialize:', error);
  process.exitCode = 1;
});
