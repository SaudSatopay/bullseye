# Changelog

## 1.0.0 · 2026-10-20

First public release.

- Twelve Agent Skills covering a whole hackathon: `bullseye` (flight director), `brief-decoder`, `idea-round`, `pitch-deck`, `build-sprint`, `missile`, `prove-it`, `judge-panel`, `demo-video`, `submission-pack`, `finale-pitch`, `hackathon-tracker`.
- Five Claude Code subagents: `missile-recon`, `missile-critic`, `missile-builder`, `hackathon-judge`, `claims-auditor`.
- `missile` 1.1.0: adds `sense.mjs`, a one-command evidence pass (screenshots at 390 and 1440 in both colour schemes, overflow, console errors, keyboard walk, 4x CPU performance).
- Bundled scripts, each with `--help` and tests: `tminus` (deadlines on your clock), `form-check` (portal limits), `demo-check` and `run-demo` (the demo layer), `claims-check`, `latency-bench` and `bootstrap-ci` (proof), `sense`, `recon` and `scorecard` (polish), `evidence-pack` and `judge-round` (judging), `record-demo` and `voiceover` (video), `render-pdf`, `finalize-pdf`, `qa-pdf`, `pages-to-pptx` and `pptx_kit` (decks), `final-sweep`, `readme-preview` and `qr` (submission).
- Claude Code plugin and marketplace manifests; installable as Agent Skills with `npx skills add SaudSatopay/bullseye`.
- Repository validator and tests for every bundled script.
