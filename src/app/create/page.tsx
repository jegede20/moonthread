"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SimpleHeader } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { AnimalTile } from "@/components/AnimalTile";
import { MoodPill } from "@/components/MoodPill";
import { ANIMALS, MOODS, AGE_GROUPS, AGE_CONFIG, STORY_LENGTHS, Animal, Mood, AgeGroup, StoryLengthId, STORY_COOLDOWN_MS } from "@/lib/constants";
import { Story } from "@/lib/storyTypes";
import { saveTempStory, getSettings } from "@/lib/db";
import { generateOfflineStory } from "@/lib/offlineTemplates";

export default function CreatePage() {
  const router = useRouter();
  const [childName, setChildName] = useState("");
  const [animal, setAnimal] = useState<Animal>("Fox");
  const [mood, setMood] = useState<Mood>("Calm");
  const [age, setAge] = useState<AgeGroup>("5-7");
  const [storyLength, setStoryLength] = useState<StoryLengthId>("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    getSettings().then(() => {});
    const last = localStorage.getItem("moonthread-last-story");
    if (last) {
      const diff = Date.now() - parseInt(last, 10);
      if (diff < STORY_COOLDOWN_MS) {
        const remaining = Math.ceil((STORY_COOLDOWN_MS - diff) / 1000);
        setCooldown(remaining);
        const iv = setInterval(() => {
          const d = Date.now() - parseInt(localStorage.getItem("moonthread-last-story") || "0", 10);
          if (d >= STORY_COOLDOWN_MS) {
            setCooldown(0);
            clearInterval(iv);
          } else {
            setCooldown(Math.ceil((STORY_COOLDOWN_MS - d) / 1000));
          }
        }, 1000);
        return () => clearInterval(iv);
      }
    }
  }, []);

  // Update default length when age changes
  useEffect(() => {
    const defaultMap: Record<AgeGroup, StoryLengthId> = { "2-4": "short", "5-7": "medium", "8-10": "long" };
    setStoryLength(defaultMap[age]);
  }, [age]);

  const validateName = (name: string) => {
    if (!name.trim()) return "Please add a name";
    if (name.length > 20) return "Max 20 characters";
    if (!/^[A-Za-z\s\-']+$/.test(name)) return "Letters, spaces, hyphens and apostrophes only";
    return null;
  };

  const handleSubmit = async () => {
    const nameErr = validateName(childName);
    if (nameErr) {
      setError(nameErr);
      return;
    }
    if (cooldown > 0) {
      setError(`Please wait ${cooldown}s before creating another story`);
      return;
    }

    setError(null);
    setLoading(true);

    const input = {
      childName: childName.trim(),
      animal,
      mood,
      ageGroup: age,
      storyLength,
    };

    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw new Error("offline");
      }

      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      const story: Story = {
        id: data.id || `story-${Date.now()}`,
        title: data.title,
        childName: input.childName,
        animal: input.animal,
        mood: input.mood,
        ageGroup: input.ageGroup,
        scenes: data.scenes,
        createdAt: Date.now(),
        isOffline: false,
        storyLength: input.storyLength,
      };

      await saveTempStory(story);
      localStorage.setItem("moonthread-last-story", Date.now().toString());
      router.push(`/story/${story.id}`);
    } catch (e: any) {
      console.warn("Groq failed, using offline template", e);
      const offlineStory = generateOfflineStory(input);
      await saveTempStory(offlineStory);
      router.push(`/story/${offlineStory.id}?offline=1`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#1E1B4B] pb-[88px] md:pb-0">
      <SimpleHeader title="New story" />

      <main className="flex-1 mx-auto w-full max-w-[560px] px-6 md:px-8 py-8">
        <h1 className="text-[28px] font-bold tracking-tight text-[#FFF8E7]" style={{ fontFamily: "var(--font-fredoka)" }}>
          New story
        </h1>
        <p className="mt-2 text-[14px] text-[#D9D6F7]" style={{ fontFamily: "var(--font-nunito)" }}>
          Everything stays on your device. We only send name, animal, mood and age to write the story.
        </p>

        <div className="mt-8 space-y-8">
          <div>
            <label className="text-[13px] font-bold tracking-widest uppercase text-[#D9D6F7]" style={{ fontFamily: "var(--font-fredoka)" }}>
              Child&apos;s name
            </label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="e.g. Maya"
              maxLength={20}
              className="mt-3 w-full h-[52px] rounded-[16px] bg-[#2D2A6E] border border-white/10 px-4 text-[16px] text-[#FFF8E7] placeholder:text-[#9A96C8] outline-none focus:border-[#FFD93D]/50 focus:ring-2 focus:ring-[#FFD93D]/20"
              style={{ fontFamily: "var(--font-nunito)" }}
            />
          </div>

          <div>
            <label className="text-[13px] font-bold tracking-widest uppercase text-[#D9D6F7]" style={{ fontFamily: "var(--font-fredoka)" }}>
              Favorite animal
            </label>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {ANIMALS.map((a) => (
                <AnimalTile key={a} animal={a} selected={animal === a} onSelect={() => setAnimal(a)} />
              ))}
            </div>
          </div>

          <div>
            <label className="text-[13px] font-bold tracking-widest uppercase text-[#D9D6F7]" style={{ fontFamily: "var(--font-fredoka)" }}>
              Mood
            </label>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {MOODS.map((m) => (
                <MoodPill key={m} mood={m} selected={mood === m} onSelect={() => setMood(m)} />
              ))}
            </div>
          </div>

          <div>
            <label className="text-[13px] font-bold tracking-widest uppercase text-[#D9D6F7]" style={{ fontFamily: "var(--font-fredoka)" }}>
              Age
            </label>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {AGE_GROUPS.map((ag) => (
                <button
                  key={ag}
                  type="button"
                  onClick={() => setAge(ag)}
                  className={`h-[48px] rounded-full font-bold text-[13px] tracking-wide border-2 transition-all ${
                    age === ag
                      ? "bg-[#FFF8E7] text-[#1E1B4B] border-[#FFF8E7]"
                      : "bg-[#2D2A6E] text-[#D9D6F7] border-white/10 hover:border-white/20"
                  }`}
                  style={{ fontFamily: "var(--font-fredoka)" }}
                >
                  {AGE_CONFIG[ag].label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-[#9A96C8]" style={{ fontFamily: "var(--font-nunito)" }}>
              {AGE_CONFIG[age].description}
            </p>
          </div>

          <div>
            <label className="text-[13px] font-bold tracking-widest uppercase text-[#D9D6F7] flex items-center gap-2" style={{ fontFamily: "var(--font-fredoka)" }}>
              Story length
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFD93D]/20 text-[#FFD93D] normal-case tracking-normal">NEW</span>
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {STORY_LENGTHS.map((len) => (
                <button
                  key={len.id}
                  type="button"
                  onClick={() => setStoryLength(len.id)}
                  className={`h-[52px] rounded-[16px] px-3 flex flex-col items-start justify-center gap-0.5 border-2 text-left transition-all ${
                    storyLength === len.id
                      ? "bg-[#FFF8E7] text-[#1E1B4B] border-[#FFF8E7]"
                      : "bg-[#2D2A6E] text-[#D9D6F7] border-white/10 hover:border-white/20"
                  }`}
                >
                  <span className="font-bold text-[13px]" style={{ fontFamily: "var(--font-fredoka)" }}>
                    {len.label} • {len.scenes} scenes
                  </span>
                  <span className="text-[11px] opacity-70 leading-none">{len.description}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-[#9A96C8]" style={{ fontFamily: "var(--font-nunito)" }}>
              Age controls vocabulary, length controls how long the adventure is.
            </p>
          </div>

          {error && (
            <div className="rounded-[16px] bg-[#FF8FB1]/15 border border-[#FF8FB1]/30 p-4 text-[14px] text-[#FF8FB1]">{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || cooldown > 0}
            className="w-full h-[56px] rounded-full bg-[#FF7A59] text-[#1E1B4B] font-bold text-[16px] shadow-[0_4px_0_#C4533A] active:translate-y-[2px] active:shadow-[0_2px_0_#C4533A] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-[#1E1B4B]/30 border-t-[#1E1B4B] rounded-full animate-spin" />
                Weaving your story...
              </>
            ) : cooldown > 0 ? (
              `Wait ${cooldown}s`
            ) : (
              "Write my story"
            )}
          </button>

          <p className="text-center text-[12px] text-[#9A96C8]" style={{ fontFamily: "var(--font-nunito)" }}>
            Stories are gentle and end sleepy. No scary content.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
