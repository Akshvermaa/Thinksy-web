"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MessageSquareQuote,
  Video,
  Sparkles,
  Settings,
  ArrowLeftRight,
  LogOut,
  Moon,
  Sun,
  Sunset,
  Volume2,
  VolumeX,
  User,
  ShieldCheck,
  ChevronRight,
  Flame,
  LogIn,
  Search,
  Clock,
  Compass,
  Radio,
} from "lucide-react";
import { ActiveTab, SortOrder } from "@/types/thought";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { sound } from "@/lib/sound";
import { useScrollLock } from "@/lib/useScrollLock";

export const CATEGORIES = [
  "All",
  "College Life",
  "Overthinking",
  "Work Life",
  "Family",
  "Daily Life",
  "Coding",
  "Memes",
];

export const CATEGORY_ICONS: Record<string, string> = {
  All: "✨",
  "College Life": "🎓",
  Overthinking: "💭",
  "Work Life": "💼",
  Family: "🏡",
  "Daily Life": "☕",
  Coding: "💻",
  Memes: "🎭",
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  sortOrder?: SortOrder;
  onSortChange?: (sort: SortOrder) => void;
  onOpenSettings: () => void;
  onOpenSwitchAccount: () => void;
  onOpenCommunity?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  searchQuery = "",
  onSearchChange,
  selectedCategory = "All",
  onSelectCategory,
  sortOrder = "recent",
  onSortChange,
  onOpenSettings,
  onOpenSwitchAccount,
  onOpenCommunity,
}) => {
  const { user, logout, openLoginModal } = useAuth();
  const { theme, setTheme, isLight } = useTheme();

  // Lock background/right side scrolling while sidebar is open
  useScrollLock(isOpen);

  const handleSelectTab = (tab: ActiveTab) => {
    sound.playPop(480);
    onTabChange(tab);
    onClose();
  };

  const handleToggleSound = () => {
    const newState = sound.toggleSound();
    if (newState) sound.playPop(520);
  };

  const handleOpenSettingsClick = () => {
    sound.playPop(480);
    onClose();
    onOpenSettings();
  };

  const handleSwitchAccountClick = () => {
    sound.playPop(450);
    onClose();
    onOpenSwitchAccount();
  };

  const handleLogoutClick = async () => {
    onClose();
    await logout();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm touch-none overscroll-none"
          />

          {/* Left Sidebar Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className={`fixed top-0 left-0 bottom-0 z-[90] w-80 max-w-[85vw] flex flex-col shadow-2xl border-r transition-colors overscroll-contain ${
              isLight
                ? "bg-white/98 border-slate-200 text-slate-900 shadow-slate-300/40"
                : "bg-[#0b081c]/98 border-slate-800 text-white shadow-black/80"
            }`}
          >
            {/* Top Heading: THINKSY + Close Button */}
            <div
              className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
                isLight ? "border-slate-100" : "border-slate-800/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full p-0.5 ring-2 ring-amber-400/50 bg-black overflow-hidden shrink-0 shadow-lg shadow-amber-500/20">
                  <img
                    src="/logo.png"
                    alt="Thinksy Logo"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div>
                  <h2 className="font-black tracking-tight text-xl bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent uppercase">
                    THINKSY
                  </h2>
                  <p
                    className={`text-[10px] font-medium -mt-0.5 ${
                      isLight ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Creative Thoughts & Memes
                  </p>
                </div>
              </div>

              {/* Close Button on Top */}
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
                title="Close Sidebar"
                aria-label="Close Sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile Snippet */}
            {user ? (
              <div
                className={`mx-4 mt-3 p-3 rounded-2xl border flex items-center gap-3 shrink-0 ${
                  isLight
                    ? "bg-slate-50 border-slate-200/80"
                    : "bg-slate-900/60 border-slate-800/80"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-indigo-500/25 shrink-0">
                  {user.handle.replace("@", "").charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs truncate">{user.displayName}</p>
                  <p className="text-[11px] font-mono text-indigo-400 truncate">{user.handle}</p>
                </div>
                {user.emailVerified && (
                  <span title="Verified Account">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  </span>
                )}
              </div>
            ) : (
              <div
                className={`mx-4 mt-3 p-3 rounded-2xl border flex items-center justify-between shrink-0 ${
                  isLight
                    ? "bg-slate-50 border-slate-200/80"
                    : "bg-slate-900/60 border-slate-800/80"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-5 h-5 text-indigo-400" />
                  <div>
                    <p className="font-bold text-xs">Guest Session</p>
                    <p className="text-[10px] text-slate-400">Sign in to save profile</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    sound.playPop(480);
                    onClose();
                    openLoginModal("Sign in to drop thoughts, post reels & like");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-bold shadow-md shadow-indigo-600/25 active:scale-95 transition"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Search Input in Sidebar */}
            {onSearchChange && (
              <div className="mx-4 mt-3 shrink-0">
                <div className="relative flex items-center">
                  <Search
                    className={`absolute left-3 w-3.5 h-3.5 pointer-events-none ${
                      isLight ? "text-slate-400" : "text-slate-500"
                    }`}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={
                      activeTab === "thoughts"
                        ? "Search thoughts, @creators, tags..."
                        : "Search community reels..."
                    }
                    className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs outline-none transition ${
                      isLight
                        ? "bg-slate-100 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white"
                        : "bg-slate-900/80 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500"
                    }`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        sound.playPop(380);
                        onSearchChange("");
                      }}
                      className="absolute right-2.5 p-0.5 rounded-full text-slate-400 hover:text-white"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Scrollable Navigation Body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4 overscroll-contain">
              {/* Section 1: Main Navigation Tabs */}
              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 mb-1.5 ${
                    isLight ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Navigation
                </p>

                <div className="space-y-1">
                  {/* Thoughts Feed */}
                  <button
                    onClick={() => handleSelectTab("thoughts")}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      activeTab === "thoughts"
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30 scale-102"
                        : isLight
                        ? "hover:bg-slate-100 text-slate-700"
                        : "hover:bg-slate-900/80 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquareQuote className="w-4 h-4" />
                      <span>Thoughts Feed</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  {/* Reels Hub */}
                  <button
                    onClick={() => handleSelectTab("reels")}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      activeTab === "reels"
                        ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md shadow-violet-600/30 scale-102"
                        : isLight
                        ? "hover:bg-slate-100 text-slate-700"
                        : "hover:bg-slate-900/80 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Video className="w-4 h-4 text-pink-400" />
                      <span>Reels Hub</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  {/* AI Muse Chat */}
                  <button
                    onClick={() => handleSelectTab("ai")}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      activeTab === "ai"
                        ? "bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-pink-600/30 scale-102"
                        : isLight
                        ? "hover:bg-slate-100 text-slate-700"
                        : "hover:bg-slate-900/80 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                      <span>AI Muse (Chat)</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  {/* Community (Chat & Voice) */}
                  {onOpenCommunity && (
                    <button
                      onClick={() => {
                        sound.playPop(480);
                        onClose();
                        onOpenCommunity();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                        isLight
                          ? "hover:bg-slate-100 text-slate-700"
                          : "hover:bg-slate-900/80 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <span>Community Chat & Members</span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Live
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Section 2: Categories (when on Thoughts tab) */}
              {activeTab === "thoughts" && onSelectCategory && (
                <div>
                  <div className="flex items-center justify-between px-2 mb-1.5">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isLight ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Categories
                    </p>
                    {selectedCategory !== "All" && (
                      <button
                        onClick={() => {
                          sound.playPop(420);
                          onSelectCategory("All");
                        }}
                        className="text-indigo-400 hover:underline text-[10px] font-bold"
                      >
                        Reset to All
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {CATEGORIES.map((cat) => {
                      const isSelected = (selectedCategory || "All") === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            sound.playPop(460);
                            onSelectCategory(cat);
                            onClose();
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                            isSelected
                              ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30 font-bold scale-102"
                              : isLight
                              ? "bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-700"
                              : "bg-slate-900/50 hover:bg-slate-800 border border-slate-800 text-slate-300"
                          }`}
                        >
                          <span className="text-sm shrink-0">{CATEGORY_ICONS[cat] || "🏷️"}</span>
                          <span className="truncate">{cat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 3: Sort Order (Recent vs Top) */}
              {activeTab === "thoughts" && onSortChange && (
                <div>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 mb-1.5 ${
                      isLight ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Sort Feed
                  </p>
                  <div
                    className={`p-1 rounded-2xl flex items-center gap-1 border ${
                      isLight ? "bg-slate-100 border-slate-200" : "bg-slate-900/60 border-slate-800"
                    }`}
                  >
                    <button
                      onClick={() => {
                        sound.playPop(420);
                        onSortChange("recent");
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        sortOrder === "recent"
                          ? isLight
                            ? "bg-white text-slate-900 shadow-sm"
                            : "bg-slate-800 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Recent</span>
                    </button>
                    <button
                      onClick={() => {
                        sound.playPop(520);
                        onSortChange("popular");
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        sortOrder === "popular"
                          ? isLight
                            ? "bg-white text-slate-900 shadow-sm"
                            : "bg-slate-800 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>Top</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Section 4: Quick Toggles (Theme & Sound) */}
              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 mb-1.5 ${
                    isLight ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Quick Toggles
                </p>

                {/* Theme Switcher */}
                <div
                  className={`p-2 rounded-2xl border flex items-center justify-between mb-2 ${
                    isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900/60 border-slate-800"
                  }`}
                >
                  <span className="text-xs font-semibold px-2">Theme</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        sound.playPop(480);
                        setTheme("cosmic");
                      }}
                      className={`p-1.5 rounded-xl transition ${
                        theme === "cosmic"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title="Cosmic Dark"
                    >
                      <Moon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        sound.playPop(500);
                        setTheme("light");
                      }}
                      className={`p-1.5 rounded-xl transition ${
                        theme === "light"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-900"
                      }`}
                      title="Day Clean"
                    >
                      <Sun className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        sound.playPop(520);
                        setTheme("sunset");
                      }}
                      className={`p-1.5 rounded-xl transition ${
                        theme === "sunset"
                          ? "bg-rose-500 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                      title="Sunset Rose"
                    >
                      <Sunset className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sound Toggle */}
                <button
                  onClick={handleToggleSound}
                  className={`w-full p-2.5 rounded-2xl border flex items-center justify-between text-xs font-semibold transition ${
                    isLight
                      ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                      : "bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {sound.isEnabled() ? (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-400" />
                    )}
                    <span>Sound Effects</span>
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      sound.isEnabled()
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-700 text-slate-400"
                    }`}
                  >
                    {sound.isEnabled() ? "ON" : "OFF"}
                  </span>
                </button>
              </div>
            </div>

            {/* AT THE BOTTOM OF THE LEFT SIDEBAR */}
            <div
              className={`p-4 border-t space-y-2 shrink-0 ${
                isLight ? "border-slate-100 bg-slate-50/70" : "border-slate-800/80 bg-slate-950/80"
              }`}
            >
              {/* Settings Option Prominently at Bottom */}
              <button
                onClick={handleOpenSettingsClick}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold border transition-all active:scale-98 shadow-sm ${
                  isLight
                    ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-800"
                    : "bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Settings className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span>Settings & Preferences</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Bottom Actions: Switch Account & Log Out / Sign In */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSwitchAccountClick}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[11px] font-bold border transition active:scale-95 ${
                    isLight
                      ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                      : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
                  }`}
                  title="Switch Account"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-purple-400" />
                  <span>Switch</span>
                </button>

                {user ? (
                  <button
                    onClick={handleLogoutClick}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[11px] font-bold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 transition active:scale-95"
                    title="Log Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onClose();
                      openLoginModal("Sign in to your account");
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[11px] font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white transition active:scale-95 shadow-sm"
                    title="Sign In"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
