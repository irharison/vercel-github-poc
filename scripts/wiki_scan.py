#!/usr/bin/env python3
"""Scan Wikipedia Fabian categories and keep only pages whose body states a Fabian link."""

from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

UA = "FabianPublicRegister/1.0 (public-register research; https://vercel-github-poc.vercel.app)"
TITLES = json.loads(Path("/tmp/wiki_fabian_titles.json").read_text())
OUT = Path("/tmp/wiki_fabian_verified.json")

FABIAN_RE = re.compile(
    r"\b(Fabian Society|Young Fabians|Fabian Women'?s Network|Fabian Review|Fabian pamphlet|Fabian tract|Fabians)\b",
    re.I,
)
MEMBER_RE = re.compile(
    r"(member of the Fabian Society|joined the Fabian|Fabian Society member|a Fabian\b|the Fabians\b|Fabian socialist|Fabianism)",
    re.I,
)
SKIP_PREFIX = ("List of ", "Category:", "Template:", "File:", "Portal:", "Draft:")


def wiki(params: dict) -> dict:
    params = {**params, "format": "json", "formatversion": "2"}
    url = "https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.load(r)
        except Exception:
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"wiki fail {params}")


def chunks(items, n):
    for i in range(0, len(items), n):
        yield items[i : i + n]


def main() -> None:
    unique = [t for t in TITLES["unique"] if not t.startswith(SKIP_PREFIX)]
    print("candidate titles", len(unique))
    results = []
    for batch in chunks(unique, 20):
        data = wiki(
            {
                "action": "query",
                "prop": "extracts|revisions|pageprops|categories",
                "explaintext": "1",
                "exintro": "0",
                "exlimit": "20",
                "rvprop": "content",
                "rvslots": "main",
                "cllimit": "50",
                "ppprop": "wikibase_item",
                "titles": "|".join(batch),
                "redirects": "1",
            }
        )
        for page in data.get("query", {}).get("pages", []):
            if page.get("missing"):
                continue
            title = page.get("title", "")
            extract = page.get("extract") or ""
            revs = page.get("revisions") or []
            wikitext = ""
            if revs:
                wikitext = revs[0].get("slots", {}).get("main", {}).get("content") or ""
            blob = f"{extract}\n{wikitext}"
            if not FABIAN_RE.search(blob):
                continue
            # category-only trap: mention only in category links
            body_without_cats = re.sub(r"\[\[Category:[^\]]+\]\]", "", wikitext)
            body_without_cats = re.sub(r"\{\{[^}]+\}\}", " ", body_without_cats)
            if not FABIAN_RE.search(extract) and not FABIAN_RE.search(body_without_cats):
                continue
            cats = [c.get("title", "") for c in page.get("categories") or []]
            qid = (page.get("pageprops") or {}).get("wikibase_item")
            results.append(
                {
                    "title": title,
                    "pageid": page.get("pageid"),
                    "qid": qid,
                    "extract": extract[:2000],
                    "has_member_phrase": bool(MEMBER_RE.search(blob)),
                    "fabian_in_intro": bool(FABIAN_RE.search(extract[:800])),
                    "categories": cats,
                    "url": f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}",
                }
            )
        print("  batch done", len(results), "kept")
        time.sleep(0.15)

    OUT.write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print("verified", len(results), "->", OUT)


if __name__ == "__main__":
    main()
