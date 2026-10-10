"use client";

import React from "react";

export const ThoughtSkeleton: React.FC = () => {
  return (
    <div className="w-full mb-4.5 rounded-3xl bg-slate-900/60 border border-slate-800/80 p-5 sm:p-6 animate-pulse">
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-slate-800 rounded-md w-11/12" />
        <div className="h-4 bg-slate-800/60 rounded-md w-3/4" />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
        <div className="h-6 w-16 bg-slate-800 rounded-full" />
        <div className="h-3 w-12 bg-slate-800 rounded-md" />
      </div>
    </div>
  );
};

export const LoadingState: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="w-full space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <ThoughtSkeleton key={idx} />
      ))}
    </div>
  );
};
