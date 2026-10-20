# The law, with its evidence

Each rule below was paid for in a real event. The field notes say where. When a rule feels negotiable under deadline pressure, read its note.

## 1. Decode the rubric before writing code

Read the rules, the judging criteria, every limit and the sponsor's guide before choosing what to build. Score candidate problems on team fit, demo-ability and differentiation, and choose for win probability.

- Count how much of the score is outside the code. When most of it is (feasibility, presentation, impact), a narrow demo that never breaks plus one real wow moment plus a tight story beats ten features demoed badly.
- Check what everyone else will build. If a large share of competitors are cloning the organiser's sample app, pick a less crowded problem.
- Answer the sponsor test: does the product still work without the sponsor's technology? If it does, that technology is decoration, and sponsor judges will notice.

> Field note (Detour · Graph Hacks 2026): a scan of about 351 competitor repositories found roughly a fifth were variants of the official guide's demo app, so the first concept was dropped for one where the graph algorithm is the product.

> Field note (Dhaal · MUJ HackX 4.0): three of five criteria were non-code, so the plan was written around "a narrow end-to-end demo that never breaks, one genuine wow moment, and a tight five-minute story with impact numbers".

## 2. The judge is a user

Write the judge into `PRODUCT.md` next to the real users: someone with two minutes and a laptop who needs to see that the system reasons, not a chatbot with a nice skin. Give them a 60-second path through the README with deep links that land on the right state.

> Field note (ORCA · SIH 2026): the product file named the judge as a user and listed what must never break, including the rehearsed scenarios and their exact numbers.

## 3. The engine decides, the model narrates

Anything a judge can check (money, scores, verdicts, routes, counts) comes from deterministic code. The model picks tools, parses messy language, and explains. Enforce it at the schema boundary: tools are the only source of numbers, citations must quote the source verbatim, prices snap to the catalogue, and identifiers are validated in code. Label every AI output with where it came from.

> Field note (Trinetra · ET AI Hackathon 2.0): "If the model is down, the safety call is unaffected." The pitch used the split as its trust argument.

> Field note (NAADI · IDBI Innovate 2026): "The LLM writes prose, never numbers." The memo model was told to keep every figure exactly as given, and fell back to a deterministic draft on any failure.

## 4. Build the demo path first, and deploy on day 1

Lock 6 to 8 numbered beats a judge will see, then build those before anything else. Ship a preview deployment in the first hours, so build, hosting and environment problems appear while there is time to fix them.

> Field note (Detour · Graph Hacks 2026): the first production build failed on day 1 because a bundler loader scanned the whole project, including the package store on the build host. It was found and fixed in 13 minutes because the deploy happened early, not on deadline night.

## 5. The demo cannot die

Ship labelled modes (live, scripted on the same tools, recorded from a real run), seeded data with planted stories, a health endpoint, a reset button, deep links per scenario, provider failover and a smoke test that asserts the rehearsed numbers. Assume venue Wi-Fi fails and free-tier quotas run out mid-judging.

> Field note (Detour · Graph Hacks 2026): three run modes, each labelled in the interface, plus a six-model free-tier chain that skipped spent models, kept the demo alive through quota exhaustion and a database outage.

> Field note (ORCA · SIH 2026): several moments when the demo lied (a stale browser tab on stage, a map provider that started demanding a key mid-rehearsal, animations that never ran in a hidden tab) became permanent rules: no-store HTML, keyless tiles, fail-safe timers, and nothing important that starts invisible.

## 6. Every number is measured, labelled and identical everywhere

One facts file, written by the scripts that measure, feeds the README, deck, video, form and UI. A claims ledger maps each claim to the command that measures it and the test that pins it. Re-derive every number before each docs pass.

Label every number on the artifact: measured, sourced, simulated, projected, target or illustrative.

> Field note (Detour · Graph Hacks 2026): one command re-measured all 16 README claims, checked that the README still contained each claim's text, compared 13 of them with an independent reimplementation, and failed on any mismatch.

> Field note (Bridge, kasauti, FLOODLIGHT, BIS Compass · four events): test counts drifted between README, deck, agent brief and video script (58 vs 59; 51 vs 65 vs 68; 11 vs 20 vs 22 vs 31; 30 vs 37). A single facts file and a pre-submit check catch that drift before it ships.

## 7. Say the limits out loud before judges find them

Every README gets an honest-limits section ("Where we lose", "Known limits"). Mockups are labelled as mockups on screen. Wording stays exact: prepared is not executed, reconstructed is not validated, "no known risk" is not "safe". Publish raw misses from a blind evaluation before tuning on them.

> Field note (Dhaal · MUJ HackX 4.0): a blind battery written by a session that could not read the repo was run once and published raw, misses included, before any tuning. Missed targets were reported as missed.

> Field note (MuleShot · BOI × IIT Hyderabad 2026): a second model found a leak hidden by type coercion; after the hardening pass the headline went from 96 percent to 90 percent, and the honest number became the stronger story.

## 8. One signature moment, from the subject's own world

Choose a visual language native to the problem (a nautical chart for fishers, a station sign for transit, an engineering drawing for civil infrastructure, a public-safety poster for scam checks) and spend boldness in one place. Ban the default looks by name and enforce the ban with tests where possible.

> Field note (ORCA · SIH 2026): the first interface was a generic dark-glass dashboard that the builder later called slop; it was replaced wholesale by a living nautical chart, and unit tests now fail on literal colours, opacity-zero entrances and missing translations.

## 9. Simulate the judges cold, then fact-check them

Paste the problem statement, rubric and repo into a fresh session with no memory of the build. Ask it to reproduce the numbers, read the code, run the app and try to break it. Verify each finding before fixing it, fix every substantiated one, record the non-issues, and rotate the next round onto the newest work. Finish with a blind round.

> Field note (Trinetra · ET AI Hackathon 2.0): eight judge prompts moved the score from 7.3 to 8.5. Some findings were wrong (an "invented" identifier was in the scenario data), which is why every finding is checked against the code first.

## 10. Submit early, tag it, never edit after the deadline

Submit with buffer (at least 30 minutes onsite, a day on government portals), record the time, tag the submission commit, and keep post-deadline work in a separate, clearly marked section. Never use a tool that answers real judges live for you; it can break event rules and it breaks trust. Rehearse with a mock judge instead.

> Field note (Detour · Graph Hacks 2026): the README marked exactly what was submitted (a tag link) and what came later, and published a correction stating what the submitted version still got wrong.

> Field note (Smart Retrofit Kit · MSME Idea Hackathon 6.0): the government portal's sanitiser stripped percent signs, apostrophes and semicolons from stored answers, and the stored text could not be edited. Submitting two days early meant the loss was found and recorded before the deadline.
