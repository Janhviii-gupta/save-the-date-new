"use client";

// Web Audio API Cinematic Procedural Sound & Music Engine for Protocol Eternal
export type BgmTrack =
  | "espionage_suspense"  // Page 1 Intro: High-tension classified espionage briefing
  | "tactical_spy"         // Page 1 Reveal & Page 2 Stats: Driving cyber-tactical beat
  | "rajasthan_grand"      // Page 3 Venue: Anticipatory grand Rajasthan scale
  | "rsvp_curious"         // Page 4 RSVP General: Light curious engagement
  | "rsvp_yes_tone"        // Page 4 Name Input (YES)
  | "rsvp_maybe_tone"      // Page 4 Name Input (MAYBE)
  | "rsvp_no_tone"         // Page 4 Name Input (NO)
  | "party_celebration"    // Page 5 YES/MAYBE Celebration
  | "deadpan_regret"       // Page 5 NO Deadpan Regret
  | "off";

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private sfxReverbBus: GainNode | null = null;
  private warmthFilter: BiquadFilterNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;

  private isEnabled: boolean = true;
  private currentVolume: number = 0.7;
  private isDucked: boolean = false;
  private initialized: boolean = false;
  private currentTrack: BgmTrack = "off";

  // Individual Track Gains for smooth 1.5-second logarithmic crossfading
  private trackGains: Partial<Record<BgmTrack, GainNode>> = {};

  // Active Loops / Timers / Generators
  private loopIntervals: number[] = [];
  private activeOscillators: OscillatorNode[] = [];
  private activeGenerators: Set<BgmTrack> = new Set();

  // Listeners
  private listeners: Set<(enabled: boolean, volume: number, track: BgmTrack) => void> = new Set();

  public init() {
    if (this.initialized && this.audioCtx) {
      if (this.audioCtx.state === "suspended") {
        void this.audioCtx.resume();
      }
      return;
    }

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.audioCtx = new AudioCtxClass();

      // Master output gain
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = this.isEnabled ? this.currentVolume : 0;

      // BGM & SFX Sub-Buses
      this.bgmBus = this.audioCtx.createGain();
      this.bgmBus.gain.value = 1.0;

      this.sfxBus = this.audioCtx.createGain();
      this.sfxBus.gain.value = 1.0;

      // Warmth master lowpass filter (removes harsh digital edges)
      this.warmthFilter = this.audioCtx.createBiquadFilter();
      this.warmthFilter.type = "lowpass";
      this.warmthFilter.frequency.value = 8500;
      this.warmthFilter.Q.value = 0.7;

      // Spatial Room Reverb & Delay Bus
      this.delayNode = this.audioCtx.createDelay(1.0);
      this.delayNode.delayTime.value = 0.24;
      this.delayFeedback = this.audioCtx.createGain();
      this.delayFeedback.gain.value = 0.26;

      this.delayNode.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      this.delayNode.connect(this.masterGain);

      // SFX Reverb Send Bus (adds weighted room tail to clicks/pings)
      this.sfxReverbBus = this.audioCtx.createGain();
      this.sfxReverbBus.gain.value = 0.22;
      this.sfxBus.connect(this.sfxReverbBus);
      this.sfxReverbBus.connect(this.delayNode);

      // Route BGM through warmth filter into master
      this.bgmBus.connect(this.warmthFilter);
      this.sfxBus.connect(this.warmthFilter);
      this.warmthFilter.connect(this.masterGain);
      this.masterGain.connect(this.audioCtx.destination);

      const allTracks: BgmTrack[] = [
        "espionage_suspense",
        "tactical_spy",
        "rajasthan_grand",
        "rsvp_curious",
        "rsvp_yes_tone",
        "rsvp_maybe_tone",
        "rsvp_no_tone",
        "party_celebration",
        "deadpan_regret"
      ];

      allTracks.forEach((t) => {
        if (!this.audioCtx || !this.bgmBus) return;
        const gain = this.audioCtx.createGain();
        gain.gain.value = 0;
        gain.connect(this.bgmBus);

        if (this.delayNode) {
          const sendGain = this.audioCtx.createGain();
          sendGain.gain.value = 0.14;
          gain.connect(sendGain);
          sendGain.connect(this.delayNode);
        }
        this.trackGains[t] = gain;
      });

      this.initialized = true;
      this.notify();
    } catch (e) {
      console.warn("Web Audio API initialization note:", e);
    }
  }

  // Called directly upon clicking [ CLICK HERE TO INITIALIZE ]
  public startFromEntryGate() {
    this.init();
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      void this.audioCtx.resume();
    }
    this.playAccessGranted();
    setTimeout(() => {
      this.setTrack("espionage_suspense");
    }, 150);
  }

  // =========================================================================
  // DYNAMIC AUDIO DUCKING (Smooth volume dip on input focus)
  // =========================================================================
  public duckMusic(factor: number = 0.35, duration: number = 0.3) {
    if (!this.audioCtx || !this.bgmBus || this.isDucked) return;
    this.isDucked = true;
    const now = this.audioCtx.currentTime;
    this.bgmBus.gain.cancelScheduledValues(now);
    this.bgmBus.gain.setTargetAtTime(1.0 - factor, now, duration);
  }

  public unduckMusic(duration: number = 0.4) {
    if (!this.audioCtx || !this.bgmBus || !this.isDucked) return;
    this.isDucked = false;
    const now = this.audioCtx.currentTime;
    this.bgmBus.gain.cancelScheduledValues(now);
    this.bgmBus.gain.setTargetAtTime(1.0, now, duration);
  }

  public subscribe(cb: (enabled: boolean, volume: number, track: BgmTrack) => void) {
    this.listeners.add(cb);
    cb(this.isEnabled, this.currentVolume, this.currentTrack);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.isEnabled, this.currentVolume, this.currentTrack));
  }

  public setVolume(val: number) {
    this.currentVolume = Math.max(0, Math.min(1, val));
    if (!this.initialized) this.init();

    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setTargetAtTime(
        this.isEnabled ? this.currentVolume : 0,
        this.audioCtx.currentTime,
        0.05
      );
    }

    if (this.currentVolume === 0 && this.isEnabled) {
      this.isEnabled = false;
    } else if (this.currentVolume > 0 && !this.isEnabled) {
      this.isEnabled = true;
    }
    this.notify();
  }

  public toggleAudio(): boolean {
    if (!this.initialized) this.init();
    if (!this.audioCtx) return false;

    this.isEnabled = !this.isEnabled;

    if (this.isEnabled) {
      if (this.audioCtx.state === "suspended") {
        void this.audioCtx.resume();
      }
      if (this.currentVolume === 0) {
        this.currentVolume = 0.7;
      }
      if (this.masterGain) {
        this.masterGain.gain.setTargetAtTime(
          this.currentVolume,
          this.audioCtx.currentTime,
          0.05
        );
      }
      if (this.currentTrack === "off") {
        this.setTrack("espionage_suspense");
      }
    } else {
      if (this.masterGain) {
        this.masterGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.05);
      }
    }

    this.notify();
    return this.isEnabled;
  }

  // =========================================================================
  // 1.5-SECOND SMOOTH LOGARITHMIC CROSSFADER
  // =========================================================================

  public setTrack(targetTrack: BgmTrack) {
    if (!this.initialized) {
      this.currentTrack = targetTrack;
      this.init();
      return;
    }

    if (this.currentTrack === targetTrack) return;
    const prevTrack = this.currentTrack;
    this.currentTrack = targetTrack;

    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const fadeDuration = 1.5;

    // Smoothly fade out previous track
    if (prevTrack !== "off" && this.trackGains[prevTrack]) {
      const prevGain = this.trackGains[prevTrack]!;
      prevGain.gain.cancelScheduledValues(now);
      prevGain.gain.setValueAtTime(Math.max(0.001, prevGain.gain.value), now);
      prevGain.gain.exponentialRampToValueAtTime(0.0001, now + fadeDuration);
    }
    this.stopRomanticLoveTheme();

    // Start target track and smoothly fade in
    if (targetTrack !== "off" && this.trackGains[targetTrack]) {
      const nextGain = this.trackGains[targetTrack]!;
      nextGain.gain.cancelScheduledValues(now);
      nextGain.gain.setValueAtTime(0.0001, now);
      nextGain.gain.exponentialRampToValueAtTime(1.0, now + fadeDuration);

      if (!this.active