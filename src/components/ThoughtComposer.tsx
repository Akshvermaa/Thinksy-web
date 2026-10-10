"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, AlertCircle, Plus, Zap, User, Tag } from "lucide-react";
import confetti from "canvas-confetti";
import { validateThought } from "@/lib/moderation";
import { createThought } from "@/services/thoughtService";
import { useToast } from "./ToastContainer";
import { Thought } from "@/types/thought";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useScrollLock } from "@/lib/useScrollLock";

interface ThoughtComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onThoughtCreated: (newThought: Thought) => void;
  initialText?: string;
  initialCategory?: string;
}

const CATEGORY_OPTIONS = [
  "College Life",
  "Overthinking",
  "Work Life",
  "Family",
  "Daily Life",
  "Coding",
  "Memes",
];

export const ThoughtComposer: React.FC<ThoughtComposerProps> = ({
  isOpen,
  onClose,
  onThoughtCreated,
  initialText = "",
  initialCategory,
}) => {
  const { showToast } = useToast();
  const { isLight } = useTheme();
  const { user } = useAuth();
  useScrollLock(isOpen);
  const [text, setText] = useState("");
  const [authorHandle, setAuthorHandle] = useState(() => user?.handle || "@anonymous");
  const [selectedCategory, setSelectedCategory] = useState("College Life");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charLimit = 280;
  const remainingChars = charLimit - text.length;

  useEffect(() => {
    if (user?.handle) {
      setAuthorHandle(user.handle);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      if (initialText) {
        setText(initialText);
      }
      if (initialCategory && CATEGORY_OPTIONS.includes(initialCategory)) {
        setSelectedCategory(initialCategory);
      }
      if (user?.handle) {
        setAuthorHandle(user.handle);
      }
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } else {
      setText("");
      setErrorMsg(null);
    }
  }, [isOpen, initialText, initialCategory, user]);

  useEffect(() => {
    if (!text.trim()) {
      setErrorMsg(null);
      return;
    }
    const res = validateThought(text);
    if (!res.isValid && text.length >= 8) {
      setErrorMsg(res.reason || null);
    } else {
      setErrorMsg(null);
    }
  }, [text]);

  if (!isOpen) return null;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#6366f1", "#8b5cf6", "#ec4899", "#3b82f6"],
      });
    } catch {
      // Optional
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateThought(text);
    if (!validation.isValid) {
      setErrorMsg(validation.reason || "Invalid thought text.");
      showToast(validation.reason || "Please check your thought guidelines.", "error");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await createThought(text, authorHandle);
      created.category = selectedCategory;
      onThoughtCreated(created);
      triggerConfetti();
      showToast("Thought dropped! 🚀 Someone might turn it into a meme.", "success");
      setText("");
      onClose();
    } catch (err: any) {
      const msg = err?.message || "Failed to drop thought. Please try again.";
      setErrorMsg(msg);
      showToast(msg, "error");
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
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-hidden transition-colors ${
            isLight
              ? "bg-white border border-slate-200 text-slate-900 shadow-slate-300/50"
              : "bg-slate-900 border border-slate-800 text-white"
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between pb-4 border-b mb-4 ${isLight ? "border-slate-100" : "border-slate-800"}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className={`text-lg font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                What are you thinking?
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className={`p-1.5 rounded-full transition ${
                isLight
                  ? "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Input Textarea */}
            <div className="relative mb-3">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={charLimit}
                rows={4}
                placeholder="e.g. Bhai kal exam hai aur tu Instagram chala raha hai 💀"
                className={`w-full rounded-2xl p-4 text-base resize-none outline-none transition ${
                  isLight
                    ? "bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                    : "bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                }`}
              />
            </div>

            {/* Category Tag Selection */}
            <div className="mb-3">
              <label className={`flex items-center gap-1 text-[11px] font-semibold mb-1.5 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                <Tag className="w-3 h-3 text-indigo-500" />
                <span>Choose Category / Vibe</span>
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-sm"
                          : isLight
                          ? "bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200/80 border border-slate-200"
                          : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Author Handle / Pseudonym */}
            <div className="mb-3 flex items-center gap-2">
              <User className={`w-4 h-4 shrink-0 ${isLight ? "text-slate-400" : "text-slate-400"}`} />
              <input
                type="text"
                value={authorHandle}
                onChange={(e) => setAuthorHandle(e.target.value)}
                placeholder="@handle or anonymous"
                className={`w-full rounded-xl p-2.5 text-xs outline-none font-mono transition ${
                  isLight
                    ? "bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white"
                    : "bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500"
                }`}
              />
            </div>

            {/* Live Error / Warning Notice */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-xs text-rose-500 bg-rose-50 border border-rose-200 p-2.5 rounded-xl mb-3"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            <p className={`text-[11px] mb-4 leading-relaxed ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              💡 Keep it short & relatable for reels/memes. No phone numbers, links, or chat greetings.
            </p>

            {/* Footer Row */}
            <div className={`flex items-center justify-between gap-4 pt-2 border-t ${isLight ? "border-slate-100" : "border-slate-800/60"}`}>
              <div className="text-xs font-mono font-medium">
                <span className={remainingChars < 30 ? "text-amber-500 font-bold" : isLight ? "text-slate-600" : "text-slate-400"}>
                  {remainingChars}
                </span>
                <span className={isLight ? "text-slate-400" : "text-slate-500"}> / {charLimit}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isLight
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !text.trim() || text.length < 5 || text.length > charLimit}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-40 disabled:pointer-events-none transition duration-150"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 fill-white" />
                  )}
                  <span>{isSubmitting ? "Dropping..." : "Drop Thought"}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const FloatingComposerButton: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className = "" }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-2xl shadow-indigo-500/40 border border-white/20 cursor-pointer ${className}`}
      aria-label="Drop a Thought"
    >
      <Plus className="w-5 h-5 stroke-[2.5]" />
      <span className="hidden sm:inline">Drop a Thought</span>
      <span className="sm:hidden">Drop</span>
    </motion.button>
  );
};
