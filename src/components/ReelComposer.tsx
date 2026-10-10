"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Video, Sparkles, MessageSquareQuote, Link, User } from "lucide-react";
import { createReelPayload } from "@/services/thoughtService";
import { ReelItem, Thought } from "@/types/thought";
import { useToast } from "./ToastContainer";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useScrollLock } from "@/lib/useScrollLock";

interface ReelComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onReelCreated: (newReel: ReelItem) => void;
  defaultThoughtText?: string;
}

export const ReelComposer: React.FC<ReelComposerProps> = ({
  isOpen,
  onClose,
  onReelCreated,
  defaultThoughtText = "",
}) => {
  const { showToast } = useToast();
  const { isLight } = useTheme();
  const { user } = useAuth();
  useScrollLock(isOpen);
  const [videoUrl, setVideoUrl] = useState("");
  const [thoughtText, setThoughtText] = useState(defaultThoughtText);
  const [caption, setCaption] = useState("");
  const [creatorHandle, setCreatorHandle] = useState(() => user?.handle || "@creator");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.handle) {
      setCreatorHandle(user.handle);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoUrl.trim()) {
      showToast("Please enter a video URL.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createReelPayload({
        videoUrl,
        thoughtText,
        caption,
        creatorHandle,
      });
      onReelCreated(created);
      showToast("Reel posted to community! 🎬", "success");
      onClose();
    } catch (err: any) {
      showToast(err?.message || "Failed to post reel.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 overscroll-contain"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.98 }}
          className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-hidden transition-colors ${
            isLight
              ? "bg-white border border-slate-200 text-slate-900 shadow-slate-300/40"
              : "bg-slate-900 border border-slate-800 text-white"
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-4 border-b mb-4 ${isLight ? "border-slate-100" : "border-slate-800"}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-600">
                <Video className="w-4 h-4" />
              </div>
              <h3 className={`text-lg font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                Drop a Reel / Video
              </h3>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-full transition ${
                isLight
                  ? "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Thought prompt reference */}
            <div>
              <label className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${isLight ? "text-indigo-700" : "text-indigo-300"}`}>
                <MessageSquareQuote className="w-3.5 h-3.5 text-indigo-500" />
                <span>Inspired by Thought (Optional)</span>
              </label>
              <input
                type="text"
                value={thoughtText}
                onChange={(e) => setThoughtText(e.target.value)}
                placeholder="e.g. Bhai kal exam hai aur tu Instagram chala raha hai 💀"
                className={`w-full rounded-xl p-3 text-xs outline-none transition ${
                  isLight
                    ? "bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white"
                    : "bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500"
                }`}
              />
            </div>

            {/* Video URL */}
            <div>
              <label className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                <Link className="w-3.5 h-3.5 text-violet-500" />
                <span>Video MP4 URL or Clip Link *</span>
              </label>
              <input
                type="url"
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://assets.mixkit.co/videos/preview/..."
                className={`w-full rounded-xl p-3 text-xs font-mono outline-none transition ${
                  isLight
                    ? "bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white"
                    : "bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500"
                }`}
              />
              <p className={`text-[10px] mt-1 ${isLight ? "text-slate-500" : "text-slate-500"}`}>
                Paste direct MP4 link or sample vertical video URL.
              </p>
            </div>

            {/* Creator Handle & Caption */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`flex items-center gap-1 text-xs font-semibold mb-1 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Creator Handle</span>
                </label>
                <input
                  type="text"
                  value={creatorHandle}
                  onChange={(e) => setCreatorHandle(e.target.value)}
                  placeholder="@yourname"
                  className={`w-full rounded-xl p-3 text-xs outline-none transition ${
                    isLight
                      ? "bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white"
                      : "bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500"
                  }`}
                />
              </div>

              <div>
                <label className={`text-xs font-semibold mb-1 block ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                  Caption
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Relatable meme vibe..."
                  className={`w-full rounded-xl p-3 text-xs outline-none transition ${
                    isLight
                      ? "bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white"
                      : "bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500"
                  }`}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !videoUrl.trim()}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 disabled:opacity-40 transition"
              >
                {isSubmitting ? "Posting..." : "Post Reel"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
