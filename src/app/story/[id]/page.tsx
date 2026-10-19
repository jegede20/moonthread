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

      {/* Quick actions */}
      <div className="rounded-[20px] bg-[#2D2A6E] border border-white/10 p-4 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-widest uppercase text-[#9A96C8]" style={{ fontFamily: "var(--font-fredoka)" }}>Quick</span>
          <button onClick={() => onRegenerate()} disabled={regenLoading} className="h-8 px-3 rounded-full bg-white/10 text-[#FFF8E7] text-[11px] font-bold hover:bg-white/15 disabled:opacity-50">↻ Same mood</button>
          <button onClick={() => onRegenerate({ length: "extra" })} disabled={regenLoading} className="h-8 px-3 rounded-full bg-[#FFD93D]/20 text-[#FFD93D] text-[11px] font-bold hover:bg-[#FFD93D]/30 disabled:opacity-50">✨ Epic long</button>
        </div>
        <span className="text-[10px] text-[#9A96C8]">Auto-plays all pages • {story.scenes.length} scenes</span>
      </div>

      {/* Voice section — male & female per mood — fixed 4+4 presets same on mobile/desktop with distinct pitch/rate */}
      <VoicePicker
        voices={voices}
        selectedVoiceURI={selectedVoiceURI}
        setSelectedVoiceURI={setSelectedVoiceURI}
        selectedPresetId={selectedPresetId}
        setSelectedPresetId={setSelectedPresetId}
        setCustomPitch={setCustomPitch}
        setCustomRateFactor={setCustomRateFactor}
        mood={story.mood as any}
        childName={story.childName}
      />

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

// Voice picker — FIXED: distinct male/female even on mobile + distinct mood sounds on both platforms
type VoiceGender = "female" | "male" | "neutral";

const MOOD_VOICE_META: Record<string, { description: string; female: string[]; male: string[] }> = {
  Calm: { description: "Sweet, soft, calm", female: ["Sweet", "Soft", "Calm", "Gentle"], male: ["Warm", "Calm", "Soft", "Gentle"] },
  Silly: { description: "Bubbly, playful, cheerful", female: ["Bubbly", "Playful", "Cheerful", "Bright"], male: ["Cheerful", "Light", "Playful", "Warm"] },
  Brave: { description: "Kind, confident, steady", female: ["Kind", "Confident", "Warm", "Steady"], male: ["Steady", "Warm", "Confident", "Kind"] },
  Sleepy: { description: "Sleepy, whispery, drowsy", female: ["Sleepy", "Whispery", "Soft", "Drowsy"], male: ["Drowsy", "Soft", "Sleepy", "Calm"] },
  Adventurous: { description: "Bright, curious, friendly", female: ["Bright", "Curious", "Warm", "Gentle"], male: ["Friendly", "Warm", "Bright", "Curious"] },
};

// Mood audio profiles — make moods sound DISTINCT on both mobile & desktop via pitch/rate/pause/volume
const MOOD_AUDIO_PROFILE: Record<string, { pitchMod: number; rateMod: number; pause: number; volume: number; emoji: string }> = {
  Calm: { pitchMod: -0.05, rateMod: 0.84, pause: 950, volume: 0.9, emoji: "🌙" },
  Silly: { pitchMod: 0.32, rateMod: 1.22, pause: 350, volume: 1.0, emoji: "🤪" },
  Brave: { pitchMod: -0.08, rateMod: 0.94, pause: 600, volume: 1.0, emoji: "🦁" },
  Sleepy: { pitchMod: -0.24, rateMod: 0.68, pause: 1350, volume: 0.82, emoji: "😴" },
  Adventurous: { pitchMod: 0.15, rateMod: 1.1, pause: 500, volume: 1.0, emoji: "🗺️" },
};

const FEMALE_HINTS = ["female", "woman", "girl", "samantha", "karen", "moira", "tessa", "veena", "fiona", "ava", "aria", "jenny", "emma", "zira", "susan", "victoria", "allison", "amelie", "anna", "helena", "lucy", "kate", "joanna", "kathy", "serena", "melina", "mariska", "sara", "lisa", "nancy", "eva", "sofia", "isabella", "google uk english female", "google us english female", "siri female"];
const MALE_HINTS = ["male", "man", "boy", "daniel", "alex", "fred", "thomas", "david", "mark", "paul", "james", "arthur", "george", "lee", "oliver", "samuel", "matthew", "john", "mike", "chris", "robert", "google uk english male", "google us english male", "siri male"];

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

// FIXED: Exaggerated pitch gap female 1.3-1.5 vs male 0.65-0.85 so they sound DISTINCT even on mobile with 1 base voice
type VoicePreset = { id: string; label: string; pitch: number; rateFactor: number; emoji: string; baseVol: number };

const FEMALE_PRESETS: VoicePreset[] = [
  { id: "f-sweet", label: "Sweet", pitch: 1.48, rateFactor: 0.96, emoji: "🍯", baseVol: 1.0 },
  { id: "f-soft", label: "Soft", pitch: 1.32, rateFactor: 0.86, emoji: "☁️", baseVol: 0.92 },
  { id: "f-calm", label: "Calm", pitch: 1.18, rateFactor: 0.9, emoji: "🌙", baseVol: 0.9 },
  { id: "f-gentle", label: "Gentle", pitch: 1.26, rateFactor: 0.88, emoji: "🕊️", baseVol: 0.92 },
];

const MALE_PRESETS: VoicePreset[] = [
  { id: "m-warm", label: "Warm", pitch: 0.78, rateFactor: 0.96, emoji: "🔥", baseVol: 1.0 },
  { id: "m-soft", label: "Soft", pitch: 0.82, rateFactor: 0.86, emoji: "🍃", baseVol: 0.9 },
  { id: "m-calm", label: "Calm", pitch: 0.68, rateFactor: 0.9, emoji: "🌊", baseVol: 0.88 },
  { id: "m-friendly", label: "Friendly", pitch: 0.88, rateFactor: 1.0, emoji: "⭐", baseVol: 1.0 },
];

function getBestVoiceForGender(voices: SpeechSynthesisVoice[], gender: VoiceGender): SpeechSynthesisVoice | null {
  const gendered = voices.filter((v) => getVoiceGender(v) === gender);
  if (gendered.length > 0) return gendered[0];
  const notOpposite = voices.filter((v) => getVoiceGender(v) !== (gender === "female" ? "male" : "female"));
  if (notOpposite.length > 0) return notOpposite[0];
  if (voices.length > 0) return voices[0];
  return null;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function VoicePicker({
  voices,
  selectedVoiceURI,
  setSelectedVoiceURI,
  selectedPresetId,
  setSelectedPresetId,
  setCustomPitch,
  setCustomRateFactor,
  mood,
  childName,
}: {
  voices: SpeechSynthesisVoice[];
  selectedVoiceURI: string;
  setSelectedVoiceURI: (uri: string) => void;
  selectedPresetId: string;
  setSelectedPresetId: (id: string) => void;
  setCustomPitch: (p: number) => void;
  setCustomRateFactor: (r: number) => void;
  mood: string;
  childName: string;
}) {
  const meta = MOOD_VOICE_META[mood] || MOOD_VOICE_META.Calm;
  const moodProfile = MOOD_AUDIO_PROFILE[mood] || MOOD_AUDIO_PROFILE.Calm;

  const handleSelect = (preset: VoicePreset, gender: VoiceGender) => {
    const bestVoice = getBestVoiceForGender(voices, gender) || voices[0];
    if (bestVoice) setSelectedVoiceURI(bestVoice.voiceURI);
    setSelectedPresetId(preset.id);
    setCustomPitch(preset.pitch);
    setCustomRateFactor(preset.rateFactor);
  };

  const preview = (preset: VoicePreset, gender: VoiceGender, styleLabel: string) => {
    try {
      window.speechSynthesis.cancel();
      const bestVoice = getBestVoiceForGender(voices, gender) || voices[0];
      const effectivePitch = clamp(preset.pitch + moodProfile.pitchMod, 0.5, 2);
      const effectiveRate = clamp(preset.rateFactor * moodProfile.rateMod * 0.95, 0.5, 2);
      const text = `Hello ${childName}! I'm your ${styleLabel.toLowerCase()} ${gender} voice. ${mood} mood: ${meta.description}. Pitch ${effectivePitch.toFixed(2)}, speed ${effectiveRate.toFixed(2)}. ${preset.emoji}`;
      const u = new SpeechSynthesisUtterance(text);
      if (bestVoice) u.voice = bestVoice;
      u.pitch = effectivePitch;
      u.rate = effectiveRate;
      u.volume = moodProfile.volume * preset.baseVol;
      window.speechSynthesis.speak(u);
    } catch {}
  };

  const previewGenderDiff = () => {
    try {
      window.speechSynthesis.cancel();
      const fVoice = getBestVoiceForGender(voices, "female") || voices[0];
      const mVoice = getBestVoiceForGender(voices, "male") || voices[0];
      const fPreset = FEMALE_PRESETS[0];
      const mPreset = MALE_PRESETS[0];
      const fPitch = clamp(fPreset.pitch + moodProfile.pitchMod, 0.5, 2);
      const mPitch = clamp(mPreset.pitch + moodProfile.pitchMod, 0.5, 2);
      const fRate = clamp(fPreset.rateFactor * moodProfile.rateMod, 0.5, 2);
      const mRate = clamp(mPreset.rateFactor * moodProfile.rateMod, 0.5, 2);

      const u1 = new SpeechSynthesisUtterance(`Female voice, sweet and high, pitch ${fPitch.toFixed(1)}. Hello ${childName}!`);
      if (fVoice) u1.voice = fVoice;
      u1.pitch = fPitch;
      u1.rate = fRate;
      u1.volume = 1;

      const u2 = new SpeechSynthesisUtterance(`Male voice, warm and low, pitch ${mPitch.toFixed(1)}. Hello ${childName}! Can you hear the difference? Female is high, male is low.`);
      if (mVoice) u2.voice = mVoice;
      u2.pitch = mPitch;
      u2.rate = mRate;
      u2.volume = 1;

      window.speechSynthesis.speak(u1);
      u1.onend = () => {
        setTimeout(() => window.speechSynthesis.speak(u2), 400);
      };
    } catch {}
  };

  const previewMoodDiff = () => {
    try {
      window.speechSynthesis.cancel();
      const baseVoice = voices[0];
      const preset = FEMALE_PRESETS[0];
      const moods: (keyof typeof MOOD_AUDIO_PROFILE)[] = ["Calm", "Silly", "Sleepy", "Brave", "Adventurous"];
      let idx = 0;
      const speakNext = () => {
        if (idx >= moods.length) return;
        const m = moods[idx];
        const prof = MOOD_AUDIO_PROFILE[m];
        const p = clamp(preset.pitch + prof.pitchMod, 0.5, 2);
        const r = clamp(preset.rateFactor * prof.rateMod, 0.5, 2);
        const u = new SpeechSynthesisUtterance(`${m} mood, ${prof.pause} millisecond pause, pitch ${p.toFixed(1)}, speed ${r.toFixed(2)}. ${m === "Sleepy" ? "Yaaawn, so sleepy..." : m === "Silly" ? "Hehe, giggle wiggle!" : m === "Calm" ? "Soft and calm, breathing slowly." : m === "Brave" ? "Steady and kind, you are safe." : "Bright and curious, let's explore!"}`);
        if (baseVoice) u.voice = baseVoice;
        u.pitch = p;
        u.rate = r;
        u.volume = prof.volume;
        u.onend = () => {
          idx++;
          setTimeout(speakNext, prof.pause);
        };
        window.speechSynthesis.speak(u);
      };
      speakNext();
    } catch {}
  };

  const isSelected = (id: string) => selectedPresetId === id;

  return (
    <div className="rounded-[20px] bg-[#2D2A6E]/70 border border-white/10 p-4 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-bold tracking-widest uppercase text-[#D9D6F7]" style={{ fontFamily: "var(--font-fredoka)" }}>
              Voice • {meta.description}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFD93D]/20 text-[#FFD93D]">{mood}</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#C4B5FD]/20 text-[#C4B5FD] border border-[#C4B5FD]/20">Female 1.48 vs Male 0.68 pitch</span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#9A96C8] leading-snug">
            Fixed 8 voices same on mobile & desktop. Female high (1.18-1.48) vs Male low (0.68-0.88) so you CAN tell difference on mobile. Mood changes pitch/rate/pause.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button onClick={previewGenderDiff} className="h-7 px-3 rounded-full bg-[#FF8FB1]/20 border border-[#FF8FB1]/30 text-[#FF8FB1] text-[10px] font-bold hover:bg-[#FF8FB1]/30">▶ Hear Female vs Male diff</button>
            <button onClick={previewMoodDiff} className="h-7 px-3 rounded-full bg-[#7DD3FC]/20 border border-[#7DD3FC]/30 text-[#7DD3FC] text-[10px] font-bold hover:bg-[#7DD3FC]/30">▶ Hear Mood diff (Calm→Silly→Sleepy)</button>
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedVoiceURI("");
            setSelectedPresetId("");
            setCustomPitch(1);
            setCustomRateFactor(1);
          }}
          className={`shrink-0 h-7 px-3 rounded-full text-[11px] font-bold border ${!selectedPresetId ? "bg-[#FFF8E7] text-[#1E1B4B] border-[#FFF8E7]" : "bg-[#1E1B4B] text-[#9A96C8] border-white/10"}`}
        >
          Auto
        </button>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-[11px] font-bold text-[#FF8FB1] px-2.5 py-1 rounded-full bg-[#FF8FB1]/15 border border-[#FF8FB1]/30" style={{ fontFamily: "var(--font-fredoka)" }}>♀ Female • 4 distinct • pitch 1.18-1.48</span>
          <span className="text-[10px] text-[#9A96C8]">{meta.female.join(" • ")}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FF8FB1]/10 text-[#FF8FB1]">HIGH</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FEMALE_PRESETS.map((preset, i) => {
            const styleLabel = meta.female[i % meta.female.length];
            const sel = isSelected(preset.id);
            const effPitch = clamp(preset.pitch + moodProfile.pitchMod, 0.5, 2).toFixed(2);
            const effRate = clamp(preset.rateFactor * moodProfile.rateMod, 0.5, 2).toFixed(2);
            return (
              <div
                key={preset.id}
                className={`flex items-center justify-between rounded-[14px] border pl-3 pr-1.5 py-2.5 transition-all ${
                  sel ? "bg-[#FF8FB1] text-[#1E1B4B] border-[#FF8FB1] shadow-[0_2px_12px_rgba(255,143,177,0.4)]" : "bg-[#1E1B4B] text-[#D9D6F7] border-white/10 hover:border-[#FF8FB1]/30"
                }`}
              >
                <button onClick={() => handleSelect(preset, "female")} className="flex items-center gap-2.5 text-left flex-1">
                  <span className="text-[16px]">{preset.emoji}</span>
                  <span className="flex flex-col leading-none">
                    <span className="font-bold text-[12px] flex items-center gap-1">{styleLabel} <span className={`text-[8px] px-1 py-0.5 rounded ${sel ? "bg-[#1E1B4B]/15" : "bg-[#FF8FB1]/20 text-[#FF8FB1]"}`}>F</span></span>
                    <span className={`text-[9px] mt-1 ${sel ? "text-[#1E1B4B]/70" : "text-[#9A96C8]"}`}>p{effPitch} r{effRate} • {preset.label} • {mood} {moodProfile.emoji}</span>
                  </span>
                </button>
                <button
                  onClick={() => preview(preset, "female", styleLabel)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] shrink-0 font-bold ${sel ? "bg-[#1E1B4B]/15 hover:bg-[#1E1B4B]/25" : "bg-white/10 hover:bg-[#FF8FB1]/20"}`}
                  aria-label={`Preview ${styleLabel}`}
                >
                  ▶
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-[11px] font-bold text-[#7DD3FC] px-2.5 py-1 rounded-full bg-[#7DD3FC]/15 border border-[#7DD3FC]/30" style={{ fontFamily: "var(--font-fredoka)" }}>♂ Male • 4 distinct • pitch 0.68-0.88</span>
          <span className="text-[10px] text-[#9A96C8]">{meta.male.join(" • ")}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#7DD3FC]/10 text-[#7DD3FC]">LOW</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MALE_PRESETS.map((preset, i) => {
            const styleLabel = meta.male[i % meta.male.length];
            const sel = isSelected(preset.id);
            const effPitch = clamp(preset.pitch + moodProfile.pitchMod, 0.5, 2).toFixed(2);
            const effRate = clamp(preset.rateFactor * moodProfile.rateMod, 0.5, 2).toFixed(2);
            return (
              <div
                key={preset.id}
                className={`flex items-center justify-between rounded-[14px] border pl-3 pr-1.5 py-2.5 transition-all ${
                  sel ? "bg-[#7DD3FC] text-[#1E1B4B] border-[#7DD3FC] shadow-[0_2px_12px_rgba(125,211,252,0.4)]" : "bg-[#1E1B4B] text-[#D9D6F7] border-white/10 hover:border-[#7DD3FC]/30"
                }`}
              >
                <button onClick={() => handleSelect(preset, "male")} className="flex items-center gap-2.5 text-left flex-1">
                  <span className="text-[16px]">{preset.emoji}</span>
                  <span className="flex flex-col leading-none">
                    <span className="font-bold text-[12px] flex items-center gap-1">{styleLabel} <span className={`text-[8px] px-1 py-0.5 rounded ${sel ? "bg-[#1E1B4B]/15" : "bg-[#7DD3FC]/20 text-[#7DD3FC]"}`}>M</span></span>
                    <span className={`text-[9px] mt-1 ${sel ? "text-[#1E1B4B]/70" : "text-[#9A96C8]"}`}>p{effPitch} r{effRate} • {preset.label} • {mood} {moodProfile.emoji}</span>
                  </span>
                </button>
                <button
                  onClick={() => preview(preset, "male", styleLabel)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] shrink-0 font-bold ${sel ? "bg-[#1E1B4B]/15 hover:bg-[#1E1B4B]/25" : "bg-white/10 hover:bg-[#7DD3FC]/20"}`}
                  aria-label={`Preview ${styleLabel}`}
                >
                  ▶
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[12px] bg-[#1E1B4B]/60 border border-white/5 p-3 space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-bold text-[#D9D6F7]">
          <span>🎧 Why distinct now?</span>
          <span className="px-2 py-0.5 rounded-full bg-[#FF8FB1]/15 text-[#FF8FB1]">Female 1.48 vs Male 0.68 = 0.8 gap</span>
          <span className="px-2 py-0.5 rounded-full bg-[#7DD3FC]/15 text-[#7DD3FC]">Mood pitch ±0.32 rate 0.68-1.22</span>
        </div>
        <p className="text-[10px] text-[#9A96C8] leading-snug">
          <span className="text-[#D9D6F7]">Mobile fix:</span> Even if your phone has only 1 system voice, female uses pitch 1.18-1.48 (high) and male uses 0.68-0.88 (low) — 0.8 difference you CAN hear. <span className="text-[#D9D6F7]">Mood fix:</span> Calm = slow 0.84× + low pitch + 950ms pause {MOOD_AUDIO_PROFILE.Calm.emoji}, Silly = fast 1.22× + high +0.32 pitch + 350ms {MOOD_AUDIO_PROFILE.Silly.emoji}, Sleepy = very slow 0.68× + low -0.24 pitch + 1350ms yawn {MOOD_AUDIO_PROFILE.Sleepy.emoji}, Brave = steady 0.94× {MOOD_AUDIO_PROFILE.Brave.emoji}, Adventurous = bright 1.1× {MOOD_AUDIO_PROFILE.Adventurous.emoji}. Same 8 voices on desktop & mobile.
        </p>
      </div>
    </div>
  );
}
