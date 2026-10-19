import { Animal, Mood, AgeGroup } from "./constants";

export type Scene = {
  text: string;
  description: string; // for canvas: setting, props etc
  setting?: string;
  mood?: string;
  time?: string;
};

export type Story = {
  id: string;
  title: string;
  childName: string;
  animal: Animal;
  mood: Mood;
  ageGroup: AgeGroup;
  scenes: Scene[];
  createdAt: number;
  isOffline?: boolean;
};

export type CreateStoryInput = {
  childName: string;
  animal: Animal;
  mood: Mood;
  ageGroup: AgeGroup;
};

export type StorySettings = {
  voiceURI?: string;
  speed: "slow" | "normal" | "fast";
  textSize: "small" | "medium" | "large";
  reduceMotion: boolean;
  defaultSound: string;
  defaultVolume: number;
  defaultSleepTimer: string;
};
