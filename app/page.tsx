"use client";

import { useState } from "react";
import type { AgentStep, RankedOption, ShipmentRequest } from "@/lib/schemas";

const SAMPLES = [
  {
    label: "JFK -> DUB, 1200kg general",
    text:
      "Hi, customer needs a quote: 3 pallets JFK to Dublin, dry general cargo, gross 1200kg, dims 120x100x110cm each, ready Friday, no rush. Thanks.",
  },
  {
    label: "BLR -> FRA pharma cold chain",
    text:
      "Need rates BLR -> Frankfurt for 480kg pharma (vaccines, GDP required, 2-8C cool chain). 6 pieces, 80x60x80cm. Ready Mon, prefer priority. Consignee in Germany.",
  },
  {
    label: "LAX -> NRT, AOG express",
    text:
      "AOG, urgent! Aircraft engine part LAX to Tokyo NRT, single piece 380kg, dims 200x140x110, next flight out, need by end of week.",
  },
  {
    label: "MIA -> GRU perishable",
    text:
      "Flowers Miami to Sao Paulo, 900kg total, 9 pieces, need cool chain 2-8C, ready Wed, customer wants delivery by Saturday latest.",
  },
];

type StepUI = {
  type: AgentStep["type"];
  label: string;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
};

const STAGE_ORDER: Array<{ start: AgentStep["type"]; done: AgentStep["type"]; label: string }> = [
  { start: "extraction_start", done: "extraction_done", label: "Extract shipment details" },
  { start: "rate_query_start", done: "rate_query_done", label: "Query rates from 12 airlines" },
  { start: "ranker_start", done: "ranker_done", label: "Score and rank options" },
  { start: "drafter_start", done: "drafter_done", label: "Draft quote response" },
];

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

      if (startIdx >= 0) {
        next[startIdx] = { ...next[startIdx], status: "active" };
      }
      if (doneIdx >= 0) {
        next[doneIdx] = { ...next[doneIdx], status: "done" };
      }
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
          if (i >= 0) next[i] = { ...next[i], detail: `${step.options.length} matched, ${step.candidate_count} candidates` };
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

  return (
    <div className="min-h-screen flex-1 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold tracking-tight">Cargo Concierge</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                agentic quote copilot
              </span>
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              Paste a forwarder request. Get ranked airline quotes and a draft response in seconds.
            </p>
          </div>
          <a
            href="https://github.com/umarfarook1/Cargo-Concierge"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            GitHub
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Forwarder request</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste the email or chat message from your customer..."
              rows={10}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLES.map((s) => (
              <button
                key={s.label}
                onClick={() => setInput(s.text)}
                className="text-xs px-2.5 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                disabled={isRunning}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={submit}
              disabled={!input.trim() || isRunning}
              className="px-4 py-2 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isRunning ? "Running..." : "Get quote"}
            </button>
            {elapsedMs != null && !isRunning && (
              <span className="text-xs text-neutral-500">Done in {(elapsedMs / 1000).toFixed(1)}s</span>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Pipeline</h3>
            <ol className="space-y-2">
              {steps.length === 0 && (
                <li className="text-sm text-neutral-400">Waiting for input...</li>
              )}
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <StatusDot status={s.status} />
                  <div>
                    <div className="font-medium">{s.label}</div>
                    {s.detail && <div className="text-xs text-neutral-500">{s.detail}</div>}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
        </section>

        <section className="lg:col-span-7 space-y-6">
          {request && <ShipmentCard request={request} />}
          {ranked && ranked.length > 0 && (
            <RankedOptionsCard ranked={ranked} recommendation={recommendation} />
          )}
          {draftEmail && <DraftEmailCard email={draftEmail} />}
          {!request && !isRunning && !error && (
            <div className="h-64 flex items-center justify-center text-neutral-400 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg">
              Output will appear here.
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-6 text-xs text-neutral-500">
        Demo data only. Rates and capacity are simulated based on public market patterns.
      </footer>
    </div>
  );
}

function StatusDot({ status }: { status: StepUI["status"] }) {
  const cls =
    status === "done"
      ? "bg-emerald-500"
      : status === "active"
      ? "bg-amber-500 animate-pulse"
      : status === "error"
      ? "bg-red-500"
      : "bg-neutral-300 dark:bg-neutral-700";
  return <span className={`mt-1.5 inline-block w-2 h-2 rounded-full ${cls}`} />;
}

function ShipmentCard({ request }: { request: ShipmentRequest }) {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <h3 className="text-sm font-semibold mb-3">Extracted shipment</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <Field k="Route" v={`${request.origin_iata} -> ${request.destination_iata}`} />
        <Field k="Pieces" v={String(request.pieces)} />
        <Field k="Gross weight" v={`${request.gross_weight_kg} kg`} />
        <Field k="Chargeable" v={`${request.chargeable_weight_kg.toFixed(1)} kg`} />
        <Field k="Commodity" v={request.commodity_type} />
        <Field k="Service" v={request.service_level} />
        <Field k="Ready" v={request.ready_date} />
        <Field k="Required by" v={request.required_delivery_date ?? "not specified"} />
        <Field
          k="Special handling"
          v={request.special_handling.length ? request.special_handling.join(", ") : "none"}
        />
      </dl>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-neutral-500">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

function RankedOptionsCard({ ranked, recommendation }: { ranked: RankedOption[]; recommendation: string }) {
  const top = ranked.slice(0, 3);
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Top options</h3>
        <span className="text-xs text-neutral-500">{ranked.length} total</span>
      </div>
      {recommendation && (
        <p className="text-sm text-neutral-700 dark:text-neutral-300 italic mb-4 p-3 rounded bg-neutral-50 dark:bg-neutral-800 border-l-2 border-emerald-500">
          {recommendation}
        </p>
      )}
      <ul className="space-y-3">
        {top.map((opt, i) => (
          <li
            key={`${opt.airline_iata}-${i}`}
            className={`p-3 rounded-md border ${
              i === 0
                ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950"
                : "border-neutral-200 dark:border-neutral-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {i + 1}. {opt.airline_name}
                </span>
                <span className="text-xs text-neutral-500">({opt.airline_iata})</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">${opt.price_breakdown.total_usd.toFixed(2)}</div>
                <div className="text-xs text-neutral-500">score {opt.composite_score}</div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-neutral-600 dark:text-neutral-400">
              <div>Transit: {opt.transit_days}d</div>
              <div>Reliability: {opt.reliability_score}</div>
              <div>Capacity: {opt.capacity_status}</div>
              <div>Routing: {opt.flight_path.join(" -> ")}</div>
            </div>
            {opt.rationale && (
              <p className="mt-2 text-xs text-neutral-700 dark:text-neutral-300">{opt.rationale}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DraftEmailCard({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Draft response email</h3>
        <button
          onClick={() => {
            navigator.clipboard.writeText(email);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-xs px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="text-sm whitespace-pre-wrap font-mono text-neutral-700 dark:text-neutral-300">
        {email}
      </pre>
    </div>
  );
}
