# The BULLSEYE method, in ten minutes

This is the human-readable version of what the skills tell your agent to do. Read it once before your next hackathon; it explains why the agent will ask you for certain things on day 1 and refuse others on the last night.

## The target

Picture an archery face. Default agent output lands in the 5 and 6 rings: it works, and it reads as generated. A competent team lands in 7 and 8: clean, safe, forgettable. Finalist work lands in 9 and 10: a judge understands it in two minutes, cannot break it, believes every number, and remembers one moment.

The gap between 6 and 9 is rarely more code. It is aim (the right problem, read against the rubric), proof (numbers that survive a skeptic), craft (a look drawn from the subject, not the template), and delivery (a package with nothing missing and a demo that cannot die). BULLSEYE is a procedure for those four.

## The flight

An entry moves through eight phases. Each has a skill, a product and a gate.

1. **Intake.** Read everything the organiser published: rules, criteria, limits, templates, the sponsor's guide. Convert deadlines to your time zone. Scan what won last time and what everyone else is building. Pick the problem for win probability. Write the contract (facts, deliverables, rules, rubric) and the thesis (the one claim you will defend). *Skill: brief-decoder.*
2. **Idea gate.** If the event shortlists on ideas, treat it as the real elimination round. Prove something even now: run the core on the organiser's data, or record a thin prototype. Write one narrative and render it three ways (brief, deck, form) with the same numbers, every one labelled. Submit early. *Skills: idea-round, pitch-deck.*
3. **Build.** Write the product file with the judge listed as a user. Lock the golden path: the six to eight beats a judge will see. Split the work so deterministic code computes anything checkable and the model only narrates. Deploy a skeleton in the first hours. Build the demo layer that cannot die. Work in named passes and freeze features at about two thirds of the window. *Skill: build-sprint.*
4. **Polish.** Choose a visual language from the subject's own world, build one signature moment, and run a sense, score, fix loop where a separate critic scores screenshots and measurements, never the builder's story. *Skill: missile.*
5. **Proof.** Inventory every claim. Measure each one with a script, write the values to one facts file, map each README claim to its measurement and its test, and run one command that fails on any drift. Evaluate against honest baselines with a held-out split fixed before any run. Write the limits down. *Skill: prove-it.*
6. **Judging.** Paste the problem statement, the rubric and the repo into a fresh session with no memory of the build. Let it reproduce your numbers and try to break the app. Check each finding against the code, fix what is real, record what is not, and end with a blind round. *Skill: judge-panel.*
7. **Package.** A README a judge can use in 60 seconds, paste-ready form answers, a video under the cap recorded from the production build, a deck rendered and checked like code, a final sweep for the slips that cost points, then submit early and tag the commit. *Skills: submission-pack, demo-video, pitch-deck.*
8. **Finale.** A runsheet with exact inputs and expected outputs, a timed script with a 90-second emergency cut, a question bank with honest limits first, and a pre-flight with a rule for when something breaks. Rehearse until it is boring. *Skill: finale-pitch.*

`bullseye` sequences these, and `hackathon-tracker` keeps the calendar when you are in several events at once.

## The control file

Everything lives in one file in your project, `BULLSEYE.md`: the contract, the thesis, the owner checklist, the plan, the claims, the judge rounds, the submission checklist, decisions, risks, the handoff and a log. Each skill reads it first and writes its own section. When a session ends, the agent rewrites the handoff so the next session, or a teammate's agent, picks up exactly where it stopped. By default the file stays out of your public repository: judges evaluate the product, not your plan for being judged.

## The loops

Four loops run inside the phases, not after them:

- **Proof loop:** any number that changes is re-measured, written to the facts file and checked against every document.
- **Judge loop:** a cold judge round after the first working build, after each major pass, and a blind one at the end.
- **Craft loop:** the critic scores after visual changes, from evidence at phone and desktop widths.
- **Copy loop:** submission copy is drafted at hour two and refreshed after every pass, so the final package is an edit, not a blank page.

## What only you can do

Agents cannot create accounts, accept terms, hold keys, make a repository public, pay, or press submit. These actions most often cap the final score when left to the end, so the agent hands you an owner checklist on day 1: register the team, create keys (and keep them out of chat), set production keys on the host, give your GitHub token the workflow scope, decide video hosting, arrange judge access, and approve how commits are attributed.

## What it will refuse

- Inventing a screen, a metric, a testimonial, a partner or a result.
- Typing a measured number by hand instead of re-measuring it.
- Editing the submission after the deadline.
- Building a tool that answers real judges live on your behalf.

The rules of the event always win over the playbook.

## Where the method came from

Every rule here was paid for in a real build; [field-notes.md](field-notes.md) tells the stories, and [the law with its evidence](../skills/bullseye/references/law.md) maps each rule to the event where it was learned.
