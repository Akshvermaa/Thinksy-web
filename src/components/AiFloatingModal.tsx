"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Bot, MessageSquarePlus } from "lucide-react";
import { AiChatView } from "./AiChatView";
import { useTheme } from "@/lib/theme";
import { sound } from "@/lib/sound";
import { useScrollLock } from "@/lib/useScrollLock";

interface AiFloatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDropThought: (text: string) => void;
}

export const AiFloatingModal: React.FC<AiFloatingModalProps> = ({
  isOpen,
  onClose,
  onDropThought,
}) => {
  const { isLight } = useTheme();
  useScrollLock(isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              sound.playPop(380);
              onClose();
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full max-w-xl sm:max-w-2xl max-h-[88vh] sm:max-h-[82vh] rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl z-10 flex flex-col ${
              isLight ? "bg-white" : "bg-slate-900"
            }`}
          >
            {/* Top Close Button */}
            <button
              onClick={() => {
                sound.playPop(380);
                onClose();
              }}
              className={`absolute top-3.5 right-3.5 z-30 p-1.5 rounded-full border transition active:scale-95 ${
                isLight
                  ? "bg-white/80 hover:bg-slate-100 border-slate-200 text-slate-700"
                  : "bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200"
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            <AiChatView
              onDropThought={onDropThought}
              onClose={onClose}
              isFloatingModal={true}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const FloatingAiButton: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className = "" }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        sound.playPop(520);
        onClick();
      }}
      title="Talk to Thinksy AI"
      className={`flex items-center gap-2 py-2.5 px-4 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-xl shadow-purple-600/35 border border-white/20 backdrop-blur-md transition-all group ${className}`}
    >
      <Sparkles className="w-4 h-4 text-pink-200 group-hover:rotate-12 transition-transform" />
      <span className="tracking-wide">AI Muse</span>
      <span className="w-1.5 h-1.5 rounded-full bg-pink-300 animate-ping" />
    </motion.button>
  );
};
