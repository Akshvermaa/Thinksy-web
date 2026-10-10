"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db, isFirebaseConfigured } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { sound } from "./sound";
import { registerGenuineMember, unregisterGenuineMember } from "@/services/communityService";

/**
 * Saves and updates full user profile data in Cloud Firestore under 'users' collection
 */
async function syncUserToFirestore(profile: UserProfile, extra?: Record<string, any>) {
  if (!isFirebaseConfigured() || !db || !profile.uid) return;
  try {
    const userRef = doc(db, "users", profile.uid);
    await setDoc(
      userRef,
      {
        uid: profile.uid,
        displayName: profile.displayName,
        handle: profile.handle,
        email: profile.email || null,
        photoURL: profile.photoURL || null,
        vibe: profile.vibe || null,
        emailVerified: Boolean(profile.emailVerified),
        lastLoginAt: Date.now(),
        updatedAt: Date.now(),
        ...extra,
      },
      { merge: true }
    );
  } catch (err) {
    // Non-blocking warning if security rules need updating
    console.warn("Could not sync user profile to Firestore (check Firestore Rules):", err);
  }
}

export interface UserProfile {
  uid: string;
  displayName: string;
  handle: string;
  email?: string | null;
  photoURL?: string | null;
  vibe?: string | null;
  emailVerified?: boolean;
  isAnonymous?: boolean;
}

export interface SignupData {
  displayName: string;
  handle: string;
  email?: string;
  password?: string;
  vibe?: string;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  savedAccounts: UserProfile[];
  isLoginModalOpen: boolean;
  loginReason: string;
  openLoginModal: (reason?: string) => void;
  closeLoginModal: () => void;
  requireAuth: (action: () => void, reason?: string) => boolean;
  login: (identifier: string, password?: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  createFirebaseAuthAccount: (email: string, password?: string, displayName?: string) => Promise<string>;
  markEmailVerified: () => void;
  loginWithGoogle: () => Promise<void>;
  quickLogin: (handle: string, displayName?: string, vibe?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => void;
  switchAccount: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "thoughts_current_user_v2";
const SAVED_ACCOUNTS_KEY = "thoughts_saved_accounts_v2";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginReason, setLoginReason] = useState<string>("Sign in to unlock all community features");

  // Restore stored session and saved accounts on mount
  useEffect(() => {
    try {
      // Clear legacy test registries from local storage
      [
        "thinksy_genuine_members_registry_v1",
        "thinksy_genuine_members_registry_v2",
        "thinksy_genuine_members_registry_v3",
        "thinksy_genuine_members_registry_v4",
      ].forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch {}
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.uid && parsed.handle) {
          setUser(parsed);
          registerGenuineMember(parsed);
        }
      }

      const storedAccounts = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      if (storedAccounts) {
        const parsedAccs = JSON.parse(storedAccounts);
        if (Array.isArray(parsedAccs)) {
          setSavedAccounts(parsedAccs);
          // Never auto-register inactive saved accounts as online community members
        }
      }
    } catch (e) {
      console.warn("Failed to parse stored user profile", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProfileToAccountsList = (profile: UserProfile) => {
    try {
      const stored = localStorage.getItem(SAVED_ACCOUNTS_KEY);
      let list: UserProfile[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(list)) list = [];
      const filtered = list.filter((a) => a.handle.toLowerCase() !== profile.handle.toLowerCase());
      const updated = [profile, ...filtered].slice(0, 8);
      setSavedAccounts(updated);
      localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save account list", e);
    }
  };

  // Listen to Firebase Auth state if configured
  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) return;

    const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const rawHandle =
          fbUser.email?.split("@")[0] ||
          fbUser.displayName?.toLowerCase().replace(/\s+/g, "_") ||
          `creator_${fbUser.uid.slice(0, 5)}`;
        const handle = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;

        const profile: UserProfile = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || handle.replace("@", ""),
          handle,
          email: fbUser.email,
          photoURL: fbUser.photoURL,
          isAnonymous: fbUser.isAnonymous,
        };

        setUser(profile);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        saveProfileToAccountsList(profile);
        syncUserToFirestore(profile, { authProvider: fbUser.isAnonymous ? "anonymous" : "firebase_auth" });
      }
    });

    return () => unsubscribe();
  }, []);

  const openLoginModal = (reason?: string) => {
    if (reason) setLoginReason(reason);
    else setLoginReason("Sign in to unlock community features");
    sound.playPop(420);
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const requireAuth = (action: () => void, reason?: string): boolean => {
    if (user) {
      action();
      return true;
    }
    openLoginModal(reason);
    return false;
  };

  const login = async (identifier: string, _password?: string) => {
    const clean = identifier.trim();
    if (!clean) throw new Error("Please enter your creator handle or email");

    // Check if matched in saved accounts
    const existing = savedAccounts.find(
      (a) =>
        a.handle.toLowerCase() === clean.toLowerCase() ||
        (clean.startsWith("@") ? a.handle.toLowerCase() === clean.toLowerCase() : a.handle.toLowerCase() === `@${clean.toLowerCase()}`) ||
        (a.email && a.email.toLowerCase() === clean.toLowerCase())
    );

    let profile: UserProfile;
    if (existing) {
      profile = existing;
    } else {
      const handle = clean.includes("@") && !clean.includes(".")
        ? (clean.startsWith("@") ? clean : `@${clean}`)
        : clean.startsWith("@") ? clean : `@${clean.replace(/\s+/g, "_").toLowerCase()}`;

      profile = {
        uid: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        displayName: handle.replace("@", ""),
        handle,
        email: clean.includes("@") && clean.includes(".") ? clean : null,
      };
    }

    setUser(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    saveProfileToAccountsList(profile);
    syncUserToFirestore(profile, { lastLoginAt: Date.now() });
    sound.playChime();
    closeLoginModal();
  };

  const signup = async (data: SignupData) => {
    const rawHandle = data.handle.trim();
    if (!rawHandle) throw new Error("Please provide a creator handle");
    const handle = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle.replace(/\s+/g, "_").toLowerCase()}`;

    const profile: UserProfile = {
      uid: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      displayName: data.displayName.trim() || handle.replace("@", ""),
      handle,
      email: data.email?.trim() || null,
      vibe: data.vibe || null,
    };

    setUser(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    saveProfileToAccountsList(profile);
    syncUserToFirestore(profile, { createdAt: Date.now(), lastLoginAt: Date.now() });
    sound.playChime();
    closeLoginModal();
  };

  const loginWithGoogle = async () => {
    if (isFirebaseConfigured() && auth) {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        closeLoginModal();
        sound.playChime();
        return;
      } catch (err: any) {
        console.warn("Firebase Google Sign-In encountered error, falling back to quick sign-in:", err);
      }
    }

    // Fallback mock Google profile
    const mockHandle = `@google_creator`;
    const profile: UserProfile = {
      uid: `google_mock_${Date.now()}`,
      displayName: "Google Creator",
      handle: mockHandle,
      email: "creator@gmail.com",
    };
    setUser(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    saveProfileToAccountsList(profile);
    sound.playChime();
    closeLoginModal();
  };

  const quickLogin = async (handle: string, displayName?: string, vibe?: string) => {
    const cleanHandle = handle.trim();
    if (!cleanHandle) return;
    const formattedHandle = cleanHandle.startsWith("@") ? cleanHandle : `@${cleanHandle}`;

    const profile: UserProfile = {
      uid: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      displayName: displayName?.trim() || formattedHandle.replace("@", ""),
      handle: formattedHandle,
      vibe: vibe || null,
    };

    setUser(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    saveProfileToAccountsList(profile);
    sound.playChime();
    closeLoginModal();
  };

  const createFirebaseAuthAccount = async (
    email: string,
    password?: string,
    displayName?: string
  ): Promise<string> => {
    const cleanEmail = email.trim();
    const safePassword = password && password.length >= 6 ? password : `Pass_${Date.now()}!`;

    if (isFirebaseConfigured() && auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, safePassword);
        if (displayName && userCredential.user) {
          try {
            await updateProfile(userCredential.user, { displayName });
          } catch (e) {
            // non-fatal
          }
        }
        return userCredential.user.uid;
      } catch (err: any) {
        if (err?.code === "auth/email-already-in-use") {
          throw new Error("This email is already registered. Please switch to Log In.");
        }
        console.warn("Firebase createUserWithEmailAndPassword notice, using fallback UID:", err?.message || err);
      }
    }

    // Fallback deterministic/random user ID for development or mock Firebase environments
    return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  };

  const markEmailVerified = () => {
    if (!user) return;
    const updated: UserProfile = { ...user, emailVerified: true };
    setUser(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      saveProfileToAccountsList(updated);
      syncUserToFirestore(updated, { emailVerified: true, verifiedAt: Date.now() });
    } catch (e) {
      console.warn("Failed to persist verified state:", e);
    }
  };

  const logout = async () => {
    sound.playPop(350);
    if (user?.uid) {
      unregisterGenuineMember(user.uid);
    }
    if (isFirebaseConfigured() && auth) {
      try {
        await fbSignOut(auth);
      } catch (err) {
        console.warn("Firebase sign out failed:", err);
      }
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateUserProfile = (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated: UserProfile = { ...user, ...data };
    setUser(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      saveProfileToAccountsList(updated);
      syncUserToFirestore(updated, { updatedAt: Date.now() });
    } catch (e) {
      console.warn("Failed to update profile:", e);
    }
  };

  const switchAccount = (profile: UserProfile) => {
    sound.playChime();
    setUser(profile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      saveProfileToAccountsList(profile);
    } catch (e) {
      console.warn("Failed to switch account:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        savedAccounts,
        isLoginModalOpen,
        loginReason,
        openLoginModal,
        closeLoginModal,
        requireAuth,
        login,
        signup,
        createFirebaseAuthAccount,
        markEmailVerified,
        loginWithGoogle,
        quickLogin,
        logout,
        updateUserProfile,
        switchAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
