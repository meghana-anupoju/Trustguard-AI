import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('brand profile and scan history survive database reconnection', async () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'brandshield-database-test-'));
  const databasePath = path.join(tempDirectory, 'brandshield.sqlite');
  const previousDatabasePath = process.env.DATABASE_PATH;
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const connections = [];

  try {
    delete process.env.DATABASE_URL;
    process.env.DATABASE_PATH = databasePath;
    const firstConnection = await import(`./database.js?first=${Date.now()}`);
    connections.push(firstConnection);
    await firstConnection.initializeDatabase();
    const profile = await firstConnection.loadBrandProfile();
    profile.companyName = 'Persistent Demo Brand';
    await firstConnection.persistBrandProfile(profile);

    await firstConnection.persistScan({
      id: 'scan-persistence-test',
      timestamp: '2026-10-10T00:00:00.000Z',
      totalScanned: 4,
      socialScanned: 2,
      appScanned: 2,
      threatsDetected: 1,
      officialExcluded: 1,
      source: 'Demo Dataset',
      liveSourceAvailable: false,
      detections: [{ candidateId: 'candidate-1' }],
      sourceStatuses: [{ name: 'demo', status: 'demo' }],
    });
    await firstConnection.persistCandidates(
      [{ id: 'persisted-social', username: 'sample' }],
      [{ id: 'persisted-app', appName: 'Sample' }],
    );
    await firstConnection.saveInvestigation({
      detectionId: 'det-candidate-1',
      status: 'Confirmed Threat',
      analystNotes: 'Verified with source evidence.',
      investigationHistory: [{
        id: 'event-1',
        action: 'Status changed',
        detail: 'Status changed from New to Confirmed Threat',
        actor: 'Analyst',
        timestamp: '2026-10-10T00:01:00.000Z',
      }],
      updatedAt: '2026-10-10T00:01:00.000Z',
    });

    const secondConnection = await import(`./database.js?second=${Date.now()}`);
    connections.push(secondConnection);

    await secondConnection.initializeDatabase();
    assert.equal((await secondConnection.loadBrandProfile()).companyName, 'Persistent Demo Brand');
    assert.equal((await secondConnection.getScanHistory())[0].id, 'scan-persistence-test');
    assert.equal((await secondConnection.getScanById('scan-persistence-test')).detections[0].candidateId, 'candidate-1');
    assert.equal((await secondConnection.getCandidates()).socialCandidates[0].id, 'persisted-social');
    assert.equal((await secondConnection.getCandidates()).appCandidates[0].id, 'persisted-app');
    assert.equal((await secondConnection.getInvestigation('det-candidate-1')).status, 'Confirmed Threat');
    assert.equal((await secondConnection.getInvestigations())[0].investigationHistory[0].actor, 'Analyst');
  } finally {
    await Promise.all([...new Set(connections.map((connection) => connection.closeDatabase))]
      .map((closeDatabase) => closeDatabase()));
    if (previousDatabasePath === undefined) delete process.env.DATABASE_PATH;
    else process.env.DATABASE_PATH = previousDatabasePath;
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
});
