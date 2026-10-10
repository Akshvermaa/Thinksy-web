"use client";

import React from "react";
import { Sparkles, Dices, Video } from "lucide-react";
import { useTheme } from "@/lib/theme";

interface BannerProps {
  onOpenComposer: () => void;
  onSwitchToReels?: () => void;
  onSwitchToAi?: () => void;
  onSurpriseMe?: () => void;
}

export const Banner: React.FC<BannerProps> = ({ onSwitchToReels, onSwitchToAi, onSurpriseMe }) => {
  const { isLight } = useTheme();

  return (
    <div className="mb-4 px-1">
      <div
        className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 shadow-xl transition-all duration-300 ${
          isLight
            ? "bg-gradient-to-r from-indigo-50/90 via-purple-50/60 to-pink-50/80 border border-indigo-100 shadow-sm"
            : "bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-purple-950/50 border border-indigo-500/20 backdrop-blur-xl"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
          {/* Tagline & Concept */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isLight
                    ? "bg-indigo-100/80 border border-indigo-200 text-indigo-700"
                    : "bg-indigo-500/15 border border-indigo-500/30 text-indigo-300"
                }`}
              >
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Meme & Reel Ideas</span>
              </span>
              <span className={`text-[11px] hidden sm:inline ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                • No chats, just thoughts
              </span>
            </div>

            <h2
              className={`text-base sm:text-lg font-black tracking-tight leading-snug ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              Drop a thought.{" "}
              <span
                className={`bg-clip-text text-transparent ${
                  isLight
                    ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"
                    : "bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-400"
                }`}
              >
                Someone might turn it into a meme.
              </span>
            </h2>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex items-center gap-2 shrink-0">
            {onSurpriseMe && (
              <button
                onClick={onSurpriseMe}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold active:scale-95 transition shadow-sm ${
                  isLight
                    ? "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-xs"
                    : "bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/70 text-slate-200"
                }`}
                title="Jump to a random relatable thought"
              >
                <Dices className="w-3.5 h-3.5 text-amber-500" />
                <span>Surprise Me</span>
              </button>
            )}

            {onSwitchToReels && (
              <button
                onClick={onSwitchToReels}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold active:scale-95 transition shadow-sm ${
                  isLight
                    ? "bg-gradient-to-r from-violet-100 to-pink-100 hover:from-violet-200 hover:to-pink-200 border border-pink-200 text-pink-700"
                    : "bg-gradient-to-r from-violet-600/30 to-pink-600/30 hover:from-violet-600/50 hover:to-pink-600/50 border border-pink-500/30 text-pink-300"
                }`}
              >
                <Video className={`w-3.5 h-3.5 ${isLight ? "text-pink-600" : "text-pink-400"}`} />
                <span>Reels</span>
              </button>
            )}

            {onSwitchToAi && (
              <button
                onClick={onSwitchToAi}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold active:scale-95 transition shadow-sm ${
                  isLight
                    ? "bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white shadow-pink-500/20"
                    : "bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white shadow-pink-900/30"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-200 animate-pulse" />
                <span>AI Muse</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
