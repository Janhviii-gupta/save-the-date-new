"use client";

import { soundEngine } from "@/lib/audio/soundEngine";

export type SectorTab = "intro" | "details" | "venue" | "rsvp";

interface BottomNavProps {
  currentSector: SectorTab;
  onSelectSector: (sector: SectorTab) => void;
}

const TABS: Array<{ id: SectorTab; icon: string; label: string }> = [
  { id: "intro", icon: "qr_code_scanner", label: "Intro" },
  { id: "details", icon: "event", label: "Details" },
  { id: "venue", icon: "location_on", label: "Venue" },
  { id: "rsvp", icon: "settings_input_component", label: "RSVP" }
];

export function BottomNav({ currentSector, onSelectSector }: BottomNavProps) {
  const handleTabClick = (tabId: SectorTab) => {
    soundEngine?.playClick();
    onSelectSector(tabId);
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full h-16 z-50 bg-[#0e0e0e]/95 backdrop-blur-xl border-t border-[#333333] flex justify-around items-center px-2 md:px-6 pb-safe">
      {TABS.map((tab) => {
        const isActive = currentSector === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
              isActive
                ? "text-white font-bold"
                : "text-[#8e9192] hover:text-white font-medium"
            }`}
          >
            {isActive && (
              <div className="absolute top-0 left-[20%] right-[20%] h-[2px] bg-white" />
            )}
            <span
              className="material-symbols-outlined text-xl transition-transform"
              style={{
                fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0"
              }}
            >
              {tab.icon}
            </span>
            <span className="font-code-xs text-[10px] uppercase tracking-widest mt-1">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
