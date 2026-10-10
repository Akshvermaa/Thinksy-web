"use client";

import React from "react";
import { MessageSquareQuote, Plus } from "lucide-react";

interface EmptyStateProps {
  onOpenComposer: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onOpenComposer }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-xl">
        <MessageSquareQuote className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">No thoughts here yet</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
        Be the first one to drop a short, relatable thought. Someone might turn it into a viral meme!
      </p>

      <button
        onClick={onOpenComposer}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition"
      >
        <Plus className="w-4 h-4" />
        <span>Drop the First Thought</span>
      </button>
    </div>
  );
};
