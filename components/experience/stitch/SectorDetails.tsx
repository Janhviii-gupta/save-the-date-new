"use client";

import { useEffect } from "react";
import { soundEngine } from "@/lib/audio/soundEngine";

interface SectorDetailsProps {
  onAdvance: () => void;
}

export function SectorDetails({ onAdvance }: SectorDetailsProps) {
  useEffect(() => {
    soundEngine?.setTrack("tactical_spy");
  }, []);

  const triggerHaptic = (ms: number = 30) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  };

  const handleCardClick = () => {
    triggerHaptic(25);
    soundEngine?.playPing();
  };

  const handleCardHover = () => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
      soundEngine?.playClick();
    }
  };

  const handleAdvance = () => {
    triggerHaptic(40);
    soundEngine?.playMechSnap();
    onAdvance();
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col py-3 md:py-6 px-3 md:px-8">
      {/* Header Section */}
      <div className="flex flex-col gap-2 md:gap-3 w-full mb-6 md:mb-8">
        <div className="flex items-center gap-2">
          <div className="h-[1px] bg-[#333333] flex-grow" />
          <span className="font-mono text-[9px] md:text-[10px] uppercase text-[#8e9192] tracking-[0.2em]">
            [MISSION_MANIFEST // 5 CLASSIFIED SEGMENTS]
          </span>
          <div className="h-[1px] bg-[#333333] w-12" />
        </div>

        <h1 className="font-mono text-xl md:text-3xl text-white uppercase tracking-widest flex items-center gap-2 font-bold">
          MISSION_PARAMETERS <span className="blinking-caret text-white" />
        </h1>
        <p className="font-mono text-[11px] md:text-xs text-[#8e9192] max-w-2xl uppercase tracking-widest leading-relaxed">
          Analyzing current event parameters. Please review critical updates below.
        </p>
      </div>

      {/* Diagnostics Grid - All 5 Cards with Cyan Glow & Elevation Hover States */}
      <div className="flex flex-col gap-3.5 md:gap-4 max-w-5xl">
        {/* Card 1: Calendar Threat Level */}
        <div
          onClick={handleCardClick}
          onMouseEnter={handleCardHover}
          className="glass-panel hairline-border flex flex-col sm:flex-row w-full group relative overflow-hidden items-stretch cursor-pointer hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.35)] transform hover:-translate-y-1 transition-all duration-300"
        >
          <div className="absolute top-0 left-0 bg-[#333333] group-hover:bg-cyan-950/80 px-2 py-1 z-10 hidden md:flex items-center gap-2 transition-colors border-r border-b border-[#333333] group-hover:border-cyan-400/50">
            <span className="font-mono text-[10px] text-white group-hover:text-cyan-300 transition-colors">DATA_SEGMENT_01</span>
            <span className="font-mono text-[9px] text-[#ffb4ab] group-hover:text-cyan-300 border border-[#ffb4ab]/40 group-hover:border-cyan-400/80 px-1.5 py-0.2 transition-colors">[ THREAT: HIGH ]</span>
          </div>
          <div className="w-full sm:w-40 md:w-64 h-40 sm:h-auto shrink-0 relative border-b sm:border-b-0 sm:border-r border-[#333333] group-hover:border-cyan-400/40 transition-colors">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Calendar Threat Level"
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida/AEtjO1WFkaHOPo0OQ1AGYzFCvgWtHoNeY091i96FtV0Ska9vjRy4wykpmJsZExK5ff_SIuQ7DzdbWYaRaufulU7OB-40MNHiDe2QnYZawnfhtqUSg8QmvggIYEj4-Obn5PzI88YLojC37WDhih0SHMB680qMR7co979T1wKGq03C6sFjcckvXZAuqgrLzvCnkLuzXv9OyiCqqX2oIAjXih2rySAnKfYYySsmxI4uxmuTWg0XeoikItIOb-n7dMM"
            />
            <div className="absolute inset-0 bg-[#ffb4ab]/10 mix-blend-overlay group-hover:bg-cyan-400/10 transition-colors" />
          </div>
          <div className="flex-grow p-4 md:p-8 flex flex-col justify-center gap-2 overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#ffb4ab] group-hover:text-cyan-300 text-lg shrink-0 mt-[2px] transition-colors">
                  warning
                </span>
                <h2 className="font-mono text-xs md:text-base text-[#ffb4ab] group-hover:text-cyan-300 uppercase tracking-[0.15em] leading-relaxed font-bold transition-colors">
                  Calendar Threat Level: Maximum
                </h2>
              </div>
              <span className="md:hidden font-mono text-[9px] text-[#ffb4ab] group-hover:text-cyan-300 border border-[#ffb4ab]/40 group-hover:border-cyan-400/80 px-1.5 py-0.5 shrink-0 transition-colors">
                [ THREAT: HIGH ]
              </span>
            </div>
            <p className="font-sans text-xs md:text-sm text-[#e5e2e1] leading-relaxed mt-1">
              Clear your November right now. The timeline is fixed. No deviations permitted.
            </p>
          </div>
        </div>

        {/* Card 2: Wardrobe Planning - SLEEK & BALANCED ELEGANT FEATURE CARD */}
        <div
          onClick={handleCardClick}
          onMouseEnter={handleCardHover}
          className="glass-panel border-2 border-[#e9c349]/80 shadow-[0_0_30px_rgba(233,195,73,0.15)] flex flex-col w-full group relative overflow-hidden items-stretch cursor-pointer hover:border-[#e9c349] hover:shadow-[0_0_40px_rgba(233,195,73,0.3)] transform hover:-translate-y-0.5 transition-all duration-300 rounded-sm"
        >
          <div className="bg-[#1c1b1b] p-2.5 md:px-5 md:py-2.5 border-b border-[#333333] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] md:text-[11px] text-white font-bold tracking-widest">[MISSION_MANIFEST // DATA_SEGMENT_02]</span>
            </div>
            <span className="bg-[#e9c349] text-black font-mono font-bold text-[8px] md:text-[9px] px-2 py-0.5 tracking-widest uppercase shadow-[0_0_12px_rgba(233,195,73,0.5)]">
              ★ PRIMARY DIRECTIVE // WARDROBE PLANNING ★
            </span>
          </div>

          <div className="p-3.5 md:p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#e9c349] text-xl shrink-0">
                  checkroom
                </span>
                <h2 className="font-mono text-sm md:text-lg text-[#e9c349] uppercase tracking-[0.15em] font-bold">
                  Wardrobe Protocol: Mandatory Dress Codes
                </h2>
              </div>
            </div>

            {/* 3 THEMATIC TILES (CARNIVAL, PRE-WEDDING GALA, SHAADI) WITH HOVER DRESS THEME CUES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 md:gap-3.5 mt-0.5">
              {/* Event 01: Carnival (Yellow) */}
              <div className="flex flex-col bg-[#131313]/95 border border-[#e9c349]/50 hover:border-[#e9c349] p-2.5 md:p-3 rounded-sm transition-all group/tile shadow-md relative overflow-hidden">
                <div className="w-full h-28 md:h-36 overflow-hidden border border-[#333333] mb-2 relative rounded-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Carnival Ceremony"
                    className="w-full h-full object-cover group-hover/tile:scale-105 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5DF2g3lIyKeJFuwJimWX26O3CQZEmjaJp6nvA40wJsQlFfZ9K9rTdN13fZ7HqpHZN0aKhTxlbysPKGTC6UnfDb0Wqcv4uJJcSTGMF2fAdR1-ukcF0oQMquBtdxPnp3iLaTI87L0M2ysM4c39JJliOaCyXSYvPDcwWa8Z3gDzJQqzbN96kIcRjZ72OO9LXT8OF6E7FTP_mxxcI6YW8acEZvuRanaW7kXU66oK-bsWKinM7uRlW3bUnZCetX7TZToOp7MrXnYjQ9hQ5zok"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-[#e9c349] text-black font-mono text-[8px] font-bold px-1.5 py-0.2 tracking-wider uppercase">
                    EVENT 01
                  </div>
                  {/* Interactive Hover Theme Badge */}
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover/tile:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-2 text-center">
                    <span className="font-mono text-[10px] md:text-xs font-bold text-[#e9c349] bg-[#e9c349]/20 border border-[#e9c349] px-2 py-0.5 uppercase tracking-widest mb-1 animate-pulse">
                      [ THEME: YELLOW ]
                    </span>
                    <span className="font-sans text-[10px] text-white/90 leading-tight">
                      Sunshine yellows, vibrant florals & flowy pastels
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs md:text-sm font-bold text-white uppercase tracking-wider">CARNIVAL</span>
                  <span className="font-mono text-[10px] font-bold text-[#e9c349] bg-[#e9c349]/10 px-1.5 py-0.2 border border-[#e9c349]/40 uppercase tracking-widest">YELLOW</span>
                </div>
                <p className="font-mono text-[9px] md:text-[10px] text-[#8e9192] uppercase tracking-wider mt-1 leading-relaxed">
                  Sun-drenched yellows, mustard silks, and vibrant floral prints.
                </p>
              </div>

              {/* Event 02: Pre-wedding Gala (Indo-western Bling) */}
              <div className="flex flex-col bg-[#131313]/95 border border-cyan-400/50 hover:border-cyan-400 p-2.5 md:p-3 rounded-sm transition-all group/tile shadow-md relative overflow-hidden">
                <div className="w-full h-28 md:h-36 overflow-hidden border border-[#333333] mb-2 relative rounded-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Pre-wedding Gala"
                    className="w-full h-full object-cover group-hover/tile:scale-105 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAx4d4TI_ImyFBCdpvWKVnQfumFe40BDzFEK3CBlhksESeIj9awBhW00qnP71kfV30cE82_5Yqwnpjy6NiyO2r3kxfImOzzSBz6stSP1dkzWKe-8x5J17BtIPyZXu0fexcw5Uy834ESVH5mziQCJyqdRkT19mSXsOIz4eYazQwfhtloNLoYCQCWlaYlc1u0mx5fADj8It3fXmMG6uAf4qaY9B7ne4hKpnVpHfPIQxCK3HrMNRqjAXhchmLTIEaQeLlky5qzQQ77jJqrTZM"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-cyan-400 text-black font-mono text-[8px] font-bold px-1.5 py-0.2 tracking-wider uppercase">
                    EVENT 02
                  </div>
                  {/* Interactive Hover Theme Badge */}
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover/tile:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-2 text-center">
                    <span className="font-mono text-[10px] md:text-xs font-bold text-cyan-300 bg-cyan-400/20 border border-cyan-400 px-2 py-0.5 uppercase tracking-widest mb-1 animate-pulse">
                      [ THEME: INDO-WESTERN BLING ]
                    </span>
                    <span className="font-sans text-[10px] text-white/90 leading-tight">
                      Metallic sequins, tuxedo cuts & cocktail glamour
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs md:text-sm font-bold text-white uppercase tracking-wider">PRE-WEDDING GALA</span>
                  <span className="font-mono text-[10px] font-bold text-cyan-300 bg-cyan-400/10 px-1.5 py-0.2 border border-cyan-400/40 uppercase tracking-widest">INDO-WESTERN BLING</span>
                </div>
                <p className="font-mono text-[9px] md:text-[10px] text-[#8e9192] uppercase tracking-wider mt-1 leading-relaxed">
                  Sequins, metallic accents, high-voltage glamour, and modern fusion.
                </p>
              </div>

              {/* Event 03: Shaadi (Traditional) */}
              <div className="flex flex-col bg-[#131313]/95 border border-[#ffb4ab]/50 hover:border-[#ffb4ab] p-2.5 md:p-3 rounded-sm transition-all group/tile shadow-md relative overflow-hidden">
                <div className="w-full h-28 md:h-36 overflow-hidden border border-[#333333] mb-2 relative rounded-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Shaadi Royal Traditional"
                    className="w-full h-full object-cover group-hover/tile:scale-105 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA51TQ5aGwJXrv11BDkwnADtlIbYUdm2hVaVm89N1Zxii5CF9nUtLFBKtFmR66xY_yTj2bQiR_vY3HrdrUnAUKScwWIqE81AO29U7NNVSZ8v-ef03-DgZI-dc_Kt6VTWiSGdAa-KFtyTCxI0xvCQEk0ic1bS2E88zxzpXs82gqQbMQamb4UfB1JgpgkSoIOIMCCSmmmKF3ovMSSoTOsXtrk5bdLjtx8WeWUta77e9Z68B3-BkMFrydpB9SBWbcfp-1nEb6m8iv2Gg2uRIU"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-[#ffb4ab] text-black font-mono text-[8px] font-bold px-1.5 py-0.2 tracking-wider uppercase">
                    EVENT 03
                  </div>
                  {/* Interactive Hover Theme Badge */}
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover/tile:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-2 text-center">
                    <span className="font-mono text-[10px] md:text-xs font-bold text-[#ffb4ab] bg-[#ffb4ab]/20 border border-[#ffb4ab] px-2 py-0.5 uppercase tracking-widest mb-1 animate-pulse">
                      [ THEME: TRADITIONAL ]
                    </span>
                    <span className="font-sans text-[10px] text-white/90 leading-tight">
                      Royal sherwanis, classic lehengas & heritage silks
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs md:text-sm font-bold text-white uppercase tracking-wider">SHAADI</span>
                  <span className="font-mono text-[10px] font-bold text-[#ffb4ab] bg-[#ffb4ab]/10 px-1.5 py-0.2 border border-[#ffb4ab]/40 uppercase tracking-widest">TRADITIONAL</span>
                </div>
                <p className="font-mono text-[9px] md:text-[10px] text-[#8e9192] uppercase tracking-wider mt-1 leading-relaxed">
                  Opulent silks, royal brocades, jewel tones, and timeless heritage.
                </p>
              </div>
            </div>

            <p className="font-sans text-[11px] md:text-xs text-[#e5e2e1] leading-relaxed bg-[#131313] p-2.5 border border-[#333333] rounded-sm">
              💡 <strong>Directive:</strong> Start shopping now, because wedding outfits take longer to stitch than a government project.
            </p>
          </div>
        </div>

        {/* Card 3: Dance Floor Situation */}
        <div
          onClick={handleCardClick}
          onMouseEnter={handleCardHover}
          className="glass-panel hairline-border flex flex-col sm:flex-row w-full group relative overflow-hidden items-stretch cursor-pointer hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.35)] transform hover:-translate-y-1 transition-all duration-300"
        >
          <div className="absolute top-0 left-0 bg-[#333333] group-hover:bg-cyan-950/80 px-2 py-1 z-10 hidden md:flex items-center gap-2 transition-colors border-r border-b border-[#333333] group-hover:border-cyan-400/50">
            <span className="font-mono text-[10px] text-white group-hover:text-cyan-300 transition-colors">DATA_SEGMENT_03</span>
            <span className="font-mono text-[9px] text-[#4ade80] group-hover:text-cyan-300 border border-[#4ade80]/40 group-hover:border-cyan-400/80 px-1.5 py-0.2 transition-colors">[ TELEMETRY: MONITORED ]</span>
          </div>
          <div className="w-full sm:w-40 md:w-64 h-40 sm:h-auto shrink-0 relative border-b sm:border-b-0 sm:border-r border-[#333333] group-hover:border-cyan-400/40 transition-colors">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Dance Floor Situation"
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida/AEtjO1XB4IXvLxw17GxnehBkl6ygw7Svdsx6dmFb5Ey6IhgKJOGzQcfWgBq80w1uBVxNQUwdBvMvNR6FrYfmdxy9uHL-CtHv7zBU1yQSRDzHbikoDuyNoDx4W2o6Y8B85APgHS6BS3Msu2xFG7zBil0maGdtvsSpVvJVDjERQpHvUyImrDs7GtwuU2tgKjTCSbAP8vsJOjOahPssEp4jZak4yiPHelqb0OjTpqtrbFoxeLxzIntOIGKNKk0yp_c1"
            />
          </div>
          <div className="flex-grow p-4 md:p-8 flex flex-col justify-center gap-2 overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#4ade80] group-hover:text-cyan-300 text-lg shrink-0 mt-[2px] transition-colors">
                  graphic_eq
                </span>
                <h2 className="font-mono text-xs md:text-base text-[#4ade80] group-hover:text-cyan-300 uppercase tracking-[0.15em] leading-relaxed font-bold transition-colors">
                  Dance Floor Situation: High Energy
                </h2>
              </div>
              <span className="md:hidden font-mono text-[9px] text-[#4ade80] group-hover:text-cyan-300 border border-[#4ade80]/40 group-hover:border-cyan-400/80 px-1.5 py-0.5 shrink-0 transition-colors">
                [ TELEMETRY: MONITORED ]
              </span>
            </div>
            <p className="font-sans text-xs md:text-sm text-[#e5e2e1] leading-relaxed mt-1">
              Krish &amp; Janhvi are going to tear it up so hard, even the elders will find themselves tapping their feet.
            </p>
          </div>
        </div>

        {/* Card 4: Jaipur Weather 