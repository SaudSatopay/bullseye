# What {{project}} does not do

<!-- Public file. Commit it and link it from the README's "Where we lose" section. Write it from runs, not from imagination: every limit below should point at a command, a measured number, an error message pasted verbatim, or a file and line. -->

Every limitation below was found by running the system, not by reading about it. Where a limit comes from a vendor's documentation it is quoted verbatim, because paraphrasing a limitation is how it gets softened. If {{project}} is wrong about something, we would rather you find it here than in front of a user.

## 0. What this document got wrong about itself

<!--
Write this section last and keep it. List the overclaims that earlier versions of this file, the README, the deck or the code comments made, who caught them and when. The common tell: the prose stayed accurate while code comments and docstrings drifted into fiction, so honesty was applied exactly where it would be graded.
If no adversarial reader has reviewed the repo yet, say so in one line and leave the section in place.
-->

- {{date}}: {{what an earlier version claimed}}. {{Who caught it (review round, reader)}}. {{What changed}}.

## 1. Known limits

<!-- One subsection per limit. Plain statement as the heading. Status is one of: fundamental (no layer can fix it) · fixable, not fixed (say what it needs) · deliberate trade-off (say what was bought with it) · demo affordance (say what the real version does). -->

### 1.1 {{The limit, stated plainly: "Accuracy on unseen scam families is 62.5%, not 90%"}}

**Status:** {{fundamental | fixable, not fixed | deliberate trade-off | demo affordance}}

{{What fails, with the number or the error text pasted verbatim. Why it fails. What we do about it now, and what would fix it.}}

### 1.2 {{The offline mode is worse, not equivalent}}

**Status:** demo affordance

{{What the offline or fixture mode replaces, how it differs from the live path, and how the output says which mode ran (for example `offline: true`, `llm_used: false`, a mode chip in the UI).}}

## 2. Bugs a hostile reader found

<!--
Each entry is a claim this repo made in writing while the code did the opposite. Keep fixed bugs listed: the record of what was assumed is the point. Name the file and line so a reader can check.
-->

### 2.1 `{{path/to/file.ext}}:{{line}}`: {{what the docs or comments claimed}}, {{what the code did}}

- **Found by:** {{review round or reader}}, {{date}}
- **Live effect:** {{what would have happened to a user or a judge}}
- **Fixed:** {{commit}}; pinned by `{{test_name_that_reads_as_the_claim}}`
- **What survives:** {{the narrower claim that is still true, or "the original claim, now tested"}}

**The pattern behind these:** {{the general lesson. A common one: the test or demo that accompanied each claim was shaped to avoid the breaking input, because it was written from the same mental model that produced the bug.}}

## 3. What the demo does not prove

<!-- For every demo beat and every control-group run: the claim it seems to support, and the narrower claim it actually supports. If the control group changes two things at once, say so and say which one matters. -->

| Demo or exhibit | What it seems to show | What it actually shows |
|:---|:---|:---|
| {{The control run with --unsafe}} | {{"the transaction is what prevents the double refund"}} | {{"two independent guards, either of which suffices"}} |
| {{Reconstructed incident replay}} | {{"it would have caught the real incident"}} | {{"on the inquiry's published timeline, with the context overlaid by us, it alerts 10 minutes earlier"}} |

## 4. Things we did not build

Named so you can tell a decision from an oversight.

- **{{Thing}}.** {{Decision: why not, and what it would cost or risk.}} or {{Real gap: what it needs, honestly (a lawyer, real data, a partner, a week).}}
- **{{Thing}}.** {{...}}

## 5. Wording we hold ourselves to

| We say | We do not say |
|:---|:---|
| prepared, not yet run | tested, validated |
| reconstructed from the public inquiry | validated on the real incident |
| no known risk found | safe |
| simulated, on {{n}} replays with seed {{42}} | proven in the field |
| target | result |
| illustrative mockup | the product |
