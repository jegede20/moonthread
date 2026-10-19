"use client";
import { useEffect, useState } from "react";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (window as any).navigator.standalone || window.matchMedia("(display-mode: standalone)").matches;
    if (isIOS && !isStandalone) {
      setShowIOS(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed) return null;

  if (deferred) {
    return (
      <div className="fixed bottom-[88px] md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-50 max-w-[360px] bg-[#2D2A6E] border border-white/10 rounded-[20px] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FFD93D] flex items-center justify-center text-[18px]">🌙</div>
        <div className="flex-1">
          <p className="text-[#FFF8E7] font-bold text-[13px]" style={{ fontFamily: "var(--font-fredoka)" }}>
            Install Moonthread
          </p>
          <p className="text-[#D9D6F7] text-[12px]">Add to home screen for offline stories</p>
        </div>
        <button
          onClick={async () => {
            deferred.prompt();
            const { outcome } = await deferred.userChoice;
            if (outcome === "accepted") setDismissed(true);
            setDeferred(null);
          }}
          className="h-8 px-4 rounded-full bg-[#FF7A59] text-[#1E1B4B] text-[12px] font-bold"
        >
          Install
        </button>
        <button onClick={() => setDismissed(true)} className="text-[#9A96C8] text-[16px] px-1" aria-label="Dismiss">
          ×
        </button>
      </div>
    );
  }

  if (showIOS) {
    return (
      <div className="fixed bottom-[88px] md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-50 max-w-[360px] bg-[#2D2A6E] border border-white/10 rounded-[20px] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFD93D] flex items-center justify-center text-[18px]">🌙</div>
            <div>
              <p className="text-[#FFF8E7] font-bold text-[13px]" style={{ fontFamily: "var(--font-fredoka)" }}>
                Install Moonthread
              </p>
              <p className="text-[#D9D6F7] text-[12px] leading-snug mt-1">
                Tap <span className="inline-block border border-white/20 rounded px-1">Share</span> then{" "}
                <span className="font-bold">Add to Home Screen</span> for offline stories
              </p>
            </div>
          </div>
          <button onClick={() => setDismissed(true)} className="text-[#9A96C8] text-[16px] px-1" aria-label="Dismiss">
            ×
          </button>
        </div>
      </div>
    );
  }

  return null;
}
