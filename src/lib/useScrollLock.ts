"use client";

import { useEffect } from "react";

// Track active lock count so multiple nested modals don't prematurely unlock the body
let lockCount = 0;
let originalOverflow = "";
let originalOverscroll = "";

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      originalOverflow = document.body.style.overflow;
      originalOverscroll = document.body.style.overscrollBehavior;

      document.body.style.overflow = "hidden";
      document.body.style.overscrollBehavior = "none";
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.style.overflow = originalOverflow || "";
        document.body.style.overscrollBehavior = originalOverscroll || "";
      }
    };
  }, [isLocked]);
}
