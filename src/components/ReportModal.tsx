"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag, X, ShieldAlert, Check } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useScrollLock } from "@/lib/useScrollLock";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (reason: string) => void;
}

const REPORT_REASONS = [
  "Personal info / Phone number / Email",
  "Chat message / 1-on-1 conversation",
  "Spam, promo, or advertising links",
  "Harassment, hate speech, or abuse",
  "Sexually explicit content",
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmitReport,
}) => {
  const { isLight } = useTheme();
  useScrollLock(isOpen);
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReport(selectedReason);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overscroll-contain"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl transition-colors ${
            isLight
              ? "bg-white border border-slate-200 text-slate-900 shadow-slate-300/40"
              : "bg-slate-900 border border-slate-800 text-white"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-rose-500 font-semibold text-base">
              <ShieldAlert className="w-5 h-5" />
              <span>Report Thought</span>
            </div>
            <button
              onClick={onClose}
              className={`p-1 rounded-full transition ${
                isLight
                  ? "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className={`text-xs mb-4 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            Help us maintain a high-quality feed of relatable thoughts. Select a reason:
          </p>

          <form onSubmit={handleSubmit} className="space-y-2">
            {REPORT_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <button
                  type="button"
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full text-left flex items-center justify-between p-3 rounded-xl text-xs font-medium transition ${
                    isSelected
                      ? "bg-rose-50 border border-rose-300 text-rose-700"
                      : isLight
                      ? "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                      : "bg-slate-800/40 border border-slate-800 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span>{reason}</span>
                  {isSelected && <Check className="w-4 h-4 text-rose-600 shrink-0" />}
                </button>
              );
            })}

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition"
              >
                Submit Report
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
