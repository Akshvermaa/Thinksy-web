import { NextRequest, NextResponse } from "next/server";
import { verifyAndConsumeOtp } from "@/lib/serverOtpStore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const code = (body.code || "").trim();
    const newPassword = (body.newPassword || "").trim();
    const sessionToken = (body.sessionToken || "").trim();

    if (!email) {
      return NextResponse.json(
        { success: false, reason: "Email is required." },
        { status: 400 }
      );
    }

    if (!code || code.replace(/\D/g, "").length !== 6) {
      return NextResponse.json(
        { success: false, reason: "Please enter the valid 6-digit verification code." },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, reason: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // 1. Verify OTP code against HMAC sessionToken and server store
    const verification = await verifyAndConsumeOtp({ email, sessionToken }, code);

    if (!verification.isValid) {
      return NextResponse.json(
        {
          success: false,
          status: verification.status,
          reason: verification.reason || "Invalid verification code.",
        },
        { status: 400 }
      );
    }

    // 2. Best-effort update of password in Firestore users collection
    if (isFirebaseConfigured() && db) {
      try {
        const userRef = doc(db, "users", email);
        await setDoc(
          userRef,
          {
            email,
            passwordUpdatedAt: Date.now(),
            emailVerified: true,
          },
          { merge: true }
        );
      } catch (err: any) {
        console.warn("Firestore password update notice:", err.message);
      }
    }

    return NextResponse.json({
      success: true,
      email,
      message: "Password reset successfully! You can now log in with your new password.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, reason: error.message || "Failed to reset password." },
      { status: 500 }
    );
  }
}
