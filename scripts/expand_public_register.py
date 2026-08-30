#!/usr/bin/env python3
"""Migrate existing records and add Wikipedia-verified Fabian public figures."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PEOPLE_PATH = ROOT / "data" / "people.json"
WIKI = json.loads(Path("/tmp/wiki_fabian_verified.json").read_text())
WD = json.loads(Path("/tmp/wiki_fabian_wikidata.json").read_text())
ACCESS = "2026-08-30"
HISTORY = "https://fabians.org.uk/about-us/our-history/"

CHAIR_NAMES = {
    "g.d.h. cole", "gdh cole", "george cole",
    "harold laski", "john parker", "austen albu", "harold wilson",
    "margaret cole", "arthur skeffington", "roy jenkins", "eirene white",
    "h.d. hughes", "hugh hughes", "lord faringdon", "c.a.r. crosland",
    "anthony crosland", "mary stewart", "brian abel-smith",
    "anthony wedgwood benn", "tony benn", "peter townsend",
    "william rodgers", "arthur blenkinsop", "peter shore", "thomas balogh",
    "jeremy bray", "peter hall", "anthony lester", "frank judd",
    "nicholas bosanquet", "colin crouch", "giles radice", "dick leonard",
    "philip whitehead", "peter archer", "shirley williams", "david lipsey",
    "stella meldram", "jenny jeger", "tessa blackstone", "andrew mcintosh",
    "austin mitchell", "nick butler", "bryan gould", "david bean",
    "robin cook", "oonagh mcdonald", "dianne hayter", "ben pimlott",
    "alf dubs", "maggie rice", "chris smith", "margaret hodge",
    "tony wright", "calum mcdonald", "gordon marsden", "denis macshane",
    "paul richards", "stephen twigg", "eric joyce", "seema malhotra",
    "ed balls", "anne campbell", "sadiq khan", "suresh pushpananthan",
    "jessica asato", "jess asato", "kate green", "ivana bartoletti",
    "martin edobor", "roy kennedy", "sara hyde",
}

GS_NAMES = {
    "e.r. pease", "edward pease", "edward r. pease",
    "w.s. sanders", "william sanders", "william stephen sanders",
    "f.w. galton", "frank galton", "john parker", "bosworth monck",
    "andrew filson", "donald chapman", "william rodgers", "shirley williams",
    "tom ponsonby", "dianne hayter", "ian martin", "john willman",
    "simon crine", "glenys thornton", "stephen twigg", "michael jacobs",
    "sunder katwala", "andrew harrop", "joe dromey",
}

PARTY_MAP = {
    "labour party": "Labour",
    "scottish labour party": "Labour",
    "labour and co-operative party": "Labour and Co-operative",
    "cooperative party": "Labour and Co-operative",
    "liberal democrats": "Liberal Democrat",
    "liberal party": "Liberal",
    "liberal party (uk)": "Liberal",
    "social democratic party": "SDP",
    "social democratic party (uk)": "SDP",
    "conservative party": "Conservative",
    "conservative party (uk)": "Conservative",
    "independent politician": "Independent",
    "independent labour party": "Independent",
}


def slugify(text: str) -> str:
    t = text.split("(")[0].strip().lower()
    t = t.replace("'", "").replace(",", "")
    for prefix in (
        "sir ",
        "dame ",
        "lord ",
        "lady ",
        "the rt hon ",
        "rt hon ",
    ):
        if t.startswith(prefix):
            t = t[len(prefix) :]
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t or "person"


def parse_time(value: str | None) -> str | None:
    if not value:
        return None
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", value)
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)}" if m else None


def year_only(iso: str | None) -> str | None:
    return iso[:4] if iso else None


def display_name(title: str, label: str | None) -> tuple[str, str | None]:
    honorific = None
    name = (label or title.split("(")[0]).strip()
    name = re.sub(r", \d+(st|nd|rd|th) .+$", "", name)
    if name.startswith("Sir "):
        honorific, name = "Sir", name[4:]
    elif name.startswith("Dame "):
        honorific, name = "Dame", name[5:]
    return name, honorific


def map_party(labels: list[str]) -> str:
    for raw in labels:
        key = raw.lower().strip()
        if key in PARTY_MAP:
            return PARTY_MAP[key]
        if "labour" in key:
            return "Labour"
        if "liberal democrat" in key:
            return "Liberal Democrat"
        if key == "liberal party":
            return "Liberal"
        if "conservative" in key:
            return "Conservative"
        if "sdp" in key or "social democratic" in key:
            return "SDP"
    return "unknown"


def map_sector(occupations: list[str], employers: list[str], description: str) -> str:
    blob = " ".join(occupations + employers + [description]).lower()
    if any(w in blob for w in ("trade union", "trade unionist", "labor leader", "labour leader")):
        return "union"
    if any(w in blob for w in ("civil servant", "diplomat", "ambassador")):
        return "civil_service"
    if any(w in blob for w in ("judge", "justice", "barrister", "lawyer")) and "politician" not in occupations[:1]:
        if "judge" in blob or "justice" in blob:
            return "public_body"
    if any(w in blob for w in ("physician", "surgeon", "nurse", "nhs")):
        return "nhs"
    if any(w in blob for w in ("journalist", "newspaper", "broadcaster", "editor")):
        return "media"
    if any(w in blob for w in ("novelist", "poet", "playwright", "writer", "author")) and "politician" not in blob:
        return "media"
    if any(w in blob for w in ("professor", "academic", "economist", "historian", "university", "lecturer")):
        return "academia"
    if any(w in blob for w in ("businessperson", "entrepreneur", "businessman", "company", "industrialist")):
        return "corporation"
    if any(w in blob for w in ("politician", "member of parliament", "prime minister", "peer of the realm")):
        return "politics"
    if any(w in blob for w in ("charity", "activist", "suffragist", "campaigner")):
        return "charity"
    if "politician" in blob:
        return "politics"
    return "other"


def map_position(sector: str, occupations: list[str], description: str, living: bool) -> tuple[str, str, str]:
    blob = f"{' '.join(occupations)} {description}".lower()
    chamber = "none"
    labour_role = "none"
    if "member of the house of lords" in blob or "life peer" in blob or "baron " in blob:
        return "peer", "lords", "none" if "labour" not in blob else "backbench"
    if "member of parliament" in blob or "mp " in blob or blob.endswith(" mp") or "politician" in blob:
        if any(w in blob for w in ("prime minister", "secretary of state", "chancellor", "foreign secretary")):
            labour_role = "former_minister"
        pos = "mp" if living and "former" not in description.lower() else "former_mp"
        if not living:
            pos = "former_mp"
        return pos, "commons", labour_role
    if sector == "academia":
        return "academic", "none", "none"
    if sector == "media" and any(w in blob for w in ("journalist", "editor", "broadcaster")):
        return "journalist", "none", "none"
    if sector == "media":
        return "writer", "none", "none"
    if sector == "civil_service":
        return ("diplomat" if "diplomat" in blob else "civil_servant"), "none", "none"
    if sector == "union":
        return "union_official", "none", "none"
    if sector == "corporation":
        return "corporate", "none", "none"
    if sector == "charity":
        return "charity", "none", "none"
    if sector == "nhs":
        return "other_public_figure", "none", "none"
    if sector == "public_body":
        return "judge" if "judge" in blob else "other_public_figure", "none", "none"
    if not living and sector == "politics":
        return "historical", "none", "none"
    return "other_public_figure", "none", "none"


def infer_existing_sector(person: dict) -> str:
    slug = person["slug"]
    special = {
        "sonia-adesara": "nhs",
        "thom-brooks": "academia",
        "luke-raikes": "think_tank",
        "joe-dromey": "think_tank",
        "andrew-harrop": "think_tank",
        "sunder-katwala": "think_tank",
        "michael-jacobs": "academia",
        "francesca-reynolds": "think_tank",
        "ivana-bartoletti": "corporation",
        "john-mills": "corporation",
        "ben-elton": "media",
        "ed-balls": "academia",
        "nick-butler": "think_tank",
        "christine-megson": "think_tank",
        "giles-wright": "think_tank",
        "paul-richards": "think_tank",
        "martin-edobor": "think_tank",
        "suresh-pushpananthan": "think_tank",
    }
    if slug in special:
        return special[slug]
    if person["positionType"] in {
        "mp",
        "former_mp",
        "peer",
        "msp",
        "senedd",
        "mayor",
        "pcc",
        "councillor",
        "combined_authority",
    }:
        return "politics"
    if person["positionType"] == "donor":
        return "corporation"
    return "think_tank"


def infer_existing_org(person: dict) -> str:
    if person.get("organisations"):
        return person["organisations"][0]["name"]
    mapping = {
        "mp": "House of Commons",
        "former_mp": "House of Commons",
        "peer": "House of Lords",
        "msp": "Scottish Parliament",
        "senedd": "Senedd",
        "mayor": "Mayoral office",
        "pcc": "Police and crime commissioner office",
        "councillor": "Local government",
        "combined_authority": "Combined authority",
    }
    if person["positionType"] in mapping:
        return mapping[person["positionType"]]
    return "Fabian Society"


def migrate_existing(people: list[dict]) -> list[dict]:
    out = []
    for person in people:
        party = person["party"]
        if party == "Not stated":
            party = "unknown"
        org = infer_existing_org(person)
        job = person["currentPosition"].split(";")[0].strip()
        if not person.get("organisations"):
            person["organisations"] = [{"name": org, "kind": infer_existing_sector(person), "role": job}]
        person.update(
            {
                "living": True,
                "jobTitle": job,
                "organisation": org,
                "sector": infer_existing_sector(person),
                "party": party,
                "sourceQuality": "corroborated",
            }
        )
        out.append(person)
    return out


def fabian_role_from_cats(title: str, cats: list[str]) -> tuple[str, str]:
    joined = " ".join(cats).lower() + " " + title.lower()
    if "general secretar" in joined:
        return "general_secretary", "General secretary"
    if "chairs of the fabian" in joined or "chair of the fabian" in joined:
        return "chair", "Chair"
    if "presidents of the fabian" in joined:
        return "vice_president", "President or honorary officer"
    if "treasurers of the fabian" in joined:
        return "treasurer", "Treasurer"
    return "member", "Member"


def is_named_officer(title: str) -> bool:
    key = title.split("(")[0].strip().lower()
    key = re.sub(r", .+$", "", key)
    return any(n in key for n in CHAIR_NAMES | GS_NAMES) or key in CHAIR_NAMES | GS_NAMES


def first_fabian_sentence(extract: str) -> str:
    parts = re.split(r"(?<=[.!?])\s+", extract)
    for part in parts:
        if re.search(r"Fabian", part):
            return part.strip()[:320]
    return "The Wikipedia article body records a Fabian Society link."


def build_wiki_person(row: dict, used: set[str]) -> dict | None:
    wd = WD.get(row.get("qid") or "", {})
    title = row["title"]
    if title.startswith(("List of ", "Young Fabians", "Fabian Society")):
        return None
    name, honorific = display_name(title, wd.get("label"))
    slug = slugify(name)
    if slug in used:
        extra = title[title.find("(") + 1 : title.find(")")] if "(" in title else row.get("qid") or "wiki"
        slug = slugify(f"{name} {extra}")
    if slug in used:
        return None
    died = parse_time(wd.get("death"))
    living = not bool(died)
    occupations = wd.get("occupation_labels") or []
    employers = wd.get("employer_labels") or []
    description = wd.get("description") or ""
    sector = map_sector(occupations, employers, description)
    position_type, chamber, labour_role = map_position(sector, occupations, description, living)
    party = map_party(wd.get("party_labels") or [])
    organisation = employers[0] if employers else (
        "House of Commons"
        if position_type in {"mp", "former_mp"}
        else "House of Lords"
        if position_type == "peer"
        else occupations[0].title()
        if occupations
        else "Not stated in sources used"
    )
    job = (wd.get("position_labels") or [None])[0] or (occupations[0] if occupations else description) or "Public figure"
    job = job[0].upper() + job[1:] if job else "Public figure"
    if not living and died:
        current = f"{job}; last known organisation {organisation} (died {year_only(died)})"
    else:
        current = f"{job}, {organisation}" if organisation != "Not stated in sources used" else job

    status, status_title = fabian_role_from_cats(title, row.get("categories") or [])
    officer = is_named_officer(title) or status in {"chair", "general_secretary", "treasurer"}
    corroborated = officer
    sentence = first_fabian_sentence(row.get("extract") or "")
    if officer:
        summary = (
            f"Named on the Society chairs or general secretaries list, or a matching Wikipedia officer category. {sentence}"
        )
        quality = "corroborated"
        sources = [
            {"url": HISTORY, "label": "Fabian Society, Our history", "accessed": ACCESS},
            {"url": row["url"], "label": f"Wikipedia, {title}", "accessed": ACCESS},
        ]
    else:
        summary = sentence
        quality = "wikipedia_only"
        sources = [{"url": row["url"], "label": f"Wikipedia, {title}", "accessed": ACCESS}]

    inclusion = "named_role_or_membership"
    if not row.get("has_member_phrase") and status == "member" and "author" in sentence.lower() and "member" not in sentence.lower():
        inclusion = "documented_output_only"
        status = "pamphlet_author"
        status_title = "Pamphlet or essay author"

    person = {
        "slug": slug,
        "name": name,
        "currentPosition": current,
        "living": living,
        "jobTitle": job,
        "organisation": organisation,
        "sector": sector,
        "positionType": position_type,
        "chamber": chamber,
        "labourRole": labour_role,
        "party": party,
        "fabianSummary": summary,
        "primaryFabianStatus": status,
        "inclusionBasis": inclusion,
        "sourceQuality": quality,
        "involvement": [
            {
                "status": status,
                "title": status_title,
                "current": living and status == "member" and inclusion == "named_role_or_membership",
                "summary": sentence,
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [{"name": organisation, "kind": sector, "role": job}],
        "sources": sources,
    }
    if honorific:
        person["honorific"] = honorific
    if died:
        person["died"] = died
    used.add(slug)
    return person


EXTRA_OFFICERS = [
    {
        "slug": "gd-cole",
        "name": "G. D. H. Cole",
        "living": False,
        "died": "1959-01-14",
        "jobTitle": "Political theorist and historian",
        "organisation": "University of Oxford",
        "sector": "academia",
        "currentPosition": "Chichele Professor of Social and Political Theory, University of Oxford (died 1959)",
        "positionType": "academic",
        "party": "Labour",
        "primaryFabianStatus": "chair",
        "title": "Chair",
        "start": "1939",
        "end": "1950",
        "summary": "Named as chair 1939–46 and 1948–50 on the Society history table.",
    },
    {
        "slug": "harold-laski",
        "name": "Harold Laski",
        "living": False,
        "died": "1950-03-24",
        "jobTitle": "Political theorist",
        "organisation": "London School of Economics",
        "sector": "academia",
        "currentPosition": "Professor of Political Science, LSE (died 1950)",
        "positionType": "academic",
        "party": "Labour",
        "primaryFabianStatus": "chair",
        "title": "Chair",
        "start": "1946",
        "end": "1948",
        "summary": "Named as chair 1946–48 on the Society history table.",
    },
    {
        "slug": "harold-wilson",
        "name": "Harold Wilson",
        "honorific": "The Rt Hon Lord Wilson of Rievaulx",
        "living": False,
        "died": "1995-05-24",
        "jobTitle": "Prime Minister of the United Kingdom",
        "organisation": "HM Government",
        "sector": "politics",
        "currentPosition": "Prime Minister, 1964–70 and 1974–76 (died 1995)",
        "positionType": "former_mp",
        "constituency": "Huyton",
        "chamber": "commons",
        "labourRole": "former_minister",
        "party": "Labour",
        "primaryFabianStatus": "chair",
        "title": "Chair",
        "start": "1954",
        "end": "1955",
        "summary": "Named as chair 1954–55 on the Society history table.",
    },
    {
        "slug": "roy-jenkins",
        "name": "Roy Jenkins",
        "honorific": "The Rt Hon Lord Jenkins of Hillhead",
        "living": False,
        "died": "2003-01-05",
        "jobTitle": "Chancellor of the Exchequer and later Liberal Democrat peer",
        "organisation": "House of Lords",
        "sector": "politics",
        "currentPosition": "Former Labour cabinet minister; later Liberal Democrat leader in the Lords (died 2003)",
        "positionType": "former_mp",
        "party": "Liberal Democrat",
        "primaryFabianStatus": "chair",
        "title": "Chair",
        "start": "1957",
        "end": "1958",
        "summary": "Named as chair 1957–58. Later a founder of the SDP.",
    },
    {
        "slug": "anthony-crosland",
        "name": "Anthony Crosland",
        "honorific": "The Rt Hon",
        "living": False,
        "died": "1977-02-19",
        "jobTitle": "Foreign Secretary",
        "organisation": "HM Government",
        "sector": "politics",
        "currentPosition": "Foreign Secretary (died 1977); author of The Future of Socialism",
        "positionType": "former_mp",
        "party": "Labour",
        "primaryFabianStatus": "chair",
        "title": "Chair",
        "start": "1961",
        "end": "1962",
        "summary": "Named as C.A.R. Crosland, chair 1961–62. Also a New Fabian Essays contributor.",
    },
    {
        "slug": "tony-benn",
        "name": "Tony Benn",
        "honorific": "The Rt Hon",
        "living": False,
        "died": "2014-03-14",
        "jobTitle": "Secretary of State for Industry",
        "organisation": "House of Commons",
        "sector": "politics",
        "currentPosition": "Former cabinet minister; MP for Bristol South East and Chesterfield (died 2014)",
        "positionType": "former_mp",
        "party": "Labour",
        "primaryFabianStatus": "chair",
        "title": "Chair",
        "start": "1964",
        "end": "1965",
        "summary": "Named as Anthony Wedgwood Benn, chair 1964–65.",
    },
    {
        "slug": "shirley-williams",
        "name": "Shirley Williams",
        "honorific": "The Rt Hon Baroness Williams of Crosby",
        "living": False,
        "died": "2021-04-12",
        "jobTitle": "Secretary of State for Education and Science; SDP founder",
        "organisation": "House of Lords",
        "sector": "politics",
        "currentPosition": "Former Labour cabinet minister; later Liberal Democrat peer (died 2021)",
        "positionType": "peer",
        "chamber": "lords",
        "party": "Liberal Democrat",
        "primaryFabianStatus": "chair",
        "title": "Chair and general secretary",
        "start": "1960",
        "end": "1981",
        "summary": "General secretary 1960–63; chair 1980–81. The history page records her SDP founding and the resulting membership dispute.",
    },
    {
        "slug": "robin-cook",
        "name": "Robin Cook",
        "honorific": "The Rt Hon",
        "living": False,
        "died": "2005-08-06",
        "jobTitle": "Foreign Secretary",
        "organisation": "HM Government",
        "sector": "politics",
        "currentPosition": "Foreign Secretary, 1997–2001 (died 2005)",
        "positionType": "former_mp",
        "party": "Labour",
        "primaryFabianStatus": "chair",
        "title": "Chair",
        "start": "1990",
        "end": "1991",
        "summary": "Named as chair 1990–91.",
    },
    {
        "slug": "ben-pimlott",
        "name": "Ben Pimlott",
        "living": False,
        "died": "2004-04-10",
        "jobTitle": "Historian and biographer",
        "organisation": "Goldsmiths, University of London",
        "sector": "academia",
        "currentPosition": "Warden of Goldsmiths; Labour historian (died 2004)",
        "positionType": "academic",
        "party": "Labour",
        "primaryFabianStatus": "chair",
        "title": "Chair",
        "start": "1993",
        "end": "1994",
        "summary": "Named as chair 1993–94.",
    },
    {
        "slug": "eric-joyce",
        "name": "Eric Joyce",
        "living": True,
        "jobTitle": "Former MP for Falkirk",
        "organisation": "House of Commons",
        "sector": "politics",
        "currentPosition": "Former Labour MP for Falkirk; later sat as an independent",
        "positionType": "former_mp",
        "party": "Independent",
        "primaryFabianStatus": "chair",
        "title": "Chair",
        "start": "2004",
        "end": "2005",
        "summary": "Named as chair 2004–05. He later left the Labour whip.",
    },
    {
        "slug": "edward-pease",
        "name": "Edward R. Pease",
        "living": False,
        "died": "1955-01-05",
        "jobTitle": "Founding general secretary of the Fabian Society",
        "organisation": "Fabian Society",
        "sector": "think_tank",
        "currentPosition": "General secretary, 1891–1913 (died 1955)",
        "positionType": "historical",
        "party": "Labour",
        "primaryFabianStatus": "general_secretary",
        "title": "General secretary",
        "start": "1891",
        "end": "1913",
        "summary": "Named as general secretary 1891–1913, and acting 1915–19. Author of the 1916 Society history.",
    },
    {
        "slug": "simon-crine",
        "name": "Simon Crine",
        "living": True,
        "jobTitle": "Former general secretary of the Fabian Society",
        "organisation": "Fabian Society",
        "sector": "think_tank",
        "currentPosition": "General secretary, 1990–96",
        "positionType": "other_public_figure",
        "party": "Labour",
        "primaryFabianStatus": "general_secretary",
        "title": "General secretary",
        "start": "1990",
        "end": "1996",
        "summary": "Named as general secretary 1990–1996.",
    },
    {
        "slug": "john-willman",
        "name": "John Willman",
        "living": True,
        "jobTitle": "Former general secretary of the Fabian Society",
        "organisation": "Fabian Society",
        "sector": "think_tank",
        "currentPosition": "General secretary, 1985–89",
        "positionType": "other_public_figure",
        "party": "Labour",
        "primaryFabianStatus": "general_secretary",
        "title": "General secretary",
        "start": "1985",
        "end": "1989",
        "summary": "Named as general secretary 1985–89.",
    },
    {
        "slug": "tessa-blackstone",
        "name": "Tessa Blackstone",
        "honorific": "The Rt Hon Baroness Blackstone",
        "living": True,
        "jobTitle": "Member of the House of Lords",
        "organisation": "House of Lords",
        "sector": "politics",
        "currentPosition": "Labour peer; former minister of state",
        "positionType": "peer",
        "chamber": "lords",
        "labourRole": "former_minister",
        "party": "Labour",
        "primaryFabianStatus": "chair",
        "title": "Chair",
        "start": "1984",
        "end": "1985",
        "summary": "Named as chair 1984–85.",
    },
    {
        "slug": "austin-mitchell",
        "name": "Austin Mitchell",
        "living": False,
        "died": "2021-08-18",
        "jobTitle": "MP for Great Grimsby",
        "organisation": "House of Commons",
        "sector": "politics",
        "currentPosition": "Labour MP for Great Grimsby, 1977–2015 (died 2021)",
        "positionType": "former_mp",
        "party": "Labour",
        "primaryFabianStatus": "chair",
        "title": "Chair",
        "start": "1986",
        "end": "1987",
        "summary": "Named as chair 1986–87.",
    },
    {
        "slug": "bryan-gould",
        "name": "Bryan Gould",
        "living": True,
        "jobTitle": "Former MP; later university vice-chancellor",
        "organisation": "University of Waikato",
        "sector": "academia",
        "currentPosition": "Former Labour MP; Vice-Chancellor of the University of Waikato",
        "positionType": "former_mp",
        "party": "Labour",
        "primaryFabianStatus": "chair",
        "title": "Chair",
        "start": "1988",
        "end": "1989",
        "summary": "Named as chair 1988–89.",
    },
    {
        "slug": "giles-radice",
        "name": "Giles Radice",
        "honorific": "The Rt Hon Lord Radice",
        "living": False,
        "died": "2022-08-25",
        "jobTitle": "Labour peer and former MP",
        "organisation": "House of Lords",
        "sector": "politics",
        "currentPosition": "Former MP for North Durham; later a Labour peer (died 2022)",
        "positionType": "peer",
        "chamber": "lords",
        "party": "Labour",
        "primaryFabianStatus": "chair",
        "title": "Chair",
        "start": "1976",
        "end": "1977",
        "summary": "Named as chair 1976–77. The Southern Discomfort series is associated with his later work for the Society.",
    },
    {
        "slug": "peter-shore",
        "name": "Peter Shore",
        "honorific": "The Rt Hon Lord Shore of Stepney",
        "living": False,
        "died": "2001-09-24",
        "jobTitle": "Secretary of State for the Environment",
        "organisation": "HM Government",
        "sector": "politics",
        "currentPosition": "Labour cabinet minister; later a peer (died 2001)",
        "positionType": "former_mp",
        "party": "Labour",
        "primaryFabianStatus": "chair",
        "title": "Chair",
        "start": "1968",
        "end": "1969",
        "summary": "Named as chair 1968–69.",
    },
    {
        "slug": "william-rodgers",
        "name": "William Rodgers",
        "honorific": "The Rt Hon Lord Rodgers of Quarry Bank",
        "living": True,
        "jobTitle": "Liberal Democrat peer; SDP founder",
        "organisation": "House of Lords",
        "sector": "politics",
        "currentPosition": "Former Labour cabinet minister; later Liberal Democrat peer",
        "positionType": "peer",
        "chamber": "lords",
        "party": "Liberal Democrat",
        "primaryFabianStatus": "chair",
        "title": "Chair and general secretary",
        "start": "1953",
        "end": "1967",
        "summary": "General secretary 1953–60; chair 1966–67. Later a founder of the SDP.",
    },
]


def extra_to_person(raw: dict) -> dict:
    chamber = raw.get("chamber", "commons" if raw["positionType"] in {"mp", "former_mp"} else "none")
    person = {
        "slug": raw["slug"],
        "name": raw["name"],
        "living": raw["living"],
        "jobTitle": raw["jobTitle"],
        "organisation": raw["organisation"],
        "sector": raw["sector"],
        "currentPosition": raw["currentPosition"],
        "positionType": raw["positionType"],
        "chamber": chamber,
        "labourRole": raw.get("labourRole", "former_minister" if raw["sector"] == "politics" else "none"),
        "party": raw["party"],
        "fabianSummary": raw["summary"],
        "primaryFabianStatus": raw["primaryFabianStatus"],
        "inclusionBasis": "named_role_or_membership",
        "sourceQuality": "corroborated",
        "involvement": [
            {
                "status": raw["primaryFabianStatus"],
                "title": raw["title"],
                "start": raw.get("start"),
                "end": raw.get("end"),
                "current": False,
                "summary": raw["summary"],
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [
            {"name": raw["organisation"], "kind": raw["sector"], "role": raw["jobTitle"]}
        ],
        "sources": [
            {"url": HISTORY, "label": "Fabian Society chairs and general secretaries", "accessed": ACCESS},
        ],
    }
    if raw.get("honorific"):
        person["honorific"] = raw["honorific"]
    if raw.get("died"):
        person["died"] = raw["died"]
    if raw.get("constituency"):
        person["constituency"] = raw["constituency"]
    return person


def main() -> None:
    existing = json.loads(PEOPLE_PATH.read_text())
    people = migrate_existing(existing)
    used = {p["slug"] for p in people}
    names = {p["name"].lower() for p in people}

    added_wiki = 0
    for row in WIKI:
        label = (WD.get(row.get("qid") or "", {}).get("label") or row["title"]).split("(")[0].strip()
        if label.lower() in names or row["title"].split("(")[0].strip().lower() in names:
            continue
        person = build_wiki_person(row, used)
        if not person:
            continue
        people.append(person)
        names.add(person["name"].lower())
        added_wiki += 1

    added_extra = 0
    for raw in EXTRA_OFFICERS:
        if raw["slug"] in used or raw["name"].lower() in names:
            continue
        people.append(extra_to_person(raw))
        used.add(raw["slug"])
        names.add(raw["name"].lower())
        added_extra += 1

    PEOPLE_PATH.write_text(json.dumps(people, indent=2, ensure_ascii=False) + "\n")
    living = sum(1 for p in people if p.get("living"))
    wiki_only = sum(1 for p in people if p.get("sourceQuality") == "wikipedia_only")
    print(
        f"total={len(people)} wiki_added={added_wiki} extra_added={added_extra} "
        f"living={living} deceased={len(people)-living} wiki_only={wiki_only}"
    )


if __name__ == "__main__":
    main()
