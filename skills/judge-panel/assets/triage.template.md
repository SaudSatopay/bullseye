# Triage · round {{round}} · {{type}}

Recorded {{date}} · weighted {{score}} · scorecards: {{scorecards}}

<!-- scripts/judge-round.mjs creates this file from assets/triage.template.md when it records a round. Fact-check EVERY finding against the code before fixing anything: open the file:line, rerun the probe, read the test. Judges are wrong at times. The next evidence pack reads "## Non-issues", "## Fixes" and "## Next round" from this file, so keep those headings. -->

## Findings

<!-- Verdict: substantiated | partial | non-issue | declared (already in LIMITS.md) | duplicate. "Checked" is what YOU ran or read to decide. Commit: the SHA that fixed it. -->

| Id | Severity | Finding | Where | Judge's fix | Verdict | Checked | Commit |
|---|---|---|---|---|---|---|---|
{{findings_rows}}

## Non-issues

<!-- Everything a judge flagged that the code shows is fine, with the proof (file:line, command output). The judge's own "checked and held up" list is pre-filled below; add every false flag you found. The next judge receives this list as "do not re-flag". -->

{{judge_non_issues}}

## Fixes

<!-- One line per fix: what changed, then "Check:" and the one step that shows it (a command, a URL, a file:line). The verify-fixes prompt quotes this list as written. Example: "1. The response modal and its payload say prepared, not sent. Check: GET /api/response returns status ready (api/response.py:77)." -->

## Not fixed (deliberately)

<!-- Each with the reason. Copy a dated line to BULLSEYE.md ## Decisions. -->

## Gates

<!-- Re-run every gate after the fixes. The numbers must match the "Before" column unless a fix changed them on purpose; say why. -->

| Gate | Command | Before | After |
|---|---|---|---|
| tests | | | |
| claims check | | | |
| golden path | | | |
| production build | | | |

## Next round

<!-- First line: "Type: verify-fixes", "Type: newest-surface" or "Type: blind". Then each newest surface in bold, with two to four fair questions to press, for example: "- **Fleet cost curve** (GET /api/fleet/scale): is one core for 1,000 plants honest or a sleight of hand? Does the diagram match the endpoint?" The newest-surface prompt quotes this section as written. -->
