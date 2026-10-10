"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, User, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useToast } from "./ToastContainer";

const POPULAR_HANDLES = [
  "@exam_survivor",
  "@night_owl",
  "@coffee_addict",
  "@silent_overthinker",
  "@meme_artisan",
  "@reel_creator",
];

import { validateEmailRealitySync } from "@/lib/emailVerifier";
import { useScrollLock } from "@/lib/useScrollLock";

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, loginReason, loginWithGoogle, quickLogin } = useAuth();
  const { isLight } = useTheme();
  const { showToast } = useToast();
  useScrollLock(isLoginModalOpen);

  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanHandle = handle.trim();
    if (!cleanHandle) {
      showToast("Please enter a creator handle or email to continue.", "info");
      return;
    }

    // If entering an email, verify reality
    if (cleanHandle.includes("@") && cleanHandle.includes(".")) {
      const realityCheck = validateEmailRealitySync(cleanHandle);
      if (!realityCheck.isValid) {
        showToast(`❌ Cannot continue: ${realityCheck.reason}`, "error");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await quickLogin(cleanHandle, displayName);
      showToast(`Welcome ${cleanHandle.startsWith("@") ? cleanHandle : `@${cleanHandle}`}! 🎉`, "success");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickPreset = (preset: string) => {
    setHandle(preset);
  };

  const handleGoogleClick = async () => {
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      showToast("Signed in with Google! 🚀", "success");
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
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl overflow-hidden transition-colors ${
            isLight
              ? "bg-white border border-slate-200 text-slate-900 shadow-slate-300/40"
              : "bg-slate-900 border border-slate-800 text-white"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-inherit">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <Sparkles className="w-4 h-4 fill-white" />
              </div>
              <div>
                <h3 className={`text-base sm:text-lg font-black tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                  Join Thinksy Community
                </h3>
                <p className={`text-[11px] font-medium ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  Explore freely, sign in to participate
                </p>
              </div>
            </div>
            <button
              onClick={closeLoginModal}
              className={`p-1.5 rounded-full transition ${
                isLight
                  ? "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Reason Notification Banner */}
          <div
            className={`p-3 rounded-2xl mb-4 flex items-center gap-2 text-xs font-medium ${
              isLight
                ? "bg-indigo-50/80 border border-indigo-100 text-indigo-900"
                : "bg-indigo-950/40 border border-indigo-500/30 text-indigo-200"
            }`}
          >
            <Zap className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>{loginReason}</span>
          </div>

          {/* Option 1: Continue with Google */}
          <div className="space-y-3 mb-4">
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-2xl text-xs font-bold border transition shadow-sm active:scale-98 ${
                isLight
                  ? "bg-white hover:bg-slate-50 border-slate-300 text-slate-800"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100"
              }`}
            >
              {/* Colorful Google 'G' icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Subtle Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className={`flex-1 h-px ${isLight ? "bg-slate-200" : "bg-slate-800"}`} />
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                or choose creator handle
              </span>
              <div className={`flex-1 h-px ${isLight ? "bg-slate-200" : "bg-slate-800"}`} />
            </div>
          </div>

          {/* Option 2: Custom Creator Handle */}
          <form onSubmit={handleCustomLogin} className="space-y-3">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                Creator Handle (@username)
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@your_handle"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm font-mono outline-none transition ${
                    isLight
                      ? "bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                      : "bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
                  }`}
                />
              </div>
            </div>

            {/* Quick preset chips */}
            <div>
              <span className={`block text-[10px] font-semibold mb-1.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Quick ideas:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {POPULAR_HANDLES.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePickPreset(preset)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono transition ${
                      handle === preset
                        ? "bg-indigo-600 text-white font-bold"
                        : isLight
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !handle.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition active:scale-98 disabled:opacity-40 disabled:pointer-events-none mt-2"
            >
              <span>Join & Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Privacy reassurance */}
          <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>No spam. You can change your handle anytime.</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
