"use client";

import { motion } from "motion/react";

export const SAMPLES = [
  {
    label: "General cargo",
    sub: "JFK to Dublin · 1,200 kg",
    icon: "box",
    text:
      "Hi, customer needs a quote: 3 pallets JFK to Dublin, dry general cargo, gross 1200kg, dims 120x100x110cm each, ready Friday, no rush. Thanks.",
  },
  {
    label: "Pharma cold chain",
    sub: "BLR to Frankfurt · GDP 2-8C",
    icon: "vial",
    text:
      "Need rates BLR to Frankfurt for 480kg pharma (vaccines, GDP required, 2-8C cool chain). 6 pieces, 80x60x80cm. Ready Mon, prefer priority.",
  },
  {
    label: "AOG express",
    sub: "LAX to Tokyo · next flight out",
    icon: "bolt",
    text:
      "AOG, urgent! Aircraft engine part LAX to Tokyo NRT, single piece 380kg, dims 200x140x110, next flight out, need by end of week.",
  },
  {
    label: "Dangerous goods",
    sub: "HKG to Frankfurt · DG class 9",
    icon: "shield",
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
    <section className="space-y-6">
      <div>
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--ink-mute)] mb-3">
          Start here · pick a sample
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SAMPLES.map((s, i) => (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i + 0.6 }}
              onClick={() => onChange(s.text)}
              disabled={isRunning}
              className="group flex items-start gap-3 text-left p-3 rounded-md border border-[color:var(--paper-line)] bg-[color:var(--paper)] hover:border-[color:var(--amber)]/60 hover:bg-[color:var(--amber-bg)]/40 disabled:opacity-50 transition-all"
            >
              <SampleIcon kind={s.icon} />
              <div className="min-w-0">
                <div className="text-sm font-medium text-[color:var(--ink)] truncate">
                  {s.label}
                </div>
                <div className="font-mono text-[10.5px] text-[color:var(--ink-mute)] truncate mt-0.5">
                  {s.sub}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-mute)]/70">
        or paste your own
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label htmlFor="forwarder-request" className="font-mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--ink-mute)]">
            Forwarder request
          </label>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-mute)]/60">
            {value.length} chars
          </span>
        </div>
        <textarea
          id="forwarder-request"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={'Paste the email or message your customer sent.\n\nLike: "Need a quote 3 pallets JFK to Dublin, 1200kg general cargo, ready Friday."'}
          rows={8}
          disabled={isRunning}
          className="w-full rounded-md border border-[color:var(--paper-line)] bg-[color:var(--paper-soft)] p-4 text-sm font-mono text-[color:var(--ink)] leading-relaxed placeholder:text-[color:var(--ink-mute)]/70 focus:outline-none focus:ring-2 focus:ring-[color:var(--amber)]/40 focus:border-[color:var(--amber)]/60 transition-colors disabled:opacity-60"
        />
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onSubmit}
          disabled={!value.trim() || isRunning}
          className="group relative inline-flex items-center gap-2.5 px-6 py-3 rounded-md bg-[color:var(--amber)] text-[color:var(--paper)] text-[15px] font-medium tracking-wide hover:bg-[color:var(--rust)] disabled:bg-[color:var(--paper-line)] disabled:text-[color:var(--ink-mute)] disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
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
        strokeWidth="1.6"
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

function SampleIcon({ kind }: { kind: string }) {
  const stroke = "var(--amber)";
  if (kind === "box") {
    return (
      <span className="mt-0.5 inline-flex h-7 w-7 rounded-md bg-[color:var(--amber-bg)] items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L1.5 4v6L7 13l5.5-3V4L7 1zM1.5 4 7 7m5.5-3L7 7m0 0v6" stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (kind === "vial") {
    return (
      <span className="mt-0.5 inline-flex h-7 w-7 rounded-md bg-[color:var(--amber-bg)] items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M4.5 1.5h5M5 1.5v8a2 2 0 1 0 4 0v-8M5 6h4" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (kind === "bolt") {
    return (
      <span className="mt-0.5 inline-flex h-7 w-7 rounded-md bg-[color:var(--amber-bg)] items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M8 1 3 8h3l-1 5 5-7H7l1-5z" stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="mt-0.5 inline-flex h-7 w-7 rounded-md bg-[color:var(--amber-bg)] items-center justify-center shrink-0">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1 2 3v4c0 3 2 5 5 6 3-1 5-3 5-6V3L7 1z" stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
