"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MessageCircle,
  Users,
  Mic,
  MicOff,
  Send,
  Radio,
  User,
  ShieldAlert,
  Ban,
  MessageSquare,
  ArrowLeft,
  Volume2,
  Check,
  Clock,
  Sparkles,
  Info,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { sound } from "@/lib/sound";
import { useToast } from "./ToastContainer";
import { useScrollLock } from "@/lib/useScrollLock";
import { VoiceNotePlayer } from "./VoiceNotePlayer";
import {
  CommunityMember,
  CommunityMessage,
  getCommunityMembers,
  getPublicMessages,
  sendPublicMessage,
  getDirectMessages,
  sendDirectMessage,
  subscribeToCommunityMessages,
  subscribeToCommunityMembers,
  blockUser,
  reportAndBlockUser,
  isUserBlocked,
  formatOfflineTime,
} from "@/services/communityService";

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityModal: React.FC<CommunityModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { isLight } = useTheme();
  const { showToast } = useToast();

  // Active view: "chat" | "members" | "direct_chat"
  const [activeTab, setActiveTab] = useState<"chat" | "members">("chat");
  const [directChatMember, setDirectChatMember] = useState<CommunityMember | null>(null);

  // Community State
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [directMessages, setDirectMessages] = useState<CommunityMessage[]>([]);
  const [inputText, setInputText] = useState("");

  // Member Action Modal/Popover state
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load and subscribe to real-time members and messages
  useEffect(() => {
    if (!isOpen) return;

    loadData();

    // Subscribe to live public messages
    const unsubscribeMessages = subscribeToCommunityMessages((allMsgs) => {
      const visibleMsgs = allMsgs.filter((m) => !isUserBlocked(m.senderId));
      setMessages(visibleMsgs);
    });

    // Subscribe to live members presence
    const unsubscribeMembers = subscribeToCommunityMembers(
      user
        ? {
            uid: user.uid,
            displayName: user.displayName,
            handle: user.handle,
            photoURL: user.photoURL || undefined,
          }
        : undefined,
      (liveMembers) => {
        setMembers(liveMembers);
      }
    );

    return () => {
      unsubscribeMessages();
      unsubscribeMembers();
    };
  }, [isOpen, user]);

  const loadData = () => {
    const memList = getCommunityMembers(
      user
        ? {
            uid: user.uid,
            displayName: user.displayName,
            handle: user.handle,
            photoURL: user.photoURL || undefined,
          }
        : undefined
    );
    setMembers(memList);

    // Filter out messages from blocked users
    const allMsgs = getPublicMessages();
    const visibleMsgs = allMsgs.filter((m) => !isUserBlocked(m.senderId));
    setMessages(visibleMsgs);

    if (directChatMember && user) {
      const dms = getDirectMessages(user.uid, directChatMember.id);
      setDirectMessages(dms);
    }
  };

  // Lock background body scroll when Community modal is open
  useScrollLock(isOpen);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, directMessages, activeTab, directChatMember]);

  // Handle Send Text Message
  const handleSendMessage = () => {
    if (!inputText.trim() || !user) return;

    sound.playPop(580);

    if (directChatMember) {
      // Direct Message
      const newDm = sendDirectMessage({
        senderId: user.uid,
        senderName: user.displayName || "Anonymous",
        senderHandle: user.handle || "@anonymous",
        senderAvatar: user.photoURL || "/logo.png",
        text: inputText.trim(),
        recipientId: directChatMember.id,
      });
      setDirectMessages((prev) => [...prev, newDm]);
    } else {
      // Public Message
      const newMsg = sendPublicMessage({
        senderId: user.uid,
        senderName: user.displayName || "Anonymous",
        senderHandle: user.handle || "@anonymous",
        senderAvatar: user.photoURL || "/logo.png",
        text: inputText.trim(),
      });
      setMessages((prev) => [...prev, newMsg]);
    }

    setInputText("");
  };

  // Handle Recording Voice Notes
  const startRecording = async () => {
    sound.playPop(420);
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordDuration(0);

        recordTimerRef.current = setInterval(() => {
          setRecordDuration((prev) => prev + 1);
        }, 1000);
      } else {
        // Fallback simulation if getUserMedia is not supported
        simulateRecording();
      }
    } catch (err) {
      console.warn("Microphone access denied or error:", err);
      simulateRecording();
    }
  };

  const simulateRecording = () => {
    setIsRecording(true);
    setRecordDuration(0);
    recordTimerRef.current = setInterval(() => {
      setRecordDuration((prev) => prev + 1);
    }, 1000);
    showToast("Recording simulated voice note 🎙️", "info");
  };

  const cancelRecording = () => {
    sound.playPop(300);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    setIsRecording(false);
    setRecordDuration(0);
  };

  const sendVoiceNote = async () => {
    sound.playPop(640);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);

    const finalDuration = Math.max(1, recordDuration);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          dispatchVoiceMessage(base64Audio, finalDuration);
        };
        mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current.stop();
    } else {
      // Send simulated audio note
      dispatchVoiceMessage("SIMULATED_VOICE_NOTE", finalDuration);
    }

    setIsRecording(false);
    setRecordDuration(0);
  };

  const dispatchVoiceMessage = (audioUrl: string, duration: number) => {
    if (!user) return;

    if (directChatMember) {
      const newDm = sendDirectMessage({
        senderId: user.uid,
        senderName: user.displayName || "Anonymous",
        senderHandle: user.handle || "@anonymous",
        senderAvatar: user.photoURL || "/logo.png",
        voiceUrl: audioUrl,
        voiceDuration: duration,
        recipientId: directChatMember.id,
      });
      setDirectMessages((prev) => [...prev, newDm]);
      showToast("Voice note sent to " + directChatMember.displayName + " 🎙️", "success");
    } else {
      const newMsg = sendPublicMessage({
        senderId: user.uid,
        senderName: user.displayName || "Anonymous",
        senderHandle: user.handle || "@anonymous",
        senderAvatar: user.photoURL || "/logo.png",
        voiceUrl: audioUrl,
        voiceDuration: duration,
      });
      setMessages((prev) => [...prev, newMsg]);
      showToast("Voice note shared with Community! 🎙️", "success");
    }
  };

  // Member Actions: Personal Chat, Block, Block & Report
  const handleOpenPersonalChat = (member: CommunityMember) => {
    sound.playPop(480);
    setSelectedMember(null);
    setDirectChatMember(member);
    if (user) {
      const dms = getDirectMessages(user.uid, member.id);
      setDirectMessages(dms);
    }
  };

  const handleBlockMember = (member: CommunityMember) => {
    sound.playPop(350);
    blockUser(member.id);
    setSelectedMember(null);
    if (directChatMember?.id === member.id) {
      setDirectChatMember(null);
    }
    loadData();
    showToast(`Blocked @${member.handle.replace("@", "")}. Their messages are now hidden.`, "info");
  };

  const handleBlockAndReportMember = (member: CommunityMember) => {
    sound.playPop(320);
    reportAndBlockUser(member.id, "User reported from community members list");
    setSelectedMember(null);
    if (directChatMember?.id === member.id) {
      setDirectChatMember(null);
    }
    loadData();
    showToast(
      `Reported and blocked @${member.handle.replace("@", "")}. Thank you for keeping Thinksy safe.`,
      "success"
    );
  };

  if (!isOpen) return null;

  const onlineMembersCount = members.filter((m) => m.isOnline).length;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md overscroll-contain"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-lg h-[92vh] max-h-[720px] rounded-3xl shadow-2xl border flex flex-col overflow-hidden ${
            isLight ? "bg-white border-slate-200 text-slate-900" : "bg-[#0f0c22] border-slate-800 text-white"
          }`}
        >
          {/* 1. TOP HEADER */}
          <div
            className={`px-4 sm:px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
              isLight ? "border-slate-100 bg-slate-50/80" : "border-slate-800/80 bg-slate-900/50"
            }`}
          >
            <div className="flex items-center gap-3">
              {directChatMember ? (
                <button
                  onClick={() => {
                    sound.playPop(400);
                    setDirectChatMember(null);
                  }}
                  className={`p-2 rounded-2xl border transition active:scale-95 ${
                    isLight
                      ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                      : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
                  }`}
                  title="Back to Community"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <div className="w-10 h-10 rounded-2xl p-0.5 ring-2 ring-indigo-500/30 overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
              )}

              <div>
                {directChatMember ? (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black truncate max-w-[180px] sm:max-w-[220px]">
                        {directChatMember.displayName}
                      </h3>
                      {directChatMember.isOnline ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Offline {formatOfflineTime(directChatMember.lastSeen)}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-indigo-400">
                      {directChatMember.handle} • Personal Chat
                    </span>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
                      <span>Thinksy Community</span>
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {onlineMembersCount} Online
                      </span>
                    </h3>
                    <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Random chat & voice notes with all users
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {directChatMember && (
                <button
                  onClick={() => setSelectedMember(directChatMember)}
                  className={`p-2 rounded-2xl border transition ${
                    isLight
                      ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                      : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                  }`}
                  title="Member options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => {
                  sound.playPop(380);
                  onClose();
                }}
                className={`p-2 rounded-2xl border transition active:scale-95 ${
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
                }`}
                title="Close Community"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. SUB-TABS (Only shown in global room, not inside active 1-on-1 DM) */}
          {!directChatMember && (
            <div
              className={`px-4 py-2 border-b flex items-center gap-2 shrink-0 ${
                isLight ? "border-slate-100 bg-slate-50/50" : "border-slate-800/50 bg-slate-900/40"
              }`}
            >
              <button
                onClick={() => {
                  sound.playPop(420);
                  setActiveTab("chat");
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  activeTab === "chat"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                    : isLight
                    ? "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    : "bg-slate-800/60 text-slate-400 border border-slate-700/60 hover:bg-slate-800"
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Public Chat</span>
                <span className="text-[10px] opacity-75">({messages.length})</span>
              </button>

              <button
                onClick={() => {
                  sound.playPop(420);
                  setActiveTab("members");
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  activeTab === "members"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                    : isLight
                    ? "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    : "bg-slate-800/60 text-slate-400 border border-slate-700/60 hover:bg-slate-800"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Members</span>
                <span className="text-[10px] opacity-75">({members.length})</span>
              </button>
            </div>
          )}

          {/* 3. MAIN BODY CONTAINER */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* VIEW A: MEMBERS LIST */}
            {activeTab === "members" && !directChatMember ? (
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 overscroll-contain">
                <div
                  className={`p-3 rounded-2xl text-xs border flex items-center gap-2.5 ${
                    isLight ? "bg-amber-500/10 border-amber-500/20 text-amber-900" : "bg-amber-500/10 border-amber-500/20 text-amber-300"
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    Tap any member to start a <strong>Personal Chat</strong>, <strong>Block</strong>, or <strong>Report</strong> them.
                  </span>
                </div>

                {members.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-sm">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-sm">No members in room yet</p>
                    <p className={`text-xs mt-1 max-w-[240px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      When other creators join and drop thoughts or chat, they will appear here!
                    </p>
                  </div>
                ) : (
                  members.map((member) => {
                    const isSelf = member.id === user?.uid;
                  return (
                    <div
                      key={member.id}
                      onClick={() => !isSelf && setSelectedMember(member)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isSelf
                          ? isLight
                            ? "bg-indigo-50/50 border-indigo-200/60"
                            : "bg-indigo-950/20 border-indigo-800/40"
                          : isLight
                          ? "bg-slate-50 hover:bg-indigo-50/40 border-slate-200 cursor-pointer hover:border-indigo-300 active:scale-[0.99]"
                          : "bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/80 cursor-pointer hover:border-indigo-600/50 active:scale-[0.99]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Member Avatar with Signal Dot */}
                        <div className="relative shrink-0">
                          <img
                            src={member.avatar}
                            alt={member.displayName}
                            className="w-11 h-11 rounded-full object-cover border border-slate-300 dark:border-slate-700 shadow-sm"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/logo.png";
                            }}
                          />
                          {/* Green signal if online, Red signal if offline */}
                          <span
                            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                              member.isOnline
                                ? "bg-emerald-500 ring-emerald-500/30"
                                : "bg-rose-500 ring-rose-500/30"
                            }`}
                          />
                        </div>

                        {/* Name, Handle, Bio */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs sm:text-sm truncate">
                              {member.displayName}
                            </span>
                            {isSelf && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-500 text-white">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-indigo-400 block truncate">
                            {member.handle}
                          </span>
                          {member.bio && (
                            <p
                              className={`text-[11px] truncate mt-0.5 ${
                                isLight ? "text-slate-500" : "text-slate-400"
                              }`}
                            >
                              {member.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Online / Offline Status Signal & Time */}
                      <div className="shrink-0 text-right">
                        {member.isOnline ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/25">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Online</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/25">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              <span>Offline</span>
                            </div>
                            <span
                              className={`text-[10px] font-medium mt-0.5 ${
                                isLight ? "text-slate-500" : "text-slate-400"
                              }`}
                            >
                              {formatOfflineTime(member.lastSeen)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }))}
              </div>
            ) : (
              /* VIEW B: CHAT STREAM (Public Chat or 1-on-1 Direct Chat) */
              <div className="flex-1 flex flex-col min-h-0">
                {/* Scrollable Chat Area */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 overscroll-contain">
                  {/* Notice Pill */}
                  <div className="flex justify-center">
                    <span
                      className={`text-[11px] px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                        isLight
                          ? "bg-slate-100 border-slate-200 text-slate-600"
                          : "bg-slate-900 border-slate-800 text-slate-400"
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      {directChatMember
                        ? `Direct end-to-end conversation with ${directChatMember.displayName}`
                        : "Welcome to Community Chat! Share thoughts, chat randomly, or send voice notes."}
                    </span>
                  </div>

                  {(directChatMember ? directMessages : messages).length === 0 && (
                    <div className="py-12 text-center space-y-2 text-slate-400">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-xs sm:text-sm text-slate-300">
                        {directChatMember
                          ? `No messages with ${directChatMember.displayName} yet.`
                          : "No community messages yet."}
                      </p>
                      <p className="text-[11px] opacity-75 max-w-xs mx-auto">
                        Send a friendly message or hold the mic button to drop a quick voice note!
                      </p>
                    </div>
                  )}

                  {(directChatMember ? directMessages : messages).map((msg) => {
                    const isSelf = msg.senderId === user?.uid;
                    const formatTime = (ts: number) => {
                      const d = new Date(ts);
                      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    };

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 ${isSelf ? "justify-end" : "justify-start"}`}
                      >
                        {!isSelf && (
                          <img
                            src={msg.senderAvatar}
                            alt={msg.senderName}
                            onClick={() => {
                              const found = members.find((m) => m.id === msg.senderId);
                              if (found) setSelectedMember(found);
                            }}
                            className="w-8 h-8 rounded-full object-cover shrink-0 mt-1 cursor-pointer border border-slate-200 dark:border-slate-800 hover:ring-2 hover:ring-indigo-500 transition"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/logo.png";
                            }}
                            title={`Tap to interact with ${msg.senderName}`}
                          />
                        )}

                        <div
                          className={`max-w-[80%] sm:max-w-[75%] flex flex-col ${
                            isSelf ? "items-end" : "items-start"
                          }`}
                        >
                          {!isSelf && (
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span
                                onClick={() => {
                                  const found = members.find((m) => m.id === msg.senderId);
                                  if (found) setSelectedMember(found);
                                }}
                                className="text-xs font-bold hover:underline cursor-pointer"
                              >
                                {msg.senderName}
                              </span>
                              <span className="text-[10px] font-mono text-indigo-400">
                                {msg.senderHandle}
                              </span>
                            </div>
                          )}

                          {/* Message Content: Voice Note or Text */}
                          {msg.voiceUrl ? (
                            <div className="flex flex-col gap-1">
                              <VoiceNotePlayer
                                audioUrl={msg.voiceUrl}
                                durationSec={msg.voiceDuration || 5}
                                isSelf={isSelf}
                              />
                              <span
                                className={`text-[9px] px-1 font-mono ${
                                  isLight ? "text-slate-400" : "text-slate-500"
                                }`}
                              >
                                🎙️ Voice Note • {formatTime(msg.createdAt)}
                              </span>
                            </div>
                          ) : (
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm break-words shadow-sm leading-relaxed ${
                                isSelf
                                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-none"
                                  : isLight
                                  ? "bg-slate-100 text-slate-900 border border-slate-200/70 rounded-bl-none"
                                  : "bg-slate-800/80 text-white border border-slate-700/60 rounded-bl-none"
                              }`}
                            >
                              <p>{msg.text}</p>
                              <div
                                className={`text-[9px] text-right mt-1 font-mono ${
                                  isSelf ? "text-white/70" : "text-slate-400"
                                }`}
                              >
                                {formatTime(msg.createdAt)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* 4. CHAT COMPOSER: Typing & Voice Notes */}
                <div
                  className={`p-3 border-t shrink-0 ${
                    isLight ? "border-slate-100 bg-slate-50/80" : "border-slate-800/80 bg-slate-900/60"
                  }`}
                >
                  {isRecording ? (
                    /* Active Voice Note Recording State */
                    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 animate-pulse">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-xs font-bold font-mono">
                          Recording Voice Note... 0:{recordDuration < 10 ? `0${recordDuration}` : recordDuration}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={cancelRecording}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={sendVoiceNote}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-sm transition active:scale-95"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Normal Input + Mic Bar */
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={
                          directChatMember
                            ? `Message ${directChatMember.displayName}...`
                            : "Message community or send a voice note..."
                        }
                        className={`flex-1 px-4 py-2.5 rounded-2xl text-xs sm:text-sm outline-none transition ${
                          isLight
                            ? "bg-white border border-slate-200 focus:border-indigo-600 text-slate-900"
                            : "bg-slate-900 border border-slate-800 focus:border-indigo-500 text-white"
                        }`}
                      />

                      {/* Voice Note Button */}
                      <button
                        type="button"
                        onClick={startRecording}
                        className={`p-2.5 rounded-2xl border transition active:scale-95 shrink-0 ${
                          isLight
                            ? "bg-white hover:bg-indigo-50 border-slate-200 text-indigo-600 hover:border-indigo-300"
                            : "bg-slate-900 hover:bg-indigo-950/40 border-slate-800 text-indigo-400 hover:border-indigo-600/50"
                        }`}
                        title="Record Voice Note"
                      >
                        <Mic className="w-4 h-4" />
                      </button>

                      {/* Send Text Button */}
                      <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 shrink-0 shadow-md shadow-indigo-600/20"
                        title="Send Message"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* 5. MEMBER PROFILE & ACTIONS POPUP (Personal Chat, Block, Block & Report) */}
        <AnimatePresence>
          {selectedMember && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl relative ${
                  isLight ? "bg-white border-slate-200 text-slate-900" : "bg-slate-950 border-slate-800 text-white"
                }`}
              >
                <button
                  onClick={() => setSelectedMember(null)}
                  className={`absolute top-4 right-4 p-1.5 rounded-full border transition ${
                    isLight
                      ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                      : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Member Preview Header */}
                <div className="flex flex-col items-center text-center mt-2 mb-5">
                  <div className="relative mb-3">
                    <img
                      src={selectedMember.avatar}
                      alt={selectedMember.displayName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-lg"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "/logo.png";
                      }}
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ring-2 ring-white dark:ring-slate-950 ${
                        selectedMember.isOnline
                          ? "bg-emerald-500 ring-emerald-500/30"
                          : "bg-rose-500 ring-rose-500/30"
                      }`}
                    />
                  </div>
                  <h4 className="font-black text-base">{selectedMember.displayName}</h4>
                  <span className="text-xs font-mono text-indigo-400">{selectedMember.handle}</span>

                  <div className="mt-2">
                    {selectedMember.isOnline ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Online Now
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/25">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Offline {formatOfflineTime(selectedMember.lastSeen)}
                      </span>
                    )}
                  </div>

                  {selectedMember.bio && (
                    <p
                      className={`text-xs mt-2.5 max-w-[240px] ${
                        isLight ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      {selectedMember.bio}
                    </p>
                  )}
                </div>

                {/* The 3 User-Requested Options: Personal Chat, Block, Block & Report */}
                <div className="space-y-2.5">
                  {/* OPTION 1: PERSONAL CHAT */}
                  <button
                    onClick={() => handleOpenPersonalChat(selectedMember)}
                    className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 hover:opacity-95 transition active:scale-[0.98]"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Personal Chat</span>
                  </button>

                  {/* OPTION 2: BLOCK */}
                  <button
                    onClick={() => handleBlockMember(selectedMember)}
                    className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border transition active:scale-[0.98] ${
                      isLight
                        ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                        : "bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-300"
                    }`}
                  >
                    <Ban className="w-4 h-4 text-amber-500" />
                    <span>Block User</span>
                  </button>

                  {/* OPTION 3: BLOCK & REPORT */}
                  <button
                    onClick={() => handleBlockAndReportMember(selectedMember)}
                    className="w-full py-2.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition active:scale-[0.98]"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>Block & Report</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};

/**
 * Floating Community Trigger Button placed at the bottom-left corner
 */
export const CommunityFloatingButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      onClick={() => {
        sound.playPop(520);
        onClick();
      }}
      className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-xl shadow-indigo-700/30 border border-indigo-400/40 hover:scale-105 active:scale-95 transition-all duration-200 pointer-events-auto"
      title="Open Community Chat & Members"
      aria-label="Open Community Chat & Members"
    >
      {/* Live Pulsing Dot */}
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
      </span>

      <Radio className="w-4 h-4 text-indigo-200 group-hover:rotate-12 transition-transform" />

      <span className="text-xs sm:text-sm font-black tracking-wide">Community</span>

      {/* Mic / Chat mini badge */}
      <span className="hidden sm:inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-mono font-medium">
        Live
      </span>
    </button>
  );
};
