<!-- guide: The judge-first README. A judge decides on the first screen, clicks the first link and checks one number, so keep this order. Every number comes from facts.json (sibling skill prove-it): keep the {{placeholder}} until the number is measured, because the final sweep fails while any is left. Delete every guide comment before you submit; the sweep warns on leftovers. Headings marked (required) are the ones most events and the sweep config expect. -->

<!-- guide: Hero. Use the live OG image (https://<host>/opengraph-image) or public/og.png rendered from the design tokens, so the README matches production. The alt text states the claim and the numbers printed on the image. -->
<p align="center">
  <a href="{{live_url}}">
    <img src="{{og_image}}" width="100%" alt="{{og_alt_text}}">
  </a>
</p>

<h1 align="center">{{project}}</h1>

<!-- guide: One bold claim sentence: what it does, for whom, with the number that makes it checkable. Shape: "When <situation>, <project> <verb> <outcome>." -->
<p align="center">
  <b>{{claim_sentence}}</b>
</p>

<!-- guide: Badges are claims. Each carries a real number and links to where that number is proven. shields.io escaping: "-" is "--", "_" is "__", a space is "_", "/" is "%2F". Colours are palette tokens without "#". No badge for a number nobody can check, and no CI badge unless CI runs. -->
<p align="center">
  <a href="{{live_url}}"><img alt="Live demo: {{live_host}}" src="https://img.shields.io/badge/live_demo-{{live_host_badge}}-{{accent_hex}}?style=flat-square&labelColor={{ink_hex}}"></a>
  <a href="{{event_url}}"><img alt="{{event}}: {{track}}" src="https://img.shields.io/badge/{{event_badge}}-{{track_badge}}-{{accent_hex}}?style=flat-square&labelColor={{ink_hex}}"></a>
  <a href="CLAIMS.md"><img alt="Claims re-measured: {{claims_passed}} of {{claims_total}}" src="https://img.shields.io/badge/claims_re--measured-{{claims_passed}}%2F{{claims_total}}-{{accent_hex}}?style=flat-square&labelColor={{ink_hex}}"></a>
  <a href="#proof"><img alt="Tests: {{tests}} passing" src="https://img.shields.io/badge/tests-{{tests}}_passing-{{accent_hex}}?style=flat-square&labelColor={{ink_hex}}"></a>
</p>

<!-- guide: Two large links: the video, and the build story or blog when there is one. Both must open in a private window, logged out. Delete the blog link when there is no post. -->
<p align="center">
  <a href="{{video_url}}"><img alt="Watch the demo on YouTube" src="https://img.shields.io/badge/watch_the_demo-YouTube-{{accent_hex}}?style=for-the-badge&labelColor={{ink_hex}}"></a>
  &nbsp;
  <a href="{{blog_url}}"><img alt="Read the build story" src="https://img.shields.io/badge/read_the_build_story-{{blog_host_badge}}-{{accent_hex}}?style=for-the-badge&labelColor={{ink_hex}}"></a>
</p>

<!-- guide: Deep links land each page in the state worth seeing (?scenario=, ?demo=, ?autorun=1, ?step=). One click and the product is already working. Open every one logged out before you submit. -->
<p align="center">
  <a href="{{deep_link_1}}"><b>{{page_1}}</b></a> &nbsp;·&nbsp;
  <a href="{{deep_link_2}}"><b>{{page_2}}</b></a> &nbsp;·&nbsp;
  <a href="{{deep_link_3}}"><b>{{page_3}}</b></a> &nbsp;·&nbsp;
  <a href="#proof"><b>Proof</b></a>
</p>

<!-- guide: After the deadline only. Put this callout here and add the "After the deadline" section below Evidence (references/integrity.md):
> [!IMPORTANT]
> **The entry submitted before the deadline is [v1.0.0](https://github.com/OWNER/REPO/tree/v1.0.0)**, tagged on DATE at TIME TZ (the deadline was TIME TZ), with [its README](https://github.com/OWNER/REPO/blob/v1.0.0/README.md). This page describes the current version, which adds work done after the deadline: see [After the deadline](#after-the-deadline).
-->

<!-- guide: What it does as three to five numbered verbs, each with its measured result, then one sentence on the mechanism that makes the claim hold. -->
{{context_sentence}} When {{trigger}}, {{project}}:

1. **{{verb_1}}** {{result_1}}.
2. **{{verb_2}}** {{result_2}}.
3. **{{verb_3}}** {{result_3}}.

{{mechanism_sentence}}

## For judges: 60 seconds

<!-- guide: (required) Three or four numbered deep-link clicks. Each says what to do and what to look for, with the number the judge will see. End with the one caveat a judge should know: a free-tier model quota, a cold start, sample data. -->

1. **[{{action_1}}]({{deep_link_1}})**. {{look_for_1}}.
2. **[{{action_2}}]({{deep_link_2}})**. {{look_for_2}}.
3. **[{{action_3}}]({{deep_link_3}})**. {{look_for_3}}.
4. **[Open the proof]({{proof_url}})**, or re-measure every number yourself: `{{claims_command}}` checks the README's {{claims_total}} headline claims and fails loudly on any mismatch ([CLAIMS.md](CLAIMS.md)).

{{caveat_sentence}}

## Evidence

Every result below is committed with the script that produced it; {{proof_place}} shows each one with its method.

<!-- guide: What was tested | Result, against honest baselines: the same model without your tool, a rules-only floor, the organiser's own baseline run through the same pipeline. Put the held-out size, how the split was made, the confidence interval and the losses in the cells. A result that went against you appears here and in "Where we lose". -->

| What was tested | Result |
|:---|:---|
| **{{test_1}}** ({{test_1_set}}) | {{test_1_result}} |
| **{{test_2}}** ({{test_2_set}}) | {{test_2_result}} |
| **Tests** | {{tests}} tests: {{what_tests_pin}} |

## The judging criteria, point by point

<!-- guide: The organiser's own words for each criterion, its weight, and where a judge sees the evidence: a link, a file or a command, never an adjective. Copy them from BULLSEYE.md (Contract, Judging). When the event publishes guidance instead of a rubric, title the columns "What the organisers' guide asks for | In <project>". -->

| Criterion | Weight | Where to see it |
|:---|:---:|:---|
| {{criterion_1}} | {{weight_1}} | {{evidence_1}} |
| {{criterion_2}} | {{weight_2}} | {{evidence_2}} |
| {{criterion_3}} | {{weight_3}} | {{evidence_3}} |

| Track | Where to see it |
|:---|:---|
| **{{track}}** | {{track_evidence}} |

## What it does

<!-- guide: Captioned screenshots from the production build (a dev-server capture shows the Next.js dev badge), 1440 px desktop and 390 px phone, at device scale factor 2. Alt text says what the screen shows and its numbers, never "screenshot". Show the negative case when you have one (the quiet day that sends zero alerts). Re-shoot every image in the same change as any redesign. -->

<p align="center">
  <img src="docs/images/{{screen_1}}.png" alt="{{screen_1_alt}}">
  <br>
  <sub><b>{{screen_1_name}}.</b> {{screen_1_caption}}</sub>
</p>

<table>
  <tr>
    <td width="37%" align="center">
      <img src="docs/images/{{phone_screen}}.png" width="100%" alt="{{phone_alt}}">
      <br>
      <sub><b>On a phone.</b> {{phone_caption}}</sub>
    </td>
    <td width="63%">
      <img src="docs/images/{{screen_2}}.png" width="100%" alt="{{screen_2_alt}}">
      <br>
      <sub><b>{{screen_2_name}}.</b> {{screen_2_caption}}</sub>
    </td>
  </tr>
</table>

<!-- guide: Optional: a 9 fps, 720 px GIF of the signature flow (references/media-specs.md), linked to the live page, with the video link under it. -->

## How it works

<!-- guide: One diagram in the palette. This pattern was render-checked in GitHub's light and dark themes: keep GitHub's own per-theme text colours, make every fill transparent, put the accent on the strokes of the main path, and dash anything not built yet, labelled "(planned)". A themeVariables init line fixes one palette for both themes; read references/readme-for-judges.md before you use one. If Mermaid cannot carry the design, render an architecture HTML page to PNG at 2x instead (sibling skill pitch-deck). Follow the diagram with three or four bolded rules that make the claims hold, and check both themes with scripts/readme-preview.mjs. -->

```mermaid
flowchart LR
    user(["{{who_starts_it}}"]) --> app["{{app_name}}"]
    app -- "{{typed_tools}}" --> engine["{{deterministic_engine}}"]
    app -- "{{prompt}}" --> model["{{model}}<br/>chooses tools, explains"]
    engine --> store[("{{data_store}}")]
    app -.-> later["{{next_integration}}<br/>(planned)"]
    classDef default fill:transparent,stroke:#8b949e
    classDef accent fill:transparent,stroke:{{accent_css}},stroke-width:2px
    classDef planned stroke-dasharray:5 4
    class app,engine,store accent
    class later planned
    linkStyle default stroke:{{accent_css}}
```

- **{{rule_1_bold}}** {{rule_1}}
- **{{rule_2_bold}}** {{rule_2}}
- **{{rule_3_bold}}** {{rule_3}}

## Why {{sponsor_tech}}

<!-- guide: Answer the organiser's question head-on: does it still work without the sponsor's tech? If the honest answer is yes, the tech is decoration; fix the product, not this paragraph. Then one row per question only this tech answers well here, with the primitive and the number it produced. -->

Does {{project}} work without {{sponsor_tech}}? {{sponsor_answer}}

| Question | How {{sponsor_tech}} answers it |
|:---|:---|
| **{{question_1}}** | {{answer_1}} |
| **{{question_2}}** | {{answer_2}} |

## Where we lose

<!-- guide: Results that went against you, or that you cannot show yet, each with its number: the baseline that ties you, the case you get wrong, the free-tier limit, the sample data. Say them before a judge finds them. After the deadline, corrections go here and end with "The submitted v1.0.0 still has the error." -->

Results that went against {{project}}, or that it cannot show yet:

- **{{loss_1}}.** {{loss_1_detail}}
- **{{loss_2}}.** {{loss_2_detail}}

## Proof

| Check | Result |
|:---|:---|
| `{{claims_command}}` | {{claims_passed}} of {{claims_total}} README claims re-measured and matched ([CLAIMS.md](CLAIMS.md)) |
| Unit tests | {{tests}} tests: {{what_tests_pin}} |
| End-to-end tests | {{e2e_result}} |
| Lighthouse, mobile ({{routes}}) | Performance {{perf_score}}; accessibility, best practices and SEO {{other_scores}} |

## Run it locally

<!-- guide: (required) It works without keys: the default path runs a labelled demo, replay or scripted mode. The commands are the ones you verified from a fresh clone in a new folder. Local URLs stay inside code blocks, because a clickable localhost link is dead for a judge. -->

Requirements: {{runtime_and_version}}. No API key is needed for the demo mode; {{what_a_key_adds}}.

```bash
{{install_command}}
cp .env.example .env.local   # optional: keys for live mode, each explained in the file
{{run_command}}
```

| Command | What it checks |
|:---|:---|
| `{{test_command}}` | {{test_command_checks}} |
| `{{claims_command}}` | Re-measures the README's headline claims; fails on any mismatch |

## Data

<!-- guide: Every source linked, with its licence and the date it was read. Sample, synthetic and simulated data labelled as such here and on screen. End with "not affiliated with" when you use an organisation's data or name. -->

{{data_sources}} {{sample_data_note}} {{project}} is not affiliated with {{organisation}}.

## Team and AI assistance

<!-- guide: Plain disclosure. Say what the coding agent did, what the people did, and how the output is verified. A judge will ask "What did the AI build?", and this paragraph and BRIEFING.md must give the same answer. When the event requires a named section (for example "Codex collaboration"), use that exact heading and include what it asks for (session IDs, a log). -->

{{project}} is the {{event}} entry of {{team}}.

{{project}} was built with {{coding_agent}} as a pair programmer: it did much of the {{agent_share}} under our direction. {{runtime_models_sentence}} {{verification_sentence}}

## License and credits

{{license_name}} (see [LICENSE](LICENSE)). Type: {{fonts_and_licences}}. Photos: {{photo_credits}}. UI components: {{ui_kit_licences}}. Data: {{data_licences}}. Started from: {{template_or_prior_work}}.
