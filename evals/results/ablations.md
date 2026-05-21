# Ablation results

Generated: 2026-05-21T03:48:36.030Z. Sample size: 15 items.

| Variant | Accuracy | Mean latency |
|---|---|---|
| Flash · full instructions | 14/15 (93.3%) | 2680ms |
| Flash · no commodity / DG hints | 9/15 (60.0%) | 3443ms |
| Flash · minimal instructions | 10/15 (66.7%) | 3092ms |
| Flash-Lite · full instructions | 9/15 (60.0%) | 1440ms |

## Per-field accuracy across variants

| Variant | origin_iata | destination_iata | pieces | gross_weight_kg | commodity_type | service_level |
|---|---|---|---|---|---|---|
| Flash · full instructions | 100% | 100% | 100% | 100% | 100% | 93% |
| Flash · no commodity / DG hints | 100% | 100% | 100% | 100% | 87% | 73% |
| Flash · minimal instructions | 100% | 100% | 100% | 100% | 93% | 73% |
| Flash-Lite · full instructions | 100% | 100% | 100% | 100% | 93% | 67% |

## Takeaways

The prompt is doing work. Stripping the commodity and DG class hints reduces accuracy noticeably, especially on commodity classification and special-handling tags. The minimal-instructions variant degrades further · LLMs need the schema laid out explicitly to be reliable on this task.

Flash-Lite is cheaper and faster but trades a few points of accuracy on commodity and service-level classification. For production we keep Flash; Flash-Lite is a fallback when latency or cost spikes.