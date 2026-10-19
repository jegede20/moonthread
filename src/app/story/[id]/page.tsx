"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Story } from "@/lib/storyTypes";
import { getTempStory, getFavorite, saveFavorite, deleteFavorite, getFavorites, getSettings, saveTempStory } from "@/lib/db";
import { StoryCanvas } from "@/components/StoryCanvas";
import { BottomNav } from "@/components/BottomNav";
import { LogoWordmark } from "@/components/Logo";
import { soundManager } from "@/lib/sounds";
import { MOODS, STORY_LENGTHS, Mood, StoryLengthId, AGE_CONFIG } from "@/lib/constants";
import { generateOfflineStory } from "@/lib/offlineTemplates";

export default function StoryPage() {
  const params = useParams();
  const search = useSearchParams();
  const id = params.id as string;
  const isOfflineHint = search.get("offline") === "1";
  return <StoryPageInner id={id} showOfflineNote={isOfflineHint} />;
}

function StoryPageInner({ id, showOfflineNote: initialOfflineNote }: { id: string; showOfflineNote: boolean }) {
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showOfflineNote, setShowOfflineNote] = useState(initialOfflineNote);
  const [page, setPage] = useState(0);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [selectedLength, setSelectedLength] = useState<StoryLengthId | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        let s = await getTempStory(id);
        if (!s) s = await getFavorite(id);
        if (!s) {
          setLoading(false);
          return;
        }
        setStory(s);
        setSelectedMood(s.mood);
        setSelectedLength((s.storyLength as StoryLengthId) || (AGE_CONFIG[s.ageGroup].scenes <= 3 ? "short" : AGE_CONFIG[s.ageGroup].scenes <=5 ? "medium" : "long"));
        const favs = await getFavorites();
        setIsFav(favs.some((f) => f.id === s!.id));
        const settings = await getSettings();
        setReduceMotion(settings.reduceMotion);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const toggleFav = async () => {
    if (!story) return;
    if (isFav) {
      await deleteFavorite(story.id);
      setIsFav(false);
    } else {
      await saveFavorite(story);
      setIsFav(true);
    }
  };

  const handleRegenerate = async (overrides?: { mood?: Mood; length?: StoryLengthId }) => {
    if (!story) return;
    const newMood = overrides?.mood || selectedMood || story.mood;
    const newLength = overrides?.length || selectedLength || story.storyLength || "medium";
    setRegenLoading(true);
    setRegenError(null);
    setShowOfflineNote(false);
    try {
      // Stop any audio
      soundManager.stop();
      if (typeof window !== "undefined") window.speechSynthesis.cancel();

      const input = {
        childName: story.childName,
        animal: story.animal,
        mood: newMood,
        ageGroup: story.ageGroup,
        storyLength: newLength,
      };

      let newStoryData: { id: string; title: string; scenes: any[] };
      let isOffline = false;

      try {
        if (typeof navigator !== "undefined" && !navigator.onLine) throw new Error("offline");
        const res = await fetch("/api/story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || `Server ${res.status}`);
        }
        newStoryData = await res.json();
      } catch (e) {
        console.warn("Regen offline fallback", e);
        const offline = generateOfflineStory(input);
        newStoryData = { id: offline.id, title: offline.title, scenes: offline.scenes };
        isOffline = true;
      }

      const newStory: Story = {
        id: story.id, // keep same id so URL stays valid, but update content
        title: newStoryData.title,
        childName: story.childName,
        animal: story.animal,
        mood: newMood,
        ageGroup: story.ageGroup,
        scenes: newStoryData.scenes,
        createdAt: Date.now(),
        isOffline: isOffline,
        storyLength: newLength,
      };

      await saveTempStory(newStory);
      if (isFav) await saveFavorite(newStory);
      setStory(newStory);
      setSelectedMood(newMood);
      setSelectedLength(newLength);
      setPage(0);
      if (isOffline) setShowOfflineNote(true);
      localStorage.setItem("moonthread-last-story", Date.now().toString());
    } catch (e: any) {
      setRegenError(e.message || "Could not regenerate, try again");
    } finally {
      setRegenLoading(false);
    }
  };

  const handleMakeLonger = async () => {
    if (!story || !selectedLength) return;
    const order: StoryLengthId[] = ["short", "medium", "long", "extra"];
    const idx = order.indexOf(selectedLength);
    if (idx >= order.length - 1) return;
    await handleRegenerate({ length: order[idx + 1] });
  };

  const handleMakeShorter = async () => {
    if (!story || !selectedLength) return;
    const order: StoryLengthId[] = ["short", "medium", "long", "extra"];
    const idx = order.indexOf(selectedLength);
    if (idx <= 0) return;
    await handleRegenerate({ length: order[idx - 1] });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1E1B4B] flex flex-col items-center justify-center gap-6 p-6">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 rounded-full bg-[#FFD93D] animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-[#1E1B4B] flex items-center justify-center">
            <span className="text-[20px]">🌙</span>
          </div>
          <svg className="absolute -bottom-2 left-1/2 -translate-x-1/2" width="40" height="20" viewBox="0 0 40 20">
            <path d="M5 5C15 8 20 18 10 18C4 18 2 12 8 10" fill="none" stroke="#FFF8E7" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-bold text-[18px] text-[#FFF8E7]" style={{ fontFamily: "var(--font-fredoka)" }}>
            Weaving your story...
          </p>
          <p className="mt-2 text-[14px] text-[#D9D6F7]">Drawing stars, hills and a sleepy {story?.animal || "friend"}</p>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-[#1E1B4B] flex flex-col">
        <header className="h-[68px] px-6 flex items-center border-b border-white/5">
          <Link href="/" className="flex items-center gap-2">
            <LogoWordmark size={32} />
          </Link>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-[#2D2A6E] flex items-center justify-center text-[32px]">📖</div>
          <h2 className="mt-6 text-[20px] font-bold text-[#FFF8E7]" style={{ fontFamily: "var(--font-fredoka)" }}>
            Story not found
          </h2>
          <p className="mt-2 text-[14px] text-[#D9D6F7] max-w-[32ch]">It may have been cleared from this device. Try making a new one.</p>
          <Link href="/create" className="mt-6 h-11 px-6 rounded-full bg-[#FF7A59] text-[#1E1B4B] font-bold inline-flex items-center">
            Make a story
          </Link>
        </div>
      </div>
    );
  }

  const currentLen = STORY_LENGTHS.find((l) => l.id === selectedLength);
  const canLonger = selectedLength !== "extra";
  const canShorter = selectedLength !== "short";

  return (
    <div className="min-h-screen flex flex-col bg-[#1E1B4B] pb-[88px] md:pb-0">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-[#1E1B4B]/90 border-b border-white/5">
        <div className="mx-auto max-w-[1280px] px-4 md:px-8 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundManager.stop();
                if (typeof window !== "undefined") window.speechSynthesis.cancel();
                router.back();
              }}
              aria-label="Back"
              className="w-9 h-9 rounded-full bg-[#2D2A6E] border border-white/10 flex items-center justify-center text-[#FFF8E7]"
            >
              ←
            </button>
            <div className="hidden md:flex">
              <LogoWordmark size={28} />
            </div>
            <h1 className="text-[16px] md:text-[18px] font-bold text-[#FFF8E7] truncate max-w-[180px] md:max-w-[320px]" style={{ fontFamily: "var(--font-fredoka)" }}>
              {story.title}
            </h1>
          </div>

          <button
            onClick={toggleFav}
            aria-label={isFav ? "Remove from favorites" : "Save to favorites"}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors ${
              isFav ? "bg-[#FF8FB1] border-[#FF8FB1] text-[#1E1B4B]" : "bg-[#2D2A6E] border-white/10 text-[#FFF8E7]"
            }`}
          >
            {isFav ? "♥" : "♡"}
          </button>
        </div>
      </header>

      {showOfflineNote && (
        <div className="mx-auto max-w-[1280px] w-full px-4 md:px-8 pt-4">
          <div className="rounded-[16px] bg-[#FFD93D]/15 border border-[#FFD93D]/30 p-3 flex items-start justify-between gap-3">
            <p className="text-[13px] text-[#FFD93D] leading-snug">
              Telling an offline story — we couldn&apos;t reach the story writer, so we used a cozy template. It can still be saved and played offline.
            </p>
            <button onClick={() => setShowOfflineNote(false)} className="text-[#FFD93D] text-[14px] px-2" aria-label="Dismiss">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Regenerate & Length controls */}
      <div className="mx-auto max-w-[1280px] w-full px-4 md:px-8 pt-6">
        <div className="rounded-[20px] bg-[#2D2A6E]/60 border border-white/10 p-4 md:p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold tracking-widest uppercase text-[#D9D6F7]" style={{ fontFamily: "var(--font-fredoka)" }}>
                Story type • Mood
              </span>
              {regenLoading && <span className="text-[11px] text-[#FFD93D] flex items-center gap-1"><span className="w-3 h-3 border border-[#FFD93D]/30 border-t-[#FFD93D] rounded-full animate-spin" /> weaving...</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRegenerate()}
                disabled={regenLoading}
                className="h-[36px] px-4 rounded-full bg-[#FFF8E7] text-[#1E1B4B] font-bold text-[12px] flex items-center gap-1.5 disabled:opacity-60 hover:bg-white transition-colors"
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                ↻ Regenerate
              </button>
              <button
                onClick={handleMakeLonger}
                disabled={regenLoading || !canLonger}
                className="h-[36px] px-3 rounded-full bg-[#FFD93D] text-[#1E1B4B] font-bold text-[12px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FFEB8A] transition-colors"
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                + Longer
              </button>
              <button
                onClick={handleMakeShorter}
                disabled={regenLoading || !canShorter}
                className="h-[36px] px-3 rounded-full bg-[#2D2A6E] border border-white/15 text-[#D9D6F7] font-bold text-[12px] disabled:opacity-40 hover:border-white/30 transition-colors"
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                − Shorter
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setSelectedMood(m);
                  handleRegenerate({ mood: m });
                }}
                disabled={regenLoading}
                className={`h-[34px] px-3.5 rounded-full text-[12px] font-bold border transition-all flex items-center gap-1.5 ${
                  selectedMood === m
                    ? "bg-[#FF8FB1] text-[#1E1B4B] border-[#FF8FB1]"
                    : "bg-[#1E1B4B] text-[#D9D6F7] border-white/10 hover:border-white/20"
                } disabled:opacity-50`}
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                {m === "Calm" ? "☁️" : m === "Silly" ? "🤪" : m === "Brave" ? "🦁" : m === "Sleepy" ? "😴" : "🗺️"} {m}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#9A96C8] mr-1" style={{ fontFamily: "var(--font-fredoka)" }}>
              Length
            </span>
            {STORY_LENGTHS.map((len) => (
              <button
                key={len.id}
                onClick={() => {
                  setSelectedLength(len.id);
                  handleRegenerate({ length: len.id });
                }}
                disabled={regenLoading}
                className={`h-[34px] px-3 rounded-full text-[11px] font-bold border transition-all ${
                  selectedLength === len.id
                    ? "bg-[#FFF8E7] text-[#1E1B4B] border-[#FFF8E7]"
                    : "bg-[#1E1B4B] text-[#9A96C8] border-white/10 hover:border-white/20 hover:text-[#D9D6F7]"
                } disabled:opacity-50`}
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                {len.label} • {len.scenes}
              </button>
            ))}
            {currentLen && <span className="text-[11px] text-[#9A96C8] ml-1">{currentLen.description} • {story.childName} + {story.animal}</span>}
          </div>

          {regenError && <div className="text-[12px] text-[#FF8FB1] bg-[#FF8FB1]/10 border border-[#FF8FB1]/20 rounded-[12px] p-2.5">{regenError}</div>}
        </div>
      </div>

      <main className="flex-1 mx-auto w-full max-w-[1280px] px-4 md:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <div className="flex-1 lg:sticky lg:top-[88px] lg:h-fit">
            <StoryCanvas animal={story.animal} mood={selectedMood || story.mood} description={story.scenes[page]?.description || ""} reduceMotion={reduceMotion} />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[12px] text-[#9A96C8]" style={{ fontFamily: "var(--font-nunito)" }}>
                Page {page + 1} of {story.scenes.length} • {story.animal} • {selectedMood || story.mood} • {currentLen?.label || story.scenes.length + " scenes"}
              </span>
              {story.isOffline && <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#2D2A6E] text-[#D9D6F7] border border-white/10">Offline story</span>}
            </div>
          </div>

          <div className="flex-1 max-w-[600px]">
            <ControlledReader story={story} page={page} setPage={setPage} reduceMotion={reduceMotion} onRegenerate={handleRegenerate} regenLoading={regenLoading} />
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

// Controlled reader that syncs page with parent — now auto-advances through all scenes
function ControlledReader({ story, page, setPage, reduceMotion, onRegenerate, regenLoading }: { story: Story; page: number; setPage: (n: number) => void; reduceMotion: boolean; onRegenerate: (o?: any) => void; regenLoading: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIdx, setCurrentWordIdx] = useState<number | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [customPitch, setCustomPitch] = useState<number>(1);
  const [customRateFactor, setCustomRateFactor] = useState<number>(1);
  const [speedId, setSpeedId] = useState<"slow" | "normal" | "fast">("normal");
  const [sleepTimer, setSleepTimer] = useState<string>("off");
  const [bgSound, setBgSound] = useState<any>("off");
  const [volume, setVolume] = useState(0.5);
  const [textSize, setTextSize] = useState<"small" | "medium" | "large">("medium");
  const [showGoodnight, setShowGoodnight] = useState(false);
  const [sleepRemaining, setSleepRemaining] = useState<number | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sleepTimeoutRef = useRef<any>(null);
  const sleepIntervalRef = useRef<any>(null);
  const fadeIntervalRef = useRef<any>(null);
  const autoAdvanceTimeoutRef = useRef<any>(null);
  const fallbackIntervalRef = useRef<any>(null);
  const isContinuousRef = useRef(false);
  const currentPageRef = useRef(page);

  // Keep ref in sync
  useEffect(() => {
    currentPageRef.current = page;
  }, [page]);

  const scene = story.scenes[page];
  const cleanWords = scene ? scene.text.split(/\s+/) : [];

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setSpeedId(s.speed);
      setTextSize(s.textSize);
      setBgSound(s.defaultSound);
      setVolume(s.defaultVolume);
      setSleepTimer(s.defaultSleepTimer);
      if (s.voiceURI) setSelectedVoiceURI(s.voiceURI);
    })();
  }, []);

  useEffect(() => {
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

  useEffect(() => {
    if (bgSound !== "off") {
      soundManager.play(bgSound, volume);
    } else {
      soundManager.stop();
    }
  }, [bgSound, volume]);

  useEffect(() => {
    return () => {
      if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
      if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
      if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
      soundManager.stop();
      window.speechSynthesis.cancel();
    };
  }, []);

  // Only reset when story id changes, not on every page change (to allow auto-advance)
  useEffect(() => {
    setIsPlaying(false);
    setCurrentWordIdx(null);
    isContinuousRef.current = false;
    window.speechSynthesis.cancel();
    if (utteranceRef.current) utteranceRef.current = null;
    if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
    if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
  }, [story.id]);

  const startSleepTimer = (minutesStr: string) => {
    if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
    if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    setSleepRemaining(null);
    if (minutesStr === "off") return;
    const minutes = parseInt(minutesStr, 10);
    if (isNaN(minutes)) return;
    const ms = minutes * 60 * 1000;
    let remaining = minutes * 60;
    setSleepRemaining(remaining);
    sleepIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setSleepRemaining(remaining);
      if (remaining <= 0) {
        if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
      }
    }, 1000);
    sleepTimeoutRef.current = setTimeout(() => {
      fadeOutAndStop();
    }, ms);
  };

  const fadeOutAndStop = () => {
    isContinuousRef.current = false;
    setIsPlaying(false);
    window.speechSynthesis.cancel();
    setCurrentWordIdx(null);
    if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
    if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
    let vol = volume;
    fadeIntervalRef.current = setInterval(() => {
      vol -= 0.05;
      if (vol <= 0) {
        vol = 0;
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        soundManager.stop();
        setShowGoodnight(true);
        setTimeout(() => setShowGoodnight(false), 4000);
        setSleepRemaining(null);
      } else {
        soundManager.setVolume(vol);
      }
    }, 200);
  };

  const stopPlayback = () => {
    isContinuousRef.current = false;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentWordIdx(null);
    if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
    if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
    if (utteranceRef.current) utteranceRef.current = null;
  };

  const speakScene = (idx: number) => {
    if (idx < 0 || idx >= story.scenes.length) return;
    // Clear previous
    window.speechSynthesis.cancel();
    if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
    if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);

    const text = story.scenes[idx].text;
    const utterance = new SpeechSynthesisUtterance(text);
    const rateMap = { slow: 0.8, normal: 1, fast: 1.25 };
    const baseRate = rateMap[speedId] || 1;
    // Mood profile makes moods sound DISTINCT on both mobile & desktop
    const moodProf = (typeof MOOD_AUDIO_PROFILE !== "undefined" ? (MOOD_AUDIO_PROFILE as any)[story.mood] : null) || { pitchMod: 0, rateMod: 1, pause: 800, volume: 1 };
    const clampLocal = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
    const effectivePitch = clampLocal(customPitch + moodProf.pitchMod, 0.5, 2);
    const effectiveRate = clampLocal(baseRate * customRateFactor * moodProf.rateMod, 0.5, 2);
    utterance.rate = effectiveRate;
    utterance.pitch = effectivePitch;
    utterance.volume = moodProf.volume;
    if (selectedVoiceURI) {
      const v = voices.find((vv) => vv.voiceURI === selectedVoiceURI);
      if (v) utterance.voice = v;
    }

    let wordIndex = 0;
    const words = text.split(/\s+/);

    utterance.onboundary = (e: any) => {
      if (e.name === "word") {
        // Only highlight if this is still the visible page
        if (currentPageRef.current === idx) {
          setCurrentWordIdx(wordIndex);
        }
        wordIndex++;
      }
    };

    fallbackIntervalRef.current = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(fallbackIntervalRef.current);
        return;
      }
      if (wordIndex < words.length && currentPageRef.current === idx) {
        setCurrentWordIdx((prev) => (prev === null ? 0 : Math.min((prev || 0) + 1, words.length - 1)));
        wordIndex++;
      }
    }, 400);

    utterance.onend = () => {
      if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
      setCurrentWordIdx(null);

      // If user stopped in the meantime, don't auto-advance
      if (!isContinuousRef.current) {
        setIsPlaying(false);
        return;
      }

      if (idx < story.scenes.length - 1) {
        // Advance to next scene — pause varies by mood so moods sound distinct
        const nextIdx = idx + 1;
        setPage(nextIdx);
        const pauseMs = (typeof MOOD_AUDIO_PROFILE !== "undefined" ? (MOOD_AUDIO_PROFILE as any)[story.mood]?.pause : 800) || 800;
        autoAdvanceTimeoutRef.current = setTimeout(() => {
          if (isContinuousRef.current) {
            speakScene(nextIdx);
          }
        }, pauseMs);
      } else {
        // Finished all scenes
        isContinuousRef.current = false;
        setIsPlaying(false);
        setShowGoodnight(true);
        setTimeout(() => setShowGoodnight(false), 4000);
      }
    };

    utterance.onerror = () => {
      if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
      setCurrentWordIdx(null);
      if (isContinuousRef.current && idx < story.scenes.length - 1) {
        const nextIdx = idx + 1;
        setPage(nextIdx);
        const pauseMs = (typeof MOOD_AUDIO_PROFILE !== "undefined" ? (MOOD_AUDIO_PROFILE as any)[story.mood]?.pause : 800) || 800;
        autoAdvanceTimeoutRef.current = setTimeout(() => speakScene(nextIdx), pauseMs);
      } else {
        isContinuousRef.current = false;
        setIsPlaying(false);
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const handlePlay = () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    // Start continuous playback from current page to end
    isContinuousRef.current = true;
    speakScene(page);
    if (sleepTimer !== "off") {
      startSleepTimer(sleepTimer);
    }
  };

  const handleManualNav = (newPage: number) => {
    // User manually navigated — stop auto-play
    if (isPlaying) stopPlayback();
    setPage(newPage);
    setCurrentWordIdx(null);
  };

  const textSizeClass = textSize === "small" ? "text-[16px] leading-[1.7]" : textSize === "large" ? "text-[22px] leading-[1.6]" : "text-[18px] leading-[1.75]";

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[24px] bg-[#FFF8E7] p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-bold tracking-widest uppercase text-[#9A96C8]" style={{ fontFamily: "var(--font-fredoka)" }}>
            {story.childName} • {story.animal} • {story.mood}
          </span>
          <span className="text-[11px] text-[#9A96C8]">{page + 1}/{story.scenes.length}</span>
        </div>

        <div className={`${textSizeClass} text-[#1E1B4B] font-medium`} style={{ fontFamily: "var(--font-nunito)" }}>
          {cleanWords.map((w, i) => (
            <span key={i} className={`${currentWordIdx === i ? "bg-[#FFD93D]/40 rounded-[4px] px-0.5" : ""} transition-colors`}>
              {w}{" "}
            </span>
          ))}
        </div>

        {showGoodnight && (
          <div className="mt-6 rounded-[16px] bg-[#1E1B4B] text-[#FFF8E7] p-4 text-center animate-in fade-in">
            <p className="font-bold text-[16px]" style={{ fontFamily: "var(--font-fredoka)" }}>Goodnight, {story.childName} 🌙</p>
            <p className="text-[13px] mt-1 text-[#D9D6F7]">Sleepy stars are watching over you.</p>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => handleManualNav(Math.max(0, page - 1))}
            disabled={page === 0}
            className="h-10 px-4 rounded-full bg-[#2D2A6E]/10 text-[#1E1B4B] font-bold text-[13px] disabled:opacity-30"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            ← Back
          </button>
          <button
            onClick={handlePlay}
            className={`h-12 px-6 rounded-full font-bold text-[14px] flex items-center gap-2 transition-colors ${
              isPlaying ? "bg-[#1E1B4B] text-[#FFF8E7]" : "bg-[#FF7A59] text-[#1E1B4B] shadow-[0_3px_0_#C4533A]"
            }`}
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            {isPlaying ? "⏸ Pause" : "▶ Play all"}
          </button>
          <button
            onClick={() => handleManualNav(Math.min(story.scenes.length - 1, page + 1))}
            disabled={page === story.scenes.length - 1}
            className="h-10 px-4 rounded-full bg-[#2D2A6E]/10 text-[#1E1B4B] font-bold text-[13px] disabled:opacity-30"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            Next →
          </button>
        </div>

        <div className="mt-4 flex gap-1.5 justify-center">
          {story.scenes.map((_, i) => (
            <button
              key={i}
              onClick={() => handleManualNav(i)}
              className={`h-1.5 rounded-full transition-all ${i === page ? "w-6 bg-[#1E1B4B]" : "w-1.5 bg-[#1E1B4B]/20"}`}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Extra controls inside reader for quick access — reverted to original arrangement */}
      <div className="rounded-[20px] bg-[#2D2A6E] border border-white/10 p-4 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-widest uppercase text-[#9A96C8]" style={{ fontFamily: "var(--font-fredoka)" }}>Quick</span>
          <button onClick={() => onRegenerate()} disabled={regenLoading} className="h-8 px-3 rounded-full bg-white/10 text-[#FFF8E7] text-[11px] font-bold hover:bg-white/15 disabled:opacity-50">↻ Same mood</button>
          <button onClick={() => onRegenerate({ length: "extra" })} disabled={regenLoading} className="h-8 px-3 rounded-full bg-[#FFD93D]/20 text-[#FFD93D] text-[11px] font-bold hover:bg-[#FFD93D]/30 disabled:opacity-50">✨ Epic long</button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-[#9A96C8]">Voice</label>
          <select
            value={selectedPresetId}
            onChange={(e) => {
              const id = e.target.value;
              if (!id) {
                setSelectedPresetId("");
                setCustomPitch(1);
                setCustomRateFactor(1);
                setSelectedVoiceURI("");
                return;
              }
              const opt = VOICE_OPTIONS.find((o) => o.id === id);
              if (opt) {
                const best = getBestVoiceForGender(voices, opt.gender as any) || voices[0];
                if (best) setSelectedVoiceURI(best.voiceURI);
                setSelectedPresetId(opt.id);
                setCustomPitch(opt.pitch);
                setCustomRateFactor(opt.rate);
              }
            }}
            className="h-8 rounded-full bg-[#1E1B4B] border border-white/10 text-[#FFF8E7] text-[11px] px-2.5 max-w-[160px]"
          >
            <option value="">Auto</option>
            <optgroup label="Female">
              {VOICE_OPTIONS.filter((o) => o.gender === "female").map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </optgroup>
            <optgroup label="Male">
              {VOICE_OPTIONS.filter((o) => o.gender === "male").map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      <div className="rounded-[20px] bg-[#2D2A6E]/50 border border-white/5 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-[#D9D6F7]" style={{ fontFamily: "var(--font-fredoka)" }}>Narration speed</span>
          <div className="flex gap-1">
            {(["slow", "normal", "fast"] as const).map((s) => (
              <button key={s} onClick={() => setSpeedId(s)} className={`h-7 px-3 rounded-full text-[11px] font-bold ${speedId === s ? "bg-[#FFF8E7] text-[#1E1B4B]" : "bg-[#1E1B4B] text-[#9A96C8] border border-white/10"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-[#D9D6F7]" style={{ fontFamily: "var(--font-fredoka)" }}>Text size</span>
          <div className="flex gap-1">
            {(["small", "medium", "large"] as const).map((sz) => (
              <button key={sz} onClick={() => setTextSize(sz)} className={`h-7 px-3 rounded-full text-[11px] font-bold ${textSize === sz ? "bg-[#FFF8E7] text-[#1E1B4B]" : "bg-[#1E1B4B] text-[#9A96C8] border border-white/10"}`}>
                {sz[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-[#D9D6F7]" style={{ fontFamily: "var(--font-fredoka)" }}>Background sound</span>
          <select value={bgSound} onChange={(e) => setBgSound(e.target.value as any)} className="h-8 rounded-full bg-[#1E1B4B] border border-white/10 text-[#FFF8E7] text-[12px] px-3">
            <option value="off">Off</option>
            <option value="rain">Rain</option>
            <option value="wind">Wind</option>
            <option value="crickets">Crickets</option>
            <option value="lullaby">Lullaby</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold text-[#D9D6F7]" style={{ fontFamily: "var(--font-fredoka)" }}>Sleep timer</span>
          <div className="flex items-center gap-2">
            {sleepRemaining !== null && <span className="text-[11px] text-[#FFD93D]">{Math.floor(sleepRemaining / 60)}:{String(sleepRemaining % 60).padStart(2, "0")}</span>}
            <select value={sleepTimer} onChange={(e) => { setSleepTimer(e.target.value); startSleepTimer(e.target.value); }} className="h-8 rounded-full bg-[#1E1B4B] border border-white/10 text-[#FFF8E7] text-[12px] px-3">
              <option value="off">Off</option>
              <option value="5">5 min</option>
              <option value="10">10 min</option>
              <option value="15">15 min</option>
              <option value="20">20 min</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple voice options — same 8 on mobile & desktop, distinct male/female tone via pitch
type VoiceGender = "female" | "male" | "neutral";

const FEMALE_HINTS = ["female", "woman", "girl", "samantha", "karen", "moira", "tessa", "veena", "fiona", "ava", "aria", "jenny", "emma", "zira", "susan", "victoria", "allison", "amelie", "anna", "helena", "lucy", "kate", "joanna", "kathy", "serena", "melina", "mariska", "sara", "lisa", "nancy", "eva", "sofia", "isabella", "google uk english female", "google us english female"];
const MALE_HINTS = ["male", "man", "boy", "daniel", "alex", "fred", "thomas", "david", "mark", "paul", "james", "arthur", "george", "lee", "oliver", "samuel", "matthew", "john", "mike", "chris", "robert", "google uk english male", "google us english male"];

function getVoiceGender(v: SpeechSynthesisVoice): VoiceGender {
  const name = v.name.toLowerCase();
  const hasFemale = FEMALE_HINTS.some((h) => name.includes(h));
  const hasMale = MALE_HINTS.some((h) => name.includes(h));
  if (hasFemale && !hasMale) return "female";
  if (hasMale && !hasFemale) return "male";
  if (name.includes("female")) return "female";
  if (name.includes("male")) return "male";
  return "neutral";
}

function getBestVoiceForGender(voices: SpeechSynthesisVoice[], gender: VoiceGender): SpeechSynthesisVoice | null {
  const gendered = voices.filter((v) => getVoiceGender(v) === gender);
  if (gendered.length > 0) return gendered[0];
  if (voices.length > 0) return voices[0];
  return null;
}

// 4 female (high pitch 1.18-1.48) + 4 male (low pitch 0.68-0.88) — same on mobile & desktop, distinct tone
const VOICE_OPTIONS = [
  { id: "female-sweet", label: "Female • Sweet", gender: "female", pitch: 1.45, rate: 0.96 },
  { id: "female-soft", label: "Female • Soft", gender: "female", pitch: 1.28, rate: 0.86 },
  { id: "female-calm", label: "Female • Calm", gender: "female", pitch: 1.15, rate: 0.9 },
  { id: "female-gentle", label: "Female • Gentle", gender: "female", pitch: 1.22, rate: 0.88 },
  { id: "male-warm", label: "Male • Warm", gender: "male", pitch: 0.78, rate: 0.96 },
  { id: "male-soft", label: "Male • Soft", gender: "male", pitch: 0.82, rate: 0.86 },
  { id: "male-calm", label: "Male • Calm", gender: "male", pitch: 0.70, rate: 0.9 },
  { id: "male-friendly", label: "Male • Friendly", gender: "male", pitch: 0.88, rate: 1.0 },
] as const;

// Mood audio — makes moods sound distinct on both mobile & desktop
const MOOD_AUDIO_PROFILE: Record<string, { pitchMod: number; rateMod: number; pause: number; volume: number }> = {
  Calm: { pitchMod: -0.05, rateMod: 0.86, pause: 900, volume: 0.9 },
  Silly: { pitchMod: 0.28, rateMod: 1.18, pause: 400, volume: 1.0 },
  Brave: { pitchMod: -0.06, rateMod: 0.94, pause: 600, volume: 1.0 },
  Sleepy: { pitchMod: -0.20, rateMod: 0.70, pause: 1300, volume: 0.84 },
  Adventurous: { pitchMod: 0.12, rateMod: 1.06, pause: 500, volume: 1.0 },
};
