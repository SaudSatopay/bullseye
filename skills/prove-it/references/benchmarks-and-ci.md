# Benchmarks, offline tests and zero-secret CI

Speed and reliability claims are measured with a stated scope, re-run by CI without a single secret, and checked once against the real services before submitting. Read this for procedure steps 9 and 10.

## Two latencies, two harnesses

A "real-time" claim is a target until a script measures it. Decide which latency the sentence means, then measure exactly that.

| Claim | Harness | Scope line to print |
|:---|:---|:---|
| "scores an account in 2 ms" | in-process timing of the model call | "model latency only: one CPU core, single-row calls, after 100 warm-ups; not the ingest pipeline" |
| "answers in under a second" | `latency-bench.mjs` against the running API | "HTTP round trip from this machine to the API: send to full response body, server and network included" |
| "the verdict is instant; the seconds are the explanation" | both, split by stage | per stage: deterministic engine ms, model narration s |

In-process, the MuleShot pattern: warm up, pin to one core, time each call, report the median and p99, and measure batch throughput separately.

```python
import math, time

def bench(fn, inputs, warmup=100, n=3000):
    """Model latency only. Pin threads first: n_jobs=1, torch.set_num_threads(1) or OMP_NUM_THREADS=1."""
    for i in range(warmup):
        fn(inputs[i % len(inputs)])
    times = []
    for i in range(n):
        x = inputs[i % len(inputs)]
        t0 = time.perf_counter()
        fn(x)
        times.append((time.perf_counter() - t0) * 1000)
    times.sort()
    pct = lambda p: times[max(0, math.ceil(p / 100 * n) - 1)]  # nearest rank
    return {"n": n, "warmup": warmup, "p50Ms": pct(50), "p95Ms": pct(95), "p99Ms": pct(99), "maxMs": times[-1],
            "scope": "model latency only, one CPU core, single-row calls, warm-up discarded"}
```

Over HTTP, this skill's script:

```bash
node scripts/latency-bench.mjs --url http://127.0.0.1:3000/api/check --method POST \
  --body-file bench/check.json --warmup 20 --n 500 --concurrency 4 --json > data/proof/latency.json
```

It discards the warm-up, times send to full body on keep-alive connections, reports p50, p95, p99, max, mean and throughput over successful requests, counts and names every error instead of timing it, records the machine (never the host name), never records the query string or header values, and exits 1 on any error unless `--max-errors` allows it. `--max-p95 <ms>` turns a budget into a failing check.

A percentile rests on the samples above it: the p99 of 200 requests is decided by the 2 slowest. MuleShot timed 3,000 calls before quoting a p99. With a few hundred samples, claim the p95 and state n.

> Field note (MuleShot · BOI × IIT Hyderabad 2026): the latency script "turns the 'real-time' claim from a target into a measured number": about 2 ms per account at the median on one core after 100 warm-ups, and about 26,000 accounts a second in batch, with its scope printed in the docstring: model latency only, not the full ingest pipeline.

## Claiming hardware-dependent numbers

- Claim a bound, not a point: "p95 under 200 ms", checked with `op: "<="` in claims.json against a fresh run on whatever machine the judge has.
- Re-check the invariants that do not depend on hardware every time: 0 errors, isolation held, the same answers under load.
- Record where it was measured in facts.json `_meta`: platform, CPU model and count, GPU and VRAM, engine version.

## Concurrency and isolation

For multi-tenant or multi-agent claims, run readers and writers at once against separate tenants, then assert that no tenant saw another's writes. Detour's bench ran 48 readers and 6 writers across 6 tenant graphs for 15 seconds and committed the result to `data/proof/bench.json` with the engine version and the machine: 7,195 reads a second, 0 errors, isolation held. The judge command re-ran it on request and required 0 errors and isolation, while treating throughput as machine-dependent.

## Cross-hardware matrix: measured and projected, apart

BIS Compass's table, per query:

| Hardware | Latency | How we know |
|:---|---:|:---|
| RTX 5060 Ti | 0.45 s | measured |
| GTX 1650, GPU | 1.06 s | measured |
| GTX 1650, CPU only | 3.71 s | measured |
| RTX 2080 | about 0.7 s | projected, not measured |

Label each row. BIS Compass measured two GPUs and a CPU-only run, marked a third GPU as projected, sized its rerank pool down automatically by VRAM, and reverted its hero line to the honest cross-hardware claim ("under 1 s") rather than its fastest machine's number.

## Benchmark reports

Each benchmark script writes JSON (and plots) into `docs/benchmarks/`, and a page beside it follows [benchmark-report.template.md](../assets/benchmark-report.template.md): System · Protocol · Results · Interpretation (honest) · Scope · Reproduce. FaceAttend's reports held this shape, including an anti-spoofing page that published a cross-dataset weakness (49.5% of real faces accepted at the reference threshold) and kept the model out of the default app for that reason.

## Offline-first tests

The default test run needs no network, no keys and no credits, and it cannot pass by accident on a developer's cached state.

```python
# tests/conftest.py: every test runs offline, without keys, in a scratch folder.
import pytest

KEYS = ("OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY", "GROQ_API_KEY", "SERPAPI_API_KEY")

@pytest.fixture(autouse=True)
def _isolated_env(monkeypatch, tmp_path):
    monkeypatch.setenv("APP_OFFLINE", "1")
    monkeypatch.setenv("APP_NO_LLM", "1")
    monkeypatch.setenv("APP_CACHE_TTL_HOURS", "0")
    for key in KEYS:
        monkeypatch.delenv(key, raising=False)
    monkeypatch.chdir(tmp_path)
```

```ts
// vitest.setup.ts (setupFiles in vitest.config.ts): offline, no keys, and any network call fails loudly.
import { beforeEach, vi } from 'vitest';

const KEYS = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY', 'GROQ_API_KEY'];
beforeEach(() => {
  vi.stubEnv('APP_OFFLINE', '1');
  for (const key of KEYS) vi.stubEnv(key, '');
  vi.stubGlobal('fetch', async (url: string) => {
    throw new Error(`network call in an offline test: ${url}`);
  });
});
```

Fixtures shaped like the real API responses carry a marker ("Success (bundled fixture)") so no output can pass for live. Tests that need model weights or paid calls are opt-in by environment variable: "a default pytest should never pull 370 MB of weights".

```python
needs_model = pytest.mark.skipif(not os.environ.get("RUN_MODEL_TESTS"), reason="set RUN_MODEL_TESTS=1 to run")
```

## Every output says how it was made

Silent fallbacks are the failure that offline tests cannot see: a model call that times out and quietly falls back to rules, a cache that serves yesterday, a retrieval index the engine skipped. Print and return the provenance on every output, show it in the UI, and assert it in tests: `offline`, `llm_used`, `provider`, `mode` (live, scripted, recorded), `degraded`, and a budget counter ("3 searches · LLM-assisted · 5.4 s"). Detour's mode chips read "SCRIPTED · NO MODEL" or "RECORDED RUN" in the interface; BIS Compass returned `llm_status` (ok, fell back, rate limited, disabled) so the UI could show an honest banner.

## Zero-secret CI that runs the claims

Start from [ci-claims.workflow.yml](../assets/ci-claims.workflow.yml). Its rules:

1. **No secrets.** The workflow defines no key, so it cannot spend credits; evals run on recorded responses or fixtures. Say it in the step name: "Tests (231 passing, offline: no API keys, no credits spent)".
2. **Step names carry the claims**, and each such step exits non-zero when its claim fails. Add the workflow file to a drift rule so a stale count in a step name fails too.
3. **Run tests the way the runner discovers them**: `npm test`, `pytest`, `node --test` with no argument, or a quoted glob (`node --test "tests/*.test.mjs"`). A bare folder argument (`node --test tests/`) failed on Node 22: the folder was read as a file.
4. **`shell: bash`** at the job or workflow level, which adds `-o pipefail`: without it `command | tee log` hides a failing command.
5. **Pin service containers** to the exact engine version the claims were measured on, and print the output shapes the code relies on in a probe step.
6. **Upload the proof** (`ci-out/`, bench JSON, claims-check JSON) as an artifact, with `if: always()`.
7. **Check `gh auth status` for the `workflow` scope on day 1** (`gh auth refresh -s workflow`), then confirm a green run on the remote before any README line says "checked on every push".

> Field note (Trinetra · ET AI Hackathon 2.0): the CI step was named "Compound-risk benchmark (100% recall / 0% FP / 7.4 min lead)", but the benchmark script printed its table and exited 0 whatever the numbers were. A step named after a claim must fail when the claim does.

> Field note (Detour · Graph Hacks 2026): the CI workflow, with a sponsor database container pinned to v4.22.1, never ran: the push token lacked the workflow scope, so the file waited outside `.github/workflows/`, and the build's own notes admitted the proof page's "Run on every change" line was not true.

## One live smoke run before submitting

Fixtures freeze the world on the day you recorded them. Once, with real keys, on the deployed build, run the golden path end to end and print PASS or FAIL per step: the provider's response shape, the fallback chain, the real latency. kasauti's live checks caught what 68 offline tests could not: a search engine's response shape changed, and a model's slow "thinking" mode blew the timeout and fell back to rules silently. Bridge's live integration script drove the real modules against a real workspace, step by step. Use sentinel lines (`ALL_CHECKS_PASSED`, `LIVE_PROVIDER_OK`) so a script's success cannot be misread.

## Fresh clone, second machine

Before submitting, clone the repository on a machine that never ran it, outside synced folders, and follow the README exactly. BIS Compass's cold-clone laptop run found an import-order segfault and a setting that did not persist to child processes; neither showed on the development machine.
