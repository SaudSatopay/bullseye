# {{Project}} · Q&A bank

<!-- Private: keep this file gitignored. Rehearse it with a mock judge (the judge-panel skill's qa mode); never feed it
     to an AI that listens to the real judging call. Every number here must match facts.json and carry the caveat
     printed beside it in CLAIMS.md. Every answer points at something committed. -->

## Rules

- Answer in the first sentence. Then the evidence. Then the caveat.
- LIVE: 2 to 5 speakable sentences. SHOW: one thing on screen. IF PUSHED: one line of deeper defense.
- About 30 seconds an answer. One person answers; hand off by name to whoever built that part.
- Never quote a number without its caveat. Never claim what has no committed file, test or command behind it.
- Concede what is true, then pivot to what is strong.
- When you do not know, say so, say how you would find out, and offer to follow up.

## One sentence to remember

{{The single sentence a judge should repeat to the next judge.}}

## Numbers at a glance (re-verified {{date}})

{{n}} tests · {{metric}} on {{set}} (n = {{size}}) · {{latency}} p50 · {{count}} {{things}} · {{the negative-case number}}

## Honest limits (say these before judges find them)

| # | Limit | Why it is so today | Roadmap line |
|---|---|---|---|
| L-1 | {{what does not work or is not built}} | {{the honest reason}} | {{what fixes it, and when}} |
| L-2 | {{the data is synthetic / reconstructed / simulated}} | | |
| L-3 | {{a free-tier or platform limit}} | | |

## What did the AI build? (say it plainly; know every row)

| Part | Written by | Verified by |
|---|---|---|
| {{part}} | {{assistant / team member role}} | {{test, command or review}} |

## Questions by persona

### Technical judge

**Q: Where does {{the agent / model}} actually run? Show me it's real.**
LIVE: {{2 to 5 sentences}}
SHOW: {{the terminal run or the live trace}}
IF PUSHED: {{one line}}

**Q: How is this more than a CRUD app with a chatbot?**
LIVE:
SHOW:
IF PUSHED:

**Q: What breaks at {{10,000}} a day?**
LIVE:
SHOW:
IF PUSHED:

### Business, founder or VC judge

**Q: Who pays, and why would they pay today?**
LIVE:
SHOW:
IF PUSHED:

**Q: What's the business model?**
LIVE:
SHOW:
IF PUSHED:

### Domain expert or regulator

**Q: Is this real data?**
LIVE: {{the layers, each labelled: live, reconstructed, scripted}}
SHOW: {{the live tab or the provenance file}}
IF PUSHED:

**Q: What happens when {{the input is missing / the feed drops / it is 3 a.m.}}?**
LIVE:
SHOW:
IF PUSHED:

### Sponsor judge

**Q: Does it still work without {{sponsor tech}}?**
LIVE:
SHOW:
IF PUSHED:

**Q: What friction did you hit with {{sponsor}}? Be honest.**
LIVE: {{two specific issues and the workaround; what held up}}
SHOW:
IF PUSHED:

### Skeptic

**Q: What's your accuracy?**
LIVE: {{metric, set, size, the misses published, the caveat}}
SHOW: {{EVAL.md or the proof page}}
IF PUSHED:

**Q: Why won't it cry wolf?**
LIVE:
SHOW: {{the negative case, live}}
IF PUSHED:

**Q: What's mocked right now?**
LIVE: {{the exact list, and the flag that marks it}}
SHOW:
IF PUSHED:

### Team and process

**Q: Who did what?**
LIVE: {{one factual line per person}}
SHOW: {{the commit history}}
IF PUSHED:

**Q: What would you build next with one more week?**
LIVE:
SHOW:
IF PUSHED:

## Rehearsal log

| Date | Asked by | Question | Seconds | Miss (no caveat, too long, unsupported claim, no first-sentence answer) | Fixed in the bank? |
|---|---|---|---|---|---|
| {{date}} | {{mock judge / teammate}} | | | | |
