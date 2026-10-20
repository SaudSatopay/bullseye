<!--
Paste-in prompt for a fresh session, another tool, or a teammate's agent.
Fill the slots from BULLSEYE.md before pasting. Keep it under one screen.
-->

You are continuing a hackathon build for {{event}} ({{deadline in local time}}, {{T-minus}} left). The project is {{one-liner}}.

**Read first, in this order:** `BULLSEYE.md` (top to bottom; trust it over anything you remember), then `AGENTS.md`, then `CLAIMS.md`. Do not start until you have read all three.

**Quick state**
- Phase: {{phase}} · last verified commit: {{sha}} · deployed: {{URL}} (serving {{sha}})
- Golden path: {{status, e.g. green on the deployed URL in demo mode}}
- Headline numbers: {{the three numbers that matter, from facts.json}}
- Open owner actions: {{list, or none}}

**Critical conventions**
- {{package manager}}; run `{{dev command}}`, `{{test command}}`, `{{claims-check command}}`
- {{commit attribution policy}}; {{process files private or public}}
- {{any machine quirk that has already cost time}}

**What is left, in order**
1. {{move}}: target {{criterion and score, e.g. Scalability 8 to 9}}. Done when {{acceptance}}.
2. {{move}}: target {{…}}. Done when {{…}}.
3. {{move}}: target {{…}}. Done when {{…}}.

**Standing instruction:** roll through the moves above without stopping to ask. For each: build, verify against the production preview, re-measure any number it touches, commit, then move to the next. Measure real numbers; never assert one. If something fails, it is a finding: investigate it, surface it, and do not quietly change frozen logic to make it pass. Stop only if genuinely blocked, and then say exactly what blocks you.

**Before you stop:** rewrite `## Handoff` in `BULLSEYE.md`, add a `▶ STATUS` block to `## Log`, update the status line, and commit.
