"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Sparkles, Share2, Palette } from "lucide-react";
import { Thought } from "@/types/thought";
import { useToast } from "./ToastContainer";
import { sound } from "@/lib/sound";
import { useTheme } from "@/lib/theme";
import { useScrollLock } from "@/lib/useScrollLock";

interface MemeCardModalProps {
  thought: Thought | null;
  isOpen: boolean;
  onClose: () => void;
}

const CARD_STYLES = [
  {
    id: "neon",
    name: "Neon Cosmic",
    bg: "bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white border-violet-500/40",
    glow: "bg-indigo-500/20",
  },
  {
    id: "sunset",
    name: "Sunset Peach",
    bg: "bg-gradient-to-br from-rose-900 via-amber-900 to-orange-950 text-white border-rose-500/40",
    glow: "bg-rose-500/20",
  },
  {
    id: "cyber",
    name: "Cyber Cyan",
    bg: "bg-gradient-to-br from-slate-950 via-cyan-950 to-indigo-950 text-cyan-50 border-cyan-500/40",
    glow: "bg-cyan-500/20",
  },
  {
    id: "paper",
    name: "Aesthetic Paper",
    bg: "bg-[#fcfbf9] text-slate-900 border-slate-300 shadow-xl",
    glow: "bg-amber-500/10",
  },
];

export const MemeCardModal: React.FC<MemeCardModalProps> = ({ thought, isOpen, onClose }) => {
  const { showToast } = useToast();
  const { isLight } = useTheme();
  useScrollLock(isOpen);
  const [selectedStyle, setSelectedStyle] = useState(CARD_STYLES[0]);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !thought) return null;

  const handleCopyQuote = () => {
    sound.playPop(520);
    const text = `"${thought.text}"\n\n— ${thought.authorHandle || "@anonymous"}\n🔥 via Thinksy (Relatable Memes & Reels)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast("Formatted quote copied! Ready for Instagram Story / Reel text 🎬", "success");
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShare = () => {
    sound.playPop(600);
    const text = `"${thought.text}"\n\n— via Thinksy App`;
    if (navigator.share) {
      navigator.share({
        title: "Relatable Meme Thought",
        text,
        url: window.location.href,
      }).catch(() => {});
    } else {
      handleCopyQuote();
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overscroll-contain"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className={`w-full max-w-sm rounded-[32px] p-5 shadow-2xl overflow-hidden transition-colors ${
            isLight
              ? "bg-white border border-slate-200 text-slate-900 shadow-slate-300/40"
              : "bg-slate-900 border border-slate-700/80 text-white"
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-3 mb-3 border-b ${isLight ? "border-slate-100" : "border-slate-800"}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-sm font-bold leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                  Story & Meme Card
                </h3>
                <p className={`text-[10px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  Ready for Reels & Instagram
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-full transition ${
                isLight
                  ? "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Live Card Preview (4:5 / Story ratio preview) */}
          <div
            className={`relative rounded-3xl p-6 border shadow-2xl min-h-[220px] flex flex-col justify-between transition-all duration-300 ${selectedStyle.bg}`}
          >
            {/* Top Row in Card */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono font-bold tracking-tight opacity-90">
                {thought.authorHandle || "@anonymous"}
              </span>
              {thought.category && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                  {thought.category}
                </span>
              )}
            </div>

            {/* Thought Core Text */}
            <div className="my-5">
              <p className="text-lg font-bold leading-relaxed tracking-tight">
                &ldquo;{thought.text}&rdquo;
              </p>
            </div>

            {/* Bottom App Watermark */}
            <div className="flex items-center justify-between pt-2 border-t border-white/20 text-[10px] font-mono opacity-80">
              <span>Thinksy App</span>
              <span>🔥 {thought.likes} likes</span>
            </div>
          </div>

          {/* Style Picker */}
          <div className="mt-4">
            <label className={`flex items-center gap-1 text-[11px] font-semibold mb-2 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              <Palette className="w-3 h-3 text-pink-500" />
              <span>Choose Card Aesthetic</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {CARD_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    sound.playPop(500);
                    setSelectedStyle(style);
                  }}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-medium transition border text-center truncate ${
                    selectedStyle.id === style.id
                      ? "bg-indigo-600 text-white border-indigo-500 font-bold shadow-sm"
                      : isLight
                      ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  {style.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`mt-4 pt-3 border-t flex gap-2 ${isLight ? "border-slate-100" : "border-slate-800"}`}>
            <button
              onClick={handleCopyQuote}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied Quote!" : "Copy Quote Text"}</span>
            </button>

            <button
              onClick={handleShare}
              className={`p-2.5 rounded-2xl transition ${
                isLight
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
