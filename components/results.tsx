"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import type { RankedOption, ShipmentRequest } from "@/lib/schemas";

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative h-full min-h-[480px] rounded-lg border border-dashed border-[color:var(--paper-line)] bg-[color:var(--paper-soft)]/40 p-10 flex flex-col items-center justify-center text-center"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-mute)] mb-3">
        Awaiting input
      </div>
      <p className="font-display italic text-2xl text-[color:var(--ink-soft)] max-w-sm">
        Paste a forwarder email on the left, or try one of the four samples.
      </p>
      <div className="mt-8 font-mono text-[11px] text-[color:var(--ink-mute)]/70 max-w-md leading-relaxed">
        The pipeline extracts the shipment, queries every airline that flies the route, ranks the options, and drafts a reply you can send.
      </div>
    </motion.div>
  );
}

export function ShipmentCard({ request }: { request: ShipmentRequest }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-lg border border-[color:var(--paper-line)] bg-[color:var(--paper)] p-5"
    >
      <header className="flex items-baseline justify-between mb-4">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-mute)]">
          Step 02 · extracted shipment
        </h3>
      </header>

      <div className="flex items-center gap-3 font-display text-3xl mb-5">
        <span className="tabular">{request.origin_iata}</span>
        <RouteSegment />
        <span className="tabular text-[color:var(--amber)]">{request.destination_iata}</span>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
        <Field k="Pieces" v={String(request.pieces)} />
        <Field k="Chargeable" v={`${request.chargeable_weight_kg.toFixed(1)} kg`} />
        <Field k="Gross" v={`${request.gross_weight_kg} kg`} />
        <Field k="Commodity" v={request.commodity_type} />
        <Field k="Service" v={request.service_level} />
        <Field k="Ready" v={request.ready_date} />
        {request.special_handling.length > 0 && (
          <div className="col-span-2 sm:col-span-3">
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-mute)]">
              Special handling
            </dt>
            <dd className="mt-1.5 flex flex-wrap gap-1">
              {request.special_handling.map((h) => (
                <span
                  key={h}
                  className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-[color:var(--amber-bg)] text-[color:var(--amber)] border border-[color:var(--amber)]/20"
                >
                  {h}
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </motion.section>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--ink-mute)]">
        {k}
      </dt>
      <dd className="mt-0.5 text-[color:var(--ink)]">{v}</dd>
    </div>
  );
}

function RouteSegment() {
  return (
    <svg width="44" height="14" viewBox="0 0 44 14" fill="none" className="text-[color:var(--ink-mute)]">
      <line x1="2" y1="7" x2="40" y2="7" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 3" />
      <path
        d="M36 3l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RankedOptions({
  ranked,
  recommendation,
}: {
  ranked: RankedOption[];
  recommendation: string;
}) {
  const top = ranked.slice(0, 3);
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-lg border border-[color:var(--paper-line)] bg-[color:var(--paper)] p-5"
    >
      <header className="flex items-baseline justify-between mb-4">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-mute)]">
          Step 03 · ranked options
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-mute)]">
          {ranked.length} matched
        </span>
      </header>

      {recommendation && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="font-display italic text-base leading-relaxed text-[color:var(--ink-soft)] mb-5 pl-3 border-l-2 border-[color:var(--amber)]"
        >
          {recommendation}
        </motion.p>
      )}

      <ul className="space-y-2.5">
        {top.map((opt, i) => (
          <OptionRow key={`${opt.airline_iata}-${i}`} opt={opt} index={i} />
        ))}
      </ul>
    </motion.section>
  );
}

function OptionRow({ opt, index }: { opt: RankedOption; index: number }) {
  const isWinner = index === 0;
  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 + index * 0.07 }}
      className={`group relative p-4 rounded-md border transition-all hover:-translate-y-0.5 hover:shadow-md ${
        isWinner
          ? "border-[color:var(--amber)]/50 bg-[color:var(--amber-bg)]/40"
          : "border-[color:var(--paper-line)] bg-[color:var(--paper-soft)]/40"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className={`font-mono text-[11px] tabular w-6 h-6 rounded-full inline-flex items-center justify-center ${
              isWinner
                ? "bg-[color:var(--amber)] text-[color:var(--paper)]"
                : "bg-[color:var(--paper-line)] text-[color:var(--ink-soft)]"
            }`}
          >
            {index + 1}
          </span>
          <div>
            <div className="font-medium text-[color:var(--ink)] flex items-center gap-2">
              {opt.airline_name}
              <span className="font-mono text-[10px] tracking-wider text-[color:var(--ink-mute)]">
                {opt.airline_iata}
              </span>
              {isWinner && (
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded bg-[color:var(--amber)] text-[color:var(--paper)]">
                  recommended
                </span>
              )}
            </div>
            <div className="mt-1 font-mono text-[11px] text-[color:var(--ink-mute)] flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span>{opt.flight_path.join(" → ")}</span>
              <span className="opacity-50">·</span>
              <CapacityChip status={opt.capacity_status} />
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl tabular">
            ${opt.price_breakdown.total_usd.toFixed(0)}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-mute)] mt-0.5">
            score {opt.composite_score}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[11px]">
        <Metric label="Transit" value={`${opt.transit_days}d`} />
        <Metric label="Reliability" value={`${opt.reliability_score}%`} />
        <Metric label="Arrival" value={opt.arrival_date} />
      </div>

      {opt.rationale && (
        <p className="mt-3 text-[12px] text-[color:var(--ink-soft)] leading-relaxed">
          {opt.rationale}
        </p>
      )}
    </motion.li>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[color:var(--ink-mute)] uppercase tracking-wider text-[10px]">
        {label}
      </span>
      <span className="text-[color:var(--ink)] tabular">{value}</span>
    </div>
  );
}

function CapacityChip({ status }: { status: "confirmed" | "tentative" | "request" }) {
  const colors = {
    confirmed: "var(--moss)",
    tentative: "var(--amber)",
    request: "var(--ink-mute)",
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: colors[status] }}
      />
      <span className="uppercase tracking-wider text-[10px]">{status}</span>
    </span>
  );
}

export function EmailDraft({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-lg border border-[color:var(--paper-line)] bg-[color:var(--paper)] p-5"
    >
      <header className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-mute)]">
          Step 04 · drafted reply
        </h3>
        <button
          onClick={() => {
            navigator.clipboard.writeText(email);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
          className="font-mono text-[10px] uppercase tracking-[0.18em] px-2.5 py-1.5 rounded border border-[color:var(--paper-line)] hover:border-[color:var(--amber)] hover:text-[color:var(--amber)] transition-colors"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={copied ? "copied" : "copy"}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="inline-block"
            >
              {copied ? "copied" : "copy"}
            </motion.span>
          </AnimatePresence>
        </button>
      </header>

      <pre className="font-mono text-[12.5px] whitespace-pre-wrap leading-relaxed text-[color:var(--ink-soft)] bg-[color:var(--paper-soft)]/50 p-4 rounded-md border border-[color:var(--paper-line)]">
        {email}
      </pre>
    </motion.section>
  );
}
