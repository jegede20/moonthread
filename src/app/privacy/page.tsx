import Link from "next/link";
import { LogoWordmark } from "@/components/Logo";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#1E1B4B] flex flex-col">
      <header className="h-[68px] px-6 md:px-16 flex items-center border-b border-white/5">
        <Link href="/">
          <LogoWordmark size={32} />
        </Link>
      </header>
      <main className="flex-1 mx-auto w-full max-w-[720px] px-6 md:px-16 py-12">
        <h1 className="text-[32px] font-bold text-[#FFF8E7]" style={{ fontFamily: "var(--font-fredoka)" }}>
          Privacy
        </h1>
        <div className="mt-8 space-y-6 text-[15px] leading-[1.7] text-[#D9D6F7]" style={{ fontFamily: "var(--font-nunito)" }}>
          <p>
            Moonthread is designed to be private and offline-first. There are no accounts, no database, and no tracking.
          </p>
          <h2 className="text-[18px] font-bold text-[#FFF8E7] mt-8" style={{ fontFamily: "var(--font-fredoka)" }}>
            What stays on your device
          </h2>
          <p>Child&apos;s name, favorite animal, mood, age group, created stories, favorites, and settings are stored in IndexedDB on your device only.</p>
          <h2 className="text-[18px] font-bold text-[#FFF8E7] mt-8" style={{ fontFamily: "var(--font-fredoka)" }}>
            What is sent to Groq
          </h2>
          <p>
            When you create a story online, we send only the child&apos;s first name, chosen animal, mood, and age group to Groq&apos;s API to generate the story. We do not send any other personal data, and we do not log prompts. The Groq API key is kept server-side and never exposed to the client.
          </p>
          <h2 className="text-[18px] font-bold text-[#FFF8E7] mt-8" style={{ fontFamily: "var(--font-fredoka)" }}>
            Offline
          </h2>
          <p>If you are offline or Groq fails, stories are generated from built-in templates on your device, with no network request.</p>
          <h2 className="text-[18px] font-bold text-[#FFF8E7] mt-8" style={{ fontFamily: "var(--font-fredoka)" }}>
            Children
          </h2>
          <p>Moonthread is for parents and guardians to create bedtime stories for children. We do not knowingly collect data from children.</p>
          <p className="text-[13px] text-[#9A96C8] mt-10">Last updated: 2026</p>
        </div>
      </main>
    </div>
  );
}
