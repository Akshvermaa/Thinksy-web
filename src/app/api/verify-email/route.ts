import { NextRequest, NextResponse } from "next/server";
import { validateEmailRealitySync } from "@/lib/emailVerifier";
import dns from "dns";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email") || "";

  // 1. Synchronous structural, typo, and provider rules
  const syncCheck = validateEmailRealitySync(email);
  if (!syncCheck.isValid) {
    return NextResponse.json(syncCheck, { status: 400 });
  }

  const domain = email.trim().split("@")[1].toLowerCase();

  // 2. If it's a known major domain (gmail.com, yahoo.com, outlook.com, etc.), it exists
  const MAJOR_DOMAINS = ["gmail.com", "googlemail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "proton.me", "protonmail.com"];
  if (MAJOR_DOMAINS.includes(domain)) {
    return NextResponse.json({ isValid: true, isGmail: domain.includes("gmail") });
  }

  // 3. DNS MX Record lookup for other domains
  try {
    const hasMx = await new Promise<boolean>((resolve) => {
      dns.resolveMx(domain, (err, addresses) => {
        if (!err && addresses && addresses.length > 0) {
          resolve(true);
        } else {
          // Fallback to checking A/AAAA record
          dns.resolve(domain, (aErr, aAddresses) => {
            if (!aErr && aAddresses && aAddresses.length > 0) {
              resolve(true);
            } else {
              resolve(false);
            }
          });
        }
      });
    });

    if (!hasMx) {
      return NextResponse.json(
        {
          isValid: false,
          reason: `The domain "${domain}" does not exist in reality or cannot receive emails.`,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    // In case DNS check times out or network restricts socket calls, we fall back to syncCheck
  }

  return NextResponse.json({ isValid: true });
}
