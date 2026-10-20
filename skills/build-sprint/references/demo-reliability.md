# Demo reliability: the layer that cannot die

"Cannot die" means three things. With the network off and no keys, the golden path still runs end to end. Every screen says which mode produced what it shows. Nothing on screen lies: no stale bundle, no number hidden behind an animation that never ran, no fake progress. Build this layer before the wow features, because the wow features are worthless if the demo stalls.

## 1. One flag, one fallback per call

- `DEMO=1` is the default the launcher sets (`run-demo.sh` / `run-demo.bat`); `--live` turns it off. One module reads it; nothing else checks the environment.
- Every external call (model, speech, database, sponsor API) has a fallback behind the flag: a fixture, a template, a cached prior run. Canned answers carry `mocked: true` and say why.
- A placeholder key is not a key. Reject `your-key-here` and friends before trying the provider, so the fallback is chosen up front instead of after a timeout.

```ts
// lib/mode.ts: the only place that decides how a run happens
export const DEMO = process.env.DEMO !== "0";
const usable = (k?: string) => !!k && k.length > 20 && !/^(your|change|todo|xxx|sk-\.\.\.)/i.test(k);
export const modelKey = () => usable(process.env.ANTHROPIC_API_KEY);

export type RunMode = "live" | "scripted" | "recorded";
export function chooseMode(s: { depsUp: boolean; quotaLeft: boolean }): { mode: RunMode; note: string } {
  if (!s.depsUp) return { mode: "recorded", note: "The database is unreachable, so this is a recorded run of the same scenario." };
  if (DEMO || !modelKey()) return { mode: "scripted", note: "No model in this run: the standard procedure on the same tools, with templated words." };
  if (!s.quotaLeft) return { mode: "scripted", note: "The free model runs are used up for now, so the standard procedure runs on the same tools." };
  return { mode: "live", note: "A live model chooses the tools." };
}
```

## 2. Three labelled modes

| Mode | Runs when | What runs | Chip |
|---|---|---|---|
| LIVE | key present, quota left, dependencies up | the model chooses tools on the real data | `LIVE · <model id>` |
| SCRIPTED | `DEMO=1`, no key, or quota spent | the controller's standard procedure on the same tools, templated words | `SCRIPTED · NO MODEL` |
| RECORDED | a dependency (database, sponsor API) is down | a real live run captured earlier, replayed with its original pacing | `RECORDED RUN · <date>` |

- The first event of every run is `{ type: "run", mode, note }`, and the note is a full sentence with the real cause. The UI renders it as a chip in a colour that is not the brand accent.
- Recordings are real live runs only, captured with `RECORD_REPLAYS=1` as NDJSON. Never hand-edit one. When an input has no recording, say so with the cause instead of inventing a run.
- End-to-end tests pass in every mode (skip with a stated reason where a mode cannot apply), and send a header such as `x-<app>-no-model: 1` so tests never spend visitors' quota.

```ts
export function recorder(id: string, emit: Emit) {
  if (process.env.RECORD_REPLAYS !== "1") return { emit, save: async () => {} };
  const t0 = Date.now(); const lines: string[] = [];
  return {
    emit: (event: AgentEvent) => { lines.push(JSON.stringify({ t: Date.now() - t0, event })); emit(event); },
    save: () => writeFile(`data/replays/${id}.ndjson`, lines.join("\n") + "\n"),
  };
}
export async function replay(id: string, emit: Emit, signal?: AbortSignal) {
  const rows = (await readFile(`data/replays/${id}.ndjson`, "utf8")).split("\n").filter(Boolean).map((l) => JSON.parse(l));
  let last = 0;
  for (const { t, event } of rows) {
    if (signal?.aborted) return;
    await sleep(Math.min(1200, Math.max(0, t - last))); // original pacing, gaps capped at 1.2 s
    last = t;
    emit(event);
  }
}
```

> Field note (Detour · Graph Hacks 2026): live, scripted and recorded runs were each named in the stream's first event and shown as amber chips ("SCRIPTED · NO MODEL"); a six-model free chain plus the scripted procedure kept the control room answering through spent quotas and a database outage.

## 3. Replay on the same event contract

One generator, two backends, identical event shapes. The UI renders events and never asks which backend ran.

```ts
export async function* runPipeline(input: string, fast = false): AsyncGenerator<PipelineEvent> {
  if (liveModeAvailable()) yield* runLive(input);
  else yield* runReplay(fast); // the bundled sample, 220 to 600 ms per item, 10 ms with &fast=1
}
```

Stream it over server-sent events or NDJSON with a small typed vocabulary (`status | evidence | delta | done | error`, or `stage-start | log | artifact | stage-done | done | error`). The replay's first log line states the mode: "deterministic replay, no key set".

## 4. Say which path answered

When a heuristic parser, a template or a cached run answers, a chip names it: "Local analysis" versus "Written by <model>", "Heuristic parser" versus "<model> parser", "cached · prior live run". A health pill in the header shows the same thing for the whole app. Never a vague "AI" label.

## 5. Provider failover with a start budget

Fail over on the first call, before any token reaches the client, so a failed-over turn looks like a normal reply from the backup. Give the primary a hard budget to start; a congested provider can stall long enough to eat the route's whole time limit. Pair failover with `maxRetries: 1`, because retry cycles against a congested primary burn the budget.

```ts
// AI SDK 7: wrap the primary so throttling, outages and bad keys retry once on the backup.
import { wrapLanguageModel, APICallError, LoadAPIKeyError } from "ai";
type ProviderModel = ReturnType<typeof google>; // what each @ai-sdk provider factory returns
const START_BUDGET_MS = 12_000;
const startWithin = <T,>(p: PromiseLike<T>, ms: number) =>
  Promise.race([p, new Promise<T>((_, no) => setTimeout(() => no(new Error(`primary timed out after ${ms}ms`)), ms))]);
const unavailable = (e: unknown) =>
  LoadAPIKeyError.isInstance(e) ||
  (APICallError.isInstance(e) && (e.isRetryable || [401, 403, 429].includes(e.statusCode ?? 0) || (e.statusCode ?? 0) >= 500)) ||
  /rate limit|quota|overload|unavailable|timed out/i.test(String(e));
export const withFailover = (primary: ProviderModel, backup: ProviderModel) =>
  wrapLanguageModel({
    model: primary,
    middleware: {
      wrapStream: async ({ doStream, params }) => {
        try { return await startWithin(doStream(), START_BUDGET_MS); }
        catch (e) { if (!unavailable(e)) throw e; return backup.doStream(params); }
      },
      wrapGenerate: async ({ doGenerate, params }) => {
        try { return await startWithin(doGenerate(), START_BUDGET_MS); }
        catch (e) { if (!unavailable(e)) throw e; return backup.doGenerate(params); }
      },
    },
  });
```

Free-tier chains go further: classify each failure and bench the model for as long as that failure lasts. A spent daily quota benches it until the provider's reset, a retired model for a day, a per-minute limit for a minute; anything else is a real error and surfaces. Keep the chain in an env var (`AGENT_MODELS="provider:model,provider:model"`) so a retirement mid-event is a config change.

Errors the user sees are in character and say what to do: "We have briefly hit our demo usage limit. Give it a minute and send that again; your conversation is saved." A quota hit then reads as expected, not broken.

> Field note (SunPath · FlowZint AI Hackathon 2026): the 12-second start budget exists because a congested free-tier model was observed stalling long enough to consume the route's whole 60-second window while the backup provider was healthy.

## 6. Caches that warm themselves

- Warm the hero scenarios on boot in a background thread, so the first open is a cache hit rather than a ten-second model call.
- When one upstream call returns a whole series, cache the series. Fetching per hour or per item multiplies latency and gets you rate-limited at the worst moment.
- Cache failures briefly too (about 60 s), so a dead feed is not retried on every click.

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    threading.Thread(target=lambda: [engine.run(s, demo=True) for s in REHEARSED], daemon=True).start()
    yield
app = FastAPI(lifespan=lifespan)
```

> Field note (ORCA · SIH 2026): fetching the forecast hour by hour meant 48 requests, about 32 s and IP throttling; caching the whole series brought it to 0.02 s, and the handoff file says "Never add per-hour fetching back."

## 7. The health endpoint

`/api/health` answers in milliseconds, is never cached, never returns a 500, and tells a judge or an agent what state the demo is in.

```ts
// app/api/health/route.ts
export const dynamic = "force-dynamic";
export async function GET() {
  const counts = await countRows().catch(() => ({}));   // { products: 120, sales: 9184 } or {} when the store is down
  return Response.json(
    { ok: true, mode: DEMO ? "demo" : "live", model: modelKey() ? MODEL_ID : null, build: process.env.NEXT_PUBLIC_BUILD ?? "dev", counts },
    { headers: { "Cache-Control": "no-store" } },
  );
}
```

```python
@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "mode": "demo" if DEMO else "live", "build": BUILD,
            "store": store.kind(), "counts": store.safe_counts(), "llm": llm.provider}  # provider None when no key
```

## 8. Reset and deep links

- `POST /api/reset` restores the seed (same seed, same stories) and returns the counts. The UI has a visible **Reset demo** control. Every recording session starts with it.
- Deep links land each beat in the right state, so a judge can be handed a URL instead of instructions:

| Parameter | Effect |
|---|---|
| `?demo=<scenario>` | load a rehearsed scenario |
| `?autorun=1` | start the run on load |
| `&fast=1` | rehearsal pacing for replays |
| `?step=<n>` | jump playback to a step |
| `?lang=<code>` | open in a language |
| `?noanim` | final states, no motion (capture, projector fallback) |
| `?m=1` | force the phone layout |

Read parameters on the client so the pages can still prerender. The launcher prints one URL per golden-path beat, and the README lists the same URLs.

## 9. A build stamp

Show which build is running, so a phone on a stale cache is obvious and a deploy that did not land is caught.

```ts
// next.config.ts
const sha = (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7) || "local";
const at = new Date().toISOString().slice(0, 16).replace("T", " ");
export default { env: { NEXT_PUBLIC_BUILD: `b·${sha} ${at}Z` } };
```

Render `process.env.NEXT_PUBLIC_BUILD` in the footer and return it from `/api/health`. With Vite, inject the same string through `define`. Then `demo-check.mjs <url> --stamp <sha>` proves the deployed page is the build you think it is.

## 10. Long-lived processes

Bots, socket clients and schedulers need four primitives and one habit.

```js
export async function withRetry(fn, { retries = 2, baseMs = 400, label = "operation" } = {}) {
  for (let attempt = 0; ; attempt++) {
    try { return await fn(); }
    catch (e) {
      if (attempt >= retries) throw new Error(`${label} failed after ${attempt + 1} attempts: ${e?.message ?? e}`);
      await new Promise((r) => setTimeout(r, baseMs * 2 ** attempt + Math.floor(Math.random() * 100)));
    }
  }
}
export const withTimeout = (p, ms, label = "operation") => {
  let timer;
  return Promise.race([p, new Promise((_, no) => { timer = setTimeout(() => no(new Error(`${label} timed out after ${ms / 1000}s`)), ms); })])
    .finally(() => clearTimeout(timer));
};
const seen = new Map(); // key -> expiry; platforms redeliver events and two people trigger the same thing
export function shouldProcess(key, ttlSeconds = 600) {
  const now = Date.now();
  if ((seen.get(key) ?? 0) > now) return false;
  seen.set(key, now + ttlSeconds * 1000);
  return true;
}
export function ensureSingleInstance(lockFile = "data/app.lock") {
  try {
    const old = Number(fs.readFileSync(lockFile, "utf8"));
    if (old && old !== process.pid) { process.kill(old, 0); process.kill(old); } // only a PID this app wrote
  } catch { /* no lock yet, or the old process is already gone */ }
  fs.mkdirSync(path.dirname(lockFile), { recursive: true });
  fs.writeFileSync(lockFile, String(process.pid));
}
```

The habit: a scheduler marks a job as run before running it, so a persistent failure cannot tight-loop. At boot, check every token and dependency, and show a dead one in the app's own home view with the fix, so it is not a mystery mid-demo. Tee logs to a file so a coding agent can tail them.

> Field note (Bridge · Slack Agent Builder Challenge): hot reload on Windows orphaned old bot processes, each holding its own socket and answering every event, so users got duplicate replies; the PID lock that kills only the predecessor it recorded ended it.

## 11. Free hosts

- Databases on free tiers sleep. Add a daily cron that pings, re-seeds when empty and cleans sandboxes, authenticated with `CRON_SECRET`:

```json
{ "framework": "nextjs", "crons": [{ "path": "/api/cron", "schedule": "17 9 * * *" }] }
```

- Free Python hosts cold-start. Open the URL two minutes before judging, or keep it warm.
- Per-visitor sandboxes need eviction (least recently used) below the free tier's storage cap.
- Set the visitor cookie in middleware on the very first request. Parallel first requests otherwise mint different ids and an action lands in another visitor's sandbox.
- In-memory state on serverless resets between instances. Say so in the README and keep Reset demo one click away.

## 12. Static serving headers

A browser tab holding yesterday's entry HTML keeps loading yesterday's bundle. Serve the entry document uncached and the hashed assets forever.

```python
for mime, ext in (("text/javascript", ".js"), ("text/javascript", ".mjs"), ("text/css", ".css"),
                  ("image/svg+xml", ".svg"), ("image/webp", ".webp"), ("font/woff2", ".woff2")):
    mimetypes.add_type(mime, ext)            # Windows can report .js as text/plain from the registry

class HashedAssets(StaticFiles):
    async def get_response(self, path, scope):
        r = await super().get_response(path, scope)
        if r.status_code in (200, 206, 304):
            r.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return r

app.mount("/assets", HashedAssets(directory=DIST / "assets"), name="assets")
NO_STORE = {"Cache-Control": "no-store, must-revalidate"}

@app.get("/{full_path:path}")
def spa(full_path: str) -> FileResponse:
    candidate = (DIST / full_path).resolve()           # resolve first: "..%2F" arrives decoded
    if candidate.is_file() and candidate.is_relative_to(DIST.resolve()) and candidate.name != "index.html":
        return FileResponse(candidate)
    return FileResponse(DIST / "index.html", headers=NO_STORE)
```

Hosted frameworks (Next.js on Vercel) get this right by default; verify with `demo-check.mjs` rather than assume.

> Field note (ORCA · SIH 2026 and Vibeathon 2026): a feature "missing" on stage was a stale tab running yesterday's bundle, and a later code review found that the SPA fallback could be walked up to the server's own source with an encoded `../`; both fixes are in the sketch above.

## 13. Map tiles, timers, visibility and motion

- Use keyless map tiles, such as OpenStreetMap's standard tiles with the "© OpenStreetMap contributors" attribution, within the tile server's usage policy (light, attributed use, no bulk download). A keyed provider can start stamping "API KEY REQUIRED" across the map in the middle of a rehearsal.
- `requestAnimationFrame` does not run in hidden or non-compositing tabs. Every animated number gets a `setTimeout` fail-safe to its final value, and the markup carries the final value before any animation.

```ts
export function countUp(el: HTMLElement, to: number, ms = 900) {
  const done = () => { el.textContent = to.toLocaleString(); };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
  const failSafe = setTimeout(done, ms + 250);               // the number is information; the motion is decoration
  const t0 = performance.now();
  const tick = (now: number) => {
    const p = Math.min(1, (now - t0) / ms);
    el.textContent = Math.round(to * p).toLocaleString();
    if (p < 1) requestAnimationFrame(tick); else { clearTimeout(failSafe); done(); }
  };
  requestAnimationFrame(tick);
}
```

- Nothing a judge must read starts at opacity 0. Entrances animate transform only; `animation-fill-mode: both` on rows has left them invisible. Reduced motion and `?noanim` show the finished state.
- A panel waiting on a disabled feature renders an explicit "not available in this mode" state, never a perpetual loader.
- Hidden preview tabs throttle timers, so verify playback by setting a slider's value and dispatching `input`, not by waiting.

## 14. HTTPS for microphone and voice

`getUserMedia` and the Web Speech API need a secure context. Vercel and similar hosts give HTTPS for free. On a bare VM, Caddy with an sslip.io hostname gets a certificate for a raw IP:

```text
# /etc/caddy/Caddyfile  (203-0-113-7.sslip.io resolves to 203.0.113.7)
203-0-113-7.sslip.io {
    reverse_proxy 127.0.0.1:9000
}
```

Always render the voice button. On an insecure origin, explain how to reach the HTTPS URL instead of hiding the feature.

## 15. Precompute when the model can run offline

When the model is trainable or runnable ahead of time, run it in a build script and bake the outputs (scores, curves, reason codes, memos) into JSON that a static UI reads. Nothing then has to answer live, and the site can sit on any static host. Keep the generator in the repo, stamp the JSON with its build time, and let a flag (`--live-memos`) bake model-written prose in when a key is present.

> Field note (NAADI · IDBI Innovate 2026): the build script generated a 5,000-business synthetic population, trained the scorer, scored eight named cases and baked about 100 KB of JSON for a fully static console, so the live site had no backend that could fail.

## 16. The smoke test

Replay the rehearsed scenarios headlessly through the same function the API calls, and assert the numbers `PRODUCT.md` promises. Run it after every change that touches the engine, and in CI.

```python
"""python smoke_test.py: the numbers the demo depends on, asserted."""
import sys
from app.engine import run

REHEARSED = [("hero", "HIGH", 70), ("calm", "LOW", 9), ("quiet", "NONE", 0)]  # copy from PRODUCT.md
failures = []
for scenario, want_level, want_score in REHEARSED:
    r = run(scenario, demo=True)
    print(f"{scenario:<8} {r.score:>3} {r.level:<6} {r.elapsed_ms:>5} ms  mode={r.mode}")
    if (r.level, r.score) != (want_level, want_score):
        failures.append(f"{scenario}: expected {want_level} {want_score}, got {r.level} {r.score}")
print("\n".join(failures) if failures else "ALL DEMO CHECKS PASSED")
sys.exit(1 if failures else 0)
```

## 17. Checklist

- [ ] `DEMO=1` is the launcher default; every external call has a fallback; canned answers say `mocked: true`.
- [ ] LIVE, SCRIPTED and RECORDED modes exist where they apply, and each run's first event names its mode and cause.
- [ ] Replay uses the live event contract; recordings are real runs with their dates.
- [ ] Fallback answers carry a chip that names the path.
- [ ] Failover with a start budget and one retry; errors are in character and say what to do.
- [ ] Hero caches warm on boot; whole series are cached.
- [ ] `/api/health` returns mode, model, build and counts, uncached, never a 500.
- [ ] Reset demo works; every golden-path beat has a deep link.
- [ ] The build stamp shows in the footer and in `/api/health`.
- [ ] Long-lived processes have the lock, dedupe, retry, timeout and boot health check.
- [ ] Free databases have a keep-alive cron; cold hosts are opened early.
- [ ] Entry HTML is `no-store`; hashed assets are immutable with correct MIME types; the SPA fallback is contained.
- [ ] Map tiles need no key.
- [ ] Every animated number has a fail-safe; nothing must-read starts invisible; reduced motion shows the final state.
- [ ] Voice features run on HTTPS and explain themselves on HTTP.
- [ ] The smoke test asserts every rehearsed number and passes.
- [ ] `node demo-check.mjs <preview-url> --link <each beat>` passes, logged out.
