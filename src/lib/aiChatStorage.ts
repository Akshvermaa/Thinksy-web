"use client";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  thoughts?: string[];
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  style: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "thinksy_ai_muse_sessions_v2";
const ACTIVE_SESSION_KEY = "thinksy_ai_muse_active_session_id_v2";

/**
 * Cleanly generates a conversation title from the first prompt
 */
export function generateSessionTitle(prompt: string): string {
  if (!prompt || !prompt.trim()) return "New Chat";
  const cleaned = prompt.trim().replace(/^["'\s]+|["'\s]+$/g, "");
  // Take first sentence or up to 36 chars
  const firstSentence = cleaned.split(/[\n\r.?!]/)[0]?.trim() || cleaned;
  if (firstSentence.length <= 36) {
    return firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
  }
  return firstSentence.slice(0, 34).trim() + "...";
}

/**
 * Creates a brand new chat session with friendly welcome greeting
 */
export function createNewSession(userName?: string, style: string = "relatable"): ChatSession {
  const now = Date.now();
  const greeting =
    `Hey ${userName || "there"}! 👋 I'm **Thinksy AI**.\n\n` +
    `What's on your mind today? Chat with me, vent about your day, or ask for witty meme thoughts & reel hooks!`;

  return {
    id: `session_${now}_${Math.random().toString(36).substring(2, 7)}`,
    title: "New Chat",
    style,
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: `welcome_${now}`,
        role: "assistant",
        content: greeting,
        timestamp: now,
      },
    ],
  };
}

/**
 * Loads all chat sessions from localStorage sorted newest first
 */
export function loadChatSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: ChatSession[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (err) {
    console.error("Failed to load AI chat sessions from localStorage:", err);
    return [];
  }
}

/**
 * Saves all sessions to localStorage
 */
export function saveChatSessions(sessions: ChatSession[]): void {
  if (typeof window === "undefined") return;
  try {
    // Keep max 60 conversations to prevent storage limits
    const trimmed = sessions.slice(0, 60);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error("Failed to save AI chat sessions:", err);
  }
}

/**
 * Upserts a chat session and persists to localStorage
 */
export function saveOrUpdateSession(session: ChatSession): ChatSession[] {
  const sessions = loadChatSessions();
  const existingIdx = sessions.findIndex((s) => s.id === session.id);

  let updatedList: ChatSession[];
  if (existingIdx >= 0) {
    updatedList = [...sessions];
    updatedList[existingIdx] = {
      ...session,
      updatedAt: Date.now(),
    };
  } else {
    updatedList = [{ ...session, updatedAt: Date.now() }, ...sessions];
  }

  // Sort by updatedAt descending
  updatedList.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  saveChatSessions(updatedList);
  setActiveSessionId(session.id);
  return updatedList;
}

/**
 * Deletes a session by ID
 */
export function deleteChatSession(sessionId: string): ChatSession[] {
  const sessions = loadChatSessions();
  const filtered = sessions.filter((s) => s.id !== sessionId);
  saveChatSessions(filtered);
  return filtered;
}

/**
 * Clears all chat sessions
 */
export function clearAllChatSessions(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch (err) {
    console.error("Failed to clear chat sessions:", err);
  }
}

/**
 * Retrieves the currently active session ID
 */
export function getActiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

/**
 * Sets the active session ID
 */
export function setActiveSessionId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, id);
  } catch (err) {
    console.error("Failed to set active session ID:", err);
  }
}

/**
 * Formats timestamps into natural relative / date strings
 */
export function formatChatTime(timestamp: number): string {
  if (!timestamp) return "";
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
