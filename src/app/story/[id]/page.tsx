"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Story } from "@/lib/storyTypes";
import { getTempStory, getFavorite, saveFavorite, deleteFavorite, getFavorites, getSettings } from "@/lib/db";
import { StoryCanvas } from "@/components/StoryCanvas";
import { StoryReader } from "@/components/StoryReader";
import { BottomNav } from "@/components/BottomNav";
import { LogoWordmark } from "@/components/Logo";
import { soundManager } from "@/lib/sounds";

export default function StoryPage() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const isOfflineHint = search.get("offline") === "1";

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showOfflineNote, setShowOfflineNote] = useState(isOfflineHint);
  const [currentPage, setCurrentPage] = useState(0); // for canvas sync? We'll let reader manage but need to sync canvas
  // We'll actually have StoryReader control page internally, but we need to expose page for canvas.
  // To simplify, we will have a shared page state lifted here.

  // Actually StoryReader has its own page state. We need to refactor to lift page state, or duplicate canvas inside reader.
  // Simpler: we will have StoryPage manage page and pass to both canvas and reader via callback.

  // Let's use a different approach: StoryPage will manage page, and reader will be controlled.

  return <StoryPageInner id={id} showOfflineNote={showOfflineNote} />;
}

function StoryPageInner({ id, showOfflineNote: initialOfflineNote }: { id: string; showOfflineNote: boolean }) {
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showOfflineNote, setShowOfflineNote] = useState(initialOfflineNote);
  const [page, setPage] = useState(0);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        // Try temp first, then favorites
        let s = await getTempStory(id);
        if (!s) s = await getFavorite(id);
        if (!s) {
          // Maybe offline template id but not saved? Try generate? Actually we saved temp.
          setLoading(false);
          return;
        }
        setStory(s);
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

  return (
    <div className="min-h-screen flex flex-col bg-[#1E1B4B] pb-[88px] md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-[#1E1B4B]/90 border-b border-white/5">
        <div className="mx-auto max-w-[1100px] px-4 md:px-8 h-[64px] flex items-center justify-between">
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
        <div className="mx-auto max-w-[1100px] w-full px-4 md:px-8 pt-4">
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

      <main className="flex-1 mx-auto w-full max-w-[1100px] px-4 md:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Canvas side */}
          <div className="flex-1 lg:sticky lg:top-[88px] lg:h-fit">
            <StoryCanvas animal={story.animal} mood={story.mood} description={story.scenes[page]?.description || ""} reduceMotion={reduceMotion} />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[12px] text-[#9A96C8]" style={{ fontFamily: "var(--font-nunito)" }}>
                Page {page + 1} of {story.scenes.length} • {story.animal} • {story.mood}
              </span>
              {story.isOffline && <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#2D2A6E] text-[#D9D6F7] border border-white/10">Offline story</span>}
            </div>
          </div>

          {/* Text side */}
          <div className="flex-1 max-w-[600px]">
            <ControlledReader story={story} page={page} setPage={setPage} reduceMotion={reduceMotion} />
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

// Controlled reader that syncs page with parent
function ControlledReader({ story, page, setPage, reduceMotion }: { story: Story; page: number; setPage: (n: number) => void; reduceMotion: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIdx, setCurrentWordIdx] = useState<number | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
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
      window.speechSynthesis.cancel();
      soundManager.stop();
      if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
      if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, []);

  const getRate = () => {
    const map: any = { slow: 0.8, normal: 1, fast: 1.2 };
    return map[speedId] || 1;
  };

  const speak = (text: string, onEnd?: () => void) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voice = voices.find((v) => v.voiceURI === selectedVoiceURI) || voices.find((v) => v.default) || voices[0];
    if (voice) utter.voice = voice;
    utter.rate = getRate();
    utter.volume = 1;

    utter.onboundary = (e: any) => {
      if (e.name === "word") {
        const upTo = text.slice(0, e.charIndex);
        const idx = upTo.trim() ? upTo.trim().split(/\s+/).length : 0;
        setCurrentWordIdx(idx);
      }
    };

    utter.onend = () => {
      setCurrentWordIdx(null);
      onEnd?.();
    };
    utter.onerror = () => {
      setCurrentWordIdx(null);
      onEnd?.();
    };

    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentWordIdx(null);
    } else {
      setIsPlaying(true);
      speak(scene.text, () => {
        if (page < story.scenes.length - 1) {
          setPage(page + 1);
        } else {
          setIsPlaying(false);
          if (sleepTimer === "end") handleSleepEnd();
        }
      });
    }
  };

  // Auto-play next page when page changes and was playing
  useEffect(() => {
    if (isPlaying) {
      speak(story.scenes[page].text, () => {
        if (page < story.scenes.length - 1) {
          setPage(page + 1);
        } else {
          setIsPlaying(false);
          if (sleepTimer === "end") handleSleepEnd();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSleepEnd = () => {
    setShowGoodnight(true);
    soundManager.fadeOut(5000);
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  // Sleep timer
  useEffect(() => {
    if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
    if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    setSleepRemaining(null);

    if (sleepTimer === "off" || sleepTimer === "end") return;
    const minutes = { "10": 10, "20": 20, "30": 30 }[sleepTimer as string] || 0;
    if (minutes <= 0) return;

    const totalMs = minutes * 60 * 1000;
    const fadeMs = 30 * 1000;
    const endTime = Date.now() + totalMs;
    setSleepRemaining(totalMs);

    sleepIntervalRef.current = setInterval(() => {
      const remaining = endTime - Date.now();
      if (remaining <= 0) {
        setSleepRemaining(0);
        clearInterval(sleepIntervalRef.current);
      } else setSleepRemaining(remaining);
    }, 1000);

    sleepTimeoutRef.current = setTimeout(() => {
      let steps = 10;
      let stepVol = 1;
      fadeIntervalRef.current = setInterval(() => {
        stepVol -= 0.1;
        if (utteranceRef.current) utteranceRef.current.volume = Math.max(0, stepVol);
        soundManager.setVolume(volume * Math.max(0, stepVol));
        if (stepVol <= 0) {
          clearInterval(fadeIntervalRef.current);
          handleSleepEnd();
        }
      }, fadeMs / steps);
    }, totalMs - fadeMs);

    const hardStop = setTimeout(() => handleSleepEnd(), totalMs);
    return () => clearTimeout(hardStop);
  }, [sleepTimer, volume]);

  const formatRemaining = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const textSizeClass = {
    small: "text-[16px] leading-[1.7]",
    medium: "text-[18px] md:text-[20px] leading-[1.7]",
    large: "text-[20px] md:text-[22px] leading-[1.8]",
  }[textSize];

  if (showGoodnight) {
    return (
      <div className="w-full min-h-[40vh] flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-[#FFD93D] flex items-center justify-center text-[32px] animate-pulse">🌙</div>
        <h2 className="text-[28px] font-bold text-[#FFF8E7]" style={{ fontFamily: "var(--font-fredoka)" }}>
          Goodnight, {story.childName}
        </h2>
        <p className="text-[#D9D6F7] text-[16px] max-w-[320px]">The story has drifted to sleep. Sweet dreams.</p>
        <button
          onClick={() => setShowGoodnight(false)}
          className="h-11 px-6 rounded-full bg-[#2D2A6E] border-2 border-[#C4B5FD] text-[#FFF8E7] font-bold text-[14px]"
          style={{ fontFamily: "var(--font-fredoka)" }}
        >
          Wake up story
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Text */}
      <div className="mt-2">
        <div className={`${textSizeClass} text-[#FFF8E7] font-medium`} style={{ fontFamily: "var(--font-nunito)" }}>
          {cleanWords.map((w, idx) => {
            const isHighlighted = currentWordIdx === idx;
            return (
              <span
                key={idx}
                className={`inline-block mr-[0.28em] rounded-[6px] px-1 -mx-1 transition-colors ${isHighlighted ? "bg-[#FFD93D] text-[#1E1B4B]" : ""}`}
              >
                {w}
              </span>
            );
          })}
        </div>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {story.scenes.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              window.speechSynthesis.cancel();
              setIsPlaying(false);
              setPage(i);
            }}
            aria-label={`Go to page ${i + 1}`}
            className={`h-2 rounded-full transition-all ${i === page ? "w-6 bg-[#FFD93D]" : "w-2 bg-white/20"}`}
          />
        ))}
      </div>

      {/* Playback */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={() => {
            if (page > 0) {
              window.speechSynthesis.cancel();
              setPage(page - 1);
              setIsPlaying(false);
            }
          }}
          disabled={page === 0}
          aria-label="Previous page"
          className="w-12 h-12 rounded-full bg-[#2D2A6E] border border-white/10 text-[#FFF8E7] disabled:opacity-40 flex items-center justify-center text-[20px]"
        >
          ‹
        </button>

        <button
          onClick={handlePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="w-[64px] h-[64px] rounded-full bg-[#FF7A59] text-[#1E1B4B] shadow-[0_4px_0_#C4533A] active:translate-y-[2px] active:shadow-[0_2px_0_#C4533A] flex items-center justify-center text-[28px] font-bold transition-all"
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>

        <button
          onClick={() => {
            if (page < story.scenes.length - 1) {
              window.speechSynthesis.cancel();
              setPage(page + 1);
              setIsPlaying(false);
            }
          }}
          disabled={page === story.scenes.length - 1}
          aria-label="Next page"
          className="w-12 h-12 rounded-full bg-[#2D2A6E] border border-white/10 text-[#FFF8E7] disabled:opacity-40 flex items-center justify-center text-[20px]"
        >
          ›
        </button>
      </div>

      {/* Controls grid */}
      <div className="grid grid-cols-2 gap-3 mt-8">
        <div className="rounded-[18px] bg-[#2D2A6E] border border-white/10 p-3">
          <label className="text-[11px] font-bold tracking-widest text-[#9A96C8] uppercase" style={{ fontFamily: "var(--font-fredoka)" }}>
            Voice
          </label>
          <select
            value={selectedVoiceURI}
            onChange={(e) => setSelectedVoiceURI(e.target.value)}
            className="mt-1 w-full bg-transparent text-[#FFF8E7] text-[13px] font-semibold outline-none"
          >
            <option value="" className="bg-[#1E1B4B]">
              Default
            </option>
            {voices.slice(0, 20).map((v) => (
              <option key={v.voiceURI} value={v.voiceURI} className="bg-[#1E1B4B]">
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-[18px] bg-[#2D2A6E] border border-white/10 p-3">
          <label className="text-[11px] font-bold tracking-widest text-[#9A96C8] uppercase" style={{ fontFamily: "var(--font-fredoka)" }}>
            Speed
          </label>
          <div className="mt-2 flex gap-1">
            {[
              { id: "slow", label: "Slow" },
              { id: "normal", label: "Normal" },
              { id: "fast", label: "Fast" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSpeedId(s.id as any)}
                className={`flex-1 h-7 rounded-full text-[11px] font-bold transition-colors ${speedId === s.id ? "bg-[#FFF8E7] text-[#1E1B4B]" : "bg-white/10 text-[#D9D6F7]"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`rounded-[18px] border p-3 transition-colors ${sleepTimer !== "off" ? "bg-[#2D2A6E] border-[#FFD93D]/50" : "bg-[#2D2A6E] border-white/10"}`}>
          <label className="text-[11px] font-bold tracking-widest text-[#9A96C8] uppercase flex items-center justify-between" style={{ fontFamily: "var(--font-fredoka)" }}>
            Sleep timer
            {sleepRemaining !== null && sleepTimer !== "off" && sleepTimer !== "end" && (
              <span className="text-[#FFD93D] normal-case tracking-normal text-[11px]">{formatRemaining(sleepRemaining)}</span>
            )}
          </label>
          <div className="mt-2 flex flex-wrap gap-1">
            {[
              { id: "off", label: "Off" },
              { id: "10", label: "10 min" },
              { id: "20", label: "20 min" },
              { id: "30", label: "30 min" },
              { id: "end", label: "End" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSleepTimer(t.id)}
                className={`h-7 px-2.5 rounded-full text-[11px] font-bold transition-colors ${sleepTimer === t.id ? "bg-[#FFD93D] text-[#1E1B4B]" : "bg-white/10 text-[#D9D6F7]"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`rounded-[18px] border p-3 transition-colors ${bgSound !== "off" ? "bg-[#2D2A6E] border-[#7DD3FC]/50" : "bg-[#2D2A6E] border-white/10"}`}>
          <label className="text-[11px] font-bold tracking-widest text-[#9A96C8] uppercase" style={{ fontFamily: "var(--font-fredoka)" }}>
            Sound
          </label>
          <div className="mt-2 flex flex-wrap gap-1">
            {[
              { id: "off", label: "Off", emoji: "🔇" },
              { id: "rain", label: "Rain", emoji: "🌧️" },
              { id: "crickets", label: "Crickets", emoji: "🦗" },
              { id: "ocean", label: "Ocean", emoji: "🌊" },
              { id: "wind", label: "Wind", emoji: "🍃" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setBgSound(s.id)}
                className={`h-7 px-2 rounded-full text-[11px] font-bold transition-colors flex items-center gap-1 ${bgSound === s.id ? "bg-[#7DD3FC] text-[#1E1B4B]" : "bg-white/10 text-[#D9D6F7]"}`}
              >
                <span>{s.emoji}</span> {s.label}
              </button>
            ))}
          </div>
          {bgSound !== "off" && (
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                soundManager.setVolume(v);
              }}
              className="mt-2 w-full accent-[#7DD3FC]"
            />
          )}
        </div>
      </div>
    </div>
  );
}
