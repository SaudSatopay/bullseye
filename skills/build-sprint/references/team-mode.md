# Team mode: several humans, several agent sessions, one repository

Use this when two or more people each drive their own coding-agent session on the same repository at the same time. Without a protocol, parallel agents overwrite each other's files, invent incompatible API shapes and break `main` an hour before judging. The protocol below ran a three-person overnight build with three parallel sessions and 131 commits.

## 1. Lanes

Split by directory, not by feature. Each lane owns paths, and only its owner's session edits them.

| Lane | Owns | Also responsible for |
|---|---|---|
| Product | `frontend/**`, the deck, demo choreography | the golden-path screens, mobile first |
| Engine | `backend/**`, the deterministic core and the AI pipelines, the Data and API sections of `docs/CONTRACTS.md` | every external call mocked behind the flag |
| Glue | root configs, deploys, `scripts/`, fixtures and seed data, `README.md`, the rest of `docs/` | `main` stays runnable, hourly golden-path walks, arbitration |

The glue lead floats: clearing other lanes' requests and blockers outranks their own tasks. Confirm or adjust the lanes at kickoff in `docs/TASKS.md`; the ownership map there wins over anything else.

Put the rules where every agent reads them on start, in `CLAUDE.md` or `AGENTS.md`:

```markdown
## Team protocol (every session reads this first)
- Lanes and ownership: see docs/TASKS.md. Edit only your lane's paths.
- One branch. Everything lands on main. Before EVERY push: git pull --rebase origin main. Never force-push.
- Contracts first. docs/CONTRACTS.md is the single source of truth for API shapes, data models, enums and env names.
  The lane that owns an endpoint pushes the contract change BEFORE the code.
- Claim before you build: mark a docs/TASKS.md item [WIP-<name>] and push immediately; the push is the lock.
- Re-read docs/TASKS.md and docs/CONTRACTS.md after every rebase; they change underneath you.
- Conflict outside your lane: stop, do not resolve it blind; the glue lead arbitrates.
- main stays runnable. If main breaks, fixing it outranks any feature. Feature freeze from H<n>.
- Every external call has a mocked fallback behind a flag; assume venue Wi-Fi dies mid-demo.
- Commits: authored by the human running the session; message "<lane>: what changed"; push at least every 30 minutes.
- Attribution: <the event's rule, decided at kickoff>.
```

## 2. The git protocol

- One branch, `main`. Feature branches multiply merge debt that nobody has time to pay overnight.
- `git pull --rebase origin main` before every push. Never force-push, never rewrite pushed history.
- Small commits, pushed at least every 30 minutes, messages `<lane>: what changed`.
- Each person's commits carry their own identity. Check `git config user.name` and `user.email` before the first commit, and set them repo-locally if the machine is shared.
- When the event forbids AI attribution, turn the agent's co-author trailer off in the project settings before anyone commits (Claude Code reads `.claude/settings.json`; this build used `{"includeCoAuthoredBy": false}`; check the current setting name for your version). When the event requires disclosure, keep a log of what the agents did instead.

## 3. The task board: claim by push

`docs/TASKS.md` (from `assets/TASKS.template.md`) is the live coordination file.

- Items carry a priority and an hour target: P0 is the golden path, P1 the wow layer, P2 nice to have.
- Claiming: change `[ ]` to `[WIP-<name>]` and push immediately. The push is the lock; whoever pushes first owns it.
- Done: `[x]`, remove the WIP tag, push, and note what landed and how it was verified in one line.
- **Requests** hold cross-lane asks as `FOR <owner>, FROM <me>: <ask>`. Push, then tell the owner in person or in chat.
- **Blockers** hold anything that stops a lane (keys, a broken deploy, a dead service). The glue lead clears these first.
- Warnings that would cost the demo live on the board in capitals, for example that a seed script must not be re-run against production.

## 4. Contracts first

`docs/CONTRACTS.md` (from `assets/CONTRACTS.template.md`) holds every API shape, data model, enum and environment name. A stub API serves the contracts from kickoff, so the product lane builds against them before the engine lane's code exists.

- The owning lane pushes the contract change before the code. Other lanes read it after every rebase.
- Each endpoint is marked **stubbed** or **live**, and flips in the same commit that makes it live.
- Enums carry wording rules where words matter ("never render the word 'safe'"; a model-only signal "carries zero verdict weight").
- After the freeze, contract changes are additive and backward-compatible only.
- One error shape for every endpoint: `{"error": "human-readable message"}`.

## 5. Keeping main runnable

- The glue lead walks the golden path end to end on the deployed URL every hour and files breakages as Blockers.
- Deploys stay green after merges. A red deploy is a Blocker for everyone.
- Every external call (model, speech, database, messaging) has a mocked fallback behind the flag. Canned responses carry `mocked: true`.
- Secrets live in `.env` (gitignored). `.env.example` lists names only. Keys are shared out of band, never in the repo, and every key that passed through chat is rotated after the event.

## 6. The kickoff prompt

The glue lead runs this in their own session as soon as the problem statements are released. Fill the angle brackets.

```text
Read CLAUDE.md and all of docs/ first. I am <name>, Glue lane and integration lead.
The problem statements are out. Candidates for our tracks:

--- PROBLEM STATEMENTS (paste text or photos) ---
[PASTE HERE]
--- END ---

Team: <n> of us, each driving our own agent session on this repo in parallel:
<name> (Product: frontend, UX, pitch), <name> (Engine: backend, AI), me (Glue: integration, deploy, demo data, QA).
The stack is locked in CLAUDE.md. Build ends <time>, judging at <time>.
Winning formula: a narrow end-to-end demo that never breaks, ONE wow moment, a tight story.

Do this with me, in order:
1. Score each candidate problem on team-fit × demo-ability × differentiation (short table, 45-minute
   decision budget). Recommend one; I make the call.
2. Lock the golden path: the ONE demo flow that must never break, as 6-8 numbered user steps, plus one
   beat where the product correctly stays quiet.
3. Scaffold the repo for the locked stack, wired to .env.example: a hello world that runs locally AND
   deploys within 2 hours. Deploy first, then features.
4. Fill docs/PLAN.md (problem, concept, golden path, architecture, wow layer), docs/CONTRACTS.md (data
   models, every golden-path endpoint, env names) and docs/TASKS.md (real tasks per lane with hour
   targets: MVP end to end by H<8>, wow layer H<8>-H<12>, freeze at H<12>; mark cross-lane dependencies).
5. Commit and push everything to main, then write a 3-line kickoff message for the team chat: what we
   are building, who starts on what, when we first sync.

Commit rules per CLAUDE.md. Ask me before adding any paid or sign-up service. Every external API gets
a mocked fallback.
```

## 7. The lane loop prompt

Each member pastes this into their own session after the kickoff push, with their lane filled in.

```text
Read CLAUDE.md, then docs/PLAN.md, docs/CONTRACTS.md and docs/TASKS.md.
I am <name>, <lane> lane: everything under <paths>. <other names and lanes> push to this repo in
parallel with their own agent sessions; the repo changes underneath us constantly.

First: confirm git identity. git config user.name and user.email must be MINE (set them repo-locally
if wrong; ask me for the values). Follow the attribution rule in CLAUDE.md.

My loop, repeat until I say stop:
1. git pull --rebase origin main; re-read the deltas in TASKS.md and CONTRACTS.md.
2. Clear Requests and Blockers addressed to me first.
3. Claim my next task: mark it [WIP-<name>] in TASKS.md and push the marker immediately.
4. Contract first: if the task changes an API shape, data model, enum or env var, update CONTRACTS.md
   (and .env.example) and push THAT before writing the code.
5. Build it. Golden-path work outranks everything. Build against the contract, mocking the other
   lane's endpoint until it is live. Every external call gets a mocked fallback behind the flag.
6. Verify it runs, commit small ("<lane>: what changed"), pull --rebase, push, tick the task, un-WIP.

Need a change outside my lane? Add it under Requests ("FOR <owner>, FROM <me>"), push, and tell me to
ping the owner. Never edit another lane's files. A rebase conflict outside my lane: stop and tell me;
the glue lead arbitrates.
From H<freeze>: no new features. <Product: demo choreography, the deck, rehearsing the golden path
until it is boring. Engine: harden endpoints, kill flaky calls, measure real numbers for the deck.>
```

The glue lead's loop adds three duties: keep deploys green after every merge, seed and re-seed the demo data, and walk the golden path every hour, filing what breaks. If `main` breaks, drop everything and fix it. From the freeze: error-proof the golden path, record the backup video, feed real numbers to the deck, and submit 30 minutes early.

## 8. The anti-slop overhaul prompt

When the product works end to end but looks generated, one session gets this brief. It is a visual refactor only. Fill the `<domain>` slots from the product's real world; the design doctrine and banned looks behind it are in [design-rules.md](../../missile/references/design-rules.md) (sibling skill `missile`).

```text
Read CLAUDE.md, then the deltas in docs/TASKS.md and docs/CONTRACTS.md. Identity check first.

MISSION THIS SESSION: a total visual identity overhaul. The app works end to end but looks like every
AI-generated app; judges will see dozens of those today. Ours must be unmistakable from across the room.

DIRECTION: "<the domain's own artefact>, not a SaaS dashboard".
- Take the visual language of <the domain's real material: its signage, instruments, forms, tickets,
  charts, stamps>, executed with modern craft, not kitsch.
- Type IS the design. Display: <a characterful face that fits the domain and its languages>. Body:
  <a calm face>. Numbers and ids: <a mono face> with tabular figures. Real jumps in the scale; the hero
  should feel like a poster, not a heading.
- One token palette, used everywhere: <ground> · <ink> · <ONE accent> · status colours reserved strictly
  for status (<bad>, <caution>, <good>). Status colours never decorate.
- The <hero artifact: the verdict, the receipt, the ticket, the report> is the product's hero. Give it one
  signature motion (<a stamp, a seal, a draw-in>), CSS only, 250 to 400 ms, honouring reduced motion.
  The dangerous state is loud; the safe state is quiet.
- The working state is <a domain-native activity with real copy>, never a default spinner.
- Landing: one promise, one primary action, one live number. No grid of feature cards.
- BANNED: emoji as icons, the rounded white card on a grey page, default blue buttons, purple gradients,
  glassmorphism, everything centred, Inter as the personality. If a screen would look at home in a
  template gallery, redo it.

SCOPE AND RULES:
- VISUAL refactor only: zero API, contract or logic changes. Every flow keeps working exactly.
- Priority order, timeboxed (freeze at H<n>): 1) <hero artifact> 2) <main screen> 3) landing
  4) <secondary surface> 5) everything else gets the tokens and type lightly. Commit per surface,
  pull --rebase, push, move on.
- Mobile first (judges hold phones) and legible on a projector. Build green before every push.
  No new heavy dependencies.
- Done: ask the glue lane to deploy, then walk golden-path beats 1 to 3 at phone width.
```

> Field note (Dhaal · MUJ HackX 4.0): this brief, written as "suraksha poster, not SaaS dashboard" with its banned list and a visual-only scope, went out at hours 9 to 10 of the overnight build: the hazard-notice verdict card with its stamp seal, the poster landing and check screens, the war-room console, all with zero logic changes and the golden-path beats re-walked.

## 9. Roles, sleep and the last hours

- One pitch owner and one demo owner. The presenter sleeps before the pitch.
- Sleep in shifts after the freeze, with someone awake who can redeploy.
- The last hours run in order: freeze, harden, record the backup video, rehearse until boring, submit 30 minutes early.
- After the event, before the repo goes public: remove names, handles, phone numbers and organiser contacts from `docs/TASKS.md` and `docs/CONTRACTS.md`, and rotate every key.

> Field note (Dhaal · MUJ HackX 4.0): three people each drove their own session on one `main` branch with claim-by-push locks and contract-first changes; 131 commits landed in about 39 hours, the last at 05:35 with judging at 11:00.
