import pg from 'pg';
import { brandProfile as defaultBrandProfile } from './data.js';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? true : undefined,
});

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scans (
      id TEXT PRIMARY KEY,
      timestamp TIMESTAMPTZ NOT NULL,
      total_scanned INTEGER NOT NULL,
      social_scanned INTEGER NOT NULL,
      app_scanned INTEGER NOT NULL,
      threats_detected INTEGER NOT NULL,
      official_excluded INTEGER NOT NULL,
      source TEXT NOT NULL,
      live_source_available BOOLEAN NOT NULL,
      detections_json JSONB NOT NULL,
      source_statuses_json JSONB NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON scans(timestamp DESC);

    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      asset_type TEXT NOT NULL CHECK (asset_type IN ('Social Profile', 'Mobile App')),
      data_json JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS investigations (
      detection_id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      analyst_notes TEXT NOT NULL,
      history_json JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `);

  await pool.query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (key) DO NOTHING`,
    ['brand-profile', defaultBrandProfile, new Date().toISOString()],
  );
}

export async function loadBrandProfile() {
  const { rows } = await pool.query(
    'SELECT value FROM settings WHERE key = $1',
    ['brand-profile'],
  );
  if (!rows[0]) throw new Error('Brand profile is missing from the database.');
  return rows[0].value;
}

export async function persistBrandProfile(profile) {
  await pool.query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (key) DO UPDATE
     SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
    ['brand-profile', profile, new Date().toISOString()],
  );
}

export async function persistScan(scan) {
  await pool.query(
    `INSERT INTO scans (
      id, timestamp, total_scanned, social_scanned, app_scanned,
      threats_detected, official_excluded, source, live_source_available,
      detections_json, source_statuses_json
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      scan.id,
      scan.timestamp,
      scan.totalScanned,
      scan.socialScanned,
      scan.appScanned,
      scan.threatsDetected,
      scan.officialExcluded,
      scan.source,
      scan.liveSourceAvailable,
      scan.detections,
      scan.sourceStatuses,
    ],
  );
}

export async function getScanHistory(limit = 20) {
  const { rows } = await pool.query(
    `SELECT id, timestamp, total_scanned AS "totalScanned",
      social_scanned AS "socialScanned", app_scanned AS "appScanned",
      threats_detected AS "threatsDetected", official_excluded AS "officialExcluded",
      source, live_source_available AS "liveSourceAvailable"
    FROM scans
    ORDER BY timestamp DESC
    LIMIT $1`,
    [limit],
  );
  return rows;
}

export async function getScanById(id) {
  const { rows } = await pool.query(
    `SELECT id, timestamp, total_scanned AS "totalScanned",
      social_scanned AS "socialScanned", app_scanned AS "appScanned",
      threats_detected AS "threatsDetected", official_excluded AS "officialExcluded",
      source, live_source_available AS "liveSourceAvailable",
      detections_json AS detections, source_statuses_json AS "sourceStatuses"
    FROM scans WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function persistCandidates(socials, apps) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updatedAt = new Date().toISOString();
    for (const [assetType, candidates] of [
      ['Social Profile', socials],
      ['Mobile App', apps],
    ]) {
      for (const candidate of candidates) {
        await client.query(
          `INSERT INTO candidates (id, asset_type, data_json, updated_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO UPDATE SET
             asset_type = EXCLUDED.asset_type,
             data_json = EXCLUDED.data_json,
             updated_at = EXCLUDED.updated_at`,
          [candidate.id, assetType, candidate, updatedAt],
        );
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getCandidates() {
  const { rows } = await pool.query(
    'SELECT asset_type, data_json FROM candidates ORDER BY updated_at, id',
  );
  return {
    socialCandidates: rows
      .filter((row) => row.asset_type === 'Social Profile')
      .map((row) => row.data_json),
    appCandidates: rows
      .filter((row) => row.asset_type === 'Mobile App')
      .map((row) => row.data_json),
  };
}

export async function saveInvestigation(record) {
  await pool.query(
    `INSERT INTO investigations (detection_id, status, analyst_notes, history_json, updated_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (detection_id) DO UPDATE SET
       status = EXCLUDED.status,
       analyst_notes = EXCLUDED.analyst_notes,
       history_json = EXCLUDED.history_json,
       updated_at = EXCLUDED.updated_at`,
    [
      record.detectionId,
      record.status,
      record.analystNotes,
      record.investigationHistory,
      record.updatedAt,
    ],
  );
}

function deserializeInvestigation(row) {
  return {
    detectionId: row.detection_id,
    status: row.status,
    analystNotes: row.analyst_notes,
    investigationHistory: row.history_json,
    updatedAt: row.updated_at,
  };
}

export async function getInvestigation(detectionId) {
  const { rows } = await pool.query('SELECT * FROM investigations WHERE detection_id = $1', [detectionId]);
  return rows[0] ? deserializeInvestigation(rows[0]) : null;
}

export async function getInvestigations() {
  const { rows } = await pool.query('SELECT * FROM investigations ORDER BY updated_at DESC');
  return rows.map(deserializeInvestigation);
}

export async function closeDatabase() {
  await pool.end();
}
