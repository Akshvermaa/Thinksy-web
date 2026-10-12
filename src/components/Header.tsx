"use client";

import React from "react";
import { MessageSquareQuote, Video, Search, X, Sparkles, Menu, ChevronDown } from "lucide-react";
import { ActiveTab } from "@/types/thought";
import { useTheme } from "@/lib/theme";
import { sound } from "@/lib/sound";

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onToggleSidebar,
}) => {
  const { isLight } = useTheme();

  return (
    <header
      className={`sticky top-0 z-40 app-header backdrop-blur-2xl border-b transition-colors duration-200 py-2.5 px-4 sm:px-6 shadow-sm`}
    >
      <div className="relative w-full flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Sidebar Toggle Button (☰) AND Thoughts Button at the far-left */}
        <div className="flex items-center gap-2 shrink-0 z-10">
          {/* 1. Sidebar Option Button */}
          <button
            onClick={() => {
              sound.playPop(480);
              onToggleSidebar();
            }}
            className={`p-2 rounded-2xl border transition active:scale-95 flex items-center justify-center shrink-0 shadow-sm ${
              isLight
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-800"
                : "bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-200"
            }`}
            title="Open THINKSY Menu (Navigation, Categories, Settings)"
            aria-label="Open THINKSY Menu"
          >
            <Menu className="w-4 h-4 text-amber-400" />
          </button>

          {/* 2. Thoughts Section Button */}
          <button
            onClick={() => {
              sound.playPop(460);
              onToggleSidebar();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold transition active:scale-95 shadow-sm ${
              isLight
                ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                : "bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-200"
            }`}
            title="Current section: Thoughts (click to switch section)"
          >
            {activeTab === "thoughts" && (
              <>
                <MessageSquareQuote className="w-3.5 h-3.5 text-indigo-400" />
                <span>Thoughts</span>
              </>
            )}
            {activeTab === "reels" && (
              <>
                <Video className="w-3.5 h-3.5 text-pink-400" />
                <span>Reels</span>
              </>
            )}
            {activeTab === "ai" && (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>AI Muse</span>
              </>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5 opacity-60" />
          </button>
        </div>

        {/* Center / Feed-Aligned: THINKSY Brand (Moved to marked location aligned with main feed column) */}
        <div className="hidden sm:flex absolute inset-0 pointer-events-none items-center">
          <div className="w-full max-w-xl mx-auto px-2 flex items-center justify-start">
            <div
              className="pointer-events-auto flex items-center gap-2 cursor-pointer group shrink-0"
              onClick={() => {
                sound.playPop(480);
                onToggleSidebar();
              }}
              title="Open THINKSY Menu"
            >
              <div className="relative rounded-full p-0.5 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200 overflow-hidden ring-1.5 ring-amber-400/50 bg-black shrink-0 w-8 h-8 sm:w-8.5 sm:h-8.5">
                <img
                  src="/logo.png"
                  alt="THINKSY Logo"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-black tracking-tight text-sm sm:text-base uppercase transition-colors bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
                  THINKSY
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile View: THINKSY Logo in line for small screens (< 640px) */}
        <div
          className="sm:hidden flex items-center gap-1.5 cursor-pointer group shrink-0"
          onClick={() => {
            sound.playPop(480);
            onToggleSidebar();
          }}
          title="Open THINKSY Menu"
        >
          <div className="relative rounded-full p-0.5 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200 overflow-hidden ring-1.5 ring-amber-400/50 bg-black shrink-0 w-7 h-7">
            <img
              src="/logo.png"
              alt="THINKSY Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <span className="font-black tracking-tight text-xs uppercase bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent">
            THINKSY
          </span>
        </div>

        {/* Right: Active Filter Badges & Quick Search */}
        <div className="flex items-center gap-2 shrink-0 z-10">
          {/* Active Category Filter Tag (if filtered) */}
          {selectedCategory && selectedCategory !== "All" && (
            <button
              onClick={() => {
                sound.playPop(420);
                onSelectCategory("All");
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm active:scale-95 ${
                isLight
                  ? "bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700"
                  : "bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300"
              }`}
              title="Click to reset category filter"
            >
              <span>{selectedCategory}</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Active Search Query Tag (if searching) */}
          {searchQuery && (
            <button
              onClick={() => {
                sound.playPop(420);
                onSearchChange("");
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm active:scale-95 ${
                isLight
                  ? "bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700"
                  : "bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300"
              }`}
              title="Click to clear search"
            >
              <span className="max-w-[70px] sm:max-w-[110px] truncate">"{searchQuery}"</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Quick Search Opener Button */}
          <button
            onClick={() => {
              sound.playPop(450);
              onToggleSidebar();
            }}
            className={`p-2 rounded-2xl border transition active:scale-95 shadow-sm text-xs ${
              isLight
                ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                : "bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-300"
            }`}
            title="Search thoughts, categories & creators (opens menu)"
            aria-label="Search"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
