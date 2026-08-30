#!/usr/bin/env python3
"""HEAD/GET candidate reference URLs and print status."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from pathlib import Path

UA = "FabianPublicRegister/1.0 (reference-library verification)"
OUT = Path("/tmp/ref_verify.json")

URLS = [
    # Official
    "https://fabians.org.uk/",
    "https://fabians.org.uk/about-us/",
    "https://fabians.org.uk/about-us/our-history/",
    "https://fabians.org.uk/about-us/our-people/",
    "https://fabians.org.uk/about-us/accountability/",
    "https://fabians.org.uk/about-us/our-people/executive-committee-2017-19/",
    "https://fabians.org.uk/about-us/meet-our-experts/",
    "https://fabians.org.uk/fabian-society-bye-laws/",
    "https://fabians.org.uk/wp-content/uploads/2022/09/Rules-of-the-Fabian-Society-March-2022.pdf",
    "https://fabians.org.uk/wp-content/uploads/2024/11/Final-ANNUAL-REPORT-2023-2024-compressed.pdf",
    "https://fabians.org.uk/wp-content/uploads/2025/12/ANNUAL-REPORT-2024-2025-3.pdf",
    "https://fabians.org.uk/wp-content/uploads/2019/06/Financial-Transparency-2017-18.pdf",
    "https://fabians.org.uk/publications/",
    "https://fabians.org.uk/publication/",
    "https://fabians.org.uk/join/",
    "https://fabians.org.uk/views-from-the-top/",
    "https://youngfabians.org.uk/",
    "https://fabianwomen.org.uk/",
    "https://scottishfabians.org.uk/",
    "https://fabians.org.uk/about-us/welsh-fabians/",
    # Parliament / EC
    "https://search.electoralcommission.org.uk/",
    "https://search.electoralcommission.org.uk/?currentPage=1&rows=20&query=Fabian%20Society&sort=AcceptedDate&order=desc&tab=1",
    "https://www.electoralcommission.org.uk/political-finance-reporting/donations-and-loans",
    "https://members.parliament.uk/",
    "https://www.parliament.uk/business/publications/written-questions-answers-statements/written-questions-answers/",
    "https://www.theyworkforyou.com/search/?q=Fabian+Society",
    "https://www.parliament.scot/",
    "https://senedd.wales/",
    # Hansard
    "https://hansard.parliament.uk/search?searchTerm=%22Fabian%20Society%22",
    "https://hansard.parliament.uk/Lords/1993-05-19/debates/2563e18c-0321-4467-8da0-d0ef9e2b21ce/ADemocraticSocialistSociety",
    "https://hansard.parliament.uk/commons/1948-11-03/debates/71834d64-0ad7-4ada-8ae5-5383b76bb259/Nationalisation",
    "https://hansard.parliament.uk/Lords/2014-02-06/debates/14020664000342/SocialMobility",
    "https://hansard.parliament.uk/commons/2010-06-10/debates/10061031000001/TacklingPovertyInTheUK",
    # Encyclopaedia
    "https://www.britannica.com/topic/Fabian-Society",
    "https://www.britannica.com/money/Fabianism",
    "https://www.britannica.com/topic/Labour-and-the-New-Social-Order",
    "https://www.britannica.com/topic/R-H-S-Crossman",
    "https://en.wikipedia.org/wiki/Fabian_Society",
    # Academic
    "https://doi.org/10.1017/s0018246x00020720",
    "https://www.cambridge.org/core/journals/historical-journal/article/abs/fabianism-permeation-and-independent-labour/A0C0C0",
    "https://academic.oup.com/ehr",
    "https://www.jstor.org/topic/fabian-society/",
    "https://www.marxists.org/archive/draper/1966/twosouls/6-fabians.htm",
    "https://www.marxists.org/archive/trotsky/britain/wibg/",
    # News
    "https://www.theguardian.com/politics/2023/feb/25/lord-sainsbury-returns-to-the-labour-fold-with-2m-donation",
    "https://www.theguardian.com/politics/2023/sep/07/labour-boosts-election-war-chest-with-record-quarter-for-donations",
    "https://www.bbc.co.uk/news/uk-politics-68499719",
    "https://labourlist.org/2026/08/are-you-already-thinking-like-a-fabian/",
    "https://labourlist.org/2016/12/fabians-appoint-centre-left-former-shadow-minister-kate-green-as-chair/",
    "https://www.the-independent.com/news/uk/politics/labour-eu-donation-brexit-b2690635.html",
    "https://www.newstatesman.com/politics",
    "https://www.newstatesman.com/about-new-statesman",
    "https://www.spectator.co.uk/article/the-reith-lectures-are-a-new-low-in-bbc-history/",
    "https://spectator.com/article/the-reith-lectures-are-a-new-low-in-bbc-history/",
    # Archives
    "https://discovery.nationalarchives.gov.uk/details/c/F127133",
    "https://archives.lse.ac.uk/records/FABIAN_SOCIETY",
    "https://archives.lse.ac.uk/records/FABIAN_SOCIETY/N/2",
    "https://digital.library.lse.ac.uk/collections/list/collections/18",
    "https://digital.library.lse.ac.uk/",
    "https://blogs.lse.ac.uk/lsehistory/2019/01/22/beatrice-webb/",
    "https://blogs.lse.ac.uk/lsehistory/2025/08/04/borough-farm-4-august-1894-the-idea-for-lse/",
    "https://atom.aim25.com/index.php/fabian-society-archives-2",
    "https://www.bl.uk/",
    "https://searcharchives.bl.uk/",
    # Related
    "https://www.lse.ac.uk/about-lse/our-history",
    "https://www.lse.ac.uk/about-lse/LSE-history",
    "https://labour.org.uk/",
    "https://labour.org.uk/about/how-we-work/",
    "https://www.feps-europe.eu/",
    "https://www.feps-europe.eu/about/",
    # International
    "https://www.fabians.org.au/",
    "https://www.fabians.org.au/mission_and_history",
    "https://www.fabians.org.nz/",
    "https://www.fabians.org.nz/index.php?id=25&view=category",
    # Criticism extras
    "https://www.marxists.org/history/etol/writers/judd/1951/01/gradual.html",
    "https://www.marxists.org/history/etol/writers/challinor/1962/xx/fabians.htm",
    # More official / publications already used
    "https://fabians.org.uk/publication/the-road-ahead/",
    "https://fabians.org.uk/publication/the-labour-leadership/",
    "https://fabians.org.uk/publication/leading-labour-the-fabian-essays/",
    "https://fabians.org.uk/publication/the-shape-of-things-to-come/",
    "https://fabians.org.uk/publication/common-endeavour/",
    "https://fabians.org.uk/publication/new-arrivals/",
    "https://fabians.org.uk/publication/let-us-face-the-future-again/",
    "https://fabians.org.uk/publication/the-economic-alternative/",
    "https://fabians.org.uk/joe-dromey-announced-as-new-general-secretary-of-the-fabian-society/",
    "https://fabians.org.uk/andrew-harrop-to-step-down-as-general-secretary-of-the-fabian-society/",
    "https://fabians.org.uk/on-the-horizon/",
    # Project Gutenberg / Internet Archive public texts
    "https://www.gutenberg.org/ebooks/13715",
    "https://archive.org/details/fabianessaysinso00shawuoft",
    "https://archive.org/details/historyoffabians00peasuoft",
    "https://oll.libertyfund.org/titles/shaw-fabian-essays-in-socialism",
    # More news / commentary
    "https://www.ft.com/content",
    "https://www.thetimes.com/",
    "https://www.bbc.co.uk/news/topics/c50znx8v87jt",
]


def check(url: str) -> dict:
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return {"url": url, "status": r.status, "final": r.geturl(), "ok": 200 <= r.status < 400}
    except urllib.error.HTTPError as e:
        return {"url": url, "status": e.code, "final": url, "ok": False}
    except Exception as e:
        return {"url": url, "status": 0, "final": url, "ok": False, "error": str(e)[:80]}


def main() -> None:
    rows = [check(u) for u in URLS]
    OUT.write_text(json.dumps(rows, indent=2))
    ok = [r for r in rows if r["ok"]]
    bad = [r for r in rows if not r["ok"]]
    print(f"ok {len(ok)} / {len(rows)}")
    for r in bad:
        print(" FAIL", r["status"], r["url"][:90], r.get("error", ""))


if __name__ == "__main__":
    main()
