# Platform gotchas

Each row cost a real build real hours. Read the sections for your stack on day 1, before they bite. Every row is the symptom you will see, the cause, and the fix that worked.

## 1. Packages and builds

| Symptom | Cause | Fix |
|---|---|---|
| `pnpm install` stops with `ERR_PNPM_IGNORED_BUILDS`, then every `pnpm` command fails | pnpm 10 and later block dependency build scripts until approved; pnpm 11 fails the install | right after scaffolding, `pnpm approve-builds --all`; later approve by name (`pnpm approve-builds esbuild sharp`), commit `pnpm-workspace.yaml`, log the names under Decisions |
| The host's production build fails while the local build passes, and the build log exceeds the host's size limit | a bundler-specific CSS loader scanned the whole project root, including the package store the host keeps inside the project | use the framework's standard integration (Tailwind through `@tailwindcss/postcss` with `postcss.config.mjs`), drop custom loader rules |
| Every route on the deployment returns 404 | the project was linked with the wrong framework preset | pin it: `"framework": "nextjs"` (or yours) in `vercel.json` |
| A route crashes on the host when it reads a data file | the file was not traced into the serverless bundle | list it in `outputFileTracingIncludes` (Next.js) or import it so the bundler sees it |
| `.env` files or private notes ship with the deployment | the deploy uploads the working tree | mirror `.gitignore` in `.vercelignore`: every `.env*`, process notes, `.claude/`, scratch folders |
| A clean clone fails where your tree passes | your tree has files a clone does not | run a fresh-clone build before submitting, and fix it until it prints zero warnings |

> Field note (Detour · Graph Hacks 2026): the first production build failed because Tailwind's Turbopack loader made the bundler read the whole root, including at least 1,059 files in the host's in-project package store, and the warnings overflowed the 4 MB log limit. Switching to the PostCSS integration fixed the build 13 minutes after the failure; pinning the framework preset a few minutes later fixed the 404 that followed.

## 2. Hosting and access

| Symptom | Cause | Fix |
|---|---|---|
| Judges get HTTP 302 or a login page | preview deployments sit behind the host's deployment protection | open the URL logged out in an incognito window; turn protection off for the demo deployment or hand judges the production alias |
| The public alias serves an older build | the alias points at an earlier deployment | compare the footer build stamp (or the served bundle hash) with the latest commit, then re-promote |
| The first request after idle takes 30 seconds or times out | free hosts sleep | a keep-alive cron, and open the URL two minutes before judging |
| A free database refuses connections after a quiet day | free tiers pause idle databases | the daily cron queries the database and re-seeds when empty |
| State disappears between requests | in-memory state on serverless instances | say so in the README, keep Reset demo one click away, or use a persistent host |
| A hosting trial expires mid-event | trials end on their own clock | note every trial's end at kickoff and keep a second host ready |
| A free-tier database rejects a plain command with `NOPERM` | the free user lacks permission for some commands | on day 1, probe every command the app needs, on the actual free tier |

> Field note (ORCA · SIH 2026): the polish loop's "shipped" score was capped at 6 (up from 4) because preview deployments returned HTTP 302 to strangers behind the host's login, and the public alias served an older bundle than the one being measured.

## 3. Model providers

| Symptom | Cause | Fix |
|---|---|---|
| 429s, stalls and "high demand" errors during judging | per-minute and daily free-tier quotas | a failover chain from hour 1; bench a spent model until its reset (Gemini's free daily quotas reset at midnight Pacific time) |
| A model stops existing mid-event | the provider retired or renamed it | keep the model list in an env var and read deprecation notices; free tiers retired several models in one year, and a speech model was deprecated mid-event in one build |
| Answers quietly come from the fallback | a thinking mode added 30 to 60 seconds and blew the timeout | turn thinking off or lower the effort on latency routes, and print `llm_used` and the provider on every output |
| `NoSuchToolError` for a name like `logToCRM<\|channel\|>commentary` | some open models leak format tokens into tool names | a tool-call repair hook that strips the leak and retargets the real tool |
| Malformed tool calls once the schema has several tools | weaker open models struggle with multi-tool schemas | put the provider's strongest tool-calling model in the chain; keep schemas permissive |
| A blank or revoked key returns 401 or 403, not a "missing key" error | providers report bad keys as permission errors | treat 401 and 403 as "unavailable" in the failover check |
| 400 on `temperature`, `top_p` or an assistant prefill | recent models reject sampling parameters and prefills | delete them; shape output with structured outputs |

## 4. Voice, microphone and HTTPS

| Symptom | Cause | Fix |
|---|---|---|
| The mic button does nothing on the deployed site | `getUserMedia` and the Web Speech API need a secure context | serve over HTTPS (any modern host, or Caddy with an sslip.io hostname on a VM); on HTTP, show the button and explain how to reach HTTPS |
| A follow-up message loses its language | the language was not carried across turns | carry the conversation's language forward explicitly |
| A browser recording is rejected by the speech API | browsers report different MIME variants for the same container | normalise the type before upload and test the real browser's blob on a real phone |
| Generated speech is cut short | rate limits or streaming truncated the clip | write the transcripts first, respect the provider's retry-after hint, compare each clip's duration with its word count |

## 5. Windows

| Symptom | Cause | Fix |
|---|---|---|
| `UnicodeEncodeError`, or ₹ and other symbols print as junk | the console code page is cp1252 | set `PYTHONUTF8=1` and `PYTHONIOENCODING=utf-8` in every launcher |
| A commit subject starts with an invisible character | PowerShell here-strings write a byte-order mark | write the message to a UTF-8 file without a BOM and run `git commit -F <file>` |
| "Address already in use" on restart | a stale process still holds the port, often a `node` grandchild of `npm` | kill the tree by PID (`taskkill /F /T /PID <pid>`); the bundled launchers do this for stale node and python processes only |
| `uvicorn --reload` stops reloading or dies | the file watcher is unreliable on Windows | run without `--reload` and restart after backend edits |
| `python` opens the Microsoft Store or prints "Python was not found" | the App Execution Alias sits on PATH before any real interpreter | test that it runs (`python -c "import sys"`), and prefer the `py -3` launcher |
| The browser refuses the JS modules your Python server sends | Python takes MIME types from the registry, where `.js` can be `text/plain` | register the types with `mimetypes.add_type` |
| A `.bat` file jumps to the wrong label or fails oddly | cmd.exe misparses labels in files with LF line endings | pin `*.bat text eol=crlf` in `.gitattributes` |
| An `echo` line prints echo's own help text | cmd reads a line starting with `/?` as a help request | never start an echoed line with `/?`; print full URLs |
| `timeout` in a batch file errors or waits wrongly | a Unix `timeout.exe` from Git or MSYS shadows the Windows one | sleep with `ping -n <seconds + 1> 127.0.0.1 >nul` |
| In Git Bash, `cmd /c` opens an interactive prompt, or `--link /path` reaches a script as `C:/Program Files/Git/path` | MSYS converts any argument that starts with `/` into a Windows path | `MSYS_NO_PATHCONV=1`, `cmd //c ...`, or pass full URLs |
| A batch file in the current folder "is not recognized" when an agent or CI runs it | the environment sets `NoDefaultCurrentDirectoryInExePath`, so cmd does not look in the current folder | run it by path: `.\run-demo.bat` or the full path |
| A `.bat` stops right after calling `npm` | `npm` is itself a batch file, so control never returns | `call npm ...` |
| Ctrl+C leaves a server running | the signal reached the shell, not the grandchild that owns the port | kill the process tree by PID on exit |
| A build that failed looks green | `\| tail` (or any pipe) masked the exit code | check the exit status; never pipe a build you gate on |
| Headless screenshots look cropped, as if the layout overflowed | headless Edge clamps the window to about 500 px | set the viewport explicitly in the screenshot tool |

## 6. Next.js and front-end frameworks

| Symptom | Cause | Fix |
|---|---|---|
| An edit does not appear in the agent's preview | the preview is configured to run the production build | rebuild and restart after edits, or point the preview at the dev server while editing |
| A modal renders in the wrong place or under content | a transformed ancestor traps `position: fixed` | portal modals to `document.body` |
| Hydration errors that only happen in development | dev-mode behaviour differs | demo on `build` then `start`, never on the dev server |
| Screenshots show the framework's dev indicator | they were captured from the dev server | capture from the production build, or set `devIndicators: false` |
| A hydration mismatch in an SVG chart | floating-point coordinates differ between server and client | round coordinates to two decimals |
| A map renders invisible after a re-render | React changed the `className` of a node an imperative library owns | give nodes handed to imperative libraries a constant `className` |
| Devanagari and other tall scripts clip under gradient text | `background-clip: text` crops glyphs above the em box | raise `line-height` to about 1.3 and add real padding |
| A decorative ring eats taps on phones while automation passes | programmatic clicks skip hit-testing | `pointer-events: none` on decoration, and test with real taps |
| The screenshot tool times out | infinite animations keep the page busy | a `?noanim` switch, or read state directly instead of screenshotting |
| A gated panel spins forever | the feature is off in this mode and nothing says so | render an explicit "not available in this mode" state |

## 7. Mobile apps

| Symptom | Cause | Fix |
|---|---|---|
| Works in development, broken in the release build | release builds differ (minification, assets, native config) | build and install the release artefact on a real device on day 1 |
| A blank screen at launch | the first render waits for fonts or assets | render on load, or on error, or after a timeout, whichever comes first |
| A whole screen is invisible in release | an entrance animation was the only path to opacity 1 | keep opacity at 1 and animate translation only |
| Recognition "works" but everyone matches everyone | pixels arrived in the 0 to 1 range and were normalised as if 0 to 255 | sanity assertions on model outputs (two different people must score a low similarity) |
| Judges open the link on a phone and the layout breaks | the UI was built desktop-only | build mobile first and check 390 px wide in every pass |

> Field note (FaceAttend · NHAI Hackathon): 28 commits landed in one day, the day before submission closed, many of them failures that only the release build showed: startup blocked on fonts, blank icons, a render loop that froze touches, two mounted cameras, and an entrance animation that hid a whole screen.

## 8. CI, integrations and verification

| Symptom | Cause | Fix |
|---|---|---|
| CI fails while local passes | CI's filesystem or environment differs from yours | reproduce CI's layout locally with a canary file, bisect in a disposable worktree, ablate one route at a time, name each log after its hypothesis |
| The CI workflow never ran | the push token lacked the `workflow` scope | `gh auth refresh -s workflow` on day 1; until CI runs, the README must not say it does |
| A guard test passes on everything | the test was vacuous (a config emptied its inputs) | prove each guard fails on a real offence before trusting it |
| Fixtures pass, the live run fails | an upstream response shape changed, or a silent fallback ran | one live smoke run with real keys before submitting, asserting `llm_used` and the shapes |
| A connection to `localhost` takes minutes | `localhost` resolved to IPv6 first and the service listens on IPv4 | connect to `127.0.0.1` |
| An integration fails only on the real workspace | enterprise variants of a platform need different identifiers | a live integration script that prints PASS or FAIL per risky call, run early |
