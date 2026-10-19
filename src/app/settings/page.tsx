"use client";
import { useEffect, useState } from "react";
import { SimpleHeader } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { getSettings, saveSettings } from "@/lib/db";
import { StorySettings } from "@/lib/storyTypes";
import { BACKGROUND_SOUNDS, SLEEP_TIMERS, SPEEDS, TEXT_SIZES, BgSoundId, SleepTimerId } from "@/lib/constants";

export default function SettingsPage() {
  const [settings, setSettings] = useState<StorySettings | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    getSettings().then(setSettings);
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) setVoices(v);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const update = async (patch: Partial<StorySettings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveSettings(patch);
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#1E1B4B] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#1E1B4B] pb-[88px] md:pb-0">
      <SimpleHeader title="Settings" />

      <main className="flex-1 mx-auto w-full max-w-[560px] px-6 md:px-8 py-8 space-y-8">
        <h1 className="text-[28px] font-bold tracking-tight text-[#FFF8E7]" style={{ fontFamily: "var(--font-fredoka)" }}>
          Settings
        </h1>

        {/* Voice */}
        <div className="rounded-[20px] bg-[#2D2A6E] border border-white/5 p-5">
          <label className="text-[13px] font-bold tracking-widest uppercase text-[#D9D6F7]" style={{ fontFamily: "var(--font-fredoka)" }}>
            Voice
          </label>
          <select
            value={settings.voiceURI || ""}
            onChange={(e) => update({ voiceURI: e.target.value })}
            className="mt-3 w-full h-[48px] rounded-[14px] bg-[#1E1B4B] border border-white/10 px-4 text-[14px] text-[#FFF8E7] outline-none"
          >
            <option value="">Default system voice</option>
            {voices.slice(0, 30).map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>

        {/* Speed */}
        <div className="rounded-[20px] bg-[#2D2A6E] border border-white/5 p-5">
          <label className="text-[13px] font-bold tracking-widest uppercase text-[#D9D6F7]" style={{ fontFamily: "var(--font-fredoka)" }}>
            Reading speed
          </label>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {SPEEDS.map((s) => (
              <button
                key={s.id}
                onClick={() => update({ speed: s.id as any })}
                className={`h-[44px] rounded-full font-bold text-[13px] border-2 transition-colors ${
                  settings.speed === s.id ? "bg-[#FFF8E7] text-[#1E1B4B] border-[#FFF8E7]" : "bg-transparent text-[#D9D6F7] border-white/10"
                }`}
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text size */}
        <div className="rounded-[20px] bg-[#2D2A6E] border border-white/5 p-5">
          <label className="text-[13px] font-bold tracking-widest uppercase text-[#D9D6F7]" style={{ fontFamily: "var(--font-fredoka)" }}>
            Text size
          </label>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {TEXT_SIZES.map((sz) => (
              <button
                key={sz}
                onClick={() => update({ textSize: sz as any })}
                className={`h-[44px] rounded-full font-bold text-[13px] border-2 capitalize transition-colors ${
                  settings.textSize === sz ? "bg-[#FFF8E7] text-[#1E1B4B] border-[#FFF8E7]" : "bg-transparent text-[#D9D6F7] border-white/10"
                }`}
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Reduce motion */}
        <div className="rounded-[20px] bg-[#2D2A6E] border border-white/5 p-5 flex items-center justify-between">
          <div>
            <p className="text-[14px] font-bold text-[#FFF8E7]" style={{ fontFamily: "var(--font-fredoka)" }}>
              Reduce motion
            </p>
            <p className="mt-1 text-[12px] text-[#9A96C8]">Turn off twinkling and floating animations</p>
          </div>
          <button
            onClick={() => update({ reduceMotion: !settings.reduceMotion })}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${settings.reduceMotion ? "bg-[#FFD93D]" : "bg-white/20"}`}
            aria-pressed={settings.reduceMotion}
            aria-label="Toggle reduce motion"
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.reduceMotion ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {/* Default sound */}
        <div className="rounded-[20px] bg-[#2D2A6E] border border-white/5 p-5">
          <label className="text-[13px] font-bold tracking-widest uppercase text-[#D9D6F7]" style={{ fontFamily: "var(--font-fredoka)" }}>
            Default background sound
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {BACKGROUND_SOUNDS.map((s) => (
              <button
                key={s.id}
                onClick={() => update({ defaultSound: s.id })}
                className={`h-9 px-4 rounded-full text-[13px] font-bold flex items-center gap-1.5 border-2 transition-colors ${
                  settings.defaultSound === s.id ? "bg-[#7DD3FC] text-[#1E1B4B] border-[#7DD3FC]" : "bg-transparent text-[#D9D6F7] border-white/10"
                }`}
              >
                <span>{s.emoji}</span> {s.label}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <label className="text-[12px] font-bold tracking-widest uppercase text-[#9A96C8]">Volume</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.defaultVolume}
              onChange={(e) => update({ defaultVolume: parseFloat(e.target.value) })}
              className="mt-2 w-full accent-[#7DD3FC]"
            />
          </div>
        </div>

        {/* Default sleep timer */}
        <div className="rounded-[20px] bg-[#2D2A6E] border border-white/5 p-5">
          <label className="text-[13px] font-bold tracking-widest uppercase text-[#D9D6F7]" style={{ fontFamily: "var(--font-fredoka)" }}>
            Default sleep timer
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {SLEEP_TIMERS.map((t) => (
              <button
                key={t.id}
                onClick={() => update({ defaultSleepTimer: t.id })}
                className={`h-9 px-4 rounded-full text-[13px] font-bold border-2 transition-colors ${
                  settings.defaultSleepTimer === t.id ? "bg-[#FFD93D] text-[#1E1B4B] border-[#FFD93D]" : "bg-transparent text-[#D9D6F7] border-white/10"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[20px] bg-[#1E1B4B] border border-white/5 p-5">
          <h4 className="font-bold text-[14px] text-[#FFF8E7]" style={{ fontFamily: "var(--font-fredoka)" }}>
            Privacy
          </h4>
          <p className="mt-2 text-[13px] leading-[1.6] text-[#D9D6F7]" style={{ fontFamily: "var(--font-nunito)" }}>
            Child&apos;s name and stories stay on this device. We only send name, animal, mood and age group to Groq to write the story. No accounts, no database.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
