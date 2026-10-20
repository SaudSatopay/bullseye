# {{project}}: {{event}} submission form

Paste-ready answers, field by field, in the form's order, in plain text (the form's boxes do not render markdown). Every number matches the README and the proof page. The feedback answers are written in your voice; change anything that does not match your own experience.

<!-- guide: Private by default (it is in the process-file block of .gitignore), because it holds coaching. Copy each field name exactly as the form shows it, in the form's order, from BULLSEYE.md (Contract) or the form itself. Put the field's limit in its heading as "(used/limit chars)" and fill 91 to 97 percent of it: the final sweep fails an answer over its limit and warns when the stated count is stale. Numbers come from facts.json. Write the first draft at hour 2 of the build and refresh it in the polish pass. -->

Form: {{form_url}} · Deadline: {{deadline_official}} ({{deadline_local}}) · Submit by: {{internal_deadline}}
Submitted: {{submitted}}

## Part 1 of {{parts}}: Project details

### Project title * ({{used}}/{{limit}} chars)

<!-- guide: The name, then what it does in a few words, then where it lands. -->
{{project}}: {{what_it_does}}

### Tagline * ({{used}}/{{limit}} chars)

{{tagline}}

### Description * ({{used}}/{{limit}} chars)

<!-- guide: In this order: the problem with its numbers; who it is for; what it does, as numbered outputs; how it works; what makes it different; proof, measured against baselines; what is real data and what is sample data. Some forms render Markdown (Devpost's project story does); most boxes do not, so test with the form's preview before you use any. -->
{{description}}

### Track(s) *

{{tracks}}

### How did you use {{sponsor_tech}}? * ({{used}}/{{limit}} chars)

<!-- guide: Meaningful use, not a wrapper. Three parts: the primitives you use (where in the code, what each does), why that is real use, and what you did not have to build because of it. In a plain-text box keep one line per primitive and write the last line as "No separate X, Y or Z". In a Markdown box the strikethrough renders. -->
{{sponsor_tech}} primitives we use:
- {{primitive_1}}: {{where_1}}, {{what_1}}.
- {{primitive_2}}: {{where_2}}, {{what_2}}.
- {{primitive_3}}: {{where_3}}, {{what_3}}.

Why this is meaningful use, not a wrapper:
- {{reason_1}}
- {{reason_2}}

What we did not have to build: ~~{{thing_1}}~~ · ~~{{thing_2}}~~ · ~~{{thing_3}}~~

### Business model * ({{used}}/{{limit}} chars)

<!-- guide: Only when the form asks or the rubric scores impact or viability. Label every money figure that is not measured as illustrative. Drop pricing when the event co-owns the IP. -->
Who pays and why: {{buyer_and_pain}}
Revenue: {{revenue_streams}}
Defensibility: {{defensibility}}
Go-to-market: {{go_to_market}}

### Built with

{{stack_tags}}

### Links

<!-- guide: Open each link logged out, in a private window and on a phone, and record the time in BULLSEYE.md (Submission). If the form has no live-URL field, append the live link to the description. -->
- Repository: {{repo_url}} (public since {{repo_public_date}})
- Live demo: {{live_url}} ({{live_note}})
- Demo video: {{video_url}} ({{video_visibility}}, {{video_length}})
- Deck: {{deck_file}} ({{deck_pages}} pages, {{deck_mb}} MB, cap {{deck_cap}})
- Blog: {{blog_url}}

### AI tools used *

<!-- guide: The same plain answer as the README's "Team and AI assistance" section: what the coding agent did, what the people did, how the output is verified. -->
{{ai_disclosure}}

### Pre-existing work *

<!-- guide: "Built from scratch for this hackathon" only when true. Otherwise say what existed before the window and what was built during it, and name the tag or commit that marks the line. -->
{{prior_work}}

### Team

<!-- guide: Roles only. The owner types names, emails and phone numbers into the form; they never go into a file. -->
{{team_roles}}

## Part 2 of {{parts}}: Feedback

### What did you like about {{sponsor_tech}}? *

<!-- guide: In the owner's voice. Name the primitive, what it saved you, and a number. -->
{{liked}}

### What improvements would you like to see in {{sponsor_tech}}? *

<!-- guide: Specific technical asks, each with the workaround you built because it was missing. -->
- {{ask_1}}
- {{ask_2}}

## The form's checklist

<!-- guide: One row per R line of the requirements gate in BULLSEYE.md (Contract). Generate the rows with: node "<submission-pack>/scripts/final-sweep.mjs" . --gate-table. Fill "Where it is" with a link, or a file and its section. Tick the R line in BULLSEYE.md once its check passes; the sweep fails while a [hard] line is open. -->

| Requirement | Where it is |
|---|---|
| {{requirement}} | {{where}} |

## Before the owner presses Submit

- [ ] Final sweep exits 0 with `--check-links`, and the claims check (sibling skill prove-it) shows no mismatch
- [ ] Every link above opened logged out, in a private window and on a phone
- [ ] Video under {{video_cap}}, unlisted or public, plays in a private window
- [ ] Every upload under its cap: {{uploads}}
- [ ] Every number here matches facts.json and the README
- [ ] Tracks ticked; the owner has read the terms
- [ ] Submission commit tagged {{tag}} and the tag pushed
