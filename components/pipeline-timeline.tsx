"use client";

import { motion } from "motion/react";
import type { AgentStep } from "@/lib/schemas";

export type StepUI = {
  type: AgentStep["type"];
  label: string;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
};

export const STAGE_ORDER: Array<{ start: AgentStep["type"]; done: AgentStep["type"]; label: string }> = [
  { start: "extraction_start", done: "extraction_done", label: "Read the request" },
  { start: "rate_query_start", done: "rate_query_done", label: "Query 12 airlines" },
  { start: "ranker_start", done: "ranker_done", label: "Score and rank" },
  { start: "drafter_start", done: "drafter_done", label: "Draft the reply" },
];

export function PipelineTimeline({ steps, error }: { steps: StepUI[]; error: string | null }) {
  if (steps.length === 0 && !error) {
    return (
      <ol className="space-y-3 opacity-50">
        {STAGE_ORDER.map((s, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-[color:var(--ink-mute)]">
            <span className="mt-1 inline-block h-[15px] w-[15px] rounded-full border border-[color:var(--paper-line)] bg-[color:var(--paper)]" />
            <span>{s.label}</span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[color:var(--paper-line)]" />
      <ol className="space-y-3.5">
        {steps.map((s, i) => (
          <li key={i} className="relative flex items-start gap-3">
            <span className="relative z-10 mt-1 inline-flex h-[15px] w-[15px] items-center justify-center rounded-full border bg-[color:var(--paper)]"
              style={{
                borderColor:
                  s.status === "done"
                    ? "var(--moss)"
                    : s.status === "active"
                    ? "var(--amber)"
                    : s.status === "error"
                    ? "var(--rust)"
                    : "var(--paper-line)",
              }}
            >
              {s.status === "done" && (
                <motion.svg
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  width="9"
                  height="9"
                  viewBox="0 0 9 9"
                  fill="none"
                >
                  <path d="M1.5 4.5l2 2 4-4" stroke="var(--moss)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              )}
              {s.status === "active" && (
                <span className="h-2 w-2 rounded-full bg-[color:var(--amber)] dot-active" />
              )}
              {s.status === "error" && (
                <span className="font-mono text-[10px] text-[color:var(--rust)]">!</span>
              )}
            </span>
            <div className="flex-1 pt-0.5">
              <div
                className="text-sm transition-colors"
                style={{
                  color:
                    s.status === "pending"
                      ? "var(--ink-mute)"
                      : s.status === "active"
                      ? "var(--ink)"
                      : "var(--ink)",
                  fontWeight: s.status === "active" ? 500 : 400,
                }}
              >
                {s.label}
              </div>
              {s.detail && (
                <div className="mt-0.5 font-mono text-[11px] text-[color:var(--ink-mute)]">
                  {s.detail}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded border border-[color:var(--rust)]/40 bg-[color:var(--rust)]/5 text-sm text-[color:var(--rust)]"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
