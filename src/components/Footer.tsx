"use client";
import Link from "next/link";
import { LogoWordmark } from "./Logo";

export function Footer() {
  return (
    <footer className="w-full bg-[#16143A] border-t border-white/5 mt-0">
      <div className="mx-auto max-w-[1100px] px-6 md:px-16 py-14 md:py-20">
        <div className="flex flex-col md:flex-row md:justify-between gap-10 md:gap-16">
          <div className="max-w-[320px]">
            <LogoWordmark size={38} />
            <p className="mt-4 text-[15px] leading-[1.6] text-[#D9D6F7]" style={{ fontFamily: "var(--font-nunito)" }}>
              Gentle stories, drawn and read aloud for little dreamers.
            </p>
          </div>

          <div className="flex gap-16 md:gap-24">
            <div>
              <h4 className="text-[#FFF8E7] font-bold text-[14px] tracking-wide mb-4" style={{ fontFamily: "var(--font-fredoka)" }}>
                Product
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="#how-it-works" className="text-[#D9D6F7] text-[14px] hover:text-white transition-colors">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#moods" className="text-[#D9D6F7] text-[14px] hover:text-white transition-colors">
                    Moods
                  </a>
                </li>
                <li>
                  <Link href="/create" className="text-[#D9D6F7] text-[14px] hover:text-white transition-colors">
                    Create story
                  </Link>
                </li>
                <li>
                  <Link href="/library" className="text-[#D9D6F7] text-[14px] hover:text-white transition-colors">
                    Library
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[#FFF8E7] font-bold text-[14px] tracking-wide mb-4" style={{ fontFamily: "var(--font-fredoka)" }}>
                Legal
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/privacy" className="text-[#D9D6F7] text-[14px] hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-[#D9D6F7] text-[14px] hover:text-white transition-colors">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-[#9A96C8] text-[13px]">© 2026 Moonthread</p>
          <p className="text-[#9A96C8] text-[13px]">Stories are written with AI.</p>
        </div>
      </div>
    </footer>
  );
}
