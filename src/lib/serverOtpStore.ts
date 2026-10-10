import crypto from "crypto";
import { db, isFirebaseConfigured } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

import fs from "fs";
import path from "path";

export interface OtpMetadata {
  userId: string;
  email: string;
  otpHash: string;
  previousOtpHash?: string;
  validHashes?: string[];
  expiresAt: number;
  attempts: number;
  createdAt: number;
  lastRequestedAt: number;
}

export interface GenerateOtpResult {
  otp: string; // ONLY returned to the server-side sender to dispatch; NEVER logged or sent to client!
  expiresAt: number;
  cooldownSeconds: number;
  isExisting?: boolean;
}

export interface VerifyOtpResult {
  isValid: boolean;
  status: "success" | "invalid_code" | "expired" | "max_attempts" | "not_found";
  reason?: string;
}

const OTP_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes window
const COOLDOWN_MS = 15 * 1000; // 15 seconds cooldown between new email dispatches
const MAX_ATTEMPTS = 10;
const COLLECTION_NAME = "email_verifications";

// Persistent disk cache file to guarantee consistency across Next.js reloads and API chunks
const CACHE_FILE_PATH = path.join(process.cwd(), ".otp-cache.json");

function readDiskCache(): Record<string, OtpMetadata> {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const data = fs.readFileSync(CACHE_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (_) {}
  return {};
}

function writeDiskCache(cache: Record<string, OtpMetadata>) {
  try {
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache, null, 2), "utf-8");
  } catch (_) {}
}

// In-memory fallback
const globalMemory = globalThis as unknown as {
  serverOtpMemory?: Map<string, OtpMetadata>;
};
const memoryFallback = globalMemory.serverOtpMemory || new Map<string, OtpMetadata>();
if (process.env.NODE_ENV !== "production") globalMemory.serverOtpMemory = memoryFallback;

// Initialize memory from disk cache on module load
try {
  const disk = readDiskCache();
  for (const [k, v] of Object.entries(disk)) {
    if (v && v.expiresAt > Date.now()) {
      memoryFallback.set(k.toLowerCase(), v);
    }
  }
} catch (_) {}

function getHmacSecret(): string {
  return process.env.OTP_SECRET || "thoughts_secure_server_otp_hmac_secret_2026";
}

function withTimeout<T>(promise: Promise<T>, ms = 2000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms)),
  ]);
}

/**
 * Computes a secure HMAC-SHA256 hash of the OTP code
 */
export function hashOtp(otp: string): string {
  return crypto.createHmac("sha256", getHmacSecret()).update(otp.trim()).digest("hex");
}

/**
 * Compares two hashes in constant time to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, "utf-8"), Buffer.from(b, "utf-8"));
}

/**
 * Generate a cryptographically secure 6-digit OTP and store only its hash.
 * Always indexed primarily by normalizedEmail to prevent mismatched userIds or race conditions.
 */
export async function createOrRefreshOtp(
  userId: string,
  email: string
): Promise<{ success: boolean; data?: GenerateOtpResult; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanUserId = userId.trim();
  const docId = normalizedEmail;

  // 1. Check existing record
  let existing: OtpMetadata | null = null;
  const disk = readDiskCache();
  if (disk[docId]) {
    existing = disk[docId];
  } else if (memoryFallback.has(docId)) {
    existing = memoryFallback.get(docId) || null;
  }

  if (!existing && isFirebaseConfigured() && db) {
    try {
      const snap = await withTimeout(getDoc(doc(db, COLLECTION_NAME, docId)), 1500);
      if (snap.exists()) {
        existing = snap.data() as OtpMetadata;
      }
    } catch (_) {}
  }

  // 2. Cooldown check
  if (existing && Date.now() - existing.lastRequestedAt < COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((COOLDOWN_MS - (Date.now() - existing.lastRequestedAt)) / 1000);
    return {
      success: false,
      error: `Please wait ${remainingSeconds}s before requesting a new code.`,
    };
  }

  // 3. Generate cryptographically secure random 6-digit OTP
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const otpHash = hashOtp(rawOtp);
  const now = Date.now();
  const expiresAt = now + OTP_EXPIRY_MS;

  // Preserve all recent unexpired hashes in validHashes array so ANY code received in email works
  const validHashes: string[] = [];
  if (existing) {
    if (Array.isArray(existing.validHashes)) {
      validHashes.push(...existing.validHashes);
    }
    if (existing.otpHash && !validHashes.includes(existing.otpHash)) {
      validHashes.push(existing.otpHash);
    }
    if (existing.previousOtpHash && !validHashes.includes(existing.previousOtpHash)) {
      validHashes.push(existing.previousOtpHash);
    }
  }
  if (!validHashes.includes(otpHash)) {
    validHashes.push(otpHash);
  }

  const record: OtpMetadata = {
    userId: cleanUserId || normalizedEmail,
    email: normalizedEmail,
    otpHash,
    previousOtpHash: existing?.otpHash,
    validHashes,
    expiresAt,
    attempts: 0,
    createdAt: now,
    lastRequestedAt: now,
  };

  // 4. Save to Memory and Disk Cache
  memoryFallback.set(docId, record);
  if (cleanUserId && cleanUserId !== docId) memoryFallback.set(cleanUserId, record);

  const updatedDisk = readDiskCache();
  updatedDisk[docId] = record;
  if (cleanUserId && cleanUserId !== docId) updatedDisk[cleanUserId] = record;
  writeDiskCache(updatedDisk);

  // Best-effort Firestore sync
  if (isFirebaseConfigured() && db) {
    try {
      await withTimeout(setDoc(doc(db, COLLECTION_NAME, docId), record), 1000);
      if (cleanUserId && cleanUserId !== docId) {
        await withTimeout(setDoc(doc(db, COLLECTION_NAME, cleanUserId), record), 1000);
      }
    } catch (_) {}
  }

  return {
    success: true,
    data: {
      otp: rawOtp,
      expiresAt,
      cooldownSeconds: 60,
    },
  };
}

/**
 * Verify submitted OTP against stored hash, enforcing expiration and attempt count.
 * Accepts either an object { email, userId } or a string (email or userId).
 */
export async function verifyAndConsumeOtp(
  identifier: string | { email?: string; userId?: string },
  userCode: string
): Promise<VerifyOtpResult> {
  let emailKey = "";
  let userKey = "";

  if (typeof identifier === "string") {
    if (identifier.includes("@")) {
      emailKey = identifier.trim().toLowerCase();
    } else {
      userKey = identifier.trim();
    }
  } else if (identifier && typeof identifier === "object") {
    if (identifier.email) emailKey = identifier.email.trim().toLowerCase();
    if (identifier.userId) userKey = identifier.userId.trim();
  }

  const cleanCode = userCode.trim().replace(/\D/g, "");

  if (cleanCode.length !== 6) {
    return {
      isValid: false,
      status: "invalid_code",
      reason: "Invalid verification code. Code must be exactly 6 digits.",
    };
  }

  // 1. Retrieve stored OTP metadata
  let record: OtpMetadata | null = null;
  let activeDocId = emailKey || userKey;

  const disk = readDiskCache();
  if (emailKey && disk[emailKey]) {
    record = disk[emailKey];
    activeDocId = emailKey;
  } else if (userKey && disk[userKey]) {
    record = disk[userKey];
    activeDocId = userKey;
  }

  if (!record) {
    if (emailKey && memoryFallback.has(emailKey)) {
      record = memoryFallback.get(emailKey) || null;
      activeDocId = emailKey;
    } else if (userKey && memoryFallback.has(userKey)) {
      record = memoryFallback.get(userKey) || null;
      activeDocId = userKey;
    } else {
      // Linear scan across memory fallback for matching email or userId
      for (const item of memoryFallback.values()) {
        if (
          (emailKey && item.email.toLowerCase() === emailKey) ||
          (userKey && item.userId === userKey)
        ) {
          record = item;
          activeDocId = item.email;
          break;
        }
      }
    }
  }

  if (!record && isFirebaseConfigured() && db) {
    try {
      if (emailKey) {
        const snap = await withTimeout(getDoc(doc(db, COLLECTION_NAME, emailKey)), 1500);
        if (snap.exists()) {
          record = snap.data() as OtpMetadata;
          activeDocId = emailKey;
        }
      }
      if (!record && userKey) {
        const snap = await withTimeout(getDoc(doc(db, COLLECTION_NAME, userKey)), 1500);
        if (snap.exists()) {
          record = snap.data() as OtpMetadata;
          activeDocId = userKey;
        }
      }
    } catch (_) {}
  }

  if (!record) {
    return {
      isValid: false,
      status: "not_found",
      reason: "No verification code found. Please request a new code.",
    };
  }

  // 2. Check Expiration
  if (Date.now() > record.expiresAt) {
    await deleteOtpRecord(record.email, record.userId);
    return {
      isValid: false,
      status: "expired",
      reason: "This code has expired. Please request a new OTP.",
    };
  }

  // 3. Check Attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    await deleteOtpRecord(record.email, record.userId);
    return {
      isValid: false,
      status: "max_attempts",
      reason: "Maximum verification attempts exceeded. Please request a new OTP.",
    };
  }

  // 4. Verify Hash in Constant Time (checks current hash, previous hash, and all valid recent hashes)
  const submittedHash = hashOtp(cleanCode);
  const isCurrentMatch = secureCompare(record.otpHash, submittedHash);
  const isPreviousMatch = record.previousOtpHash
    ? secureCompare(record.previousOtpHash, submittedHash)
    : false;
  const isAnyValidMatch = Array.isArray(record.validHashes)
    ? record.validHashes.some((h) => secureCompare(h, submittedHash))
    : false;
  const isMatch = isCurrentMatch || isPreviousMatch || isAnyValidMatch;

  if (!isMatch) {
    // Increment attempt counter
    const newAttempts = record.attempts + 1;
    record.attempts = newAttempts;
    memoryFallback.set(activeDocId, record);
    const curDisk = readDiskCache();
    curDisk[activeDocId] = record;
    writeDiskCache(curDisk);

    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, COLLECTION_NAME, activeDocId), { attempts: newAttempts });
      } catch (_) {}
    }

    return {
      isValid: false,
      status: "invalid_code",
      reason: "Invalid verification code. Please check the 6 digits sent to your email.",
    };
  }

  // 5. Success: Delete/invalidate OTP record & update Firestore user document
  await deleteOtpRecord(record.email, record.userId);

  // Update user's Firestore document with emailVerified: true
  const targetUid = record.userId || record.email;
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(
        doc(db, "users", targetUid),
        {
          uid: targetUid,
          email: record.email,
          emailVerified: true,
          verifiedAt: Date.now(),
        },
        { merge: true }
      );
    } catch (_) {}
  }

  return {
    isValid: true,
    status: "success",
  };
}

/**
 * Helper to delete/invalidate the OTP record across all its keys
 */
async function deleteOtpRecord(emailKey: string, userKey?: string) {
  const disk = readDiskCache();
  if (emailKey) {
    const k = emailKey.toLowerCase();
    memoryFallback.delete(k);
    delete disk[k];
    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, k));
      } catch (_) {}
    }
  }
  if (userKey && userKey !== emailKey) {
    memoryFallback.delete(userKey);
    delete disk[userKey];
    if (isFirebaseConfigured() && db) {
      try {
        await deleteDoc(doc(db, COLLECTION_NAME, userKey));
      } catch (_) {}
    }
  }
  writeDiskCache(disk);
}
