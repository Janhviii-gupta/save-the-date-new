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

      if (!this.activeGenerators.has(targetTrack)) {
        this.startTrackMusic(targetTrack);
      }
    }

    setTimeout(() => {
      if (prevTrack !== "off" && prevTrack !== this.currentTrack) {
        this.activeGenerators.delete(prevTrack);
      }
    }, fadeDuration * 1000 + 100);

    this.notify();
  }

  private startTrackMusic(track: BgmTrack) {
    if (!this.audioCtx || !this.trackGains[track]) return;
    const trackGain = this.trackGains[track]!;
    this.activeGenerators.add(track);

    switch (track) {
      case "espionage_suspense":
        this.buildEspionageSuspense(trackGain);
        break;
      case "tactical_spy":
        this.buildTacticalSpyTrack(trackGain);
        break;
      case "rajasthan_grand":
        this.buildRajasthanGrandTrack(trackGain);
        break;
      case "rsvp_curious":
        this.buildRsvpCuriousTrack(trackGain);
        break;
      case "rsvp_yes_tone":
        this.buildRsvpYesTone(trackGain);
        break;
      case "rsvp_maybe_tone":
        this.buildRsvpMaybeTone(trackGain);
        break;
      case "rsvp_no_tone":
        this.buildRsvpNoTone(trackGain);
        break;
      case "party_celebration":
        this.buildPartyCelebrationTrack(trackGain);
        break;
      case "deadpan_regret":
        this.buildDeadpanRegretTrack(trackGain);
        break;
      default:
        break;
    }
  }

  // 1. PAGE 1: Original High-Tension Classified Espionage Briefing
  private buildEspionageSuspense(outputNode: GainNode) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;

    // Sub-bass drone (41Hz E1)
    const subOsc1 = ctx.createOscillator();
    const subOsc2 = ctx.createOscillator();
    const subGain = ctx.createGain();
    const subFilter = ctx.createBiquadFilter();

    subOsc1.type = "sawtooth";
    subOsc1.frequency.value = 41.2;
    subOsc2.type = "sine";
    subOsc2.frequency.value = 41.6;

    subFilter.type = "lowpass";
    subFilter.frequency.value = 90;
    subGain.gain.value = 0.32;

    subOsc1.connect(subFilter);
    subOsc2.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(outputNode);

    subOsc1.start();
    subOsc2.start();
    this.activeOscillators.push(subOsc1, subOsc2);

    // Slow Resonant Sweep
    const sweepOsc = ctx.createOscillator();
    const sweepFilter = ctx.createBiquadFilter();
    const sweepGain = ctx.createGain();

    sweepOsc.type = "sawtooth";
    sweepOsc.frequency.value = 82.4;

    sweepFilter.type = "bandpass";
    sweepFilter.Q.value = 6.0;
    sweepFilter.frequency.value = 250;

    sweepGain.gain.value = 0.15;

    sweepOsc.connect(sweepFilter);
    sweepFilter.connect(sweepGain);
    sweepGain.connect(outputNode);

    sweepOsc.start();
    this.activeOscillators.push(sweepOsc);

    let sweepDir = 1;
    let currentCutoff = 250;
    const sweepTimer = window.setInterval(() => {
      if (!this.audioCtx || this.currentTrack !== "espionage_suspense") return;
      currentCutoff += sweepDir * 35;
      if (currentCutoff > 650) sweepDir = -1;
      if (currentCutoff < 160) sweepDir = 1;
      sweepFilter.frequency.setTargetAtTime(currentCutoff, ctx.currentTime, 0.2);
    }, 200);
    this.loopIntervals.push(sweepTimer);

    // Metallic Scrapes
    const scrapeInterval = window.setInterval(() => {
      if (!this.audioCtx || !this.isEnabled || this.currentTrack !== "espionage_suspense") return;
      const t = this.audioCtx.currentTime;

      const scrape = this.audioCtx.createOscillator();
      const sGain = this.audioCtx.createGain();
      const sFilter = this.audioCtx.createBiquadFilter();

      scrape.type = "triangle";
      scrape.frequency.setValueAtTime(1480 + Math.random() * 200, t);
      scrape.frequency.exponentialRampToValueAtTime(1820 + Math.random() * 300, t + 0.6);

      sFilter.type = "highpass";
      sFilter.frequency.value = 1200;

      sGain.gain.setValueAtTime(0.0001, t);
      sGain.gain.linearRampToValueAtTime(0.035, t + 0.2);
      sGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);

      scrape.connect(sFilter);
      sFilter.connect(sGain);
      sGain.connect(outputNode);

      scrape.start(t);
      scrape.stop(t + 0.9);
    }, 2800);
    this.loopIntervals.push(scrapeInterval);

    // Pulse
    const pulseInterval = window.setInterval(() => {
      if (!this.audioCtx || !this.isEnabled || this.currentTrack !== "espionage_suspense") return;
      const t = this.audioCtx.currentTime;

      const p = this.audioCtx.createOscillator();
      const pg = this.audioCtx.createGain();
      const pf = this.audioCtx.createBiquadFilter();

      p.type = "sine";
      p.frequency.setValueAtTime(82.4, t);
      p.frequency.exponentialRampToValueAtTime(35, t + 0.45);

      pf.type = "lowpass";
      pf.frequency.value = 180;

      pg.gain.setValueAtTime(0.18, t);
      pg.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

      p.connect(pf);
      pf.connect(pg);
      pg.connect(outputNode);

      p.start(t);
      p.stop(t + 0.5);
    }, 1400);
    this.loopIntervals.push(pulseInterval);
  }

  // 2. THE GRAND REVEAL TRIGGER
  public triggerGrandReveal(onBoom?: () => void) {
    if (!this.audioCtx) {
      if (onBoom) onBoom();
      return;
    }

    const t = this.audioCtx.currentTime;

    const riser = this.audioCtx.createOscillator();
    const rGain = this.audioCtx.createGain();
    const rFilter = this.audioCtx.createBiquadFilter();

    riser.type = "sawtooth";
    riser.frequency.setValueAtTime(80, t);
    riser.frequency.exponentialRampToValueAtTime(1400, t + 0.3);

    rFilter.type = "lowpass";
    rFilter.frequency.setValueAtTime(200, t);
    rFilter.frequency.exponentialRampToValueAtTime(3200, t + 0.3);

    rGain.gain.setValueAtTime(0.05, t);
    rGain.gain.linearRampToValueAtTime(0.35, t + 0.28);
    rGain.gain.setValueAtTime(0, t + 0.31);

    riser.connect(rFilter);
    rFilter.connect(rGain);
    rGain.connect(this.masterGain!);

    riser.start(t);
    riser.stop(t + 0.31);

    setTimeout(() => {
      if (!this.audioCtx || !this.masterGain) return;
      const tBoom = this.audioCtx.currentTime;

      if (onBoom) onBoom();

      const subBoom = this.audioCtx.createOscillator();
      const subGain = this.audioCtx.createGain();
      subBoom.type = "sine";
      subBoom.frequency.setValueAtTime(150, tBoom);
      subBoom.frequency.exponentialRampToValueAtTime(24, tBoom + 1.4);

      subGain.gain.setValueAtTime(0.55, tBoom);
      subGain.gain.exponentialRampToValueAtTime(0.001, tBoom + 1.6);

      subBoom.connect(subGain);
      subGain.connect(this.masterGain);
      subBoom.start(tBoom);
      subBoom.stop(tBoom + 1.6);

      const braam = this.audioCtx.createOscillator();
      const braamGain = this.audioCtx.createGain();
      const braamFilter = this.audioCtx.createBiquadFilter();

      braam.type = "sawtooth";
      braam.frequency.setValueAtTime(55.0, tBoom);

      braamFilter.type = "lowpass";
      braamFilter.frequency.setValueAtTime(2400, tBoom);
      braamFilter.frequency.exponentialRampToValueAtTime(280, tBoom + 1.0);

      braamGain.gain.setValueAtTime(0.38, tBoom);
      braamGain.gain.exponentialRampToValueAtTime(0.001, tBoom + 1.1);

      braam.connect(braamFilter);
      braamFilter.connect(braamGain);
      braamGain.connect(this.masterGain);

      braam.start(tBoom);
      braam.stop(tBoom + 1.1);

      this.startRomanticLoveTheme();
    }, 320);
  }

  // 3. PAGE 2: Driving Tactical Spy Beat
  private buildTacticalSpyTrack(outputNode: GainNode) {
    if (!this.audioCtx) return;

    let beat = 0;
    const spyBass = [73.42, 73.42, 87.31, 98.0, 73.42, 73.42, 65.41, 98.0];
    const techLead = [293.66, 349.23, 392.0, 440.0, 523.25, 440.0, 392.0, 349.23];

    const spyTimer = window.setInterval(() => {
      if (!this.audioCtx || !this.isEnabled || this.currentTrack !== "tactical_spy") return;
      const t = this.audioCtx.currentTime;

      if (beat % 4 === 0 || beat % 4 === 2) {
        const kick = this.audioCtx.createOscillator();
        const kg = this.audioCtx.createGain();
        kick.type = "sine";
        kick.frequency.setValueAtTime(140, t);
        kick.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        kg.gain.setValueAtTime(0.32, t);
        kg.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        kick.connect(kg);
        kg.connect(outputNode);
        kick.start(t);
        kick.stop(t + 0.15);
      }

      if (beat % 4 === 2) {
        const snare = this.audioCtx.createOscillator();
        const sg = this.audioCtx.createGain();
        const sf = this.audioCtx.createBiquadFilter();
        snare.type = "sawtooth";
        sf.type = "bandpass";
        sf.frequency.value = 1750;
        sg.gain.setValueAtTime(0.18, t);
        sg.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        snare.connect(sf);
        sf.connect(sg);
        sg.connect(outputNode);
        snare.start(t);
        snare.stop(t + 0.1);
      }

      const bassFreq = spyBass[beat % spyBass.length];
      const bass = this.audioCtx.createOscillator();
      const bg = this.audioCtx.createGain();
      const bf = this.audioCtx.createBiquadFilter();
      bass.type = "sawtooth";
      bass.frequency.setValueAtTime(bassFreq, t);
      bf.type = "lowpass";
      bf.frequency.setValueAtTime(750, t);
      bf.frequency.exponentialRampToValueAtTime(180, t + 0.14);
      bg.gain.setValueAtTime(0.16, t);
      bg.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      bass.connect(bf);
      bf.connect(bg);
      bg.connect(outputNode);
      bass.start(t);
      bass.stop(t + 0.16);

      const leadFreq = techLead[beat % techLead.length];
      const lead = this.audioCtx.createOscillator();
      const lg = this.audioCtx.createGain();
      const lf = this.audioCtx.createBiquadFilter();
      lead.type = "triangle";
      lead.frequency.setValueAtTime(leadFreq, t);
      lf.type = "lowpass";
      lf.frequency.setValueAtTime(1500, t);
      lf.frequency.exponentialRampToValueAtTime(350, t + 0.1);
      lg.gain.setValueAtTime(0.08, t);
      lg.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      lead.connect(lf);
      lf.connect(lg);
      lg.connect(outputNode);
      lead.start(t);
      lead.stop(t + 0.1);

      beat++;
    }, 115);

    this.loopIntervals.push(spyTimer);
  }

  // 4. PAGE 3: Venue "Target Locked" Sequence
  public triggerTargetLockedCue() {
    if (!this.audioCtx || !this.masterGain || !this.isEnabled) {
      this.setTrack("rajasthan_grand");
      return;
    }
    const t = this.audioCtx.currentTime;

    [1800, 2400, 3200, 4800].forEach((freq, i) => {
      if (!this.audioCtx || !this.sfxBus) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + i * 0.06);
      gain.gain.setValueAtTime(0.14, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.04);
      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.04);
    });

    setTimeout(() => {
      if (!this.audioCtx || !this.sfxBus) return;
      const tLock = this.audioCtx.currentTime;
      const lock = this.audioCtx.createOscillator();
      const lg = this.audioCtx.createGain();
      lock.type = "triangle";
      lock.frequency.setValueAtTime(1174.66, tLock);
      lg.gain.setValueAtTime(0.2, tLock);
      lg.gain.exponentialRampToValueAtTime(0.001, tLock + 0.28);
      lock.connect(lg);
      lg.connect(this.sfxBus);
      lock.start(tLock);
      lock.stop(tLock + 0.28);

      setTimeout(() => {
        if (!this.audioCtx || !this.masterGain) return;
        const tDrop = this.audioCtx.currentTime;
        const drop = this.audioCtx.createOscillator();
        const dg = this.audioCtx.createGain();
        drop.type = "sine";
        drop.frequency.setValueAtTime(160, tDrop);
        drop.frequency.exponentialRampToValueAtTime(32, tDrop + 0.8);
        dg.gain.setValueAtTime(0.42, tDrop);
        dg.gain.exponentialRampToValueAtTime(0.001, tDrop + 0.9);
        drop.connect(dg);
        dg.connect(this.masterGain);
        drop.start(tDrop);
        drop.stop(tDrop + 0.9);

        this.setTrack("rajasthan_grand");
      }, 160);
    }, 280);
  }

  private buildRajasthanGrandTrack(outputNode: GainNode) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;

    const pad1 = ctx.createOscillator();
    const pad2 = ctx.createOscillator();
    const padG = ctx.createGain();
    const padF = ctx.createBiquadFilter();

    pad1.type = "sawtooth";
    pad1.frequency.value = 73.42;
    pad2.type = "triangle";
    pad2.frequency.value = 146.83;

    padF.type = "lowpass";
    padF.frequency.value = 550;
    padG.gain.value = 0.2;

    pad1.connect(padF);
    pad2.connect(padF);
    padF.connect(padG);
    padG.connect(outputNode);

    pad1.start();
    pad2.start();
    this.activeOscillators.push(pad1, pad2);

    let step = 0;
    const exoticScale = [293.66, 369.99, 440.0, 493.88, 587.33, 440.0, 369.99, 293.66];

    const grandTimer = window.setInterval(() => {
      if (!this.audioCtx || !this.isEnabled || this.currentTrack !== "rajasthan_grand") return;
      const t = this.audioCtx.currentTime;

      if (step % 2 === 0) {
        const k = this.audioCtx.createOscillator();
        const kg = this.audioCtx.createGain();
        k.type = "sine";
        k.frequency.setValueAtTime(115, t);
        k.frequency.exponentialRampToValueAtTime(45, t + 0.14);
        kg.gain.setValueAtTime(0.26, t);
        kg.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        k.connect(kg);
        kg.connect(outputNode);
        k.start(t);
        k.stop(t + 0.16);
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(exoticScale[step % exoticScale.length], t);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1700, t);
      filter.Q.value = 3;

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(outputNode);
      osc.start(t);
      osc.stop(t + 0.24);

      step++;
    }, 150);

    this.loopIntervals.push(grandTimer);
  }

  // 5. PAGE 4: RSVP Curious Track
  private buildRsvpCuriousTrack(outputNode: GainNode) {
    if (!this.audioCtx) return;

    let beat = 0;
    const bassline = [130.81, 146.83, 164.81, 196.0];
    const curiousChords = [523.25, 659.25, 783.99, 659.25];

    const curiousTimer = window.setInterval(() => {
      if (!this.audioCtx || !this.isEnabled || this.currentTrack !== "rsvp_curious") return;
      const t = this.audioCtx.currentTime;

      if (beat % 2 === 0) {
        const k = this.audioCtx.createOscillator();
        const kg = this.audioCtx.createGain();
        k.type = "sine";
        k.frequency.setValueAtTime(120, t);
        k.frequency.exponentialRampToValueAtTime(50, t + 0.1);
        kg.gain.setValueAtTime(0.2, t);
        kg.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        k.connect(kg);
        kg.connect(outputNode);
        k.start(t);
        k.stop(t + 0.12);
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(curiousChords[beat % curiousChords.length], t);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(outputNode);
      osc.start(t);
      osc.stop(t + 0.18);

      const bOsc = this.audioCtx.createOscillator();
      const bGain = this.audioCtx.createGain();
      bOsc.type = "triangle";
      bOsc.frequency.setValueAtTime(bassline[beat % bassline.length], t);
      bGain.gain.setValueAtTime(0.12, t);
      bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      bOsc.connect(bGain);
      bGain.connect(outputNode);
      bOsc.start(t);
      bOsc.stop(t + 0.2);

      beat++;
    }, 140);

    this.loopIntervals.push(curiousTimer);
  }

  private buildRsvpYesTone(outputNode: GainNode) {
    if (!this.audioCtx) return;
    let beat = 0;
    const chordNotes = [523.25, 659.25, 783.99, 1046.5];

    const yesTimer = window.setInterval(() => {
      if (!this.audioCtx || !this.isEnabled || this.currentTrack !== "rsvp_yes_tone") return;
      const t = this.audioCtx.currentTime;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(chordNotes[beat % chordNotes.length], t);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(outputNode);
      osc.start(t);
      osc.stop(t + 0.2);

      beat++;
    }, 130);
    this.loopIntervals.push(yesTimer);
  }

  private buildRsvpMaybeTone(outputNode: GainNode) {
    if (!this.audioCtx) return;
    let beat = 0;
    const chordNotes = [440.0, 523.25, 659.25, 587.33];

    const maybeTimer = window.setInterval(() => {
      if (!this.audioCtx || !this.isEnabled || this.currentTrack !== "rsvp_maybe_tone") return;
      const t = this.audioCtx.currentTime;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(chordNotes[beat % chordNotes.length], t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(outputNode);
      osc.start(t);
      osc.stop(t + 0.2);

      beat++;
    }, 140);
    this.loopIntervals.push(maybeTimer);
  }

  private buildRsvpNoTone(outputNode: GainNode) {
    if (!this.audioCtx) return;
    let beat = 0;
    const chordNotes = [311.13, 277.18, 261.63, 220.0];

    const noTimer = window.setInterval(() => {
      if (!this.audioCtx || !this.isEnabled || this.currentTrack !== "rsvp_no_tone") return;
      const t = this.audioCtx.currentTime;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(chordNotes[beat % chordNotes.length], t);
      filter.type = "lowpass";
      filter.frequency.value = 450;

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(outputNode);
      osc.start(t);
      osc.stop(t + 0.35);

      beat++;
    }, 250);
    this.loopIntervals.push(noTimer);
  }

  // 6. PAGE 5: High-Energy Party Track
  private buildPartyCelebrationTrack(outputNode: GainNode) {
    if (!this.audioCtx) return;

    let beat = 0;
    const chords = [
      [392.0, 493.88, 587.33, 739.99],
      [493.88, 587.33, 739.99, 880.0],
      [523.25, 659.25, 783.99, 987.77],
      [587.33, 739.99, 880.0, 1174.66]
    ];

    const partyTimer = window.setInterval(() => {
      if (!this.audioCtx || !this.isEnabled || this.currentTrack !== "party_celebration") return;
      const t = this.audioCtx.currentTime;

      if (beat % 4 === 0) {
        const k = this.audioCtx.createOscillator();
        const kg = this.audioCtx.createGain();
        k.type = "sine";
        k.frequency.setValueAtTime(150, t);
        k.frequency.exponentialRampToValueAtTime(45, t + 0.14);
        kg.gain.setValueAtTime(0.38, t);
        kg.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        k.connect(kg);
        kg.connect(outputNode);
        k.start(t);
        k.stop(t + 0.18);
      }

      if (beat % 4 === 2) {
        const s = this.audioCtx.createOscillator();
        const sg = this.audioCtx.createGain();
        const sf = this.audioCtx.createBiquadFilter();
        s.type = "sawtooth";
        sf.type = "bandpass";
        sf.frequency.value = 1800;
        sg.gain.setValueAtTime(0.22, t);
        sg.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        s.connect(sf);
        sf.connect(sg);
        sg.connect(outputNode);
        s.start(t);
        s.stop(t + 0.12);
      }

      const chord = chords[Math.floor(beat / 8) % chords.length];
      const lead = this.audioCtx.createOscillator();
      const lg = this.audioCtx.createGain();
      const lf = this.audioCtx.createBiquadFilter();

      lead.type = "sawtooth";
      lead.frequency.setValueAtTime(chord[beat % chord.length], t);
      lf.type = "lowpass";
      lf.frequency.setValueAtTime(3000, t);
      lf.frequency.exponentialRampToValueAtTime(700, t + 0.14);
      lg.gain.setValueAtTime(0.14, t);
      lg.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      lead.connect(lf);
      lf.connect(lg);
      lg.connect(outputNode);

      lead.start(t);
      lead.stop(t + 0.15);

      beat++;
    }, 112);

    this.loopIntervals.push(partyTimer);
  }

  // 6b. PAGE 5 (NO): Deadpan Regret Drone
  private buildDeadpanRegretTrack(outputNode: GainNode) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = "sawtooth";
    osc1.frequency.value = 43.65;
    osc2.type = "sine";
    osc2.frequency.value = 44.2;

    filter.type = "lowpass";
    filter.frequency.value = 110;
    gain.gain.value = 0.22;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(outputNode);

    osc1.start();
    osc2.start();
    this.activeOscillators.push(osc1, osc2);
  }

  // =========================================================================
  // HIGH-END SFX ROUTED THROUGH REVERB BUS
  // =========================================================================

  public playAccessGranted() {
    if (!this.audioCtx || !this.sfxBus) return;
    try {
      const now = this.audioCtx.currentTime;
      const notes = [261.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        if (!this.audioCtx || !this.sfxBus) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.04 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.5);
        osc.connect(gain);
        gain.connect(this.sfxBus);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.5);
      });
    } catch {}
  }

  public sfxYesHover() {
    if (!this.isEnabled || !this.audioCtx || !this.sfxBus) return;
    try {
      const now = this.audioCtx.currentTime;
      [659.25, 783.99, 1046.5].forEach((freq, idx) => {
        if (!this.audioCtx || !this.sfxBus) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.03);
        gain.gain.setValueAtTime(0.12, now + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.22);
        osc.connect(gain);
        gain.connect(this.sfxBus);
        osc.start(now + idx * 0.03);
        osc.stop(now + idx * 0.03 + 0.22);
      });
    } catch {}
  }

  public sfxYesSelect() {
    if (!this.isEnabled || !this.audioCtx || !this.sfxBus) return;
    try {
      const now = this.audioCtx.currentTime;
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
        if (!this.audioCtx || !this.sfxBus) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.16, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.55);
        osc.connect(gain);
        gain.connect(this.sfxBus);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.55);
      });
    } catch {}
  }

  public sfxMaybeHover() {
    if (!this.isEnabled || !this.audioCtx || !this.sfxBus) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.08);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  public sfxMaybeSelect() {
    if (!this.isEnabled || !this.audioCtx || !this.sfxBus) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(659, now + 0.22);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  public sfxNoHover() {
    if (!this.isEnabled || !this.audioCtx || !this.sfxBus) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.14);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }

  public sfxNoSelect() {
    if (!this.isEnabled || !this.audioCtx || !this.sfxBus) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(220, now);
      osc1.frequency.exponentialRampToValueAtTime(55, now + 0.45);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(130, now);
      osc2.frequency.exponentialRampToValueAtTime(45, now + 0.45);

      filter.type = "lowpass";
      filter.frequency.value = 450;

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxBus);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.55);
      osc2.stop(now + 0.55);
    } catch {}
  }

  public sfxCelebrationExplosion() {
    if (!this.isEnabled || !this.audioCtx || !this.sfxBus) return;
    try {
      const now = this.audioCtx.currentTime;

      const whistle = this.audioCtx.createOscillator();
      const wGain = this.audioCtx.createGain();
      whistle.type = "sine";
      whistle.frequency.setValueAtTime(320, now);
      whistle.frequency.exponentialRampToValueAtTime(3000, now + 0.35);

      wGain.gain.setValueAtTime(0.18, now);
      wGain.gain.linearRampToValueAtTime(0.3, now + 0.3);
      wGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      whistle.connect(wGain);
      wGain.connect(this.sfxBus);
      whistle.start(now);
      whistle.stop(now + 0.38);

      setTimeout(() => {
        if (!this.audioCtx || !this.sfxBus) return;
        const t = this.audioCtx.currentTime;

        const burst = this.audioCtx.createOscillator();
        const bg = this.audioCtx.createGain();
        burst.type = "sawtooth";
        burst.frequency.setValueAtTime(200, t);
        burst.frequency.exponentialRampToValueAtTime(30, t + 0.5);

        bg.gain.setValueAtTime(0.45, t);
        bg.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

        burst.connect(bg);
        bg.connect(this.sfxBus);
        burst.start(t);
        burst.stop(t + 0.55);

        if (!this.audioCtx || !this.sfxBus) return;
        const ctx = this.audioCtx;
        const bus = this.sfxBus;

        [200, 350, 500, 700, 950].forEach((freq, idx) => {
          const cl = ctx.createOscillator();
          const clg = ctx.createGain();
          const clf = ctx.createBiquadFilter();
          cl.type = "sawtooth";
          cl.frequency.setValueAtTime(freq + Math.random() * 80, t + idx * 0.05);
          clf.type = "bandpass";
          clf.frequency.value = 1400 + Math.random() * 400;
          clg.gain.setValueAtTime(0.14, t + idx * 0.05);
          clg.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.85);
          cl.connect(clf);
          clf.connect(clg);
          clg.connect(bus);
          cl.start(t + idx * 0.05);
          cl.stop(t + idx * 0.05 + 0.85);
        });

        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.15, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
          osc.connect(gain);
          gain.connect(bus);
          osc.start(t);
          osc.stop(t + 0.9);
        });
      }, 350);
    } catch {}
  }

  public sfxDeadpanDrop() {
    if (!this.isEnabled || !this.audioCtx || !this.masterGain) {
      this.setTrack("deadpan_regret");
      return;
    }
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 1.2);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.4);

      setTimeout(() => this.setTrack("deadpan_regret"), 600);
    } catch {}
  }

  public playClick() {
    if (!this.isEnabled || !this.audioCtx || !this.sfxBus) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start();
      osc.stop(now + 0.08);
    } catch {}
  }

  public playTick() {
    if (!this.isEnabled || !this.audioCtx || !this.sfxBus) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start();
      osc.stop(now + 0.03);
    } catch {}
  }

  public playTypewriterKeystroke() {
    if (!this.isEnabled || !this.audioCtx || !this.sfxBus) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600 + Math.random() * 200, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start();
      osc.stop(now + 0.04);
    } catch {}
  }

  public playPing() {
    if (!this.isEnabled || !this.audioCtx || !this.sfxBus) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
      osc.connect(gain);
      gain.connect(this.sfxBus);
      osc.start();
      osc.stop(now + 0.55);
    } catch {}
  }

  public playDramaticAlert() {
    if (!this.isEnabled || !this.audioCtx || !this.sfxBus) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc1.type = "square";
      osc1.frequency.setValueAtTime(150, now);
      osc1.frequency.exponentialRampToValueAtTime(40, now + 0.8);
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(300, now);
      osc2.frequency.exponentialRampToValueAtTime(80, now + 0.8);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxBus);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    } catch {}
  }

  public playMechSnap() {
    if (!this.isEnabled || !this.audioCtx || !this.sfxBus) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2000, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(filter);
      filter.connect(this.sfxBus);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  // =========================================================================
  // ROMANTIC LOVE THEME (J&K PHOTO HOVER EASTER EGG)
  // =========================================================================

  private romanticOscs: OscillatorNode[] = [];
  private romanticTimer: number | null = null;
  private romanticGain: GainNode | null = null;

  public startRomanticLoveTheme() {
    if (!this.audioCtx || !this.masterGain || !this.isEnabled) return;
    this.stopRomanticLoveTheme();

    try {
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Smoothly duck background suspense music
      this.duckMusic(0.12, 0.4);

      // Create dedicated romantic gain node
      this.romanticGain = ctx.createGain();
      this.romanticGain.gain.setValueAtTime(0.001, now);
      this.romanticGain.gain.exponentialRampToValueAtTime(0.35, now + 0.5);

      const romanticFilter = ctx.createBiquadFilter();
      romanticFilter.type = "lowpass";
      romanticFilter.frequency.value = 3200;

      this.romanticGain.connect(romanticFilter);
      if (this.delayNode) {
        romanticFilter.connect(this.delayNode);
      }
      if (this.masterGain) {
        romanticFilter.connect(this.masterGain);
      }

      // Warm romantic lush pad drone (Fmaj9: F3, C4, E4, G4)
      const padNotes = [174.61, 261.63, 329.63, 392.0];
      padNotes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        g.gain.value = 0.15;
        osc.connect(g);
        if (this.romanticGain) g.connect(this.romanticGain);
        osc.start(now);
        this.romanticOscs.push(osc);
      });

      // Shimmering romantic harp / music box arpeggio sequence
      const romanticScale = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5, 1567.98];
      let arpIndex = 0;

      this.romanticTimer = window.setInterval(() => {
        if (!this.audioCtx || !this.romanticGain) return;
        const t = this.audioCtx.currentTime;
        const noteFreq = romanticScale[arpIndex % romanticScale.length];

        const bell = this.audioCtx.createOscillator();
        const bellGain = this.audioCtx.createGain();
        bell.type = "triangle";
        bell.frequency.setValueAtTime(noteFreq, t);

        bellGain.gain.setValueAtTime(0.09, t);
        bellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

        bell.connect(bellGain);
        bellGain.connect(this.romanticGain);
        bell.start(t);
        bell.stop(t + 0.7);

        arpIndex++;
      }, 160);
    } catch {}
  }

  public stopRomanticLoveTheme() {
    if (!this.audioCtx) return;

    if (this.romanticTimer) {
      clearInterval(this.romanticTimer);
      this.romanticTimer = null;
    }

    if (this.romanticGain) {
      const now = this.audioCtx.currentTime;
      this.romanticGain.gain.cancelScheduledValues(now);
      this.romanticGain.gain.setValueAtTime(this.romanticGain.gain.value, now);
      this.romanticGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      setTimeout(() => {
        this.romanticOscs.forEach((o) => {
          try {
            o.stop();
            o.disconnect();
          } catch {}
        });
        this.romanticOscs = [];
        this.romanticGain = null;
      }, 450);
    }

    // Restore background music
    this.unduckMusic(0.5);
  }

  public getAudioEnabled(): boolean {
    return this.isEnabled;
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  public getCurrentTrack(): BgmTrack {
    return this.currentTrack;
  }
}

export const soundEngine =
  typeof window !== "undefined" ? new SoundEngine() : (null as unknown as SoundEngine);
