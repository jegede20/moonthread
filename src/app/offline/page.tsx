"use client";
import Link from "next/link";
import { LogoWordmark } from "@/components/Logo";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#1E1B4B] flex flex-col">
      <header className="h-[68px] px-6 flex items-center border-b border-white/5">
        <Link href="/">
          <LogoWordmark size={32} />
        </Link>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-[#2D2A6E] flex items-center justify-center text-[32px]">🌙</div>
        <h1 className="mt-6 text-[24px] font-bold text-[#FFF8E7]" style={{ fontFamily: "var(--font-fredoka)" }}>
          You&apos;re offline
        </h1>
        <p className="mt-3 text-[15px] leading-[1.6] text-[#D9D6F7] max-w-[36ch]" style={{ fontFamily: "var(--font-nunito)" }}>
          No worries — your saved stories still work. You can also create new stories from cozy templates that live on your device.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link href="/library" className="h-11 px-6 rounded-full bg-[#FF7A59] text-[#1E1B4B] font-bold inline-flex items-center justify-center shadow-[0_4px_0_#C4533A]">
            Open library
          </Link>
          <Link href="/create" className="h-11 px-6 rounded-full bg-transparent border-2 border-[#C4B5FD] text-[#FFF8E7] font-bold inline-flex items-center justify-center">
            Make offline story
          </Link>
        </div>
      </main>
    </div>
  );
}
