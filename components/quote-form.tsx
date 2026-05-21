"use client";

import { motion } from "motion/react";

export const SAMPLES = [
  {
    label: "JFK to Dublin · general",
    text:
      "Hi, customer needs a quote: 3 pallets JFK to Dublin, dry general cargo, gross 1200kg, dims 120x100x110cm each, ready Friday, no rush. Thanks.",
  },
  {
    label: "Bangalore to Frankfurt · pharma cold chain",
    text:
      "Need rates BLR to Frankfurt for 480kg pharma (vaccines, GDP required, 2-8C cool chain). 6 pieces, 80x60x80cm. Ready Mon, prefer priority.",
  },
  {
    label: "LAX to Tokyo · AOG express",
    text:
      "AOG, urgent! Aircraft engine part LAX to Tokyo NRT, single piece 380kg, dims 200x140x110, next flight out, need by end of week.",
  },
  {
    label: "HKG to Frankfurt · DG class 9",
    text:
      "Lithium batteries (UN3480) HKG to FRA, 200kg, 2 pieces, DG class 9, ready next Monday.",
  },
];

export function QuoteForm({
  value,
  onChange,
  onSubmit,
  isRunning,
  elapsedMs,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isRunning: boolean;
  elapsedMs: number | null;
}) {
  return (
    <section className="space-y-5">
      <div>
        <label className="font-mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--ink-mute)]">
          Step 01 · forwarder request
        </label>
        <div className="relative mt-2">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste the email or chat message your customer sent you. Or click a sample below."
            rows={9}
            disabled={isRunning}
            className="w-full rounded-md border border-[color:var(--paper-line)] bg-[color:var(--paper-soft)] p-4 text-sm font-mono text-[color:var(--ink)] leading-relaxed placeholder:text-[color:var(--ink-mute)]/70 focus:outline-none focus:ring-2 focus:ring-[color:var(--amber)]/50 focus:border-[color:var(--amber)]/60 transition-colors disabled:opacity-60"
          />
          <span className="absolute bottom-3 right-3 font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-mute)]/70 pointer-events-none">
            {value.length} chars
          </span>
        </div>
      </div>

      <div>
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--ink-mute)] mb-2.5">
          Try a sample
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLES.map((s, i) => (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i + 0.7 }}
              onClick={() => onChange(s.text)}
              disabled={isRunning}
              className="group inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-[color:var(--paper-line)] bg-[color:var(--paper)] hover:border-[color:var(--amber)]/60 hover:bg-[color:var(--amber-bg)]/40 disabled:opacity-50 transition-all"
            >
              <span className="h-1 w-1 rounded-full bg-[color:var(--ink-mute)] group-hover:bg-[color:var(--amber)] transition-colors" />
              {s.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 pt-1">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onSubmit}
          disabled={!value.trim() || isRunning}
          className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[color:var(--ink)] text-[color:var(--paper)] text-sm font-medium tracking-wide hover:bg-[color:var(--amber)] disabled:opacity-40 disabled:hover:bg-[color:var(--ink)] transition-colors"
        >
          {isRunning ? (
            <>
              <SpinnerDots />
              <span>Running pipeline</span>
            </>
          ) : (
            <>
              <span>Get quote</span>
              <ArrowRight />
            </>
          )}
        </motion.button>

        {elapsedMs != null && !isRunning && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-xs text-[color:var(--ink-mute)]"
          >
            done in {(elapsedMs / 1000).toFixed(1)}s
          </motion.span>
        )}
      </div>
    </section>
  );
}

function ArrowRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="transition-transform group-hover:translate-x-0.5"
    >
      <path
        d="M3 7h8m-3-3 3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpinnerDots() {
  return (
    <span className="inline-flex gap-0.5">
      <span className="h-1.5 w-1.5 rounded-full bg-current dot-active" style={{ animationDelay: "0ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-current dot-active" style={{ animationDelay: "150ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-current dot-active" style={{ animationDelay: "300ms" }} />
    </span>
  );
}
