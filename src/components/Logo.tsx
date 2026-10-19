"use client";
import React from "react";

export function LogoIcon({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 44 44"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      role="img"
    >
      <path d="M21.77 4.1A16 16 0 1 0 34.6 26.55A13 13 0 1 1 21.77 4.1Z" fill="#FFD93D" />
      <path
        d="M34.6 26.6C41 29 42 37 35.5 38.5C30 39.5 28.5 33.5 33 32"
        fill="none"
        stroke="#FFF8E7"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoWordmark({ size = 44, showText = true, className = "" }: { size?: number; showText?: boolean; className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoIcon size={size} />
      {showText && (
        <span className="flex items-baseline gap-0 select-none" style={{ fontFamily: "var(--font-fredoka)" }}>
          <span className="font-bold text-[#FFF8E7] tracking-tight" style={{ fontSize: size * 0.52, fontWeight: 700 }}>
            Moon
          </span>
          <span className="font-medium text-[#C4B5FD] tracking-tight" style={{ fontSize: size * 0.52, fontWeight: 500 }}>
            thread
          </span>
        </span>
      )}
    </div>
  );
}

export default LogoWordmark;
