"use client";

import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  collection,
  addDoc,
  setDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

export interface CommunityMember {
  id: string;
  displayName: string;
  handle: string;
  avatar: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: number; // Timestamp in milliseconds
}

export interface CommunityMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderHandle: string;
  senderAvatar: string;
  text?: string;
  voiceUrl?: string; // Base64 data URL or audio link
  voiceDuration?: number; // duration in seconds
  createdAt: number;
  recipientId?: string; // If set, this is a 1-on-1 direct message
}

const PUBLIC_MESSAGES_KEY = "thinksy_community_messages_v2";
const DIRECT_MESSAGES_KEY = "thinksy_direct_messages_v2";
const BLOCKED_USERS_KEY = "thinksy_blocked_users_v1";
const REPORTED_USERS_KEY = "thinksy_reported_users_v1";
const GENUINE_MEMBERS_REGISTRY_KEY = "thinksy_genuine_members_registry_v5";
const SAVED_ACCOUNTS_KEY = "thoughts_saved_accounts_v2";

// Fake seed IDs to purge
const FAKE_USER_IDS = new Set([
  "user_aarav",
  "user_priya",
  "user_rohan",
  "user_sneha",
  "user_kabir",
  "user_ananya",
  "user_dev",
]);

/**
 * Formats time since last active in the exact requested format:
 * e.g. "(2 min before)", "(15 min before)", "(1 hour before)", "(just now)"
 */
export function formatOfflineTime(lastSeenTimestamp: number): string {
  const diffMs = Math.max(0, Date.now() - lastSeenTimestamp);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) {
    return "(just now)";
  } else if (diffMin === 1) {
    return "(1 min before)";
  } else if (diffMin < 60) {
    return `(${diffMin} min before)`;
  } else if (diffHour === 1) {
    return "(1 hour before)";
  } else if (diffHour < 24) {
    return `(${diffHour} hours before)`;
  } else if (diffDay === 1) {
    return "(1 day before)";
  } else {
    return `(${diffDay} days before)`;
  }
}

/**
 * Registers or updates a genuine user in the community members registry
 */
export function registerGenuineMember(userProfile: {
  uid: string;
  displayName: string;
  handle: string;
  photoURL?: string | null;
  vibe?: string | null;
}): void {
  if (typeof window === "undefined" || !userProfile.uid) return;

  try {
    const raw = localStorage.getItem(GENUINE_MEMBERS_REGISTRY_KEY);
    const existing: CommunityMember[] = raw ? JSON.parse(raw) : [];

    const cleanHandle = userProfile.handle.startsWith("@")
      ? userProfile.handle
      : `@${userProfile.handle}`;

    const memberEntry: CommunityMember = {
      id: userProfile.uid,
      displayName: userProfile.displayName || cleanHandle.replace("@", ""),
      handle: cleanHandle,
      avatar: userProfile.photoURL || "/logo.png",
      bio: userProfile.vibe || "Active on Thinksy",
      isOnline: true,
      lastSeen: Date.now(),
    };

    const index = existing.findIndex(
      (m) =>
        m.id === userProfile.uid ||
        m.handle.toLowerCase() === cleanHandle.toLowerCase()
    );

    if (index >= 0) {
      existing[index] = {
        ...existing[index],
        ...memberEntry,
        lastSeen: Date.now(),
        isOnline: true,
      };
    } else {
      existing.unshift(memberEntry);
    }

    // Save cleaned genuine registry
    localStorage.setItem(GENUINE_MEMBERS_REGISTRY_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error("Failed to register genuine member", e);
  }

  // Cloud Firestore sync
  if (isFirebaseConfigured() && db && userProfile.uid) {
    try {
      const cleanHandle = userProfile.handle.startsWith("@")
        ? userProfile.handle
        : `@${userProfile.handle}`;
      setDoc(
        doc(db, "community_members", userProfile.uid),
        {
          id: userProfile.uid,
          displayName: userProfile.displayName || cleanHandle.replace("@", ""),
          handle: cleanHandle,
          avatar: userProfile.photoURL || "/logo.png",
          bio: userProfile.vibe || "Active on Thinksy",
          lastSeen: Date.now(),
        },
        { merge: true }
      ).catch((err) => console.warn("Firestore member sync error:", err));
    } catch (err) {
      console.warn("Firestore member setDoc error:", err);
    }
  }
}

/**
 * Unregisters a genuine user from the community members registry (e.g. on logout)
 */
export async function unregisterGenuineMember(uid: string): Promise<void> {
  if (typeof window === "undefined" || !uid) return;

  try {
    const raw = localStorage.getItem(GENUINE_MEMBERS_REGISTRY_KEY);
    if (raw) {
      const existing: CommunityMember[] = JSON.parse(raw);
      const filtered = existing.filter((m) => m.id !== uid);
      localStorage.setItem(GENUINE_MEMBERS_REGISTRY_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn("Failed to unregister genuine member locally", e);
  }

  // Cloud Firestore delete
  if (isFirebaseConfigured() && db && uid) {
    try {
      await deleteDoc(doc(db, "community_members", uid));
    } catch (err) {
      console.warn("Firestore member deleteDoc error:", err);
    }
  }
}

/**
 * Returns genuine community members from:
 * 1. Current logged in user
 * 2. Real saved accounts from the web app
 * 3. Genuine members registry
 * 4. Authors of thoughts dropped on the web app
 * ABSOLUTELY NO FAKE SEED USERS!
 */
export function getCommunityMembers(currentUser?: {
  uid?: string;
  displayName?: string;
  handle?: string;
  photoURL?: string | null;
}): CommunityMember[] {
  if (typeof window === "undefined") return [];

  const membersMap = new Map<string, CommunityMember>();

  // Load from genuine registry (only other genuine community members)
  try {
    const raw = localStorage.getItem(GENUINE_MEMBERS_REGISTRY_KEY);
    if (raw) {
      const parsed: CommunityMember[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((m) => {
          if (!FAKE_USER_IDS.has(m.id) && (!currentUser || m.id !== currentUser.uid)) {
            membersMap.set(m.handle.toLowerCase(), m);
          }
        });
      }
    }
  } catch (e) {
    console.warn("Error reading genuine registry", e);
  }

  // Convert map to list
  const memberList = Array.from(membersMap.values());
  const now = Date.now();
  const processed = memberList.map((m) => {
    const isRecentlyActive = now - m.lastSeen < 1000 * 60 * 4;
    return {
      ...m,
      isOnline: isRecentlyActive,
    };
  });

  return processed.sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    return b.lastSeen - a.lastSeen;
  });
}



/**
 * Retrieves public community messages, completely purging any fake starter messages!
 */
export function getPublicMessages(): CommunityMessage[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(PUBLIC_MESSAGES_KEY);
    if (!raw) return [];

    const parsed: CommunityMessage[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out any fake seed messages or fake users
    const genuineMessages = parsed.filter(
      (m) =>
        m &&
        !m.id.startsWith("msg_init_") &&
        !FAKE_USER_IDS.has(m.senderId)
    );

    // Save purged list back if cleaned
    if (genuineMessages.length !== parsed.length) {
      localStorage.setItem(PUBLIC_MESSAGES_KEY, JSON.stringify(genuineMessages));
    }

    return genuineMessages;
  } catch {
    return [];
  }
}

/**
 * Sends a message in the public community room
 */
export function sendPublicMessage(
  msg: Omit<CommunityMessage, "id" | "createdAt">
): CommunityMessage {
  const now = Date.now();
  const newMessage: CommunityMessage = {
    ...msg,
    id: `msg_${now}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
  };

  if (typeof window !== "undefined") {
    const current = getPublicMessages();
    const updated = [...current, newMessage];
    localStorage.setItem(PUBLIC_MESSAGES_KEY, JSON.stringify(updated));

    // Update sender's presence as active
    registerGenuineMember({
      uid: msg.senderId,
      displayName: msg.senderName,
      handle: msg.senderHandle,
      photoURL: msg.senderAvatar,
    });
  }

  // Cloud Firestore sync
  if (isFirebaseConfigured() && db) {
    try {
      addDoc(collection(db, "community_messages"), {
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderHandle: msg.senderHandle,
        senderAvatar: msg.senderAvatar || "/logo.png",
        text: msg.text || "",
        voiceUrl: msg.voiceUrl || null,
        voiceDuration: msg.voiceDuration || 0,
        createdAt: now,
      }).catch((err) => console.warn("Firestore send message error:", err));
    } catch (e) {
      console.warn("Firestore sync error:", e);
    }
  }

  return newMessage;
}

/**
 * Real-time subscription to public community messages via Cloud Firestore
 */
export function subscribeToCommunityMessages(
  callback: (messages: CommunityMessage[]) => void
): () => void {
  if (!isFirebaseConfigured() || !db) {
    callback(getPublicMessages());
    return () => {};
  }

  try {
    const q = query(
      collection(db, "community_messages"),
      orderBy("createdAt", "asc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudMessages: CommunityMessage[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              senderId: data.senderId,
              senderName: data.senderName,
              senderHandle: data.senderHandle,
              senderAvatar: data.senderAvatar || "/logo.png",
              text: data.text || undefined,
              voiceUrl: data.voiceUrl || undefined,
              voiceDuration: data.voiceDuration || undefined,
              createdAt: data.createdAt || Date.now(),
            };
          });

          // Filter out fake test users if any
          const genuine = cloudMessages.filter(
            (m) => m && !FAKE_USER_IDS.has(m.senderId)
          );
          callback(genuine);
        } else {
          callback(getPublicMessages());
        }
      },
      (err) => {
        console.warn("Firestore messages subscription error:", err);
        callback(getPublicMessages());
      }
    );

    return unsubscribe;
  } catch {
    callback(getPublicMessages());
    return () => {};
  }
}

/**
 * Real-time subscription to community members and live status
 */
export function subscribeToCommunityMembers(
  currentUser: { uid?: string; displayName?: string; handle?: string; photoURL?: string | null } | undefined,
  callback: (members: CommunityMember[]) => void
): () => void {
  if (!isFirebaseConfigured() || !db) {
    callback(getCommunityMembers(currentUser));
    return () => {};
  }

  try {
    const unsubscribe = onSnapshot(
      collection(db, "community_members"),
      (snapshot) => {
        const membersMap = new Map<string, CommunityMember>();

        // Only genuine members currently present in Cloud Firestore
        if (!snapshot.empty) {
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            if (data && data.handle && !FAKE_USER_IDS.has(data.id)) {
              if (currentUser && (data.id === currentUser.uid || data.handle.toLowerCase() === currentUser.handle?.toLowerCase())) {
                return;
              }
              const handleKey = data.handle.toLowerCase();
              const now = Date.now();
              const lastSeen = data.lastSeen || now;
              const isRecentlyActive = now - lastSeen < 1000 * 60 * 4;
              membersMap.set(handleKey, {
                id: data.id || docSnap.id,
                displayName: data.displayName || data.handle.replace("@", ""),
                handle: data.handle,
                avatar: data.avatar || "/logo.png",
                bio: data.bio || "Active on Thinksy",
                isOnline: isRecentlyActive,
                lastSeen,
              });
            }
          });
        }

        const memberList = Array.from(membersMap.values());
        memberList.sort((a, b) => {
          if (a.isOnline && !b.isOnline) return -1;
          if (!a.isOnline && b.isOnline) return 1;
          return b.lastSeen - a.lastSeen;
        });

        callback(memberList);
      },
      (err) => {
        console.warn("Firestore members subscription error:", err);
        callback([]);
      }
    );

    return unsubscribe;
  } catch {
    callback(getCommunityMembers(currentUser));
    return () => {};
  }
}

/**
 * Retrieves 1-on-1 direct messages between two users
 */
export function getDirectMessages(userAId: string, userBId: string): CommunityMessage[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(DIRECT_MESSAGES_KEY);
    const allDms: CommunityMessage[] = raw ? JSON.parse(raw) : [];
    return allDms.filter(
      (m) =>
        (m.senderId === userAId && m.recipientId === userBId) ||
        (m.senderId === userBId && m.recipientId === userAId)
    );
  } catch {
    return [];
  }
}

/**
 * Sends a 1-on-1 direct message
 */
export function sendDirectMessage(
  msg: Omit<CommunityMessage, "id" | "createdAt"> & { recipientId: string }
): CommunityMessage {
  const now = Date.now();
  const newMessage: CommunityMessage = {
    ...msg,
    id: `dm_${now}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
  };

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(DIRECT_MESSAGES_KEY);
      const allDms: CommunityMessage[] = raw ? JSON.parse(raw) : [];
      allDms.push(newMessage);
      localStorage.setItem(DIRECT_MESSAGES_KEY, JSON.stringify(allDms));
    } catch (e) {
      console.error("Failed to save direct message", e);
    }
  }

  // Cloud Firestore sync
  if (isFirebaseConfigured() && db) {
    try {
      addDoc(collection(db, "direct_messages"), {
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderHandle: msg.senderHandle,
        senderAvatar: msg.senderAvatar || "/logo.png",
        recipientId: msg.recipientId,
        text: msg.text || "",
        voiceUrl: msg.voiceUrl || null,
        voiceDuration: msg.voiceDuration || 0,
        createdAt: now,
      }).catch((err) => console.warn("Firestore send direct message error:", err));
    } catch (e) {
      console.warn("Firestore sync error:", e);
    }
  }

  return newMessage;
}

/**
 * Block Management
 */
export function getBlockedUsers(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BLOCKED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isUserBlocked(userId: string): boolean {
  return getBlockedUsers().includes(userId);
}

export function blockUser(userId: string): void {
  if (typeof window === "undefined") return;
  const blocked = getBlockedUsers();
  if (!blocked.includes(userId)) {
    blocked.push(userId);
    localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(blocked));
  }
}

export function unblockUser(userId: string): void {
  if (typeof window === "undefined") return;
  const blocked = getBlockedUsers().filter((id) => id !== userId);
  localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(blocked));
}

/**
 * Report & Block Management
 */
export function reportAndBlockUser(userId: string, reason: string = "Inappropriate behavior"): void {
  if (typeof window === "undefined") return;
  blockUser(userId);

  try {
    const raw = localStorage.getItem(REPORTED_USERS_KEY);
    const reports = raw ? JSON.parse(raw) : [];
    reports.push({
      userId,
      reason,
      timestamp: Date.now(),
    });
    localStorage.setItem(REPORTED_USERS_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error("Failed to log user report", e);
  }
}
