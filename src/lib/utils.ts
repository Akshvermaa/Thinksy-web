import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date into a human-readable relative time string (e.g. "2m ago", "1h ago", "Just now")
 */
export function formatRelativeTime(dateInput: any): string {
  if (!dateInput) return "Just now";

  let date: Date;

  // Handle Firestore Timestamp (has toMillis() or seconds)
  if (typeof dateInput === "object" && dateInput !== null) {
    if (typeof dateInput.toMillis === "function") {
      date = new Date(dateInput.toMillis());
    } else if ("seconds" in dateInput) {
      date = new Date(dateInput.seconds * 1000);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      date = new Date(dateInput);
    }
  } else if (typeof dateInput === "number") {
    date = new Date(dateInput);
  } else if (typeof dateInput === "string") {
    date = new Date(dateInput);
  } else {
    return "Just now";
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffInSeconds) || diffInSeconds < 10) {
    return "Just now";
  }
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}d ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}
