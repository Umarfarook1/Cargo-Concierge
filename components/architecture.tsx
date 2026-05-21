"use client";

import { motion } from "motion/react";

const NODES = [
  {
    title: "Email in",
    sub: "free text",
    body: "Customer asks for a rate via email or chat.",
    side: "in",
  },
  {
    title: "Extract",
    sub: "LLM · Mastra",
    body: "Pulls route, weight, dims, commodity, ready date. Zod-validated.",
    side: "pipe",
  },
  {
    title: "Query",
    sub: "Postgres · Drizzle",
    body: "Filters lanes by route + commodity + handling + capacity.",
    side: "pipe",
  },
  {
    title: "Rank",
    sub: "deterministic + LLM",
    body: "Composite score on price, transit, reliability. Rationale per option.",
    side: "pipe",
  },
  {
    title: "Reply out",
    sub: "drafted email",
    body: "Forwarder copies, sends, books.",
    side: "out",
  },
];

export function Architecture() {
  return (
    <section className="relative py-16 sm:py-20 border-t border-[color:var(--paper-line)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10 max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-mute)]">
            How it works
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl leading-tight">
            A five-step pipeline. <span className="italic text-[color:var(--amber)]">LLM only where it earns its place.</span>
          </h2>
          <p className="mt-3 text-[color:var(--ink-soft)] text-base leading-relaxed">
            Extraction and email drafting are ambiguous, so they use a language model. Rate filtering and price math are deterministic SQL. Ranking uses a deterministic composite score with an LLM-written rationale on top.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-2 relative">
          {NODES.map((n, i) => (
            <motion.div
              key={n.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className={`relative paper-card p-4 md:p-5 ${
                n.side === "in"
                  ? "bg-[color:var(--cream)]"
                  : n.side === "out"
                  ? "bg-[color:var(--amber-bg)] border-[color:var(--amber)]/30"
                  : ""
              }`}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-mute)]">
                Step {String(i + 1).padStart(2, "0")}
              </div>
              <div className="mt-1.5 font-display text-xl sm:text-2xl leading-tight">
                {n.title}
              </div>
              <div className="mt-0.5 font-mono text-[10.5px] text-[color:var(--amber)] tracking-wider">
                {n.sub}
              </div>
              <p className="mt-3 text-sm text-[color:var(--ink-soft)] leading-relaxed">
                {n.body}
              </p>

              {i < NODES.length - 1 && (
                <span className="hidden md:flex absolute -right-[15px] top-1/2 -translate-y-1/2 z-10 h-7 w-7 rounded-full bg-[color:var(--paper)] border border-[color:var(--paper-line)] items-center justify-center">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M2 5.5h7m-2.5-2.5 2.5 2.5-2.5 2.5" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard label="Single LLM call" value="2 of 5" sub="stages, the rest deterministic" />
          <StatCard label="Cost per quote" value="~$0.004" sub="Gemini 2.5 Flash" />
          <StatCard label="End-to-end p50" value="~12s" sub="from paste to drafted email" />
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="paper-card p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-mute)]">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl text-[color:var(--ink)] tabular leading-none">
        {value}
      </div>
      <div className="mt-1.5 text-[12.5px] text-[color:var(--ink-mute)]">{sub}</div>
    </div>
  );
}
