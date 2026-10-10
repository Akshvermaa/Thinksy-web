/**
 * In-Memory OTP Service with Expiration, Attempt Limiting, and Verification.
 * Supports production mail delivery if SMTP/Resend is configured,
 * and provides instant delivery metadata for seamless local testing.
 */

interface OtpRecord {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
}

// Global store across Next.js API invocations in memory
const globalForOtp = globalThis as unknown as {
  otpStore?: Map<string, OtpRecord>;
};

const otpStore = globalForOtp.otpStore || new Map<string, OtpRecord>();
if (process.env.NODE_ENV !== "production") globalForOtp.otpStore = otpStore;

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

/**
 * Generate a 6-digit random verification code
 */
export function generateOtp(email: string): { code: string; expiresAt: number } {
  const normalizedEmail = email.trim().toLowerCase();

  // Generate 6-digit numerical code (e.g. 583921)
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  otpStore.set(normalizedEmail, {
    code,
    email: normalizedEmail,
    expiresAt,
    attempts: 0,
    createdAt: Date.now(),
  });

  return { code, expiresAt };
}

/**
 * Verify a submitted 6-digit code
 */
export function verifyOtp(
  email: string,
  userCode: string
): { isValid: boolean; reason?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    return {
      isValid: false,
      reason: "No verification code requested for this email. Please click resend.",
    };
  }

  // Expiration check
  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return {
      isValid: false,
      reason: "This verification code has expired. Please request a new code.",
    };
  }

  // Attempt limit check
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(normalizedEmail);
    return {
      isValid: false,
      reason: "Too many incorrect attempts. Please request a fresh code.",
    };
  }

  const cleanUserCode = userCode.trim().replace(/\D/g, "");

  // Match check
  if (record.code !== cleanUserCode) {
    record.attempts += 1;
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      isValid: false,
      reason: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  // Successful verification! Delete record so it cannot be re-used
  otpStore.delete(normalizedEmail);
  return { isValid: true };
}

/**
 * Retrieve the active OTP record (useful for demo/preview display in UI)
 */
export function getActiveOtp(email: string): string | null {
  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);
  if (!record || Date.now() > record.expiresAt) return null;
  return record.code;
}
