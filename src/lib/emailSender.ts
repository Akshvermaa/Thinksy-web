import tls from "tls";

export interface SendEmailOptions {
  to: string;
  code: string;
}

export interface SendEmailResult {
  delivered: boolean;
  provider: "resend" | "brevo" | "gmail_smtp" | "none";
  error?: string;
}

/**
 * Dispatches 6-digit OTP email securely via Resend (primary) or configured SMTP.
 * Strictly complies with Requirement 12: NEVER logs OTP values to console or anywhere.
 */
export async function sendOtpEmail({ to, code }: SendEmailOptions): Promise<SendEmailResult> {
  const normalizedTo = to.trim().toLowerCase();

  let lastProviderError = "";

  // 1. Gmail App Password / SMTP (Primary for unrestricted delivery to ANY email in the world)
  const smtpUser = process.env.GMAIL_USER || process.env.SMTP_USER || "pvtthinksy@gmail.com";
  const smtpPass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "pbuhmtnheovkyyaa").replace(/\s+/g, "");

  if (smtpUser && smtpPass) {
    try {
      const delivered = await sendViaTlsSmtp({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 465,
        user: smtpUser,
        pass: smtpPass,
        to: normalizedTo,
        code,
      });

      if (delivered) {
        return { delivered: true, provider: "gmail_smtp" };
      }
    } catch (err: any) {
      console.warn("SMTP email dispatch error, checking fallback:", err.message);
      lastProviderError = `SMTP error: ${err.message}`;
    }
  }

  // 2. Resend API (Fallback or primary if SMTP not configured)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "Thinksy <onboarding@resend.dev>",
          to: [normalizedTo],
          subject: `Your Thinksy Verification Code: ${code}`,
          html: generateEmailHtml(code),
        }),
      });

      if (res.ok) {
        return { delivered: true, provider: "resend" };
      } else {
        const errText = await res.text();
        console.warn("Resend email dispatch error, checking fallback providers:", errText);
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.message && parsed.message.includes("testing emails")) {
            lastProviderError = "Resend Sandbox Restriction: In test mode, emails can only be sent to pvtthinksy@gmail.com. Please configure Gmail SMTP for pvtthinksy@gmail.com to send to all emails.";
          } else {
            lastProviderError = parsed.message;
          }
        } catch (_) {
          lastProviderError = errText;
        }
      }
    } catch (err: any) {
      console.warn("Resend network error, checking fallback providers:", err.message);
      lastProviderError = err.message;
    }
  }

  // 3. Brevo API (Fallback)
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Thinksy Community", email: process.env.BREVO_SENDER || "auth@thinksy.app" },
          to: [{ email: normalizedTo }],
          subject: `Your Thinksy Verification Code: ${code}`,
          htmlContent: generateEmailHtml(code),
        }),
      });

      if (res.ok) {
        return { delivered: true, provider: "brevo" };
      }
    } catch (err: any) {
      console.warn("Brevo email dispatch error:", err.message);
    }
  }

  // If no email provider succeeded
  console.warn(`[Thinksy Auth] Verification email could not be delivered to ${normalizedTo}.`);

  return {
    delivered: false,
    provider: "none",
    error: lastProviderError || "No active email service configured to dispatch to this recipient.",
  };
}

/**
 * Pure Node.js TLS SMTP Client
 */
function sendViaTlsSmtp(options: {
  host: string;
  port: number;
  user: string;
  pass: string;
  to: string;
  code: string;
}): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let isSettled = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const cleanup = (err?: Error) => {
      if (isSettled) return;
      isSettled = true;
      if (timeoutId) clearTimeout(timeoutId);
      try {
        socket.destroy();
      } catch (_) {}
      if (err) reject(err);
      else resolve(true);
    };

    const socket = tls.connect({
      host: options.host,
      port: options.port,
      rejectUnauthorized: false,
    });

    // Synchronously bind error & timeout handlers immediately on socket creation
    socket.on("error", (err) => {
      cleanup(err);
    });

    timeoutId = setTimeout(() => {
      cleanup(new Error("SMTP connection timeout after 15s"));
    }, 15000);

    let step = 0;
    const send = (str: string) => {
      if (isSettled) return;
      try {
        socket.write(str + "\r\n");
      } catch (e: any) {
        cleanup(e);
      }
    };

    socket.on("data", (data) => {
      if (isSettled) return;
      const msg = data.toString();

      if (step === 0 && msg.startsWith("220")) {
        step++;
        send("EHLO thinksy-client");
      } else if (step === 1 && msg.startsWith("250")) {
        step++;
        send("AUTH LOGIN");
      } else if (step === 2 && msg.startsWith("334")) {
        step++;
        send(Buffer.from(options.user).toString("base64"));
      } else if (step === 3 && msg.startsWith("334")) {
        step++;
        send(Buffer.from(options.pass).toString("base64"));
      } else if (step === 4 && msg.startsWith("235")) {
        step++;
        send(`MAIL FROM:<${options.user}>`);
      } else if (step === 5 && msg.startsWith("250")) {
        step++;
        send(`RCPT TO:<${options.to}>`);
      } else if (step === 6 && msg.startsWith("250")) {
        step++;
        send("DATA");
      } else if (step === 7 && msg.startsWith("354")) {
        step++;
        const mailLines = [
          `From: "Thinksy Community" <${options.user}>`,
          `To: <${options.to}>`,
          `Subject: Your Thinksy Verification Code: ${options.code}`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=UTF-8`,
          ``,
          generateEmailHtml(options.code),
          `.`,
        ];
        send(mailLines.join("\r\n"));
      } else if (step === 8 && msg.startsWith("250")) {
        step++;
        send("QUIT");
        cleanup();
      } else if (msg.startsWith("5") || msg.startsWith("4")) {
        cleanup(new Error(`SMTP server error: ${msg.trim()}`));
      }
    });
  });
}

function generateEmailHtml(code: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 36px 24px; background: #0c091d; color: #ffffff; border-radius: 24px;">
      <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="font-size: 28px; font-weight: 900; background: linear-gradient(to right, #6366f1, #a855f7, #ec4899); -webkit-background-clip: text; color: transparent; margin: 0;">Thinksy 💭</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 6px;">Community for Relatable Thoughts & Meme Reels</p>
      </div>
      <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 20px; padding: 28px; text-align: center;">
        <p style="font-size: 15px; color: #e2e8f0; margin: 0 0 16px 0; font-weight: 600;">Here is your 6-digit email verification code:</p>
        <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #c084fc; font-family: monospace; padding: 14px 24px; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 16px; display: inline-block;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 18px; line-height: 1.5;">Enter this code on screen to verify your email. This code will expire in <strong>10 minutes</strong>.</p>
      </div>
      <p style="text-align: center; color: #64748b; font-size: 11px; margin-top: 24px;">If you did not request this verification code, you can safely ignore this email.</p>
    </div>
  `;
}
