# {{Event}} · {{Round}} · submission form pack

> STATUS: DRAFT v{{n}}, not submitted
> Portal: {{portal}} · Deadline: {{YYYY-MM-DD HH:MM TZ}} (your clock: {{local time}}) · Edits after submitting: {{allowed until the deadline | locked}}
> Rule: paste plain text, field by field, in the form's order. Every number matches the Numbers table in idea/SPINE.md.

<!--
After submitting, replace the STATUS line with:
  SUBMITTED {{YYYY-MM-DD HH:MM TZ}} · under review. Next: {{next gate and its date}}.
The acknowledgement ID goes in BULLSEYE.md (private), never in a file that may be shared.

How this file works:
- One "## " heading per form field, in the form's order, with the field label copied exactly.
- Each field heading ends with its budget: (count/limit chars) or (count/limit words).
- The paste text is everything under a field heading up to the next heading. HTML comments like this one
  are neither pasted nor counted. Headings without a budget (Portal quirks, Uploads, ...) are not fields.
- Check it from the project root:
    node <idea-round skill folder>/scripts/form-check.mjs idea/SUBMISSION-FORM.md --fix --numbers idea/SPINE.md
  Add --forbid "<characters this portal strips>" and, when anonymity applies, --anon --terms "<names>".
-->

## Portal quirks

<!-- What this portal does to text and files, as you learn it. Seen in the field: a government portal's sanitizer
     stripped % ' ; from stored essays (write "per cent", rephrase apostrophes, no semicolons); an on-page counter
     and the server disagreeing about line breaks; uploads restricted to alphanumeric file names; the portal
     slowing down in the last hours before the deadline. -->

- {{quirk, and what we do about it}}

## Dropdown selections

<!-- The exact option text as the portal shows it. Choices that lock after submitting (category, host institute,
     theme) are confirmed with a human, and with the institute, before submitting. -->

| Form field | Select (exact option text) | Why | Locks after submitting |
|---|---|---|---|
| {{Theme}} | {{option}} | {{one line}} | {{yes / no}} |
| {{Category}} | {{option}} | {{one line}} | {{yes / no}} |

## 1. {{Title field label}} ({{n}}/{{limit}} chars)

<!-- Name + what it does + where it lands. When names are forbidden: what it is + what it does + for whom. -->
{{Name}} - {{what it does}}, {{where it lands}}

## 2. {{Solution and innovation field label}} ({{n}}/{{limit}} chars)

<!-- Hook: one dated incident with three numbers, then one analogy sentence with years.
     Product: "<Name> is <category> for <user>." One number. "Three outputs per <unit>: (1) ... (2) ... (3) ..."
     Then the human-in-the-loop guarantee and a quantified workload claim.
     "What makes it innovative:" three numbered ideas, each a name, the mechanism and why it matters. -->
{{paste text}}

## 3. {{Technologies, models and datasets field label}} ({{n}}/{{limit}} chars)

<!-- One paragraph per layer, each opening with its name and a colon ("Perception:", "Decision layer:", "Stack:").
     Say what runs today and what is the production path. End the stack paragraph on the deployment constraint.
     Close with "Datasets - our unfair advantage:": the source others lack, how labels are made, how it transfers,
     the real validation set. -->
{{paste text}}

## 4. {{Validation field label}} ({{n}}/{{limit}} chars)

<!-- "We declare our targets before we build, and measure them on data the model has never seen:" then 3 targets.
     Ground truth, plus an independent second label source. The transfer gap, reported separately. Calibration.
     Feasibility proven live: the demo as a chain of steps, the hardware, the backup video.
     The benchmark against the incident's own baseline. -->
{{paste text}}

## 5. {{Field with a word limit}} ({{n}}/{{limit}} words)

<!-- Delete the fields this form does not have; add one heading per extra field, in the form's order. -->
{{paste text}}

## Uploads

| Upload field | File | Size and cap | Notes |
|---|---|---|---|
| {{Idea PDF}} | `{{AlphanumericName}}.pdf` | {{x.x MB of y MB}} | {{vector, fonts embedded}} |
| {{Block diagram}} | `{{AlphanumericName}}.pdf`, PNG backup kept | {{}} | {{one page}} |

- [ ] File names follow the portal's rule (alphanumeric only when it asks: no spaces, no symbols)
- [ ] Every file is under its cap, with margin
- [ ] Vector PDF, with a PNG backup kept in case the portal wants an image
- [ ] Metadata checked: PDF title, author, creator; Office author and last-modified-by
- [ ] Anonymity applies: no names, contacts, institution, brand or logos inside the files or their metadata
- [ ] Every exported file opened, and every page looked at

## Links

| Field | URL | Opens in a logged-out browser |
|---|---|---|
| {{Repository}} | {{url}} | {{yes / no}} |
| {{Video}} | {{url, unlisted}} | {{yes / no}} |

## Pre-submit checklist

- [ ] form-check exits 0 with this portal's --forbid characters, and with --anon when anonymity applies
- [ ] form-check --numbers reports nothing missing from idea/SPINE.md
- [ ] Hardening pass done; the Claims changed table in idea/SPINE.md is current
- [ ] Locked choices confirmed with a human (category, host institute, theme)
- [ ] Submitting at least 24 hours before the deadline, or v1 early when edits are allowed
- [ ] The person who submits has the login, the files and this pack open in the form's order

## After submitting

- [ ] Every stored field re-read against this file; differences noted under Portal quirks
- [ ] Screenshot or download of the submitted view kept
- [ ] STATUS line above changed to SUBMITTED, with time and timezone
- [ ] Acknowledgement ID, files with sizes and the next gates recorded in BULLSEYE.md
