"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Thought, SortOrder } from "@/types/thought";
import { fetchThoughts } from "@/services/thoughtService";
import { ThoughtCard } from "./ThoughtCard";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { RefreshCw, ArrowUp, Search, X, Sparkles } from "lucide-react";
import { useTheme } from "@/lib/theme";

interface ThoughtFeedProps {
  sortOrder: SortOrder;
  onOpenComposer: () => void;
  newlyDroppedThought: Thought | null;
  searchQuery?: string;
  onClearSearch?: () => void;
  selectedCategory?: string;
  onResetCategory?: () => void;
  surpriseTrigger?: number;
}

export const ThoughtFeed: React.FC<ThoughtFeedProps> = ({
  sortOrder,
  onOpenComposer,
  newlyDroppedThought,
  searchQuery = "",
  onClearSearch,
  selectedCategory = "All",
  onResetCategory,
  surpriseTrigger,
}) => {
  const { isLight } = useTheme();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  // Prepend newly created thought if present
  useEffect(() => {
    if (newlyDroppedThought) {
      setThoughts((prev) => {
        if (prev.some((t) => t.id === newlyDroppedThought.id)) return prev;
        return [newlyDroppedThought, ...prev];
      });
    }
  }, [newlyDroppedThought]);

  // Initial load or when sort order changes
  const loadInitialThoughts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchThoughts({ pageSize: 15, sortOrder });
      setThoughts(res.thoughts);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error("Failed to load thoughts:", err);
      setError("Failed to load feed. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, [sortOrder]);

  useEffect(() => {
    loadInitialThoughts();
  }, [loadInitialThoughts]);

  // Handle Surprise Me random scroll
  useEffect(() => {
    if (!surpriseTrigger || thoughts.length === 0) return;
    const randomIndex = Math.floor(Math.random() * thoughts.length);
    const chosen = thoughts[randomIndex];
    if (chosen) {
      setHighlightedId(chosen.id);
      const element = document.getElementById(`thought-${chosen.id}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      const timer = setTimeout(() => setHighlightedId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [surpriseTrigger, thoughts]);

  // Infinite scroll load more handler
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !lastDoc) return;
    setIsLoadingMore(true);

    try {
      const res = await fetchThoughts({ pageSize: 10, lastDoc, sortOrder });
      setThoughts((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const uniqueNext = res.thoughts.filter((t) => !existingIds.has(t.id));
        return [...prev, ...uniqueNext];
      });
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error("Failed to load more thoughts:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, lastDoc, sortOrder]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoading &&
          !isLoadingMore &&
          !searchQuery.trim() &&
          (!selectedCategory || selectedCategory === "All")
        ) {
          handleLoadMore();
        }
      },
      { threshold: 0.2 }
    );

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, isLoading, isLoadingMore, handleLoadMore, searchQuery, selectedCategory]);

  // Clean, robust filtering
  const query = (searchQuery || "").trim().toLowerCase();
  const activeCategory = selectedCategory && selectedCategory !== "All" ? selectedCategory : null;
  const isFiltering = Boolean(query || activeCategory);

  const displayedThoughts = thoughts.filter((t) => {
    if (activeCategory && t.category !== activeCategory) return false;
    if (!query) return true;
    const textMatch = t.text?.toLowerCase().includes(query);
    const handleMatch = t.authorHandle?.toLowerCase().includes(query);
    const categoryMatch = t.category?.toLowerCase().includes(query);
    return textMatch || handleMatch || categoryMatch;
  });

  if (isLoading) {
    return (
      <div className="px-1 py-2">
        <LoadingState count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-rose-400 text-sm mb-4">{error}</p>
        <button
          onClick={loadInitialThoughts}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (thoughts.length === 0) {
    return <EmptyState onOpenComposer={onOpenComposer} />;
  }

  return (
    <div className="px-1 pb-24">
      {/* Search or Category Filter Active Header */}
      {isFiltering && (
        <div className={`mb-3.5 flex items-center justify-between text-xs px-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span>Filtering:</span>
            {activeCategory && (
              <span
                className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                  isLight
                    ? "bg-indigo-50 border border-indigo-200 text-indigo-700"
                    : "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300"
                }`}
              >
                {activeCategory}
              </span>
            )}
            {query && (
              <span className={`font-semibold ${isLight ? "text-slate-900" : "text-slate-200"}`}>
                &ldquo;{query}&rdquo;
              </span>
            )}
            <span className={`text-[11px] ${isLight ? "text-slate-400" : "text-slate-500"}`}>
              ({displayedThoughts.length} {displayedThoughts.length === 1 ? "thought" : "thoughts"})
            </span>
          </div>

          <button
            onClick={() => {
              if (onClearSearch) onClearSearch();
              if (onResetCategory) onResetCategory();
            }}
            className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Empty Search / Filter Results */}
      {displayedThoughts.length === 0 && isFiltering ? (
        <div
          className={`py-14 px-4 text-center rounded-3xl my-2 ${
            isLight
              ? "bg-white border border-slate-200 shadow-sm"
              : "bg-slate-900/60 border border-slate-800/80"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h4 className={`text-base font-bold mb-1 ${isLight ? "text-slate-900" : "text-white"}`}>
            No thoughts matched
          </h4>
          <p className={`text-xs max-w-xs mx-auto mb-4 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            Try adjusting your search keyword or switching the category filter.
          </p>
          <button
            onClick={() => {
              if (onClearSearch) onClearSearch();
              if (onResetCategory) onResetCategory();
            }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-xs font-bold text-white shadow-lg transition"
          >
            Show All Thoughts
          </button>
        </div>
      ) : (
        /* Thoughts Feed Cards */
        <div className="space-y-4">
          {displayedThoughts.map((thought) => (
            <ThoughtCard
              key={thought.id}
              thought={thought}
              isHighlighted={thought.id === highlightedId}
            />
          ))}
        </div>
      )}

      {/* Infinite Scroll Trigger Element */}
      {!isFiltering && (
        <div ref={loadMoreTriggerRef} className="py-8 flex justify-center items-center">
          {isLoadingMore ? (
            <div
              className={`flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full border ${
                isLight
                  ? "bg-white text-slate-700 border-slate-200 shadow-xs"
                  : "bg-slate-900/80 text-slate-400 border-slate-800"
              }`}
            >
              <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Fetching more thoughts...</span>
            </div>
          ) : hasMore ? (
            <button
              onClick={handleLoadMore}
              className={`text-xs px-4 py-2 rounded-full border transition ${
                isLight
                  ? "bg-white text-slate-600 hover:text-indigo-600 border-slate-200 hover:border-indigo-300 shadow-xs"
                  : "text-slate-400 hover:text-indigo-400 border-slate-800 hover:border-indigo-500/40"
              }`}
            >
              Load more thoughts
            </button>
          ) : (
            <div className={`flex flex-col items-center gap-2 text-xs pt-4 ${isLight ? "text-slate-500" : "text-slate-500"}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
              <span>You&apos;ve reached the end of thoughts for now!</span>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-indigo-500 hover:underline"
              >
                <ArrowUp className="w-3 h-3" />
                <span>Back to top</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
