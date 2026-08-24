"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { soundEngine } from "@/lib/audio/soundEngine";
import type { RsvpResponse } from "@/lib/validation/rsvp";

interface SectorRsvpProps {
  initialRsvp?: RsvpResponse | null;
  initialName?: string | null;
  initialCount?: number | null;
  onSubmitted?: (response: RsvpResponse, name: string, count: number | null) => void;
}

type ModalStep = "name" | "count" | "custom_count" | "confirm";

const SYSTEM_LOGS = [
  "> INITIALIZING GUEST AUTHENTICATION PROTOCOL...",
  "> ESTABLISHING SECURE CONNECTION TO MAINFRAME...",
  "> CONNECTION SUCCESSFUL. PING: 12ms",
  "> DECRYPTING INVITATION PAYLOAD [██████████] 100%",
  "> WARNING: IMMINENT CELEBRATORY EVENT DETECTED.",
  "> LOADING MODULE: AUTH_RESPONSE.EXE",
  "> AWAITING USER INPUT TETHER...",
  "> SYSTEM STATUS: NOMINAL.",
  "> MONITORING USER DECISION MATRIX...",
  "> TIMEOUT AVOIDANCE ACTIVE. PLEASE RESPOND."
];

export function SectorRsvp({
  initialRsvp,
  initialName,
  initialCount,
  onSubmitted
}: SectorRsvpProps) {
  const [rsvpType, setRsvpType] = useState<"YES" | "MAYBE" | "NO" | null>(
    initialRsvp ? (initialRsvp.toUpperCase() as "YES" | "MAYBE" | "NO") : null
  );
  const [guestName, setGuestName] = useState(initialName || "");
  const [guestCount, setGuestCount] = useState<string>(
    initialCount ? String(initialCount) : "1"
  );
  const [customCountInput, setCustomCountInput] = useState<string>("6");
  const [confirmed, setConfirmed] = useState(Boolean(initialRsvp));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [crestFlicker, setCrestFlicker] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("name");

  // Terminal log stream
  const [logs, setLogs] = useState<string[]>(SYSTEM_LOGS.slice(0, 4));
  const logIndexRef = useRef(4);

  // Countdown timer state
  const [countdown, setCountdown] = useState({
    days: "00",
    hours: "00",
    mins: "00",
    secs: "00"
  });

  // Track switching based on state
  useEffect(() => {
    if (confirmed) {
      if (rsvpType === "NO") {
        soundEngine?.setTrack("deadpan_regret");
      } else {
        soundEngine?.setTrack("party_celebration");
      }
    } else {
      soundEngine?.setTrack("rsvp_curious");
    }
  }, [confirmed, rsvpType]);

  // Terminal log ticker
  useEffect(() => {
    const interval = setInterval(() => {
      if (logIndexRef.current < SYSTEM_LOGS.length) {
        const nextLog = SYSTEM_LOGS[logIndexRef.current];
        setLogs((prev) => [...prev.slice(-4), nextLog]);
        soundEngine?.playTick();
        logIndexRef.current += 1;
      } else {
        logIndexRef.current = 0;
      }
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (!confirmed) return;

    const target = new Date("2026-11-19T00:00:00").getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown((prev) => {
        const nextSecs = s.toString().padStart(2, "0");
        if (prev.secs !== nextSecs) {
          soundEngine?.playTick();
        }
        return {
          days: d.toString().padStart(2, "0"),
          hours: h.toString().padStart(2, "0"),
          mins: m.toString().padStart(2, "0"),
          secs: nextSecs
        };
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [confirmed]);

  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  };

  const isHoverSupported = () => {
    return typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
  };

  const handleOpenRsvp = (type: "YES" | "MAYBE" | "NO") => {
    setRsvpType(type);
    if (type === "YES") {
      triggerHaptic([30, 40, 60]);
      soundEngine?.sfxYesSelect();
      soundEngine?.setTrack("rsvp_yes_tone");
    } else if (type === "MAYBE") {
      triggerHaptic(40);
      soundEngine?.sfxMaybeSelect();
      soundEngine?.setTrack("rsvp_maybe_tone");
    } else {
      triggerHaptic([60, 40]);
      soundEngine?.sfxNoSelect();
      soundEngine?.setTrack("rsvp_no_tone");
    }
    setModalStep("name");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    soundEngine?.unduckMusic();
    setIsModalOpen(false);
    if (!confirmed) {
      soundEngine?.setTrack("rsvp_curious");
    }
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine?.unduckMusic();
    triggerHaptic(30);
    soundEngine?.playClick();
    if (rsvpType === "NO") {
      setModalStep("confirm");
    } else {
      setModalStep("count");
    }
  };

  const handleSelectCount = (countVal: string) => {
    triggerHaptic(30);
    soundEngine?.playClick();
    if (countVal === "more") {
      setModalStep("custom_count");
    } else {
      setGuestCount(countVal);
      setModalStep("confirm");
    }
  };

  const handleCustomCountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine?.unduckMusic();
    triggerHaptic(30);
    soundEngine?.playClick();
    setGuestCount(customCountInput || "6");
    setModalStep("confirm");
  };

  const handleFinalize = useCallback(async () => {
    if (!rsvpType) return;
    setIsSubmitting(true);
    soundEngine?.unduckMusic();

    if (rsvpType === "NO") {
      triggerHaptic([80, 50, 40]);
      soundEngine?.sfxDeadpanDrop();
    } else {
      triggerHaptic([40, 60, 80, 100]);
      soundEngine?.sfxCelebrationExplosion();
      setTimeout(() => {
        soundEngine?.setTrack("party_celebration");
      }, 700);
    }

    const normalizedResponse = rsvpType.toLowerCase() as RsvpResponse;
    const finalName = guestName.trim() || "ANONYMOUS_GUEST";
    const finalCount = rsvpType === "NO" ? null : parseInt(guestCount, 10) || 1;

    try {
      await fetch("/api/rsvp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          response: normalizedResponse,
          submittedName: finalName,
          attendanceCount: finalCount,
          idempotencyKey: crypto.randomUUID()
        })
      });
    } catch {
      // Optimistic persistence
    } finally {
      setIsSubmitting(false);
      setIsModalOpen(false);
      setConfirmed(true);
      if (onSubmitted) {
        onSubmitted(normalizedResponse, finalName, finalCount);
      }
    }
  }, [guestCount, guestName, onSubmitted, rsvpType]);

  const isNo = rsvpType === "NO";
  const statusColor = isNo ? "#ff4d4d" : rsvpType === "MAYBE" ? "#e9c349" : "#4ade80";

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col py-3 md:py-6 px-3 md:px-8">
      {/* RSVP Main Module */}
      {!confirmed ? (
        <div className="w-full border border-[#333333] bg-[#131313]/60 backdrop-blur-xl relative overflow-hidden flex flex-col">
          {/* Module Header */}
          <div className="border-b border-[#333333] p-2.5 md:p-3 flex justify-between items-center bg-[#1c1b1b]/80">
            <span className="font-mono text-[9px] md:text-[10px] text-[#8e9192] uppercase tracking-widest">
              MODULE: AUTH_RESPONSE
            </span>
            <span className="bg-[#353534] text-white px-2 py-0.5 font-mono text-[9px] md:text-[10px] uppercase tracking-wider">
              [CRITICAL_INPUT_REQUIRED]
            </span>
          </div>

          {/* THE "STOLEN CELEBRATION FRAGMENT" GRAND INDIAN WEDDING MADNESS INTEL */}
          <div
            onMouseEnter={() => {
              if (isHoverSupported()) soundEngine?.playTick();
            }}
            className="relative w-full aspect-[2.1] md:aspect-[1.9] border-b border-[#333333] bg-[#050505] overflow-hidden group cursor-crosshair transition-all duration-500 hover:border-[#e9c349]/80 hover:shadow-[0_0_40px_rgba(233,195,73,0.3)]"
          >
            {/* Intel Photo: Always in full rich vibrant color, intensifies and sharpens on hover */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Grand Indian Wedding Celebration Madness"
              className="w-full h-full object-cover filter contrast-[1.12] brightness-[1.0] saturate-[1.12] transition-all duration-500 ease-out group-hover:saturate-[1.28] group-hover:brightness-[1.05] group-hover:scale-[1.03]"
              src="/indian-wedding-madness.jpg"
            />

            {/* Cinematic Subtle Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-transparent to-[#050505]/40 pointer-events-none" />

            {/* Tactical HUD Framing & Telemetry Metadata */}
            <div className="absolute inset-0 pointer-events-none p-3 md:p-4 flex flex-col justify-between z-20">
              {/* Top Telemetry Row */}
              <div className="flex justify-between items-start w-full">
                {/* Telemetry Status Badge */}
                <div className="bg-[#0e0e0e]/90 backdrop-blur-md px-2.5 py-1 border border-[#e9c349]/60 flex items-center gap-2 shadow-[0_0_15px_rgba(233,195,73,0.3)]">
                  <span className="w-2 h-2 bg-[#e9c349] rounded-full animate-ping" />
                  <span className="font-mono text-[9px] md:text-[10px] text-[#e9c349] font-bold tracking-[0.2em] uppercase">
                    [ VISUAL_INTEL // SECTOR: JAIPUR_MADNESS ]
                  </span>
                </div>

                {/* Coordinate Readouts */}
                <div className="bg-[#0e0e0e]/85 backdrop-blur-md px-2 py-1 border border-[#333333] font-mono text-[8px] md:text-[9px] text-[#8e9192] uppercase tracking-widest text-right">
                  LAT: 27.1425° N · LON: 75.9520° E
                </div>
              </div>

              {/* Central Tactical Reticle Brackets */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-32 md:w-72 md:h-44 border border-white/20 relative group-hover:border-[#e9c349]/60 transition-colors">
                  <span className="absolute -top-1.5 -left-1.5 text-[#e9c349] font-mono text-[10px]">+</span>
                  <span className="absolute -top-1.5 -right-1.5 text-[#e9c349] font-mono text-[10px]">+</span>
                  <span className="absolute -bottom-1.5 -left-1.5 text-[#e9c349] font-mono text-[10px]">+</span>
                  <span className="absolute -bottom-1.5 -right-1.5 text-[#e9c349] font-mono text-[10px]">+</span>
                </div>
              </div>

              {/* Bottom Telemetry Row */}
              <div className="flex justify-between items-end w-full">
                <div className="bg-[#0e0e0e]/85 backdrop-blur-md px-2 py-0.5 border border-[#333333] font-mono text-[8px] md:text-[9px] text-white/70 tracking-widest uppercase">
                  <span className="inline-block w-1.5 h-1.5 bg-[#4ade80] rounded-full mr-1.5 align-middle" />
                  INTERCEPT_FEED: DECRYPTED [100%]
                </div>
                <div className="bg-[#0e0e0e]/85 backdrop-blur-md px-2 py-0.5 border border-[#333333] font-mono text-[8px] md:text-[9px] text-[#e9c349] tracking-widest text-right font-bold uppercase">
                  ROYAL_WEDDING_INTEL // LIVE
                </div>
              </div>
            </div>

            {/* Scanline FX */}
            <div className="scan-line pointer-events-none z-30 opacity-75" />
          </div>

          {/* Question Area */}
          <div className="p-4 md:p-8 text-center border-b border-[#333333] bg-[#131313]/50 space-y-2">
            <h1 className="text-xl md:text-3xl font-bold text-white uppercase tracking-widest font-mono leading-snug">
              ARE YOU COMING TO WITNESS THE MADNESS?
            </h1>
            <p className="font-mono text-[9px] md:text-[10px] text-[#8e9192] uppercase tracking-widest max-w-lg mx-auto flex items-center justify-center gap-2">
              <span className="opacity-50">&gt;</span>
              INITIATE RESPONSE SEQUENCE BELOW.
            </p>
          </div>

          {/* RSVP Decision Action Buttons with Inner Glow & Telemetry Hints */}
          <div className="flex flex-col p-3 md:p-6 gap-2.5 md:gap-3 bg-[#131313]/90">
            {/* YES: Inner Glow & Priority Telemetry */}
            <button
              type="button"
              onClick={() => handleOpenRsvp("YES")}
              onMouseEnter={() => isHoverSupported() && soundEngine?.sfxYesHover()}
              className="w-full border bg-transparent py-3 md:py-4 px-3 font-mono uppercase tracking-widest hover:bg-[#4ade80] hover:text-black hover:border-[#4ade80] hover:shadow-[inset_0_0_25px_rgba(74,222,128,0.35),0_0_20px_rgba(74,222,128,0.25)] transition-all duration-300 group relative overflow-hidden text-[#4ade80] border-[#4ade80] text-xs md:text-sm font-bold cursor-pointer text-left md:text-center flex flex-col items-center justify-center"
            >
              <span className="relative z-10">[ YES, WOULDN&apos;T MISS THIS CIRCUS ]</span>
              <span className="relative z-10 text-[8px] md:text-[9px] font-mono tracking-[0.2em] opacity-60 group-hover:opacity-100 group-hover:text-black mt-0.5 transition-opacity">
                CONFIRM_ATTENDANCE // PRIORITY_ALPHA
              </span>
              <div className="absolute inset-0 bg-[#4ade80]/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 z-0" />
            </button>

            {/* MAYBE: Inner Glow & Standby Telemetry */}
            <button
              type="button"
              onClick={() => handleOpenRsvp("MAYBE")}
              onMouseEnter={() => isHoverSupported() && soundEngine?.sfxMaybeHover()}
              className="w-full border bg-transparent py-3 md:py-4 px-3 font-mono uppercase tracking-widest hover:bg-[#ffe088] hover:text-black hover:border-[#ffe088] hover:shadow-[inset_0_0_25px_rgba(255,224,136,0.35),0_0_20px_rgba(255,224,136,0.25)] transition-all duration-300 group relative overflow-hidden text-[#ffe088] border-[#ffe088] text-xs md:text-sm font-bold cursor-pointer text-left md:text-center flex flex-col items-center justify-center"
            >
              <span className="relative z-10">[ MAYBE (TRYING TO CLEAR MY SCHEDULE) ]</span>
              <span className="relative z-10 text-[8px] md:text-[9px] font-mono tracking-[0.2em] opacity-60 group-hover:opacity-100 group-hover:text-black mt-0.5 transition-opacity">
                SCHEDULE_PENDING // STANDBY_MODE
              </span>
              <div className="absolute inset-0 bg-[#ffe088]/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 z-0" />
            </button>

            {/* NO: Inner Glow & Abort Telemetry */}
            <button
              type="button"
              onClick={() => handleOpenRsvp("NO")}
              onMouseEnter={() => isHoverSupported() && soundEngine?.sfxNoHover()}
              className="w-full border bg-transparent py-3 md:py-4 px-3 font-mono uppercase tracking-widest hover:bg-[#ffb4ab] hover:text-black hover:border-[#ffb4ab] hover:shadow-[inset_0_0_25px_rgba(255,180,171,0.35),0_0_20px_rgba(255,180,171,0.25)] transition-all duration-300 group relative overflow-hidden text-[#ffb4ab] border-[#ffb4ab] text-xs md:text-sm font-bold cursor-pointer text-left md:text-center flex flex-col items-center justify-center"
            >
              <span className="relative z-10">
                [ NO (REGRETTING LIFE CHOICES ALREADY / MISSING OUT BIG TIME) ]
              </span>
              <span className="relative z-10 text-[8px] md:text-[9px] font-mono tracking-[0.2em] opacity-60 group-hover:opacity-100 group-hover:text-black mt-0.5 transition-opacity">
                PROTOCOL_ABORT // REGRET_LOGGED
              </span>
              <div className="absolute inset-0 bg-[#ffb4ab]/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 z-0" />
            </button>
          </div>

          {/* System Logs Stream */}
          <div className="p-3 md:p-4 bg-black border-t border-[#333333] h-24 md:h-28 overflow-hidden relative">
            <div className="font-mono text-[9px] text-[#4ade80] absolute top-2 right-4 opacity-50">
              SYSTEM_LOG_ACTIVE
            </div>
            <div className="font-mono text-[9px] md:text-[10px] text-[#8e9192] flex flex-col justify-end h-full w-full break-all space-y-1">
              {logs.map((logLine, idx) => (
                <div key={idx} className="leading-tight">
                  {logLine}
                </div>
              ))}
            </div>
            <div className="scan-line" />
          </div>
        </div>
      ) : (
        /* Confirmed Screen with Strict Tabular Numeric Lock */
        <div className="w-full max-w-4xl border border-[#333333] bg-[#131313]/60 backdrop-blur-xl p-6 md:p-12 text-center space-y-6 md:space-y-8 relative overflow-hidden flex flex-col">
          {!isNo && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-85 mix-blend-screen z-0 overflow-hidden">
              <svg width="100%" height="100%" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(250, 250)">
                  <circle cx="0" cy="0" r="3" fill="#4ade80">
                    <animate attributeName="r" values="3;120;0" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <g>
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
                      <line
                        key={i}
                        x1="0"
                        y1="-20"
                        x2="0"
                        y2="-180"
                        stroke={i % 2 === 0 ? "#4ade80" : "#ffe088"}
                        strokeWidth="3"
                        strokeDasharray="4 6"
                        transform={`rotate(${deg})`}
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from={`${deg}`}
                          to={`${deg + 360}`}
                          dur="6s"
                          repeatCount="indefinite"
                        />
                      </line>
                    ))}
                  </g>
                </g>
              </svg>
            </div>
          )}

          {/* Module Header */}
          <div className="border-b border-[#333333] p-2.5 flex justify-between items-center bg-[#1c1b1b] absolute top-0 left-0 w-full z-10">
            <span className="font-mono text-[9px] md:text-[10px] text-[#8e9192] uppercase tracking-widest">
              MODULE: CONFIRMATION
            </span>
            <span
              className="px-2 py-0.5 font-mono text-[9px] md:text-[10px] uppercase font-bold"
              style={{ color: statusColor }}
            >
              {isNo ? "[PROTOCOL_REVOKED]" : "[PROTOCOL_ACTIVE]"}
            </span>
          </div>

          {/* Confirmation Message */}
          <div className="space-y-2 pt-6 relative z-10">
            <h1
              className="text-xl md:text-3xl font-bold font-mono uppercase tracking-widest glitch-text leading-relaxed"
              style={{ color: statusColor }}
            >
              {isNo
                ? "RESPONSE LOGGED. ACCESS REVOKED. YOU WILL BE MISSED."
                : "RESPONSE LOGGED. SEE YOU IN JAIPUR."}
            </h1>
            <p className="text-sm md:text-lg font-mono text-[#8e9192] tracking-widest uppercase">
              19–20 November 2026
            </p>
            {guestName && (
              <p className="font-mono text-[11px] md:text-xs text-white uppercase tracking-widest">
                GUEST: <span className="font-bold text-[#ffe088]">{guestName}</span>
                {!isNo && ` · ATTENDING: ${guestCount} ${guestCount === "1" ? "GUEST" : "GUESTS"}`}
              </p>
            )}
          </div>

          {/* Synchronized Live Countdown Timer with Strict Tabular Numeric Lock */}
          <div className="grid grid-cols-4 gap-1 md:gap-4 border-y border-[#333333] py-4 md:py-6 relative z-10 bg-black/60 font-mono">
            <div className="flex flex-col items-center border-r border-[#333333]">
              <span
                className="font-mono text-2xl md:text-6xl tracking-widest font-bold tabular-nums inline-block w-full text-center"
                style={{ color: statusColor, fontVariantNumeric: "tabular-nums" }}
              >
                {countdown.days}
              </span>
              <span className="font-mono text-[9px] md:text-[10px] text-[#8e9192] uppercase tracking-widest mt-1">
                DAYS
              </span>
            </div>
            <div className="flex flex-col items-center border-r border-[#333333]">
              <span
                className="font-mono text-2xl md:text-6xl tracking-widest font-bold tabular-nums inline-block w-full text-center"
                style={{ color: statusColor, fontVariantNumeric: "tabular-nums" }}
              >
                {countdown.hours}
              </span>
              <span className="font-mono text-[9px] md:text-[10px] text-[#8e9192] uppercase tracking-widest mt-1">
                HRS
              </span>
            </div>
            <div className="flex flex-col items-center border-r border-[#333333]">
              <span
                className="font-mono text-2xl md:text-6xl tracking-widest font-bold tabular-nums inline-block w-full text-center"
                style={{ color: statusColor, fontVariantNumeric: "tabular-nums" }}
              >
                {countdown.mins}
              </span>
              <span className="font-mono text-[9px] md:text-[10px] text-[#8e9192] uppercase tracking-widest mt-1">
                MIN
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span
                className="font-mono text-2xl md:text-6xl tracking-widest font-bold tabular-nums inline-block w-full text-center"
                style={{ color: statusColor, fontVariantNumeric: "tabular-nums" }}
              >
                {countdown.secs}
              </span>
              <span className="font-mono text-[9px] md:text-[10px] text-[#8e9192] uppercase tracking-widest mt-1">
                SEC
              </span>
            </div>
          </div>

          {/* Redemption and Modify Actions */}
          <div className="flex flex-col items-center justify-center gap-3 relative z-10">
            <div
              className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2"
              style={{ color: statusColor }}
            >
              <span
                className="inline-block w-2 h-2 animate-pulse"
                style={{ backgroundColor: statusColor }}
              />
              System Clock Sync: Active
            </div>

            {/* THE NO PATH REDEMPTION BUTTON */}
            {isNo ? (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic([30, 40]);
                  setConfirmed(false);
                  soundEngine?.setTrack("rsvp_curious");
                }}
                className="mt-2 py-3.5 px-8 border-2 border-[#e9c349] text-[#e9c349] hover:bg-[#e9c349] hover:text-black font-mono text-xs md:text-sm uppercase tracking-widest font-bold transition-all cursor-pointer shadow-[0_0_25px_rgba(233,195,73,0.4)]"
              >
                [ RE-EVALUATE PROTOCOL // CHANGE VOTE ]
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(30);
                  setConfirmed(false);
                  soundEngine?.setTrack("rsvp_curious");
                }}
                className="mt-2 py-3 px-8 border-2 border-white/70 text-white hover:bg-white hover:text-black font-mono text-xs md:text-sm uppercase tracking-widest font-bold transition-all cursor-pointer hover:border-white shadow-[0_0_25px_rgba(255,255,255,0.25)] bg-[#131313]/90"
              >
                [ ↻ MODIFY RESPONSE / RE-VOTE ]
              </button>
            )}
          </div>

          <div className="scan-line z-20" />
        </div>
      )}

      {/* Interactive Multi-Step RSVP Modal with Audio Ducking on Input */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-lg border border-[#333333] bg-[#131313] p-5 md:p-8 relative overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.05)]">
            <div className="scan-line" />

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-5 border-b border-[#333333] pb-3 bg-[#1c1b1b] -mx-5 md:-mx-8 px-5 md:px-8 -mt-5 md:-mt-8 pt-4">
              <span className="font-mono text-[10px] text-white/70 uppercase tracking-widest">
                RSVP_PROTOCOL_v2.0
              </span>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-white hover:text-[#ffb4ab] transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Step 1: Name Input (Audio Ducking on Focus) */}
            {modalStep === "name" && (
              <form onSubmit={handleStep1} classNa