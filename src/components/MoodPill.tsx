"use client";
import { Mood, MOOD_PALETTES } from "@/lib/constants";

export function MoodPill({
  mood,
  selected,
  onSelect,
  size = "default",
}: {
  mood: Mood;
  selected: boolean;
  onSelect: () => void;
  size?: "default" | "large";
}) {
  const palette = MOOD_PALETTES[mood];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold tracking-wide transition-all select-none
        ${size === "large" ? "h-[44px] px-6 text-[15px]" : "h-[40px] px-5 text-[14px]"}
        ${
          selected
            ? "bg-[#2D2A6E] text-[#FFF8E7] border-[2px] border-[#FFF8E7] shadow-[0_0_0_4px_rgba(255,248,231,0.12)]"
            : "bg-[#2D2A6E] text-[#D9D6F7] border-[2px] border-white/10 hover:border-white/20 hover:text-[#FFF8E7]"
        }
      `}
      style={{ fontFamily: "var(--font-fredoka)" }}
    >
      <span aria-hidden>{palette.emoji}</span>
      <span>{mood}</span>
    </button>
  );
}

export function MoodPillsRow({
  value,
  onChange,
}: {
  value: Mood;
  onChange: (m: Mood) => void;
}) {
  const moods: Mood[] = ["Calm", "Silly", "Brave", "Sleepy", "Adventurous"];
  return (
    <div className="flex flex-wrap gap-2.5">
      {moods.map((m) => (
        <MoodPill key={m} mood={m} selected={value === m} onSelect={() => onChange(m)} />
      ))}
    </div>
  );
}
