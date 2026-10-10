"use client";

import React from "react";
import { Zap, Sparkles } from "lucide-react";
import { useTheme } from "@/lib/theme";

interface InlineComposerBarProps {
  onOpen: () => void;
}

export const InlineComposerBar: React.FC<InlineComposerBarProps> = ({ onOpen }) => {
  const { isLight } = useTheme();

  return (
    <div className="mb-5 px-1">
      <div
        onClick={onOpen}
        className={`group relative cursor-pointer flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-3xl transition-all duration-200 ${
          isLight
            ? "bg-white hover:bg-slate-50/90 border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md"
            : "bg-slate-900/90 sm:backdrop-blur-xl border border-slate-800/90 hover:border-indigo-500/50 shadow-lg shadow-black/20"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Glowing Avatar Placeholder */}
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-pink-500 p-0.5 shadow-md shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition">
            <div
              className={`w-full h-full rounded-[14px] flex items-center justify-center transition-colors ${
                isLight ? "bg-white" : "bg-slate-950"
              }`}
            >
              <Zap className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition" />
            </div>
          </div>

          {/* Placeholder Prompt */}
          <span
            className={`text-xs sm:text-sm font-medium transition truncate ${
              isLight
                ? "text-slate-500 group-hover:text-slate-900"
                : "text-slate-400 group-hover:text-slate-200"
            }`}
          >
            Got a relatable thought? Drop it here... 💀
          </span>
        </div>

        {/* Drop Action Button */}
        <button
          type="button"
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 group-hover:from-indigo-500 group-hover:to-violet-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all duration-150"
        >
          <Sparkles className="w-3.5 h-3.5 fill-white" />
          <span>Drop</span>
        </button>
      </div>
    </div>
  );
};
