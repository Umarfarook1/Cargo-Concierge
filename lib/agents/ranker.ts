import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { modelChain } from "../llm";
import type { RankedOption, RateOption, ShipmentRequest } from "../schemas";

const RankerWeights = {
  general: { price: 0.55, transit: 0.15, reliability: 0.2, capacity: 0.1 },
  economy: { price: 0.7, transit: 0.05, reliability: 0.15, capacity: 0.1 },
  priority: { price: 0.3, transit: 0.4, reliability: 0.2, capacity: 0.1 },
  express: { price: 0.15, transit: 0.55, reliability: 0.2, capacity: 0.1 },
};

function minMax(values: number[], invert: boolean): (v: number) => number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return () => 50;
  return (v: number) => {
    const norm = (v - min) / (max - min);
    return Math.round((invert ? 1 - norm : norm) * 100);
  };
}

const RationaleOutput = z.object({
  rationale: z.string().describe("One concise sentence explaining why this option ranks where it does for THIS shipment."),
});

const RATIONALE_AGENT = new Agent({
  id: "rationale",
  name: "Rationale Writer",
  description: "Writes one-sentence rationales for ranked freight options.",
  instructions: `Write a single concise sentence (max 25 words) explaining why an air cargo option is good or bad for this shipment. Name the specific tradeoff in plain words: price, transit, reliability, or capacity.

Hard rules:
- No marketing language.
- Banned words: boasts, leverages, robust, seamless, empowers, streamlines, optimal, cutting-edge, comprehensive, delve, harnesses.
- Do not start with "This option" or "Here we have". Lead with the airline or the tradeoff.
- Plain professional English. Address a freight forwarder, not a customer.`,
  model: modelChain(),
});

export function scoreOptions(req: ShipmentRequest, options: RateOption[]): RankedOption[] {
  if (options.length === 0) return [];

  const weights = RankerWeights[req.service_level];
  const priceScore = minMax(options.map((o) => o.price_breakdown.total_usd), true);
  const transitScore = minMax(options.map((o) => o.transit_days), true);
  const reliabilityScore = minMax(options.map((o) => o.reliability_score), false);
  const capacityScore = (o: RateOption) =>
    o.capacity_status === "confirmed" ? 100 : o.capacity_status === "tentative" ? 60 : 25;

  const scored: RankedOption[] = options.map((o) => {
    const breakdown = {
      price_score: priceScore(o.price_breakdown.total_usd),
      transit_score: transitScore(o.transit_days),
      reliability_score: reliabilityScore(o.reliability_score),
      capacity_score: capacityScore(o),
    };
    const composite =
      breakdown.price_score * weights.price +
      breakdown.transit_score * weights.transit +
      breakdown.reliability_score * weights.reliability +
      breakdown.capacity_score * weights.capacity;
    return {
      ...o,
      composite_score: Math.round(composite),
      score_breakdown: breakdown,
      rationale: "",
    };
  });

  scored.sort((a, b) => b.composite_score - a.composite_score);
  return scored;
}

const recommendationAgent = new Agent({
  id: "recommendation",
  name: "Recommendation Writer",
  description: "Writes one-paragraph recommendations for the top air cargo option.",
  instructions: `Write a concise recommendation paragraph (60 to 90 words) for a freight forwarder. Pick option 1 and explain why versus the runners-up. Name the specific numeric tradeoff (price gap, transit gap, reliability gap).

Hard rules:
- No marketing language.
- Banned words: boasts, leverages, robust, seamless, empowers, streamlines, optimal, cutting-edge, comprehensive, delve, harnesses, top-tier, best-in-class, world-class.
- Do not start with "In conclusion", "Overall", "This option". Lead with the airline name.
- Plain professional English. Write to a freight forwarder, not a customer.`,
  model: modelChain(),
});

export async function generateRationales(
  req: ShipmentRequest,
  scored: RankedOption[],
): Promise<string[]> {
  const targets = scored.slice(0, Math.min(scored.length, 3));
  return Promise.all(
    targets.map(async (opt, idx) => {
      const result = await RATIONALE_AGENT.generate(
        [
          {
            role: "user",
            content: `Shipment: ${req.chargeable_weight_kg}kg ${req.commodity_type} from ${req.origin_iata} to ${req.destination_iata}, service level ${req.service_level}.\n\nOption: ${opt.airline_name} (${opt.airline_iata}), $${opt.price_breakdown.total_usd}, ${opt.transit_days} days transit, reliability ${opt.reliability_score}, capacity ${opt.capacity_status}. Rank: ${idx + 1} of ${targets.length}. Composite score: ${opt.composite_score}.\n\nScore breakdown: price ${opt.score_breakdown.price_score}, transit ${opt.score_breakdown.transit_score}, reliability ${opt.score_breakdown.reliability_score}, capacity ${opt.score_breakdown.capacity_score}.`,
          },
        ],
        { structuredOutput: { schema: RationaleOutput } },
      );
      return (result.object as z.infer<typeof RationaleOutput>).rationale;
    }),
  );
}

export async function generateRecommendation(
  req: ShipmentRequest,
  scored: RankedOption[],
): Promise<string> {
  if (scored.length === 0) return "No matching options found.";
  const top = scored[0];
  const summary = scored
    .slice(0, Math.min(3, scored.length))
    .map(
      (o, i) =>
        `${i + 1}. ${o.airline_name} $${o.price_breakdown.total_usd} ${o.transit_days}d reliability ${o.reliability_score}`,
    )
    .join("\n");
  const recResult = await recommendationAgent.generate(
    [
      {
        role: "user",
        content: `Shipment: ${req.chargeable_weight_kg}kg ${req.commodity_type} from ${req.origin_iata} to ${req.destination_iata}, service level ${req.service_level}.\n\nTop options:\n${summary}\n\nRecommendation should pick option 1 (${top.airline_name}) and explain the comparison.`,
      },
    ],
    { structuredOutput: { schema: z.object({ recommendation: z.string() }) } },
  );
  return (recResult.object as { recommendation: string }).recommendation;
}

export async function rankOptions(
  req: ShipmentRequest,
  options: RateOption[],
): Promise<{ ranked: RankedOption[]; recommendation_index: number; recommendation_reasoning: string }> {
  const scored = scoreOptions(req, options);
  if (scored.length === 0) {
    return { ranked: [], recommendation_index: -1, recommendation_reasoning: "No matching options found." };
  }
  const [rationales, recommendation] = await Promise.all([
    generateRationales(req, scored),
    generateRecommendation(req, scored),
  ]);
  rationales.forEach((r, i) => {
    scored[i].rationale = r;
  });
  return { ranked: scored, recommendation_index: 0, recommendation_reasoning: recommendation };
}
