"use client";

import { useEffect, useState } from "react";
import { soundEngine, type BgmTrack } from "@/lib/audio/soundEngine";

interface TopBarProps {
  currentSector: "intro" | "details" | "venue" | "rsvp";
  isRevealed?: boolean;
}

export function TopBar({ currentSector, isRevealed = false }: TopBarProps) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [currentTrack, setCurrentTrack] = useState<BgmTrack>("espionage_suspense");
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!soundEngine) return;
    const unsub = soundEngine.subscribe((enabled, vol, track) => {
      setAudioEnabled(enabled);
      setVolume(vol);
      setCurrentTrack(track);
    });
    return unsub;
  }, []);

  const handleToggle = () => {
    if (!soundEngine) return;
    soundEngine.toggleAudio();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!soundEngine) return;
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundEngine.setVolume(val);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#050505]/95 backdrop-blur-md border-b border-[#333333] flex justify-between items-center h-14 px-3 md:px-8">
      <div className="flex items-center gap-2 md:gap-3 text-white">
        <span className="material-symbols-outlined text-lg text-[#ffb4ab]">
          {isRevealed || currentSector !== "intro" ? "terminal" : "lock"}
        </span>
        <span className="font-mono text-[10px] md:text-[11px] font-bold text-white uppercase tracking-[0.2em] whitespace-nowrap">
          {isRevealed || currentSector !== "intro"
            ? "SAVE THE DATE 19-20 NOV"
            : "[ CLASSIFIED // LEVEL 5 ACCESS ]"}
        </span>
        <span className="hidden sm:inline-block font-mono text-[10px] text-[#ffb4ab] border border-[#ffb4ab]/40 px-2 py-0.5 ml-2">
          {isRevealed || currentSector !== "intro" ? "[ ACTIVE ]" : "[ RESTRICTED ]"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Equalizer audio indicator */}
        {audioEnabled && currentTrack !== "off" && (
          <div className="flex items-end gap-[3px] h-3.5 opacity-80 mr-1">
            <span className="w-[3px] bg-[#e9c349] rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-full" />
            <span className="w-[3px] bg-[#e9c349] rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-2/3" />
            <span className="w-[3px] bg-[#e9c349] rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-4/5" />
          </div>
        )}

        {/* Minimalist Floating Sound Icon Button with hover volume popover */}
        <div
          className="relative flex items-center justify-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Floating Vertical Volume Popup on Hover */}
          {isHovered && (
            <div className="absolute top-12 right-0 bg-[#131313] border border-[#333333] p-3 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col items-center gap-2 z-50 animate-[fadeIn_0.15s_ease-out]">
              <span className="font-mono text-[9px] text-[#8e9192] uppercase tracking-wider">
                {Math.round((audioEnabled ? volume : 0) * 100)}%
              </span>
              <div className="h-24 flex items-center justify-center py-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={audioEnabled ? volume : 0}
                  onChange={handleVolumeChange}
                  aria-label="Master Volume"
                  className="volume-slider -rotate-90 w-20 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Sleek Minimalist Audio Toggle Button */}
          <button
            type="button"
            onClick={handleToggle}
            aria-label={audioEnabled ? "Mute audio" : "Unmute audio"}
            className={
              audioEnabled
                ? "flex items-center justify-center p-2.5 rounded-full transition-all cursor-pointer text-[#e9c349] hover:text-white bg-[#e9c349]/10 border border-[#e9c349]/30"
                : "flex items-center justify-center p-2.5 rounded-full transiti