function normalize(value = '') {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');
}

export function similarityScore(first = '', second = '') {
  const a = normalize(first);
  const b = normalize(second);
  if (!a || !b) return 0;
  if (a === b) return 100;

  const rows = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) rows[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) rows[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + substitutionCost,
      );

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }

  const editSimilarity = (Math.max(a.length, b.length) - rows[a.length][b.length])
    / Math.max(a.length, b.length);
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length > b.length ? a : b;
  const containedSimilarity = longer.includes(shorter) ? shorter.length / longer.length : 0;
  return Math.round(Math.max(editSimilarity, containedSimilarity) * 100);
}

function normalizedUrl(value = '') {
  try {
    const url = new URL(value);
    return `${url.hostname.toLowerCase().replace(/^www\./, '')}${url.pathname.replace(/\/+$/, '')}${url.search}`;
  } catch {
    return value.trim().toLowerCase().replace(/\/+$/, '');
  }
}

function matchesOfficialSocial(candidate, profile) {
  return profile.officialSocials.some((asset) => (
    (asset.platform === candidate.platform && normalize(asset.username) === normalize(candidate.username))
    || normalizedUrl(asset.url) === normalizedUrl(candidate.profileUrl)
  ));
}

function matchesOfficialApp(candidate, profile) {
  return profile.officialApps.some((asset) => (
    (asset.packageId && candidate.packageId && normalize(asset.packageId) === normalize(candidate.packageId))
    || normalizedUrl(asset.url) === normalizedUrl(candidate.storeUrl)
    || (
      normalize(asset.appName) === normalize(candidate.appName)
      && normalize(asset.publisher) === normalize(candidate.publisher)
    )
  ));
}

function keywordMatches(value, keywords) {
  const text = value.toLowerCase();
  return keywords.filter((keyword) => text.includes(keyword));
}

function textOverlapSimilarity(first = '', second = '') {
  const words = (value) => new Set(
    value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g, ' ').match(/[a-z0-9]{3,}/g) || [],
  );
  const a = words(first);
  const b = words(second);
  if (a.size === 0 || b.size === 0) return 0;
  const common = [...a].filter((word) => b.has(word)).length;
  return Math.round((common / new Set([...a, ...b]).size) * 100);
}

function closestOfficialSocial(candidate, profile) {
  const assets = profile.officialSocials.map((asset) => ({
    name: `${asset.displayName} (@${asset.username})`,
    similarity: Math.max(
      similarityScore(candidate.displayName, asset.displayName),
      similarityScore(candidate.username, asset.username),
    ),
  }));
  assets.push({
    name: profile.companyName,
    similarity: Math.max(
      similarityScore(candidate.displayName, profile.companyName),
      similarityScore(candidate.username, profile.companyName),
    ),
  });
  return assets.sort((a, b) => b.similarity - a.similarity)[0];
}

function closestOfficialApp(candidate, profile) {
  const assets = profile.officialApps.map((asset) => ({
    name: `${asset.appName} (${asset.store})`,
    similarity: similarityScore(candidate.appName, asset.appName),
  }));
  assets.push({
    name: profile.companyName,
    similarity: similarityScore(candidate.appName, profile.companyName),
  });
  return assets.sort((a, b) => b.similarity - a.similarity)[0];
}

function riskLevel(score) {
  if (score >= 75) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Medium';
  return 'Low';
}

function createDetection(candidate, profile, assetType, official, indicators, riskScore, reasons, extra = {}) {
  const candidateName = assetType === 'Social Profile' ? candidate.displayName : candidate.appName;
  const url = assetType === 'Social Profile' ? candidate.profileUrl : candidate.storeUrl;
  return {
    id: `det-${candidate.id}`,
    candidateId: candidate.id,
    candidateName,
    assetType,
    platformOrStore: assetType === 'Social Profile' ? candidate.platform : candidate.store,
    url,
    riskScore: official ? 0 : riskScore,
    riskLevel: riskLevel(official ? 0 : riskScore),
    similarityScore: extra.similarityScore ?? 100,
    indicators: official ? [] : indicators,
    detectionReasons: official ? ['Official registered asset — excluded from threat alerts'] : reasons,
    isOfficial: official,
    status: 'New',
    analystNotes: '',
    lastScanned: new Date().toISOString(),
    source: candidate.source || 'Demo Dataset',
    matchedOfficialAsset: extra.matchedOfficialAsset,
    ...(assetType === 'Social Profile'
      ? { bio: candidate.bio, verified: candidate.verified, followerCount: candidate.followerCount }
      : { description: candidate.description, publisher: candidate.publisher }),
  };
}

function scoreSocial(candidate, profile, settings) {
  const official = matchesOfficialSocial(candidate, profile);
  const closestAsset = closestOfficialSocial(candidate, profile);
  const similarity = closestAsset.similarity;
  if (official) return createDetection(candidate, profile, 'Social Profile', true, [], 0, [], { similarityScore: 100 });

  const suspiciousKeywords = keywordMatches(
    `${candidate.displayName} ${candidate.username}`,
    ['support', 'official', 'help', 'customer care', 'customer service', 'rewards', 'offers', 'giveaway', 'helpdesk', 'verify'],
  );
  const scamPhrases = keywordMatches(
    candidate.bio,
    ['guaranteed rewards', 'urgent payment', 'verify your account', 'claim your reward', 'credential verification', 'gift card', 'click the link'],
  );
  const descriptionSimilarity = textOverlapSimilarity(candidate.bio, profile.description);
  const nameThreshold = settings.nameSimilarityThreshold;
  const brandRelated = similarity >= nameThreshold - 20;
  const indicators = [
    { type: 'Name Similarity', detail: `Name similarity to ${closestAsset.name}: ${similarity}%`, weight: 35, triggered: similarity >= nameThreshold },
    { type: 'Impersonation Keywords', detail: suspiciousKeywords.length ? `Found: ${suspiciousKeywords.join(', ')}` : 'No impersonation keywords found', weight: 20, triggered: brandRelated && suspiciousKeywords.length > 0 },
    { type: 'Scam Language', detail: scamPhrases.length ? `Found: ${scamPhrases.join(', ')}` : 'No scam phrases found', weight: 25, triggered: brandRelated && scamPhrases.length > 0 },
    { type: 'Verification Status', detail: candidate.verified ? 'Platform-verified profile' : 'Profile is not platform-verified', weight: 10, triggered: brandRelated && !candidate.verified },
    { type: 'Logo Similarity', detail: candidate.logoSimilarity == null ? 'Logo similarity unavailable' : `Logo similarity: ${candidate.logoSimilarity}%`, weight: 10, triggered: brandRelated && candidate.logoSimilarity >= 70 },
    { type: 'Description Overlap', detail: `Bio and brand description overlap: ${descriptionSimilarity}%`, weight: 10, triggered: brandRelated && descriptionSimilarity >= 35 },
  ];
  const totalWeight = indicators.reduce((sum, item) => sum + item.weight, 0);
  const score = Math.round(indicators.filter((item) => item.triggered).reduce((sum, item) => sum + item.weight, 0) / totalWeight * 100);
  const reasons = indicators.filter((item) => item.triggered).map((item) => item.detail);
  const similarityProximity = Math.max(0, Math.min(1, (similarity - nameThreshold) / Math.max(1, 100 - nameThreshold)));
  const similarityBonus = (indicators.filter((item) => item.triggered).length >= 2 ? Math.round(similarityProximity * 15) : 0)
    + (!candidate.verified ? Math.round(similarityProximity * 5) : 0);
  if (similarityBonus > 0) reasons.push(`Close name match added ${similarityBonus} risk points`);
  const flagged = (similarity >= nameThreshold && (suspiciousKeywords.length > 0 || scamPhrases.length > 0 || !candidate.verified || candidate.logoSimilarity >= 70))
    || (brandRelated && scamPhrases.length > 0 && suspiciousKeywords.length > 0)
    || (brandRelated && descriptionSimilarity >= 35);
  if (!flagged) return null;
  if (score < settings.suspiciousKeywordThreshold) return null;

  return createDetection(candidate, profile, 'Social Profile', false, indicators, Math.min(100, score + similarityBonus), reasons, {
    similarityScore: similarity,
    matchedOfficialAsset: closestAsset.name,
  });
}

function scoreApp(candidate, profile, settings) {
  const official = matchesOfficialApp(candidate, profile);
  const closestAsset = closestOfficialApp(candidate, profile);
  const similarity = closestAsset.similarity;
  if (official) return createDetection(candidate, profile, 'Mobile App', true, [], 0, [], { similarityScore: 100 });

  const knownPublisher = profile.knownPublishers.some((publisher) => normalize(publisher) === normalize(candidate.publisher));
  const officialPackageIds = profile.officialApps.map((asset) => asset.packageId).filter(Boolean);
  const packageMismatch = Boolean(candidate.packageId && officialPackageIds.length > 0
    && !officialPackageIds.some((packageId) => normalize(packageId) === normalize(candidate.packageId)));
  const suspiciousKeywords = keywordMatches(candidate.appName, ['support', 'official', 'help', 'rewards', 'offers', 'wallet', 'verify']);
  const scamPhrases = keywordMatches(
    candidate.description,
    ['guaranteed rewards', 'urgent payment', 'verify your account', 'claim your reward', 'credential verification', 'gift card', 'click the link'],
  );
  const descriptionSimilarity = textOverlapSimilarity(candidate.description, profile.description);
  const nameThreshold = settings.nameSimilarityThreshold;
  const brandRelated = similarity >= nameThreshold - 20;
  const indicators = [
    { type: 'Name Similarity', detail: `App name similarity to ${closestAsset.name}: ${similarity}%`, weight: 35, triggered: similarity >= nameThreshold },
    { type: 'Publisher Mismatch', detail: knownPublisher ? 'Publisher is listed as official' : `Unrecognized publisher: ${candidate.publisher}`, weight: 25, triggered: brandRelated && !knownPublisher },
    { type: 'Package ID Mismatch', detail: packageMismatch ? 'Package ID differs from official registered apps' : 'No package ID mismatch detected', weight: 15, triggered: brandRelated && packageMismatch },
    { type: 'Impersonation Keywords', detail: suspiciousKeywords.length ? `Found: ${suspiciousKeywords.join(', ')}` : 'No impersonation keywords found', weight: 10, triggered: brandRelated && suspiciousKeywords.length > 0 },
    { type: 'Description Risk', detail: scamPhrases.length ? `Found: ${scamPhrases.join(', ')}` : 'No scam phrases found', weight: 15, triggered: brandRelated && scamPhrases.length > 0 },
    { type: 'Logo Similarity', detail: candidate.logoSimilarity == null ? 'Logo similarity unavailable' : `App icon similarity: ${candidate.logoSimilarity}%`, weight: 15, triggered: brandRelated && candidate.logoSimilarity >= 70 },
    { type: 'Description Overlap', detail: `App and brand description overlap: ${descriptionSimilarity}%`, weight: 15, triggered: brandRelated && descriptionSimilarity >= 35 },
  ];
  const totalWeight = indicators.reduce((sum, item) => sum + item.weight, 0);
  const score = Math.round(indicators.filter((item) => item.triggered).reduce((sum, item) => sum + item.weight, 0) / totalWeight * 100);
  const reasons = indicators.filter((item) => item.triggered).map((item) => item.detail);
  const similarityProximity = Math.max(0, Math.min(1, (similarity - nameThreshold) / Math.max(1, 100 - nameThreshold)));
  const similarityBonus = indicators.filter((item) => item.triggered).length >= 2
    ? Math.round(similarityProximity * 15)
    : 0;
  if (similarityBonus > 0) reasons.push(`Close name match added ${similarityBonus} risk points`);
  const flagged = brandRelated && (
    (similarity >= nameThreshold && !knownPublisher)
    || (similarity >= nameThreshold && (packageMismatch || scamPhrases.length > 0 || candidate.logoSimilarity >= 70))
    || (brandRelated && scamPhrases.length > 0 && suspiciousKeywords.length > 0)
    || (brandRelated && descriptionSimilarity >= 35)
  );
  if (!flagged) return null;
  if (score < settings.suspiciousKeywordThreshold) return null;

  return createDetection(candidate, profile, 'Mobile App', false, indicators, Math.min(100, score + similarityBonus), reasons, {
    similarityScore: similarity,
    matchedOfficialAsset: closestAsset.name,
  });
}

export function buildDetections(profile, socialCandidates, appCandidates, settings = {}) {
  const effectiveSettings = {
    nameSimilarityThreshold: Number.isFinite(settings.nameSimilarityThreshold)
      ? Math.min(95, Math.max(50, settings.nameSimilarityThreshold))
      : 70,
    suspiciousKeywordThreshold: Number.isFinite(settings.suspiciousKeywordThreshold)
      ? Math.min(90, Math.max(25, settings.suspiciousKeywordThreshold))
      : 50,
    autoExcludeOfficial: settings.autoExcludeOfficial !== false,
  };
  const detections = [];
  let officialExcluded = 0;

  for (const candidate of socialCandidates) {
    const detection = scoreSocial(candidate, profile, effectiveSettings);
    if (detection?.isOfficial) officialExcluded += 1;
    if (detection) detections.push(detection);
  }

  for (const candidate of appCandidates) {
    const detection = scoreApp(candidate, profile, effectiveSettings);
    if (detection?.isOfficial) officialExcluded += 1;
    if (detection) detections.push(detection);
  }

  return { detections, officialExcluded };
}
