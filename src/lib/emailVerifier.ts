/**
 * Comprehensive Email & Gmail Reality Validator
 * Checks syntax, provider-specific rules, common typos, disposable/fake domains,
 * and real MX existence.
 */

// Common disposable/fake email services to block
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "throwawaymail.com",
  "guerrillamail.com",
  "sharklasers.com",
  "yopmail.com",
  "dispostable.com",
  "trashmail.com",
  "fake.com",
  "example.com",
  "test.com",
  "asdf.com",
  "none.com",
  "null.com",
  "getairmail.com",
  "mohmal.com",
  "crazymailing.com",
  "fakemail.net",
  "nada.ltd",
  "inboxkitten.com",
  "burnermail.io",
]);

// Known typos mapping to real domains
const TYPO_MAP: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmil.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmeil.com": "gmail.com",
  "gmaul.com": "gmail.com",
  "gmai.co": "gmail.com",
  "gmail.co": "gmail.com",
  "gmaik.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yaho.co.in": "yahoo.co.in",
  "hotmial.com": "hotmail.com",
  "hotmaill.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "icluod.com": "icloud.com",
  "icoud.com": "icloud.com",
};

// Known popular real email providers that are guaranteed to exist
const MAJOR_REAL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "aol.com",
  "rediffmail.com",
]);

export interface EmailValidationResult {
  isValid: boolean;
  reason?: string;
  suggestion?: string;
  isGmail?: boolean;
}

/**
 * Fast synchronous deep validation
 */
export function validateEmailRealitySync(email: string): EmailValidationResult {
  if (!email || typeof email !== "string") {
    return { isValid: false, reason: "Email address is required." };
  }

  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return { isValid: false, reason: "Email address cannot be empty." };
  }

  // 1. Basic structural sanity
  if (!trimmed.includes("@")) {
    return { isValid: false, reason: "Missing '@' in email (e.g. username@gmail.com)." };
  }

  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    return { isValid: false, reason: "Email contains multiple '@' symbols." };
  }

  const [localPart, domain] = parts;
  const lowerDomain = domain.toLowerCase().trim();
  const lowerLocal = localPart.toLowerCase().trim();

  if (!localPart) {
    return { isValid: false, reason: "Please enter the username before '@'." };
  }

  if (!domain) {
    return { isValid: false, reason: "Please enter the domain after '@' (e.g. gmail.com)." };
  }

  // 2. Domain format & TLD checks
  if (!domain.includes(".")) {
    return { isValid: false, reason: `Missing domain extension (e.g. ${domain}.com).` };
  }

  const domainParts = lowerDomain.split(".");
  const tld = domainParts[domainParts.length - 1];

  if (!tld || tld.length < 2) {
    return { isValid: false, reason: "Invalid domain extension (.com, .in, etc.)." };
  }

  // General RFC-like syntax check
  const standardEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!standardEmailRegex.test(trimmed)) {
    return { isValid: false, reason: "Email contains invalid characters or formatting." };
  }

  // 3. Typo Detection
  if (TYPO_MAP[lowerDomain]) {
    const suggested = `${localPart}@${TYPO_MAP[lowerDomain]}`;
    return {
      isValid: false,
      reason: `"${domain}" is a common typo and does not exist in reality.`,
      suggestion: suggested,
    };
  }

  // 4. Block Fake / Disposable / Temporary Email Services
  if (DISPOSABLE_DOMAINS.has(lowerDomain)) {
    return {
      isValid: false,
      reason: `"${domain}" is a temporary/fake email service. Please use a real email like Gmail.`,
    };
  }

  // 5. Google / Gmail-specific strict rules
  const isGmailDomain = lowerDomain === "gmail.com" || lowerDomain === "googlemail.com";
  if (isGmailDomain) {
    // Gmail usernames cannot start or end with a dot
    if (lowerLocal.startsWith(".") || lowerLocal.endsWith(".")) {
      return { isValid: false, reason: "Gmail usernames cannot start or end with a period (.)." };
    }

    // Gmail does not allow consecutive dots
    if (lowerLocal.includes("..")) {
      return { isValid: false, reason: "Gmail usernames cannot contain consecutive periods (..)." };
    }

    // Gmail only allows letters (a-z), numbers (0-9), and periods (.)
    const cleanCharsRegex = /^[a-z0-9.]+$/;
    if (!cleanCharsRegex.test(lowerLocal)) {
      return {
        isValid: false,
        reason: "Gmail addresses only allow letters, numbers, and periods (no special symbols).",
      };
    }

    // Real Gmail username length rule: 6 to 30 characters (excluding dots)
    const pureUsername = lowerLocal.replace(/\./g, "");
    if (pureUsername.length < 6) {
      return {
        isValid: false,
        reason: `Gmail username "${localPart}" is too short. Google requires at least 6 characters in reality.`,
      };
    }
    if (pureUsername.length > 30) {
      return {
        isValid: false,
        reason: `Gmail username exceeds Google's maximum of 30 characters in reality.`,
      };
    }

    return { isValid: true, isGmail: true };
  }

  // 6. Non-Gmail domain checks: If not in major providers, ensure domain has reasonable structure
  if (!MAJOR_REAL_DOMAINS.has(lowerDomain)) {
    // Check if domain is obviously fake (e.g. repeated keys, too short or no vowels)
    if (domainParts[0].length < 3 && !["io", "me", "ai"].includes(domainParts[0])) {
      return { isValid: false, reason: `Domain "${domain}" is not a recognized mail provider.` };
    }
  }

  return { isValid: true, isGmail: false };
}

/**
 * Asynchronous validation including server-side MX record check when available
 */
export async function verifyEmailReality(email: string): Promise<EmailValidationResult> {
  const syncResult = validateEmailRealitySync(email);
  if (!syncResult.isValid) {
    return syncResult;
  }

  const domain = email.trim().split("@")[1].toLowerCase();

  // If it's a known major real provider (like gmail.com), it is 100% real
  if (MAJOR_REAL_DOMAINS.has(domain)) {
    return syncResult;
  }

  // For other custom domains, verify MX records via API endpoint
  try {
    const res = await fetch(`/api/verify-email?email=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        isValid: Boolean(data.isValid),
        reason: data.reason || (data.isValid ? undefined : "This email domain does not have active mail servers in reality."),
        suggestion: data.suggestion,
      };
    }
  } catch (err) {
    // Network fallback: rely on synchronous rules
  }

  return syncResult;
}
