"use client";

import React, { useState, useEffect } from "react";
import { ReelItem } from "@/types/thought";
import { fetchReels } from "@/services/thoughtService";
import { ReelCard } from "./ReelCard";
import { Video, Plus, Search } from "lucide-react";
import { ReelComposer } from "./ReelComposer";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";

interface ReelFeedProps {
  newlyDroppedReel: ReelItem | null;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const ReelFeed: React.FC<ReelFeedProps> = ({
  newlyDroppedReel,
  searchQuery = "",
  onClearSearch,
}) => {
  const { isLight } = useTheme();
  const { requireAuth } = useAuth();
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  useEffect(() => {
    if (newlyDroppedReel) {
      setReels((prev) => [newlyDroppedReel, ...prev]);
    }
  }, [newlyDroppedReel]);

  useEffect(() => {
    const loadReels = async () => {
      setIsLoading(true);
      try {
        const res = await fetchReels({ pageSize: 15 });
        setReels(res.reels);
      } catch (err) {
        console.error("Failed to load reels:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadReels();
  }, []);

  const handleReelCreated = (newReel: ReelItem) => {
    setReels((prev) => [newReel, ...prev]);
  };

  const handleOpenComposer = () => {
    requireAuth(() => setIsComposerOpen(true), "Sign in to drop a community video reel");
  };

  const query = searchQuery.toLowerCase().trim();
  const displayedReels = reels.filter((r) => {
    if (!query) return true;
    const captionMatch = r.caption?.toLowerCase().includes(query);
    const handleMatch = r.creatorHandle?.toLowerCase().includes(query);
    const thoughtMatch = r.thoughtText?.toLowerCase().includes(query);
    return captionMatch || handleMatch || thoughtMatch;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
        <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium">Loading Community Reels...</span>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24">
      {/* Action Header Banner for Reels Section */}
      <div
        className={`mb-6 p-4 rounded-2xl text-center flex items-center justify-between gap-3 transition-colors ${
          isLight
            ? "bg-gradient-to-r from-violet-50 via-purple-50 to-pink-50 border border-violet-200 text-slate-900 shadow-sm"
            : "bg-gradient-to-r from-violet-950/60 to-slate-900 border border-violet-500/20"
        }`}
      >
        <div className="text-left">
          <div
            className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${
              isLight ? "text-violet-700" : "text-violet-300"
            }`}
          >
            <Video className={`w-3.5 h-3.5 ${isLight ? "text-violet-600" : "text-violet-400"}`} />
            <span>Community Reels</span>
          </div>
          <p className={`text-xs mt-0.5 ${isLight ? "text-slate-600" : "text-slate-300"}`}>
            Watch short video clips created from relatable thoughts!
          </p>
        </div>

        <button
          onClick={handleOpenComposer}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Drop Reel</span>
        </button>
      </div>

      {/* Search Result Counter */}
      {query && (
        <div className={`mb-4 flex items-center justify-between text-xs px-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
          <span>
            Found <strong className="text-violet-500 font-semibold">{displayedReels.length}</strong> {displayedReels.length === 1 ? "reel" : "reels"} for &ldquo;{searchQuery}&rdquo;
          </span>
          {onClearSearch && (
            <button
              onClick={onClearSearch}
              className="text-xs text-violet-500 hover:text-violet-600 font-medium"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Empty Search Results */}
      {displayedReels.length === 0 && query ? (
        <div
          className={`py-14 px-4 text-center rounded-3xl my-2 ${
            isLight
              ? "bg-white border border-slate-200 shadow-sm"
              : "bg-slate-900/60 border border-slate-800/80"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500 mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h4 className={`text-base font-bold mb-1 ${isLight ? "text-slate-900" : "text-white"}`}>
            No reels matched
          </h4>
          <p className={`text-xs max-w-xs mx-auto mb-4 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            We couldn&apos;t find any reels matching &ldquo;{searchQuery}&rdquo;.
          </p>
          {onClearSearch && (
            <button
              onClick={onClearSearch}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                isLight
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
            >
              Clear Search
            </button>
          )}
        </div>
      ) : displayedReels.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500 mx-auto mb-3">
            <Video className="w-7 h-7" />
          </div>
          <h3 className={`text-base font-bold mb-1 ${isLight ? "text-slate-900" : "text-white"}`}>
            No Reels Dropped Yet
          </h3>
          <p className={`text-xs max-w-xs mx-auto mb-4 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            Be the first creator to drop a video clip inspired by a thought!
          </p>
          <button
            onClick={handleOpenComposer}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Drop a Reel</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedReels.map((reel) => (
            <ReelCard key={reel.id} reel={reel} />
          ))}
        </div>
      )}

      {/* Reel Composer Modal */}
      <ReelComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onReelCreated={handleReelCreated}
      />
    </div>
  );
};
