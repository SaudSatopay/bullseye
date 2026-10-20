#!/usr/bin/env python3
"""voiceover.py: one voiceover clip per beat, each checked against its time window, plus SRT captions.

Reads the beat table in docs/demo-script.md (or a JSON list of beats), synthesizes every line with edge-tts
(free Microsoft neural voices), measures each clip and prints OK, OVER or SHORT against the beat's window.
Captions come from the same timeline: at most 42 characters a line, two lines a cue, with display forms
applied (the narrator says "ninety-eight percent", the caption shows "98%").

Usage:
  python voiceover.py <demo-script.md | beats.json> [options]
  python voiceover.py docs/demo-script.md --dry-run --srt video/captions.srt
  python voiceover.py docs/demo-script.md --out video/vo --srt video/captions.srt

Options:
  --out DIR          folder for the clips and timeline.json (default: vo)
  --voice NAME       edge-tts voice (default: en-US-AndrewNeural); list them with: edge-tts --list-voices
  --rate +N%         speaking rate for every beat (default +0%); a beat's own rate wins
  --srt FILE         write captions built from the timeline
  --display "A=B"    caption display form, repeatable: --display "ninety-eight percent=98%"
  --max-line N       caption line length (default 42)
  --wpm N            words a minute used for estimates (default 150)
  --cap SECONDS      fail when the last line ends after this time (for a 3:00 cap, 175 leaves margin)
  --only ID,ID       synthesize only these beats (retakes); the others keep their clips
  --force            synthesize again even when the text, voice and rate are unchanged
  --dry-run          no network and no clips: estimate each line from its word count, then write
                     timeline.json and the SRT

Input:
  Markdown: the first table with a Time column and a Voiceover column. Time is "0:00–0:12" (the line
  may run 12 s) or a single start time. A table with "Say" and "Show" columns adds display forms.
  JSON: [{"id": "b01", "start": "0:00", "window": 10, "text": "...", "rate": "+8%", "caption": "..."}]
  or {"voice": "...", "rate": "...", "display": {"spoken": "shown"}, "beats": [...]}. start is seconds or
  m:ss; window defaults to the time until the next beat starts.
  Words in [square brackets] are directions for a human reader; they are not spoken or captioned.

Exit codes: 0 every beat fits; 1 a beat runs OVER its window or past --cap, the narration holds a banned
word or a {{placeholder}}, synthesis failed, or the input is invalid; 2 usage error.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import math
import re
import shutil
import subprocess
import sys
from pathlib import Path

EM_DASH = chr(0x2014)
EN_DASH = chr(0x2013)
QUOTES = "\"'" + chr(0x201C) + chr(0x201D) + chr(0x2018) + chr(0x2019)
DEFAULT_VOICE = "en-US-AndrewNeural"
BANNED = re.compile(r"\b(leverag\w*|seamless\w*|powerful\w*|cutting[\s-]edge|revolutionar\w*)\b", re.I)
NUMBERISH = re.compile(
    r"\d|\b(zero|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|"
    r"sixty|seventy|eighty|ninety|hundred|thousand|million|billion|lakh|crore|percent|twice|double|half)\b",
    re.I,
)
SILENT = {"", "-", "--", "(none)", "none", "n/a", "silence", "(silence)", EM_DASH, EN_DASH}
TAIL = 0.35  # seconds a caption stays after its line ends, when the next line allows it


class InputError(Exception):
    pass


# ------------------------------------------------------------------ parsing


def parse_time(value) -> float:
    if isinstance(value, bool):
        raise InputError(f"not a time: {value!r}")
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip()
    m = re.fullmatch(r"(?:(\d+):)?(\d{1,2}):(\d{1,2}(?:\.\d+)?)", s)
    if m:
        hours, minutes, seconds = int(m.group(1) or 0), int(m.group(2)), float(m.group(3))
        if seconds >= 60 or (m.group(1) and minutes >= 60):
            raise InputError(f"not a time: {value!r}")
        return hours * 3600 + minutes * 60 + seconds
    if re.fullmatch(r"\d+(?:\.\d+)?", s):
        return float(s)
    raise InputError(f"not a time: {value!r} (use seconds or m:ss)")


def fmt_time(t: float) -> str:
    m, s = divmod(max(0.0, t), 60)
    return f"{int(m)}:{s:04.1f}"


def split_row(line: str) -> list[str]:
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|") and not line.endswith("\\|"):
        line = line[:-1]
    cells, cur, i = [], [], 0
    while i < len(line):
        c = line[i]
        if c == "\\" and i + 1 < len(line) and line[i + 1] == "|":
            cur.append("|")
            i += 2
            continue
        if c == "|":
            cells.append("".join(cur).strip())
            cur = []
        else:
            cur.append(c)
        i += 1
    cells.append("".join(cur).strip())
    return cells


def md_tables(text: str) -> list[tuple[list[str], list[list[str]], int]]:
    """Every pipe table outside code fences: (header, rows, line number of the header)."""
    tables, block, start, fence = [], [], 0, False
    lines = text.splitlines()
    for n, line in enumerate(lines + [""], 1):
        if line.strip().startswith("```"):
            fence = not fence
        if not fence and line.strip().startswith("|"):
            if not block:
                start = n
            block.append(line)
            continue
        if block:
            if len(block) >= 2 and all(re.fullmatch(r":?-{2,}:?", c.replace(" ", "")) for c in split_row(block[1])):
                tables.append(([h.strip() for h in split_row(block[0])], [split_row(r) for r in block[2:]], start))
            block = []
    return tables


def clean_cell(cell: str) -> str:
    s = re.sub(r"<!--.*?-->", " ", cell, flags=re.S)
    s = re.sub(r"<br\s*/?>", " ", s, flags=re.I)
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)
    s = re.sub(r"__(.+?)__", r"\1", s)
    s = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"\1", s)
    s = re.sub(r"`([^`]*)`", r"\1", s)
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) >= 2 and s[0] in QUOTES and s[-1] in QUOTES:
        s = s[1:-1].strip()
    return s


def find_col(header: list[str], pattern: str) -> int | None:
    for i, h in enumerate(header):
        if re.search(pattern, h, re.I):
            return i
    return None


def parse_markdown(text: str) -> tuple[list[dict], dict]:
    beats_table, display = None, {}
    for header, rows, line in md_tables(text):
        t_col = find_col(header, r"\btime\b")
        v_col = find_col(header, r"voice\s*-?\s*over|^vo$|narration")
        say_col = find_col(header, r"^say\b|spoken")
        show_col = find_col(header, r"^show\b|caption|display")
        if t_col is not None and v_col is not None and beats_table is None:
            beats_table = (header, rows, line, t_col, v_col)
        elif t_col is None and say_col is not None and show_col is not None:
            for r in rows:
                if max(say_col, show_col) < len(r):
                    spoken, shown = clean_cell(r[say_col]), clean_cell(r[show_col])
                    if spoken and shown and "{{" not in spoken + shown:
                        display[spoken] = shown
    if beats_table is None:
        raise InputError("no beat table found: it needs a Time column and a Voiceover column")
    header, rows, line, t_col, v_col = beats_table
    id_col = find_col(header, r"^(#|beat|id|no\.?)$")
    src_col = find_col(header, r"source")
    sep = re.escape(EN_DASH) + "|" + re.escape(EM_DASH) + r"|-|\bto\b"
    beats = []
    for k, r in enumerate(rows, 1):
        if not any(c.strip() for c in r):
            continue
        where = f"table row {k} (line {line + 1 + k})"
        raw_vo = r[v_col] if v_col < len(r) else ""
        raw_time = clean_cell(r[t_col]) if t_col < len(r) else ""
        vo = clean_cell(raw_vo)
        if "{{" in raw_vo or "{{" in raw_time:
            raise InputError(f"{where}: fill the {{{{placeholder}}}} first")
        if vo.lower() in SILENT:
            continue
        m = re.fullmatch(rf"\s*([\d:.]+)\s*(?:{sep})\s*([\d:.]+)\s*", raw_time)
        if m:
            start, end = parse_time(m.group(1)), parse_time(m.group(2))
            if end <= start:
                raise InputError(f"{where}: the time range {raw_time!r} ends before it starts")
            window = end - start
        elif raw_time:
            start, window = parse_time(raw_time), None
        else:
            raise InputError(f"{where}: the Time cell is empty")
        bid = clean_cell(r[id_col]) if id_col is not None and id_col < len(r) else ""
        if re.fullmatch(r"\d+", bid):
            bid = f"b{int(bid):02d}"
        bid = re.sub(r"[^A-Za-z0-9_.-]+", "-", bid).strip("-") or f"b{len(beats) + 1:02d}"
        source = clean_cell(r[src_col]) if src_col is not None and src_col < len(r) else None
        beats.append({"id": bid, "start": start, "window": window, "text": vo, "where": where, "source": source})
    return beats, display


def parse_json(data) -> tuple[list[dict], dict, dict]:
    defaults = {}
    display = {}
    if isinstance(data, dict):
        if not isinstance(data.get("beats"), list):
            raise InputError('a JSON object needs a "beats" list')
        for key in ("voice", "rate"):
            if key in data:
                defaults[key] = data[key]
        if "display" in data:
            if not isinstance(data["display"], dict):
                raise InputError('"display" must map spoken text to caption text')
            display = {str(k): str(v) for k, v in data["display"].items()}
        items = data["beats"]
    elif isinstance(data, list):
        items = data
    else:
        raise InputError("the JSON must be a list of beats or an object with a beats list")
    beats = []
    for k, b in enumerate(items, 1):
        where = f"beat {k}"
        if not isinstance(b, dict):
            raise InputError(f"{where}: must be an object")
        unknown = set(b) - {"id", "start", "window", "end", "text", "rate", "caption", "source", "note"}
        if unknown:
            raise InputError(f"{where}: unknown key(s) {', '.join(sorted(unknown))}")
        if "start" not in b:
            raise InputError(f"{where}: needs a start (seconds or m:ss)")
        text = b.get("text")
        if not isinstance(text, str) or not text.strip():
            raise InputError(f"{where}: needs the text to speak")
        start = parse_time(b["start"])
        window = None
        if "window" in b:
            if not isinstance(b["window"], (int, float)) or isinstance(b["window"], bool) or b["window"] <= 0:
                raise InputError(f"{where}: window must be a positive number of seconds")
            window = float(b["window"])
        elif "end" in b:
            window = parse_time(b["end"]) - start
        bid = str(b.get("id") or f"b{k:02d}")
        beats.append({
            "id": bid, "start": start, "window": window, "text": text.strip(), "rate": b.get("rate"),
            "caption": b.get("caption"), "source": b.get("source"), "where": f"{where} ({bid})",
        })
    return beats, display, defaults


# ------------------------------------------------------------------ checks and text


def rate_pct(rate: str) -> int:
    m = re.fullmatch(r"([+-])(\d{1,3})%", rate or "")
    if not m:
        raise InputError(f"rate must look like +8% or -5% (got {rate!r})")
    return int(m.group(2)) * (1 if m.group(1) == "+" else -1)


def spoken(text: str) -> str:
    """What the voice says: directions in [brackets] removed."""
    return re.sub(r"\s+", " ", re.sub(r"\[[^\]]*\]", " ", text)).strip()


def word_count(text: str) -> int:
    return len([t for t in text.split() if re.search(r"\w", t)])


def apply_display(text: str, display: dict) -> str:
    for said in sorted(display, key=len, reverse=True):
        text = re.sub(rf"(?<!\w){re.escape(said)}(?!\w)", lambda _m, shown=display[said]: shown, text, flags=re.I)
    return text


def caption_text(beat: dict, display: dict) -> str:
    text = beat["caption"] if beat.get("caption") else apply_display(spoken(beat["text"]), display)
    text = re.sub(rf"\s*{re.escape(EM_DASH)}\s*", ", ", text)  # judges never read an em dash
    text = re.sub(rf"\s+{re.escape(EN_DASH)}\s+", ", ", text)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    text = re.sub(r",\s*,", ",", text)
    return re.sub(r"\s+", " ", text).strip(" ,")


def wrap(text: str, max_line: int) -> list[str] | None:
    """One or two lines no longer than max_line, breaking at a sentence, then a clause, then a balanced word."""
    if len(text) <= max_line:
        return [text]
    for pattern in (r"(?<=[.!?])\s+", r"(?<=[,;:])\s+"):
        best = None
        for m in re.finditer(pattern, text):
            a, b = text[: m.start()].strip(), text[m.end():].strip()
            if a and b and len(a) <= max_line and len(b) <= max_line:
                score = abs(len(a) - len(b))
                if best is None or score < best[0]:
                    best = (score, [a, b])
        if best:
            return best[1]
    words = text.split()
    if len(words) == 1:
        return [text]  # one word longer than a line: show it whole
    best = None
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        if len(a) <= max_line and len(b) <= max_line:
            score = max(len(a), len(b))
            if best is None or score < best[0]:
                best = (score, [a, b])
    return best[1] if best else None


def caption_chunks(text: str, max_line: int) -> list[str]:
    fits = lambda s: wrap(s, max_line) is not None  # noqa: E731
    units = []
    for sentence in re.split(r"(?<=[.!?])\s+", text):
        if not sentence:
            continue
        if fits(sentence):
            units.append(sentence)
            continue
        for clause in re.split(r"(?<=[,;:])\s+", sentence):
            if fits(clause):
                units.append(clause)
                continue
            cur = ""
            for w in clause.split():
                cand = f"{cur} {w}".strip()
                if not cur or fits(cand):
                    cur = cand
                else:
                    units.append(cur)
                    cur = w
            if cur:
                units.append(cur)
    cues, cur = [], ""
    for u in units:
        cand = f"{cur} {u}".strip()
        if cur and fits(cand):
            cur = cand
        elif not cur:
            cur = u
        else:
            cues.append(cur)
            cur = u
    if cur:
        cues.append(cur)
    return cues


def srt_time(t: float) -> str:
    ms = int(round(max(0.0, t) * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def build_cues(timeline: list[dict], max_line: int) -> list[tuple[float, float, list[str]]]:
    cues = []
    for i, b in enumerate(timeline):
        nxt = timeline[i + 1]["start"] if i + 1 < len(timeline) else None
        spoken_end = b["start"] + b["duration"]
        end = spoken_end + TAIL
        if nxt is not None:
            end = min(end, nxt - 0.05)
        end = max(end, b["start"] + 0.3)
        if nxt is not None:
            end = min(end, nxt - 0.01)
        chunks = caption_chunks(b["caption"], max_line)
        total = sum(len(c) for c in chunks) or 1
        t = b["start"]
        # A line that overruns into the next beat is squeezed into the time it has, so cues never overlap.
        span = max(0.01, min(spoken_end, end) - b["start"])
        for k, chunk in enumerate(chunks):
            stop = end if k == len(chunks) - 1 else t + span * len(chunk) / total
            cues.append((t, stop, wrap(chunk, max_line) or [chunk]))
            t = stop
    return cues


def write_srt(path: Path, cues) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        for n, (a, b, lines) in enumerate(cues, 1):
            f.write(f"{n}\n{srt_time(a)} --> {srt_time(b)}\n" + "\n".join(lines) + "\n\n")


# ------------------------------------------------------------------ audio


def need_edge_tts():
    try:
        import edge_tts  # noqa: F401
    except ImportError:
        print("edge-tts is not installed. Install it, then run again:\n  pip install edge-tts\n"
              "Or record a human voiceover and use --dry-run for the captions only.", file=sys.stderr)
        sys.exit(1)
    return edge_tts


def clip_seconds(path: Path) -> float | None:
    try:
        from mutagen.mp3 import MP3
        return float(MP3(str(path)).info.length)
    except ImportError:
        pass
    except Exception:  # noqa: BLE001
        pass
    ffprobe = shutil.which("ffprobe")
    if ffprobe:
        r = subprocess.run([ffprobe, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                           capture_output=True, text=True)
        try:
            return float(r.stdout.strip())
        except ValueError:
            return None
    return None


def short_error(e: Exception) -> str:
    """One line, with URL query strings cut so tokens never reach the console or a log."""
    text = re.sub(r"\?[^\s'\"]+", "?...", str(e).splitlines()[0] if str(e) else type(e).__name__)
    if re.search(r"\b403\b", text):
        text += " (Microsoft refused the request: update edge-tts with pip install -U edge-tts and check the system clock)"
    return text


async def synthesize(edge_tts, jobs: list[dict], voice: str) -> None:
    for job in jobs:
        final = job["path"]
        part = final.with_name(final.stem + ".tmp.mp3")
        for attempt in range(3):
            try:
                await edge_tts.Communicate(job["tts"], voice, rate=job["rate"]).save(str(part))
                if not part.exists() or part.stat().st_size == 0:
                    raise RuntimeError("no audio came back")
                part.replace(final)
                break
            except Exception as e:  # noqa: BLE001  network errors, refused requests, empty audio
                part.unlink(missing_ok=True)
                if attempt == 2:
                    raise RuntimeError(f"{job['id']}: edge-tts failed three times: {short_error(e)}") from e
                await asyncio.sleep(2 * (attempt + 1))
        print(f"  synthesized {job['id']}", flush=True)


def mix_command(timeline: list[dict], out_dir: Path) -> str:
    inputs = " ".join(f'-i "{(out_dir / b["file"]).as_posix()}"' for b in timeline)
    delays = ";".join(f"[{i + 1}:a]adelay={int(round(b['start'] * 1000))}:all=1[a{i + 1}]" for i, b in enumerate(timeline))
    mix = "".join(f"[a{i + 1}]" for i in range(len(timeline))) + f"amix=inputs={len(timeline)}:normalize=0[vo]"
    return (f'ffmpeg -i video.mp4 {inputs} -filter_complex "{delays};{mix}" -map 0:v -map "[vo]" '
            "-c:v copy -c:a aac -b:a 192k video-with-vo.mp4")


# ------------------------------------------------------------------ main


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(prog="voiceover.py", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter,
                                 usage="python voiceover.py <demo-script.md | beats.json> [options]")
    ap.add_argument("beats")
    ap.add_argument("--out", default="vo")
    ap.add_argument("--voice")
    ap.add_argument("--rate")
    ap.add_argument("--srt")
    ap.add_argument("--display", action="append", default=[])
    ap.add_argument("--max-line", type=int, default=42)
    ap.add_argument("--wpm", type=float, default=150.0)
    ap.add_argument("--cap", type=float)
    ap.add_argument("--only")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args(argv)
    if args.max_line < 20:
        ap.error("--max-line must be at least 20")
    if not 60 <= args.wpm <= 300:
        ap.error("--wpm must be between 60 and 300")

    src = Path(args.beats)
    try:
        raw = src.read_text(encoding="utf-8-sig")
    except OSError as e:
        print(f"voiceover: cannot read {src}: {e.strerror or e}", file=sys.stderr)
        return 1

    problems, warnings = [], []
    try:
        if src.suffix.lower() == ".json":
            try:
                data = json.loads(raw)
            except json.JSONDecodeError as e:
                raise InputError(f"{src} is not valid JSON: {e}") from e
            beats, display, defaults = parse_json(data)
        else:
            beats, display = parse_markdown(raw)
            defaults = {}
        for item in args.display:
            if "=" not in item:
                raise InputError(f'--display needs "spoken=shown" (got {item!r})')
            said, shown = item.split("=", 1)
            if not said.strip():
                raise InputError(f"--display has an empty spoken form: {item!r}")
            display[said.strip()] = shown.strip()
        voice = args.voice or defaults.get("voice") or DEFAULT_VOICE
        base_rate = args.rate or defaults.get("rate") or "+0%"
        rate_pct(base_rate)
        if not beats:
            raise InputError("no spoken lines found")
        ids = set()
        for i, b in enumerate(beats):
            if not re.fullmatch(r"[A-Za-z0-9_.-]+", b["id"]):
                raise InputError(f"{b['where']}: id {b['id']!r} may use letters, digits, dot, dash and underscore")
            if b["id"] in ids:
                raise InputError(f"{b['where']}: duplicate id {b['id']!r}")
            ids.add(b["id"])
            if i and b["start"] < beats[i - 1]["start"]:
                raise InputError(f"{b['where']}: starts before the beat above it")
            b["rate"] = b.get("rate") or base_rate
            rate_pct(b["rate"])
            if b["window"] is None:
                if i + 1 < len(beats):
                    b["window"] = beats[i + 1]["start"] - b["start"] - 0.15
                else:
                    raise InputError(f"{b['where']}: the last beat needs a window or an end time")
            if b["window"] <= 0:
                raise InputError(f"{b['where']}: the window is not positive")
            if i + 1 < len(beats) and b["start"] + b["window"] > beats[i + 1]["start"] + 0.01:
                warnings.append(f"{b['id']}: its window runs past the start of {beats[i + 1]['id']}")
    except InputError as e:
        print(f"voiceover: {e}", file=sys.stderr)
        return 1

    only = {x.strip() for x in args.only.split(",")} if args.only else None
    if only and not only <= ids:
        print(f"voiceover: --only names unknown beats: {', '.join(sorted(only - ids))}", file=sys.stderr)
        return 1

    for b in beats:
        text = spoken(b["text"])
        b["tts"] = text
        b["words"] = word_count(text)
        b["caption"] = caption_text(b, display)
        b["key"] = hashlib.sha1(f"{voice}|{b['rate']}|{text}".encode("utf-8")).hexdigest()[:16]
        b["estimate"] = b["words"] / (args.wpm / 60.0) / (1 + rate_pct(b["rate"]) / 100.0) + 0.3
        for m in BANNED.finditer(text):
            problems.append(f"{b['id']}: banned word \"{m.group(0)}\" in the narration")
        if "{{" in text:
            problems.append(f"{b['id']}: the narration still holds a {{{{placeholder}}}}")
        if b.get("source") is not None and NUMBERISH.search(text) and (not b["source"] or "{{" in b["source"]):
            warnings.append(f"{b['id']}: says a number but its Source cell is empty")

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    previous = {}
    prev_file = out_dir / "timeline.json"
    if prev_file.exists():
        try:
            previous = {b["id"]: b for b in json.loads(prev_file.read_text(encoding="utf-8")).get("beats", [])}
        except (ValueError, KeyError, TypeError):
            previous = {}

    if args.dry_run:
        for b in beats:
            b["duration"], b["estimated"], b["file"] = round(b["estimate"], 2), True, None
    else:
        edge_tts = need_edge_tts()
        jobs = []
        for b in beats:
            path = out_dir / f"{b['id']}.mp3"
            b["file"] = path.name
            has_clip = path.exists() and path.stat().st_size > 0
            reuse = has_clip and not args.force and previous.get(b["id"], {}).get("key") == b["key"]
            if only is not None:
                if b["id"] in only:
                    reuse = False  # a retake: synthesize it again even when the text is unchanged
                elif has_clip:
                    reuse = True
                else:
                    print(f"voiceover: {b['id']} has no clip yet; run without --only first", file=sys.stderr)
                    return 1
            if not reuse:
                jobs.append({"id": b["id"], "tts": b["tts"], "rate": b["rate"], "path": path})
        print(f"voice {voice}: {len(jobs)} to synthesize, {len(beats) - len(jobs)} reused", flush=True)
        try:
            asyncio.run(synthesize(edge_tts, jobs, voice))
        except RuntimeError as e:
            print(f"voiceover: {e}\nCheck the network, the voice name (edge-tts --list-voices) and the rate.", file=sys.stderr)
            return 1
        for b in beats:
            seconds = clip_seconds(out_dir / b["file"])
            b["estimated"] = seconds is None
            b["duration"] = round(seconds if seconds is not None else b["estimate"], 2)
            if seconds is None:
                warnings.append(f"{b['id']}: could not measure the clip (pip install mutagen, or put ffprobe on PATH)")

    counts = {"OK": 0, "OVER": 0, "SHORT": 0}
    for b in beats:
        b["end"] = round(b["start"] + b["duration"], 2)
        if b["duration"] > b["window"] + 0.05:
            b["status"] = "OVER"
            factor = b["duration"] / b["window"]
            need = math.ceil((factor * (1 + rate_pct(b["rate"]) / 100.0) - 1) * 100)
            cut = math.ceil(b["words"] * (1 - b["window"] / b["duration"]))
            b["fix"] = f"cut about {cut} words" + (f" or set rate +{need}%" if need <= 15 else "")
            problems.append(f"{b['id']}: {b['duration']:.1f} s in a {b['window']:.1f} s window ({b['fix']})")
        elif not b["estimated"] and b["words"] >= 6 and b["duration"] < 0.6 * (b["estimate"] - 0.3):
            b["status"] = "SHORT"
            problems.append(f"{b['id']}: the clip is {b['duration']:.1f} s for {b['words']} words; it may be cut off, so synthesize it again (--only {b['id']} --force)")
        else:
            b["status"] = "OK"
        counts[b["status"]] += 1
    if args.cap is not None and beats[-1]["end"] > args.cap:
        problems.append(f"the last line ends at {fmt_time(beats[-1]['end'])}, after the {fmt_time(args.cap)} cap")

    mode = f"dry run, estimated at {args.wpm:g} words a minute" if args.dry_run else "measured clips"
    print(f"\nvoice {voice} | {len(beats)} spoken beats | {mode}")
    print(f"  {'status':8} {'id':12} {'start':>7} {'window':>7} {'length':>7} {'words':>5}  text")
    for b in beats:
        tag = ("EST " if b["estimated"] else "") + b["status"]
        excerpt = b["tts"] if len(b["tts"]) <= 56 else b["tts"][:53] + "..."
        print(f"  {tag:8} {b['id']:12} {fmt_time(b['start']):>7} {b['window']:6.1f}s {b['duration']:6.1f}s {b['words']:5}  {excerpt}")

    cues = build_cues(beats, args.max_line)
    long_lines = [ln for _, _, lines in cues for ln in lines if len(ln) > args.max_line]
    for ln in long_lines:
        warnings.append(f"caption line over {args.max_line} characters (one unbreakable word): {ln}")
    if args.srt:
        write_srt(Path(args.srt), cues)

    record = {
        "tool": "voiceover.py",
        "source": src.as_posix(),
        "voice": voice,
        "dryRun": args.dry_run,
        "wpm": args.wpm,
        "display": display,
        "srt": Path(args.srt).as_posix() if args.srt else None,
        "cues": len(cues),
        "beats": [{k: b.get(k) for k in ("id", "start", "window", "end", "duration", "estimated", "status", "rate",
                                          "words", "text", "caption", "file", "key")} for b in beats],
    }
    if not args.dry_run:
        record["mixCommand"] = mix_command(beats, out_dir)
    prev_file.write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    for w in warnings:
        print(f"warn  {w}")
    for p in problems:
        print(f"FAIL  {p}")
    print(f"\n{counts['OK']} OK, {counts['OVER']} OVER, {counts['SHORT']} SHORT | last line ends at {fmt_time(beats[-1]['end'])}"
          + (f" | captions {Path(args.srt).as_posix()} ({len(cues)} cues)" if args.srt else "")
          + f" | timeline {prev_file.as_posix()}")
    if not args.dry_run and not problems:
        print(f"\nlay the clips on the video at their start times (or run, after renaming your cut to video.mp4):\n  {record['mixCommand']}")
    return 1 if problems else 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    sys.exit(main(sys.argv[1:]))
