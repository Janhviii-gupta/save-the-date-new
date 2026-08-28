"use client";

import { useState } from "react";
import { soundEngine } from "@/lib/audio/soundEngine";

interface AudioBypassGateProps {
  onBypass: () => void;
}

export function AudioBypassGate({ onBypass }: AudioBypassGateProps) {
  const [dismissing, setDismissing] = useState(false);

  const handleBypass = () => {
    // Mobile hardware haptic pulse
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([30, 40, 50]);
      } catch {}
    }

    setDismissing(true);
    soundEngine?.startFromEntryGate();
    setTimeout(() => {
      onBypass();
    }, 350);
  };

  const handleHover = () => {
    // Only play hover on true pointer devices (disable on mobile touch)
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
      soundEngine?.playClick();
    }
  };

  return (
    <div
      style={{ backgroundColor: "#050505" }}
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 transition-opacity duration-350 ${
        dismissing ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center justify-center text-center max-w-lg w-full space-y-6">
        {/* Subtle Security Badge */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-[#e9c349] uppercase tracking-[0.3em]">
          <span className="w-2 h-2 bg-[#e9c349] rounded-full animate-ping" />
          <span>SAVE THE DATE // 19–20 NOVEMBER 2026</span>
        </div>

        {/* Primary Ultra-Minimalist Button */}
        <button
          type="button"
          onClick={handleBypass}
          onMouseEnter={handleHover}
          className="w-full max-w-md py-6 px-8 border border-white/80 hover:border-[#e9c349] bg-black/60 hover:bg-[#e9c349] text-white hover:text-black font-mono font-bold text-sm md:text-base uppercase tracking-[0.25em] transition-all duration-300 btn-pulse-anim cursor-pointer shadow-[0_0_40px_rgba(255,255,255,0.08)] group"
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            [ ENTER INVITATION ]
          </span>
        </button>

        {/* Minimalist Subtext */}
        <p className="font-mono text-[9px] text-[#8e9192] uppercase tracking-[0.3em] opacity-70">
          JANHVI &amp; KRISH // JAIPUR, RAJASTHAN
        </p>
      </div>
    </div>
  );
}
