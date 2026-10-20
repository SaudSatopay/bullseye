# Competitive scan

How to learn, before picking, what last edition rewarded, what this edition's field is building, and where the sponsor's tech does work nothing else can. Used in brief-decoder step 4. Everything here reads public material only.

## Why scan before picking

- Judges see dozens of near-identical builds in one sitting. Dhaal's design brief opened: "The app works end-to-end but looks like every AI-generated Tailwind app ever made", with judges about to "see forty of those today". The same holds for ideas.
- An uncrowded problem built well beats the crowded one built slightly better.
- Last edition's winners show what this organiser's jury rewards: clone the formula, never the project.

## The four passes

| Pass | Questions | Sources | Section in `brief/scan.md` |
|---|---|---|---|
| 1. Last edition | Who won, with what, in what team size, and why | The results post, the platform's winners tab or gallery, the organiser's social posts, winners' repos and write-ups | Winning formula |
| 2. The field | What this edition's teams are building | GitHub search, blog posts under the event tag, the public project gallery | Idea clusters, blog field |
| 3. Sponsor internals | What the sponsor's tech does best; what the official guide's demo apps are; the limits | Official docs, the hackathon guide, quickstarts, template repos, the changelog | Demo apps to avoid, load-bearing answers |
| 4. Infrastructure | Where it runs, what is free, what needs an owner action | Pricing pages, free-tier limits, quota docs | Infra and owner actions |

In Claude Code: run each pass as a subagent in parallel; tell each to write only its own section of `brief/scan.md` and to return the five lines that matter. Elsewhere: run them in sequence, about 20 minutes each.

> Field note (Detour · Graph Hacks 2026): With no idea supplied and a "research heavy" direction from the user, intake ran four parallel research passes (sponsor internals, judging and competition, the idea landscape for two tracks, memory plus hosting and LLM infrastructure) before any concept was locked.

## Pass 1: last edition

1. Search for the previous edition's results: `<event> <previous year> winners`, the organiser's results post, the platform's winners tab, the finalists' repos. On Devpost, a past edition's project gallery (`https://<slug>.devpost.com/project-gallery`) lists every submission and marks the winners: the fastest list of what won, and of what the field looked like.
2. For each winner write: problem, users, modalities, the demo form, accessibility, how it was built, team size.
3. Reduce it to a winning formula of 4–6 traits, written as one line.
4. Check every candidate idea against the formula.

> Field note (Trinetra · ET AI Hackathon 2.0): The decoded formula was "visceral human-stakes problem + multi-modal fusion (CV+RAG+agents) + instant tangible demo + multilingual accessibility + orchestrate pretrained models (don't train from scratch)". Industrial safety was the one problem statement that matched the formula and the sponsor's industrial mandate.

## Pass 2: the field

Repos created since the window opened (GitHub CLI, logged in):

```bash
gh search repos "<event name>" --created ">=<window start YYYY-MM-DD>" --limit 200 --json fullName,description,createdAt,stargazersCount,url > brief/scan-repos-name.json
gh search repos "<sponsor> hackathon" --created ">=<window start>" --limit 200 --json fullName,description,createdAt,url > brief/scan-repos-sponsor.json
gh search repos --topic <event-tag> --limit 200 --json fullName,description,createdAt,url > brief/scan-repos-topic.json
gh search code "<sponsor SDK import line>" --limit 100 --json repository,path > brief/scan-code.json
```

Read a README without cloning:

```bash
gh api -H "Accept: application/vnd.github.raw+json" repos/<owner>/<repo>/readme
```

GitHub search returns at most 1,000 results per query. When a query hits the cap, split it by date (`--created 2026-10-15..2026-10-16`).

Blog posts under the event's tag (dev.to's public API needs no key):

```bash
curl -s "https://dev.to/api/articles?tag=<tag>&per_page=100&page=1"
```

Keep `title`, `url`, `published_at`, `public_reactions_count` and `comments_count`. Do not record authors' names; titles and counts are enough.

Cluster the ideas: read each description (and the README when the description is thin), assign the repo to one cluster, count. A cluster holding 10% or more of the repos, or any variant of the official guide's demo app, is crowded: do not pick it as the core idea. Early in a long window the field is thin; run the pass again near the middle of the window and note what moved.

> Field note (Detour · Graph Hacks 2026): The scan found about 72 of 351 competitor repos (20%) were variants of "Blast Radius", the official guide's demo app. The first concept, an incident-response crew on a service graph, was the same idea, so it was dropped.

## Pass 3: sponsor internals

- List every sample app in the official guide, quickstarts and template repos. These are the default ideas of the field.
- Keep the guide's reference architecture while choosing a different problem. Detour followed it (fixed typed tools, name resolution, four answer shapes, memory as dated nodes, a graph per tenant) and spent its originality on the problem.
- Find the rare primitive: the capability few teams will touch that your problem truly needs. Detour's research named `algo.maxFlow` and harmonic centrality, then picked a problem where max flow and min cut do the core reasoning.
- Probe the primitive's real output shapes before building on them, and note the limits that will bite: free-tier sizes, permissions, quotas, retired models.

## The load-bearing test

Put one question to every candidate: "If we removed the sponsor's tech, what would stop working?"

| Answer | Verdict | Do |
|---|---|---|
| "Nothing; we would use another database or model" | Decoration | Rework the idea or drop it |
| "Results would be a bit worse" | Weak | Find the primitive that does the core reasoning |
| "The core question could not be answered" | Load-bearing | Write the answer into the README and the video |

Organisers say this out loud. Graph Hacks: "If the product still works without FalkorDB, the graph counts as decoration". The kasauti README answered it head-on: "SerpApi is not an add-on here: it is the evidence engine."

## Pass 4: infrastructure

List where the build runs (hosting, database, models), the free tiers and their limits, and every action that needs the owner: accounts, keys, billing, repo visibility, CI token scopes, video hosting. Put them in `## Owner checklist` on day 1.

> Field note (Detour · Graph Hacks 2026): The "shipped" score stayed at 6 or 7 for seven critic iterations because its fixes needed the owner: production keys, a tag, a public repo, analytics, a token with workflow scope.

## Side prizes and the blog field

- Count competing posts under the tag, note the median reactions and the shape of the strongest titles.
- A strong post title carries numbers and a concrete scene: "I shut down the L train in a FalkorDB graph: 23,445 riders, one min cut, and a fix tested on a fork".
- Plan the post at intake; write it at submission (sibling skill `submission-pack`).

## Layout of `brief/scan.md`

```markdown
# Scan: <event> (<date>)

## Winning formula (last edition)
<one line> · sources: <links>

## Idea clusters
| Cluster | Repos | Share | Example | Verdict |
|---|---|---|---|---|

## Sponsor demo apps to avoid
- <app>: <what it does> (<link>)

## Load-bearing answers
| Candidate | Without the sponsor's tech | Verdict |
|---|---|---|

## Blog field
<n posts · median reactions · strongest titles>

## Infra and owner actions
- <item>: <limit or action>

## Implications for the pick
- <three bullets>
```

## Boundaries

- Public material only: no logins to other teams' spaces, no scraping behind authentication.
- Never copy a competitor's code or assets into the project.
- Never contact judges, and never post in other teams' threads or the event's channels on the user's behalf.
- Credit other teams whose public work helped. Detour reproduced another team's report of wrong max-flow results from the sponsor's engine and credited that team in its README and blog.
