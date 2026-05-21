"use client";

import Link from "next/link";

export function SiteNav() {
  return (
    <header className="border-b border-[color:var(--paper-line)] bg-[color:var(--paper)]/85 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--ink-mute)] group-hover:text-[color:var(--amber)] transition-colors">
            cgo / cncg
          </span>
          <span className="h-3 w-px bg-[color:var(--paper-line)]" />
          <span className="font-display italic text-lg tracking-tight">
            Cargo Concierge
          </span>
        </Link>
        <div className="flex items-center gap-5 text-xs">
          <a
            href="https://github.com/Umarfarook1/Cargo-Concierge"
            target="_blank"
            rel="noreferrer"
            className="text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] transition-colors font-mono uppercase tracking-wider"
          >
            Source
          </a>
          <span
            className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] uppercase text-[color:var(--ink-mute)]"
            title="Currently using Google Gemini"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--moss)] dot-active" />
            live
          </span>
        </div>
      </div>
    </header>
  );
}

