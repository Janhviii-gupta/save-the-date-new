"use client";

import { useEffect, useState } from "react";
import { soundEngine } from "@/lib/audio/soundEngine";
import type { BootstrapPayload, RsvpResponse } from "@/lib/validation/rsvp";
import { AudioBypassGate } from "./stitch/AudioBypassGate";
import { TopBar } from "./stitch/TopBar";
import { SectorIntro } from "./stitch/SectorIntro";
import { SectorDetails } from "./stitch/SectorDetails";
import { SectorVenue } from "./stitch/SectorVenue";
import { SectorRsvp } from "./stitch/SectorRsvp";

interface ExperienceControllerProps {
  bootstrap?: BootstrapPayload | null;
}

export function ExperienceController({ bootstrap }: ExperienceControllerProps) {
  const [currentSector, setCurrentSector] = useState<"intro" | "details" | "venue" | "rsvp">("intro");
  const [gateBypassed, setGateBypassed] = useState(false);
  const [isRevealed, setIsRevealed] = useState(Boolean(bootstrap?.currentRsvp));
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // If user already RSVP'd, start on RSVP screen and set revealed
    if (bootstrap?.currentRsvp) {
      setCurrentSector("rsvp");
      setIsRevealed(true);
    }
  }, [bootstrap]);

  const handleBypassGate = () => {
    setGateBypassed(true);
  };

  const handleSelectSector = (sector: "intro" | "details" | "venue" | "rsvp") => {
    if (sector === currentSector) return;
    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentSector(sector);
      if (sector !== "intro") {
        setIsRevealed(true);
      }

      if (sector === "intro") {
        if (isRevealed) {
          soundEngine?.startRomanticLoveTheme();
        } else {
          soundEngine?.setTrack("espionage_suspense");
        }
      } else if (sector === "details") {
        soundEngine?.setTrack("tactical_spy");
      } else if (sector === "venue") {
        soundEngine?.triggerTargetLockedCue();
      } else if (sector === "rsvp") {
        soundEngine?.setTrack("rsvp_curious");
      }

      window.scrollTo({ top: 0, behavior: "smooth" });

      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };

  const handleRsvpSubmitted = (response: RsvpResponse) => {
    if (response === "no") {
      soundEngine?.setTrack("deadpan_regret");
    } else {
      soundEngine?.setTrack("party_celebration");
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#050505] text-[#e5e2e1] relative selection:bg-white selection:text-black overflow-x-hidden">
      {/* ATMOSPHERIC CRT SCANLINE & CHROMATIC ABERRATION VIGNETTE */}
      <div className="pointer-events-none fixed inset-0 z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-35" />
      <div className="pointer-events-none fixed inset-0 z-40 shadow-[inset_0_0_90px_rgba(0,0,0,0.85)]" />

      {/* System Audio Bypass Gate Modal */}
      {!gateBypassed && <AudioBypassGate onBypass={handleBypassGate} />}

      {/* Top App Bar with Sleek Audio Toggle */}
      <TopBar currentSector={currentSector} isRevealed={isRevealed} />

      {/* Main Content Area with Kinetic Momentum Transition */}
      <main
        className={`flex-grow pt-16 pb-20 md:pt-20 md:pb-24 px-2 md:px-6 flex flex-col items-center justify-start w-full transition-all duration-300 ease-out transform ${
          isTransitioning
            ? "opacity-60 scale-95 translate-y-1"
            : "opacity-100 scale-100 translate-y-0"
        }`}
      >
        {currentSector === "intro" && (
          <SectorIntro
            onAdvance={() => handleSelectSector("details")}
            onRevealed={() => setIsRevealed(true)}
          />
        )}
        {currentSector === "details" && (
          <SectorDetails onAdvance={() => handleSelectSector("venue")} />
        )}
        {currentSector === "venue" && (
          <SectorVenue onAdvance={() => handleSelectSector("rsvp")} />
        )}
        {currentSector === "rsvp" && (
          <SectorRsvp
            initialRsvp={bootstrap?.currentRsvp}
            initialName={bootstrap?.submittedName}
            initialCount={bootstrap?.attendanceCount}
            onSubmitted={handleRsvpSubmitted}
          />
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full h-16 z-50 bg-[#0e0e0e] border-t border-[#333333] flex justify-around items-center px-2 md:px-6">
        <button
          type="button"
          onClick={() => handleSelectSector("intro")}
          className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors cursor-pointer ${
            currentSector === "intro" ? "text-white font-bold" : "text-[#8e9192] hover:text-white"
          }`}
        >
          {currentSector === "intro" && (
            <div className="absolute top-0 left-[20%] right-[20%] h-[2px] bg-white shadow-[0_0_8px_#ffffff]" />
          )}
          <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
          <span className="font-mono text-[10px] uppercase tracking-widest mt-1">Intro</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectSector("details")}
          className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors cursor-pointer ${
            currentSector === "details" ? "text-white font-bold" : "text-[#8e9192] hover:text-white"
          }`}
        >
          {currentSector === "details" && (
            <div className="absolute top-0 left-[20%] right-[20%] h-[2px] bg-white shadow-[0_0_8px_#ffffff]" />
          )}
          <span className="material-symbols-outlined text-xl">event</span>
          <span className="font-mono text-[10px] uppercase tracking-widest mt-1">Details</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectSector("venue")}
          className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors cursor-pointer ${
            currentSector === "venue" ? "text-white font-bold" : "text-[#8e9192] hover:text-white"
          }`}
        >
          {currentSector === "venue" && (
            <div className="absolute top-0 left-[20%] right-[20%] h-[2px] bg-white shadow-[0_0_8px_#ffffff]" />
          )}
          <span className="material-symbols-outlined text-xl">location_on</span>
          <span className="font-mono text-[10px] uppercase tracking-widest mt-1">Venue</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectSector("rsvp")}
          className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors cursor-pointer ${
            currentSector === "rsvp" ? "text-white font-bold" : "text-[#8e9192] hover:text-white"
          }`}
        >
          {currentSector === "rsvp" && (
            <div className="absolute top-0 left-[20%] right-[20%] h-[2px] bg-white shadow-[0_0_8px_#ffffff]" />
          )}
          <span className="material-symbols-outlined text-xl">settings_input_component</span>
          <span className="font-mono text-[10px] uppercase tracking-widest mt-1">RSVP</span>
        </button>
      </nav>
    </div>
  );
}
