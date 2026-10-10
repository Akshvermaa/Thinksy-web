"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, CheckCheck, Flag, Video, MoreHorizontal, Sparkles, Share2, Flame, Heart, Camera } from "lucide-react";
import { Thought } from "@/types/thought";
import { formatRelativeTime } from "@/lib/utils";
import { LikeButton } from "./LikeButton";
import { ReportModal } from "./ReportModal";
import { useToast } from "./ToastContainer";
import { isThoughtLiked, toggleThoughtLiked, isThoughtReported, markThoughtReported } from "@/lib/storage";
import { toggleThoughtLikeService, reportThoughtService } from "@/services/thoughtService";
import { ReelComposer } from "./ReelComposer";
import { MemeCardModal } from "./MemeCardModal";
import { sound } from "@/lib/sound";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";

interface ThoughtCardProps {
  thought: Thought;
  isHighlighted?: boolean;
}

// Map categories to vibrant pastel colors & emojis with light and dark mode variants
const CATEGORY_COLORS: Record<
  string,
  { bgDark: string; textDark: string; borderDark: string; bgLight: string; textLight: string; borderLight: string; emoji: string }
> = {
  "College Life": { bgDark: "bg-amber-500/15", textDark: "text-amber-300", borderDark: "border-amber-500/30", bgLight: "bg-amber-50", textLight: "text-amber-800", borderLight: "border-amber-200", emoji: "🎓" },
  "Overthinking": { bgDark: "bg-purple-500/15", textDark: "text-purple-300", borderDark: "border-purple-500/30", bgLight: "bg-purple-50", textLight: "text-purple-800", borderLight: "border-purple-200", emoji: "🧠" },
  "Work Life": { bgDark: "bg-emerald-500/15", textDark: "text-emerald-300", borderDark: "border-emerald-500/30", bgLight: "bg-emerald-50", textLight: "text-emerald-800", borderLight: "border-emerald-200", emoji: "💼" },
  "Family": { bgDark: "bg-rose-500/15", textDark: "text-rose-300", borderDark: "border-rose-500/30", bgLight: "bg-rose-50", textLight: "text-rose-800", borderLight: "border-rose-200", emoji: "🏠" },
  "Daily Life": { bgDark: "bg-sky-500/15", textDark: "text-sky-300", borderDark: "border-sky-500/30", bgLight: "bg-sky-50", textLight: "text-sky-800", borderLight: "border-sky-200", emoji: "⚡" },
  "Coding": { bgDark: "bg-cyan-500/15", textDark: "text-cyan-300", borderDark: "border-cyan-500/30", bgLight: "bg-cyan-50", textLight: "text-cyan-800", borderLight: "border-cyan-200", emoji: "💻" },
  "Fitness": { bgDark: "bg-orange-500/15", textDark: "text-orange-300", borderDark: "border-orange-500/30", bgLight: "bg-orange-50", textLight: "text-orange-800", borderLight: "border-orange-200", emoji: "💪" },
  "Study": { bgDark: "bg-yellow-500/15", textDark: "text-yellow-300", borderDark: "border-yellow-500/30", bgLight: "bg-yellow-50", textLight: "text-yellow-800", borderLight: "border-yellow-200", emoji: "📚" },
  "Memes": { bgDark: "bg-pink-500/15", textDark: "text-pink-300", borderDark: "border-pink-500/30", bgLight: "bg-pink-50", textLight: "text-pink-800", borderLight: "border-pink-200", emoji: "🎭" },
};

// Fun creator avatars based on handle
const AVATAR_EMOJIS = ["🦊", "🐱", "🚀", "⚡", "🥑", "🎮", "🦁", "🐼", "✨", "🔥"];

export const ThoughtCard: React.FC<ThoughtCardProps> = ({ thought, isHighlighted = false }) => {
  const { showToast } = useToast();
  const { isLight } = useTheme();
  const { requireAuth } = useAuth();
  const [isLiked, setIsLiked] = useState(() => isThoughtLiked(thought.id));
  const [isReported, setIsReported] = useState(() => isThoughtReported(thought.id));
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReelComposerOpen, setIsReelComposerOpen] = useState(false);
  const [isMemeModalOpen, setIsMemeModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Quick Emoji Reactions with sound
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [floatingReaction, setFloatingReaction] = useState<string | null>(null);

  const isSeedThought = thought.isCommunity || thought.id.startsWith("seed_") || !thought.createdAt;
  const author = thought.authorHandle || "@anonymous";
  const catData = CATEGORY_COLORS[thought.category || ""];
  const catStyle = catData
    ? {
        bg: isLight ? catData.bgLight : catData.bgDark,
        text: isLight ? catData.textLight : catData.textDark,
        border: isLight ? catData.borderLight : catData.borderDark,
        emoji: catData.emoji,
      }
    : {
        bg: isLight ? "bg-indigo-50" : "bg-indigo-500/15",
        text: isLight ? "text-indigo-800" : "text-indigo-300",
        border: isLight ? "border-indigo-200" : "border-indigo-500/30",
        emoji: "💭",
      };

  // Stable avatar emoji generator based on author handle string
  const emojiIndex = Math.abs(author.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % AVATAR_EMOJIS.length;
  const avatarEmoji = AVATAR_EMOJIS[emojiIndex];

  const handleLikeToggle = async (thoughtId: string, nextLiked: boolean) => {
    requireAuth(async () => {
      sound.playPop(nextLiked ? 520 : 350);
      setIsLiked(nextLiked);
      toggleThoughtLiked(thoughtId);
      try {
        await toggleThoughtLikeService(thoughtId, !nextLiked);
      } catch (err) {
        console.error("Failed to update like:", err);
      }
    }, "Sign in to like thoughts and show appreciation");
  };

  const handleEmojiReact = (emoji: string) => {
    requireAuth(() => {
      sound.playPop(580);
      setSelectedEmoji(emoji);
      setFloatingReaction(emoji);
      setTimeout(() => setFloatingReaction(null), 1200);
      showToast(`Reacted ${emoji}!`, "info");
    }, `Sign in to react ${emoji} to thoughts`);
  };

  const handleCopyText = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playPop(480);
    navigator.clipboard.writeText(thought.text);
    setCopied(true);
    showToast("Copied thought for Reel/Meme! 🎬", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReportSubmit = async () => {
    markThoughtReported(thought.id);
    setIsReported(true);
    showToast("Report submitted. Thanks for keeping the feed clean!", "info");
    try {
      await reportThoughtService(thought.id);
    } catch (err) {
      console.error("Failed to report thought:", err);
    }
  };

  return (
    <>
      <motion.div
        id={`thought-${thought.id}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className={`group relative w-full mb-4 transition-all duration-300 ${
          isHighlighted ? "ring-2 ring-indigo-400 shadow-2xl shadow-indigo-500/40 scale-[1.02]" : ""
        }`}
      >
        {/* Chat Message Bubble Container */}
        <div className="thought-bubble relative rounded-[28px] rounded-tl-[8px] p-5 sm:p-6 transition-all duration-200 overflow-hidden">
          
          {/* Subtle chat-bubble decorative accent at top-left corner */}
          <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-tl-sm bg-gradient-to-br from-indigo-500 to-pink-500 opacity-60" />
          </div>

          {/* Floating Reaction particle burst */}
          <AnimatePresence>
            {floatingReaction && (
              <motion.div
                initial={{ opacity: 1, y: 0, scale: 0.8 }}
                animate={{ opacity: 0, y: -65, scale: 1.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="absolute top-8 right-12 z-30 text-3xl pointer-events-none select-none"
              >
                {floatingReaction}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Row: User Avatar & Handle + Category Badge + Action Menu */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Creator Memoji Avatar */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm shadow-md shrink-0 select-none ${
                  isLight
                    ? "bg-slate-100 border border-slate-200/80 shadow-slate-200/50"
                    : "bg-gradient-to-tr from-indigo-500/30 to-pink-500/30 border border-white/20 shadow-black/20"
                }`}
              >
                {avatarEmoji}
              </div>

              {/* Creator Handle */}
              <span
                className={`text-xs font-mono font-semibold ${
                  isLight ? "text-slate-700" : "text-slate-300"
                }`}
              >
                {author}
              </span>

              {/* Colorful Category Pill */}
              {thought.category && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text} border ${catStyle.border} text-[10px] font-bold tracking-wide`}>
                  <span>{catStyle.emoji}</span>
                  <span>{thought.category}</span>
                </span>
              )}
            </div>

            {/* Quick Actions Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`p-1.5 rounded-full transition ${
                  isLight
                    ? "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                    : "text-slate-400 hover:text-white hover:bg-white/10"
                }`}
                aria-label="More actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <div
                  className={`absolute right-0 top-7 z-30 w-52 rounded-2xl py-1.5 text-xs shadow-2xl backdrop-blur-xl ${
                    isLight
                      ? "bg-white/95 border border-slate-200 text-slate-800 shadow-slate-300/40"
                      : "bg-slate-900/95 border border-slate-700 text-slate-200"
                  }`}
                  onClick={() => setShowMenu(false)}
                >
                  <button
                    onClick={() => {
                      requireAuth(() => setIsMemeModalOpen(true), "Sign in to create story & meme cards");
                    }}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2 transition font-medium ${
                      isLight
                        ? "hover:bg-slate-50 text-pink-700"
                        : "hover:bg-slate-800 text-pink-300"
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-pink-500" />
                    <span>Story & Meme Card</span>
                  </button>

                  <button
                    onClick={handleCopyText}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2 transition ${
                      isLight ? "hover:bg-slate-50 text-slate-700" : "hover:bg-slate-800"
                    }`}
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                    <span>{copied ? "Copied!" : "Copy for Meme/Reel"}</span>
                  </button>

                  <button
                    onClick={() => {
                      requireAuth(() => setIsReelComposerOpen(true), "Sign in to drop a reel for this thought");
                    }}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2 transition ${
                      isLight
                        ? "hover:bg-slate-50 text-violet-700"
                        : "hover:bg-slate-800 text-violet-300"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-violet-500" />
                    <span>Make Reel for this</span>
                  </button>

                  <button
                    onClick={() => {
                      requireAuth(() => {
                        if (!isReported) setIsReportModalOpen(true);
                        else showToast("You have already reported this thought.", "info");
                      }, "Sign in to report thoughts");
                    }}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2 transition ${
                      isReported
                        ? "text-slate-400 cursor-not-allowed"
                        : isLight
                        ? "text-rose-600 hover:bg-slate-50"
                        : "text-rose-400 hover:bg-slate-800"
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{isReported ? "Reported" : "Report Thought"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Thought Text Content */}
          <div className="relative mb-3.5">
            <p
              className={`text-[17px] sm:text-[18px] font-medium leading-[1.65] whitespace-pre-wrap break-words tracking-tight select-text ${
                isLight ? "text-slate-900" : "text-slate-50"
              }`}
            >
              {thought.text}
            </p>
          </div>

          {/* Micro Emoji Reaction Bar with Sound */}
          <div
            className={`flex items-center gap-1.5 mb-3.5 py-1 px-2.5 rounded-2xl w-fit transition-colors ${
              isLight
                ? "bg-slate-100/90 border border-slate-200/90"
                : "bg-black/30 border border-white/10"
            }`}
          >
            {[
              { emoji: "💀", label: "Ded" },
              { emoji: "😭", label: "Pain" },
              { emoji: "🤯", label: "Mindblown" },
              { emoji: "🔥", label: "Fire" },
            ].map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => handleEmojiReact(emoji)}
                className={`px-2 py-0.5 rounded-xl text-xs transition duration-150 active:scale-125 select-none ${
                  selectedEmoji === emoji
                    ? "bg-indigo-600 text-white font-bold scale-110 shadow-sm"
                    : isLight
                    ? "text-slate-500 hover:text-slate-950 hover:bg-white/80"
                    : "hover:bg-white/10 text-slate-400 hover:text-white"
                }`}
                title={`React ${label}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Footer Row: Likes, Story Card, Reel & Timestamp */}
          <div
            className={`flex items-center justify-between pt-3 border-t text-xs ${
              isLight ? "border-slate-100" : "border-white/10"
            }`}
          >
            {/* Left Actions: Like, Story Card & Reel */}
            <div className="flex items-center gap-2">
              <LikeButton
                thoughtId={thought.id}
                likes={thought.likes}
                isLiked={isLiked}
                onLikeToggle={handleLikeToggle}
              />

              <button
                onClick={() => {
                  requireAuth(() => {
                    sound.playPop(500);
                    setIsMemeModalOpen(true);
                  }, "Sign in to create Instagram story & meme cards");
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-[11px] transition duration-150 ${
                  isLight
                    ? "bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700"
                    : "bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300"
                }`}
                title="Create Instagram Story card"
              >
                <Camera className={`w-3 h-3 ${isLight ? "text-pink-600" : "text-pink-400"}`} />
                <span>Story Card</span>
              </button>

              <button
                onClick={() => {
                  requireAuth(() => {
                    sound.playPop(480);
                    setIsReelComposerOpen(true);
                  }, "Sign in to drop a reel for this thought");
                }}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-[11px] transition duration-150 ${
                  isLight
                    ? "bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700"
                    : "bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-300"
                }`}
                title="Create a video reel inspired by this thought"
              >
                <Video className={`w-3 h-3 ${isLight ? "text-violet-600" : "text-violet-400"}`} />
                <span>Drop Reel</span>
              </button>
            </div>

            {/* Right: Timestamp or Community Badge with Chat Receipt Checkmark */}
            <div
              className={`flex items-center gap-2 font-mono text-[11px] ${
                isLight ? "text-slate-500" : "text-slate-400"
              }`}
            >
              {isSeedThought ? (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-medium ${
                    isLight
                      ? "bg-slate-100 text-slate-600 border border-slate-200"
                      : "bg-white/10 text-slate-300 border border-white/15"
                  }`}
                >
                  <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                  <span>Community</span>
                </span>
              ) : (
                <span className={`font-medium ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  {formatRelativeTime(thought.createdAt)}
                </span>
              )}

              {/* Chat-style read receipt double-checkmark */}
              <span title="Delivered & Read by Community" className="text-sky-500 flex items-center">
                <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>

              {!showMenu && (
                <button
                  onClick={() => {
                    requireAuth(() => {
                      if (!isReported) setIsReportModalOpen(true);
                      else showToast("Already reported.", "info");
                    }, "Sign in to report thoughts");
                  }}
                  className={`p-1 hover:text-rose-500 transition ml-1 ${
                    isReported
                      ? "text-rose-500/70"
                      : isLight
                      ? "text-slate-400 hover:text-slate-600"
                      : "text-slate-400 hover:text-slate-300"
                  }`}
                  title={isReported ? "Already reported" : "Report thought"}
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitReport={handleReportSubmit}
      />

      {/* Story & Meme Card Generator Modal */}
      <MemeCardModal
        thought={thought}
        isOpen={isMemeModalOpen}
        onClose={() => setIsMemeModalOpen(false)}
      />

      {/* Reel Composer Modal */}
      <ReelComposer
        isOpen={isReelComposerOpen}
        onClose={() => setIsReelComposerOpen(false)}
        onReelCreated={() => {
          showToast("Reel posted! Switch to 'Reels' tab to watch.", "success");
        }}
        defaultThoughtText={thought.text}
      />
    </>
  );
};
