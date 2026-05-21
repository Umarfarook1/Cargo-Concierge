import { extractShipment } from "./extraction";
import { queryRates } from "./rate-query";
import { rankOptions } from "./ranker";
import { draftQuoteEmail } from "./drafter";
import type { AgentStep, QuoteResponse } from "../schemas";

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
    const { ranked, recommendation_index, recommendation_reasoning } = opts.skipRanker
      ? {
          ranked: options.map((o) => ({
            ...o,
            composite_score: 0,
            score_breakdown: {
              price_score: 0,
              transit_score: 0,
              reliability_score: 0,
              capacity_score: 0,
            },
            rationale: "",
          })),
          recommendation_index: 0,
          recommendation_reasoning: "Ranker disabled in ablation mode.",
        }
      : await rankOptions(request, options);
    yield { type: "ranker_done", ranked };

    let draft_email = "";
    if (!opts.skipDrafter) {
      yield { type: "drafter_start" };
      draft_email = await draftQuoteEmail(request, ranked);
      yield { type: "drafter_done", email: draft_email };
    }

    const response: QuoteResponse = {
      request,
      options: ranked,
      recommendation_index,
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
