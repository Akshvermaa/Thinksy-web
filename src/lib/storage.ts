"use client";

const LIKED_THOUGHTS_KEY = "thoughts_liked_ids_v1";
const REPORTED_THOUGHTS_KEY = "thoughts_reported_ids_v1";
const DEVICE_ID_KEY = "thoughts_device_id";

/**
 * Returns a unique device identifier stored in localStorage
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "server-id";

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = "dev_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Checks if a thought is liked on this device
 */
export function isThoughtLiked(thoughtId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(LIKED_THOUGHTS_KEY);
    const likedIds: string[] = raw ? JSON.parse(raw) : [];
    return likedIds.includes(thoughtId);
  } catch {
    return false;
  }
}

/**
 * Toggles or sets liked state for a thought on this device
 */
export function toggleThoughtLiked(thoughtId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(LIKED_THOUGHTS_KEY);
    let likedIds: string[] = raw ? JSON.parse(raw) : [];
    const index = likedIds.indexOf(thoughtId);
    let nowLiked = false;

    if (index >= 0) {
      likedIds.splice(index, 1);
      nowLiked = false;
    } else {
      likedIds.push(thoughtId);
      nowLiked = true;
    }

    localStorage.setItem(LIKED_THOUGHTS_KEY, JSON.stringify(likedIds));
    return nowLiked;
  } catch {
    return false;
  }
}

/**
 * Checks if a thought has been reported by this device
 */
export function isThoughtReported(thoughtId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(REPORTED_THOUGHTS_KEY);
    const reportedIds: string[] = raw ? JSON.parse(raw) : [];
    return reportedIds.includes(thoughtId);
  } catch {
    return false;
  }
}

/**
 * Marks a thought as reported on this device
 */
export function markThoughtReported(thoughtId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(REPORTED_THOUGHTS_KEY);
    const reportedIds: string[] = raw ? JSON.parse(raw) : [];
    if (!reportedIds.includes(thoughtId)) {
      reportedIds.push(thoughtId);
      localStorage.setItem(REPORTED_THOUGHTS_KEY, JSON.stringify(reportedIds));
    }
  } catch (e) {
    console.error("Failed to mark thought as reported:", e);
  }
}
