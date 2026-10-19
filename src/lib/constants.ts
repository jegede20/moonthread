export const ANIMALS = ["Fox", "Bunny", "Frog", "Owl", "Bear", "Dino"] as const;
export type Animal = typeof ANIMALS[number];

export const MOODS = ["Calm", "Silly", "Brave", "Sleepy", "Adventurous"] as const;
export type Mood = typeof MOODS[number];

export const AGE_GROUPS = ["2-4", "5-7", "8-10"] as const;
export type AgeGroup = typeof AGE_GROUPS[number];

export const AGE_CONFIG: Record<AgeGroup, { scenes: number; label: string; description: string }> = {
  "2-4": { scenes: 3, label: "2-4 yrs", description: "Very simple words, gentle repetition" },
  "5-7": { scenes: 5, label: "5-7 yrs", description: "Simple sentences, cozy adventure" },
  "8-10": { scenes: 6, label: "8-10 yrs", description: "Richer vocabulary, gentle journey" },
};

export const MOOD_PALETTES: Record<Mood, { primary: string; secondary: string; accent: string; bg: string; label: string; emoji: string; description: string }> = {
  Calm: { primary: "#7DD3FC", secondary: "#C4B5FD", accent: "#6EE7B7", bg: "#2D2A6E", label: "Calm", emoji: "🌙", description: "Soft and peaceful" },
  Silly: { primary: "#FFD93D", secondary: "#FF8FB1", accent: "#7DD3FC", bg: "#2D2A6E", label: "Silly", emoji: "🌟", description: "Giggle-filled fun" },
  Brave: { primary: "#FF7A59", secondary: "#FFD93D", accent: "#C4B5FD", bg: "#2D2A6E", label: "Brave", emoji: "🦁", description: "Gentle courage" },
  Sleepy: { primary: "#1E1B4B", secondary: "#D9D6F7", accent: "#C4B5FD", bg: "#16143A", label: "Sleepy", emoji: "💤", description: "Drift to dreams" },
  Adventurous: { primary: "#6EE7B7", secondary: "#7DD3FC", accent: "#FFD93D", bg: "#2D2A6E", label: "Adventurous", emoji: "🗺️", description: "Little explorations" },
};

export const ANIMAL_COLORS: Record<Animal, { main: string; light: string; dark: string; extra: string }> = {
  Fox: { main: "#FF7A59", light: "#FFF8E7", dark: "#8B3A24", extra: "#FFD93D" },
  Bunny: { main: "#FFF8E7", light: "#FF8FB1", dark: "#1E1B4B", extra: "#D9D6F7" },
  Frog: { main: "#6EE7B7", light: "#FFF8E7", dark: "#1E1B4B", extra: "#7DD3FC" },
  Owl: { main: "#C4B5FD", light: "#FFF8E7", dark: "#1E1B4B", extra: "#FFD93D" },
  Bear: { main: "#E0A87A", light: "#FFF8E7", dark: "#5C3D2E", extra: "#FFD93D" },
  Dino: { main: "#FFD93D", light: "#FF8FB1", dark: "#1E1B4B", extra: "#FF7A59" },
};

export const COLORS = {
  midnight: "#1E1B4B",
  card: "#2D2A6E",
  footer: "#16143A",
  cream: "#FFF8E7",
  secondary: "#D9D6F7",
  yellow: "#FFD93D",
  pink: "#FF8FB1",
  lavender: "#C4B5FD",
  mint: "#6EE7B7",
  sky: "#7DD3FC",
  coral: "#FF7A59",
  coralShadow: "#C4533A",
};

// Updated Oct 2026: Llama 3.1 8B and 3.3 70B were decommissioned on Groq free tier Aug 16 2026
// Recommended replacements: openai/gpt-oss-20b (fast, 1000 tok/s) and openai/gpt-oss-120b
// Using gpt-oss-20b as default for free tier - verified working
export const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
export const STORY_COOLDOWN_MS = 15000;

export const SLEEP_TIMERS = [
  { id: "off", label: "Off", minutes: 0 },
  { id: "10", label: "10 min", minutes: 10 },
  { id: "20", label: "20 min", minutes: 20 },
  { id: "30", label: "30 min", minutes: 30 },
  { id: "end", label: "End of story", minutes: -1 },
] as const;

export type SleepTimerId = typeof SLEEP_TIMERS[number]["id"];

export const BACKGROUND_SOUNDS = [
  { id: "off", label: "Off", emoji: "🔇" },
  { id: "rain", label: "Rain", emoji: "🌧️" },
  { id: "crickets", label: "Crickets", emoji: "🦗" },
  { id: "ocean", label: "Ocean", emoji: "🌊" },
  { id: "wind", label: "Wind", emoji: "🍃" },
] as const;

export type BgSoundId = typeof BACKGROUND_SOUNDS[number]["id"];

export const TEXT_SIZES = ["small", "medium", "large"] as const;
export type TextSize = typeof TEXT_SIZES[number];

export const SPEEDS = [
  { id: "slow", label: "Slow", rate: 0.8 },
  { id: "normal", label: "Normal", rate: 1.0 },
  { id: "fast", label: "Fast", rate: 1.2 },
] as const;

export type SpeedId = typeof SPEEDS[number]["id"];
