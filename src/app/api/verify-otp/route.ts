import { NextRequest, NextResponse } from "next/server";
import { verifyAndConsumeOtp } from "@/lib/serverOtpStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const userId = (body.userId || email).trim();
    const code = (body.code || "").trim();

    if (!code) {
      return NextResponse.json(
        { success: false, reason: "Please enter the 6-digit verification code." },
        { status: 400 }
      );
    }

    if (code.replace(/\D/g, "").length !== 6) {
      return NextResponse.json(
        { success: false, reason: "Invalid verification code. Code must be exactly 6 digits." },
        { status: 400 }
      );
    }

    // Verify OTP against stored hash (checked against email and userId)
    const verification = await verifyAndConsumeOtp({ email, userId }, code);

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

    return NextResponse.json({
      success: true,
      email,
      userId,
      message: "Email verified successfully!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, reason: error.message || "Failed to verify code." },
      { status: 500 }
    );
  }
}
