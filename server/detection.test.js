import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDetections, similarityScore } from './detection.js';
import { brandProfile, socialCandidates, appCandidates, createDemoCandidates } from './data.js';

test('look-alike matching handles transposition, spacing, and added words', () => {
  assert.ok(similarityScore('NovaPya', 'NovaPay') >= 70);
  assert.equal(similarityScore('Nova Pay', 'NovaPay'), 100);
  assert.ok(similarityScore('NovaPay Support', 'NovaPay') >= 50);
});

test('registered social accounts and apps are excluded from threat alerts', () => {
  const result = buildDetections(brandProfile, socialCandidates, appCandidates);

  assert.equal(result.officialExcluded, 2);
  assert.ok(result.detections.some((detection) => detection.candidateId === 'soc-official-1' && detection.isOfficial));
  assert.ok(result.detections.some((detection) => detection.candidateId === 'app-official-1' && detection.isOfficial));
  assert.ok(result.detections.filter((detection) => detection.isOfficial).every((detection) => detection.riskScore === 0));
});

test('suspicious social accounts and apps are flagged but unrelated assets are not', () => {
  const social = {
    id: 'fake-social',
    platform: 'X',
    displayName: 'NovaPya Support',
    username: 'novapya_help',
    profileUrl: 'https://x.com/novapya_help',
    bio: 'Urgent payment required. Verify your account to claim your reward.',
    verified: false,
    source: 'test',
  };
  const unrelatedSocial = {
    id: 'unrelated-social',
    platform: 'LinkedIn',
    displayName: 'Nova Financial Services',
    username: 'novafinancial',
    profileUrl: 'https://linkedin.com/company/novafinancial',
    bio: 'Independent financial advisory firm. Not affiliated with NovaPay.',
    verified: true,
    source: 'test',
  };
  const fakeApp = {
    id: 'fake-app',
    appName: 'NovaPay Wallet',
    store: 'Google Play',
    packageId: 'com.unrelated.publisher.wallet',
    publisher: 'Unknown Publisher',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.unrelated.publisher.wallet',
    description: 'Verify your account to claim your reward.',
    source: 'test',
  };
  const unrelatedApp = {
    id: 'unrelated-app',
    appName: 'PayMate Wallet',
    store: 'Apple App Store',
    packageId: 'com.paymate.wallet',
    publisher: 'PayMate Ltd',
    storeUrl: 'https://apps.apple.com/app/paymate',
    description: 'A digital wallet for everyday spending and budgeting.',
    source: 'test',
  };

  const result = buildDetections(brandProfile, [social, unrelatedSocial], [fakeApp, unrelatedApp]);

  assert.ok(result.detections.some((detection) => detection.candidateId === 'fake-social' && !detection.isOfficial));
  assert.ok(result.detections.some((detection) => detection.candidateId === 'fake-app' && !detection.isOfficial));
  assert.ok(!result.detections.some((detection) => detection.candidateId === 'unrelated-social'));
  assert.ok(!result.detections.some((detection) => detection.candidateId === 'unrelated-app'));
});

test('saved official assets drive matching instead of fixed brand assumptions', () => {
  const customProfile = {
    ...brandProfile,
    companyName: 'Acme Orbit',
    officialSocials: [{
      id: 'official-acme',
      platform: 'Instagram',
      displayName: 'Acme Orbit',
      username: 'acmeorbit',
      url: 'https://instagram.com/acmeorbit',
      verified: true,
    }],
    officialApps: [{
      id: 'official-acme-app',
      appName: 'Acme Orbit',
      store: 'Google Play',
      publisher: 'Acme Orbit Ltd',
      url: 'https://play.google.com/store/apps/details?id=io.acme.orbit',
      packageId: 'io.acme.orbit',
    }],
    knownPublishers: ['Acme Orbit Ltd'],
  };
  const result = buildDetections(
    customProfile,
    [{
      id: 'acme-social',
      platform: 'Instagram',
      displayName: 'Acme Orbit',
      username: 'acmeorbit',
      profileUrl: 'https://instagram.com/acmeorbit',
      bio: 'Official account',
      verified: true,
      source: 'test',
    }],
    [{
      id: 'acme-app',
      appName: 'Acme Orbit',
      store: 'Google Play',
      packageId: 'io.acme.orbit',
      publisher: 'Acme Orbit Ltd',
      storeUrl: 'https://play.google.com/store/apps/details?id=io.acme.orbit',
      description: 'Official app',
      source: 'test',
    }],
  );

  assert.equal(result.officialExcluded, 2);
  assert.ok(result.detections.every((detection) => detection.isOfficial && detection.riskScore === 0));
});

test('a handle used on a different platform is not automatically excluded as official', () => {
  const customProfile = {
    ...brandProfile,
    companyName: 'Acme Orbit',
    officialSocials: [{
      id: 'official-instagram',
      platform: 'Instagram',
      displayName: 'Acme Orbit',
      username: 'acmeorbit',
      url: 'https://instagram.com/acmeorbit',
      verified: true,
    }],
  };
  const result = buildDetections(customProfile, [{
    id: 'lookalike-x',
    platform: 'X',
    displayName: 'Acme Orbit Support',
    username: 'acmeorbit',
    profileUrl: 'https://x.com/acmeorbit',
    bio: 'Official account support. Verify your account to claim your reward.',
    verified: false,
    source: 'test',
  }], []);

  assert.equal(result.officialExcluded, 0);
  assert.ok(result.detections.some((detection) => detection.candidateId === 'lookalike-x' && !detection.isOfficial));
});

test('synthetic demo candidates adapt to any saved brand profile', () => {
  const customProfile = {
    ...brandProfile,
    companyName: 'Acme Orbit',
    officialSocials: [{
      id: 'official-acme',
      platform: 'Instagram',
      displayName: 'Acme Orbit',
      username: 'acmeorbit',
      url: 'https://instagram.com/acmeorbit',
      verified: true,
    }],
    officialApps: [{
      id: 'official-acme-app',
      appName: 'Acme Orbit',
      store: 'Google Play',
      publisher: 'Acme Orbit Ltd',
      url: 'https://play.google.com/store/apps/details?id=io.acme.orbit',
      packageId: 'io.acme.orbit',
    }],
    knownPublishers: ['Acme Orbit Ltd'],
  };
  const candidates = createDemoCandidates(customProfile);
  const result = buildDetections(customProfile, candidates.socialCandidates, candidates.appCandidates);

  assert.ok(candidates.socialCandidates.some((candidate) => candidate.displayName === 'Acme Orbit Support'));
  assert.ok(candidates.appCandidates.some((candidate) => candidate.appName === 'Acme Orbit Support'));
  assert.ok(candidates.socialCandidates.every((candidate) => candidate.source === 'Demo Dataset'));
  assert.ok(candidates.appCandidates.every((candidate) => candidate.source === 'Demo Dataset'));
  assert.equal(result.officialExcluded, 2);
  assert.ok(result.detections.some((detection) => detection.candidateName === 'Acme Orbit Support' && !detection.isOfficial));
});

test('detection evidence identifies the closest official asset and description overlap', () => {
  const customProfile = {
    ...brandProfile,
    companyName: 'Acme Orbit',
    description: 'Secure digital finance account support and payment wallet.',
    officialSocials: [{
      id: 'acme-social',
      platform: 'Instagram',
      displayName: 'Acme Orbit',
      username: 'acmeorbit',
      url: 'https://instagram.com/acmeorbit',
      verified: true,
    }],
  };
  const result = buildDetections(customProfile, [{
    id: 'acme-lookalike',
    platform: 'Instagram',
    displayName: 'Acme Orbit Support',
    username: 'acmeorbit.support',
    profileUrl: 'https://instagram.com/acmeorbit.support',
    bio: 'Secure digital finance account support and payment wallet. Verify your account.',
    verified: false,
    source: 'test provider',
  }], []);
  const detection = result.detections.find((item) => item.candidateId === 'acme-lookalike');

  assert.ok(detection);
  assert.equal(detection.matchedOfficialAsset, 'Acme Orbit (@acmeorbit)');
  assert.ok(detection.indicators.some((item) => item.type === 'Description Overlap' && item.triggered));
  assert.ok(detection.riskScore >= 50);
});

test('closer brand-name matches receive a higher risk score with the same behavioral evidence', () => {
  const makeCandidate = (id, displayName, username) => ({
    id,
    platform: 'X',
    displayName,
    username,
    profileUrl: `https://x.com/${username}`,
    bio: 'Official support. Verify your account to claim your reward.',
    verified: false,
    source: 'test',
  });
  const result = buildDetections(brandProfile, [
    makeCandidate('exact-brand-copy', 'NovaPay', 'novapay.helpdesk'),
    makeCandidate('typo-brand-copy', 'NovaPya', 'novapya.support'),
  ], []);
  const exact = result.detections.find((detection) => detection.candidateId === 'exact-brand-copy');
  const typo = result.detections.find((detection) => detection.candidateId === 'typo-brand-copy');

  assert.ok(exact);
  assert.ok(typo);
  assert.ok(exact.similarityScore > typo.similarityScore);
  assert.ok(exact.riskScore > typo.riskScore);
  assert.ok(exact.detectionReasons.some((reason) => reason.includes('risk points')));
});

test('short brand names still produce actionable synthetic high-risk examples', () => {
  const shortBrandProfile = { ...brandProfile, companyName: 'IBM', officialSocials: [], officialApps: [] };
  const candidates = createDemoCandidates(shortBrandProfile);
  const result = buildDetections(shortBrandProfile, candidates.socialCandidates, candidates.appCandidates);

  assert.ok(result.detections.some((detection) =>
    detection.assetType === 'Social Profile' && detection.riskScore >= 50,
  ));
  assert.ok(result.detections.some((detection) =>
    detection.assetType === 'Mobile App' && detection.riskScore >= 50,
  ));
});

test('analyst thresholds change the scan results', () => {
  const candidate = {
    id: 'threshold-social',
    platform: 'Instagram',
    displayName: 'NovaPay Support',
    username: 'novapay.support',
    profileUrl: 'https://instagram.com/novapay.support',
    bio: 'Customer help desk for NovaPay.',
    verified: false,
    source: 'test',
  };
  const permissive = buildDetections(brandProfile, [candidate], [], {
    nameSimilarityThreshold: 50,
    suspiciousKeywordThreshold: 25,
  });
  const strict = buildDetections(brandProfile, [candidate], [], {
    nameSimilarityThreshold: 90,
    suspiciousKeywordThreshold: 90,
  });

  assert.equal(permissive.detections.length, 1);
  assert.equal(strict.detections.length, 0);
});
