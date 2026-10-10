"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Volume2, VolumeX, Play, Pause, Share2, Sparkles, MessageSquareQuote, Eye, User } from "lucide-react";
import { ReelItem } from "@/types/thought";
import { formatRelativeTime } from "@/lib/utils";
import { useToast } from "./ToastContainer";
import { toggleReelLikeService } from "@/services/thoughtService";
import { useAuth } from "@/lib/auth";

interface ReelCardProps {
  reel: ReelItem;
}

export const ReelCard: React.FC<ReelCardProps> = ({ reel }) => {
  const { showToast } = useToast();
  const { requireAuth } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reel.likes);

  const avatarLetter = reel.creatorHandle.replace("@", "").charAt(0).toUpperCase() || "C";

  // Auto play/pause when in viewport
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.6 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(() => {
      const nextState = !isLiked;
      setIsLiked(nextState);
      setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
      toggleReelLikeService(reel.id, !nextState);
    }, "Sign in to like community reels");
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href);
    showToast("Reel link copied to clipboard! 🎬", "success");
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full max-w-sm mx-auto mb-6 overflow-hidden rounded-3xl bg-slate-950 border border-slate-800/90 shadow-2xl group hover:border-violet-500/40 transition-all duration-300"
    >
      {/* Video Container (Vertical 9:16 aspect ratio) */}
      <div className="relative aspect-[9/16] w-full bg-black cursor-pointer overflow-hidden" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={reel.videoUrl}
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover select-none"
        />

        {/* Play/Pause Overlay indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none transition-all">
            <div className="w-16 h-16 rounded-full bg-slate-950/70 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xl">
              <Play className="w-8 h-8 fill-white translate-x-0.5" />
            </div>
          </div>
        )}

        {/* Top Header Overlay: Creator Handle & Sound Toggle */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10 text-xs font-semibold text-white shadow-lg">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-violet-500 to-pink-500 flex items-center justify-center text-[10px] font-bold">
              {avatarLetter}
            </div>
            <span className="text-violet-300 font-bold font-mono">{reel.creatorHandle}</span>
          </div>

          <button
            onClick={toggleMute}
            className="p-2.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10 text-white hover:bg-slate-900 transition shadow-lg"
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        {/* Floating Connected Thought Prompt (If based on a thought) */}
        {reel.thoughtText && (
          <div className="absolute top-16 left-4 right-4 z-20">
            <div className="p-3.5 rounded-2xl bg-indigo-950/85 backdrop-blur-md border border-indigo-500/40 text-indigo-100 shadow-xl">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                <MessageSquareQuote className="w-3.5 h-3.5 text-indigo-400" />
                <span>Inspired Thought</span>
              </div>
              <p className="text-xs font-medium leading-snug line-clamp-2 select-text">
                &ldquo;{reel.thoughtText}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Bottom Details Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-5 bg-gradient-to-t from-black via-black/80 to-transparent flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed drop-shadow-md select-text">
              {reel.caption}
            </p>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-300 font-mono">
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-400" />
                <span>{reel.views + (isPlaying ? 1 : 0)} views</span>
              </div>
              <span>•</span>
              <span className="text-violet-300 font-sans font-medium text-[10px]">
                {reel.isCommunity || reel.id.startsWith("reel_seed_") || !reel.createdAt
                  ? "Community Reel"
                  : formatRelativeTime(reel.createdAt)}
              </span>
            </div>
          </div>

          {/* Right Action Icons Column */}
          <div className="flex flex-col items-center gap-3.5 shrink-0">
            {/* Like Reel Button */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleLikeToggle}
              className="flex flex-col items-center gap-1 text-white"
            >
              <div className={`p-3 rounded-full backdrop-blur-md transition ${
                isLiked
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/50"
                  : "bg-slate-900/80 border border-white/15 text-slate-200 hover:bg-slate-800"
              }`}>
                <Heart className={`w-5 h-5 ${isLiked ? "fill-white" : ""}`} />
              </div>
              <span className="text-xs font-bold font-mono">{likesCount}</span>
            </motion.button>

            {/* Share Reel */}
            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-1 text-white"
              title="Share Reel"
            >
              <div className="p-3 rounded-full bg-slate-900/80 border border-white/15 text-slate-200 backdrop-blur-md hover:bg-slate-800 transition">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold">Share</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
