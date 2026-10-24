export const SUSPICIOUS_SUFFIXES = [
  'support',
  'official',
  'help',
  'customer care',
  'customer service',
  'rewards',
  'offers',
  'giveaway',
  'helpdesk',
  'care',
  'service',
  'verify',
  'verification',
  'login',
  'security',
  'alert',
  'update',
];

export const SCAM_PHRASES = [
  'guaranteed rewards',
  'urgent payment',
  'credential verification',
  'verify your account',
  'claim your reward',
  'limited time offer',
  'send payment',
  'wire transfer',
  'gift card',
  'bitcoin payment',
  'free giveaway',
  'suspended account',
  'confirm your identity',
  'account locked',
  'click the link',
  'urgent action required',
  'double your money',
  'investment opportunity',
  'send your details',
  'password reset required',
];

export function containsSuspiciousSuffix(text: string): { found: boolean; matched: string[] } {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const suffix of SUSPICIOUS_SUFFIXES) {
    if (lower.includes(suffix)) {
      matched.push(suffix);
    }
  }
  return { found: matched.length > 0, matched };
}

export function containsScamPhrase(text: string): { found: boolean; matched: string[] } {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const phrase of SCAM_PHRASES) {
    if (lower.includes(phrase)) {
      matched.push(phrase);
    }
  }
  return { found: matched.length > 0, matched };
}
