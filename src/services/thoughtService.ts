import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Thought, ReelItem, SortOrder } from "@/types/thought";
import { validateThought } from "@/lib/moderation";

// -------------------------------------------------------------
// SEED DATASETS (Community Starters — marked isCommunity: true, NO fake times)
// -------------------------------------------------------------
const INITIAL_SEED_THOUGHTS: Omit<Thought, "id">[] = [
  {
    text: "Bhai kal exam hai aur tu Instagram chala raha hai 💀",
    likes: 342,
    status: "active",
    reportCount: 0,
    authorHandle: "@exam_survivor",
    category: "College Life",
    isCommunity: true,
  },
  {
    text: "Mummy ke saamne phone chala raha tha aur notification mein 'bro ❤️' aa gaya.",
    likes: 289,
    status: "active",
    reportCount: 0,
    authorHandle: "@panic_master",
    category: "Family",
    isCommunity: true,
  },
  {
    text: "Kuch log online hoke bhi reply nahi karte, inki aatma ko shanti mile 🕊️",
    likes: 512,
    status: "active",
    reportCount: 0,
    authorHandle: "@left_on_read",
    category: "Overthinking",
    isCommunity: true,
  },
  {
    text: "Swiggy delivery agent calls: 'Sir main gate pe hu' — Me running down 3 floors in standard panic 🏃‍♂️",
    likes: 198,
    status: "active",
    reportCount: 0,
    authorHandle: "@foodie_runner",
    category: "Daily Life",
    isCommunity: true,
  },
  {
    text: "Group study mein sab kuch hota hai, bas padhai nahi hoti.",
    likes: 412,
    status: "active",
    reportCount: 0,
    authorHandle: "@backbencher_x",
    category: "College Life",
    isCommunity: true,
  },
  {
    text: "When you accidentally open the front camera on Monday morning 👁️👄👁️",
    likes: 154,
    status: "active",
    reportCount: 0,
    authorHandle: "@camera_shy",
    category: "Memes",
    isCommunity: true,
  },
  {
    text: "POV: You opened WhatsApp to reply to someone and immediately forgot who it was 🤡",
    likes: 270,
    status: "active",
    reportCount: 0,
    authorHandle: "@goldfish_memory",
    category: "Daily Life",
    isCommunity: true,
  },
  {
    text: "Sunday raat ko neend na aana is a personal attack by Monday.",
    likes: 310,
    status: "active",
    reportCount: 0,
    authorHandle: "@night_owl",
    category: "Work Life",
    isCommunity: true,
  },
  {
    text: "Mom: 'Yeh sab us phone ki wajah se ho raha hai.' Me with a sprained ankle: 💀",
    likes: 532,
    status: "active",
    reportCount: 0,
    authorHandle: "@desi_relatable",
    category: "Family",
    isCommunity: true,
  },
  {
    text: "That mini heart attack when your phone slips and lands face down on tile.",
    likes: 380,
    status: "active",
    reportCount: 0,
    authorHandle: "@cracked_screen",
    category: "Daily Life",
    isCommunity: true,
  },
  {
    text: "Making a detailed study timetable, then taking a 4-hour break to celebrate making the timetable.",
    likes: 490,
    status: "active",
    reportCount: 0,
    authorHandle: "@procrastinator_pro",
    category: "Study",
    isCommunity: true,
  },
  {
    text: "Accidentally liking a 3-year-old post while stalk scrolling at 2 AM 💀💀💀",
    likes: 610,
    status: "active",
    reportCount: 0,
    authorHandle: "@stalker_cat",
    category: "Overthinking",
    isCommunity: true,
  },
  {
    text: "Salary came at 9:00 AM. Me browsing online shopping at 9:05 AM: 'I deserve this treat' 💸",
    likes: 320,
    status: "active",
    reportCount: 0,
    authorHandle: "@broke_aesthetic",
    category: "Work Life",
    isCommunity: true,
  },
  {
    text: "Gym join kar liya hai, ab roz 5 min motivation reel dekh ke so jaata hu.",
    likes: 445,
    status: "active",
    reportCount: 0,
    authorHandle: "@fitness_legend",
    category: "Fitness",
    isCommunity: true,
  },
  {
    text: "Coding bug fixed in 5 minutes: I am a Genius God 🧠 | Bug takes 5 hours: I should quit software engineering 🤡",
    likes: 689,
    status: "active",
    reportCount: 0,
    authorHandle: "@dev_humor",
    category: "Coding",
    isCommunity: true,
  }
];

// Initial Seed Community Reels
const INITIAL_SEED_REELS: Omit<ReelItem, "id">[] = [
  {
    thoughtText: "Bhai kal exam hai aur tu Instagram chala raha hai 💀",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-looking-at-his-phone-in-bed-41487-large.mp4",
    creatorHandle: "@exam_meme_creator",
    caption: "Literally every student 10 hours before end-sem exams! 😭",
    likes: 1240,
    views: 8900,
    isCommunity: true,
  },
  {
    thoughtText: "Group study mein sab kuch hota hai, bas padhai nahi hoti.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-friends-sitting-on-a-table-studying-and-talking-42352-large.mp4",
    creatorHandle: "@backbencher_reels",
    caption: "Started with Chapter 1, ended up discussing multiverse theories at 3 AM 😂",
    likes: 2150,
    views: 14200,
    isCommunity: true,
  },
  {
    thoughtText: "When you accidentally open the front camera on Monday morning 👁️👄👁️",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-man-looking-surprised-at-his-smartphone-41490-large.mp4",
    creatorHandle: "@viral_vibes_official",
    caption: "That jumpscare hits different when the alarm rings 💀",
    likes: 980,
    views: 6500,
    isCommunity: true,
  },
  {
    thoughtText: "Salary came at 9:00 AM. Me browsing online shopping at 9:05 AM: 'I deserve this treat' 💸",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-holding-credit-card-and-using-laptop-42171-large.mp4",
    creatorHandle: "@relatable_corporate_life",
    caption: "Financial stability left the chat in 5 minutes flat 💳",
    likes: 1850,
    views: 11200,
    isCommunity: true,
  },
];

// -------------------------------------------------------------
// LOCAL STORAGE MOCK CACHE (V3)
// -------------------------------------------------------------
function getLocalThoughts(): Thought[] {
  if (typeof window === "undefined") {
    return INITIAL_SEED_THOUGHTS.map((t, idx) => ({ ...t, id: `seed_${idx}` }));
  }

  const stored = localStorage.getItem("thoughts_local_store_v4");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fallback
    }
  }

  const initial: Thought[] = INITIAL_SEED_THOUGHTS.map((t, idx) => ({
    ...t,
    id: `seed_${idx}`,
    isCommunity: true,
  }));
  localStorage.setItem("thoughts_local_store_v4", JSON.stringify(initial));
  return initial;
}

function saveLocalThoughts(thoughts: Thought[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("thoughts_local_store_v4", JSON.stringify(thoughts));
  }
}

function getLocalReels(): ReelItem[] {
  if (typeof window === "undefined") {
    return INITIAL_SEED_REELS.map((r, idx) => ({ ...r, id: `reel_seed_${idx}` }));
  }

  const stored = localStorage.getItem("reels_local_store_v3");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fallback
    }
  }

  const initial: ReelItem[] = INITIAL_SEED_REELS.map((r, idx) => ({
    ...r,
    id: `reel_seed_${idx}`,
    isCommunity: true,
  }));
  localStorage.setItem("reels_local_store_v3", JSON.stringify(initial));
  return initial;
}

function saveLocalReels(reels: ReelItem[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("reels_local_store_v3", JSON.stringify(reels));
  }
}

export interface FetchThoughtsResult {
  thoughts: Thought[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | number | null;
  hasMore: boolean;
}

// -------------------------------------------------------------
// THOUGHT SERVICES
// -------------------------------------------------------------
export async function fetchThoughts({
  pageSize = 10,
  lastDoc = null,
  sortOrder = "recent",
}: {
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | number | null;
  sortOrder?: SortOrder;
}): Promise<FetchThoughtsResult> {
  if (isFirebaseConfigured() && db) {
    try {
      const thoughtsRef = collection(db, "thoughts");
      const orderField = sortOrder === "popular" ? "likes" : "createdAt";

      let q = query(
        thoughtsRef,
        orderBy(orderField, "desc"),
        limit(pageSize)
      );

      if (lastDoc && typeof lastDoc !== "number") {
        q = query(
          thoughtsRef,
          orderBy(orderField, "desc"),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const rawThoughts: Thought[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        let createdTime: any = data.createdAt;
        if (createdTime && typeof createdTime.toDate === "function") {
          createdTime = createdTime.toDate().toISOString();
        }
        return {
          id: docSnap.id,
          text: data.text || "",
          createdAt: createdTime,
          likes: data.likes || 0,
          status: data.status || "active",
          reportCount: data.reportCount || 0,
          authorHandle: data.authorHandle || "@anonymous",
          category: data.category || "General",
          isCommunity: Boolean(data.isCommunity),
        };
      });

      const thoughts = rawThoughts.filter((t) => t.status === "active");

      // If cloud is empty and this is the first page, provide starter thoughts
      if (thoughts.length === 0 && !lastDoc) {
        const local = getLocalThoughts().filter((t) => t.status === "active");
        return {
          thoughts: local.slice(0, pageSize),
          lastDoc: null,
          hasMore: false,
        };
      }

      const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      const hasMore = snapshot.docs.length === pageSize;

      return { thoughts, lastDoc: newLastDoc, hasMore };
    } catch (error) {
      console.warn("Firestore fetch query failed, switching to local store:", error);
    }
  }

  // Local fallback
  const allThoughts = getLocalThoughts().filter((t) => t.status === "active");
  const sorted = [...allThoughts].sort((a, b) => {
    if (sortOrder === "popular") return b.likes - a.likes;
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  const startIndex = typeof lastDoc === "number" ? lastDoc : 0;
  const pageItems = sorted.slice(startIndex, startIndex + pageSize);
  const nextIndex = startIndex + pageItems.length;
  const hasMore = nextIndex < sorted.length;

  return {
    thoughts: pageItems,
    lastDoc: hasMore ? nextIndex : null,
    hasMore,
  };
}

export async function createThought(rawText: string, authorHandle?: string): Promise<Thought> {
  const modResult = validateThought(rawText);
  if (!modResult.isValid) {
    throw new Error(modResult.reason || "Invalid thought text.");
  }

  const text = rawText.trim();
  const handle = authorHandle?.trim() || "@anonymous_overthinker";

  if (isFirebaseConfigured() && db) {
    try {
      const payload = {
        text,
        createdAt: serverTimestamp(),
        likes: 0,
        status: "active" as const,
        reportCount: 0,
        authorHandle: handle,
        isCommunity: false,
      };

      const docRef = await addDoc(collection(db, "thoughts"), payload);
      return {
        id: docRef.id,
        text,
        createdAt: new Date(),
        likes: 0,
        status: "active",
        reportCount: 0,
        authorHandle: handle,
        isCommunity: false,
      };
    } catch (err) {
      console.warn("Firestore create failed, fallback to local:", err);
    }
  }

  const current = getLocalThoughts();
  const newThought: Thought = {
    id: "local_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    text,
    createdAt: new Date().toISOString(), // Real time stamp for newly dropped thought
    likes: 0,
    status: "active",
    reportCount: 0,
    authorHandle: handle,
    isCommunity: false,
  };

  saveLocalThoughts([newThought, ...current]);
  return newThought;
}

export async function toggleThoughtLikeService(
  thoughtId: string,
  isCurrentlyLiked: boolean
): Promise<void> {
  const delta = isCurrentlyLiked ? -1 : 1;

  if (isFirebaseConfigured() && db) {
    try {
      const thoughtRef = doc(db, "thoughts", thoughtId);
      await updateDoc(thoughtRef, { likes: increment(delta) });
      return;
    } catch (err) {
      console.warn("Firestore like update failed, fallback to local:", err);
    }
  }

  const current = getLocalThoughts();
  const updated = current.map((t) => (t.id === thoughtId ? { ...t, likes: Math.max(0, t.likes + delta) } : t));
  saveLocalThoughts(updated);
}

export async function reportThoughtService(thoughtId: string, threshold = 5): Promise<{ hidden: boolean }> {
  let isHidden = false;

  if (isFirebaseConfigured() && db) {
    try {
      const thoughtRef = doc(db, "thoughts", thoughtId);
      await updateDoc(thoughtRef, { reportCount: increment(1) });
      return { hidden: false };
    } catch (err) {
      console.warn("Firestore report failed, fallback to local:", err);
    }
  }

  const current = getLocalThoughts();
  const updated = current.map((t) => {
    if (t.id === thoughtId) {
      const newReportCount = t.reportCount + 1;
      const shouldHide = newReportCount >= threshold;
      if (shouldHide) isHidden = true;
      return { ...t, reportCount: newReportCount, status: shouldHide ? ("hidden" as const) : t.status };
    }
    return t;
  });

  saveLocalThoughts(updated);
  return { hidden: isHidden };
}

// -------------------------------------------------------------
// REELS SERVICES
// -------------------------------------------------------------
export interface FetchReelsResult {
  reels: ReelItem[];
  lastDoc: any;
  hasMore: boolean;
}

export async function fetchReels({
  pageSize = 10,
  lastDoc = null,
}: {
  pageSize?: number;
  lastDoc?: any;
}): Promise<FetchReelsResult> {
  if (isFirebaseConfigured() && db) {
    try {
      const reelsRef = collection(db, "reels");
      let q = query(reelsRef, orderBy("createdAt", "desc"), limit(pageSize));

      if (lastDoc && typeof lastDoc !== "number") {
        q = query(reelsRef, orderBy("createdAt", "desc"), startAfter(lastDoc), limit(pageSize));
      }

      const snapshot = await getDocs(q);
      const reels: ReelItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          thoughtId: data.thoughtId,
          thoughtText: data.thoughtText || "",
          videoUrl: data.videoUrl || "",
          creatorHandle: data.creatorHandle || "@creator",
          caption: data.caption || "",
          likes: data.likes || 0,
          views: data.views || 0,
          createdAt: data.createdAt,
          isCommunity: Boolean(data.isCommunity),
        };
      });

      const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      return { reels, lastDoc: newLastDoc, hasMore: snapshot.docs.length === pageSize };
    } catch (err) {
      console.warn("Firestore fetch reels failed, switching to local store:", err);
    }
  }

  // Local fallback
  const allReels = getLocalReels();
  const startIndex = typeof lastDoc === "number" ? lastDoc : 0;
  const pageItems = allReels.slice(startIndex, startIndex + pageSize);
  const nextIndex = startIndex + pageItems.length;

  return {
    reels: pageItems,
    lastDoc: nextIndex < allReels.length ? nextIndex : null,
    hasMore: nextIndex < allReels.length,
  };
}

export async function createReelPayload(payload: {
  videoUrl: string;
  thoughtText?: string;
  caption: string;
  creatorHandle: string;
}): Promise<ReelItem> {
  if (!payload.videoUrl.trim()) {
    throw new Error("Video URL or clip link is required.");
  }

  const handle = payload.creatorHandle.startsWith("@")
    ? payload.creatorHandle.trim()
    : "@" + payload.creatorHandle.trim();

  if (isFirebaseConfigured() && db) {
    try {
      const newDoc = {
        videoUrl: payload.videoUrl.trim(),
        thoughtText: payload.thoughtText?.trim() || "",
        caption: payload.caption.trim(),
        creatorHandle: handle,
        likes: 0,
        views: 1,
        createdAt: serverTimestamp(),
        isCommunity: false,
      };
      const docRef = await addDoc(collection(db, "reels"), newDoc);
      return {
        id: docRef.id,
        ...newDoc,
        createdAt: new Date(),
        isCommunity: false,
      };
    } catch (err) {
      console.warn("Firestore reel create failed, local fallback:", err);
    }
  }

  const current = getLocalReels();
  const newReel: ReelItem = {
    id: "reel_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    videoUrl: payload.videoUrl.trim(),
    thoughtText: payload.thoughtText?.trim() || "",
    caption: payload.caption.trim(),
    creatorHandle: handle,
    likes: 0,
    views: 1,
    createdAt: new Date().toISOString(), // Real time stamp for newly dropped reel
    isCommunity: false,
  };

  saveLocalReels([newReel, ...current]);
  return newReel;
}

export async function toggleReelLikeService(reelId: string, isLiked: boolean): Promise<void> {
  const delta = isLiked ? -1 : 1;

  if (isFirebaseConfigured() && db) {
    try {
      const reelRef = doc(db, "reels", reelId);
      await updateDoc(reelRef, { likes: increment(delta) });
      return;
    } catch (err) {
      console.warn("Firestore reel like update failed:", err);
    }
  }

  const current = getLocalReels();
  const updated = current.map((r) => (r.id === reelId ? { ...r, likes: Math.max(0, r.likes + delta) } : r));
  saveLocalReels(updated);
}
