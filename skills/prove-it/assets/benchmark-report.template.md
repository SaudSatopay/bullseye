# {{What was measured}}: {{the result in one line, with its scope}}

<!--
Lives next to the files the benchmark script wrote (docs/benchmarks/{{name}}.json and any plots). Every number on this page is copied from that JSON, and the JSON says when, where and how it was measured. If a number is projected rather than measured, it goes in its own row labelled "projected".
-->

## System

- **What runs:** {{model or service, version, size on disk; "MobileFaceNet (ArcFace), 4.99 MB, TFLite"}}
- **Where:** {{the machine block from the JSON: platform, CPU model and count, RAM, GPU; or the host and region}}
- **Build:** commit `{{sha}}`, {{production build}}, {{settings that change the number: batch size, threads, quantization}}

## Protocol

- **Workload:** {{dataset or request mix, n, how it was chosen: "1,000 LFW pairs, class-balanced, not a head slice"}}
- **Warm-up:** {{n}} runs discarded. **Concurrency:** {{n}}. **Timeout:** {{ms}}.
- **Timing boundary:** from {{when the clock starts}} to {{when it stops}}; {{what is inside: detect + align + embed + match}}.
- **Operating point:** {{threshold, fixed before the run}}. If a best-on-this-data number is shown, it is labelled as such and never used as the headline.

## Results

| Metric | Value | Target | Measured or projected |
|:---|---:|---:|:---|
| {{p50 latency}} | {{13.2 ms}} | {{< 1 s}} | measured |
| {{p95 latency}} | {{}} | | measured |
| {{throughput}} | {{}} | | measured |
| {{accuracy at the operating threshold}} | {{}} | {{> 95%}} | measured |
| {{latency on a low-end phone}} | {{}} | | projected: {{how it was derived}} |

![{{Alt text that states what the plot shows, e.g. "Genuine and impostor score distributions, separated at the 0.45 threshold"}}]({{plot.png}})

## Interpretation (honest)

- {{What the numbers support, in one sentence each.}}
- {{What they do not: a cross-dataset effect, a hardware dependence, a small n, a slice where it fails.}}
- {{What would change the result, and what we would do next.}}

## Scope

{{One paragraph on what the number includes and what it does not. "Model latency only: one CPU core, single-row calls, after 100 warm-ups. Not the full ingest pipeline, not network time, not the UI."}}

## Reproduce

```bash
{{exact commands, from a clean clone, that rewrite the JSON this page cites}}
```
