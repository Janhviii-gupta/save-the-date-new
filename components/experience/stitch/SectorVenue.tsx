"use client";

import { useEffect, useState } from "react";
import { soundEngine } from "@/lib/audio/soundEngine";

interface SectorVenueProps {
  onAdvance: () => void;
}

export function SectorVenue({ onAdvance }: SectorVenueProps) {
  const [line2Visible, setLine2Visible] = useState(false);
  const [line3Visible, setLine3Visible] = useState(false);
  const [lockAcquired, setLockAcquired] = useState(false);

  useEffect(() => {
    soundEngine?.triggerTargetLockedCue();

    const t1 = setTimeout(() => {
      setLine2Visible(true);
      soundEngine?.playTypewriterKeystroke();
    }, 600);

    const t2 = setTimeout(() => {
      setLockAcquired(true);
      setLine3Visible(true);
      soundEngine?.playMechSnap();
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleAdvance = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(35);
      } catch {}
    }
    soundEngine?.playMechSnap();
    onAdvance();
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col py-3 md:py-6 px-3 md:px-8">
      {/* Terminal Frame */}
      <div className="flex-grow flex flex-col border border-[#333333] bg-[#0e0e0e] overflow-hidden">
        {/* Terminal Header */}
        <div className="h-8 border-b border-[#333333] flex justify-between items-center px-4 bg-[#1c1b1b]">
          <span className="font-mono text-[10px] text-white tracking-[0.2em] uppercase">
            [LOCATION_SCANNED]
          </span>
          <span className="font-mono text-[10px] text-[#8e9192] tracking-[0.2em] uppercase">
            [SECTOR_03]
          </span>
        </div>

        {/* Hero Image Block with Animated HUD Targeting Reticle */}
        <div className="relative bg-[#0e0e0e] min-h-[48vh] md:min-h-[58vh] flex flex-col group overflow-hidden aspect-video">
          {/* Live Status indicator */}
          <div className="absolute top-3 left-3 md:top-4 md:left-4 z-20 bg-[#201f1f]/90 px-3 py-1 flex items-center space-x-2 backdrop-blur-sm border border-[#333333]">
            <span className="w-2 h-2 bg-[#4ade80] rounded-full animate-ping" />
            <span className="font-mono text-[9px] text-[#4ade80] uppercase tracking-widest font-bold">
              LIVE_FEED
            </span>
          </div>

          {/* Target Coordinates Tag */}
          <div className="absolute top-3 right-3 md:top-4 md:right-4 z-20 bg-[#131313]/90 px-3 py-1 border border-[#333333] font-mono text-[9px] text-[#8e9192] uppercase tracking-widest">
            COORDS: 27.1425° N, 75.9520° E
          </div>

          {/* Background image */}
          <div className="absolute inset-0 w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Achrol Niwas Treehouse Scan"
              className="w-full h-full object-cover opacity-75 mix-blend-screen filter contrast-125 block"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZyg5WNBCsUyGT3ua9vG5xCuMdMyM1Vb_NBx-fi3NSDy-1CaNNBNcg1q1Xl93TajO7v6RaXdQy_e6gPoFTPdU0r4DZZ0ETSVpzEFION5j_BhYOfGe7NQEKG7qmkDGiNdvMI1MwXWpulXAEevGHD5dMjtMh63UC2UHGWJh2FdYCKvEZotZPXtOKrn5BFtpJkc0ojMidpkOhI-YG5SSlU2OTuiMG13hL7WaBJwZg4-iwVCBhha4aw1_23g"
            />
          </div>

          {/* ACTIVE ANIMATED TARGETING RETICLE & LOCK OVERLAY */}
          <div className="absolute inset-0 p-4 md:p-8 flex flex-col justify-center items-center pointer-events-none">
            {/* Top Telemetry Lock Badge */}
            {lockAcquired && (
              <div className="mb-3 animate-[fadeIn_0.3s_ease-out] z-30">
                <span className="bg-[#e9c349] text-black font-mono font-bold text-[10px] md:text-xs uppercase tracking-[0.25em] px-3.5 py-1 shadow-[0_0_25px_rgba(233,195,73,0.7)]">
                  [ TARGET ACQUIRED // LOCK CONFIRMED ]
                </span>
              </div>
            )}

            {/* Rotating Radar Rings behind text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <div className="w-72 h-72 md:w-96 md:h-96 border border-[#e9c349]/40 rounded-full animate-[spin_20s_linear_infinite] relative">
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-[#e9c349]" />
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-[#e9c349]" />
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-[#e9c349]" />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-[#e9c349]" />
              </div>
            </div>

            {/* PROMINENT, UNMISTAKABLE YET CLEANLY FRAMED VENUE & DATE CARDS */}
            <div className="flex flex-col gap-2.5 md:gap-3.5 z-20 w-full max-w-lg px-2 pointer-events-auto">
              {/* WHERE - CLICKABLE TO OPEN GMAPS */}
              <a
                href="https://www.google.com/maps/search/?api=1&query=Achrol+Niwas+A+TreeHouse+Resort+Jaipur"
                target="_blank"
                rel="noopener noreferrer"
                title="Click to open Achrol Niwas in Google Maps"
                className="backdrop-blur-md py-3 px-5 md:py-4 md:px-6 bg-[#0e0e0e]/90 border border-white/20 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.35)] transition-all flex flex-col items-center text-center shadow-2xl relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute top-0 left-0 bg-[#222222] group-hover:bg-cyan-950/80 px-2 py-0.5 font-mono text-[8px] md:text-[9px] text-[#8e9192] group-hover:text-cyan-300 uppercase tracking-widest border-r border-b border-[#333333] transition-colors">
                  SECTOR_COORDINATES // ACHROL NIWAS
                </div>
                <div className="absolute top-0 right-0 px-2 py-0.5 font-mono text-[8px] md:text-[9px] text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest uppercase flex items-center gap-1">
                  <span>OPEN GMAPS</span>
                  <span className="text-[10px]">↗</span>
                </div>
                <span className="font-mono text-[10px] md:text-xs text-[#8e9192] group-hover:text-cyan-300 uppercase tracking-[0.25em] mt-2 mb-1 transition-colors">
                  WHERE // MISSION LOCATION (RESORT)
                </span>
                <span className="font-mono text-base md:text-2xl font-bold text-white group-hover:text-cyan-300 uppercase tracking-[0.15em] leading-snug transition-colors">
                  Achrol Niwas, Jaipur
                </span>
                <span className="font-mono text-[8px] md:text-[9px] text-cyan-400 mt-1 uppercase tracking-widest opacity-80 group-hover:opacity-100 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">near_me</span>
                  [ TAP TO LAUNCH GMAPS SATELLITE NAV ↗ ]
                </span>
              </a>

              {/* WHEN */}
              <div className="backdrop-blur-md py-3 px-5 md:py-4 md:px-6 bg-[#0e0e0e]/90 border border-white/20 hover:border-[#e9c349]/80 transition-all flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 bg-[#222222] px-2 py-0.5 font-mono text-[8px] md:text-[9px] text-[#e9c349] uppercase tracking-widest border-r border-b border-[#333333]">
                  TIMELINE_LOCK
                </div>
                <span className="font-mono text-[10px] md:text-xs text-[#8e9192] uppercase tracking-[0.25em] mt-2 mb-1">
                  WHEN // EVENT DATES
                </span>
                <span className="font-mono text-base md:text-2xl font-bold text-[#e9c349] uppercase tracking-[0.15em] leading-snug">
                  19–20 November 2026
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Calculation Block */}
        <div className="bg-[#1c1b1b] p-4 md:p-8 flex flex-col justify-center min-h-[160px] md:min-h-[200px] border-t border-[#333333]">
          <div className="font-mono text-[9px] md:text-[10px] text-[#8e9192] mb-3 flex items-center space-x-2 tracking-widest uppercase">
            <span className="material-symbols-outlined text-[14px]">memory</span>
            <span>SYSTEM_CALCULATION_LOG</span>
          </div>
          <div className="font-mono text-xs md:text-sm text-white space-y-3">
            <p className="opacity-90 tracking-wider text-xs md:text-sm">
              &gt; Initializing sequence...
            </p>
            {line2Visible && (
              <p className="opacity-90 tracking-wider text-xs md:text-sm animate-[fadeIn_0.3s_ease-out]">
                &gt; Querying geographic delta: JAIPUR_COORDS_LOCKED...
              </p>
            )}
            {line3Visible && (
              <div className="flex items-start mt-1 animate-[fadeIn_0.3s_ease-out]">
                <span className="mr-2 text-[#e9c349]">&gt;</span>
                <p className="text-[#e9c349] leading-loose tracking-wider">
                  <span className="bg-[#e9c349]/10 px-2.5 py-1.5 inline-block border border-[#e9c349]/30 text-xs md:text-sm font-bold">
                    Calculating probability of pure chaos: 9,999.99% (CRITICAL)
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Button Block */}
        <div className="bg-[#0e0e0e] p-4 md:p-8 flex flex-col justify-center items-center border-t border-[#333333]">
          <div className="w-full max-w-md mx-auto">
            <button
              type="button"
              onClick={handleAdvance}
              className="w-full border-2 border-white text-white font-mono text-xs md:text-base py-4 md:py-5 hover:bg-white hover:text-black text-center tracking-[0.2em] flex flex-col items-center justify-center gap-1 transition-all duration-300 group uppercase font-bold bg-transparent cursor-pointer"
            >
              <span className="group-hover:scale-105 transition-transform">
                [PROCEED_TO_RSVP]
              </span>
              <span className="font-mono text-[9px] md:text-[10px] opacity-50 group-hover:opacity-100 transition-opacity">
                &gt;&gt;&gt;
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
