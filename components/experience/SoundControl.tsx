"use client";

import { useEffect, useRef, useState } from "react";

const SOUND_STORAGE_KEY = "jk-sound-enabled";

function playSystemPing(context: AudioContext) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(660, context.currentTime);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.12);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.13);
}

export function SoundControl({ available }: { available: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const savedPreference = window.localStorage.getItem(SOUND_STORAGE_KEY) === "true";
    const timer = window.setTimeout(() => setEnabled(savedPreference), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!available) return null;

  function toggleSound() {
    const next = !enabled;
    setEnabled(next);
    window.localStorage.setItem(SOUND_STORAGE_KEY, String(next));
    if (next) {
      contextRef.current ??= new AudioContext();
      void contextRef.current.resume().then(() => playSystemPing(contextRef.current!));
    }
  }

  return (
    <button className="sound-control" type="button" onClick={toggleSound} aria-pressed={enabled}>
      SOUND: {enabled ? "ON" : "OFF"}
    </button>
  );
}
