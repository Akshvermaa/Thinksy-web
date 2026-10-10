import { ModerationResult } from "@/types/thought";

/**
 * Validates a thought text against platform moderation guidelines.
 * Platform rule: Standalone relatable thoughts only. No chat messages, personal info, spam, or links.
 */
export function validateThought(rawText: string): ModerationResult {
  const text = rawText.trim();

  // 1. Length checks
  if (!text) {
    return {
      isValid: false,
      reason: "Thought cannot be empty.",
      category: "length",
    };
  }

  if (text.length < 5) {
    return {
      isValid: false,
      reason: "Thought is too short. Make it at least 5 characters.",
      category: "length",
    };
  }

  if (text.length > 280) {
    return {
      isValid: false,
      reason: "Thought exceeds the 280 character limit.",
      category: "length",
    };
  }

  // 2. Check for long paragraphs / excess line breaks
  const lineBreaks = (text.match(/\n/g) || []).length;
  if (lineBreaks > 5) {
    return {
      isValid: false,
      reason: "Too many line breaks. Keep your thought compact.",
      category: "length",
    };
  }

  // 3. Check for URLs / Links
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9.-]+\.(com|org|net|io|co|in|app|me)\b)/i;
  if (urlRegex.test(text)) {
    return {
      isValid: false,
      reason: "Links and web addresses are not allowed.",
      category: "spam",
    };
  }

  // 4. Check for Phone numbers (Indian, International, raw 10-digit formats)
  const phoneRegex = /(\+?\d{1,4}[\s-]?)?\(?\d{3,5}\)?[\s-]?\d{3,5}[\s-]?\d{3,5}/;
  const digitsOnly = text.replace(/\D/g, "");
  if (phoneRegex.test(text) && digitsOnly.length >= 10) {
    return {
      isValid: false,
      reason: "Phone numbers are not allowed for privacy and safety.",
      category: "personal_info",
    };
  }

  // 5. Check for Email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (emailRegex.test(text)) {
    return {
      isValid: false,
      reason: "Email addresses are not allowed for privacy.",
      category: "personal_info",
    };
  }

  // 6. Check for promo / spam keywords
  const spamKeywords = [
    "dm me",
    "whatsapp me",
    "follow me on",
    "subscribe to",
    "buy now",
    "discount code",
    "free crypto",
    "earn money",
    "telegram channel",
  ];
  const lower = text.toLowerCase();
  for (const keyword of spamKeywords) {
    if (lower.includes(keyword)) {
      return {
        isValid: false,
        reason: `Promotional content ("${keyword}") is not permitted.`,
        category: "spam",
      };
    }
  }

  // 7. Conversational Chat Message detection
  // This is NOT a chat platform. Discourage "hi", "hello", "how are you", "kya kar rahe ho", etc.
  const conversationPhrases = [
    /^hi+$/i,
    /^hello+$/i,
    /^hey+$/i,
    /^sup$/i,
    /^how are you\??$/i,
    /^kya kar rahe ho\??$/i,
    /^kaha ho\??$/i,
    /^good morning$/i,
    /^good night$/i,
    /^gm$/i,
    /^gn$/i,
    /^anyone there\??$/i,
    /^reply karo$/i,
    /^ping me$/i,
  ];

  for (const pattern of conversationPhrases) {
    if (pattern.test(text.trim())) {
      return {
        isValid: false,
        reason: "This platform is for standalone relatable thoughts, not chat greetings!",
        category: "chat_conversation",
      };
    }
  }

  // Additional check: if text is pure greeting like "Hey bro how are you"
  if (/^(hey|hi|hello)\s+(bro|dude|guys|everyone)\s+(how|kya|where)/i.test(lower)) {
    return {
      isValid: false,
      reason: "Thoughts should be standalone relatable ideas, not 1-on-1 messages.",
      category: "chat_conversation",
    };
  }

  return { isValid: true };
}
