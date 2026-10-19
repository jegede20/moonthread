// Background sounds using Web Audio API - procedural + file fallback
// To work offline, we synthesize sounds procedurally if files missing, but also try to load files from /sounds/

import { BgSoundId } from "./constants";

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentSource: { stop: () => void; setVolume: (v: number) => void } | null = null;
  private currentId: BgSoundId = "off";
  private volume = 0.5;

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      const gain = ctx.createGain();
      gain.gain.value = this.volume;
      gain.connect(ctx.destination);
      this.ctx = ctx;
      this.masterGain = gain;
    }
    return this.ctx;
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.2);
    }
    if (this.currentSource) {
      this.currentSource.setVolume(this.volume);
    }
  }

  async play(id: BgSoundId, volume: number = this.volume) {
    this.stop();
    if (id === "off") return;
    this.currentId = id;
    this.volume = volume;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") await ctx.resume();

    if (!this.masterGain) return;
    this.masterGain.gain.value = volume;

    // Try to load audio file first, if fails fallback to procedural
    try {
      const fileSource = await this.tryLoadFile(id, ctx, this.masterGain);
      if (fileSource) {
        this.currentSource = fileSource;
        return;
      }
    } catch {
      // fallback
    }

    // Procedural fallback
    const proc = this.createProcedural(id, ctx, this.masterGain);
    this.currentSource = proc;
  }

  private async tryLoadFile(id: BgSoundId, ctx: AudioContext, dest: AudioNode): Promise<{ stop: () => void; setVolume: (v: number) => void } | null> {
    // Files are at /sounds/{id}.mp3 or .wav or .ogg - we try mp3
    const urls = [`/sounds/${id}.mp3`, `/sounds/${id}.ogg`, `/sounds/${id}.wav`];
    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: "force-cache" });
        if (!res.ok) continue;
        const buf = await res.arrayBuffer();
        const audioBuf = await ctx.decodeAudioData(buf);
        const src = ctx.createBufferSource();
        src.buffer = audioBuf;
        src.loop = true;
        const gain = ctx.createGain();
        gain.gain.value = 1;
        src.connect(gain);
        gain.connect(dest);
        src.start();
        return {
          stop: () => {
            try { src.stop(); } catch {}
            try { src.disconnect(); gain.disconnect(); } catch {}
          },
          setVolume: (v: number) => {
            // volume handled by master
          }
        };
      } catch {
        continue;
      }
    }
    return null;
  }

  private createProcedural(id: BgSoundId, ctx: AudioContext, dest: AudioNode) {
    // Create nodes that generate looping ambient sounds
    const gain = ctx.createGain();
    gain.gain.value = 1;
    gain.connect(dest);

    let nodes: AudioNode[] = [];
    let stopFns: (() => void)[] = [];

    if (id === "rain") {
      // filtered white noise
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1000;
      filter.Q.value = 0.5;
      src.connect(filter);
      filter.connect(gain);
      src.start();
      nodes = [src, filter];
      stopFns.push(() => { try { src.stop(); } catch {} });
    } else if (id === "crickets") {
      // chirps using oscillators with envelopes
      const master = gain;
      let interval: any;
      const playChirp = () => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.value = 4500 + Math.random() * 500;
        osc.type = "sine";
        g.gain.value = 0;
        osc.connect(g);
        g.connect(master);
        osc.start();
        const now = ctx.currentTime;
        g.gain.linearRampToValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.6, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        setTimeout(() => { try { osc.stop(); osc.disconnect(); g.disconnect(); } catch {} }, 200);
      };
      interval = setInterval(() => {
        const count = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          setTimeout(playChirp, i * 80);
        }
      }, 800 + Math.random() * 400);
      stopFns.push(() => clearInterval(interval));
    } else if (id === "ocean") {
      // low filtered noise with slow LFO
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 500;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.08;
      lfoGain.gain.value = 300;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      src.connect(filter);
      filter.connect(gain);
      src.start();
      nodes = [src, filter, lfo, lfoGain];
      stopFns.push(() => { try { src.stop(); lfo.stop(); } catch {} });
    } else if (id === "wind") {
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 400;
      filter.Q.value = 0.8;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.15;
      lfoGain.gain.value = 200;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      src.connect(filter);
      filter.connect(gain);
      src.start();
      nodes = [src, filter, lfo, lfoGain];
      stopFns.push(() => { try { src.stop(); lfo.stop(); } catch {} });
    }

    return {
      stop: () => {
        stopFns.forEach(fn => fn());
        try { gain.disconnect(); } catch {}
        nodes.forEach(n => { try { n.disconnect(); } catch {} });
      },
      setVolume: (v: number) => {
        // handled by master
      }
    };
  }

  stop() {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    this.currentId = "off";
  }

  fadeOut(durationMs: number = 30000): Promise<void> {
    return new Promise((resolve) => {
      if (!this.ctx || !this.masterGain) {
        this.stop();
        resolve();
        return;
      }
      const now = this.ctx.currentTime;
      const startVol = this.masterGain.gain.value;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(startVol, now);
      this.masterGain.gain.linearRampToValueAtTime(0, now + durationMs / 1000);
      setTimeout(() => {
        this.stop();
        if (this.masterGain) this.masterGain.gain.value = this.volume;
        resolve();
      }, durationMs);
    });
  }

  getCurrent() {
    return this.currentId;
  }
}

export const soundManager = new SoundManager();
