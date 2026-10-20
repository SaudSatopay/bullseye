# FAQ

## Is it allowed to use this in a hackathon?

Check the event's rules first; they always win. Many events allow AI coding assistants and ask you to describe how you used them; BULLSEYE's README template has a plain "Team and AI assistance" section for exactly that. Some events restrict pre-existing work, require code written inside the window, or forbid AI altogether. BULLSEYE is a method and a set of templates, not pre-built project code, but if an event bans AI assistance, do not use an agent at all.

## Does it make the agent build everything for me?

No. It makes the agent aim, build, prove and package to a finalist standard, and it hands you the things only a human can do: accounts, keys, repository visibility, judge access, the pitch, and pressing submit. Teams still decide what to build and why; the playbook makes that decision explicit (`## Thesis`) and holds the build to it.

## Will judges see that I used it?

Only what you choose to show. By default the planning files (`BULLSEYE.md`, judge prompts, design notes) stay out of the public repository, and the README discloses AI assistance in plain words. What judges see is the product, the evidence and the story.

## Is the judge simulation the same as cheating the judges?

No. It is a red team: a fresh session attacks your build the way a skeptical jury would, before the jury does. What BULLSEYE refuses to do is put an AI between you and real judges during live judging. Rehearse with the mock judge; answer the real ones yourself.

## Does it only work for web apps?

The flight works for any build hackathon. The polish loop (`missile`) is strongest for web interfaces; mobile apps use simulator or device screenshots instead of browser sensors, and the `build-sprint` skill covers release builds on real devices. ML and data projects lean on `prove-it` (held-out evaluation, baselines, intervals). Hardware entries should ship a simulator that speaks the same protocol as the device, so judges can see the whole path without soldering anything.

## What about idea-only rounds and proposals?

`idea-round` and `pitch-deck` cover them: concept briefs, idea decks, organiser templates and form answers, with proof attached even when no code is required.

## We are a team. Does each person need it?

Each person's agent should have the skills installed. The `build-sprint` team mode sets up lanes by directory, contract-first API changes and claim-by-push task locks, so several agents can work on one repository without collisions.

## Does it cover CTFs or algorithm contests?

No. BULLSEYE is for build hackathons judged on a product, a pitch and a submission. The tracker skill can still keep a CTF's dates in your calendar.

## How long does a full flight take?

As long as the event. The time budgets in `skills/bullseye/SKILL.md` scale each phase to the format, from an 8-hour onsite sprint to a multi-week online event. Intake takes 30 minutes to a day; packaging always gets its share, because a great build with a broken submission scores zero.

## Which agent works best?

Claude Code gets everything, including the five subagents (the critic, the judge and the claims auditor run in fresh contexts by design). Codex, Cursor, Gemini CLI and others get every skill; the fresh-context steps run in a new session with the prompt from the skill's `assets/`.
