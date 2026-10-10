export type ThoughtStatus = "active" | "hidden";

export interface Thought {
  id: string;
  text: string;
  createdAt?: any; // Real Timestamp or ISO string when dropped by user
  likes: number;
  status: ThoughtStatus;
  reportCount: number;
  authorHandle?: string;
  category?: string;
  isCommunity?: boolean;
}

export interface ReelItem {
  id: string;
  thoughtId?: string;
  thoughtText?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  creatorHandle: string;
  caption: string;
  likes: number;
  views: number;
  createdAt?: any;
  status?: ThoughtStatus;
  reportCount?: number;
  isCommunity?: boolean;
}

export interface ModerationResult {
  isValid: boolean;
  reason?: string;
  category?: "personal_info" | "chat_conversation" | "spam" | "inappropriate" | "length";
}

export type SortOrder = "recent" | "popular";
export type ActiveTab = "thoughts" | "reels" | "ai";
