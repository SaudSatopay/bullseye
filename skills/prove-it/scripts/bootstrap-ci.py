#!/usr/bin/env python3
"""bootstrap-ci.py: a statistic with a bootstrap confidence interval, from per-item results.

Part of the prove-it skill. Python 3.10+, standard library only.

A headline number without an interval is a naked point. This turns a file of per-item results (one row
per question, case, query, request or decision) into a line you can put in a README:
"88.1% (95% CI 81.2-94.1%, n=101, 2000 bootstrap resamples)".

Usage
  python bootstrap-ci.py results.csv --col correct
  python bootstrap-ci.py results.jsonl --col latency_ms --stat median
  python bootstrap-ci.py results.csv --col correct --cluster station
  python bootstrap-ci.py results.csv --col correct --by category --json > data/results/heldout_ci.json
  python bootstrap-ci.py - --col correct < results.csv

Input
  CSV with a header row (.csv, or .tsv for tabs), JSON lines (.jsonl / .ndjson, one object per line), or
  a .json file holding a list of objects (or an object with a "results", "rows", "items", "cases" or
  "records" list). "-" reads stdin. --col and --cluster and --by may be dot paths into JSON objects.
  Values: 0/1, true/false, yes/no, pass/fail, hit/miss, or any number. Empty cells, null, "na" and "nan"
  are unknown: they are left out and counted, never read as 0.

Method
  Percentile bootstrap. Each of --resamples rounds draws n items with replacement (with --cluster: draws
  whole clusters with replacement, as many as there are) and recomputes the statistic. The interval is the
  (1-c)/2 and 1-(1-c)/2 percentiles of the rounds, by linear interpolation. Seeded: the same input and
  seed give the same interval on every machine. Use --cluster whenever items are not independent (several
  questions about one closure, decisions at one station, turns of one conversation): a row bootstrap then
  claims more certainty than the data holds.

Exit codes: 0 ok, 1 no usable rows, 2 bad input or arguments.
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import math
import random
import statistics
import sys
from pathlib import Path

TRUE = {"true", "t", "yes", "y", "pass", "passed", "ok", "correct", "hit"}
FALSE = {"false", "f", "no", "n", "fail", "failed", "miss", "incorrect", "wrong"}
UNKNOWN = {"", "null", "none", "na", "n/a", "nan", "unknown", "?"}
LIST_KEYS = ("results", "rows", "items", "cases", "records")


class InputError(Exception):
    """Bad input file or arguments (exit 2)."""


def read_rows(source: str, fmt: str | None, delimiter: str | None) -> list[dict]:
    if source == "-":
        text = sys.stdin.read()
        if text.startswith(chr(0xFEFF)):
            text = text[1:]
    else:
        path = Path(source)
        if not path.is_file():
            raise InputError(f"{source}: file not found")
        text = path.read_text(encoding="utf-8-sig")
    kind = fmt or sniff(source, text)
    if kind == "csv":
        delim = delimiter or ("\t" if source.lower().endswith(".tsv") else ",")
        return [dict(row) for row in csv.DictReader(io.StringIO(text), delimiter=delim)]
    if kind == "json":
        try:
            data = json.loads(text)
        except json.JSONDecodeError as exc:
            if "\n" in text.strip():
                return read_jsonl(text)
            raise InputError(f"{source}: not valid JSON ({exc})") from exc
        if isinstance(data, dict):
            data = next((data[k] for k in LIST_KEYS if isinstance(data.get(k), list)), None)
        if not isinstance(data, list) or not all(isinstance(r, dict) for r in data):
            raise InputError(f"{source}: expected a list of objects (or an object with a {'/'.join(LIST_KEYS)} list)")
        return data
    return read_jsonl(text)


def read_jsonl(text: str) -> list[dict]:
    rows = []
    for number, line in enumerate(text.splitlines(), 1):
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError as exc:
            raise InputError(f"line {number}: not valid JSON ({exc.msg})") from exc
        if not isinstance(obj, dict):
            raise InputError(f"line {number}: expected a JSON object")
        rows.append(obj)
    return rows


def sniff(source: str, text: str) -> str:
    lower = source.lower()
    if lower.endswith((".csv", ".tsv")):
        return "csv"
    if lower.endswith((".jsonl", ".ndjson")):
        return "jsonl"
    if lower.endswith(".json"):
        return "json"
    head = text.lstrip()[:1]
    if head == "[":
        return "json"
    if head == "{":
        try:
            json.loads(text)
            return "json"
        except json.JSONDecodeError:
            return "jsonl"
    return "csv"


def get(row: dict, key: str):
    if key in row:
        return row[key]
    cur = row
    for part in key.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return None
    return cur


def has_key(row: dict, key: str) -> bool:
    if key in row:
        return True
    cur = row
    for part in key.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return False
    return True


def to_value(raw, col: str, number: int) -> float | None:
    """A cell as a number, None when unknown. Raises InputError for anything else."""
    if raw is None:
        return None
    if isinstance(raw, bool):
        return 1.0 if raw else 0.0
    if isinstance(raw, (int, float)):
        return None if math.isnan(raw) else float(raw)
    text = str(raw).strip().lower()
    if text in UNKNOWN:
        return None
    if text in TRUE:
        return 1.0
    if text in FALSE:
        return 0.0
    try:
        value = float(text.replace(",", "").rstrip("%"))
    except ValueError:
        raise InputError(f"row {number}: {raw!r} in column {col!r} is not a number or a yes/no value") from None
    return None if math.isnan(value) else value


def make_stat(name: str):
    if name == "mean":
        return lambda xs: math.fsum(xs) / len(xs)
    if name == "sum":
        return math.fsum
    return statistics.median


def percentile(sorted_xs: list[float], q: float) -> float:
    if len(sorted_xs) == 1:
        return sorted_xs[0]
    pos = q * (len(sorted_xs) - 1)
    lo, hi = math.floor(pos), math.ceil(pos)
    return sorted_xs[lo] + (sorted_xs[hi] - sorted_xs[lo]) * (pos - lo)


def bootstrap(values, clusters, stat, resamples: int, seed: int, confidence: float):
    rng = random.Random(seed)
    draws = []
    if clusters is None:
        n = len(values)
        for _ in range(resamples):
            draws.append(stat(rng.choices(values, k=n)))
    else:
        groups: dict[str, list[float]] = {}
        for value, cluster in zip(values, clusters):
            groups.setdefault(cluster, []).append(value)
        ordered = [groups[k] for k in sorted(groups)]
        k = len(ordered)
        for _ in range(resamples):
            sample = [v for group in rng.choices(ordered, k=k) for v in group]
            draws.append(stat(sample))
    draws.sort()
    alpha = (1 - confidence) / 2
    return percentile(draws, alpha), percentile(draws, 1 - alpha)


def num(x: float) -> str:
    if abs(x) >= 10000:
        return f"{x:,.0f}"
    return f"{x:.4g}"


def summarize(name, rows, args, stat):
    values = [r[0] for r in rows]
    clusters = [r[1] for r in rows] if args.cluster else None
    point = stat(values)
    lo, hi = bootstrap(values, clusters, stat, args.resamples, args.seed, args.confidence)
    binary = all(v in (0.0, 1.0) for v in values)
    out = {
        "group": name,
        "n": len(values),
        "clusters": len(set(clusters)) if clusters else None,
        "value": point,
        "lo": lo,
        "hi": hi,
        "binary": binary,
        "successes": int(sum(values)) if binary else None,
    }
    level = f"{round(args.confidence * 100, 2):g}%"
    where = f"n={len(values)}" + (f" in {out['clusters']} clusters" if clusters else "")
    if binary and args.stat == "mean":
        shown = f"{point * 100:.1f}% ({level} CI {lo * 100:.1f}-{hi * 100:.1f}%, {where}"
    else:
        shown = f"{num(point)} ({level} CI {num(lo)}-{num(hi)}, {where}"
    method = "cluster bootstrap resamples" if clusters else "bootstrap resamples"
    out["display"] = f"{shown}, {args.resamples} {method})"
    return out


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="bootstrap-ci.py",
        description="A statistic with a percentile bootstrap confidence interval, from per-item results.",
        epilog="Example: python bootstrap-ci.py results.csv --col correct --cluster station --by category",
    )
    parser.add_argument("input", help="CSV, JSON lines or JSON file; - for stdin")
    parser.add_argument("--col", required=True, help="column holding the per-item result (0/1, yes/no or a number)")
    parser.add_argument("--stat", choices=("mean", "sum", "median"), default="mean", help="statistic (default mean)")
    parser.add_argument("--resamples", type=int, default=2000, help="bootstrap rounds (default 2000)")
    parser.add_argument("--seed", type=int, default=42, help="random seed (default 42)")
    parser.add_argument("--confidence", type=float, default=0.95, help="interval level, 0.95 or 95 (default 0.95)")
    parser.add_argument("--cluster", help="resample whole clusters by this column (items that are not independent)")
    parser.add_argument("--by", help="also report one line per value of this column")
    parser.add_argument("--format", choices=("csv", "jsonl", "json"), help="input format (default: from the extension)")
    parser.add_argument("--delimiter", help="CSV delimiter (default comma; tab for .tsv)")
    parser.add_argument("--json", action="store_true", help="print JSON, ready to merge into facts.json")
    args = parser.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if args.confidence > 1:
        args.confidence /= 100
    if not 0 < args.confidence < 1:
        parser.error("--confidence must be between 0 and 1 (or 0 and 100)")
    if args.resamples < 1:
        parser.error("--resamples must be at least 1")

    try:
        raw_rows = read_rows(args.input, args.format, args.delimiter)
        if not raw_rows:
            raise InputError(f"{args.input}: no rows")
        for key, flag in ((args.col, "--col"), (args.cluster, "--cluster"), (args.by, "--by")):
            if key and not any(has_key(r, key) for r in raw_rows):
                columns = ", ".join(list(raw_rows[0].keys())[:20])
                raise InputError(f"{flag} {key!r} is not a column; columns: {columns}")
        rows = []
        left_out = 0
        for number, row in enumerate(raw_rows, 1):
            value = to_value(get(row, args.col), args.col, number)
            if value is None:
                left_out += 1
                continue
            cluster = str(get(row, args.cluster)) if args.cluster else None
            group = str(get(row, args.by)) if args.by else None
            rows.append((value, cluster, group))
    except InputError as exc:
        print(f"bootstrap-ci: {exc}", file=sys.stderr)
        return 2

    if not rows:
        print(f"bootstrap-ci: every row's {args.col!r} is empty or unknown; nothing to measure", file=sys.stderr)
        return 1

    stat = make_stat(args.stat)
    groups = [summarize("all", rows, args, stat)]
    if args.by:
        for name in sorted({r[2] for r in rows}):
            groups.append(summarize(name, [r for r in rows if r[2] == name], args, stat))

    report = {
        "tool": "bootstrap-ci",
        "input": "stdin" if args.input == "-" else Path(args.input).name,
        "col": args.col,
        "stat": args.stat,
        "confidence": args.confidence,
        "resamples": args.resamples,
        "seed": args.seed,
        "method": "cluster percentile bootstrap" if args.cluster else "percentile bootstrap",
        "cluster": args.cluster,
        "by": args.by,
        "left_out": left_out,
        "groups": groups,
    }
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
        return 0

    level = f"{round(args.confidence * 100, 2):g}%"
    resample_what = f"clusters by {args.cluster!r}" if args.cluster else "rows"
    print(f"bootstrap-ci  {report['input']}  col={args.col}  stat={args.stat}  "
          f"{level} percentile interval, {args.resamples} resamples of {resample_what}, seed {args.seed}")
    width = max(len(g["group"]) for g in groups)
    for g in groups:
        if g["binary"] and args.stat == "mean":
            value = f"{g['value'] * 100:6.1f}%"
            ci = f"[{g['lo'] * 100:.1f}%, {g['hi'] * 100:.1f}%]"
            count = f"{g['successes']}/{g['n']}"
        else:
            value = f"{num(g['value']):>8}"
            ci = f"[{num(g['lo'])}, {num(g['hi'])}]"
            count = f"n={g['n']}"
        extra = f"  {g['clusters']} clusters" if g["clusters"] else ""
        print(f"  {g['group']:<{width}}  {value}  {level} CI {ci:<22} {count}{extra}")
    if left_out:
        print(f"  note: {left_out} row(s) had no value in {args.col!r} and were left out (unknown is not 0)")
    small = [g for g in groups if g["n"] < 20 or (g["clusters"] is not None and g["clusters"] < 10)]
    for g in small:
        print(f"  note: {g['group']!r} has n={g['n']}"
              + (f" in {g['clusters']} clusters" if g["clusters"] is not None else "")
              + "; the interval is rough, say so next to the number")
    print(f"  write it as: {groups[0]['display']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
