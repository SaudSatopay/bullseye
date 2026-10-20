# Data and seeds

A judge believes what the data lets them check. Demo data is designed like the demo itself: seeded so it tells the same stories every run, sourced so every number has an address, and labelled so nobody mistakes synthetic for real.

## 1. Seed the stories, not just the rows

A seed that produces "realistic random data" produces a demo with nothing to find. Plant the stories the golden path walks through, from one fixed seed, and assert them in a test.

- One fixed seed for everything. Never call an unseeded random function anywhere in the seed path.
- Plant each story on purpose and name it in the code: a spike, a few items heading for trouble, a few slow ones, one anomaly nobody can explain without the product.
- Name a hero case and a failing case. A judge remembers a name ("the shop that runs out of chargers on Friday") better than an id.
- Leave one live item unprocessed, so the hero beat acts on something during the demo instead of replaying a finished state.
- Count everything at the end and print it; `/api/health` returns the same counts.

```ts
// scripts/seed.ts: one fixed seed, stories planted on purpose
const rng = mulberry32(20261018);
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const STORIES = {
  spike: { categories: ["Storage", "Laptops"], fromDay: -30, toDay: -23, factor: 1.65 }, // a seasonal spike
  stockout: new Set(["CHG-001", "CAB-001"]),          // two products burning toward zero
  slow: new Set(["CMP-001", "AUD-001", "AUD-004"]),   // three trending down
  anomaly: { day: -9, sku: "ACC-001", extraUnits: 31 }, // one day nobody can explain
};
function expectedUnits(p: Product, day: number) { // day runs from -89 (oldest) to 0 (yesterday)
  let e = p.baseDemand * weekdayFactor(day) * (0.72 + 0.56 * rng());
  if (STORIES.spike.categories.includes(p.category) && day >= STORIES.spike.fromDay && day <= STORIES.spike.toDay) e *= STORIES.spike.factor;
  if (STORIES.slow.has(p.sku)) e *= 1.35 - 0.88 * ((day + 89) / 89); // fades across the 90 days
  if (STORIES.stockout.has(p.sku) && day >= -12) e *= 1.55;            // selling faster as stock runs low
  return e;
}
```

Then pin the stories, not the exact rows, in a test:

```python
def test_seed_tells_the_planted_stories(fresh_db):
    a = analyze(fresh_db)
    assert {r.sku for r in a.stockout_risks} >= {"CHG-001", "CAB-001"}
    assert {s.sku for s in a.slow_movers} >= {"CMP-001", "AUD-001", "AUD-004"}
    assert a.anomaly.day == -9 and a.anomaly.sku == "ACC-001"
```

## 2. Seeds that cannot hurt you

- Make the seed idempotent: it clears and rebuilds the demo tenant, or it upserts by natural key. If it cannot be idempotent, it refuses to run against production unless a flag says otherwise, and the task board says so in capitals.
- A seed never overwrites a user's own data (an imported file, a "your store" mode). Keep demo and user data apart, with a visible "Demo data" versus "Your data" banner and a reset-to-demo button.
- Self-healing seeds: when the app finds an empty or stale store at boot or in the daily cron, it re-seeds the demo tenant and logs that it did.
- Plant the demo fact before recording. A video recorded on an unseeded database cannot be re-shot identically.

> Field note (Dhaal · MUJ HackX 4.0): the task board carried the warning "Do NOT re-run `scripts/seed.py` against prod, it is not idempotent; counts inflate on every run", because every extra run inflated the verified-report counts the live demo showed.

## 3. Dates: relative or fixed

- Seeding relative to today keeps "yesterday" meaningful on every demo day, but anything that depends on the weekday or the month shifts with the calendar. Assert the stories in tests, not the exact numbers, or pin the clock with a `DEMO_TODAY` variable during the demo and the recording.
- Data keyed to hours or dates (forecasts, schedules) goes stale. Re-verify the rehearsed numbers close to the demo day, and write the date you verified them next to them in `PRODUCT.md`.
- Store and display time with its timezone. A demo judged in another timezone should not show tomorrow's data as today's.

## 4. The provenance file

Every data build writes `data/meta.json`. The README's Data section, the proof page and the deck footers read it; nobody retypes a count.

```json
{
  "builtAt": "2026-10-16T13:55:11Z",
  "sources": [
    { "name": "MTA GTFS static (subway)", "url": "http://web.mta.info/developers/data/nyct/subway/google_transit.zip",
      "slice": "weekday service, departures 08:00 to 08:59", "retrieved": "2026-10-16", "licence": "MTA open data terms" },
    { "name": "MTA Subway Origin-Destination Ridership Estimate 2025", "url": "https://data.ny.gov/d/y2qv-fytt",
      "slice": "October 2025, Wednesday, hour 8", "retrieved": "2026-10-16", "licence": "MTA open data terms" }
  ],
  "assumptions": { "riderLoadPerCar": 110, "transferPenaltyMinutes": 3, "walkRadiusMeters": 400,
                   "assignment": "all-or-nothing, shortest time including half-headway wait" },
  "synthetic": ["riders", "incidents", "people"],
  "counts": { "stations": 445, "routes": 26, "segments": 1459, "demandPairs": 30205 }
}
```

- `sources`: name, URL, the exact slice used, the retrieved date, the licence.
- `assumptions`: every number you chose rather than measured. A judge who disagrees with one can find it in seconds.
- `synthetic`: what was generated, so the UI and README can label it.
- `counts`: what the build produced, so drift between the data and the docs is detectable.

> Field note (Detour · Graph Hacks 2026): the network built from four MTA open-data sources wrote a provenance file with each source's slice and retrieval date, every numeric assumption and the counts (445 stations, 1,459 segments, 30,205 origin-destination pairs); the landing and proof pages read their headline numbers from it and the verifier output, never typed by hand.

## 5. Label synthetic data where it appears

- A chip in the UI next to synthetic records ("Synthetic rider", "Demo store").
- A sentence in the README's Data section: what is real, what is generated, and how.
- A footer on deck slides that show generated data, and a caption on screenshots that do.
- Simulated values stay labelled as simulated in every artifact. The six number labels (MEASURED by our own scripts on real data, SOURCED, SIMULATED, PROJECTED, TARGET, ILLUSTRATIVE) and the facts file belong to sibling skill `prove-it` ([honesty.md](../../prove-it/references/honesty.md)); follow them here so the data arrives labelled.

## 6. Public data by domain

Licences and terms change; read the source's current terms before you ship, and record what you used in `data/meta.json`.

| Domain | Source | Access | Licence and conditions |
|---|---|---|---|
| Streets, buildings, places | OpenStreetMap through the Overpass API | keyless; public instances have fair-use limits, so cache the export | ODbL 1.0; credit "© OpenStreetMap contributors"; tile servers have their own usage policy |
| Weather, marine, air quality | Open-Meteo | keyless JSON API | free for non-commercial use; data under CC BY 4.0 with attribution |
| Public transit | GTFS static and realtime feeds from each agency | the agency's feed URL | set by each agency; read its terms |
| Indian government data | data.gov.in | some endpoints need an API key | Government Open Data License, India; attribute the source |
| Development indicators | World Bank Open Data | keyless API | CC BY 4.0 for most datasets |
| Photographs | Wikimedia Commons | keyless | per file (CC BY, CC BY-SA, public domain); record each file in a credits file and credit it on the image |
| Earth imagery | NASA image and Earth Observatory collections | keyless | generally not under US copyright; never use NASA insignia to suggest endorsement |
| Machine-learning datasets | Kaggle, Hugging Face | Kaggle downloads need an account | per dataset; read the card, since many are research-only or non-commercial |

Domain benchmarks these builds used: RDD2022 for road damage, SemEval-2014 for aspect sentiment, LFW for face verification, the UCI repository for sensor data, OBIS for species records. A public benchmark with a published baseline is stronger evidence than any set you write yourself; `prove-it` covers how to report against it ([evals.md](../../prove-it/references/evals.md)).

## 7. Simulate the claim on real data

When the product's claim is about a policy (routes, schedules, allocations) and no pilot exists, simulate it on real geography and say so on the artifact.

1. Pull the real network for a real city from Overpass. Commit the raw export, or its query and retrieved date.
2. Implement two policies over the same inputs: the baseline people use today, and yours.
3. Draw the random demand from the seed before branching on the policy, so both policies face identical days.
4. Run several seeds and report the mean and the range of every delta, not one lucky run.
5. Put every assumption in one dictionary, and write it into the results file.
6. Write the results to JSON. The README, the deck and the video read from that file; nobody types the numbers.
7. Disclose the comparison that flatters you least, and run one what-if (demand up 20 percent) so "what if it grows?" has an answer.

```python
"""sim/run.py: baseline versus proposed policy on the real street graph, across seeds."""
import json, random, statistics
from pathlib import Path

ASSUMPTIONS = {"days": 28, "seeds": [1, 2, 3, 4, 5], "bins": 240, "baseline": "fixed two-day schedule",
               "truck_capacity_l": 12000, "fill_l_per_day": [8, 40]}

def run(osm_export: str, out_dir: str) -> None:
    graph = load_street_graph(osm_export)            # networkx graph from the Overpass export
    runs = {"baseline": [], "proposed": []}
    for seed in ASSUMPTIONS["seeds"]:
        demand = draw_demand(random.Random(seed), ASSUMPTIONS)  # identical days for both policies
        for policy in runs:
            runs[policy].append(simulate(policy, graph, demand, ASSUMPTIONS))  # {"overflow_bin_days", "km", "lifts"}
    deltas = {}
    for metric in runs["baseline"][0]:
        pct = [100 * (p[metric] - b[metric]) / max(b[metric], 1e-9) for b, p in zip(runs["baseline"], runs["proposed"])]
        deltas[metric] = {"mean_pct": round(statistics.mean(pct), 1), "min_pct": round(min(pct), 1), "max_pct": round(max(pct), 1)}
    Path(out_dir, "sim_results.json").write_text(json.dumps({"assumptions": ASSUMPTIONS, "runs": runs, "deltas": deltas}, indent=2))
```

> Field note (WasteOS · OneEarth Hackathon 2026): a real OpenStreetMap export of one city fed a simulator with 240 bins over 28 days and 5 seeds, reporting the proposed policy against a fixed two-day schedule; the deck read its deltas from the results JSON and also disclosed that against a cheaper three-day schedule the policy drove 32 percent more kilometres.

## 8. Hardware and channels without the hardware

- A sensor path that needs hardware gets a simulator script that speaks the same protocol, so the live path can be demonstrated and judged without soldering anything.
- An outbound channel without credentials (WhatsApp, SMS, email) gets a simulated outbox that logs every byte it would have sent, and the UI shows the outbox.
- A live feed that drops sets a `degraded` flag that the UI shows; it never silently freezes on the last value.

## 9. Toward external validity

Synthetic data proves the mechanism, not the world. When the window allows, climb the ladder: reconstruct one real incident from an official report, with an honest note on how the mapping was made; commit a slice of a real public dataset with a provenance header; run a recognised third-party model on the same case; and quote one practitioner on the problem (problem validation, never an endorsement, never an invented name or title). Sibling skill `prove-it` owns how these are reported.
