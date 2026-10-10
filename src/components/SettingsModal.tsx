"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Settings,
  User,
  Palette,
  Volume2,
  VolumeX,
  Sparkles,
  Database,
  Moon,
  Sun,
  Sunset,
  Check,
  LogOut,
  ArrowLeftRight,
  ShieldCheck,
  Sliders,
  Trash2,
  Bot,
  Flame,
  Clock,
  Video,
  MessageSquareQuote,
  Save,
  Bell,
  Eye,
  EyeOff,
  Type,
  Smartphone,
  Shield,
  FileText,
  Award,
  Heart,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { sound } from "@/lib/sound";
import { useToast } from "./ToastContainer";
import { isFirebaseConfigured } from "@/lib/firebase";
import { useScrollLock } from "@/lib/useScrollLock";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSwitchAccount?: () => void;
}

const AI_VIBES = [
  { id: "relatable", label: "Relatable & Chill", desc: "Friendly WhatsApp/DM companion (Everyday thoughts)" },
  { id: "witty", label: "Witty & Sarcastic", desc: "Sharp humor, playful banter, roasts and memes" },
  { id: "deep", label: "3 AM Philosophical", desc: "Late-night deep introspective thoughts & poetry" },
  { id: "hinglish", label: "Gen-Z & Hinglish", desc: "Desi slang, relatable college & office humor" },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenSwitchAccount,
}) => {
  const { user, updateUserProfile, logout, openLoginModal } = useAuth();
  const { theme, setTheme, isLight } = useTheme();
  const { showToast } = useToast();

  const isCloud = isFirebaseConfigured();

  // Active Settings Tab
  const [activeTab, setActiveTab] = useState<"profile" | "contribution" | "appearance" | "feed" | "notifications" | "ai" | "privacy">("profile");

  // User Contribution Stats
  const [contributionStats, setContributionStats] = useState({
    thoughtsCount: 0,
    likesReceived: 0,
    likesGiven: 0,
    reputationScore: 0,
    myThoughts: [] as any[],
  });

  // Free-form Profile Inputs (No forced suggestions)
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [handle, setHandle] = useState(user?.handle || "");
  const [bio, setBio] = useState(user?.vibe || "");
  const [hasProfileChanges, setHasProfileChanges] = useState(false);

  // Appearance & Display
  const [textSize, setTextSize] = useState<"comfortable" | "compact">("comfortable");
  const [amoledDark, setAmoledDark] = useState(false);

  // Audio & Notifications
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);

  // Feed & Reading
  const [defaultTab, setDefaultTab] = useState<string>("thoughts");
  const [defaultSort, setDefaultSort] = useState<string>("recent");
  const [autoplayReels, setAutoplayReels] = useState(true);
  const [blurSensitive, setBlurSensitive] = useState(false);

  // Privacy
  const [anonymousDefault, setAnonymousDefault] = useState(false);

  // AI Preferences
  const [aiVibe, setAiVibe] = useState<string>("relatable");
  const [autoExtractQuotes, setAutoExtractQuotes] = useState(true);

  // Confirm Logout Modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setHandle(user.handle || "");
      setBio(user.vibe || "");
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;
    setSoundEnabled(sound.isEnabled());

    try {
      const storedTab = localStorage.getItem("thinksy_pref_default_tab");
      if (storedTab) setDefaultTab(storedTab);

      const storedSort = localStorage.getItem("thinksy_pref_sort");
      if (storedSort) setDefaultSort(storedSort);

      const storedAi = localStorage.getItem("thinksy_pref_ai_style");
      if (storedAi) setAiVibe(storedAi);

      const storedText = localStorage.getItem("thinksy_pref_text_size");
      if (storedText === "compact" || storedText === "comfortable") setTextSize(storedText);

      const storedAutoplay = localStorage.getItem("thinksy_pref_autoplay");
      if (storedAutoplay !== null) setAutoplayReels(storedAutoplay === "true");

      const storedAnon = localStorage.getItem("thinksy_pref_anon_default");
      if (storedAnon !== null) setAnonymousDefault(storedAnon === "true");

      const storedSensitive = localStorage.getItem("thinksy_pref_blur_sensitive");
      if (storedSensitive !== null) setBlurSensitive(storedSensitive === "true");
    } catch (e) {
      // storage unavailable
    }

    // Load user contributions
    try {
      const rawThoughts = localStorage.getItem("thoughts_local_store_v4");
      const allThoughts = rawThoughts ? JSON.parse(rawThoughts) : [];
      const userHandle = user?.handle?.toLowerCase();
      const myThoughts = Array.isArray(allThoughts)
        ? allThoughts.filter(
            (t: any) =>
              (t.authorHandle && userHandle && t.authorHandle.toLowerCase() === userHandle) ||
              (!t.isCommunity && t.authorHandle && userHandle && t.authorHandle.includes(userHandle.replace("@", "")))
          )
        : [];

      const likesReceived = myThoughts.reduce(
        (acc: number, t: any) => acc + (t.likes || 0),
        0
      );

      const rawLikedIds = localStorage.getItem("thoughts_liked_ids_v1");
      const likedIds = rawLikedIds ? JSON.parse(rawLikedIds) : [];
      const likesGiven = Array.isArray(likedIds) ? likedIds.length : 0;

      const reputationScore = myThoughts.length * 20 + likesReceived * 5 + likesGiven * 2;

      setContributionStats({
        thoughtsCount: myThoughts.length,
        likesReceived,
        likesGiven,
        reputationScore,
        myThoughts,
      });
    } catch (e) {
      console.warn("Error calculating contribution stats:", e);
    }
  }, [isOpen, user, activeTab]);

  // Lock background scrolling while SettingsModal is open
  useScrollLock(isOpen);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showToast("Display name cannot be empty.", "error");
      return;
    }

    const cleanHandle = handle.trim();
    const formattedHandle = cleanHandle ? (cleanHandle.startsWith("@") ? cleanHandle : `@${cleanHandle}`) : user?.handle || "@anonymous";

    updateUserProfile({
      displayName: displayName.trim(),
      handle: formattedHandle,
      vibe: bio.trim(),
    });

    sound.playPop(520);
    showToast("Profile changes saved successfully! ✨", "success");
    setHasProfileChanges(false);
  };

  const handleToggleSound = () => {
    const newState = sound.toggleSound();
    setSoundEnabled(newState);
    if (newState) {
      sound.playPop(560);
      showToast("Sound effects enabled 🔊", "success");
    } else {
      showToast("Sound effects muted 🔇", "info");
    }
  };

  const handleTestSound = () => {
    sound.playPop(620);
    showToast("Testing audio pop! 🎶", "info");
  };

  const handleSetDefaultTab = (tab: string) => {
    setDefaultTab(tab);
    sound.playPop(480);
    localStorage.setItem("thinksy_pref_default_tab", tab);
    showToast(`Default view set to ${tab === "thoughts" ? "Thoughts" : tab === "reels" ? "Reels" : "AI Muse"}!`, "success");
  };

  const handleSetDefaultSort = (sort: string) => {
    setDefaultSort(sort);
    sound.playPop(460);
    localStorage.setItem("thinksy_pref_sort", sort);
    showToast(`Default sort set to ${sort === "recent" ? "Most Recent" : "Top Liked"}!`, "success");
  };

  const handleSetTextSize = (size: "comfortable" | "compact") => {
    setTextSize(size);
    sound.playPop(480);
    localStorage.setItem("thinksy_pref_text_size", size);
    showToast(`Text density set to ${size}!`, "success");
  };

  const handleToggleAutoplay = () => {
    const next = !autoplayReels;
    setAutoplayReels(next);
    sound.playPop(480);
    localStorage.setItem("thinksy_pref_autoplay", String(next));
    showToast(next ? "Autoplay reels enabled" : "Autoplay reels disabled", "info");
  };

  const handleToggleAnonymous = () => {
    const next = !anonymousDefault;
    setAnonymousDefault(next);
    sound.playPop(480);
    localStorage.setItem("thinksy_pref_anon_default", String(next));
    showToast(next ? "Anonymous posting enabled by default" : "Posting with your handle by default", "info");
  };

  const handleToggleSensitive = () => {
    const next = !blurSensitive;
    setBlurSensitive(next);
    sound.playPop(480);
    localStorage.setItem("thinksy_pref_blur_sensitive", String(next));
    showToast(next ? "Sensitive thoughts blur enabled" : "Sensitive filter disabled", "info");
  };

  const handleSetAiVibe = (styleId: string) => {
    setAiVibe(styleId);
    sound.playPop(500);
    localStorage.setItem("thinksy_pref_ai_style", styleId);
    showToast(`AI Muse vibe updated to: ${AI_VIBES.find((v) => v.id === styleId)?.label}! 🤖`, "success");
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem("thoughts_liked_ids_v1");
      sound.playPop(350);
      showToast("Local like history cache cleared.", "info");
    } catch (e) {
      showToast("Unable to clear cache.", "error");
    }
  };

  const handleSwitchAccountClick = () => {
    sound.playPop(450);
    onClose();
    if (onOpenSwitchAccount) {
      onOpenSwitchAccount();
    } else {
      openLoginModal("Switch to another creator account");
    }
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    onClose();
    await logout();
    showToast("Signed out. See you soon! 👋", "info");
  };

  return (
    <AnimatePresence>
      {/* Outer fixed overlay covering full viewport */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        {/* Backdrop click to dismiss */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`relative z-10 w-full max-w-2xl rounded-[28px] sm:rounded-[36px] shadow-2xl flex flex-col overflow-hidden border h-auto max-h-[86vh] transition-colors ${
            isLight
              ? "bg-white border-slate-200 text-slate-900 shadow-slate-300/40"
              : "bg-[#0b081c] border-slate-800 text-white shadow-black/90"
          }`}
        >
          {/* 1. MODAL HEADER: shrink-0 guaranteed to never cut off */}
          <div
            className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between shrink-0 ${
              isLight ? "border-slate-100 bg-white" : "border-slate-800/80 bg-[#0b081c]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-purple-600 to-pink-500 p-0.5 shadow-md shadow-indigo-600/25 shrink-0">
                <div
                  className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                    isLight ? "bg-white" : "bg-[#0b081c]"
                  }`}
                >
                  <Settings className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <span>Thinksy Settings</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border bg-amber-500/10 border-amber-500/30 text-amber-400">
                    Preferences
                  </span>
                </h3>
                <p className={`text-[11px] sm:text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  Customize your profile, feed display, and application behavior
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playPop(380);
                onClose();
              }}
              className={`p-2 rounded-2xl border transition active:scale-95 ${
                isLight
                  ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                  : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
              }`}
              title="Close Settings"
              aria-label="Close Settings"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* 2. CATEGORY TABS: shrink-0 */}
          <div
            className={`px-5 sm:px-6 py-2.5 border-b flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 ${
              isLight ? "border-slate-100 bg-slate-50/90" : "border-slate-800/80 bg-slate-900/60"
            }`}
          >
            {[
              { id: "profile", label: "Profile", icon: <User className="w-3.5 h-3.5" /> },
              { id: "contribution", label: "Your Contribution", icon: <Award className="w-3.5 h-3.5" /> },
              { id: "appearance", label: "Appearance", icon: <Palette className="w-3.5 h-3.5" /> },
              { id: "feed", label: "Feed & Display", icon: <Sliders className="w-3.5 h-3.5" /> },
              { id: "notifications", label: "Sound & Alerts", icon: <Bell className="w-3.5 h-3.5" /> },
              { id: "ai", label: "AI Muse", icon: <Bot className="w-3.5 h-3.5" /> },
              { id: "privacy", label: "Data & Privacy", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playPop(420);
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30 scale-102"
                    : isLight
                    ? "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                    : "bg-slate-900/70 hover:bg-slate-800 text-slate-400 border border-slate-800"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* 3. SCROLLABLE SETTINGS BODY */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-6 overscroll-contain">
            {/* TAB 1: PROFILE & IDENTITY (NO FORCED SUGGESTIONS) */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                {/* User Identity Card */}
                <div
                  className={`p-4 rounded-3xl border flex items-center gap-4 transition-colors ${
                    isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                  }`}
                >
                  <div className="w-14 h-14 rounded-full p-0.5 ring-2 ring-amber-400/50 overflow-hidden bg-black shrink-0 shadow-md">
                    <img src="/logo.png" alt="Thinksy Logo" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-base truncate">{user?.displayName || "Thinksy Creator"}</h4>
                      {user?.emailVerified && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold shrink-0">
                          <Check className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-indigo-400">{user?.handle || "@anonymous"}</p>
                    <p className={`text-[11px] truncate mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      {user?.email || "No email linked (Guest / Quick Session)"}
                    </p>
                  </div>
                </div>

                {/* Real Free-Form Edit Profile Form */}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Display Name Input */}
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                        Full / Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => {
                          setDisplayName(e.target.value);
                          setHasProfileChanges(true);
                        }}
                        placeholder="e.g. Aksh Verma"
                        className={`w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm outline-none transition ${
                          isLight
                            ? "bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white text-slate-900"
                            : "bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white"
                        }`}
                      />
                    </div>

                    {/* Handle (@) Input */}
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                        Creator Handle (@username)
                      </label>
                      <input
                        type="text"
                        value={handle}
                        onChange={(e) => {
                          setHandle(e.target.value);
                          setHasProfileChanges(true);
                        }}
                        placeholder="@username"
                        className={`w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-mono outline-none transition ${
                          isLight
                            ? "bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white text-slate-900"
                            : "bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Free-form Bio / Status Textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={`text-xs font-bold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                        About You / Creator Bio
                      </label>
                      <span className="text-[10px] font-mono opacity-60">
                        {bio.length}/160
                      </span>
                    </div>
                    <textarea
                      value={bio}
                      maxLength={160}
                      rows={3}
                      onChange={(e) => {
                        setBio(e.target.value);
                        setHasProfileChanges(true);
                      }}
                      placeholder="Write your custom bio, what you overthink about, or your meme style..."
                      className={`w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm outline-none resize-none transition ${
                        isLight
                          ? "bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white text-slate-900"
                          : "bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white"
                      }`}
                    />
                  </div>

                  {hasProfileChanges && (
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition active:scale-98"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Profile Changes</span>
                    </button>
                  )}
                </form>
              </div>
            )}

            {/* TAB: YOUR CONTRIBUTION */}
            {activeTab === "contribution" && (
              <div className="space-y-6">
                {/* 1. Header Overview & Rank Card */}
                <div
                  className={`p-5 rounded-3xl border relative overflow-hidden transition-all ${
                    isLight
                      ? "bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-pink-50/40 border-indigo-200/80 text-slate-900 shadow-sm"
                      : "bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900/60 border-indigo-900/50 text-white"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl p-0.5 ring-2 ring-amber-400 overflow-hidden bg-black shrink-0 shadow-lg">
                        <img
                          src={user?.photoURL || "/logo.png"}
                          alt={user?.displayName || "Creator"}
                          className="w-full h-full object-cover rounded-2xl"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/logo.png";
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-base sm:text-lg">
                            {user?.displayName || "Thinksy Creator"}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            {contributionStats.thoughtsCount > 3 ? "Pro Thinker" : "Active Contributor"}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-indigo-400">{user?.handle || "@creator"}</p>
                        <p className={`text-[11px] mt-0.5 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                          Member of Thinksy Community
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div
                        className={`px-3.5 py-2 rounded-2xl border text-center ${
                          isLight
                            ? "bg-white/80 border-indigo-200 text-indigo-900 shadow-sm"
                            : "bg-slate-900/80 border-indigo-800 text-indigo-300"
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70">
                          Karma Score
                        </span>
                        <span className="text-lg font-black text-amber-400">
                          {contributionStats.reputationScore}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Key Contribution Analytics (4 Grid Cards) */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2.5 opacity-70">
                    Activity & Impact Stats
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Card 1: Thoughts Dropped */}
                    <div
                      className={`p-3.5 rounded-2xl border ${
                        isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-2">
                        <MessageSquareQuote className="w-4 h-4" />
                      </div>
                      <div className="text-xl font-black">{contributionStats.thoughtsCount}</div>
                      <div className={`text-[11px] font-medium ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        Thoughts Dropped
                      </div>
                    </div>

                    {/* Card 2: Likes Received */}
                    <div
                      className={`p-3.5 rounded-2xl border ${
                        isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center mb-2">
                        <Heart className="w-4 h-4" />
                      </div>
                      <div className="text-xl font-black text-rose-500">
                        {contributionStats.likesReceived}
                      </div>
                      <div className={`text-[11px] font-medium ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        Likes Received
                      </div>
                    </div>

                    {/* Card 3: Likes Given */}
                    <div
                      className={`p-3.5 rounded-2xl border ${
                        isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center mb-2">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div className="text-xl font-black text-amber-400">
                        {contributionStats.likesGiven}
                      </div>
                      <div className={`text-[11px] font-medium ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        Thoughts Appreciated
                      </div>
                    </div>

                    {/* Card 4: Community Rank */}
                    <div
                      className={`p-3.5 rounded-2xl border ${
                        isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-2">
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="text-xl font-black text-purple-400">Top 5%</div>
                      <div className={`text-[11px] font-medium ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        Community Rank
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Community Badges & Milestones */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2.5 opacity-70">
                    Milestones & Badges
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        title: "First Spark",
                        desc: "Dropped your first relatable thought",
                        unlocked: contributionStats.thoughtsCount >= 1,
                        icon: "✨",
                      },
                      {
                        title: "Applause Magnet",
                        desc: "Earned 10+ likes from community members",
                        unlocked: contributionStats.likesReceived >= 10,
                        icon: "❤️",
                      },
                      {
                        title: "Thought Explorer",
                        desc: "Appreciated 5+ thoughts in the feed",
                        unlocked: contributionStats.likesGiven >= 5,
                        icon: "🔍",
                      },
                      {
                        title: "Thinksy Pioneer",
                        desc: "Active verified member of the platform",
                        unlocked: true,
                        icon: "🚀",
                      },
                    ].map((badge, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl border flex items-center gap-3 transition-colors ${
                          badge.unlocked
                            ? isLight
                              ? "bg-indigo-50/50 border-indigo-200 text-slate-800"
                              : "bg-indigo-950/20 border-indigo-800/40 text-slate-100"
                            : isLight
                            ? "bg-slate-100/60 border-slate-200 text-slate-400 opacity-60"
                            : "bg-slate-900/30 border-slate-800 text-slate-500 opacity-50"
                        }`}
                      >
                        <span className="text-2xl shrink-0">{badge.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs">{badge.title}</span>
                            {badge.unlocked && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-500 text-white">
                                Unlocked
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] truncate opacity-80">{badge.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Your Dropped Thoughts List */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider opacity-70">
                      Your Dropped Thoughts ({contributionStats.myThoughts.length})
                    </h4>
                  </div>

                  {contributionStats.myThoughts.length === 0 ? (
                    <div
                      className={`p-6 rounded-3xl border text-center space-y-2.5 ${
                        isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/40 border-slate-800"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                        <MessageSquareQuote className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-sm">No thoughts posted yet</p>
                      <p className={`text-xs max-w-sm mx-auto ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        Your dropped thoughts will be listed here with their real-time like counts, community reactions, and categories!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {contributionStats.myThoughts.map((thought: any, index: number) => (
                        <div
                          key={thought.id || index}
                          className={`p-3.5 rounded-2xl border transition ${
                            isLight
                              ? "bg-slate-50 border-slate-200 hover:border-indigo-300"
                              : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <p className="text-xs sm:text-sm font-medium line-clamp-2 leading-relaxed">
                            {thought.text}
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/60 text-[11px]">
                            <span className="font-mono text-indigo-400 font-semibold">
                              {thought.category || "General"}
                            </span>
                            <span className="flex items-center gap-1 font-bold text-rose-500">
                              <Heart className="w-3.5 h-3.5 fill-rose-500" />
                              {thought.likes || 0}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: APPEARANCE & DISPLAY */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                {/* Theme Selector */}
                <div>
                  <h4 className="text-sm font-bold mb-1">Color Palette Theme</h4>
                  <p className={`text-xs mb-3 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Personalize your aesthetic across all feeds, cards, and modal dialogs.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Cosmic Dark */}
                    <button
                      onClick={() => {
                        sound.playPop(500);
                        setTheme("cosmic");
                      }}
                      className={`p-4 rounded-3xl border text-left transition-all relative overflow-hidden ${
                        theme === "cosmic"
                          ? "ring-2 ring-indigo-500 bg-[#0d0922] border-indigo-500 text-white shadow-xl shadow-indigo-500/20"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Moon className="w-5 h-5 text-indigo-400" />
                        {theme === "cosmic" && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <h5 className="font-bold text-sm text-white">Cosmic Night</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">Deep violet, dark obsidian & neon accents</p>
                    </button>

                    {/* Day Clean Light */}
                    <button
                      onClick={() => {
                        sound.playPop(520);
                        setTheme("light");
                      }}
                      className={`p-4 rounded-3xl border text-left transition-all relative overflow-hidden ${
                        theme === "light"
                          ? "ring-2 ring-amber-500 bg-white border-amber-500 text-slate-900 shadow-xl shadow-amber-500/15"
                          : "bg-slate-100/60 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Sun className="w-5 h-5 text-amber-500" />
                        {theme === "light" && <Check className="w-4 h-4 text-amber-500" />}
                      </div>
                      <h5 className="font-bold text-sm text-slate-900">Day Clean</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">Crisp airy white with soft pastel warmth</p>
                    </button>

                    {/* Sunset Peach */}
                    <button
                      onClick={() => {
                        sound.playPop(540);
                        setTheme("sunset");
                      }}
                      className={`p-4 rounded-3xl border text-left transition-all relative overflow-hidden ${
                        theme === "sunset"
                          ? "ring-2 ring-rose-500 bg-[#1c0e18] border-rose-500 text-white shadow-xl shadow-rose-500/20"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Sunset className="w-5 h-5 text-rose-400" />
                        {theme === "sunset" && <Check className="w-4 h-4 text-rose-400" />}
                      </div>
                      <h5 className="font-bold text-sm text-white">Sunset Rose</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">Warm amber-rose glow & cozy golden tones</p>
                    </button>
                  </div>
                </div>

                {/* Text Density / Size */}
                <div
                  className={`p-4 rounded-3xl border flex items-center justify-between ${
                    isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Type className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="font-bold text-sm">Reading Density</h4>
                      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        Choose between spacious comfortable cards or compact information density
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 p-1 rounded-2xl border bg-inherit">
                    <button
                      onClick={() => handleSetTextSize("comfortable")}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                        textSize === "comfortable"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-inherit"
                      }`}
                    >
                      Comfortable
                    </button>
                    <button
                      onClick={() => handleSetTextSize("compact")}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                        textSize === "compact"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-inherit"
                      }`}
                    >
                      Compact
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FEED & DISPLAY PREFERENCES */}
            {activeTab === "feed" && (
              <div className="space-y-6">
                {/* Default Launch View */}
                <div>
                  <h4 className="text-sm font-bold mb-1">Default View On Launch</h4>
                  <p className={`text-xs mb-3 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Choose which section opens first whenever you launch Thinksy.
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: "thoughts", label: "Thoughts Feed", icon: <MessageSquareQuote className="w-4 h-4" /> },
                      { id: "reels", label: "Reels Hub", icon: <Video className="w-4 h-4" /> },
                      { id: "ai", label: "AI Muse", icon: <Sparkles className="w-4 h-4" /> },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSetDefaultTab(item.id)}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                          defaultTab === item.id
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25"
                            : isLight
                            ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                            : "bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-300"
                        }`}
                      >
                        {item.icon}
                        <span className="text-xs font-bold">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default Thought Sorting */}
                <div>
                  <h4 className="text-sm font-bold mb-1">Default Thought Sorting</h4>
                  <p className={`text-xs mb-3 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Sort new thoughts by recency or by community popularity.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleSetDefaultSort("recent")}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                        defaultSort === "recent"
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : isLight
                          ? "bg-white border-slate-200 text-slate-700"
                          : "bg-slate-900 border-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-bold">Most Recent</span>
                      </div>
                      {defaultSort === "recent" && <Check className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleSetDefaultSort("popular")}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                        defaultSort === "popular"
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : isLight
                          ? "bg-white border-slate-200 text-slate-700"
                          : "bg-slate-900 border-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold">Top Liked (Popular)</span>
                      </div>
                      {defaultSort === "popular" && <Check className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Autoplay Reels Setting */}
                <div
                  className={`p-4 rounded-3xl border flex items-center justify-between ${
                    isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm">Autoplay Video Reels</h4>
                    <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Automatically play short videos while scrolling through the Reels Hub
                    </p>
                  </div>
                  <button
                    onClick={handleToggleAutoplay}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoplayReels ? "bg-indigo-600" : isLight ? "bg-slate-300" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoplayReels ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: SOUND & NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                {/* Interaction Sound Effects */}
                <div
                  className={`p-4 rounded-3xl border flex items-center justify-between ${
                    isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Interactive Haptic Sounds</h4>
                      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        Play sound effects on upvotes, emojis, posts, and tab switches
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTestSound}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                        isLight ? "bg-white hover:bg-slate-100 border-slate-200" : "bg-slate-800 hover:bg-slate-700 border-slate-700"
                      }`}
                    >
                      Test
                    </button>
                    <button
                      onClick={handleToggleSound}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        soundEnabled ? "bg-indigo-600" : isLight ? "bg-slate-300" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          soundEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* In-App Alerts Toggle */}
                <div
                  className={`p-4 rounded-3xl border flex items-center justify-between ${
                    isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm">In-App Toast Alerts</h4>
                    <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Show banner alerts when copying story cards or saving thoughts
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setInAppAlerts(!inAppAlerts);
                      sound.playPop(480);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      inAppAlerts ? "bg-indigo-600" : isLight ? "bg-slate-300" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        inAppAlerts ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: AI MUSE COMPANION PREFERENCES */}
            {activeTab === "ai" && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold mb-1">AI Muse Conversational Personality</h4>
                  <p className={`text-xs mb-3 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Customize how Thinksy AI talks and crafts relatable thoughts for you.
                  </p>

                  <div className="space-y-2.5">
                    {AI_VIBES.map((vibe) => (
                      <button
                        key={vibe.id}
                        onClick={() => handleSetAiVibe(vibe.id)}
                        className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                          aiVibe === vibe.id
                            ? "bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border-indigo-500 text-white shadow-md shadow-indigo-500/20"
                            : isLight
                            ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                            : "bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-300"
                        }`}
                      >
                        <div>
                          <p className="font-bold text-xs sm:text-sm">{vibe.label}</p>
                          <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>{vibe.desc}</p>
                        </div>
                        {aiVibe === vibe.id && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: DATA & PRIVACY */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                {/* Anonymous Posting Default */}
                <div
                  className={`p-4 rounded-3xl border flex items-center justify-between ${
                    isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="font-bold text-sm">Post As Anonymous By Default</h4>
                      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        Hide your handle on new thoughts unless toggled during compose
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleAnonymous}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      anonymousDefault ? "bg-indigo-600" : isLight ? "bg-slate-300" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        anonymousDefault ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Cloud Sync Status */}
                <div
                  className={`p-4 rounded-3xl border flex items-center justify-between ${
                    isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Database className={`w-5 h-5 ${isCloud ? "text-emerald-500" : "text-slate-400"}`} />
                    <div>
                      <h4 className="font-bold text-sm">Cloud Storage Sync</h4>
                      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        {isCloud ? "Real-time Google Cloud Firestore" : "Local Browser Offline Mode"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                      isCloud
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    {isCloud ? "Connected" : "Local Mode"}
                  </span>
                </div>

                {/* Reset Likes Cache */}
                <div
                  className={`p-4 rounded-3xl border flex items-center justify-between ${
                    isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                  }`}
                >
                  <div>
                    <h4 className="font-bold text-sm">Reset Local Interaction Cache</h4>
                    <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Clear locally stored liked thoughts cache on this device
                    </p>
                  </div>
                  <button
                    onClick={handleClearCache}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Cache</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. CRITICAL BOTTOM ACTIONS (User Requirement: "and in the last add log out and switch account") */}
          <div
            className={`p-4 sm:p-5 border-t shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isLight ? "border-slate-100 bg-slate-50/80" : "border-slate-800/80 bg-[#080516]"
            }`}
          >
            <p className={`text-xs hidden sm:block ${isLight ? "text-slate-400" : "text-slate-500"}`}>
              Signed in as <span className="font-mono font-bold text-indigo-400">{user?.handle}</span>
            </p>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {/* SWITCH ACCOUNT BUTTON */}
              <button
                type="button"
                onClick={handleSwitchAccountClick}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold border transition active:scale-95 shadow-sm ${
                  isLight
                    ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200"
                }`}
                title="Switch to another creator account"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-purple-400" />
                <span>Switch Account</span>
              </button>

              {/* LOG OUT BUTTON */}
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 transition active:scale-95 shadow-sm"
                title="Log out of Thinksy"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Logout Confirmation Dialog */}
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <div
                className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl text-center space-y-4 ${
                  isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-900 border-slate-800 text-white"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
                  <LogOut className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-base">Sign out of Thinksy?</h4>
                  <p className={`text-xs mt-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    You will need to sign back in or pick your saved handle to post and like thoughts.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className={`flex-1 py-2.5 rounded-2xl text-xs font-bold border transition ${
                      isLight ? "bg-slate-100 border-slate-200 text-slate-700" : "bg-slate-800 border-slate-700 text-slate-300"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmLogout}
                    className="flex-1 py-2.5 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-lg shadow-rose-600/30"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
