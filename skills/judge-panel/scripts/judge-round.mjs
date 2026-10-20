#!/usr/bin/env node
// judge-panel · scripts/judge-round.mjs
// Record one judge round. It validates a scorecard against ../assets/judge-scorecard.schema.json,
// recomputes the weighted total with the exact weights in BULLSEYE.md ## Contract (a judge's arithmetic
// and weights are never trusted), compares it with earlier rounds, applies the stop rule, writes the round's row in
// "## Judge rounds" and a block at the top of "## Log", and creates judging/round-<n>/triage.md with one
// row per finding for the fact-check.
//
// Usage:
//   node judge-round.mjs <projectDir> <scorecard.json | verdict.md> [--dry]
//   node judge-round.mjs --compare <a.json> <b.json> [--project <projectDir>]
// A pasted reply that contains one JSON code block is accepted in place of a .json file.
// Exit codes: 0 recorded or compared · 1 invalid scorecard, missing file or missing BULLSEYE.md · 2 bad arguments.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  UsageError, isMainModule, readText, readJson, extractJson, validate, summarize, mergeRound, stopReasons,
  loadRounds, parseRubric, sections, splitRow, fillSlots, cell, fmtTotal, fmtScore, fmtDelta, localStamp,
  localDate, SEVERITIES, JUDGE_ROUNDS_HEADER, SCORECARD_FILE,
} from './judging-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(HERE, '..', 'assets', 'judge-scorecard.schema.json');
const TRIAGE_TEMPLATE = path.join(HERE, '..', 'assets', 'triage.template.md');
const TABLE_SEPARATOR = '|---|---|---|---|---|---|---|';

const USAGE = `Record a judge round in BULLSEYE.md, or compare two scorecards.

  node judge-round.mjs <projectDir> <scorecard.json | verdict.md> [--dry]
      Validate the scorecard, recompute the weighted total with the Contract's weights, write the
      "## Judge rounds" row and a "## Log" block, create judging/round-<n>/triage.md, apply the stop rule.
      --dry validates and prints without writing anything.

  node judge-round.mjs --compare <a.json> <b.json> [--project <projectDir>]
      Per-criterion gap between two scorecards (a blind and an informed judge, or two fresh sessions).

Exit codes: 0 done, 1 invalid scorecard or missing file, 2 bad arguments.`;

// ---------- BULLSEYE.md edits ----------

function skipIntro(lines, i, end) {
  while (i < end) {
    const l = lines[i].trim();
    if (l === '') {
      i++;
      continue;
    }
    if (l.startsWith('<!--')) {
      while (i < end && !lines[i].includes('-->')) i++;
      i++;
      continue;
    }
    break;
  }
  return Math.min(i, end);
}

function findJudgeTable(md) {
  const lines = md.split(/\r?\n/);
  const sec = sections(md).find((s) => s.title.toLowerCase() === 'judge rounds');
  if (!sec) return { lines, sec: null, header: -1, end: -1 };
  for (let i = sec.line + 1; i < sec.end - 1; i++) {
    if (/^\s*\|/.test(lines[i]) && /round/i.test(lines[i]) && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      let end = i + 2;
      while (end < sec.end && /^\s*\|/.test(lines[end])) end++;
      return { lines, sec, header: i, end };
    }
  }
  return { lines, sec, header: -1, end: -1 };
}

// The Fixed? cell a builder already set for this round, so a re-record never erases it.
export function existingFixed(md, n) {
  const { lines, header, end } = findJudgeTable(md);
  if (header === -1) return null;
  for (let i = header + 2; i < end; i++) {
    const cells = splitRow(lines[i]);
    if (cells[0] === `R${n}`) return cells[6] || null;
  }
  return null;
}

export function upsertJudgeRow(md, n, row) {
  const eol = md.includes('\r\n') ? '\r\n' : '\n';
  const { lines, sec, header, end } = findJudgeTable(md);
  if (!sec) {
    const block = ['## Judge rounds', '', JUDGE_ROUNDS_HEADER, TABLE_SEPARATOR, row, ''];
    const before = sections(md).find((s) => s.level === 2 && /^submission$/i.test(s.title));
    if (before) lines.splice(before.line, 0, ...block);
    else {
      if (lines[lines.length - 1] !== '') lines.push('');
      lines.push(...block);
    }
    return lines.join(eol);
  }
  if (header === -1) {
    const at = skipIntro(lines, sec.line + 1, sec.end);
    lines.splice(at, 0, JUDGE_ROUNDS_HEADER, TABLE_SEPARATOR, row, '');
    return lines.join(eol);
  }
  for (let i = header + 2; i < end; i++) {
    if (splitRow(lines[i])[0] === `R${n}`) {
      lines[i] = row;
      return lines.join(eol);
    }
  }
  lines.splice(end, 0, row);
  return lines.join(eol);
}

export function prependLog(md, block) {
  const eol = md.includes('\r\n') ? '\r\n' : '\n';
  const lines = md.split(/\r?\n/);
  const sec = sections(md).find((s) => s.level === 2 && s.title.toLowerCase() === 'log');
  if (!sec) {
    if (lines[lines.length - 1] !== '') lines.push('');
    lines.push('## Log', '', ...block.split('\n'), '');
    return lines.join(eol);
  }
  const at = skipIntro(lines, sec.line + 1, sec.end);
  lines.splice(at, 0, ...block.split('\n'), '');
  return lines.join(eol);
}

// ---------- pieces ----------

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function rowFor(n, merged, delta, fixed, date) {
  const extra = [];
  if (delta !== null) extra.push(fmtDelta(delta));
  if (merged.totals.length > 1) extra.push(merged.totals.map(fmtTotal).join(' / '));
  const score = `${fmtTotal(merged.total)}${extra.length ? ` (${extra.join('; ')})` : ''}`;
  const lowest = merged.lowest ? `${merged.lowest.name} ${fmtScore(merged.lowest.score)}` : '';
  const top = merged.top ? `${merged.top.title} (${merged.top.severity})` : 'none';
  return `| R${n} | ${cell(merged.type)} | ${date} | ${score} | ${cell(lowest)} | ${cell(top, 120)} | ${cell(fixed)} |`;
}

function logBlock(card, sum, delta, prevRound, stop, savedRel) {
  const counts = SEVERITIES.map((s) => `${(card.findings ?? []).filter((f) => f.severity === s).length} ${s}`).join(' · ');
  const stated = Number.isFinite(card.weighted_total) ? ` (judge stated ${card.weighted_total})` : '';
  const lines = [
    `### ▶ STATUS · Judge round ${card.round} (${card.type}) · ${localStamp()}`,
    `- Changed: recorded ${savedRel}${card.judge?.runner ? ` (judge: ${card.judge.runner})` : ''}`,
    `- Verified: weighted ${fmtTotal(sum.total)} recomputed with the Contract weights${stated}; findings ${counts}; ${plural((card.non_issues ?? []).length, 'non-issue')} listed by the judge`,
    `- Numbers: ${sum.criteria.map((c) => `${c.name} ${fmtScore(c.score)}`).join(' · ')} → ${fmtTotal(sum.total)}${delta !== null ? ` (${fmtDelta(delta)} vs R${prevRound})` : ''}`,
  ];
  if (stop.length) lines.push(`- Stop rule: STOP judging code (${stop.join('; ')}). Spend the runway on: ${card.ceiling || card.biggest_gap}`);
  lines.push(`- Next: fact-check every finding in judging/round-${card.round}/triage.md before fixing anything. Biggest gap: ${card.biggest_gap}`);
  return lines.join('\n');
}

export function triageText(n, entries, total) {
  const template = readText(TRIAGE_TEMPLATE);
  if (template === null) throw new Error(`missing template ${TRIAGE_TEMPLATE}`);
  const multi = entries.length > 1;
  const rows = [];
  entries.forEach((e, k) => {
    const prefix = multi ? `${String.fromCharCode(65 + k)}-` : '';
    (e.card.findings ?? []).forEach((f, i) => {
      rows.push(`| ${prefix}${cell(f.id || `F${i + 1}`, 16)} | ${cell(f.severity, 8)} | ${cell(f.title)} | ${cell(f.where)} | ${cell(f.fix)} | | | |`);
    });
  });
  const nonIssues = entries.flatMap((e) => (e.card.non_issues ?? []).map((x) => `- (judge) ${cell(x.checked, 200)}: ${cell(x.result, 300)}`));
  const { text } = fillSlots(template, {
    round: String(n),
    type: [...new Set(entries.map((e) => e.card.type))].join(' + '),
    date: localStamp(),
    score: fmtTotal(total),
    scorecards: entries.map((e) => `\`${path.basename(e.file)}\``).join(', '),
    findings_rows: rows.length ? rows.join('\n') : '| none | | the judge reported no findings | | | | | |',
    judge_non_issues: nonIssues.join('\n'),
  }, { keepComments: true });
  return text;
}

// Where the card lives inside judging/round-<n>/. A file already there keeps its name.
function placeCard(roundDir, inputAbs, card, rawIsJson) {
  const json = `${JSON.stringify(card, null, 2)}\n`;
  if (path.dirname(inputAbs) === roundDir && SCORECARD_FILE.test(path.basename(inputAbs))) {
    return { target: inputAbs, write: rawIsJson ? null : json, note: null };
  }
  const base = `scorecard-${card.type}`;
  for (let k = 1; k < 100; k++) {
    const name = k === 1 ? `${base}.json` : `${base}-${k}.json`;
    const target = path.join(roundDir, name);
    const existing = readText(target);
    if (existing === null) return { target, write: json, note: k > 1 ? `${base}.json already holds a different scorecard, so this one is saved as ${name}. If it was a re-run, delete the stale file.` : null };
    try {
      if (JSON.stringify(JSON.parse(existing)) === JSON.stringify(card)) return { target, write: null, note: null };
    } catch {
      // unreadable: try the next name
    }
  }
  throw new Error(`too many scorecards of type ${card.type} in ${roundDir}`);
}

// ---------- commands ----------

function compare(aPath, bPath, projectDir) {
  const load = (p) => {
    const text = readText(path.resolve(p));
    if (text === null) throw new Error(`file not found: ${p}`);
    return extractJson(text);
  };
  const a = load(aPath);
  const b = load(bPath);
  const md = projectDir ? readText(path.join(path.resolve(projectDir), 'BULLSEYE.md')) : null;
  const rubric = md ? parseRubric(md) : [];
  const sa = summarize(a, rubric);
  const sb = summarize(b, rubric);
  for (const [label, s] of [['A', sa], ['B', sb]]) if (s.total === null) throw new Error(`scorecard ${label}: ${s.errors.join('; ')}`);
  const names = [...new Set([...sa.criteria.map((c) => c.name), ...sb.criteria.map((c) => c.name)])];
  const byName = (s, n) => s.criteria.find((c) => c.name === n)?.score;
  const width = Math.max(10, ...names.map((n) => n.length));
  const pad = (s, w) => String(s).padEnd(w);
  const la = `A ${a.type}`;
  const lb = `B ${b.type}`;
  const cw = Math.max(la.length, lb.length, 8) + 2;
  console.log(`${pad('criterion', width)}  ${pad(la, cw)}${pad(lb, cw)}gap (B - A)`);
  let flagged = 0;
  for (const n of names) {
    const x = byName(sa, n);
    const y = byName(sb, n);
    const gap = x !== undefined && y !== undefined ? y - x : null;
    const flag = gap !== null && Math.abs(gap) >= 1;
    if (flag) flagged++;
    console.log(`${pad(n, width)}  ${pad(x ?? '-', cw)}${pad(y ?? '-', cw)}${gap === null ? '-' : fmtDelta(gap)}${flag ? '   <- read both evidence strings' : ''}`);
  }
  console.log(`${pad('weighted', width)}  ${pad(fmtTotal(sa.total), cw)}${pad(fmtTotal(sb.total), cw)}${fmtDelta(sb.total - sa.total)}`);
  console.log(`\n${flagged ? `${flagged} criterion gap(s) of 1 or more. A gap is information, not noise.` : 'No criterion differs by 1 or more: both judges are probably reading the same evidence.'}`);
  console.log('If the blind judge scores higher, the informed judge may be anchored on old limits. If the blind judge scores lower, the narrative in the prompt was carrying the score: fix what the submission says on its own (README first screen, deck opening, first minute of the demo).');
  return 0;
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--dry') out.dry = true;
    else if (a === '--compare') {
      if (argv[i + 1] === undefined || argv[i + 2] === undefined) throw new UsageError('--compare needs two scorecard files');
      out.compare = [argv[++i], argv[++i]];
    } else if (a === '--project') {
      if (argv[i + 1] === undefined) throw new UsageError('--project needs a directory');
      out.project = argv[++i];
    } else if (a.startsWith('-')) throw new UsageError(`unknown option ${a}`);
    else out._.push(a);
  }
  return out;
}

export function main(argv) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    console.error(`${e.message}\n\n${USAGE}`);
    return 2;
  }
  if (args.help) {
    console.log(USAGE);
    return 0;
  }
  try {
    if (args.compare) return compare(args.compare[0], args.compare[1], args.project);
    const [dirArg, fileArg] = args._;
    if (!dirArg || !fileArg) {
      console.error(`expected <projectDir> and <scorecard file>\n\n${USAGE}`);
      return 2;
    }
    const root = path.resolve(dirArg);
    const inputAbs = path.resolve(fileArg);
    const raw = readText(inputAbs);
    if (raw === null) {
      console.error(`scorecard file not found: ${inputAbs}`);
      return 1;
    }
    let rawIsJson = true;
    try {
      JSON.parse(raw);
    } catch {
      rawIsJson = false;
    }
    const card = extractJson(raw);
    const schema = readJson(SCHEMA_PATH);
    const errors = validate(schema, card);
    if (errors.length) {
      console.error(`Scorecard rejected (${path.basename(inputAbs)}):\n- ${errors.join('\n- ')}\nFix the JSON, or rerun the round: a scorecard without evidence is not a score.`);
      return 1;
    }
    const mdPath = path.join(root, 'BULLSEYE.md');
    const md = readText(mdPath);
    if (md === null && !args.dry) {
      console.error(`BULLSEYE.md not found in ${root}. Create it with the bullseye skill first, or pass --dry to validate only.`);
      return 1;
    }
    const rubric = md ? parseRubric(md) : [];
    const sum = summarize(card, rubric);
    if (sum.total === null) {
      console.error(`Scorecard rejected:\n- ${sum.errors.join('\n- ')}`);
      return 1;
    }

    const roundDir = path.join(root, 'judging', `round-${card.round}`);
    const placed = placeCard(roundDir, inputAbs, card, rawIsJson);
    if (!args.dry && placed.write !== null) {
      fs.mkdirSync(roundDir, { recursive: true });
      fs.writeFileSync(placed.target, placed.write);
    }

    const warnings = [...sum.warnings];
    const rounds = loadRounds(root, rubric, warnings);
    const list = (rounds.get(card.round) ?? []).filter((e) => path.resolve(e.file) !== path.resolve(placed.target));
    list.push({ file: placed.target, card, sum });
    rounds.set(card.round, list);
    const series = [...rounds.keys()].sort((x, y) => x - y).filter((k) => k <= card.round).map((k) => ({ round: k, ...mergeRound(rounds.get(k)) }));
    const current = series[series.length - 1];
    const prev = series.length > 1 ? series[series.length - 2] : null;
    const roundDelta = prev ? current.total - prev.total : null;
    const cardDelta = prev ? sum.total - prev.total : null;
    const stop = stopReasons(series, card);
    const savedRel = path.relative(root, placed.target).split(path.sep).join('/');

    let triageNote = '';
    if (!args.dry) {
      const fixed = existingFixed(md, card.round) ?? 'pending';
      let next = upsertJudgeRow(md, card.round, rowFor(card.round, current, roundDelta, fixed, localDate()));
      next = prependLog(next, logBlock(card, sum, cardDelta, prev?.round, stop, savedRel));
      fs.writeFileSync(mdPath, next);
      const triagePath = path.join(roundDir, 'triage.md');
      if (!fs.existsSync(triagePath)) {
        fs.writeFileSync(triagePath, triageText(card.round, list, current.total));
        triageNote = `wrote judging/round-${card.round}/triage.md`;
      } else {
        triageNote = `judging/round-${card.round}/triage.md already exists: add this judge's ${(card.findings ?? []).length} finding(s) to it by hand`;
      }
    }

    const counts = SEVERITIES.map((s) => `${(card.findings ?? []).filter((f) => f.severity === s).length} ${s}`).join(' · ');
    console.log(`Round ${card.round} · ${card.type}: weighted ${fmtTotal(sum.total)}${cardDelta !== null ? ` (${fmtDelta(cardDelta)} vs R${prev.round})` : ''} · lowest ${sum.lowest.name} ${fmtScore(sum.lowest.score)}`);
    console.log(sum.criteria.map((c) => `${c.name} ${fmtScore(c.score)}`).join(' · '));
    if (current.totals.length > 1) console.log(`Round ${card.round} holds ${current.totals.length} scorecards: mean ${fmtTotal(current.total)} (${current.totals.map(fmtTotal).join(' / ')})`);
    console.log(`Findings: ${counts} · non-issues listed: ${(card.non_issues ?? []).length}`);
    if (sum.top) console.log(`Top finding: ${sum.top.title} (${sum.top.severity}, ${sum.top.where})`);
    console.log(`Biggest gap: ${card.biggest_gap}`);
    for (const w of warnings) console.log(`warn  ${w}`);
    if (placed.note) console.log(`note  ${placed.note}`);
    if (stop.length) console.log(`STOP RULE: stop judging code (${stop.join('; ')}). Spend the runway on: ${card.ceiling || card.biggest_gap}`);
    else console.log('Stop rule: keep going (it triggers after two rounds that each add less than 0.2, or when the judge says the code is maxed).');
    if (args.dry) console.log('Dry run: nothing written.');
    else console.log(`Updated BULLSEYE.md (## Judge rounds, ## Log)${placed.write !== null ? `, saved ${savedRel}` : ''}; ${triageNote}.`);
    console.log(`Next: fact-check every finding against the code before fixing anything (judging/round-${card.round}/triage.md).`);
    return 0;
  } catch (e) {
    if (e instanceof UsageError) {
      console.error(`${e.message}\n\n${USAGE}`);
      return 2;
    }
    console.error(`error: ${e.message}`);
    return 1;
  }
}

if (isMainModule(import.meta.url)) process.exitCode = main(process.argv.slice(2));
