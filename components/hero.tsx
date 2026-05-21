"use client";

import { motion } from "motion/react";
import { RouteGraphic } from "./route-graphic";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[color:var(--paper-line)]">
      <div className="absolute inset-0 dotgrid opacity-30 pointer-events-none" />
      <RouteGraphic className="absolute -right-10 -top-6 w-[640px] max-w-[80vw] opacity-90 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 py-20 sm:py-28">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="font-mono uppercase tracking-[0.22em] text-[10px] text-[color:var(--ink-mute)]"
        >
          For freight forwarders · agentic quote copilot
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 font-display text-5xl sm:text-7xl leading-[0.95] tracking-tight max-w-3xl"
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
          Paste a quote request from a customer. Get ranked airline options and a draft reply in under fifteen seconds. No tab juggling, no copy-paste.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-mute)]"
        >
          <Stat label="airlines" value="12" />
          <span className="h-3 w-px bg-[color:var(--paper-line)]" />
          <Stat label="lanes" value="48" />
          <span className="h-3 w-px bg-[color:var(--paper-line)]" />
          <Stat label="eval set" value="30" />
          <span className="h-3 w-px bg-[color:var(--paper-line)]" />
          <Stat label="p50 latency" value="~12s" />
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="tabular text-[color:var(--ink)] text-base font-display not-italic">
        {value}
      </span>
      <span>{label}</span>
    </span>
  );
}
