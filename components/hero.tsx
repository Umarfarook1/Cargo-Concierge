"use client";

import { motion } from "motion/react";
import { RouteGraphic } from "./route-graphic";

const STATS = [
  { value: "12", label: "Airlines" },
  { value: "48", label: "Lanes" },
  { value: "30", label: "Eval cases" },
  { value: "≈12s", label: "End to end" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[color:var(--paper-line)]">
      <div className="absolute inset-0 dotgrid opacity-[0.22] pointer-events-none" />
      <RouteGraphic className="absolute -right-12 -top-8 w-[680px] max-w-[80vw] opacity-90 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-12 sm:pt-24 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="inline-flex items-center gap-2 font-mono uppercase tracking-[0.22em] text-[10px] text-[color:var(--ink-mute)]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--amber)] dot-active" />
          A copilot for freight forwarders
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 font-display text-5xl sm:text-7xl leading-[0.95] tracking-tight max-w-3xl"
        >
          Air cargo quotes,{" "}
          <span className="italic text-[color:var(--amber)]">
            drafted before your coffee cools.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 max-w-xl text-base sm:text-lg text-[color:var(--ink-soft)] leading-relaxed"
        >
          Paste a customer email asking for a rate. Get ranked airline options and a draft reply in under fifteen seconds. No tab juggling, no copy-paste, no rate-sheet PDFs.
        </motion.p>

        <motion.dl
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 max-w-2xl"
        >
          {STATS.map((s) => (
            <div key={s.label} className="border-l border-[color:var(--paper-line)] pl-3">
              <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-mute)]">
                {s.label}
              </dt>
              <dd className="mt-1 font-display text-2xl sm:text-3xl tabular leading-none">
                {s.value}
              </dd>
            </div>
          ))}
        </motion.dl>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mt-12 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-mute)]"
        >
          <span>Try it below</span>
          <motion.svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <path
              d="M11 4v14m-5-5 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </motion.div>
      </div>
    </section>
  );
}
