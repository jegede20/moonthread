"use client";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StoryCanvas } from "@/components/StoryCanvas";
import { MOOD_PALETTES } from "@/lib/constants";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduceMotion(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#1E1B4B]">
      <Header />

      <main className="flex-1">
        {/* HERO */}
        <section className="mx-auto max-w-[1100px] px-6 md:px-16 pt-10 md:pt-16 pb-12 md:pb-20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
            <div className="flex-1 max-w-[560px]">
              <h1
                className="font-bold tracking-tight leading-[0.95]"
                style={{
                  fontFamily: "var(--font-fredoka)",
                  fontSize: "clamp(28px, 8.2vw, 60px)",
                  lineHeight: "0.95",
                }}
              >
                <span className="block whitespace-nowrap text-[#FFF8E7]">Bedtime stories made</span>
                <span className="block whitespace-nowrap text-[#FFD93D] mt-1">just for them</span>
              </h1>

              <p
                className="mt-6 text-[16px] md:text-[18px] leading-[1.6] text-[#D9D6F7] max-w-[44ch]"
                style={{ fontFamily: "var(--font-nunito)" }}
              >
                Pick a name, a favorite animal and tonight&apos;s mood. Moonthread writes a gentle story, draws every
                scene, and reads it aloud. Save favorites to replay offline.
              </p>

              <div className="mt-8 flex gap-3">
                <Link
                  href="/create"
                  className="inline-flex items-center justify-center h-11 md:h-[46px] px-6 rounded-full bg-[#FF7A59] text-[#1E1B4B] font-bold text-[15px] shadow-[0_4px_0_#C4533A] active:translate-y-[2px] active:shadow-[0_2px_0_#C4533A] transition-all"
                  style={{ fontFamily: "var(--font-fredoka)" }}
                >
                  Start a story
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center h-11 md:h-[46px] px-6 rounded-full bg-transparent border-2 border-[#C4B5FD] text-[#FFF8E7] font-semibold text-[15px] hover:bg-white/5 transition-colors"
                  style={{ fontFamily: "var(--font-fredoka)" }}
                >
                  See how it works
                </a>
              </div>

              <div className="mt-8 flex items-center gap-4 text-[13px] text-[#9A96C8]">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#2D2A6E] flex items-center justify-center">✓</span> No
                  accounts
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#2D2A6E] flex items-center justify-center">✓</span> Works
                  offline
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#2D2A6E] flex items-center justify-center">✓</span> Free
                </span>
              </div>
            </div>

            {/* Hero scene - fox */}
            <div className="flex-1 mt-10 lg:mt-0 w-full max-w-[520px] lg:max-w-[480px] mx-auto lg:mx-0">
              <div className="relative">
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#FFD93D]/10 blur-[20px] pointer-events-none" />
                <StoryCanvas animal="Fox" mood="Calm" description="soft hill with moon and fox sitting looking at moon, starry sky with flowers" reduceMotion={reduceMotion} />
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#2D2A6E] border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-[#6EE7B7] animate-pulse" />
                  <span className="text-[12px] font-bold text-[#FFF8E7]" style={{ fontFamily: "var(--font-fredoka)" }}>
                    Drawn on canvas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-[1100px] px-6 md:px-16 py-[72px] md:py-[96px]">
          <h2
            className="text-[28px] md:text-[36px] font-bold tracking-tight text-[#FFF8E7] mb-10 md:mb-12"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {[
              {
                n: "1",
                title: "Pick the hero",
                desc: "Choose a name, a favorite animal and tonight's mood.",
                color: "#FFD93D",
              },
              {
                n: "2",
                title: "Watch it appear",
                desc: "A short story is written and every scene is drawn for you.",
                color: "#7DD3FC",
              },
              {
                n: "3",
                title: "Listen and save",
                desc: "It reads aloud, keep favorites to replay offline.",
                color: "#FF8FB1",
              },
            ].map((card) => (
              <div
                key={card.n}
                className="rounded-[24px] md:rounded-[28px] bg-[#2D2A6E] border border-white/5 p-6 md:p-7 flex flex-col gap-4"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[16px] text-[#1E1B4B]"
                  style={{ background: card.color, fontFamily: "var(--font-fredoka)" }}
                >
                  {card.n}
                </div>
                <h3 className="text-[18px] font-bold text-[#FFF8E7]" style={{ fontFamily: "var(--font-fredoka)" }}>
                  {card.title}
                </h3>
                <p className="text-[15px] leading-[1.6] text-[#D9D6F7]" style={{ fontFamily: "var(--font-nunito)" }}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Moods */}
        <section id="moods" className="mx-auto max-w-[1100px] px-6 md:px-16 py-[72px] md:py-[96px]">
          <h2
            className="text-[28px] md:text-[36px] font-bold tracking-tight text-[#FFF8E7]"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            A mood for every night
          </h2>
          <p className="mt-3 text-[16px] text-[#D9D6F7] max-w-[50ch]" style={{ fontFamily: "var(--font-nunito)" }}>
            Each mood changes the colors, the words and the tiny details in the drawings.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {Object.entries(MOOD_PALETTES).map(([mood, palette]) => (
              <div
                key={mood}
                className="inline-flex items-center gap-2.5 h-[48px] px-5 rounded-full bg-[#2D2A6E] border border-white/10"
              >
                <span className="text-[18px]">{palette.emoji}</span>
                <span className="font-bold text-[14px] text-[#FFF8E7]" style={{ fontFamily: "var(--font-fredoka)" }}>
                  {mood}
                </span>
                <span className="text-[12px] text-[#9A96C8]">— {palette.description}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-5 gap-3">
            {(["Calm", "Silly", "Brave", "Sleepy", "Adventurous"] as const).map((mood) => (
              <div key={mood} className="rounded-[20px] overflow-hidden border border-white/10">
                <div className="h-[88px]" style={{ background: `linear-gradient(135deg, ${MOOD_PALETTES[mood].primary}, ${MOOD_PALETTES[mood].secondary})` }} />
                <div className="bg-[#2D2A6E] p-3">
                  <p className="font-bold text-[13px] text-[#FFF8E7]" style={{ fontFamily: "var(--font-fredoka)" }}>
                    {mood}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-[1100px] px-6 md:px-16 pb-[72px] md:pb-[96px]">
          <div className="rounded-[28px] md:rounded-[32px] bg-[#FFD93D] p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-[26px] md:text-[32px] font-bold tracking-tight text-[#1E1B4B]" style={{ fontFamily: "var(--font-fredoka)" }}>
                Ready for tonight&apos;s story?
              </h2>
              <p className="mt-2 text-[15px] md:text-[16px] leading-[1.5] text-[#1E1B4B]/80 max-w-[40ch]" style={{ fontFamily: "var(--font-nunito)" }}>
                It takes 30 seconds to start. No sign-up, no ads, just a cozy story.
              </p>
            </div>
            <Link
              href="/create"
              className="inline-flex items-center justify-center h-[48px] px-8 rounded-full bg-[#1E1B4B] text-[#FFF8E7] font-bold text-[15px] shadow-[0_4px_0_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,0.2)] transition-all self-start md:self-auto"
              style={{ fontFamily: "var(--font-fredoka)" }}
            >
              Make a story
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
