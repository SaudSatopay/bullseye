# Claims as tests

A claim in the README is a promise about behaviour. A test pins it so it cannot rot silently, and the test's name says the claim out loud. Most of these techniques come from engram's `tests/test_guarantees.py`, whose header put it this way: "These are not unit tests. Every one of them asserts a property of the real database." Read this for procedure step 5.

## 1. The test name is the claim

Name tests so the list reads like the README's promises. A failing test then says which claim broke.

```python
def test_sea_tap_is_honestly_out_of_coverage(): ...
def test_quiet_day_sends_no_street_alerts_and_still_catches_the_blocked_drain(): ...
def test_n_agents_racing_produce_exactly_one_refund(n_agents): ...
```

```ts
test('a tap in the open sea gets no extrapolated percentage', () => { ... });
test('every max-flow answer is certified or recomputed', () => { ... });
```

Group them under the claim they pin: FLOODLIGHT's engine tests open with "the three claims the pitch makes, verified in code", and a class per claim.

## 2. Against the real system when the claim is about the real system

If the claim is a property of the database, the queue, the model file or the deployed API, a mock tests nothing. engram's reason: "The test suite that would pass against a mock is the test suite that lets the double-refund through." Run the real dependency locally (a single-node database, a service container in CI) and keep fakes for the parts the claim is not about. Keep these tests offline otherwise (see [benchmarks-and-ci.md](benchmarks-and-ci.md)).

## 3. Non-vacuity: prove the stress happened

A concurrency test where nothing raced, a dedupe test where nothing duplicated, a fallback test where the primary never failed: each passes and proves nothing. Assert that the condition under test occurred.

```python
@pytest.mark.parametrize("n_agents", [8, 16])
def test_n_agents_racing_produce_exactly_one_refund(eng, dispute, n_agents):
    start, read_sync = threading.Barrier(n_agents), threading.Barrier(n_agents)  # force simultaneous reads
    retries_before = eng.db.retries_observed
    with ThreadPoolExecutor(max_workers=n_agents) as pool:
        results = list(pool.map(lambda i: race_once(eng, dispute, start, read_sync, i), range(n_agents)))
    assert refunds_for(eng, dispute) == 1, "the customer was paid twice"
    assert results.count("refunded") == 1
    assert eng.db.retries_observed > retries_before, (
        "zero serialization conflicts: the agents never actually raced, so this run is not evidence")
```

```ts
test('10, 50 and 100 simultaneous reports leave exactly one open fact', async () => {
  for (const n of [10, 50, 100]) {
    const before = await db.conflictCount();
    await Promise.all(Array.from({ length: n }, () => reportOutage('elevator-17')));
    expect(await openFacts('elevator-17')).toBe(1);
    expect(await db.conflictCount()).toBeGreaterThan(before); // the writes really collided
  }
});
```

The same rule applies to the tools in this skill: `claims-check` refuses a claims file with no claims, and a drift rule can demand `min: 1` hits so a broken pattern cannot pass by matching nothing.

## 4. Assert the mechanism when results cannot show the failure

Some failures return the right rows. An unindexed scan returns the same answers as an index search, only slower; a model that skipped its tools can still guess right. Assert on the plan, the trace or the budget.

```python
def test_ann_query_uses_the_vector_index_at_realistic_volume(eng, tenant):
    seed_episodes(eng, tenant, n=300)            # at 20 rows the optimizer rightly skips the index
    eng.db.execute("ANALYZE episode")
    plan = explain(eng, "SELECT id FROM episode WHERE tenant = %s ORDER BY embedding <=> %s LIMIT 5", tenant)
    assert "vector search" in plan, plan
    assert tenant in plan, "the index prefix is not scoped to the tenant"
```

```ts
test('the agent resolves names before using ids and closes before measuring', async () => {
  const { calls } = await runAgent('What happens if the L closes between Bedford Av and 8 Av?');
  const order = calls.map((c) => c.tool);
  expect(order.indexOf('resolve_places')).toBeLessThan(order.indexOf('close_line'));
  expect(order.indexOf('close_line')).toBeLessThan(order.indexOf('measure_capacity'));
});
```

End-to-end runs can also assert the exact cost: kasauti's offline pipeline test asserts `searches_used == 3` (4 with an image), `offline is True` and `llm_used is False`.

## 5. Canary tests pin known limits

When you rely on a limitation (the database falls back to a full scan without a prefix predicate), test that the limitation still exists. If the canary starts failing, the world changed and a design decision needs revisiting: "investigated, not silenced".

```python
def test_unconstrained_ann_query_still_full_scans(eng):
    plan = explain(eng, "SELECT id FROM episode ORDER BY embedding <=> %s LIMIT 5")
    assert "FULL SCAN" in plan, "the engine got smarter: check whether recall still needs every prefix column"
```

## 6. Drift tests between duplicated facts

Two copies of one fact drift. When a mapping lives in config and in SQL, in the backend and in the browser, or in a constant and a doc, parse both and assert they match.

```python
def test_region_map_matches_the_sql():
    sql = Path("sql/002_multiregion.sql").read_text(encoding="utf-8")
    block = re.search(r"CASE jurisdiction(.*?)END", sql, re.DOTALL)
    pairs = dict(re.findall(r"WHEN\s+'(\w+)'\s+THEN\s+'([\w-]+)'", block.group(1)))
    assert pairs == JURISDICTION_TO_REGION
```

```ts
test('the browser metric code matches the official scorer, denominators included', () => {
  for (const fixture of scorerFixtures) expect(browserMetrics(fixture.rows)).toEqual(fixture.officialScore);
});
```

Parity between doors is the same idea: BIS Compass asserted that the in-app judge endpoint returned exactly the codes `inference.py` returned for the same queries.

## 7. Tri-state results: unknown is not false

A check that could not run returns `None` (or `null`), and the UI says "not checked". A green `False` for "no drift" on a decision the code never examined is a false claim, and engram's hostile reader found exactly that.

```python
@dataclass
class DriftReport:
    drifted: bool | None   # None: outside the history horizon, so unknown
    reason: str

def test_drift_outside_the_horizon_is_unknown_not_clean(eng, old_decision):
    report = eng.detect_drift(old_decision)
    assert report.drifted is None and "horizon" in report.reason
```

## 8. Write the test with the input the previous test avoided

Tests are written from the same mental model as the code, so they tend to avoid the breaking input. After every passing test, write the one that does the opposite: the query that matches both retrievers, the payload in Devanagari, the duplicate that arrives first. And bury the target under noise so a test cannot pass because the corpus was tiny.

```python
def test_recent_episode_survives_when_the_vector_retriever_also_finds_it(eng, tenant):
    """The input the previous test was written to avoid: the query MATCHES the recent episode."""
    add_noise(eng, tenant, n=30, text="refund note {i}: refund processing, refunds")
    add_episode(eng, tenant, "I already refunded them four minutes ago on ORD-99.", salience=0.9)
    hits = [h for h in eng.recall(tenant, query="refund", k=5, recent=3) if "four minutes ago" in h.content]
    assert len(hits) == 1, "a memory found by both retrievers was dropped or duplicated"
```

## 9. Footguns fail fast, with an explanation, and a test pins it

When you hit a footgun yourself (a call that deadlocks inside a transaction), make it raise a clear error and test that it does.

```python
def test_recall_inside_decide_raises_instead_of_deadlocking(eng, tenant):
    with pytest.raises(RuntimeError, match="inside a decide"):
        eng.decide(tenant, body=lambda d: eng.recall(tenant, query="x"))
```

## 10. Every new test must fail if its fix is removed

A guard test that cannot fail is decoration. For each new test, remove or break the behaviour it protects, run it, see it fail, restore. Keep it cheap with a mutation list:

```js
// scripts/mutate.mjs: each entry breaks one behaviour; the named test file must fail.
const MUTATIONS = [
  ['src/verdict.ts', 'if (citations.length === 0) return UNVERIFIED;', '', 'tests/verdict.test.ts'],
];
// for each: replace (assert the target occurs exactly once), run the test file, restore the original
// bytes, check the hash, and report "caught" or "MISSED".
```

ORCA's design guard tests were vacuous at first: a `css: false` setting made the `?raw` imports they scanned empty, so they passed on any stylesheet. The fix was proving each guard fails on a real offence. The scripts in this skill were checked the same way: ten deliberate mutations, ten failing test runs.

## 11. The negative-case matrix

Silence is a claim. Test it across the whole grid, not on one friendly case.

```python
class TestAreaStormMatrix:
    def test_every_combo_runs_and_catches_the_drain(self):
        for area in AREAS:
            for storm in STORMS:
                snap = replay(storm, area)
                assert snap["kpis"]["drains_flagged"] >= 1, f"{area} x {storm}: drain missed"
                if storm == "quiet":
                    healthy = [a for a in snap["alerts"] if a["kind"] == "street" and not on_blocked_drain(a, area)]
                    assert not healthy, f"{area} x quiet: false alarm on a healthy street"
```

## 12. Hard negatives that carry every surface feature

The negative that proves the eval discriminates has everything a positive has except the one thing that matters. Trinetra's benchmark included inerted zones with rising gas, an active hot-work permit and crew present, which a "gas + ignition + people" checkbox rule would flag, and a single-sample oxygen dropout that must not fabricate an asphyxiation alert.

## 13. The judge's entry point, as a subprocess, offline

When an organiser scores a command (`python inference.py --input x --output y`), test that exact command in a subprocess with the network variables forced off, and assert the schema plus a quality floor. Decode output as UTF-8 so a Windows console cannot crash it.

```python
def test_offline_inference_scores_the_public_set(tmp_path):
    env = {**os.environ, "HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1"}
    out = tmp_path / "out.json"
    r = subprocess.run([sys.executable, "inference.py", "--input", "datasets/public.json", "--output", str(out)],
                       capture_output=True, text=True, encoding="utf-8", errors="replace", env=env, timeout=300)
    assert r.returncode == 0, r.stderr[-500:]
    rows = json.loads(out.read_text(encoding="utf-8"))
    assert all(len(row["retrieved_standards"]) == 5 for row in rows)
    assert all(expected_in_top3(row) for row in rows)
```

## 14. Live failures become named regression tests

Every failure seen live (a garbled tool call, a null where a number was expected, a provider brownout) becomes a test named after it, and the README's failure ledger cites it. SunPath named its tests "(live regression)" and kept a "Failure we hit, defense in the code" table.

```ts
test('a garbled tool name from the provider is repaired (live regression)', () => {
  expect(repairToolName('logToCRM<|channel|>commentary')).toBe('logToCRM');
});
```
