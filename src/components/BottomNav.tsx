"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/create", label: "Create", icon: "✨" },
  { href: "/library", label: "Library", icon: "📚" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#16143A]/95 backdrop-blur-xl border-t border-white/10 md:hidden">
      <div className="flex items-center justify-around h-[72px] px-2 safe-pb">
        {NAV.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 min-w-[72px] h-[52px] rounded-[16px] transition-colors ${
                active ? "bg-[#2D2A6E] text-[#FFF8E7]" : "text-[#9A96C8]"
              }`}
            >
              <span className="text-[20px] leading-none">{item.icon}</span>
              <span className="text-[11px] font-bold tracking-wide" style={{ fontFamily: "var(--font-fredoka)" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
