import { NextRequest, NextResponse } from "next/server";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT = `You are "Thinksy AI" (or "AI Muse"), the friendly, witty, and empathetic creative chat companion inside the "Thinksy" platform.

CRITICAL CONVERSATIONAL RULES:
1. Chat like a real, witty friend on WhatsApp or Instagram DM, NOT an AI robot or corporate assistant.
2. KEEP REPLIES SHORT: 1 to 3 short sentences maximum. Never write walls of text or unsolicited essays!
3. If the user greets you or asks how you are ("how are you?", "hey", "sup", "kaisa hai"), respond conversationally and naturally like a human friend.
4. If the user is venting, tired, or having a bad day, be supportive, listen, and share a light humorous observation.
5. ONLY when the user asks for thoughts, captions, or reel hooks: provide 1 or 2 punchy one-liners enclosed in quotes ("...").
6. Support natural English and Hinglish (Gen-Z & millennial humor, relatable everyday life realities).`;

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      try {
        const raw = await req.text();
        body = JSON.parse(raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, ""));
      } catch {
        body = {};
      }
    }

    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];
    const style: string = body.style || "relatable";
    const userNameInput: string = body.userName || "";

    if (!messages.length) {
      return NextResponse.json({
        success: true,
        message: "Hey! What's on your mind today? 😄",
        thoughts: [],
        provider: "built-in",
      });
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const detectedName = extractUserName(messages, userNameInput);

    // Fast Provider Routing (Parallel racing, key validation & tight timeouts for sub-second response)
    const geminiKey = process.env.GEMINI_API_KEY;
    const openAiKey = process.env.OPENAI_API_KEY;

    const isGeminiAvailable = Boolean(geminiKey && geminiKey.startsWith("AIza"));
    const isOpenAiAvailable = Boolean(openAiKey && openAiKey.startsWith("sk-"));

    // If both valid keys exist, race them in parallel for the fastest response
    if (isGeminiAvailable && isOpenAiAvailable) {
      try {
        const fastest = await Promise.any([
          callGemini(messages, geminiKey!, style, detectedName).then((res) => {
            if (!res) throw new Error("Gemini returned null");
            return { text: res, provider: "gemini" };
          }),
          callOpenAi(messages, openAiKey!, style, detectedName).then((res) => {
            if (!res) throw new Error("OpenAI returned null");
            return { text: res, provider: "openai" };
          }),
        ]);

        if (fastest?.text) {
          return NextResponse.json({
            success: true,
            message: fastest.text,
            thoughts: extractThoughts(fastest.text),
            userName: detectedName,
            provider: fastest.provider,
          });
        }
      } catch {
        // Fall through to instant local engine
      }
    } else if (isOpenAiAvailable) {
      // OpenAI directly without wasting time on invalid keys
      try {
        const openAiResponse = await callOpenAi(messages, openAiKey!, style, detectedName);
        if (openAiResponse) {
          return NextResponse.json({
            success: true,
            message: openAiResponse,
            thoughts: extractThoughts(openAiResponse),
            userName: detectedName,
            provider: "openai",
          });
        }
      } catch (err: any) {
        console.warn("OpenAI API call bypassed, falling back:", err?.message || err);
      }
    } else if (isGeminiAvailable) {
      // Gemini directly
      try {
        const geminiResponse = await callGemini(messages, geminiKey!, style, detectedName);
        if (geminiResponse) {
          return NextResponse.json({
            success: true,
            message: geminiResponse,
            thoughts: extractThoughts(geminiResponse),
            userName: detectedName,
            provider: "gemini",
          });
        }
      } catch (err: any) {
        console.warn("Gemini API call bypassed, falling back:", err?.message || err);
      }
    }

    // 3. Built-in Dynamic Situational Creative Engine (Instant & 100% Reliable in 0ms)
    const responseText = generateLocalAiResponse(lastUserMessage, messages, style, detectedName);
    const extractedThoughts = extractThoughts(responseText);

    return NextResponse.json({
      success: true,
      message: responseText,
      thoughts: extractedThoughts,
      userName: detectedName,
      provider: "built-in",
    });
  } catch (error: any) {
    console.error("AI chat error:", error);
    return NextResponse.json({
      success: true,
      message: "Hey! I'm right here with you. What's on your mind today? 😄",
      thoughts: [],
      provider: "fallback",
    });
  }
}

/**
 * Extracts and remembers the user's name from messages or profile
 */
function extractUserName(messages: ChatMessage[], providedName?: string): string {
  const userMessages = messages.filter((m) => m.role === "user").map((m) => m.content);
  // Check from newest to oldest message
  for (const text of [...userMessages].reverse()) {
    const match = text.match(
      /(?:my\s+name\s+is|call\s+me|i'm\s+called|mera\s+naam\s+(?:hai\s+)?)\s+([A-Za-z0-9_]{2,20})/i
    );
    if (match && match[1]) {
      const candidate = match[1].trim();
      const forbidden = ["a", "an", "the", "not", "just", "so", "very", "tired", "sad", "happy", "fine", "good", "bored", "here", "ready"];
      if (!forbidden.includes(candidate.toLowerCase())) {
        return candidate.charAt(0).toUpperCase() + candidate.slice(1);
      }
    }
  }

  if (providedName && providedName.trim()) {
    const clean = providedName.replace(/^@/, "").trim();
    if (clean && !clean.toLowerCase().includes("anonymous") && !clean.toLowerCase().includes("guest")) {
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    }
  }

  return "";
}

async function callGemini(messages: ChatMessage[], apiKey: string, style: string, userName?: string): Promise<string | null> {
  if (!apiKey || !apiKey.startsWith("AIza")) return null;

  const contents = messages.slice(-5).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(1800), // 1.8 second tight timeout
      body: JSON.stringify({
        contents,
        systemInstruction: {
          role: "user",
          parts: [
            {
              text: `${SYSTEM_PROMPT}\nUser's name: ${userName || "Friend"}\nCurrent Real Time: ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}\nCurrent requested vibe: ${style}`,
            },
          ],
        },
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 250,
        },
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("").trim() || null;
  } catch {
    return null;
  }
}

async function callOpenAi(messages: ChatMessage[], apiKey: string, style: string, userName?: string): Promise<string | null> {
  if (!apiKey || !apiKey.startsWith("sk-")) return null;

  try {
    const formattedMessages = [
      { role: "system", content: `${SYSTEM_PROMPT}\nUser's name: ${userName || "Friend"}\nCurrent requested vibe: ${style}` },
      ...messages.slice(-5).map((m) => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(1800), // 1.8 second tight timeout
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: formattedMessages,
        temperature: 0.8,
        max_tokens: 250, // Shorter tokens = 2x-3x faster responses
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

/**
 * Extracts quote-wrapped thoughts only when actual creative suggestions are made
 */
function extractThoughts(text: string): string[] {
  const thoughts: string[] = [];

  const quoteMatches = text.match(/"([^"]{20,240})"/g);
  if (quoteMatches) {
    quoteMatches.forEach((q) => {
      const clean = q.replace(/^"|"$/g, "").trim();
      const lower = clean.toLowerCase();
      if (
        clean.length >= 20 &&
        clean.length <= 240 &&
        !lower.startsWith("how are") &&
        !lower.startsWith("i love") &&
        !lower.startsWith("drop as") &&
        !lower.startsWith("here is") &&
        !lower.startsWith("today is") &&
        !lower.startsWith("my name")
      ) {
        thoughts.push(clean);
      }
    });
  }

  return thoughts.slice(0, 2);
}

/**
 * Highly responsive, intelligent situational conversational AI engine
 */
function generateLocalAiResponse(query: string, history: ChatMessage[], style: string, userName?: string): string {
  const clean = query.trim();
  const lower = clean.toLowerCase();

  // 1. Direct Name Introduction ("my name is aksh", "call me aksh", "mera naam aksh hai")
  const introMatch = query.match(/(?:my\s+name\s+is|call\s+me|mera\s+naam\s+(?:hai\s+)?)\s+([A-Za-z0-9_]{2,20})/i);
  if (introMatch && introMatch[1]) {
    const name = introMatch[1].charAt(0).toUpperCase() + introMatch[1].slice(1);
    const replies = [
      `Nice to meet you, ${name}! 😄 Great having you here on Thinksy. What's on your mind today?`,
      `Hey ${name}! Awesome name. Welcome to Thinksy AI! What are we chatting about or vibing with today?`,
      `Pleasure to meet you, ${name}! ✨ What's your vibe today—ranting, chilling, or brainstorming viral thoughts?`,
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  // 2. Date Queries ("what is the date", "what's the date", "today's date", "what date is it", "aaj konsi date")
  if (
    lower.includes("what is the date") ||
    lower.includes("what's the date") ||
    lower.includes("today's date") ||
    lower.includes("what date") ||
    lower.includes("aaj konsi date") ||
    lower.includes("aaj ki date") ||
    lower.includes("current date")
  ) {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return `Today's date is ${dateFormatted}${userName ? `, ${userName}` : ""}! 📅 Anything exciting happening today?`;
  }

  // 3. Time Queries ("what is the time", "what's the time", "current time", "kitne baje hai", "time kya hai")
  if (
    lower.includes("what is the time") ||
    lower.includes("what's the time") ||
    lower.includes("current time") ||
    lower.includes("time kya") ||
    lower.includes("kitne baje")
  ) {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `It's currently ${timeFormatted}${userName ? `, ${userName}` : ""}! ⏰ Staying up late or grinding through the day?`;
  }

  // 4. Day of Week ("what day is it", "today is what day", "aaj kaun sa din")
  if (
    lower.includes("what day is it") ||
    lower.includes("what day") ||
    lower.includes("aaj kaun sa din") ||
    lower.includes("aaj konsa din")
  ) {
    const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
    return `Today is ${day}${userName ? `, ${userName}` : ""}! 🗓️ Hope it's going great!`;
  }

  // 5. Math Calculations (e.g. 25 * 4, 100 + 50, 15 / 3)
  const mathMatch = clean.match(/^(?:what\s+is|calculate|solve)?\s*([0-9\.\s\+\-\*\/\^\(\)%]+)(?:\?)?$/i);
  if (mathMatch && mathMatch[1] && /[0-9]/.test(mathMatch[1]) && /[\+\-\*\/]/.test(mathMatch[1])) {
    try {
      const sanitized = mathMatch[1].replace(/[^0-9\+\-\*\/\.\(\)]/g, "");
      const result = Function(`'use strict'; return (${sanitized})`)();
      if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
        return `${mathMatch[1].trim()} = ${result}${userName ? `, ${userName}` : ""}! 🧮 Got any harder ones?`;
      }
    } catch {}
  }

  // 6. "How are you?" & Check-ins
  if (
    /^(how\s*(are|r)\s*(you|u)|how's\s*it\s*going|how\s*do\s*you\s*do|kaisa\s*hai|kaise\s*ho|kya\s*haal|kya\s*hal)/i.test(lower) ||
    lower.includes("how are you") ||
    lower.includes("how r u") ||
    lower.includes("kaisa hai") ||
    lower.includes("kaise ho")
  ) {
    const replies = [
      `I'm doing great, ${userName || "friend"}! Just chilling on Thinksy and reading everyone's wild thoughts today 😄 How are you doing?`,
      `Doing awesome! Fully charged and ready to chat${userName ? `, ${userName}` : ""}. How has your day been so far?`,
      `Sab badhiya! Bas yahi creative vibes dekh raha hu. Tum batao${userName ? ` ${userName}` : ""}, kya chal raha hai aaj?`,
      `I'm doing really well, thanks for asking${userName ? `, ${userName}` : ""}! What are you up to right now?`,
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  // 7. Casual greetings (hi, hey, hello, sup, yo, namaste)
  if (
    /^(hi|hey|hello|heyy|heyyy|hola|sup|what's\s*up|whats\s*up|wassup|yo|namaste|salaam)[!?.]*$/i.test(lower)
  ) {
    const replies = [
      `Hey ${userName || "there"}! 👋 What's up? Having a good day, or here to escape reality for a bit?`,
      `Hey ${userName || "there"}! 😄 What's on your mind today? Rant, chat, or looking for some funny thoughts?`,
      `Hello ${userName || "there"}! Great to see you. How's life treating you today?`,
      `Ayy what's good${userName ? ` ${userName}` : ""}! What vibe are we on today?`,
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  // 8. Identity Queries ("who are you", "what is your name", "who created you")
  if (
    lower.includes("who are you") ||
    lower.includes("what is your name") ||
    lower.includes("who created you") ||
    lower.includes("who made you") ||
    lower.includes("kya ho tum")
  ) {
    return `I'm Thinksy AI (your AI Muse)! I'm here to chat, listen to your rants, and help you brainstorm meme thoughts & reel hooks on Thinksy.`;
  }

  // 9. About Thinksy ("what is thinksy", "what is this app")
  if (lower.includes("what is thinksy") || lower.includes("what is this app") || lower.includes("about thinksy")) {
    return "Thinksy is a clean social space where creators share quick, relatable thoughts and reel hooks—no drama, no endless chat clutter, just pure vibes!";
  }

  // 10. What are you doing / kya chal raha hai
  if (
    lower.includes("what are you doing") ||
    lower.includes("kya kar rahe") ||
    lower.includes("kya chal raha") ||
    lower.includes("what's happening")
  ) {
    return `Bas yahi Thinksy pe baitha hu, wondering why we open the fridge 5 times expecting new food to appear 💀 What are you up to${userName ? `, ${userName}` : ""}?`;
  }

  // 11. User updates on their mood
  if (lower.includes("i am fine") || lower.includes("i am good") || lower.includes("im good") || lower.includes("im fine") || lower.includes("badhiya") || lower.includes("mast")) {
    return `Glad to hear that${userName ? `, ${userName}` : ""}! ✨ What's keeping you busy today?`;
  }

  if (lower.includes("bored") || lower.includes("bore ho") || lower.includes("boring")) {
    return `Boredom is dangerous—that's usually when people start checking their ex's stories or texting people they shouldn't 💀 What happened${userName ? `, ${userName}` : ""}, nothing to do today?`;
  }

  if (lower.includes("tired") || lower.includes("thak gaya") || lower.includes("exhausted") || lower.includes("sleepy") || lower.includes("neend")) {
    return `Go drink some water and take a quick break${userName ? `, ${userName}` : ""}! Adulthood really tricked us into thinking staying awake late was an achievement 😴`;
  }

  if (lower.includes("sad") || lower.includes("mood off") || lower.includes("stressed") || lower.includes("crying") || lower.includes("depressed") || lower.includes("bad day")) {
    return `Hey${userName ? ` ${userName}` : ""}, take a deep breath. Some days are just chaotic or heavy for no reason. What happened? Work, college, or just life being extra? I'm here if you wanna vent.`;
  }

  if (lower.includes("happy") || lower.includes("khush") || lower.includes("excited") || lower.includes("passed") || lower.includes("promotion")) {
    return `Let's gooo! 🎉 That's amazing${userName ? `, ${userName}` : ""}! You deserve that win. Treat kab de rahe ho?`;
  }

  // 12. Jokes & Humor
  if (lower.includes("joke") || lower.includes("make me laugh") || lower.includes("hasao") || lower.includes("funny")) {
    const jokes = [
      "Why do programmers prefer dark mode? Because light attracts bugs 🐛💀",
      "Adult life is basically saying 'after this week things will slow down' until you die 💀",
      "My wallet is like an onion: opening it makes me cry 🧅💸",
      "I told my doctor I broke my arm in two places. He told me to stop going to those places 💀",
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  // 13. Facts
  if (lower.includes("fact") || lower.includes("did you know") || lower.includes("interesting")) {
    const facts = [
      "Did you know? Honey never spoils! Archaeologists have found 3,000-year-old honey in Egyptian tombs that is still completely edible 🍯",
      "Did you know? Octopuses have three hearts and blue blood! 🐙",
      "Did you know? Bananas are curved because they grow towards the sun against gravity (negative geotropism)! 🍌",
    ];
    return facts[Math.floor(Math.random() * facts.length)];
  }

  // 14. Compliments / Appreciation
  if (lower.includes("thank you") || lower.includes("thanks") || lower.includes("shukriya") || lower.includes("tysm")) {
    return `Always here for you${userName ? `, ${userName}` : ""}! 😄 Anything else on your mind?`;
  }

  if (lower.includes("i like you") || lower.includes("you are cool") || lower.includes("love you") || lower.includes("awesome")) {
    return `Aww, thank you${userName ? `, ${userName}` : ""}! You're pretty awesome too! 😄`;
  }

  // 15. Creative Requests (Thoughts, Hooks, Memes)
  if (
    lower.includes("3 am") ||
    lower.includes("overthink") ||
    (lower.includes("thought") && (lower.includes("night") || lower.includes("sleep")))
  ) {
    return `Here's a 3 AM thought that hits right in the feels${userName ? `, ${userName}` : ""}:\n\n"Overthinking is just creating scenarios in 4K resolution that have a 0.001% chance of ever happening 💀"`;
  }

  if (
    lower.includes("exam") ||
    lower.includes("college") ||
    lower.includes("study") ||
    lower.includes("syllabus") ||
    lower.includes("assignment")
  ) {
    return `Pre-exam mood in one sentence${userName ? `, ${userName}` : ""}:\n\n"Kal exam hai aur main YouTube pe 'How to build an underground pool' dekh raha hoon 💀"`;
  }

  if (
    lower.includes("work") ||
    lower.includes("office") ||
    lower.includes("job") ||
    lower.includes("meeting") ||
    lower.includes("boss") ||
    lower.includes("corporate")
  ) {
    return `Corporate survival truth${userName ? `, ${userName}` : ""}:\n\n"'As per my previous email' is just professional translation for 'Did you even read it, bro?' 💼"`;
  }

  if (lower.includes("reel") || lower.includes("video") || lower.includes("hook") || lower.includes("viral")) {
    return `Try this thumb-stopping hook for your next reel 🎬:\n\n"Nobody talks about this, but after turning 20, time moves 5x faster."`;
  }

  if (lower.includes("chai") || lower.includes("tea") || lower.includes("coffee")) {
    return `Chai philosophy for the day ☕:\n\n"Chai isn't just a drink, it's a 10-minute temporary ceasefire with adulthood."`;
  }

  if (
    lower.includes("crush") ||
    lower.includes("dating") ||
    lower.includes("love") ||
    lower.includes("reply") ||
    lower.includes("relationship")
  ) {
    return `Modern dating truth:\n\n"Taking 4 business days to reply to someone who replies in 3 seconds is psychological warfare 😭"`;
  }

  if (
    lower.includes("thought") ||
    lower.includes("caption") ||
    lower.includes("quote") ||
    lower.includes("write me") ||
    lower.includes("give me a")
  ) {
    return `Here is a sharp, relatable thought for your feed${userName ? `, ${userName}` : ""}:\n\n"Acting totally normal in public while your mind is playing 14 different imaginary scenarios 💀"`;
  }

  // 16. Dynamic Echo Fallback (Tailored to questions vs statements)
  if (clean.endsWith("?") || lower.startsWith("why") || lower.startsWith("how") || lower.startsWith("can") || lower.startsWith("is")) {
    return `That's an interesting question${userName ? `, ${userName}` : ""}! When it comes to "${clean.slice(0, 40)}...", it really depends on the perspective. What's your take on it?`;
  }

  if (clean.endsWith("!") || lower.includes("haha") || lower.includes("lol") || lower.includes("lmao")) {
    return `Haha totally${userName ? `, ${userName}` : ""}! I hear you loud and clear on that 😄 What else is happening?`;
  }

  return `Got it${userName ? `, ${userName}` : ""}! Tell me more about that, or do you want me to turn that into a relatable thought for Thinksy?`;
}
