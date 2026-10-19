"use client";
import Link from "next/link";
import { LogoWordmark } from "./Logo";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <header className="w-full sticky top-0 z-30 backdrop-blur-xl bg-[#1E1B4B]/80 border-b border-white/5">
      <div className="mx-auto max-w-[1100px] px-6 md:px-16 flex items-center justify-between h-[68px]">
        <Link href="/" className="flex items-center" aria-label="Moonthread home">
          <LogoWordmark size={36} />
        </Link>

        <nav className="flex items-center gap-6">
          {isLanding && (
            <>
              <a
                href="#how-it-works"
                className="hidden md:inline-flex text-[14px] font-semibold tracking-wide text-[#D9D6F7] hover:text-[#FFF8E7] transition-colors"
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                How it works
              </a>
              <a
                href="#moods"
                className="hidden md:inline-flex text-[14px] font-semibold tracking-wide text-[#D9D6F7] hover:text-[#FFF8E7] transition-colors"
                style={{ fontFamily: "var(--font-fredoka)" }}
              >
                Moods
              </a>
            </>
          )}
          <Link
            href="/create"
            className="inline-flex items-center justify-center h-9 md:h-[42px] px-5 rounded-full bg-[#FF7A59] text-[#1E1B4B] font-bold text-[14px] tracking-wide shadow-[0_4px_0_#C4533A] active:translate-y-[2px] active:shadow-[0_2px_0_#C4533A] transition-all"
            style={{ fontFamily: "var(--font-fredoka)" }}
          >
            Make a story
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SimpleHeader({ title }: { title?: string }) {
  return (
    <header className="w-full sticky top-0 z-30 backdrop-blur-xl bg-[#1E1B4B]/80 border-b border-white/5">
      <div className="mx-auto max-w-[1100px] px-6 md:px-16 flex items-center justify-between h-[68px]">
        <Link href="/" aria-label="Moonthread home">
          <LogoWordmark size={36} />
        </Link>
        {title && (
          <h1 className="text-[#FFF8E7] font-bold text-[18px]" style={{ fontFamily: "var(--font-fredoka)" }}>
            {title}
          </h1>
        )}
        <div className="w-9" />
      </div>
    </header>
  );
}
