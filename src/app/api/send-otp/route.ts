import { NextRequest, NextResponse } from "next/server";
import { validateEmailRealitySync } from "@/lib/emailVerifier";
import { createOrRefreshOtp } from "@/lib/serverOtpStore";
import { sendOtpEmail } from "@/lib/emailSender";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const userId = (body.userId || email).trim();

    if (!email) {
      return NextResponse.json(
        { success: false, reason: "Email is required." },
        { status: 400 }
      );
    }

    // 1. Validate email syntax and reality rules
    const realityCheck = validateEmailRealitySync(email);
    if (!realityCheck.isValid) {
      return NextResponse.json(
        {
          success: false,
          reason: realityCheck.reason || "Invalid email address.",
          suggestion: realityCheck.suggestion,
        },
        { status: 400 }
      );
    }

    // 2. Generate secure 6-digit OTP & store only its hash in Firestore (Requirements 2, 3, 4, 7, 11)
    const otpResult = await createOrRefreshOtp(userId, email);
    if (!otpResult.success || !otpResult.data) {
      return NextResponse.json(
        {
          success: false,
          reason: otpResult.error || "Failed to issue verification code.",
        },
        { status: 429 } // Rate limit / cooldown
      );
    }

    const { otp, expiresAt, cooldownSeconds } = otpResult.data;

    // 3. Send the 6-digit OTP to the user's email inbox
    const emailResult = await sendOtpEmail({
      to: email,
      code: otp,
    });

    if (!emailResult.delivered) {
      return NextResponse.json(
        {
          success: false,
          reason: emailResult.error || "Failed to dispatch verification email. Please check your email address and try again.",
        },
        { status: 500 }
      );
    }

    // 4. Return success metadata without exposing the OTP to the client
    return NextResponse.json({
      success: true,
      email,
      expiresAt,
      cooldownSeconds,
      delivered: true,
      provider: emailResult.provider,
      message: `A 6-digit verification code has been sent to ${email}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, reason: error.message || "Failed to process verification code." },
      { status: 500 }
    );
  }
}
