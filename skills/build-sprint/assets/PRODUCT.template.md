# {{Product}} · product

<!--
Owner: build-sprint (step 0). Every skill and every builder reads this before touching the product.
Process file: gitignored when BULLSEYE.md says process=private (the default).
Keep it to one screen. When a line here changes, write the reason under ## Decisions in BULLSEYE.md.
-->

## One-liner

{{One sentence that makes a claim with a verb or a number, not a greeting. Example shape: "<Who> gets <outcome> in <time>, because <mechanism>."}}

## Who it is for

1. **{{Primary user}}**, {{where they are and what they hold: a phone on a boat, a laptop at a desk}}. Wants to know: {{the question they ask in their own words}}.
2. **{{Secondary user}}**, who needs {{what this role needs from the same evidence}}.
3. **The judge** ({{event}}, {{track or problem id}}) with two minutes and a laptop, who needs to see that this is a reasoning system and not a chatbot. <!-- Adapt the last clause to the product type: "that the numbers are measured, not claimed", "that the graph does work nothing else could". -->

## The three jobs

1. **{{Verb}} {{the core answer}}**: {{how it is decided and what makes it trustworthy}}.
2. **{{Verb}} {{the follow-through}}**: {{the action the user takes next, with the human step if it spends, sends or publishes}}.
3. **Show the working**: {{the trace, the evidence ledger, the sources, the mode labels; simulated data always labelled}}.

## The signature moment

{{One paragraph: what goes in, what the judge sees happen, in what order, and why it is the whole claim in a few seconds. It runs on the real pipeline, and its static final state is complete without any animation.}}

## What {{Product}} is not

- Not a chatbot. The language model never decides {{the thing a judge can check: the verdict, the price, the score, the route}}.
- Not {{an official advisory / financial advice / a medical device / a certified system}}. It is {{decision support}} and says so on every screen.
- Not {{the over-promise people will assume: a guarantee, full automation, a replacement for the expert}}.

## Out of scope

- {{Feature people will ask for, and why it is out}}
- {{Integration that is only "interface ready", with the honest reason}}
- {{Accounts, auth, payments, a second platform}}

## Must never break

<!-- These are rehearsed and asserted by the smoke test. Fill each number the first time the engine produces it, with the date. -->
- The rehearsed scenarios (`/?demo=<scenario>`) and their numbers: {{scenario}} {{number and label}}, {{scenario}} {{number and label}}, {{negative scenario}} {{stays quiet}}. Verified {{YYYY-MM-DD}}.
- Demo mode running with no network and no API key.
- The one-command launch (`run-demo.sh` / `run-demo.bat`) from a fresh clone.
- {{Parity: every user-facing string exists in {{languages}}}}
- Nothing a judge must read hides behind an animation that might not run.
- The line "{{disclaimer, for example: decision support, not an official advisory}}".

## Who decides what

<!-- The split from build-sprint step 2. No row may give the model a number a judge sees. -->

| Layer | Who does it | Why |
|---|---|---|
| {{Read the messy input: language, voice, photos}} | the model | {{it is good at this, and a miss is visible and recoverable}} |
| {{Pick the next tool}} | the model | {{judgment over a fixed menu of typed tools}} |
| {{Compute the verdict, price, score or route}} | deterministic code | {{a judge can recompute it; it must reproduce}} |
| {{Explain the result in plain words}} | the model, from given facts | {{prose is where it adds value; every figure is checked against tool results}} |
| {{Approve the spend, the send, the publish}} | a human | {{the approval step is the trust story}} |
| {{Persist, audit, notify}} | functions | {{the agent judges, it does not write}} |
