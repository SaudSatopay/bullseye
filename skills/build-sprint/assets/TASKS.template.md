# Task board · the live coordination file

<!--
Owner: the glue lane. Lives at docs/TASKS.md and is TRACKED in git: the push is the lock.
Before the repo goes public, remove names, handles, phone numbers and organiser contacts.
-->

Claim: `[ ]` → `[WIP-{{name}}]`, then **push immediately** (the push is the lock). Done: `[x]`, remove the WIP tag, push, and add one line on what landed and how it was verified. Re-read this file after every `git pull --rebase`. P0 = golden path, P1 = wow, P2 = nice to have.

## Ownership map (who may edit what)

| Lane | Owner | Owns |
|---|---|---|
| **Product** | {{name}} | `frontend/**` · the deck · demo choreography |
| **Engine** | {{name}} | `backend/**` · the deterministic core and AI pipelines · the Data and API sections of `docs/CONTRACTS.md` |
| **Glue** | {{name}} | root configs · deploys · `scripts/` · fixtures and seed data · `README.md` · the rest of `docs/` |

## Golden path (from BULLSEYE.md, do not edit here)

1. {{beat}}
2. {{beat}}
3. {{beat}}

## Board

### Product · {{name}} (`frontend/`)
- [ ] **P0 H1-H3** {{the first golden-path screen, built against the stub API}}
- [ ] **P0 H3-H5** {{the next golden-path flow}}
- [ ] **P1 H8-H10** {{a wow-layer item}}
- [ ] **H12+** Demo choreography, the deck, rehearse the golden path until it is boring.

### Engine · {{name}} (`backend/`)
- [ ] **P0 H1-H4** {{the deterministic core: the product's spine; the model has zero verdict weight}}
- [ ] **P0 H4-H6** {{the model layer from detected facts only, with a template fallback when the API is down}}
- [ ] **P1 H8-H10** {{a wow-layer integration with automatic fallback}}
- [ ] **H12+** Harden: timeouts, retry once, a latency log line per external call (real numbers for the deck).

### Glue · {{name}} (root, `scripts/`, deploys, fixtures)
- [ ] **P0 H0-H3** Hello world deployed (frontend and backend); deployment protection off; URLs in the README.
- [ ] **P0 H3-H5** Fixtures and seed data; the runsheet's paste strings; QR codes for the live URL.
- [ ] **Hourly** Walk the golden path end to end on the deployed URL; file breakages under Blockers.
- [ ] **H{{freeze}}** Feature freeze. Only golden-path and honesty fixes after this.
- [ ] **H{{freeze}}-H{{end}}** Backup demo video; README; real numbers to the deck.
- [ ] **H{{end - 0:30}}** Submit everything 30 minutes early.

## Requests (cross-lane asks: add, push, then ping in person)

- [ ] FOR {{owner}}, FROM {{me}}: {{the ask, with the file or endpoint and the reason}}

## Blockers (the glue lane clears these first)

- [ ] {{blocker}}: {{what is needed}} · {{who can unblock it}}

<!-- Warnings that would cost the demo go here in capitals, for example:
**DO NOT re-run `scripts/seed.py` against production: it is not idempotent.** -->

## Done

- [x] {{item}}: {{what landed}} · {{how it was verified}}
