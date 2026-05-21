import { extractShipment } from "./extraction";
import { queryRates } from "./rate-query";
import {
  rankOptions,
  scoreOptions,
  generateRationales,
  generateRecommendation,
} from "./ranker";
import { draftQuoteEmail } from "./drafter";
import type { AgentStep, QuoteResponse, RankedOption } from "../schemas";

export type RunOptions = {
  skipRanker?: boolean;
  skipDrafter?: boolean;
};

export async function* runQuotePipeline(
  raw_input: string,
  opts: RunOptions = {},
): AsyncGenerator<AgentStep, QuoteResponse | null, void> {
  try {
    yield { type: "extraction_start" };
    const { request } = await extractShipment(raw_input);
    yield { type: "extraction_done", request };

    yield { type: "rate_query_start" };
    const { options, candidate_count } = await queryRates(request);
    yield { type: "rate_query_done", options, candidate_count };

    if (options.length === 0) {
      yield {
        type: "error",
        message: `No matching options found for ${request.origin_iata} to ${request.destination_iata}.`,
      };
      return null;
    }

    yield { type: "ranker_start" };
    const scored = scoreOptions(request, options);
    yield { type: "drafter_start" };

    let ranked: RankedOption[];
    let recommendation_reasoning: string;
    let draft_email: string;

    if (opts.skipRanker) {
      ranked = scored.map((o) => ({ ...o, rationale: "" }));
      recommendation_reasoning = "Ranker disabled in ablation mode.";
      draft_email = opts.skipDrafter ? "" : await draftQuoteEmail(request, ranked);
    } else {
      const [rationales, recommendation, draftEmail] = await Promise.all([
        generateRationales(request, scored),
        generateRecommendation(request, scored),
        opts.skipDrafter ? Promise.resolve("") : draftQuoteEmail(request, scored),
      ]);
      rationales.forEach((r, i) => {
        scored[i].rationale = r;
      });
      ranked = scored;
      recommendation_reasoning = recommendation;
      draft_email = draftEmail;
    }

    yield { type: "ranker_done", ranked };
    if (!opts.skipDrafter) {
      yield { type: "drafter_done", email: draft_email };
    }

    const response: QuoteResponse = {
      request,
      options: ranked,
      recommendation_index: 0,
      recommendation_reasoning,
      draft_email,
    };

    yield { type: "final", response };
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    yield { type: "error", message };
    return null;
  }
}

export { extractShipment, queryRates, rankOptions, draftQuoteEmail };
