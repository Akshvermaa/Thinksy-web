"use client";

import React, { useState } from "react";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme";

interface LikeButtonProps {
  thoughtId: string;
  likes: number;
  isLiked: boolean;
  onLikeToggle: (thoughtId: string, newLikedState: boolean) => void;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  thoughtId,
  likes,
  isLiked: initialIsLiked,
  onLikeToggle,
}) => {
  const { isLight } = useTheme();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [count, setCount] = useState(likes);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    const nextState = !isLiked;
    setIsLiked(nextState);
    setCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    onLikeToggle(thoughtId, nextState);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.82 }}
      onClick={handleClick}
      className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 select-none ${
        isLiked
          ? isLight
            ? "bg-rose-50 text-rose-600 border border-rose-200 shadow-xs"
            : "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/20"
          : isLight
          ? "bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-slate-200"
          : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60"
      }`}
      aria-label={isLiked ? "Unlike thought" : "Like thought"}
    >
      <motion.div
        animate={isLiked ? { scale: [1, 1.45, 1] } : { scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        <Heart
          className={`w-3.5 h-3.5 transition-colors ${
            isLiked
              ? "fill-rose-500 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
              : isLight
              ? "text-slate-400 group-hover:text-rose-500"
              : "text-slate-400 group-hover:text-rose-400"
          }`}
        />
      </motion.div>
      <span className="tabular-nums font-mono text-[11px]">{count}</span>
    </motion.button>
  );
};
