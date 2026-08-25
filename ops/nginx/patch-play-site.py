#!/usr/bin/env python3
"""Insert the fixed Dungeon Echo include into one play.91hwl.cn HTTPS block."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

INCLUDE = "include /etc/nginx/snippets/dungeon-echo-static.conf;"
TARGET_NAME = "play.91hwl.cn"


def strip_comment(line: str) -> str:
    out: list[str] = []
    quote = None
    escaped = False
    for char in line:
        if escaped:
            out.append(char)
            escaped = False
        elif char == "\\":
            out.append(char)
            escaped = True
        elif quote:
            out.append(char)
            if char == quote:
                quote = None
        elif char in ('"', "'"):
            out.append(char)
            quote = char
        elif char == "#":
            break
        else:
            out.append(char)
    return "".join(out)


def server_blocks(text: str) -> list[dict]:
    lines = text.splitlines(keepends=True)
    blocks: list[dict] = []
    depth = 0
    server = None
    offset = 0
    for index, line in enumerate(lines):
        clean = strip_comment(line)
        if server is None and re.search(r"\bserver\s*\{", clean):
            server = {"start_line": index, "start_offset": offset, "base_depth": depth}
        depth += clean.count("{") - clean.count("}")
        if server is not None and depth == server["base_depth"]:
            body = "".join(lines[server["start_line"] : index + 1])
            blocks.append({**server, "end_line": index, "body": body})
            server = None
        offset += len(line)
    return blocks


def matches_target(body: str) -> bool:
    clean = "\n".join(strip_comment(line) for line in body.splitlines())
    names = []
    for match in re.finditer(r"\bserver_name\s+([^;]+);", clean):
        names.extend(match.group(1).split())
    listens_443 = any(
        re.search(r"(?<!\d)443(?!\d)", match.group(1))
        for match in re.finditer(r"\blisten\s+([^;]+);", clean)
    )
    return TARGET_NAME in names and listens_443


def candidates(explicit: str | None) -> list[Path]:
    if explicit:
        return [Path(explicit).resolve()]
    paths: list[Path] = []
    for root in (Path("/etc/nginx/sites-enabled"), Path("/etc/nginx/conf.d")):
        if not root.exists():
            continue
        for path in sorted(root.iterdir()):
            try:
                resolved = path.resolve(strict=True)
            except (FileNotFoundError, OSError):
                continue
            if resolved not in paths:
                paths.append(resolved)
    return paths


def discover(explicit: str | None) -> list[tuple[Path, str, dict]]:
    hits = []
    for path in candidates(explicit):
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeError):
            continue
        hits.extend((path, text, block) for block in server_blocks(text) if matches_target(block["body"]))
    return hits


def patch_text(text: str, block: dict) -> tuple[str, bool]:
    if INCLUDE in block["body"]:
        return text, False
    lines = block["body"].splitlines(keepends=True)
    close_index = next(
        (index for index in range(len(lines) - 1, -1, -1) if "}" in strip_comment(lines[index])),
        None,
    )
    if close_index is None:
        raise ValueError("server closing brace not found")
    indent = re.match(r"\s*", lines[close_index]).group(0) + "    "
    absolute = block["start_offset"] + sum(len(line) for line in lines[:close_index])
    return text[:absolute] + f"{indent}{INCLUDE}\n" + text[absolute:], True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--site")
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    hits = discover(args.site)
    if len(hits) != 1:
        print("DUNGEON_ECHO_NGINX_TARGET_AMBIGUOUS", file=sys.stderr)
        print(json.dumps([str(path) for path, _text, _block in hits]), file=sys.stderr)
        return 3
    path, text, block = hits[0]
    patched, changed = patch_text(text, block)
    print(json.dumps({"file": str(path), "changed": changed}))
    if args.write and changed:
        temp = path.with_name(path.name + ".dungeon-echo.tmp")
        temp.write_text(patched, encoding="utf-8")
        temp.chmod(path.stat().st_mode & 0o777)
        temp.replace(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
