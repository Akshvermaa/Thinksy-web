"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { sound } from "@/lib/sound";

interface VoiceNotePlayerProps {
  audioUrl?: string;
  durationSec?: number;
  isSelf?: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  audioUrl,
  durationSec = 5,
  isSelf = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Set up audio instance if real audio URL
  useEffect(() => {
    if (audioUrl && audioUrl !== "SIMULATED_VOICE_NOTE") {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
      };

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      return () => {
        audio.pause();
        audioRef.current = null;
      };
    }
  }, [audioUrl]);

  // Handle Play/Pause
  const togglePlay = () => {
    sound.playPop(520);

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch((err) => {
          console.warn("Audio playback error:", err);
          simulatePlayback();
        });
        setIsPlaying(true);
      }
    } else {
      // Simulated audio waveform playback
      simulatePlayback();
    }
  };

  const simulatePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setProgress(0);
      return;
    }

    setIsPlaying(true);
    setProgress(0);

    // Play subtle audio tone
    sound.playPop(440);
    setTimeout(() => sound.playPop(520), 400);

    const interval = 100;
    const totalSteps = (durationSec * 1000) / interval;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setProgress((step / totalSteps) * 100);
      if (step >= totalSteps) {
        clearInterval(timer);
        setIsPlaying(false);
        setProgress(0);
      }
    }, interval);
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-2xl max-w-[260px] sm:max-w-[290px] select-none ${
        isSelf
          ? "bg-white/15 text-white"
          : "bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50"
      }`}
    >
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm ${
          isSelf
            ? "bg-white text-indigo-700 hover:bg-slate-100"
            : "bg-indigo-600 hover:bg-indigo-700 text-white"
        }`}
        title={isPlaying ? "Pause voice note" : "Play voice note"}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      {/* Waveform Bar Simulator */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-0.5 sm:gap-1 h-5 overflow-hidden">
          {[40, 75, 55, 90, 60, 100, 45, 80, 65, 95, 50, 70, 85, 40, 60].map((h, i) => {
            const barProgress = (i / 15) * 100;
            const isPlayed = progress >= barProgress;
            return (
              <span
                key={i}
                style={{ height: `${Math.max(15, h)}%` }}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPlayed
                    ? isSelf
                      ? "bg-amber-300"
                      : "bg-indigo-500 dark:bg-indigo-400"
                    : isSelf
                    ? "bg-white/40"
                    : "bg-slate-300 dark:bg-slate-600"
                } ${isPlaying && isPlayed ? "animate-pulse" : ""}`}
              />
            );
          })}
        </div>

        {/* Duration / Timer */}
        <div className="flex items-center justify-between text-[10px] font-mono opacity-80">
          <span>{formatSec((progress / 100) * durationSec)}</span>
          <span className="flex items-center gap-1">
            <Volume2 className="w-2.5 h-2.5" />
            {formatSec(durationSec)}
          </span>
        </div>
      </div>
    </div>
  );
};
