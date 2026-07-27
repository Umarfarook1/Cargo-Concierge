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

The prompt is doing work. The variant labelled `no commodity / DG hints` above drops four rules at once (commodity definitions, service level, special handling, "do not invent"), so the run shows the size of the loss on commodity and service-level classification but not which rule causes it. `evals/ablations.ts` now names that variant `no rules block`. The minimal-instructions variant degrades further.

The six fields above are everything this harness grades. special_handling is not compared here; evals/run.ts grades it on the full 30-item set.

Flash-Lite is faster and trades points of accuracy on commodity and service-level classification. For production we keep Flash; Flash-Lite is a fallback when latency spikes.

The numbers and the timestamp in this file are the 2026-05-21 run untouched. Only the takeaway prose was corrected, on 2026-07-27, because it claimed a special-handling effect this harness does not measure.