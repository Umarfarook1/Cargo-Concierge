import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import type { MastraModelConfig } from "@mastra/core/llm";

const PRIMARY = process.env.PRIMARY_MODEL || "google:gemini-2.5-flash";
const FALLBACK = process.env.FALLBACK_MODEL || "google:gemini-2.5-flash";
const SECONDARY_FALLBACK = process.env.SECONDARY_FALLBACK_MODEL || "google:gemini-2.5-flash";

function build(spec: string): MastraModelConfig {
  const [provider, model] = spec.split(":");
  switch (provider) {
    case "anthropic":
      return anthropic(model) as MastraModelConfig;
    case "openai":
      return openai(model) as MastraModelConfig;
    case "google":
      return google(model) as MastraModelConfig;
    default:
      throw new Error(`Unknown model provider: ${provider}`);
  }
}

export type ModelEntry = { id: string; model: MastraModelConfig; maxRetries: number };

export function modelChain(): ModelEntry[] {
  return [
    { id: PRIMARY, model: build(PRIMARY), maxRetries: 2 },
    { id: FALLBACK, model: build(FALLBACK), maxRetries: 2 },
    { id: SECONDARY_FALLBACK, model: build(SECONDARY_FALLBACK), maxRetries: 1 },
  ];
}

export function singleModel(spec?: string): MastraModelConfig {
  return build(spec ?? PRIMARY);
}

export const modelMeta = {
  primary: PRIMARY,
  fallback: FALLBACK,
  secondaryFallback: SECONDARY_FALLBACK,
};
