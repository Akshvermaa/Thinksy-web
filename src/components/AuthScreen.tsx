"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  User,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Sunset,
  MessageSquareQuote,
  CheckCircle2,
  Video,
  Flame,
  Heart,
  Play,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { sound } from "@/lib/sound";
import { useToast } from "./ToastContainer";
import { validateEmailRealitySync, verifyEmailReality, EmailValidationResult } from "@/lib/emailVerifier";

import confetti from "canvas-confetti";

const FEATURED_THOUGHTS = [
  {
    author: "@exam_survivor",
    avatar: "🎓",
    tag: "College Life",
    text: "Bhai kal exam hai aur tu Instagram chala raha hai 💀",
    stats: { likes: "4.8k", reactions: "💀 1.9k" },
  },
  {
    author: "@panic_master",
    avatar: "👀",
    tag: "Family",
    text: "Mummy ke saamne phone chala raha tha aur notification mein 'bro ❤️' aa gaya.",
    stats: { likes: "6.2k", reactions: "😭 3.1k" },
    hasReel: true,
  },
  {
    author: "@night_owl",
    avatar: "🦉",
    tag: "Night Thoughts",
    text: "3 AM motivation to fix my entire life hits completely different.",
    stats: { likes: "3.7k", reactions: "🔥 2.4k" },
  },
];

const PRESET_CREATORS = [
  { handle: "@exam_survivor", name: "Exam Survivor", emoji: "🎓" },
  { handle: "@night_owl", name: "Night Owl", emoji: "🦉" },
  { handle: "@chai_lover", name: "Chai Lover", emoji: "☕" },
  { handle: "@meme_artisan", name: "Meme Artisan", emoji: "🔥" },
];

export const AuthScreen: React.FC = () => {
  const { login, signup, createFirebaseAuthAccount, markEmailVerified, loginWithGoogle, quickLogin, savedAccounts } = useAuth();
  const { theme, cycleTheme, isLight } = useTheme();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"signup" | "login">("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginEmailStatus, setLoginEmailStatus] = useState<EmailValidationResult | null>(null);

  const [signupHandle, setSignupHandle] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [emailStatus, setEmailStatus] = useState<EmailValidationResult | null>(null);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  // OTP Verification state
  const [authStep, setAuthStep] = useState<"form" | "otp">("form");
  const [otpEmail, setOtpEmail] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string>("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpResendTimer, setOtpResendTimer] = useState<number>(60);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<{ isLiveDelivered: boolean; message: string } | null>(null);
  const otpInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Active showcase slide
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % FEATURED_THOUGHTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Countdown timer for OTP Resend
  useEffect(() => {
    if (authStep !== "otp" || otpResendTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [authStep, otpResendTimer]);

  // Real-time email validation
  const handleEmailChange = (val: string) => {
    setSignupEmail(val);
    if (!val.trim()) {
      setEmailStatus(null);
      return;
    }
    const result = validateEmailRealitySync(val);
    setEmailStatus(result);
  };

  const handleLoginIdentifierChange = (val: string) => {
    setLoginIdentifier(val);
    if (val.includes("@") && !val.startsWith("@") && val.includes(".")) {
      const result = validateEmailRealitySync(val);
      setLoginEmailStatus(result);
    } else {
      setLoginEmailStatus(null);
    }
  };

  const handleFastGmailAppend = () => {
    sound.playPop(520);
    let base = signupEmail.trim();
    if (base.includes("@")) {
      base = base.split("@")[0];
    }
    const full = `${base || "creator"}@gmail.com`;
    setSignupEmail(full);
    const result = validateEmailRealitySync(full);
    setEmailStatus(result);
  };

  const handlePickCreator = (preset: typeof PRESET_CREATORS[0]) => {
    sound.playPop(480);
    setSignupHandle(preset.handle);
    if (!signupEmail) {
      const handleClean = preset.handle.replace("@", "");
      setSignupEmail(`${handleClean}@gmail.com`);
      setEmailStatus(validateEmailRealitySync(`${handleClean}@gmail.com`));
    }
  };

  // Trigger sending OTP to email (Requirements 2, 4, 5, 7, 11)
  const sendEmailOtp = async (emailToSend: string, uid?: string): Promise<boolean> => {
    setIsSendingOtp(true);
    setOtpError(null);
    const targetUserId = uid || pendingUserId || emailToSend;
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToSend, userId: targetUserId }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        sound.playPop(260);
        const errMsg = data.reason || "Failed to send code.";
        setOtpError(errMsg);
        showToast(`❌ ${errMsg}`, "error");
        return false;
      }

      setOtpEmail(emailToSend);
      if (uid) setPendingUserId(uid);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpResendTimer(data.cooldownSeconds || 15);
      setDeliveryInfo({
        isLiveDelivered: Boolean(data.delivered ?? data.isLiveDelivered),
        message: data.message || "",
      });
      setAuthStep("otp");
      sound.playPop(520);
      if (data.isExisting) {
        showToast(`📬 Code already sent! Please check your email inbox.`, "info");
      } else {
        showToast(`📬 Verification code sent to ${emailToSend}! Please check your email.`, "success");
      }
      return true;
    } catch (err: any) {
      showToast("Network error sending verification code.", "error");
      return false;
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupHandle.trim()) {
      showToast("Please pick or type a creator handle.", "info");
      return;
    }

    const cleanHandle = signupHandle.trim().replace(/^@/, "").toLowerCase();
    const existingHandle = savedAccounts.find(
      (a) => a.handle.replace(/^@/, "").toLowerCase() === cleanHandle
    );
    if (existingHandle) {
      sound.playPop(260);
      showToast("This creator handle is already taken. Please pick another one or log in.", "info");
      return;
    }

    const emailToVerify = signupEmail.trim();
    if (!emailToVerify) {
      sound.playPop(260);
      showToast("Please enter your email to receive your 6-digit access code.", "info");
      return;
    }

    // Check if email already registered in local accounts
    const existingEmail = savedAccounts.find(
      (a) => a.email && a.email.toLowerCase() === emailToVerify.toLowerCase()
    );
    if (existingEmail) {
      sound.playPop(260);
      showToast("This email is already registered. Switched to Log In.", "info");
      setActiveTab("login");
      setLoginIdentifier(emailToVerify);
      return;
    }

    setIsVerifyingEmail(true);
    const realityCheck = await verifyEmailReality(emailToVerify);
    setIsVerifyingEmail(false);

    if (!realityCheck.isValid) {
      sound.playPop(260);
      setEmailStatus(realityCheck);
      showToast(`❌ ${realityCheck.reason}`, "error");
      return; // STOP LOGIN
    }

    // Create Firebase Authentication account & Send 6-digit code to real inbox
    setIsSubmitting(true);
    let createdUid = "";
    try {
      createdUid = await createFirebaseAuthAccount(
        emailToVerify,
        signupPassword,
        signupHandle.replace("@", "")
      );
      setPendingUserId(createdUid);

      // SEND OTP CODE TO PROVE EMAIL REALITY
      const sent = await sendEmailOtp(emailToVerify, createdUid);
      if (sent) return; // Wait for OTP verification
    } catch (err: any) {
      sound.playPop(260);
      const errMsg = err?.message || "Failed to create account.";
      showToast(errMsg, "error");
      if (errMsg.toLowerCase().includes("already registered")) {
        setActiveTab("login");
        setLoginIdentifier(emailToVerify);
      }
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginIdentifier.trim().toLowerCase();
    if (!cleanEmail) {
      showToast("Please enter your email address to log in.", "info");
      return;
    }

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      showToast("Please enter a valid email address to receive your 6-digit login code.", "info");
      return;
    }

    setIsVerifyingEmail(true);
    const realityCheck = await verifyEmailReality(cleanEmail);
    setIsVerifyingEmail(false);

    if (!realityCheck.isValid) {
      sound.playPop(260);
      setLoginEmailStatus(realityCheck);
      showToast(`❌ Cannot Log In: ${realityCheck.reason}`, "error");
      return; // STOP LOGIN
    }

    setIsSubmitting(true);
    try {
      // Send OTP to user's real email inbox
      const sent = await sendEmailOtp(cleanEmail, cleanEmail);
      if (sent) return;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpDigitChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    setOtpError(null);

    // Auto-advance focus to next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits entered
    if (digit && index === 5 && updated.every((d) => d.length === 1)) {
      submitOtpVerification(updated.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || "";
    }
    setOtpDigits(updated);
    if (pasted.length === 6) {
      submitOtpVerification(pasted);
    }
  };

  // Submit and verify OTP (Requirements 8, 9, 10)
  const submitOtpVerification = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpDigits.join("")).trim();
    if (code.length !== 6) {
      setOtpError("Please enter all 6 digits of the code.");
      return;
    }

    if (isSubmitting) return; // Prevent concurrent verify clicks
    setIsSubmitting(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: otpEmail,
          code,
          userId: pendingUserId || otpEmail,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        sound.playPop(240);
        const errorMsg = data.reason || "Invalid verification code.";
        setOtpError(errorMsg);
        showToast(`❌ ${errorMsg}`, "error");
        return;
      }

      // Success! Confetti & Chime (Requirement 8)
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}
      sound.playChime();

      // Mark email as verified in auth state
      markEmailVerified();

      // Complete authentication & enter main app
      if (activeTab === "signup") {
        await signup({
          displayName: signupHandle.replace("@", "") || otpEmail.split("@")[0],
          handle: signupHandle || `@${otpEmail.split("@")[0]}`,
          email: otpEmail,
          password: signupPassword,
          emailVerified: true,
        });
        showToast(`Email verified! Welcome ${signupHandle || otpEmail}! 🚀`, "success");
      } else {
        await login(otpEmail, loginPassword);
        showToast(`Email verified! Welcome back! 🎉`, "success");
      }
    } catch (err: any) {
      setOtpError("Failed to verify code. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      showToast("Signed in with Google! 🚀", "success");
    } catch (err: any) {
      showToast("Google sign-in cancelled.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestPass = async () => {
    setIsSubmitting(true);
    try {
      await quickLogin("@guest_explorer", "Guest Explorer");
      showToast("Entering as Guest Explorer ✨", "success");
    } finally {
      setIsSubmitting(false);
    }
  };

  const themeIcons = {
    cosmic: <Moon className="w-3.5 h-3.5 text-violet-400" />,
    light: <Sun className="w-3.5 h-3.5 text-amber-500" />,
    sunset: <Sunset className="w-3.5 h-3.5 text-rose-400" />,
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors duration-300 relative overflow-hidden ${
        isLight ? "bg-slate-50 text-slate-900" : "bg-[#0b081a] text-slate-100"
      }`}
    >
      {/* Background Glowing Ambient Lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-indigo-600/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-pink-600/20 blur-[130px] pointer-events-none" />
      <div className="absolute top-[35%] right-[25%] w-[35vw] h-[35vw] rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full p-0.5 shadow-lg shadow-amber-500/25 overflow-hidden ring-1.5 ring-amber-400/50 bg-black shrink-0">
            <img
              src="/logo.png"
              alt="Thinksy Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Thinksy
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Theme Switcher */}
        <button
          onClick={() => {
            sound.playPop(520);
            cycleTheme();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl transition active:scale-95 text-xs font-semibold ${
            isLight
              ? "bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-100"
              : "bg-slate-900/80 border border-slate-800 text-slate-300 shadow-sm hover:bg-slate-800"
          }`}
        >
          {themeIcons[theme]}
          <span className="capitalize font-mono text-[11px]">{theme}</span>
        </button>
      </header>

      {/* Main Split Screen Area: Left Visuals & Right Clean Card */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-5 py-2 sm:py-6 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          
          {/* LEFT COLUMN: Visual Reel & Relatable Thought Showcase (Desktop & Tablet) */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>The Community for Viral Creator Thoughts</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15]">
                Thoughts everyone relates to,{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                  turned into viral reels.
                </span>
              </h1>
            </div>

            {/* Visual Floating Cards Carousel */}
            <div className="relative h-44 sm:h-48 w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, y: 15, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.96 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className={`absolute inset-0 rounded-3xl p-5 border shadow-2xl flex flex-col justify-between backdrop-blur-xl ${
                    isLight
                      ? "bg-white/90 border-indigo-100 shadow-indigo-100 text-slate-900"
                      : "bg-slate-900/80 border-indigo-500/20 shadow-purple-950/30 text-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-sm shadow-md">
                        {FEATURED_THOUGHTS[activeSlide].avatar}
                      </div>
                      <div>
                        <p className="font-mono text-xs font-bold">{FEATURED_THOUGHTS[activeSlide].author}</p>
                        <p className="text-[10px] text-indigo-400 font-medium">{FEATURED_THOUGHTS[activeSlide].tag}</p>
                      </div>
                    </div>
                    {FEATURED_THOUGHTS[activeSlide].hasReel && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
                        <Play className="w-2.5 h-2.5 fill-pink-400" />
                        <span>Reel Attached</span>
                      </span>
                    )}
                  </div>

                  <p className="text-base sm:text-lg font-bold tracking-tight leading-snug">
                    "{FEATURED_THOUGHTS[activeSlide].text}"
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-inherit/40 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                        <span className="font-mono text-[11px]">{FEATURED_THOUGHTS[activeSlide].stats.likes}</span>
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {FEATURED_THOUGHTS[activeSlide].stats.reactions}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {FEATURED_THOUGHTS.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === activeSlide ? "w-6 bg-indigo-500" : "w-1.5 bg-slate-600/40"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Social Proof Avatars */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-2">
                {["🎓", "🦉", "☕", "🔥", "✨"].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-xs shadow"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <p className={`text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                <strong className="text-indigo-400 font-bold">10,000+</strong> creator thoughts & reels live
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Ultra-Clean, Non-Texty Auth Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div
              className={`rounded-[32px] p-6 sm:p-8 shadow-2xl border backdrop-blur-2xl transition ${
                isLight
                  ? "bg-white/95 border-slate-200 text-slate-900 shadow-indigo-100/70"
                  : "bg-slate-900/90 border-slate-800 text-white shadow-2xl shadow-indigo-950/40"
              }`}
            >
              {authStep === "otp" ? (
                /* OTP Verification Step (Requirement 6, 13) */
                <div className="space-y-4">
                  <div className="text-center pb-1">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-3">
                      <Mail className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight">Verify your email</h3>
                    <p className={`text-xs mt-1 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                      We sent a 6-digit verification code to your email.
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-1.5 font-mono text-xs font-semibold text-indigo-400">
                      <span className="truncate max-w-[220px]">{otpEmail}</span>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playPop(420);
                          setAuthStep("form");
                        }}
                        className="text-[11px] text-pink-400 hover:underline hover:text-pink-300 font-sans"
                      >
                        (Change email)
                      </button>
                    </div>
                  </div>

                  {/* Delivery Info Banner */}
                  <div
                    className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
                      isLight
                        ? "bg-indigo-50/80 border-indigo-200 text-indigo-950"
                        : "bg-indigo-950/40 border-indigo-800/40 text-indigo-200"
                    }`}
                  >
                    <Mail className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-xs text-indigo-600 dark:text-indigo-300">
                        📬 Verification Code Sent to Email
                      </p>
                      <p className={`text-[11px] leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                        A secure 6-digit code has been delivered to <strong>{otpEmail}</strong>. Please check your inbox (and Spam or Promotions folder) and enter it below.
                      </p>
                    </div>
                  </div>

                  {/* 6-Digit Segmented Code Inputs [ _ _ _ _ _ _ ] */}
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={idx === 0 ? handleOtpPaste : undefined}
                        autoFocus={idx === 0}
                        className={`w-10 sm:w-12 h-12 sm:h-14 rounded-2xl text-center font-mono text-lg sm:text-xl font-black outline-none transition ${
                          otpError
                            ? "border-2 border-rose-500 bg-rose-500/10 text-rose-500"
                            : digit
                            ? isLight
                              ? "border-2 border-indigo-600 bg-indigo-50/50 text-indigo-900"
                              : "border-2 border-indigo-500 bg-indigo-950/30 text-white"
                            : isLight
                            ? "border border-slate-300 bg-slate-50 focus:border-indigo-600 focus:bg-white text-slate-900"
                            : "border border-slate-800 bg-slate-950 focus:border-indigo-500 text-white"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Error Notification */}
                  {otpError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                      <span>❌</span>
                      <span>{otpError}</span>
                    </div>
                  )}

                  {/* [Verify] Action Button */}
                  <button
                    type="button"
                    onClick={() => submitOtpVerification()}
                    disabled={isSubmitting || otpDigits.some((d) => !d)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition active:scale-98 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <span>{isSubmitting ? "Verifying..." : "Verify & Enter"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* [Resend Code] and Change Email Options */}
                  <div className="flex items-center justify-between text-xs pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playPop(420);
                        setAuthStep("form");
                      }}
                      className={`transition text-xs ${isLight ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-white"}`}
                    >
                      ← Change email
                    </button>

                    {otpResendTimer > 0 ? (
                      <span className="font-mono text-slate-500 text-[11px]">
                        Resend Code in {otpResendTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => sendEmailOtp(otpEmail)}
                        disabled={isSendingOtp}
                        className="font-bold text-indigo-400 hover:text-pink-400 transition"
                      >
                        {isSendingOtp ? "Sending..." : "Resend Code"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Standard Auth Form */
                <>
                  {/* Dedicated Header for Email Gate */}
                  <div className="text-center mb-5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold mb-2">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Login Required</span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Enter Thinksy</h2>
                    <p className={`text-xs mt-1 max-w-xs mx-auto ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                      Enter your email to receive a 6-digit access code. Only verified members can access the web app.
                    </p>
                  </div>

                  {/* Clean Segmented Tab Switcher */}
                  <div
                    className={`grid grid-cols-2 p-1 rounded-2xl mb-5 text-xs font-bold transition ${
                      isLight ? "bg-slate-100 border border-slate-200" : "bg-slate-950 border border-slate-800"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        sound.playPop(440);
                        setActiveTab("signup");
                      }}
                      className={`py-2.5 rounded-xl transition text-center flex items-center justify-center gap-1.5 ${
                        activeTab === "signup"
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : isLight
                          ? "text-slate-600 hover:text-slate-900"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Create Account</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        sound.playPop(480);
                        setActiveTab("login");
                      }}
                      className={`py-2.5 rounded-xl transition text-center flex items-center justify-center gap-1.5 ${
                        activeTab === "login"
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : isLight
                          ? "text-slate-600 hover:text-slate-900"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Log In</span>
                    </button>
                  </div>

                  {/* 1-Tap Google Button */}
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={isSubmitting}
                    className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl text-xs font-bold border transition shadow-sm active:scale-98 ${
                      isLight
                        ? "bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-slate-200"
                        : "bg-slate-950/70 hover:bg-slate-800 border-slate-800 text-slate-100"
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="flex items-center gap-3 my-4">
                    <div className={`flex-1 h-px ${isLight ? "bg-slate-200" : "bg-slate-800"}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                      or with creator handle
                    </span>
                    <div className={`flex-1 h-px ${isLight ? "bg-slate-200" : "bg-slate-800"}`} />
                  </div>

                  {/* TAB: SIGN UP */}
                  {activeTab === "signup" && (
                    <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                      {/* Dedicated Gmail Box */}
                      <div>
                        <div className="relative flex items-center">
                          <Mail
                            className={`absolute left-3.5 w-4 h-4 pointer-events-none transition-colors ${
                              emailStatus
                                ? emailStatus.isValid
                                  ? "text-emerald-500"
                                  : "text-rose-500"
                                : "text-slate-400"
                            }`}
                          />
                          <input
                            type="email"
                            value={signupEmail}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            placeholder="yourname@gmail.com"
                            className={`w-full pl-10 pr-24 py-3 rounded-2xl text-xs sm:text-sm font-mono outline-none transition ${
                              emailStatus
                                ? emailStatus.isValid
                                  ? isLight
                                    ? "bg-emerald-50/50 border-2 border-emerald-500 text-slate-900"
                                    : "bg-emerald-950/20 border-2 border-emerald-500/80 text-emerald-100"
                                  : isLight
                                  ? "bg-rose-50/50 border-2 border-rose-500 text-slate-900"
                                  : "bg-rose-950/30 border-2 border-rose-500/80 text-rose-100"
                                : isLight
                                ? "bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                                : "bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={handleFastGmailAppend}
                            className={`absolute right-2 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition active:scale-95 ${
                              signupEmail.endsWith("@gmail.com")
                                ? "bg-emerald-600 text-white shadow-sm"
                                : isLight
                                ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                : "bg-indigo-900/60 text-indigo-300 hover:bg-indigo-800/80"
                            }`}
                          >
                            + @gmail.com
                          </button>
                        </div>

                        {/* Reality Check Alert */}
                        {emailStatus && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt-1.5 p-2 rounded-xl text-[11px] flex flex-col gap-1 border transition ${
                              emailStatus.isValid
                                ? isLight
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                  : "bg-emerald-950/40 border-emerald-800/40 text-emerald-200"
                                : isLight
                                ? "bg-rose-50 border-rose-200 text-rose-800"
                                : "bg-rose-950/50 border-rose-800/50 text-rose-200"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-semibold">
                              {emailStatus.isValid ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span>Real Email Verified ✓</span>
                                </>
                              ) : (
                                <>
                                  <span className="shrink-0">❌</span>
                                  <span>{emailStatus.reason}</span>
                                </>
                              )}
                            </div>

                            {emailStatus.suggestion && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSignupEmail(emailStatus.suggestion!);
                                  setEmailStatus(validateEmailRealitySync(emailStatus.suggestion!));
                                }}
                                className="self-start mt-0.5 px-2 py-0.5 rounded-lg bg-indigo-600 text-white font-mono text-[10px] font-bold"
                              >
                                Fix to {emailStatus.suggestion}
                              </button>
                            )}
                          </motion.div>
                        )}
                      </div>

                      {/* Creator Handle Input */}
                      <div>
                        <div className="relative flex items-center">
                          <span className="absolute left-3.5 text-xs font-mono font-bold text-indigo-500">@</span>
                          <input
                            type="text"
                            value={signupHandle.replace(/^@/, "")}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
                              setSignupHandle(val ? `@${val}` : "");
                            }}
                            placeholder="your_handle"
                            className={`w-full pl-8 pr-4 py-3 rounded-2xl text-xs sm:text-sm font-mono outline-none transition ${
                              isLight
                                ? "bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                                : "bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
                            }`}
                          />
                        </div>

                        {/* Clean Avatar Persona Chips */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {PRESET_CREATORS.map((p) => (
                            <button
                              key={p.handle}
                              type="button"
                              onClick={() => handlePickCreator(p)}
                              className={`px-2 py-1 rounded-xl text-[10px] font-mono font-medium flex items-center gap-1 transition active:scale-95 border ${
                                signupHandle === p.handle
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                  : isLight
                                  ? "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                              }`}
                            >
                              <span>{p.emoji}</span>
                              <span>{p.handle}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Passcode (Clean single-line) */}
                      <div className="relative flex items-center">
                        <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Passcode / Password (optional)"
                          className={`w-full pl-10 pr-10 py-3 rounded-2xl text-xs sm:text-sm outline-none transition ${
                            isLight
                              ? "bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                              : "bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Main Action CTA */}
                      <button
                        type="submit"
                        disabled={isSubmitting || isSendingOtp || !signupHandle.trim() || Boolean(emailStatus && !emailStatus.isValid)}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition active:scale-98 disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <span>
                          {isSendingOtp
                            ? "Sending Verification Code..."
                            : isSubmitting
                            ? "Creating Account..."
                            : signupEmail.trim()
                            ? "Verify Email & Enter"
                            : "Enter Thinksy"}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  {/* TAB: LOG IN */}
                  {/* TAB: LOG IN */}
                  {activeTab === "login" && (
                    <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                      <div className="relative flex items-center">
                        <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="email"
                          value={loginIdentifier}
                          onChange={(e) => handleLoginIdentifierChange(e.target.value)}
                          placeholder="yourname@gmail.com"
                          className={`w-full pl-10 pr-4 py-3 rounded-2xl text-xs sm:text-sm font-mono outline-none transition ${
                            loginEmailStatus
                              ? loginEmailStatus.isValid
                                ? isLight
                                  ? "bg-emerald-50/50 border-2 border-emerald-500 text-slate-900"
                                  : "bg-emerald-950/20 border-2 border-emerald-500/80 text-emerald-100"
                                : isLight
                                ? "bg-rose-50/50 border-2 border-rose-500 text-slate-900"
                                : "bg-rose-950/30 border-2 border-rose-500/80 text-rose-100"
                              : isLight
                              ? "bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                              : "bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
                          }`}
                        />
                      </div>

                      {loginEmailStatus && (
                        <div
                          className={`p-2 rounded-xl text-xs flex flex-col gap-1 border transition ${
                            loginEmailStatus.isValid
                              ? isLight
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-emerald-950/40 border-emerald-800/40 text-emerald-200"
                              : isLight
                              ? "bg-rose-50 border-rose-200 text-rose-800"
                              : "bg-rose-950/50 border-rose-800/50 text-rose-200"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-semibold">
                            {loginEmailStatus.isValid ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>Real Email Verified ✓</span>
                              </>
                            ) : (
                              <>
                                <span className="shrink-0">❌</span>
                                <span>{loginEmailStatus.reason}</span>
                              </>
                            )}
                          </div>
                          {loginEmailStatus.suggestion && (
                            <button
                              type="button"
                              onClick={() => {
                                setLoginIdentifier(loginEmailStatus.suggestion!);
                                setLoginEmailStatus(validateEmailRealitySync(loginEmailStatus.suggestion!));
                              }}
                              className="self-start mt-0.5 px-2 py-0.5 rounded-lg bg-indigo-600 text-white font-mono text-[10px] font-bold"
                            >
                              Fix to {loginEmailStatus.suggestion}
                            </button>
                          )}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting || isSendingOtp || !loginIdentifier.trim()}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition active:scale-98 disabled:opacity-40 disabled:pointer-events-none"
                      >
                        <span>
                          {isSendingOtp
                            ? "Sending Verification Code..."
                            : isSubmitting
                            ? "Checking..."
                            : "Send 6-Digit Code & Log In"}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  {/* Mandatory Email Access Notice */}
                  <div className="mt-5 pt-4 border-t border-inherit/40 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Email verification required to access Thinksy. No bots or burner accounts.</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Clean, Non-intrusive Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Thinksy Community • Your thoughts & reels stay safe</span>
      </footer>
    </div>
  );
};
