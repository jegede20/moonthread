"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SimpleHeader } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { getFavorites, deleteFavorite } from "@/lib/db";
import { Story } from "@/lib/storyTypes";

export default function LibraryPage() {
  const [favorites, setFavorites] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const favs = await getFavorites();
    setFavorites(favs);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this story?")) return;
    await deleteFavorite(id);
    load();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#1E1B4B] pb-[88px] md:pb-0">
      <SimpleHeader title="Library" />

      <main className="flex-1 mx-auto w-full max-w-[560px] px-6 md:px-8 py-8">
        <h1 className="text-[28px] font-bold tracking-tight text-[#FFF8E7]" style={{ fontFamily: "var(--font-fredoka)" }}>
          Library
        </h1>
        <p className="mt-2 text-[14px] text-[#D9D6F7]" style={{ fontFamily: "var(--font-nunito)" }}>
          Saved stories live on this device and work offline.
        </p>

        {loading ? (
          <div className="mt-10 flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[96px] rounded-[20px] bg-[#2D2A6E] animate-pulse" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#2D2A6E] flex items-center justify-center text-[32px]">📚</div>
            <h3 className="mt-6 text-[18px] font-bold text-[#FFF8E7]" style={{ fontFamily: "var(--font-fredoka)" }}>
              No saved stories yet
            </h3>
            <p className="mt-2 text-[14px] text-[#D9D6F7] max-w-[28ch]" style={{ fontFamily: "var(--font-nunito)" }}>
              Make a story and tap the heart to save it. It will appear here and work offline.
            </p>
            <Link
              href="/create"
              className="mt-6 h-11 px-6 rounded-full bg-[#FF7A59] text-[#1E1B4B] font-bold text-[14px] inline-flex items-center justify-center shadow-[0_4px_0_#C4533A]"
              style={{ fontFamily: "var(--font-fredoka)" }}
            >
              Make a story
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            {favorites.map((story) => (
              <div key={story.id} className="group rounded-[20px] bg-[#2D2A6E] border border-white/5 p-4 flex gap-4">
                <div className="w-16 h-16 rounded-[14px] bg-[#1E1B4B] flex items-center justify-center text-[28px] shrink-0">
                  {story.animal === "Fox"
                    ? "🦊"
                    : story.animal === "Bunny"
                    ? "🐰"
                    : story.animal === "Frog"
                    ? "🐸"
                    : story.animal === "Owl"
                    ? "🦉"
                    : story.animal === "Bear"
                    ? "🐻"
                    : "🦕"}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/story/${story.id}`} className="block">
                    <h3 className="font-bold text-[15px] text-[#FFF8E7] truncate" style={{ fontFamily: "var(--font-fredoka)" }}>
                      {story.title}
                    </h3>
                    <p className="mt-1 text-[12px] text-[#D9D6F7] truncate" style={{ fontFamily: "var(--font-nunito)" }}>
                      {story.childName} • {story.animal} • {story.mood} • {story.ageGroup} • {story.scenes.length} pages
                    </p>
                    <p className="mt-1 text-[11px] text-[#9A96C8]">
                      {new Date(story.createdAt).toLocaleDateString()} {story.isOffline ? "• Offline" : ""}
                    </p>
                  </Link>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Link
                    href={`/story/${story.id}`}
                    className="w-8 h-8 rounded-full bg-[#1E1B4B] border border-white/10 flex items-center justify-center text-[#FFF8E7] text-[14px]"
                    aria-label="Open story"
                  >
                    ▶
                  </Link>
                  <button
                    onClick={() => handleDelete(story.id)}
                    className="w-8 h-8 rounded-full bg-[#1E1B4B] border border-white/10 flex items-center justify-center text-[#FF8FB1] text-[14px]"
                    aria-label="Delete story"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
