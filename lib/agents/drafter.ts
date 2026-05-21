import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import { modelChain } from "../llm";
import type { RankedOption, ShipmentRequest } from "../schemas";

const INSTRUCTIONS = `Draft a quote response email a freight forwarder can send to their customer.

Structure:
1. One-line greeting and acknowledgement of the request.
2. Confirmed shipment details (route, weight, pieces, commodity, ready date).
3. Top three options as a numbered list. For each: airline, total price USD, transit time, ready date, arrival date, capability note if relevant.
4. One-sentence recommendation pointing to option 1 with the reason.
5. Closing line asking for confirmation, signature placeholder.

Hard rules:
- Plain professional English. No emojis.
- Banned words: boasts, leverages, robust, seamless, empowers, streamlines, optimal, cutting-edge, comprehensive, delve, harnesses, excited, thrilled, top-tier, best-in-class, world-class.
- Do not write "Thank you for your recent quote request" or "I hope this email finds you well". Get to the point.
- Prices in USD with two decimals. Weights in kg. Use IATA codes.
- If an option has tentative or request capacity, mark it inline.
- Max 200 words. Forwarders are time-poor.
- Use real newlines, not literal "\\n" sequences. The email body should render with actual line breaks between paragraphs and list items.`;

export const drafterAgent = new Agent({
  id: "drafter",
  name: "Quote Email Drafter",
  description: "Drafts a freight forwarder to customer quote response email.",
  instructions: INSTRUCTIONS,
  model: modelChain(),
});

const DraftOutput = z.object({
  email: z.string().describe("The full email body, plain text, no markdown."),
});

export async function draftQuoteEmail(
  req: ShipmentRequest,
  ranked: RankedOption[],
): Promise<string> {
  const top = ranked.slice(0, 3);
  const summary = top
    .map((o, i) => {
      const cap = o.capacity_status !== "confirmed" ? ` (capacity: ${o.capacity_status})` : "";
      return `${i + 1}. ${o.airline_name} (${o.airline_iata}). Total: $${o.price_breakdown.total_usd.toFixed(2)}. Transit: ${o.transit_days} days. Arrival: ${o.arrival_date}.${cap} Routing: ${o.flight_path.join(" -> ")}.`;
    })
    .join("\n");

  const result = await drafterAgent.generate(
    [
      {
        role: "user",
        content: `Shipment details:
- Route: ${req.origin_iata} to ${req.destination_iata}
- Pieces: ${req.pieces}
- Gross weight: ${req.gross_weight_kg} kg
- Chargeable weight: ${req.chargeable_weight_kg} kg
- Commodity: ${req.commodity_type}
- Service level: ${req.service_level}
- Special handling: ${req.special_handling.length > 0 ? req.special_handling.join(", ") : "none"}
- Ready date: ${req.ready_date}
- Required delivery: ${req.required_delivery_date ?? "not specified"}

Top 3 options:
${summary}

Recommended: option 1.`,
      },
    ],
    { structuredOutput: { schema: DraftOutput } },
  );

  return (result.object as z.infer<typeof DraftOutput>).email;
}
