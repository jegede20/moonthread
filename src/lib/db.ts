import { Story, StorySettings } from "./storyTypes";

const DB_NAME = "moonthread-db";
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("No window"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("favorites")) {
        db.createObjectStore("favorites", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("temp")) {
        db.createObjectStore("temp", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveFavorite(story: Story): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("favorites", "readwrite");
    tx.objectStore("favorites").put(story);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getFavorites(): Promise<Story[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("favorites", "readonly");
    const req = tx.objectStore("favorites").getAll();
    req.onsuccess = () => {
      const arr = req.result as Story[];
      arr.sort((a, b) => b.createdAt - a.createdAt);
      resolve(arr);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getFavorite(id: string): Promise<Story | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("favorites", "readonly");
    const req = tx.objectStore("favorites").get(id);
    req.onsuccess = () => resolve(req.result as Story | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteFavorite(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("favorites", "readwrite");
    tx.objectStore("favorites").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveTempStory(story: Story): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("temp", "readwrite");
    tx.objectStore("temp").put(story);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getTempStory(id: string): Promise<Story | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("temp", "readonly");
    const req = tx.objectStore("temp").get(id);
    req.onsuccess = () => resolve(req.result as Story | undefined);
    req.onerror = () => reject(req.error);
  });
}

const DEFAULT_SETTINGS: StorySettings = {
  speed: "normal",
  textSize: "medium",
  reduceMotion: false,
  defaultSound: "off",
  defaultVolume: 0.5,
  defaultSleepTimer: "off",
};

export async function getSettings(): Promise<StorySettings> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction("settings", "readonly");
    const req = tx.objectStore("settings").get("global");
    req.onsuccess = () => {
      const val = req.result?.value as StorySettings | undefined;
      if (val) {
        resolve({ ...DEFAULT_SETTINGS, ...val });
      } else {
        resolve(DEFAULT_SETTINGS);
      }
    };
    req.onerror = () => resolve(DEFAULT_SETTINGS);
  });
}

export async function saveSettings(settings: Partial<StorySettings>): Promise<void> {
  const db = await openDB();
  const current = await getSettings();
  const merged = { ...current, ...settings };
  return new Promise((resolve, reject) => {
    const tx = db.transaction("settings", "readwrite");
    tx.objectStore("settings").put({ id: "global", value: merged });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
