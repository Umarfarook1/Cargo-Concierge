"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { AgentStep, RankedOption, ShipmentRequest } from "@/lib/schemas";
import { SiteNav } from "@/components/site-nav";
import { Hero } from "@/components/hero";
import { QuoteForm } from "@/components/quote-form";
import { PipelineTimeline, STAGE_ORDER, type StepUI } from "@/components/pipeline-timeline";
import { EmptyState, ShipmentCard, RankedOptions, EmailDraft } from "@/components/results";

export default function Home() {
  const [input, setInput] = useState("");
  const [steps, setSteps] = useState<StepUI[]>([]);
  const [request, setRequest] = useState<ShipmentRequest | null>(null);
  const [ranked, setRanked] = useState<RankedOption[] | null>(null);
  const [draftEmail, setDraftEmail] = useState<string>("");
  const [recommendation, setRecommendation] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  const reset = () => {
    setSteps(STAGE_ORDER.map((s) => ({ type: s.start, label: s.label, status: "pending" })));
    setRequest(null);
    setRanked(null);
    setDraftEmail("");
    setRecommendation("");
    setError(null);
    setElapsedMs(null);
  };

  const submit = async () => {
    if (!input.trim() || isRunning) return;
    reset();
    setIsRunning(true);
    // eslint-disable-next-line react-hooks/purity
    const t0 = Date.now();

    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!res.ok || !res.body) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const evt of events) {
          const lines = evt.split("\n");
          let eventName = "";
          let dataStr = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) eventName = line.slice(7);
            else if (line.startsWith("data: ")) dataStr += line.slice(6);
          }
          if (eventName !== "step" || !dataStr) continue;
          const step = JSON.parse(dataStr) as AgentStep;
          handleStep(step);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
      setElapsedMs(Math.round(Date.now() - t0));
    }
  };

  const handleStep = (step: AgentStep) => {
    setSteps((prev) => {
      const next = [...prev];
      const startIdx = STAGE_ORDER.findIndex((s) => s.start === step.type);
      const doneIdx = STAGE_ORDER.findIndex((s) => s.done === step.type);
      if (startIdx >= 0) next[startIdx] = { ...next[startIdx], status: "active" };
      if (doneIdx >= 0) next[doneIdx] = { ...next[doneIdx], status: "done" };
      return next;
    });

    switch (step.type) {
      case "extraction_done":
        setRequest(step.request);
        break;
      case "rate_query_done":
        setSteps((prev) => {
          const next = [...prev];
          const i = STAGE_ORDER.findIndex((s) => s.done === "rate_query_done");
          if (i >= 0) next[i] = { ...next[i], detail: `${step.options.length} matched · ${step.candidate_count} candidates` };
          return next;
        });
        break;
      case "ranker_done":
        setRanked(step.ranked);
        break;
      case "drafter_done":
        setDraftEmail(step.email);
        break;
      case "final":
        setRecommendation(step.response.recommendation_reasoning);
        break;
      case "error":
        setError(step.message);
        setSteps((prev) => prev.map((s) => (s.status === "active" ? { ...s, status: "error" } : s)));
        break;
    }
  };

  const hasOutput = request || ranked || draftEmail || error;

  return (
    <>
      <SiteNav />
      <Hero />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-10">
          <div className="lg:col-span-5 space-y-10">
            <QuoteForm
              value={input}
              onChange={setInput}
              onSubmit={submit}
              isRunning={isRunning}
              elapsedMs={elapsedMs}
            />

            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[color:var(--ink-mute)] mb-3">
                Pipeline
              </p>
              <PipelineTimeline steps={steps} error={error} />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <AnimatePresence mode="wait">
              {!hasOutput && !isRunning && (
                <motion.div key="empty" exit={{ opacity: 0 }}>
                  <EmptyState />
                </motion.div>
              )}
            </AnimatePresence>

            {request && <ShipmentCard request={request} />}
            {ranked && ranked.length > 0 && (
              <RankedOptions ranked={ranked} recommendation={recommendation} />
            )}
            {draftEmail && <EmailDraft email={draftEmail} />}

            {isRunning && !request && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg border border-[color:var(--paper-line)] bg-[color:var(--paper)] p-6 space-y-3"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-mute)]">
                  Working
                </div>
                <p className="font-display italic text-2xl text-[color:var(--ink)]">
                  Reading the request...
                </p>
                <div className="space-y-2 pt-2">
                  <div className="h-3 rounded shimmer w-full" />
                  <div className="h-3 rounded shimmer w-5/6" />
                  <div className="h-3 rounded shimmer w-4/6" />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-16 border-t border-[color:var(--paper-line)]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-mute)]">
          <span>Cargo Concierge · prototype · simulated rate data</span>
          <a
            href="https://github.com/Umarfarook1/Cargo-Concierge"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[color:var(--amber)] transition-colors"
          >
            github · umarfarook1
          </a>
        </div>
      </footer>
    </>
  );
}
