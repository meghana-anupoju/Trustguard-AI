import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { brandProfile as defaultBrandProfile } from './data.js';

const databasePath = process.env.DATABASE_PATH || path.resolve('data', 'brandshield.sqlite');
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma('journal_mode = WAL');
database.pragma('foreign_keys = ON');
database.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    total_scanned INTEGER NOT NULL,
    social_scanned INTEGER NOT NULL,
    app_scanned INTEGER NOT NULL,
    threats_detected INTEGER NOT NULL,
    official_excluded INTEGER NOT NULL,
    source TEXT NOT NULL,
    live_source_available INTEGER NOT NULL,
    detections_json TEXT NOT NULL,
    source_statuses_json TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON scans(timestamp DESC);

  CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('Social Profile', 'Mobile App')),
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS investigations (
    detection_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    analyst_notes TEXT NOT NULL,
    history_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const getSetting = database.prepare('SELECT value FROM settings WHERE key = ?');
const saveSetting = database.prepare(`
  INSERT INTO settings (key, value, updated_at)
  VALUES (?, ?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
`);

if (!getSetting.get('brand-profile')) {
  saveSetting.run('brand-profile', JSON.stringify(defaultBrandProfile), new Date().toISOString());
}

export async function initializeDatabase() {}

export async function loadBrandProfile() {
  const row = getSetting.get('brand-profile');
  if (!row) throw new Error('Brand profile is missing from the local database.');
  return JSON.parse(row.value);
}

export async function persistBrandProfile(profile) {
  saveSetting.run('brand-profile', JSON.stringify(profile), new Date().toISOString());
}

const insertScan = database.prepare(`
  INSERT INTO scans (
    id, timestamp, total_scanned, social_scanned, app_scanned,
    threats_detected, official_excluded, source, live_source_available,
    detections_json, source_statuses_json
  ) VALUES (
    @id, @timestamp, @totalScanned, @socialScanned, @appScanned,
    @threatsDetected, @officialExcluded, @source, @liveSourceAvailable,
    @detections, @sourceStatuses
  )
`);

export async function persistScan(scan) {
  insertScan.run({
    ...scan,
    liveSourceAvailable: scan.liveSourceAvailable ? 1 : 0,
    detections: JSON.stringify(scan.detections),
    sourceStatuses: JSON.stringify(scan.sourceStatuses),
  });
}

const listScans = database.prepare(`
  SELECT id, timestamp, total_scanned AS totalScanned,
    social_scanned AS socialScanned, app_scanned AS appScanned,
    threats_detected AS threatsDetected, official_excluded AS officialExcluded,
    source, live_source_available AS liveSourceAvailable
  FROM scans
  ORDER BY timestamp DESC
  LIMIT ?
`);

export async function getScanHistory(limit = 20) {
  return listScans.all(limit).map((scan) => ({
    ...scan,
    liveSourceAvailable: Boolean(scan.liveSourceAvailable),
  }));
}

const getScan = database.prepare('SELECT * FROM scans WHERE id = ?');

export async function getScanById(id) {
  const row = getScan.get(id);
  if (!row) return null;
  return {
    id: row.id,
    timestamp: row.timestamp,
    totalScanned: row.total_scanned,
    socialScanned: row.social_scanned,
    appScanned: row.app_scanned,
    threatsDetected: row.threats_detected,
    officialExcluded: row.official_excluded,
    source: row.source,
    liveSourceAvailable: Boolean(row.live_source_available),
    detections: JSON.parse(row.detections_json),
    sourceStatuses: JSON.parse(row.source_statuses_json),
  };
}

const upsertCandidate = database.prepare(`
  INSERT INTO candidates (id, asset_type, data_json, updated_at)
  VALUES (@id, @assetType, @data, @updatedAt)
  ON CONFLICT(id) DO UPDATE SET
    asset_type = excluded.asset_type,
    data_json = excluded.data_json,
    updated_at = excluded.updated_at
`);
const saveCandidatesTransaction = database.transaction((socials, apps) => {
  const updatedAt = new Date().toISOString();
  for (const candidate of socials) {
    upsertCandidate.run({
      id: candidate.id,
      assetType: 'Social Profile',
      data: JSON.stringify(candidate),
      updatedAt,
    });
  }
  for (const candidate of apps) {
    upsertCandidate.run({
      id: candidate.id,
      assetType: 'Mobile App',
      data: JSON.stringify(candidate),
      updatedAt,
    });
  }
});

export async function persistCandidates(socials, apps) {
  saveCandidatesTransaction(socials, apps);
}

export async function getCandidates() {
  const rows = database.prepare('SELECT asset_type, data_json FROM candidates ORDER BY updated_at, id').all();
  return {
    socialCandidates: rows
      .filter((row) => row.asset_type === 'Social Profile')
      .map((row) => JSON.parse(row.data_json)),
    appCandidates: rows
      .filter((row) => row.asset_type === 'Mobile App')
      .map((row) => JSON.parse(row.data_json)),
  };
}

const saveInvestigationStatement = database.prepare(`
  INSERT INTO investigations (detection_id, status, analyst_notes, history_json, updated_at)
  VALUES (@detectionId, @status, @analystNotes, @history, @updatedAt)
  ON CONFLICT(detection_id) DO UPDATE SET
    status = excluded.status,
    analyst_notes = excluded.analyst_notes,
    history_json = excluded.history_json,
    updated_at = excluded.updated_at
`);

export async function saveInvestigation(record) {
  saveInvestigationStatement.run({
    ...record,
    history: JSON.stringify(record.investigationHistory),
  });
}

function deserializeInvestigation(row) {
  return {
    detectionId: row.detection_id,
    status: row.status,
    analystNotes: row.analyst_notes,
    investigationHistory: JSON.parse(row.history_json),
    updatedAt: row.updated_at,
  };
}

export async function getInvestigation(detectionId) {
  const row = database.prepare('SELECT * FROM investigations WHERE detection_id = ?').get(detectionId);
  return row ? deserializeInvestigation(row) : null;
}

export async function getInvestigations() {
  return database.prepare('SELECT * FROM investigations ORDER BY updated_at DESC')
    .all()
    .map(deserializeInvestigation);
}

export async function closeDatabase() {
  database.close();
}
