"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  RotateCcw,
  Copy,
  Check,
  PlusCircle,
  MessageSquareQuote,
  Bot,
  User,
  Zap,
  Flame,
  Moon,
  GraduationCap,
  Briefcase,
  Video,
  Coffee,
  Smile,
  ChevronRight,
  ChevronLeft,
  History,
  Plus,
  Trash2,
  Search,
  MessageSquare,
  Clock,
  X,
  AlertCircle,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { sound } from "@/lib/sound";
import { useToast } from "./ToastContainer";
import {
  Message,
  ChatSession,
  createNewSession,
  loadChatSessions,
  saveOrUpdateSession,
  deleteChatSession,
  clearAllChatSessions,
  getActiveSessionId,
  setActiveSessionId,
  generateSessionTitle,
  formatChatTime,
} from "@/lib/aiChatStorage";

interface AiChatViewProps {
  onDropThought: (text: string, category?: string) => void;
  onClose?: () => void;
  isFloatingModal?: boolean;
}

const STARTER_PROMPTS = [
  {
    icon: <Smile className="w-3.5 h-3.5 text-indigo-400" />,
    label: "👋 How are you?",
    prompt: "How are you doing today?",
  },
  {
    icon: <Moon className="w-3.5 h-3.5 text-purple-400" />,
    label: "🌙 3 AM Overthinking",
    prompt: "Give me a relatable late-night thought",
  },
  {
    icon: <Coffee className="w-3.5 h-3.5 text-amber-400" />,
    label: "☕ Chai & Adulthood",
    prompt: "Give me a relatable thought about chai and adulthood",
  },
  {
    icon: <Briefcase className="w-3.5 h-3.5 text-emerald-400" />,
    label: "💼 Office Survival",
    prompt: "Roast corporate meetings in one sentence",
  },
  {
    icon: <Video className="w-3.5 h-3.5 text-rose-400" />,
    label: "🎬 Reel Hook",
    prompt: "Give me a viral reel hook",
  },
];

const STYLE_OPTIONS = [
  { id: "relatable", label: "🎭 Relatable", desc: "Classic meme vibe" },
  { id: "deep", label: "🦉 Late Night", desc: "3 AM realization" },
  { id: "roast", label: "💀 Sarcastic", desc: "Sharp & witty" },
  { id: "viral_hook", label: "🎬 Reel Hook", desc: "Thumb-stopping" },
  { id: "shower_thought", label: "💡 Shower Thought", desc: "Mind-bending" },
];

export const AiChatView: React.FC<AiChatViewProps> = ({
  onDropThought,
  onClose,
  isFloatingModal = false,
}) => {
  const { isLight } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Sessions and Active Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState("");
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Message & Input State
  const [input, setInput] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("relatable");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat sessions from localStorage on mount
  useEffect(() => {
    const loadedSessions = loadChatSessions();
    const activeId = getActiveSessionId();

    if (loadedSessions.length > 0) {
      setSessions(loadedSessions);
      const matched = loadedSessions.find((s) => s.id === activeId) || loadedSessions[0];
      setActiveSession(matched);
      if (matched.style) {
        setSelectedStyle(matched.style);
      }
    } else {
      // Initialize the first session
      const brandNew = createNewSession(user?.displayName || user?.handle, "relatable");
      const updated = saveOrUpdateSession(brandNew);
      setSessions(updated);
      setActiveSession(brandNew);
    }
  }, [user?.displayName, user?.handle]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isLoading]);

  // Filtered sessions for Recent Chats search
  const filteredSessions = useMemo(() => {
    if (!searchHistoryQuery.trim()) return sessions;
    const q = searchHistoryQuery.toLowerCase();
    return sessions.filter((s) => {
      if (s.title.toLowerCase().includes(q)) return true;
      return s.messages.some((m) => m.content.toLowerCase().includes(q));
    });
  }, [sessions, searchHistoryQuery]);

  // Start a new chat session
  const handleNewChat = () => {
    sound.playPop(620);
    const newSess = createNewSession(user?.displayName || user?.handle, selectedStyle);
    const updatedSessions = saveOrUpdateSession(newSess);
    setSessions(updatedSessions);
    setActiveSession(newSess);
    setIsHistoryOpen(false);
    showToast("✨ Started a new conversation", "info");
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  // Select an existing chat session from history
  const handleSelectSession = (sess: ChatSession) => {
    sound.playPop(480);
    setActiveSession(sess);
    setActiveSessionId(sess.id);
    if (sess.style) {
      setSelectedStyle(sess.style);
    }
    setIsHistoryOpen(false);
  };

  // Delete an individual chat session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playPop(350);
    const remaining = deleteChatSession(sessionId);
    setSessions(remaining);
    setSessionToDelete(null);

    if (activeSession?.id === sessionId) {
      if (remaining.length > 0) {
        setActiveSession(remaining[0]);
        setActiveSessionId(remaining[0].id);
      } else {
        const fresh = createNewSession(user?.displayName || user?.handle, selectedStyle);
        const updated = saveOrUpdateSession(fresh);
        setSessions(updated);
        setActiveSession(fresh);
      }
    }
    showToast("🗑️ Chat removed from history", "info");
  };

  // Clear all chat history
  const handleClearAllHistory = () => {
    sound.playPop(350);
    clearAllChatSessions();
    const fresh = createNewSession(user?.displayName || user?.handle, selectedStyle);
    const updated = saveOrUpdateSession(fresh);
    setSessions(updated);
    setActiveSession(fresh);
    setIsHistoryOpen(false);
    setShowClearConfirm(false);
    showToast("🧹 All chat history cleared", "info");
  };

  // Send a message (to AI) and persist conversation
  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    sound.playPop(520);
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    // Ensure we have an active session
    let curr = activeSession;
    if (!curr) {
      curr = createNewSession(user?.displayName || user?.handle, selectedStyle);
    }

    // Auto-generate title if this is the first user prompt or title is still "New Chat"
    const hasPriorUserMsg = curr.messages.some((m) => m.role === "user");
    const newTitle =
      !hasPriorUserMsg || curr.title === "New Chat"
        ? generateSessionTitle(text)
        : curr.title;

    const updatedMessages = [...curr.messages, userMsg];
    const sessionWithUserMsg: ChatSession = {
      ...curr,
      title: newTitle,
      style: selectedStyle,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    setActiveSession(sessionWithUserMsg);
    const updatedList = saveOrUpdateSession(sessionWithUserMsg);
    setSessions(updatedList);
    setInput("");
    setIsLoading(true);

    try {
      const historyForApi = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: historyForApi,
          style: selectedStyle,
          userName: user?.displayName || user?.handle,
        }),
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      const aiMsg: Message = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: data?.message || "Hey! I'm here with you. What's on your mind today? 😄",
        thoughts: data?.thoughts || [],
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, aiMsg];
      const finalSession: ChatSession = {
        ...sessionWithUserMsg,
        messages: finalMessages,
        updatedAt: Date.now(),
      };

      setActiveSession(finalSession);
      const finalSessionsList = saveOrUpdateSession(finalSession);
      setSessions(finalSessionsList);
      sound.playChime();
    } catch (err: any) {
      sound.playPop(350);
      const fallbackAiMsg: Message = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: `Hey! I heard you on "${text}". What's on your mind—want to chat through it or craft a relatable thought together? 😄`,
        thoughts: [],
        timestamp: Date.now(),
      };
      const finalMessages = [...updatedMessages, fallbackAiMsg];
      const finalSession: ChatSession = {
        ...sessionWithUserMsg,
        messages: finalMessages,
        updatedAt: Date.now(),
      };
      setActiveSession(finalSession);
      const finalSessionsList = saveOrUpdateSession(finalSession);
      setSessions(finalSessionsList);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  };

  const handleCopy = (thoughtText: string, id: string) => {
    navigator.clipboard.writeText(thoughtText);
    sound.playPop(620);
    setCopiedId(id);
    showToast("📋 Copied thought to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDropToFeed = (thoughtText: string) => {
    sound.playPop(700);
    showToast("✨ Opening composer with AI thought!", "info");
    onDropThought(thoughtText);
    if (isFloatingModal && onClose) {
      onClose();
    }
  };

  const currentMessages = activeSession?.messages || [];

  return (
    <div
      className={`relative flex flex-col h-full rounded-3xl border shadow-xl transition-all duration-300 overflow-hidden ${
        isFloatingModal
          ? isLight
            ? "bg-white/95 border-slate-200"
            : "bg-slate-900/95 border-slate-800"
          : isLight
          ? "bg-white/90 border-slate-200 backdrop-blur-xl"
          : "bg-slate-900/80 border-slate-800 backdrop-blur-xl"
      }`}
      style={{ minHeight: isFloatingModal ? "540px" : "640px" }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. Header Bar
      ───────────────────────────────────────────────────────────── */}
      <div
        className={`px-3 sm:px-4 py-2.5 sm:py-3 border-b flex items-center justify-between gap-2 shrink-0 ${
          isLight ? "bg-slate-50/80 border-slate-200" : "bg-slate-950/40 border-slate-800"
        } ${isFloatingModal ? "pr-12 sm:pr-14" : ""}`}
      >
        {/* Left: AI Logo & Active Session Title */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-md shadow-indigo-500/25 shrink-0">
            <div
              className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                isLight ? "bg-white" : "bg-slate-950"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500 animate-pulse" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs sm:text-sm font-black tracking-tight">Thinksy AI</h2>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                MUSE
              </span>
            </div>
            <p className={`text-[10px] truncate max-w-[150px] sm:max-w-[220px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {activeSession?.title ? `💬 ${activeSession.title}` : "Chat with AI Muse"}
            </p>
          </div>
        </div>

        {/* Right Header Actions: Recent Chats, New Chat */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Recent Chats Button */}
          <button
            onClick={() => {
              sound.playPop(480);
              setIsHistoryOpen(true);
            }}
            title="Recent chats & history"
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border transition active:scale-95 text-xs font-semibold ${
              isLight
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs"
                : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 shadow-xs"
            }`}
          >
            <History className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden xs:inline text-[11px] sm:text-xs">Chats</span>
            {sessions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {sessions.length}
              </span>
            )}
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            title="Start new chat"
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-sm transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline text-[11px] sm:text-xs">New</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. Style Preset Pills
      ───────────────────────────────────────────────────────────── */}
      <div
        className={`px-3 py-2 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs ${
          isLight ? "bg-white/60 border-slate-100" : "bg-slate-950/20 border-slate-850"
        }`}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
          Vibe:
        </span>
        {STYLE_OPTIONS.map((style) => (
          <button
            key={style.id}
            onClick={() => {
              sound.playPop(480);
              setSelectedStyle(style.id);
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
              selectedStyle === style.id
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-bold"
                : isLight
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                : "bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800"
            }`}
          >
            {style.label}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. Scrollable Message Feed
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {currentMessages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div className={`max-w-[85%] sm:max-w-[80%] space-y-1`}>
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-medium rounded-tr-xs"
                    : isLight
                    ? "bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs"
                    : "bg-slate-800/80 border border-slate-700/80 text-slate-100 rounded-tl-xs shadow-xs"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Compact Drop Action when thought suggestions are present */}
                {msg.thoughts && msg.thoughts.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-inherit/30 flex flex-wrap items-center gap-1.5">
                    {msg.thoughts.map((thought, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleDropToFeed(thought)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-[11px] shadow-sm transition active:scale-95"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Drop as Thought</span>
                      </button>
                    ))}
                    <button
                      onClick={() => handleCopy(msg.thoughts![0], `${msg.id}_copy`)}
                      className={`p-1 rounded-lg border text-[11px] transition active:scale-95 ${
                        isLight
                          ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600"
                          : "bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-300"
                      }`}
                      title="Copy thought"
                    >
                      {copiedId === `${msg.id}_copy` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-white shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs text-slate-400 italic"
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white shrink-0 animate-pulse">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div
              className={`px-3 py-2 rounded-2xl border text-xs flex items-center gap-2 ${
                isLight ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-slate-850 border-slate-800 text-slate-300"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" />
              <span>Thinksy AI is brewing ideas...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. Quick Starter Chips (when idle)
      ───────────────────────────────────────────────────────────── */}
      <div
        className={`px-3 py-2 border-t flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs ${
          isLight ? "bg-slate-50/70 border-slate-100" : "bg-slate-950/30 border-slate-800"
        }`}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mr-1 shrink-0">
          Try:
        </span>
        {STARTER_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(item.prompt)}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap border transition active:scale-95 disabled:opacity-50 ${
              isLight
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs"
                : "bg-slate-850 hover:bg-slate-800 border-slate-750 text-slate-300 shadow-xs"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. Input Area
      ───────────────────────────────────────────────────────────── */}
      <div
        className={`p-3 border-t shrink-0 ${
          isLight ? "bg-white border-slate-200" : "bg-slate-950/60 border-slate-800"
        }`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Chat with Thinksy AI, vent your day, or ask for thoughts..."
              disabled={isLoading}
              className={`w-full py-2.5 px-3.5 pr-8 rounded-2xl text-xs sm:text-sm resize-none outline-none transition border ${
                isLight
                  ? "bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
                  : "bg-slate-900 border-slate-800 focus:border-indigo-500 focus:bg-slate-850 text-white placeholder:text-slate-500"
              }`}
              style={{ minHeight: "42px", maxHeight: "100px" }}
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. RECENT CHATS & CHAT HISTORY SLIDE-OVER DRAWER
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", damping: 27, stiffness: 300 }}
            className={`absolute inset-0 z-30 flex flex-col ${
              isLight ? "bg-white" : "bg-slate-900"
            }`}
          >
            {/* Drawer Header */}
            <div
              className={`px-4 py-3 border-b flex items-center justify-between gap-3 shrink-0 ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Recent Chats & History</h3>
                  <p className={`text-[10px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    {sessions.length} saved conversation{sessions.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playPop(380);
                  setIsHistoryOpen(false);
                }}
                className={`p-1.5 rounded-xl border transition active:scale-95 ${
                  isLight
                    ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                    : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                }`}
                title="Close history"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action: Start New Chat */}
            <div className="p-3 border-b border-inherit/20 shrink-0">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Start New Conversation</span>
              </button>

              {/* Search History */}
              <div className="mt-2 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchHistoryQuery}
                  onChange={(e) => setSearchHistoryQuery(e.target.value)}
                  placeholder="Search previous chats..."
                  className={`w-full py-1.5 pl-8 pr-7 rounded-xl text-xs outline-none border transition ${
                    isLight
                      ? "bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
                      : "bg-slate-950 border-slate-800 focus:border-indigo-500 focus:bg-slate-900 text-slate-100 placeholder:text-slate-500"
                  }`}
                />
                {searchHistoryQuery && (
                  <button
                    onClick={() => setSearchHistoryQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Chat Sessions List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <div className="w-10 h-10 rounded-2xl mx-auto flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-400">
                    {searchHistoryQuery
                      ? `No conversations match "${searchHistoryQuery}"`
                      : "No chat history yet."}
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    {searchHistoryQuery
                      ? "Try searching for a different keyword or topic."
                      : "Start typing to chat with Thinksy AI and your conversations will appear here!"}
                  </p>
                </div>
              ) : (
                filteredSessions.map((sess) => {
                  const isActive = activeSession?.id === sess.id;
                  const lastMessage = sess.messages[sess.messages.length - 1];
                  const userMessagesCount = sess.messages.filter((m) => m.role === "user").length;

                  return (
                    <div
                      key={sess.id}
                      onClick={() => handleSelectSession(sess)}
                      className={`group relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isActive
                          ? isLight
                            ? "bg-indigo-50/90 border-indigo-300 ring-1 ring-indigo-400/30 shadow-xs"
                            : "bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/30 shadow-xs"
                          : isLight
                          ? "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-xs"
                          : "bg-slate-850/60 hover:bg-slate-800 border-slate-800 hover:border-slate-700 shadow-xs"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                          )}
                          <h4
                            className={`text-xs font-bold truncate ${
                              isActive
                                ? "text-indigo-600 dark:text-indigo-400"
                                : isLight
                                ? "text-slate-800"
                                : "text-slate-200"
                            }`}
                          >
                            {sess.title || "New Chat"}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Time */}
                          <span
                            className={`text-[10px] flex items-center gap-1 ${
                              isLight ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {formatChatTime(sess.updatedAt)}
                          </span>

                          {/* Delete Session Button */}
                          <button
                            onClick={(e) => handleDeleteSession(sess.id, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition active:scale-90"
                            title="Delete this chat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Last Message Snippet */}
                      {lastMessage && (
                        <p
                          className={`text-[11px] line-clamp-1 leading-normal ${
                            isLight ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          {lastMessage.role === "user" ? "You: " : "AI: "}
                          {lastMessage.content}
                        </p>
                      )}

                      {/* Meta badges */}
                      <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-400">
                        <span className="px-1.5 py-0.2 rounded-md bg-inherit/40 border border-inherit/30">
                          {userMessagesCount} {userMessagesCount === 1 ? "prompt" : "prompts"}
                        </span>
                        {sess.style && (
                          <span className="px-1.5 py-0.2 rounded-md bg-inherit/40 border border-inherit/30 capitalize">
                            {sess.style.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer */}
            <div
              className={`p-3 border-t flex items-center justify-between text-xs shrink-0 ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/70 border-slate-800"
              }`}
            >
              <span className={`text-[10px] ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                🔒 Saved on this device
              </span>

              {sessions.length > 0 && (
                <div>
                  {showClearConfirm ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-red-400 font-semibold">Clear all?</span>
                      <button
                        onClick={handleClearAllHistory}
                        className="px-2 py-0.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className={`px-2 py-0.5 rounded-lg border text-[10px] ${
                          isLight
                            ? "bg-white border-slate-200 text-slate-600"
                            : "bg-slate-800 border-slate-700 text-slate-300"
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear all chats</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
