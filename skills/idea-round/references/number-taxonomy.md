# Number taxonomy

Judges check numbers, and they look up the ones that matter. A labelled number is a promise you can keep; an unlabelled one is a liability the first time someone asks "where is this from?". Label every number on the artifact itself, where the number sits, not only in an appendix.

## The labels

| Label | Means | It must carry | On the artifact | Example |
|---|---|---|---|---|
| SOURCED | from a cited external source | publisher, title, year | a footer source line and an appendix row | "2.56 bn t of municipal waste in 2022" (World Bank, What a Waste 3.0) |
| MEASURED | your committed script, run on real or organiser data | the script, the data, the date | a Methods line; "measured" in the caption | 90.1% of mules caught in the top 5% of accounts, 95% CI 83.5–96.5%, on the provided dataset (MuleShot) |
| SIMULATED | your script on synthetic, reconstructed or simulated data | seeds, duration, assumptions | a SIMULATED chip and a caption with the run size | overflow −98% against a fixed 2-day schedule, 240 bins, 28 days, 5 seeds (WasteOS) |
| PROJECTED | derived from other numbers | the derivation and its condition | the arithmetic printed beside it | ~18 t CO2 per 1,000 bins a year, "only holds if the simulated distance saving holds" (WasteOS) |
| TARGET | declared now, measured later | how, and on what data | "(target)" in legends; "Declared now, measured on stage" | ≥95% recall on held-out simulator laps (LINE MARSHAL); "SURYA (target)" 0.82 |
| ILLUSTRATIVE | UI values, overlays, sample chats, mock records | the label, nothing more | a ribbon or chip: ILLUSTRATIVE, CONCEPT UI · VALUES ILLUSTRATIVE | "BIN-021 FILL 87%" on a photograph |

Why MEASURED is its own label: WasteOS had nothing measured yet and used five labels. MuleShot measured on the organiser's own data and kept two blocks, Sources and Methods, so a reader could tell a citation from a measurement. A number your script produced on the organiser's data is the strongest thing an idea submission can carry; never let it look like a quoted statistic, and never let a quoted statistic look measured.

Rules:

- Use the weakest label that is true. A simulation on a real street map is still SIMULATED. A model scored on a synthetic population is SIMULATED, not MEASURED (NAADI: "Synthetic-population validation of the architecture, not a market claim").
- A number keeps its label in every format: brief, deck, form essay, speaker notes, voice-over.
- Date every sourced statistic and name the dataset of every measurement. MuleShot added "(Dec 2025)" to its national statistics during hardening.
- When citations are forbidden (anonymity rules), size markets in words ("several crore", "tens of lakhs") and keep the sources in your private Numbers table.
- An interval beats a point. Report the headline with its interval and the sample size: "not a naked point".

## Status chips for features

| Chip | Style | Means |
|---|---|---|
| IMPLEMENTED | filled | runs today in the build you can show |
| PROTOTYPED | outlined | a working prototype exists; not production |
| SIMULATED | dashed | shown in simulation only |
| FUTURE | muted | planned |

One chip per product slide or module, a key on the overview slide, and the rule from the WasteOS README: they "are set to what the deck can honestly claim today. Move them up as features ship." Architecture diagrams draw planned parts dashed and label them "(planned)". ProofChain's syllabus mapping used the same idea in a table: IMPLEMENTED, DEMONSTRATED or THEORETICAL, each with a Where or Notes column that names the file, screen or doc.

## Placeholders that refuse to lie

- Where a real photo will go, a dashed frame reading "PROTOTYPE PHOTO GOES HERE". The WasteOS README says of that slot: "Never use a mock-up there."
- Mock interfaces carry their label inside the frame. MuleShot's analyst cockpit got an "Illustrative · full-platform view" ribbon and a legend: filled markers for signals modelled on the provided data, hollow markers for those that need production feeds. That fixed a hardening finding that the mock-up showed features the data could not support.
- Overlays on photographs carry "ILLUSTRATIVE OVERLAY" on the image itself, and the back page repeats it: "All detection overlays on photographs are illustrative mock-ups of Line Marshal output, not live system results."

## Disclose the unflattering comparison

WasteOS beat a fixed every-2-days collection schedule on every measure. Against a cheaper every-3-days schedule it drove 32% more kilometres while removing about 449 overflow bin-days. Both comparisons went into the appendix. Put the weaker comparison beside the stronger one; a judge who finds it on their own stops trusting the rest.

## Words that stay true

| Overclaim | True version | Seen in |
|---|---|---|
| "freezes the proceeds" | "recommends a real-time hold", maker-checker, audit-logged, "never auto-frozen" | MuleShot |
| "Generate STR" | "Draft STR" | MuleShot |
| "auto-STR" in the demo plan | "STR draft" | MuleShot |
| a hard government mandate that could not be verified | softened to what is verified ("23 banks live") | MuleShot |
| "MuleHunter.AI" | "MuleHunter AI", the real name | MuleShot |
| "live government APIs" from agencies that have no open API | "interface ready" | ORCA |
| "executed" | "prepared" | Trinetra |
| "validated" for a reconstruction | "reconstructed" | Trinetra |
| "safe" | "no known risk" | Dhaal |

## The appendix: every number, and where it came from

Headline: "EVERY NUMBER, AND WHERE IT CAME FROM." Kicker: "APPENDIX · SOURCES, METHOD & CREDITS". Three blocks (WasteOS):

1. **Sources:** each statistic with its publisher, title, year and link.
2. **Method:** for a simulation, the model, data, seeds, duration, the assumptions and what is not modelled ("One-way restrictions and traffic not modelled."); for a measurement, the script and the data.
3. **Photo and map credits:** subject, author, licence ("© OpenStreetMap contributors (ODbL)", NASA public domain, each Wikimedia Commons licence).

Footer it as outside the timed pitch ("Appendix: not part of the 10-minute pitch").

Smaller formats: MuleShot closed its PDF with a two-part Sources and Methods block ("each reproducible from runnable scripts"); LINE MARSHAL's back page carried NOTES & SOURCES, PHOTOGRAPHY, and "Metrics are declared finale targets, measured on held-out data."

## Say it out loud

- The narrator says "In simulation" before the 98% (WasteOS launch film).
- Speaker notes carry each slide's honesty line: "Everything on this slide is checkable, that is the point." (FLOODLIGHT) "Judges can hold us to these at the finale, that is the point." (LINE MARSHAL)
- A "What every number is" table (label and meaning, with examples inline) in the deck's README tells teammates and judges how to read the slides (WasteOS).

## The Numbers table

It lives in `idea/SPINE.md`:

| id | As written | Label | Source or script | Date | Appears in |
|---|---|---|---|---|---|
| N1 | 1,200+ | SOURCED | FIA communications and motorsport press, Austrian GP 2023 | 2023 | brief p. 2 · deck 2 · form Q1 |
| N2 | <2 s | TARGET | measured live at the finale, crossing to alert | | brief p. 3 · deck 7 · form Q3 |

- One row per number, written exactly as it appears in the artifacts.
- A changed number changes here first, then everywhere it appears.
- `form-check.mjs --numbers idea/SPINE.md` warns about any number in the form that is missing from this table. The sibling `prove-it` keeps the same values in `facts.json` and checks every document against them; WasteOS went further and generated every simulated number from the simulator's JSON, so the deck, the film and the appendix could not drift apart on them.
