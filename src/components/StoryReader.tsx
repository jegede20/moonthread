"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Story } from "@/lib/storyTypes";
import { SPEEDS, SLEEP_TIMERS, BACKGROUND_SOUNDS, BgSoundId, SleepTimerId } from "@/lib/constants";
import { soundManager } from "@/lib/sounds";
import { getSettings } from "@/lib/db";

type Props = {
  story: Story;
  onSleepEnd?: () => void;
};

export function StoryReader({ story, onSleepEnd }: Props) {
  const [page, setPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIdx, setCurrentWordIdx] = useState<number | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [speedId, setSpeedId] = useState<"slow" | "normal" | "fast">("normal");
  const [sleepTimer, setSleepTimer] = useState<SleepTimerId>("off");
  const [bgSound, setBgSound] = useState<BgSoundId>("off");
  const [volume, setVolume] = useState(0.5);
  const [textSize, setTextSize] = useState<"small" | "medium" | "large">("medium");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showGoodnight, setShowGoodnight] = useState(false);
  const [sleepRemaining, setSleepRemaining] = useState<number | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wordsRef = useRef<string[]>([]);
  const wordStartRef = useRef<number>(0);
  const sleepTimeoutRef = useRef<any>(null);
  const sleepIntervalRef = useRef<any>(null);
  const fadeIntervalRef = useRef<any>(null);

  const scene = story.scenes[page];
  const words = scene ? scene.text.split(/(\s+)/) : []; // keep spaces? We'll split words keeping spaces for rendering
  // For highlighting we need word list without spaces
  const cleanWords = scene ? scene.text.split(/\s+/) : [];

  // Load settings
  useEffect(() => {
    getSettings().then((s) => {
      setSpeedId(s.speed);
      setTextSize(s.textSize);
      setReduceMotion(s.reduceMotion);
      setBgSound(s.defaultSound as BgSoundId);
      setVolume(s.defaultVolume);
      setSleepTimer(s.defaultSleepTimer as SleepTimerId);
      if (s.voiceURI) setSelectedVoiceURI(s.voiceURI);
    });
  }, []);

  // Voices
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

  // Background sound
  useEffect(() => {
    if (bgSound !== "off") {
      soundManager.play(bgSound, volume);
    } else {
      soundManager.stop();
    }
    return () => {
      // don't stop on unmount if user navigates? We'll stop when leaving story
    };
  }, [bgSound, volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      soundManager.stop();
      if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
      if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, []);

  const getRate = useCallback(() => {
    const found = SPEEDS.find((s) => s.id === speedId);
    return found ? found.rate : 1;
  }, [speedId]);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const voice = voices.find((v) => v.voiceURI === selectedVoiceURI) || voices.find((v) => v.default) || voices[0];
      if (voice) utter.voice = voice;
      utter.rate = getRate();
      utter.volume = 1;
      utter.pitch = 1;

      // Word highlighting via boundary events
      utter.onboundary = (e: any) => {
        if (e.name === "word") {
          // e.charIndex gives start index
          const charIndex = e.charIndex;
          // Find word index by counting spaces up to charIndex
          const upTo = text.slice(0, charIndex);
          const wordIdx = upTo.trim() ? upTo.trim().split(/\s+/).length : 0;
          setCurrentWordIdx(wordIdx);
        }
      };

      // Fallback estimated timing if boundary not supported
      let fallbackInterval: any = null;
      const wordsCount = text.split(/\s+/).length;
      const estimatedDuration = (text.length / 15) / getRate(); // rough
      const msPerWord = (estimatedDuration * 1000) / wordsCount;

      let fallbackIdx = 0;
      if (!("onboundary" in SpeechSynthesisUtterance.prototype) || /iPhone|iPad|iPod/.test(navigator.userAgent)) {
        fallbackInterval = setInterval(() => {
          fallbackIdx++;
          if (fallbackIdx < wordsCount) setCurrentWordIdx(fallbackIdx);
        }, msPerWord);
      }

      utter.onend = () => {
        if (fallbackInterval) clearInterval(fallbackInterval);
        setCurrentWordIdx(null);
        onEnd?.();
      };
      utter.onerror = () => {
        if (fallbackInterval) clearInterval(fallbackInterval);
        setCurrentWordIdx(null);
        onEnd?.();
      };

      utteranceRef.current = utter;
      wordsRef.current = text.split(/\s+/);
      window.speechSynthesis.speak(utter);
    },
    [voices, selectedVoiceURI, getRate]
  );

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentWordIdx(null);
    } else {
      setIsPlaying(true);
      const text = story.scenes[page]?.text || "";
      speak(text, () => {
        // auto-advance
        if (page < story.scenes.length - 1) {
          setPage((p) => p + 1);
          // Continue playing next page automatically
          setTimeout(() => {
            // will be handled by effect watching page when isPlaying
          }, 300);
        } else {
          // End of story
          setIsPlaying(false);
          if (sleepTimer === "end") {
            handleSleepEnd();
          }
        }
      });
    }
  }, [isPlaying, page, story.scenes, speak, sleepTimer]);

  // When page changes and isPlaying, speak new page
  useEffect(() => {
    if (isPlaying) {
      const text = story.scenes[page]?.text || "";
      speak(text, () => {
        if (page < story.scenes.length - 1) {
          setPage((p) => p + 1);
        } else {
          setIsPlaying(false);
          if (sleepTimer === "end") handleSleepEnd();
        }
      });
    } else {
      window.speechSynthesis.cancel();
      setCurrentWordIdx(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSleepEnd = () => {
    setShowGoodnight(true);
    soundManager.fadeOut(5000);
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    onSleepEnd?.();
  };

  // Sleep timer logic
  useEffect(() => {
    if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
    if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    setSleepRemaining(null);

    if (sleepTimer === "off" || sleepTimer === "end") return;

    const minutes = SLEEP_TIMERS.find((t) => t.id === sleepTimer)?.minutes || 0;
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
      } else {
        setSleepRemaining(remaining);
      }
    }, 1000);

    // Schedule fade
    sleepTimeoutRef.current = setTimeout(() => {
      // start fade
      let steps = 10;
      let stepVol = 1;
      fadeIntervalRef.current = setInterval(() => {
        stepVol -= 0.1;
        if (utteranceRef.current) {
          utteranceRef.current.volume = Math.max(0, stepVol);
        }
        soundManager.setVolume(volume * Math.max(0, stepVol));
        if (stepVol <= 0) {
          clearInterval(fadeIntervalRef.current);
          handleSleepEnd();
        }
      }, fadeMs / steps);
    }, totalMs - fadeMs);

    // Hard stop
    const hardStop = setTimeout(() => {
      handleSleepEnd();
    }, totalMs);

    return () => {
      clearTimeout(hardStop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleepTimer, volume]);

  const formatRemaining = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const textSizeClass = {
    small: "text-[16px] leading-[1.7]",
    medium: "text-[18px] md:text-[20px] leading-[1.7]",
    large: "text-[20px] md:text-[22px] leading-[1.8]",
  }[textSize];

  if (showGoodnight) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center gap-6 py-16 text-center">
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
      {/* Text with highlighting */}
      <div className="mt-6">
        <div className={`${textSizeClass} text-[#FFF8E7] font-medium`} style={{ fontFamily: "var(--font-nunito)" }}>
          {cleanWords.map((w, idx) => {
            const isHighlighted = currentWordIdx === idx;
            return (
              <span
                key={idx}
                className={`inline-block mr-[0.28em] rounded-[6px] px-1 -mx-1 transition-colors ${
                  isHighlighted ? "bg-[#FFD93D] text-[#1E1B4B]" : ""
                }`}
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

      {/* Playback controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={() => {
            if (page > 0) {
              window.speechSynthesis.cancel();
              setPage((p) => p - 1);
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
              setPage((p) => p + 1);
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
        {/* Voice */}
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

        {/* Speed */}
        <div className="rounded-[18px] bg-[#2D2A6E] border border-white/10 p-3">
          <label className="text-[11px] font-bold tracking-widest text-[#9A96C8] uppercase" style={{ fontFamily: "var(--font-fredoka)" }}>
            Speed
          </label>
          <div className="mt-2 flex gap-1">
            {SPEEDS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSpeedId(s.id as any)}
                className={`flex-1 h-7 rounded-full text-[11px] font-bold transition-colors ${
                  speedId === s.id ? "bg-[#FFF8E7] text-[#1E1B4B]" : "bg-white/10 text-[#D9D6F7]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sleep timer */}
        <div className={`rounded-[18px] border p-3 transition-colors ${sleepTimer !== "off" ? "bg-[#2D2A6E] border-[#FFD93D]/50" : "bg-[#2D2A6E] border-white/10"}`}>
          <label className="text-[11px] font-bold tracking-widest text-[#9A96C8] uppercase flex items-center justify-between" style={{ fontFamily: "var(--font-fredoka)" }}>
            Sleep timer
            {sleepRemaining !== null && sleepTimer !== "off" && sleepTimer !== "end" && (
              <span className="text-[#FFD93D] normal-case tracking-normal text-[11px]">{formatRemaining(sleepRemaining)}</span>
            )}
          </label>
          <div className="mt-2 flex flex-wrap gap-1">
            {SLEEP_TIMERS.map((t) => (
              <button
                key={t.id}
                onClick={() => setSleepTimer(t.id as SleepTimerId)}
                className={`h-7 px-2.5 rounded-full text-[11px] font-bold transition-colors ${
                  sleepTimer === t.id ? "bg-[#FFD93D] text-[#1E1B4B]" : "bg-white/10 text-[#D9D6F7]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sound */}
        <div className={`rounded-[18px] border p-3 transition-colors ${bgSound !== "off" ? "bg-[#2D2A6E] border-[#7DD3FC]/50" : "bg-[#2D2A6E] border-white/10"}`}>
          <label className="text-[11px] font-bold tracking-widest text-[#9A96C8] uppercase" style={{ fontFamily: "var(--font-fredoka)" }}>
            Sound
          </label>
          <div className="mt-2 flex flex-wrap gap-1">
            {BACKGROUND_SOUNDS.map((s) => (
              <button
                key={s.id}
                onClick={() => setBgSound(s.id as BgSoundId)}
                className={`h-7 px-2 rounded-full text-[11px] font-bold transition-colors flex items-center gap-1 ${
                  bgSound === s.id ? "bg-[#7DD3FC] text-[#1E1B4B]" : "bg-white/10 text-[#D9D6F7]"
                }`}
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
