"use client";

import { useEffect, useState, useRef } from "react";
import { soundEngine } from "@/lib/audio/soundEngine";

interface SectorIntroProps {
  onAdvance: () => void;
  onRevealed?: () => void;
}

const REVEAL_PHOTOS = [
  "/reveal-photos/photo-1944.jpg",
  "/reveal-photos/photo-1945.jpg",
  "/reveal-photos/photo-1946.jpg",
  "/reveal-photos/photo-1947.jpg",
  "/reveal-photos/photo-1948.jpg",
  "/reveal-photos/photo-1949.jpg",
  "/reveal-photos/photo-1950.jpg",
  "/reveal-photos/photo-1951.jpg",
  "/reveal-photos/photo-1952.jpg",
  "/reveal-photos/photo-1953.jpg",
  "/reveal-photos/photo-1954.jpg",
  "/reveal-photos/photo-1955.jpg",
  "/reveal-photos/photo-1956.jpg",
  "/reveal-photos/photo-1957.jpg",
  "/reveal-photos/photo-1958.jpg",
  "/reveal-photos/photo-1959.jpg",
];

export function SectorIntro({ onAdvance, onRevealed }: SectorIntroProps) {
  const [typedLines, setTypedLines] = useState<string[]>([]);
  const [currentLineText, setCurrentLineText] = useState("");
  const [typingComplete, setTypingComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [burstActive, setBurstActive] = useState(false);
  const [crestFlicker, setCrestFlicker] = useState(false);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [isPlayingReel, setIsPlayingReel] = useState(true);
  const [isReelHovered, setIsReelHovered] = useState(false);
  const dramaticPlayed = useRef(false);

  const lines = [
    "We're getting married!",
    "Save the Date: 19–20 November 2026",
    "Join us in Jaipur, Rajasthan for 2 days of celebration!"
  ];

  // Typewriter effect
  useEffect(() => {
    let lineIdx = 0;
    let charIdx = 0;
    let isCancelled = false;

    const timeout = setTimeout(() => {
      function typeChar() {
        if (isCancelled) return;

        if (lineIdx < lines.length) {
          const targetLine = lines[lineIdx];
          if (charIdx < targetLine.length) {
            setCurrentLineText(targetLine.slice(0, charIdx + 1));
            soundEngine?.playTypewriterKeystroke();
            charIdx++;
            setTimeout(typeChar, 25 + Math.random() * 30);
          } else {
            setTypedLines((prev) => [...prev, targetLine]);
            setCurrentLineText("");
            lineIdx++;
            charIdx = 0;
            setTimeout(typeChar, 220);
          }
        } else {
          setTypingComplete(true);
        }
      }

      typeChar();
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  // Progress bar animation
  useEffect(() => {
    if (!typingComplete) return;

    let current = 0;
    const interval = setInterval(() => {
      current += 5;
      if (current <= 100) {
        setProgress(current);
        soundEngine?.playTick();
      } else {
        clearInterval(interval);
        setProgress(100);
        soundEngine?.playPing();
      }
    }, 70);

    return () => clearInterval(interval);
  }, [typingComplete]);

  // High-Speed Kinetic Motion Reel with dynamic hover speed boost (200ms normal -> 85ms on hover)
  useEffect(() => {
    if (!revealed || !isPlayingReel) return;

    const intervalDuration = isReelHovered ? 85 : 200;

    const reelInterval = setInterval(() => {
      setCurrentPhotoIdx((prev) => (prev + 1) % REVEAL_PHOTOS.length);
    }, intervalDuration);

    return () => clearInterval(reelInterval);
  }, [revealed, isPlayingReel, isReelHovered]);

  const handleRevealClick = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([60, 80, 100, 120]);
      } catch {}
    }

    setFlashActive(true);
    setBurstActive(true);
    setTimeout(() => setFlashActive(false), 900);
    setTimeout(() => setBurstActive(false), 3000);

    soundEngine?.triggerGrandReveal(() => {
      setRevealed(true);
      if (onRevealed) onRevealed();
    });
  };

  const handleMouseEnterReveal = () => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
      if (!dramaticPlayed.current) {
        soundEngine?.playDramaticAlert();
        dramaticPlayed.current = true;
      }
    }
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine?.playTick();
    setCurrentPhotoIdx((prev) => (prev + 1) % REVEAL_PHOTOS.length);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine?.playTick();
    setCurrentPhotoIdx((prev) => (prev - 1 + REVEAL_PHOTOS.length) % REVEAL_PHOTOS.length);
  };

  const handleAccessLogistics = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(40);
      } catch {}
    }
    soundEngine?.playMechSnap();
    onAdvance();
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-2 md:py-6 px-3 md:px-8 relative min-h-[calc(100dvh-8rem)]">
      {/* Visual Light Flash & Blockbuster Kinetic Energy Shockwave Burst on Reveal */}
      {flashActive && (
        <div className="fixed inset-0 z-[100] bg-white pointer-events-none animate-[fadeOut_0.9s_ease-out_forwards]" />
      )}

      {burstActive && (
        <div className="fixed inset-0 z-[90] pointer-events-none flex items-center justify-center overflow-hidden">
          {/* Shockwave Rings */}
          <div className="absolute w-24 h-24 rounded-full border-4 border-[#e9c349] animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] shadow-[0_0_50px_#e9c349]" />
          <div className="absolute w-40 h-40 rounded-full border-2 border-[#ffb4ab] animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] delay-150 shadow-[0_0_50px_#ffb4ab]" />
          <div className="absolute w-64 h-64 rounded-full border border-cyan-400 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite] delay-300 shadow-[0_0_50px_#38bdf8]" />

          {/* Golden & Rose Spark Fireworks Burst SVG */}
          <svg className="w-full h-full absolute inset-0 mix-blend-screen opacity-90" viewBox="0 0 800 800">
            <g transform="translate(400, 400)">
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
                <g key={i} transform={`rotate(${deg})`}>
                  <circle cx="0" cy="-40" r="4" fill={i % 2 === 0 ? "#e9c349" : "#ffb4ab"}>
                    <animate attributeName="cy" values="-40;-320" dur="1.2s" fill="freeze" />
                    <animate attributeName="r" values="6;0" dur="1.2s" fill="freeze" />
                    <animate attributeName="opacity" values="1;0" dur="1.2s" fill="freeze" />
                  </circle>
                  <line x1="0" y1="-20" x2="0" y2="-280" stroke={i % 3 === 0 ? "#e9c349" : i % 3 === 1 ? "#ffb4ab" : "#38bdf8"} strokeWidth="2" strokeDasharray="6 8">
                    <animate attributeName="stroke-dashoffset" values="0;-100" dur="1.2s" repeatCount="1" />
                    <animate attributeName="opacity" values="1;0" dur="1.2s" fill="freeze" />
                  </line>
                </g>
              ))}
            </g>
          </svg>
        </div>
      )}

      {/* Sector 01 Initial Box (ZERO PHOTOS - PURE MYSTERIOUS TERMINAL) */}
      <div className="w-full border border-[#333333] bg-[#1c1b1b]/60 backdrop-blur-md p-5 md:p-8 relative transition-all duration-500 my-auto">
        <div className="absolute -top-3 left-4 bg-[#333333] font-mono text-[10px] px-2 py-0.5 text-[#e9c349] uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#e9c349] rounded-full animate-ping" />
          <span>[SECTOR_01: SYSTEM_AUTH]</span>
        </div>

        {/* Tactical Terminal Waveform Diagnostic Graphic (NO PHOTOS) */}
        {!revealed && (
          <div className="w-full flex items-center justify-center gap-1.5 py-4 opacity-75">
            {[40, 65, 25, 90, 45, 70, 30, 85, 55, 95, 35, 80, 60, 40, 75, 50, 90, 30].map((h, i) => (
              <span
                key={i}
                style={{ height: `${h * 0.4}px` }}
                className="w-1 bg-[#e9c349]/70 rounded-sm animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Typewriter text display */}
        <div className="mt-2 mb-6 min-h-[85px] md:min-h-[105px] flex items-center justify-center">
          <p className="font-mono text-white mb-2 leading-relaxed max-w-2xl text-center mx-auto text-xs md:text-base">
            {typedLines.map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
            {!typingComplete && (
              <>
                {currentLineText}
                <span className="typewriter-cursor" />
              </>
            )}
            {typingComplete && <span className="typewriter-cursor" />}
          </p>
        </div>

        {/* Progress Bar Indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <span className="font-mono text-[10px] text-[#e9c349] uppercase tracking-widest flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-[#e9c349] rounded-full animate-pulse" />
              {progress < 100 ? "DECRYPTING_SECURE_PAYLOAD..." : "PAYLOAD_DECRYPTED"}
            </span>
            <span className="font-mono text-[10px] text-[#8e9192] uppercase tracking-widest font-bold">
              {progress < 100 ? `${progress}%` : "100% [READY]"}
            </span>
          </div>
          <div className="w-full h-[2px] bg-[#333333] relative overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-[#e9c349] transition-all duration-100 ease-out shadow-[0_0_8px_#e9c349]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Reveal Button */}
        {!revealed && (
          <div className="flex flex-col items-center">
            <div className="flex justify-center mb-2 animate-pulse text-[#e9c349]">
              <span className="material-symbols-outlined text-xl md:text-2xl">
                keyboard_double_arrow_down
              </span>
            </div>
            <button
              type="button"
              id="btn-reveal"
              onClick={handleRevealClick}
              onMouseEnter={handleMouseEnterReveal}
              disabled={progress < 100}
              className={`w-full h-14 md:h-16 border-2 font-mono uppercase tracking-[0.2em] font-bold text-xs md:text-base flex items-center justify-center gap-2 transition-all duration-300 ${
                progress >= 100
                  ? "border-[#e9c349] text-[#e9c349] hover:bg-[#e9c349] hover:text-black btn-pulse-anim cursor-pointer hover:shadow-[0_0_35px_rgba(233,195,73,0.5)]"
                  : "border-[#333333] text-[#8e9192] cursor-not-allowed opacity-50"
              }`}
            >
              [VIEW REVEAL]
            </button>
          </div>
        )}
      </div>

      {/* Expanded Content Reveal: KINETIC MOTION-GRAPHIC SEQUENCE */}
      {revealed && (
        <div className="w-full flex flex-col items-center mt-6 md:mt-10 animate-[fadeIn_0.6s_ease-out]">
          {/* Header Metadata */}
          <div className="w-full flex justify-between items-start font-mono text-[10px] text-[#8e9192] mb-3 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#e9c349] rounded-full animate-ping" />
              <span>REEL: [PROPOSAL_ARCHIVE // {String(currentPhotoIdx + 1).padStart(2, "0")}/16]</span>
            </div>
            <div className="text-right">
              {isReelHovered ? (
                <span className="text-[#e9c349] font-bold">[SPEED: 12.0 FPS // HYPER_DRIVE]</span>
              ) : (
                <span className="text-[#8e9192]">[SPEED: 5.0 FPS // STEADY]</span>
              )}
            </div>
          </div>

          {/* KINETIC MOTION-GRAPHIC PHOTO REEL WITH CENTERED GEOMETRY & COLOR GRADING */}
          <div
            onMouseEnter={() => {
              setIsReelHovered(true);
              setCrestFlicker(true);
              if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
                soundEngine?.playTick();
              }
            }}
            onMouseLeave={() => {
              setIsReelHovered(false);
              setCrestFlicker(false);
            }}
            className="relative w-full max-w-lg aspect-[3/2] border-2 border-[#e9c349]/70 hover:border-[#e9c349] p-1.5 md:p-2 flex flex-col items-center justify-center mb-3 bg-[#0e0e0e] backdrop-blur-xl mx-auto transition-all duration-300 group shadow-[0_0_35px_rgba(0,0,0,0.9)] hover:shadow-[0_0_50px_rgba(233,195,73,0.35)] cursor-pointer rounded-sm overflow-hidden"
          >
            {/* Top Telemetry Tag with Dynamic Zoom Indicator */}
            <div className="absolute top-2.5 left-2.5 z-20 font-mono text-[9px] text-[#e9c349] bg-black/85 px-2.5 py-0.5 border border-[#e9c349]/40 flex items-center gap-1.5 shadow-md">
              <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse" />
              <span>FRAME: {1944 + currentPhotoIdx} // ZOOM: {(1.0 + (currentPhotoIdx / (REVEAL_PHOTOS.length - 1)) * 0.52).toFixed(2)}x</span>
            </div>

            {crestFlicker && (
              <div className="absolute top-2.5 right-2.5 z-20 font-mono text-[8px] md:text-[9px] text-pink-300 bg-black/90 px-2.5 py-0.5 border border-pink-500/60 animate-pulse tracking-widest shadow-md">
                [♥ LOVE_PROTOCOL_ACTIVE ♥]
              </div>
            )}

            {/* ROCK-SOLID STABLE FRAME CONTAINER - PROGRESSIVE ZOOM INTO CENTER SUBJECTS */}
            <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
              {REVEAL_PHOTOS.map((src, idx) => {
                const frameZoom = 1.0 + (idx / (REVEAL_PHOTOS.length - 1)) * 0.52;
                return (
                  <div
                    key={src}
                    style={{
                      visibility: idx === currentPhotoIdx ? "visible" : "hidden",
                      opacity: idx === currentPhotoIdx ? 1 : 0,
                    }}
                    className="absolute inset-0 z-10 overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`Janhvi and Krish Proposal Memory ${idx + 1}`}
                      style={{
                        objectFit: "cover",
                        objectPosition: "center 38%",
                        transform: `scale(${frameZoom})`,
                        transformOrigin: "center 38%",
                      }}
                      className="w-full h-full filter contrast-[1.14] brightness-[0.96] saturate-[1.15]"
                      src={src}
                    />
                  </div>
                );
              })}

              {/* Ambient Golden/Rose Film Grading Overlay (Matches App Theme) */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/70 via-transparent to-[#e9c349]/10 pointer-events-none mix-blend-overlay z-20" />

              {/* Corner HUD Reticle Crosshairs */}
              <div className="absolute top-2 left-2 text-[#e9c349] font-mono text-[10px] z-20 pointer-events-none">+</div>
              <div className="absolute top-2 right-2 text-[#e9c349] font-mono text-[10px] z-20 pointer-events-none">+</div>
              <div className="absolute bottom-2 left-2 text-[#e9c349] font-mono text-[10px] z-20 pointer-events-none">+</div>
              <div className="absolute bottom-2 right-2 text-[#e9c349] font-mono text-[10px] z-20 pointer-events-none">+</div>

              {/* CRT Scanline */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-white opacity-40 shadow-[0_0_10px_#ffffff] animate-[scan_3s_ease-in-out_infinite] z-20 pointer-events-none" />

              {/* Romantic Pink Glow overlay on hover */}
              {crestFlicker && (
                <div className="absolute inset-0 bg-pink-500/10 pointer-events-none mix-blend-screen animate-pulse z-20" />
              )}
            </div>

            {/* Interactive Reel Controls Overlay */}
            <div className="absolute bottom-2 left-2 right-2 z-20 flex justify-between items-center bg-black/85 backdrop-blur-md px-3 py-1 border border-[#333333]">
              <button
                type="button"
                onClick={handlePrevPhoto}
                className="font-mono text-[10px] text-[#e9c349] hover:text-white transition-colors cursor-pointer px-2 py-0.5 uppercase tracking-wider"
              >
                [◄ PREV]
              </button>

              {/* Reel Play/Pause Toggle & Speed Indication */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundEngine?.playTick();
                  setIsPlayingReel((prev) => !prev);
                }}
                className="font-mono text-[9px] text-[#8e9192] hover:text-white uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs text-[#e9c349]">
                  {isPlayingReel ? "pause" : "play_arrow"}
                </span>
                <span>{isPlayingReel ? (isReelHovered ? "HYPER_SPEED" : "AUTO_PLAY") : "PAUSED"}</span>
              </button>

              <button
                type="button"
                onClick={handleNextPhoto}
                className="font-mono text-[10px] text-[#e9c349] hover:text-white transition-colors cursor-pointer px-2 py-0.5 uppercase tracking-wider"
              >
                [NEXT ►]
              </button>
            </div>
          </div>

          {/* Photo Timeline Indicator Dots */}
          <div className="flex items-center justify-center gap-1 mb-6 max-w-lg w-full px-4">
            {REVEAL_PHOTOS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  soundEngine?.playTick();
                  setCurrentPhotoIdx(idx);
                }}
                aria-label={`Jump to photo ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                  idx === currentPhotoIdx
                    ? "w-6 bg-[#e9c349] shadow-[0_0_8px_#e9c349]"
                    : "w-1.5 bg-[#333333] hover:bg-white/60"
                }`}
              />
            ))}
          </div>

          {/* Typography & Status Box */}
          <div className="text-center w-full flex flex-col items-center gap-4 md:gap-6 mb-8">
            <h1 className="font-mono text-4xl md:text-7xl text-[#ffb4ab] glitch-effect tracking-tighter w-full max-w-3xl leading-tight font-bold mx-auto text-center uppercase">
              Janhvi
              <br />
              &amp;
              <br />
              Krish
            </h1>

            <div className="bg-[#1c1b1b] px-3 py-2.5 md:px-4 md:py-3 flex items-center gap-3 border border-[#333333] max-w-lg mx-auto">
              <span className="material-symbols-outlined text-base md:text-lg text-[#ffb4ab] shrink-0">
                warning
              </span>
              <span className="font-mono text-[10px] md:text-xs text-white uppercase tracking-widest text-left leading-relaxed">
                19–20 NOVEMBER 2026 // JAIPUR, RAJASTHAN
              </span>
            </div>
          </div>

          {/* Action Button: Proceed to Logistics */}
          <div className="w-full max-w-md pb-safe mx-auto">
            <div className="font-mono text-[10px] text-[#8e9192] mb-2 uppercase tracking-widest">
              AWAITING_INPUT<span className="typewriter-cursor" />
            </div>
            <button
              type="button"
              onClick={handleAccessLogistics}
              className="w-full h-14 md:h-16 border-2 border-white text-white font-mono text-xs md:text-base hover:bg-white hover:text-black text-center tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-300 group font-bold glitch-hover uppercase cursor-pointer"
            >
              <span className="material-symbols-outlined text-base md:text-lg group-hover:rotate-12 transition-transform">
                lock_open
              </span>
              [ACCESS LOGISTICS]
              <span className="font-mono text-xs md:text-sm opacity-50 group-hover:opacity-100 transition-opacity">
                &gt;&gt;&gt;
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
