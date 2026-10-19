"use client";
import { Animal } from "@/lib/constants";

const ANIMAL_DRAW: Record<Animal, { color: string; face: string }> = {
  Fox: { color: "#FF7A59", face: "🦊" },
  Bunny: { color: "#FFF8E7", face: "🐰" },
  Frog: { color: "#6EE7B7", face: "🐸" },
  Owl: { color: "#C4B5FD", face: "🦉" },
  Bear: { color: "#E0A87A", face: "🐻" },
  Dino: { color: "#FFD93D", face: "🦕" },
};

export function AnimalFace({ animal, size = 56 }: { animal: Animal; size?: number }) {
  // Use canvas-like SVG drawing for each animal
  const s = size;
  if (animal === "Fox") {
    return (
      <svg width={s} height={s} viewBox="0 0 56 56" aria-hidden>
        <circle cx="28" cy="32" r="18" fill="#FF7A59" />
        <ellipse cx="28" cy="38" rx="10" ry="8" fill="#FFF8E7" />
        <path d="M12 18 L16 6 L24 16 Z" fill="#FF7A59" />
        <path d="M44 18 L40 6 L32 16 Z" fill="#FF7A59" />
        <path d="M15 14 L17 9 L21 15 Z" fill="#8B3A24" />
        <path d="M41 14 L39 9 L35 15 Z" fill="#8B3A24" />
        <circle cx="20" cy="30" r="3" fill="#1E1B4B" />
        <circle cx="36" cy="30" r="3" fill="#1E1B4B" />
        <circle cx="28" cy="36" r="2" fill="#1E1B4B" />
      </svg>
    );
  }
  if (animal === "Bunny") {
    return (
      <svg width={s} height={s} viewBox="0 0 56 56" aria-hidden>
        <ellipse cx="20" cy="16" rx="6" ry="14" fill="#FFF8E7" />
        <ellipse cx="36" cy="16" rx="6" ry="14" fill="#FFF8E7" />
        <ellipse cx="20" cy="18" rx="2.5" ry="6" fill="#FF8FB1" />
        <ellipse cx="36" cy="18" rx="2.5" ry="6" fill="#FF8FB1" />
        <circle cx="28" cy="34" r="16" fill="#FFF8E7" />
        <circle cx="20" cy="33" r="2.8" fill="#1E1B4B" />
        <circle cx="36" cy="33" r="2.8" fill="#1E1B4B" />
        <circle cx="28" cy="38" r="1.8" fill="#FF8FB1" />
      </svg>
    );
  }
  if (animal === "Frog") {
    return (
      <svg width={s} height={s} viewBox="0 0 56 56" aria-hidden>
        <ellipse cx="28" cy="34" rx="20" ry="16" fill="#6EE7B7" />
        <circle cx="18" cy="18" r="9" fill="#FFF8E7" />
        <circle cx="38" cy="18" r="9" fill="#FFF8E7" />
        <circle cx="18" cy="19" r="4" fill="#1E1B4B" />
        <circle cx="38" cy="19" r="4" fill="#1E1B4B" />
        <path d="M18 38 Q28 44 38 38" stroke="#1E1B4B" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  if (animal === "Owl") {
    return (
      <svg width={s} height={s} viewBox="0 0 56 56" aria-hidden>
        <ellipse cx="28" cy="34" rx="18" ry="16" fill="#C4B5FD" />
        <circle cx="28" cy="22" r="18" fill="#C4B5FD" />
        <path d="M12 14 L10 6 L18 12 Z" fill="#C4B5FD" />
        <path d="M44 14 L46 6 L38 12 Z" fill="#C4B5FD" />
        <circle cx="20" cy="24" r="8" fill="#FFF8E7" />
        <circle cx="36" cy="24" r="8" fill="#FFF8E7" />
        <circle cx="20" cy="24" r="3.5" fill="#1E1B4B" />
        <circle cx="36" cy="24" r="3.5" fill="#1E1B4B" />
        <path d="M28 26 L24 30 L32 30 Z" fill="#FFD93D" />
      </svg>
    );
  }
  if (animal === "Bear") {
    return (
      <svg width={s} height={s} viewBox="0 0 56 56" aria-hidden>
        <circle cx="14" cy="18" r="7" fill="#E0A87A" />
        <circle cx="42" cy="18" r="7" fill="#E0A87A" />
        <circle cx="14" cy="19" r="3" fill="#C48A5E" />
        <circle cx="42" cy="19" r="3" fill="#C48A5E" />
        <circle cx="28" cy="32" r="18" fill="#E0A87A" />
        <ellipse cx="28" cy="38" rx="10" ry="7" fill="#FFF8E7" />
        <circle cx="20" cy="28" r="2.8" fill="#1E1B4B" />
        <circle cx="36" cy="28" r="2.8" fill="#1E1B4B" />
        <circle cx="28" cy="36" r="2" fill="#1E1B4B" />
      </svg>
    );
  }
  // Dino
  return (
    <svg width={s} height={s} viewBox="0 0 56 56" aria-hidden>
      <ellipse cx="28" cy="36" rx="18" ry="14" fill="#FFD93D" />
      <path d="M16 22 L18 12 L22 20 Z" fill="#FF7A59" />
      <path d="M28 18 L30 8 L34 18 Z" fill="#FF7A59" />
      <path d="M40 22 L42 12 L46 22 Z" fill="#FF7A59" />
      <circle cx="28" cy="30" r="16" fill="#FFD93D" />
      <circle cx="20" cy="29" r="3" fill="#FF8FB1" opacity="0.8" />
      <circle cx="36" cy="29" r="3" fill="#FF8FB1" opacity="0.8" />
      <circle cx="20" cy="27" r="2.8" fill="#1E1B4B" />
      <circle cx="36" cy="27" r="2.8" fill="#1E1B4B" />
    </svg>
  );
}

export function AnimalTile({
  animal,
  selected,
  onSelect,
}: {
  animal: Animal;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Select ${animal}`}
      className={`group relative flex flex-col items-center justify-center gap-2 rounded-[20px] p-3 md:p-4 min-h-[96px] transition-all
        ${selected ? "bg-[#2D2A6E] border-[3px] border-[#FFD93D] shadow-[0_0_0_3px_rgba(255,217,61,0.15)]" : "bg-[#2D2A6E] border-[2px] border-transparent hover:border-[#C4B5FD]/40"}
      `}
    >
      <AnimalFace animal={animal} size={52} />
      <span
        className="text-[13px] font-bold tracking-wide text-[#FFF8E7]"
        style={{ fontFamily: "var(--font-fredoka)" }}
      >
        {animal}
      </span>
      {selected && (
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#FFD93D] text-[#1E1B4B] flex items-center justify-center text-[12px] font-bold">
          ✓
        </span>
      )}
    </button>
  );
}
