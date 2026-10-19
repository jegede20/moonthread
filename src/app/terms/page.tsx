import Link from "next/link";
import { LogoWordmark } from "@/components/Logo";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#1E1B4B] flex flex-col">
      <header className="h-[68px] px-6 md:px-16 flex items-center border-b border-white/5">
        <Link href="/">
          <LogoWordmark size={32} />
        </Link>
      </header>
      <main className="flex-1 mx-auto w-full max-w-[720px] px-6 md:px-16 py-12">
        <h1 className="text-[32px] font-bold text-[#FFF8E7]" style={{ fontFamily: "var(--font-fredoka)" }}>
          Terms
        </h1>
        <div className="mt-8 space-y-6 text-[15px] leading-[1.7] text-[#D9D6F7]" style={{ fontFamily: "var(--font-nunito)" }}>
          <p>Moonthread is a free, experimental bedtime story app. Stories are generated with AI and may not always be perfect.</p>
          <h2 className="text-[18px] font-bold text-[#FFF8E7] mt-8" style={{ fontFamily: "var(--font-fredoka)" }}>
            Use
          </h2>
          <p>Use Moonthread for personal, non-commercial bedtime stories. You are responsible for reviewing stories before sharing them with children.</p>
          <h2 className="text-[18px] font-bold text-[#FFF8E7] mt-8" style={{ fontFamily: "var(--font-fredoka)" }}>
            AI Content
          </h2>
          <p>
            Stories are written with Groq&apos;s Llama models. We apply kid-safe prompt rules and a blocklist check, but AI can make mistakes. If a story doesn&apos;t feel right, create another or use an offline template.
          </p>
          <h2 className="text-[18px] font-bold text-[#FFF8E7] mt-8" style={{ fontFamily: "var(--font-fredoka)" }}>
            No warranty
          </h2>
          <p>Moonthread is provided as-is, without warranty. The service relies on Groq&apos;s free tier and may be rate-limited.</p>
          <p className="text-[13px] text-[#9A96C8] mt-10">Last updated: 2026</p>
        </div>
      </main>
    </div>
  );
}
