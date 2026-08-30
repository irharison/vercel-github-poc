#!/usr/bin/env python3
"""Append sourced former office-holders and other public figures."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "data" / "people.json"
ACCESS = "2026-08-30"


def src(url: str, label: str) -> dict:
    return {"url": url, "label": label, "accessed": ACCESS}


HISTORY = "https://fabians.org.uk/about-us/our-history/"
PEOPLE = "https://fabians.org.uk/about-us/our-people/"
EXEC = "https://fabians.org.uk/about-us/our-people/executive-committee-2017-19/"
VIEWS = "https://fabians.org.uk/views-from-the-top/"
SHAPE = "https://fabians.org.uk/publication/the-shape-of-things-to-come/"
LEADERSHIP = "https://fabians.org.uk/publication/the-labour-leadership/"
LEADING = "https://fabians.org.uk/publication/leading-labour-the-fabian-essays/"
FINANCE = "https://fabians.org.uk/wp-content/uploads/2019/06/Financial-Transparency-2017-18.pdf"

new_people = [
    {
        "slug": "david-sainsbury",
        "name": "David Sainsbury",
        "honorific": "The Rt Hon Lord Sainsbury of Turville",
        "currentPosition": "Retired Labour peer; former Minister for Science and Innovation",
        "positionType": "peer",
        "constituency": "Turville (life peerage)",
        "chamber": "lords",
        "labourRole": "former_minister",
        "party": "Labour",
        "fabianSummary": "Named by Dianne Hayter as a Fabian executive member who left with the 1981 SDP split. Later a major Labour Party donor. No Society gift in his name was found in the sources used.",
        "primaryFabianStatus": "executive",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "executive",
                "title": "Executive committee member (named in the 1981 SDP split)",
                "end": "1981",
                "current": False,
                "summary": "In Views from the Top, Dianne Hayter says the Society lost vice-chair Shirley Williams, treasurer John Roper, John Cartwright and David Sainsbury when they joined the SDP. They argued they should remain members; the November 1981 AGM then removed them. This is a named former executive role, not a statement of current membership.",
            }
        ],
        "outputs": [],
        "donations": [
            {
                "donor": "Lord Sainsbury of Turville",
                "amount": "£3,070,000",
                "date": "2023",
                "nature": "Donations to the Labour Party reported for 2023. This is not a gift to the Fabian Society.",
                "recipient": "Labour Party",
                "recordUrl": "https://www.bbc.co.uk/news/uk-politics-68499719",
                "fabianRelated": False,
            },
            {
                "donor": "Lord Sainsbury of Turville",
                "amount": "£2,000,000",
                "date": "2023-02",
                "nature": "First large Labour donation after he withdrew support in the Corbyn years. This is not a gift to the Fabian Society.",
                "recipient": "Labour Party",
                "recordUrl": "https://www.theguardian.com/politics/2023/feb/25/lord-sainsbury-returns-to-the-labour-fold-with-2m-donation",
                "fabianRelated": False,
            },
        ],
        "organisations": [
            {
                "name": "House of Lords",
                "kind": "legislature",
                "role": "Life peer from 3 October 1997; left the House on 1 July 2021",
            }
        ],
        "sources": [
            src(VIEWS, "Dianne Hayter in Views from the Top"),
            src("https://members.parliament.uk/member/2161/career", "UK Parliament, Lord Sainsbury of Turville"),
            src(
                "https://www.bbc.co.uk/news/uk-politics-68499719",
                "BBC News, 2023 Labour individual donations (Electoral Commission figures)",
            ),
            src(
                "https://www.theguardian.com/politics/2023/feb/25/lord-sainsbury-returns-to-the-labour-fold-with-2m-donation",
                "Guardian, 25 February 2023, £2m Labour donation",
            ),
            src(FINANCE, "Fabian Society financial transparency 2017–18 (Sainsbury not named)"),
        ],
    },
    {
        "slug": "ed-balls",
        "name": "Ed Balls",
        "honorific": "The Rt Hon",
        "currentPosition": "Professor of Political Economy, King’s College London; former MP and shadow chancellor",
        "positionType": "former_mp",
        "constituency": "Morley and Outwood (until 2015)",
        "chamber": "commons",
        "labourRole": "former_mp",
        "party": "Labour",
        "fabianSummary": "Chair 2006–07. The society’s history says a pamphlet of his proposed Bank of England independence. Essay in The Labour Leadership (2010).",
        "primaryFabianStatus": "chair",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "chair",
                "title": "Chair",
                "start": "2006",
                "end": "2007",
                "current": False,
                "summary": "Named in the society’s chairs list.",
            }
        ],
        "outputs": [
            {
                "kind": "pamphlet",
                "title": "Pamphlet proposing independence for the Bank of England",
                "url": HISTORY,
            },
            {
                "kind": "essay",
                "title": "Essay in The Labour Leadership",
                "date": "2010-08-20",
                "url": LEADERSHIP,
            },
        ],
        "donations": [],
        "organisations": [
            {
                "name": "King’s College London",
                "kind": "university",
                "role": "Professor of Political Economy",
            }
        ],
        "sources": [
            src(HISTORY, "Fabian Society chairs list and New Labour history"),
            src(LEADERSHIP, "The Labour Leadership"),
            src("https://www.edballs.co.uk/about", "Ed Balls, About"),
            src(
                "https://thestrandgroup.kcl.ac.uk/about/core-team/",
                "The Strand Group, King’s College London",
            ),
        ],
    },
    {
        "slug": "stephen-twigg",
        "name": "Stephen Twigg",
        "currentPosition": "Secretary-General, Commonwealth Parliamentary Association; former MP",
        "positionType": "former_mp",
        "constituency": "Liverpool West Derby (2010–19); Enfield Southgate (1997–2005)",
        "chamber": "commons",
        "labourRole": "former_mp",
        "party": "Labour and Co-operative",
        "fabianSummary": "General secretary 1996–97; chair 2003–04.",
        "primaryFabianStatus": "general_secretary",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "general_secretary",
                "title": "General secretary",
                "start": "1996",
                "end": "1997",
                "current": False,
                "summary": "Named in the society’s general secretaries list.",
            },
            {
                "status": "chair",
                "title": "Chair",
                "start": "2003",
                "end": "2004",
                "current": False,
                "summary": "Named in the society’s chairs list.",
            },
        ],
        "outputs": [],
        "donations": [],
        "organisations": [
            {
                "name": "Commonwealth Parliamentary Association",
                "kind": "parliamentary association",
                "role": "Secretary-General",
            }
        ],
        "sources": [
            src(HISTORY, "Fabian Society chairs and general secretaries"),
            src("https://www.cpahq.org/about-us/secretariat/", "CPA Headquarters Secretariat"),
        ],
    },
    {
        "slug": "paul-richards",
        "name": "Paul Richards",
        "currentPosition": "Treasurer of the Fabian Society; Labour and Co-operative candidate for Sussex Police and Crime Commissioner",
        "positionType": "other_public_figure",
        "constituency": "Sussex",
        "chamber": "none",
        "labourRole": "think_tank",
        "party": "Labour and Co-operative",
        "fabianSummary": "Current treasurer; chair 2002–03; the executive biography says he is the author of several Fabian pamphlets.",
        "primaryFabianStatus": "treasurer",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "treasurer",
                "title": "Treasurer",
                "current": True,
                "summary": "Listed as treasurer on the current executive committee page.",
            },
            {
                "status": "chair",
                "title": "Chair",
                "start": "2002",
                "end": "2003",
                "current": False,
                "summary": "Named in the society’s chairs list and on his executive biography.",
            },
        ],
        "outputs": [
            {
                "kind": "pamphlet",
                "title": "Several Fabian pamphlets (titles not listed on the executive page)",
                "url": EXEC,
            }
        ],
        "donations": [],
        "organisations": [],
        "sources": [
            src(EXEC, "Fabian Society executive committee, Paul Richards"),
            src(HISTORY, "Fabian Society chairs list"),
        ],
    },
    {
        "slug": "joe-dromey",
        "name": "Joe Dromey",
        "currentPosition": "General secretary of the Fabian Society",
        "positionType": "other_public_figure",
        "chamber": "none",
        "labourRole": "think_tank",
        "party": "Labour",
        "fabianSummary": "General secretary from 20 January 2025. Previously a Lewisham councillor and cabinet member.",
        "primaryFabianStatus": "general_secretary",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "general_secretary",
                "title": "General secretary",
                "start": "2025-01-20",
                "current": True,
                "summary": "Appointed in a Society announcement; the history table lists him from 2025.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [
            {
                "name": "London Borough of Lewisham",
                "kind": "local government",
                "role": "Former councillor and cabinet member (seven years)",
            }
        ],
        "sources": [
            src(
                "https://fabians.org.uk/joe-dromey-announced-as-new-general-secretary-of-the-fabian-society/",
                "Joe Dromey announced as new general secretary",
            ),
            src(HISTORY, "Fabian Society general secretaries list"),
        ],
    },
    {
        "slug": "andrew-harrop",
        "name": "Andrew Harrop",
        "currentPosition": "Former general secretary of the Fabian Society (2011–24)",
        "positionType": "other_public_figure",
        "chamber": "none",
        "labourRole": "think_tank",
        "party": "Labour",
        "fabianSummary": "General secretary from August 2011 until after the 2024 Labour conference. Author and editor of Society publications including The Economic Alternative.",
        "primaryFabianStatus": "general_secretary",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "general_secretary",
                "title": "General secretary",
                "start": "2011-08",
                "end": "2024-09",
                "current": False,
                "summary": "Named on the history table (2011–2024) and in his step-down announcement.",
            }
        ],
        "outputs": [
            {
                "kind": "report",
                "title": "The Economic Alternative (editor)",
                "date": "2012-02-15",
                "url": "https://fabians.org.uk/publication/the-economic-alternative/",
            }
        ],
        "donations": [],
        "organisations": [],
        "sources": [
            src(
                "https://fabians.org.uk/andrew-harrop-to-step-down-as-general-secretary-of-the-fabian-society/",
                "Andrew Harrop to step down as general secretary",
            ),
            src(HISTORY, "Fabian Society general secretaries list"),
            src("https://fabians.org.uk/publication/the-economic-alternative/", "The Economic Alternative"),
            src(VIEWS, "Views from the Top"),
        ],
    },
    {
        "slug": "sunder-katwala",
        "name": "Sunder Katwala",
        "currentPosition": "Director of British Future; former general secretary of the Fabian Society",
        "positionType": "other_public_figure",
        "chamber": "none",
        "labourRole": "think_tank",
        "party": "Labour",
        "fabianSummary": "General secretary 2003–11. British Future’s staff page also records that he led the Society in those years.",
        "primaryFabianStatus": "general_secretary",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "general_secretary",
                "title": "General secretary",
                "start": "2003",
                "end": "2011",
                "current": False,
                "summary": "Named on the history table, in Views from the Top, and on the British Future staff page.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [
            {
                "name": "British Future",
                "kind": "think tank",
                "role": "Director",
            }
        ],
        "sources": [
            src(HISTORY, "Fabian Society general secretaries list"),
            src(VIEWS, "Views from the Top"),
            src("https://www.britishfuture.org/about-us/who-we-are/", "British Future, Who we are"),
        ],
    },
    {
        "slug": "michael-jacobs",
        "name": "Michael Jacobs",
        "currentPosition": "Professor of political economy; former general secretary of the Fabian Society",
        "positionType": "other_public_figure",
        "chamber": "none",
        "labourRole": "think_tank",
        "party": "Labour",
        "fabianSummary": "General secretary 1997–2003. The University of Sheffield staff page and his own biography record the same dates.",
        "primaryFabianStatus": "general_secretary",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "general_secretary",
                "title": "General secretary",
                "start": "1997",
                "end": "2003",
                "current": False,
                "summary": "Named on the history table and in Views from the Top.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [
            {
                "name": "University of Sheffield",
                "kind": "university",
                "role": "Professor (Faculty of Social Sciences staff page)",
            }
        ],
        "sources": [
            src(HISTORY, "Fabian Society general secretaries list"),
            src(VIEWS, "Views from the Top"),
            src(
                "https://sheffield.ac.uk/social-sciences/our-people/faculty-leadership/michael-jacobs",
                "University of Sheffield, Professor Michael Jacobs",
            ),
            src("http://www.michaeljacobs.org/biography.html", "Michael Jacobs, Biography"),
        ],
    },
    {
        "slug": "nick-butler",
        "name": "Nick Butler",
        "currentPosition": "Vice-president of the Fabian Society; chair 1987–88",
        "positionType": "other_public_figure",
        "chamber": "none",
        "labourRole": "think_tank",
        "party": "Labour",
        "fabianSummary": "Current vice-president; chair 1987–88.",
        "primaryFabianStatus": "vice_president",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "vice_president",
                "title": "Vice-president",
                "current": True,
                "summary": "Listed among current vice-presidents on Our people.",
            },
            {
                "status": "chair",
                "title": "Chair",
                "start": "1987",
                "end": "1988",
                "current": False,
                "summary": "Named in the society’s chairs list.",
            },
        ],
        "outputs": [],
        "donations": [],
        "organisations": [],
        "sources": [
            src(PEOPLE, "Fabian Society, Our people"),
            src(HISTORY, "Fabian Society chairs list"),
        ],
    },
    {
        "slug": "christine-megson",
        "name": "Christine Megson",
        "currentPosition": "Vice-president of the Fabian Society",
        "positionType": "other_public_figure",
        "chamber": "none",
        "labourRole": "think_tank",
        "party": "Labour",
        "fabianSummary": "Listed among current vice-presidents.",
        "primaryFabianStatus": "vice_president",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "vice_president",
                "title": "Vice-president",
                "current": True,
                "summary": "Named on the society’s Our people page.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [],
        "sources": [src(PEOPLE, "Fabian Society, Our people")],
    },
    {
        "slug": "giles-wright",
        "name": "Giles Wright",
        "currentPosition": "Vice-president of the Fabian Society",
        "positionType": "other_public_figure",
        "chamber": "none",
        "labourRole": "think_tank",
        "party": "Labour",
        "fabianSummary": "Listed among current vice-presidents.",
        "primaryFabianStatus": "vice_president",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "vice_president",
                "title": "Vice-president",
                "current": True,
                "summary": "Named on the society’s Our people page.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [],
        "sources": [src(PEOPLE, "Fabian Society, Our people")],
    },
    {
        "slug": "sonia-adesara",
        "name": "Sonia Adesara",
        "honorific": "Dr",
        "currentPosition": "Co-chair of the Fabian Society; NHS GP",
        "positionType": "other_public_figure",
        "chamber": "none",
        "labourRole": "think_tank",
        "party": "Labour",
        "fabianSummary": "Current co-chair with Anneliese Dodds. The executive biography describes her as an NHS GP.",
        "primaryFabianStatus": "co_chair",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "co_chair",
                "title": "Co-chair",
                "start": "2026-08",
                "current": True,
                "summary": "Listed as co-chair on the executive page; LabourList published a joint piece by the new co-chairs in August 2026.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [
            {
                "name": "NHS",
                "kind": "public service",
                "role": "GP",
            }
        ],
        "sources": [
            src(EXEC, "Fabian Society executive committee, Sonia Adesara"),
            src(
                "https://labourlist.org/2026/08/are-you-already-thinking-like-a-fabian/",
                "LabourList, August 2026 co-chair article",
            ),
            src(
                "https://fabians.org.uk/joe-dromey-announced-as-new-general-secretary-of-the-fabian-society/",
                "Joe Dromey announcement (then chair Dr Sonia Adesara)",
            ),
        ],
    },
    {
        "slug": "thom-brooks",
        "name": "Thom Brooks",
        "currentPosition": "Professor of Law, Ethics and Government, Durham University; Fabian executive member",
        "positionType": "other_public_figure",
        "chamber": "none",
        "labourRole": "think_tank",
        "party": "Labour",
        "fabianSummary": "Serving executive member. Author of New Arrivals, which won the Jenny Jeger Prize in 2022. The pamphlet page says he is a member of the executive.",
        "primaryFabianStatus": "executive",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "executive",
                "title": "Executive committee member",
                "current": True,
                "summary": "Listed on the current executive page and named as an executive member on the New Arrivals page.",
            }
        ],
        "outputs": [
            {
                "kind": "pamphlet",
                "title": "New Arrivals: A Fair Immigration Plan for Labour",
                "date": "2022-04-13",
                "url": "https://fabians.org.uk/publication/new-arrivals/",
            }
        ],
        "donations": [],
        "organisations": [
            {
                "name": "Durham University",
                "kind": "university",
                "role": "Principal of Collingwood College; Professor of Law, Ethics and Government",
            }
        ],
        "sources": [
            src(EXEC, "Fabian Society executive committee, Thom Brooks"),
            src("https://fabians.org.uk/publication/new-arrivals/", "New Arrivals"),
        ],
    },
    {
        "slug": "gordon-marsden",
        "name": "Gordon Marsden",
        "currentPosition": "Former MP for Blackpool South; chair of the Fabian Society 2000–01",
        "positionType": "former_mp",
        "constituency": "Blackpool South (until 2019)",
        "chamber": "commons",
        "labourRole": "former_mp",
        "party": "Labour",
        "fabianSummary": "Chair 2000–01.",
        "primaryFabianStatus": "chair",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "chair",
                "title": "Chair",
                "start": "2000",
                "end": "2001",
                "current": False,
                "summary": "Named in the society’s chairs list.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [],
        "sources": [
            src(HISTORY, "Fabian Society chairs list"),
            src("https://www.theyworkforyou.com/mp/gordon_marsden", "TheyWorkForYou, Gordon Marsden"),
        ],
    },
    {
        "slug": "denis-macshane",
        "name": "Denis MacShane",
        "currentPosition": "Former MP for Rotherham; chair of the Fabian Society 2001–02",
        "positionType": "former_mp",
        "constituency": "Rotherham (until 2012)",
        "chamber": "commons",
        "labourRole": "former_minister",
        "party": "Labour",
        "fabianSummary": "Chair 2001–02.",
        "primaryFabianStatus": "chair",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "chair",
                "title": "Chair",
                "start": "2001",
                "end": "2002",
                "current": False,
                "summary": "Named in the society’s chairs list.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [],
        "sources": [
            src(HISTORY, "Fabian Society chairs list"),
            src("https://www.theyworkforyou.com/mp/denis_macshane", "TheyWorkForYou, Denis MacShane"),
        ],
    },
    {
        "slug": "tony-wright",
        "name": "Tony Wright",
        "currentPosition": "Former MP for Cannock Chase; chair of the Fabian Society 1998–99",
        "positionType": "former_mp",
        "constituency": "Cannock Chase (until 2010)",
        "chamber": "commons",
        "labourRole": "former_mp",
        "party": "Labour",
        "fabianSummary": "Chair 1998–99.",
        "primaryFabianStatus": "chair",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "chair",
                "title": "Chair",
                "start": "1998",
                "end": "1999",
                "current": False,
                "summary": "Named in the society’s chairs list.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [],
        "sources": [
            src(HISTORY, "Fabian Society chairs list"),
            src("https://www.theyworkforyou.com/mp/tony_wright", "TheyWorkForYou, Tony Wright"),
        ],
    },
    {
        "slug": "chris-smith",
        "name": "Chris Smith",
        "honorific": "The Rt Hon Lord Smith of Finsbury",
        "currentPosition": "Member of the House of Lords; former Secretary of State for Culture, Media and Sport",
        "positionType": "peer",
        "constituency": "Islington South and Finsbury (MP 1983–2005)",
        "chamber": "lords",
        "labourRole": "former_minister",
        "party": "Labour",
        "fabianSummary": "Chair 1996–97. Now a Labour peer.",
        "primaryFabianStatus": "chair",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "chair",
                "title": "Chair",
                "start": "1996",
                "end": "1997",
                "current": False,
                "summary": "Named in the society’s chairs list.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [],
        "sources": [
            src(HISTORY, "Fabian Society chairs list"),
            src("https://members.parliament.uk/member/186/career", "UK Parliament, Lord Smith of Finsbury"),
        ],
    },
    {
        "slug": "calum-mcdonald",
        "name": "Calum Macdonald",
        "currentPosition": "Former MP for the Western Isles; chair of the Fabian Society 1999–2000",
        "positionType": "former_mp",
        "constituency": "Western Isles (until 2005)",
        "chamber": "commons",
        "labourRole": "former_mp",
        "party": "Labour",
        "fabianSummary": "Chair 1999–2000 (listed by the Society as Calum McDonald).",
        "primaryFabianStatus": "chair",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "chair",
                "title": "Chair",
                "start": "1999",
                "end": "2000",
                "current": False,
                "summary": "Named in the society’s chairs list as Calum McDonald.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [],
        "sources": [
            src(HISTORY, "Fabian Society chairs list"),
            src("https://www.theyworkforyou.com/mp/calum_macdonald", "TheyWorkForYou, Calum Macdonald"),
        ],
    },
    {
        "slug": "anne-campbell",
        "name": "Anne Campbell",
        "currentPosition": "Former MP for Cambridge; chair of the Fabian Society 2007–08",
        "positionType": "former_mp",
        "constituency": "Cambridge (until 2005)",
        "chamber": "commons",
        "labourRole": "former_mp",
        "party": "Labour",
        "fabianSummary": "Chair 2007–08.",
        "primaryFabianStatus": "chair",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "chair",
                "title": "Chair",
                "start": "2007",
                "end": "2008",
                "current": False,
                "summary": "Named in the society’s chairs list.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [],
        "sources": [
            src(HISTORY, "Fabian Society chairs list"),
            src("https://www.theyworkforyou.com/mp/anne_campbell", "TheyWorkForYou, Anne Campbell"),
        ],
    },
    {
        "slug": "martin-edobor",
        "name": "Martin Edobor",
        "currentPosition": "Former chair of the Fabian Society (2020–22)",
        "positionType": "other_public_figure",
        "chamber": "none",
        "labourRole": "think_tank",
        "party": "Labour",
        "fabianSummary": "Chair 2020–22.",
        "primaryFabianStatus": "chair",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "chair",
                "title": "Chair",
                "start": "2020",
                "end": "2022",
                "current": False,
                "summary": "Named in the society’s chairs list.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [],
        "sources": [src(HISTORY, "Fabian Society chairs list")],
    },
    {
        "slug": "ivana-bartoletti",
        "name": "Ivana Bartoletti",
        "currentPosition": "Vice President and Global Chief Privacy and AI Governance Officer, Wipro; former Fabian chair",
        "positionType": "other_public_figure",
        "chamber": "none",
        "labourRole": "think_tank",
        "party": "Labour",
        "fabianSummary": "Chair 2018–20.",
        "primaryFabianStatus": "chair",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "chair",
                "title": "Chair",
                "start": "2018",
                "end": "2020",
                "current": False,
                "summary": "Named in the society’s chairs list.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [
            {
                "name": "Wipro",
                "kind": "company",
                "role": "Vice President and Global Chief Privacy and AI Governance Officer",
            }
        ],
        "sources": [
            src(HISTORY, "Fabian Society chairs list"),
            src("https://www.ivanabartoletti.co.uk/", "Ivana Bartoletti personal site"),
        ],
    },
    {
        "slug": "luke-raikes",
        "name": "Luke Raikes",
        "currentPosition": "Deputy general secretary and research director of the Fabian Society",
        "positionType": "other_public_figure",
        "chamber": "none",
        "labourRole": "think_tank",
        "party": "Labour",
        "fabianSummary": "Deputy general secretary and research director. The Society thanked him for interim leadership before Joe Dromey took over. Former Manchester councillor, 2012–23.",
        "primaryFabianStatus": "general_secretary",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "general_secretary",
                "title": "Deputy general secretary and research director",
                "current": True,
                "summary": "Named on Meet our experts. The Dromey announcement thanks him for interim leadership.",
            }
        ],
        "outputs": [
            {
                "kind": "report",
                "title": "Going up a gear",
                "url": "https://fabians.org.uk/publication/going-up-a-gear/",
            }
        ],
        "donations": [],
        "organisations": [
            {
                "name": "Manchester City Council",
                "kind": "local government",
                "role": "Labour councillor, 2012–23",
            }
        ],
        "sources": [
            src("https://fabians.org.uk/about-us/meet-our-experts/", "Fabian Society, Meet our experts"),
            src(
                "https://fabians.org.uk/joe-dromey-announced-as-new-general-secretary-of-the-fabian-society/",
                "Joe Dromey announcement (thanks Luke Raikes)",
            ),
            src("https://fabians.org.uk/publication/going-up-a-gear/", "Going up a gear"),
        ],
    },
    {
        "slug": "john-mills",
        "name": "John Mills",
        "currentPosition": "Businessman; named funder of a 2017–18 Fabian macroeconomic pamphlet",
        "positionType": "donor",
        "chamber": "none",
        "labourRole": "donor",
        "party": "Not stated",
        "fabianSummary": "The Society’s 2017–18 financial transparency list names John Mills as giving £12,000 for a macroeconomic pamphlet. That is a gift to the Society, not a statement of membership.",
        "primaryFabianStatus": "donor",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "donor",
                "title": "Named project funder",
                "start": "2017",
                "end": "2018",
                "current": False,
                "summary": "Listed in Financial transparency 2017/18 against ‘Macroeconomic pamphlet’.",
            }
        ],
        "outputs": [],
        "donations": [
            {
                "donor": "John Mills",
                "amount": "£12,000",
                "date": "2017-18",
                "nature": "Project funding for a macroeconomic pamphlet",
                "recipient": "Fabian Society",
                "recordUrl": FINANCE,
                "fabianRelated": True,
            }
        ],
        "organisations": [],
        "sources": [src(FINANCE, "Fabian Society financial transparency 2017–18")],
    },
    {
        "slug": "ben-elton",
        "name": "Ben Elton",
        "currentPosition": "Writer and performer; named Fabian Society project funder, 2017–18",
        "positionType": "donor",
        "chamber": "none",
        "labourRole": "donor",
        "party": "Not stated",
        "fabianSummary": "The Society’s 2017–18 financial transparency list names Ben Elton as giving £7,500 for culture and early years work. That is a gift to the Society, not a statement of membership.",
        "primaryFabianStatus": "donor",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "donor",
                "title": "Named project funder",
                "start": "2017",
                "end": "2018",
                "current": False,
                "summary": "Listed in Financial transparency 2017/18 against ‘Culture and early years’.",
            }
        ],
        "outputs": [],
        "donations": [
            {
                "donor": "Ben Elton",
                "amount": "£7,500",
                "date": "2017-18",
                "nature": "Project funding for culture and early years",
                "recipient": "Fabian Society",
                "recordUrl": FINANCE,
                "fabianRelated": True,
            }
        ],
        "organisations": [],
        "sources": [src(FINANCE, "Fabian Society financial transparency 2017–18")],
    },
    {
        "slug": "francesca-reynolds",
        "name": "Francesca Reynolds",
        "currentPosition": "Strategy and policy associate, Tony Blair Institute; former Young Fabians co-chair",
        "positionType": "other_public_figure",
        "chamber": "none",
        "labourRole": "think_tank",
        "party": "Labour",
        "fabianSummary": "Current executive member. The Society biography says she had just finished as co-chair of the Young Fabians.",
        "primaryFabianStatus": "young_fabian",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "executive",
                "title": "Executive committee member",
                "current": True,
                "summary": "Listed on the current executive page.",
            },
            {
                "status": "young_fabian",
                "title": "Co-chair, Young Fabians",
                "current": False,
                "summary": "The executive biography says she joined after finishing as Young Fabians co-chair.",
            },
        ],
        "outputs": [],
        "donations": [],
        "organisations": [
            {
                "name": "Tony Blair Institute",
                "kind": "think tank",
                "role": "Strategy and policy associate",
            }
        ],
        "sources": [src(EXEC, "Fabian Society executive committee, Francesca Reynolds")],
    },
    {
        "slug": "suresh-pushpananthan",
        "name": "Suresh Pushpananthan",
        "currentPosition": "Former chair of the Fabian Society (2010–12)",
        "positionType": "other_public_figure",
        "chamber": "none",
        "labourRole": "think_tank",
        "party": "Labour",
        "fabianSummary": "Chair 2010–12.",
        "primaryFabianStatus": "chair",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "chair",
                "title": "Chair",
                "start": "2010",
                "end": "2012",
                "current": False,
                "summary": "Named in the society’s chairs list.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [],
        "sources": [src(HISTORY, "Fabian Society chairs list")],
    },
    {
        "slug": "oonagh-mcdonald",
        "name": "Oonagh McDonald",
        "currentPosition": "Former MP; chair of the Fabian Society 1991–92",
        "positionType": "former_mp",
        "constituency": "Thurrock (until 1987)",
        "chamber": "commons",
        "labourRole": "former_mp",
        "party": "Labour",
        "fabianSummary": "Chair 1991–92.",
        "primaryFabianStatus": "chair",
        "inclusionBasis": "named_role_or_membership",
        "involvement": [
            {
                "status": "chair",
                "title": "Chair",
                "start": "1991",
                "end": "1992",
                "current": False,
                "summary": "Named in the society’s chairs list.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [],
        "sources": [
            src(HISTORY, "Fabian Society chairs list"),
            src("https://www.theyworkforyou.com/mp/oonagh_mcdonald", "TheyWorkForYou, Oonagh McDonald"),
        ],
    },
    {
        "slug": "john-denham",
        "name": "John Denham",
        "currentPosition": "Former cabinet minister; director of the Centre for English Identity and Politics, University of Winchester",
        "positionType": "former_mp",
        "constituency": "Southampton Itchen (until 2015)",
        "chamber": "commons",
        "labourRole": "former_minister",
        "party": "Labour",
        "fabianSummary": "Editor of The Shape of Things to Come (2012). Sunder Katwala later recalled his involvement in Fabian work on identity. Membership is not independently confirmed from these pages.",
        "primaryFabianStatus": "pamphlet_author",
        "inclusionBasis": "documented_output_only",
        "involvement": [
            {
                "status": "pamphlet_author",
                "title": "Pamphlet editor",
                "current": False,
                "summary": "Named as author and introduction writer of The Shape of Things to Come.",
            }
        ],
        "outputs": [
            {
                "kind": "pamphlet",
                "title": "The Shape of Things to Come (introduction)",
                "date": "2012-06-27",
                "url": SHAPE,
            }
        ],
        "donations": [],
        "organisations": [
            {
                "name": "University of Winchester",
                "kind": "university",
                "role": "Director, Centre for English Identity and Politics (stated on the pamphlet page)",
            }
        ],
        "sources": [
            src(SHAPE, "The Shape of Things to Come"),
            src(VIEWS, "Views from the Top (Katwala on Denham)"),
            src("https://www.theyworkforyou.com/mp/john_denham", "TheyWorkForYou, John Denham"),
        ],
    },
    {
        "slug": "david-miliband",
        "name": "David Miliband",
        "honorific": "The Rt Hon",
        "currentPosition": "President and chief executive, International Rescue Committee; former Foreign Secretary",
        "positionType": "former_mp",
        "constituency": "South Shields (until 2013)",
        "chamber": "commons",
        "labourRole": "former_minister",
        "party": "Labour",
        "fabianSummary": "Essay in The Labour Leadership (2010). Membership is not independently confirmed.",
        "primaryFabianStatus": "pamphlet_author",
        "inclusionBasis": "documented_output_only",
        "involvement": [
            {
                "status": "pamphlet_author",
                "title": "Essay author",
                "current": False,
                "summary": "Named contributor to The Labour Leadership.",
            }
        ],
        "outputs": [
            {
                "kind": "essay",
                "title": "Essay in The Labour Leadership",
                "date": "2010-08-20",
                "url": LEADERSHIP,
            }
        ],
        "donations": [],
        "organisations": [
            {
                "name": "International Rescue Committee",
                "kind": "charity",
                "role": "President and chief executive",
            }
        ],
        "sources": [
            src(LEADERSHIP, "The Labour Leadership"),
            src("https://www.rescue.org/person/david-miliband", "International Rescue Committee, David Miliband"),
            src("https://www.theyworkforyou.com/mp/david_miliband", "TheyWorkForYou, David Miliband"),
        ],
    },
    {
        "slug": "diane-abbott",
        "name": "Diane Abbott",
        "honorific": "The Rt Hon",
        "currentPosition": "MP for Hackney North and Stoke Newington",
        "positionType": "mp",
        "constituency": "Hackney North and Stoke Newington",
        "chamber": "commons",
        "labourRole": "backbench",
        "party": "Labour",
        "fabianSummary": "Essay in The Labour Leadership (2010). Membership is not independently confirmed.",
        "primaryFabianStatus": "pamphlet_author",
        "inclusionBasis": "documented_output_only",
        "involvement": [
            {
                "status": "pamphlet_author",
                "title": "Essay author",
                "current": False,
                "summary": "Named contributor to The Labour Leadership.",
            }
        ],
        "outputs": [
            {
                "kind": "essay",
                "title": "Essay in The Labour Leadership",
                "date": "2010-08-20",
                "url": LEADERSHIP,
            }
        ],
        "donations": [],
        "organisations": [],
        "sources": [
            src(LEADERSHIP, "The Labour Leadership"),
            src("https://members.parliament.uk/member/172/contact", "UK Parliament, Diane Abbott"),
        ],
    },
    {
        "slug": "liz-kendall",
        "name": "Liz Kendall",
        "honorific": "The Rt Hon",
        "currentPosition": "MP for Leicester West; former Secretary of State for Science, Innovation and Technology",
        "positionType": "mp",
        "constituency": "Leicester West",
        "chamber": "commons",
        "labourRole": "former_minister",
        "party": "Labour",
        "fabianSummary": "Essay in Leading Labour (2015). Membership is not independently confirmed.",
        "primaryFabianStatus": "pamphlet_author",
        "inclusionBasis": "documented_output_only",
        "involvement": [
            {
                "status": "pamphlet_author",
                "title": "Essay author",
                "current": False,
                "summary": "Named contributor to Leading Labour.",
            }
        ],
        "outputs": [
            {
                "kind": "essay",
                "title": "Essay in Leading Labour",
                "date": "2015-08-14",
                "url": LEADING,
            }
        ],
        "donations": [],
        "organisations": [],
        "sources": [
            src(LEADING, "Leading Labour"),
            src("https://members.parliament.uk/member/4138/contact", "UK Parliament, Liz Kendall"),
        ],
    },
    {
        "slug": "kitty-ussher",
        "name": "Kitty Ussher",
        "currentPosition": "Former MP for Burnley; essayist in The Shape of Things to Come",
        "positionType": "former_mp",
        "constituency": "Burnley (until 2010)",
        "chamber": "commons",
        "labourRole": "former_minister",
        "party": "Labour",
        "fabianSummary": "Chapter in The Shape of Things to Come (2012). Membership is not independently confirmed.",
        "primaryFabianStatus": "pamphlet_author",
        "inclusionBasis": "documented_output_only",
        "involvement": [
            {
                "status": "pamphlet_author",
                "title": "Essay author",
                "current": False,
                "summary": "Named contributor (‘Taking the long view on welfare policy’).",
            }
        ],
        "outputs": [
            {
                "kind": "essay",
                "title": "Taking the long view on welfare policy, in The Shape of Things to Come",
                "date": "2012-06-27",
                "url": SHAPE,
            }
        ],
        "donations": [],
        "organisations": [],
        "sources": [
            src(SHAPE, "The Shape of Things to Come"),
            src("https://www.theyworkforyou.com/mp/kitty_ussher", "TheyWorkForYou, Kitty Ussher"),
        ],
    },
    {
        "slug": "helen-goodman",
        "name": "Helen Goodman",
        "currentPosition": "Former MP for Bishop Auckland; essayist in The Shape of Things to Come",
        "positionType": "former_mp",
        "constituency": "Bishop Auckland (until 2019)",
        "chamber": "commons",
        "labourRole": "former_mp",
        "party": "Labour",
        "fabianSummary": "Chapter in The Shape of Things to Come (2012). Membership is not independently confirmed.",
        "primaryFabianStatus": "pamphlet_author",
        "inclusionBasis": "documented_output_only",
        "involvement": [
            {
                "status": "pamphlet_author",
                "title": "Essay author",
                "current": False,
                "summary": "Named contributor (‘A modern, humanised state’).",
            }
        ],
        "outputs": [
            {
                "kind": "essay",
                "title": "A modern, humanised state, in The Shape of Things to Come",
                "date": "2012-06-27",
                "url": SHAPE,
            }
        ],
        "donations": [],
        "organisations": [],
        "sources": [
            src(SHAPE, "The Shape of Things to Come"),
            src("https://www.theyworkforyou.com/mp/helen_goodman", "TheyWorkForYou, Helen Goodman"),
        ],
    },
    {
        "slug": "matthew-pennycook",
        "name": "Matthew Pennycook",
        "honorific": "The Rt Hon",
        "currentPosition": "Minister of State for Housing and Planning; MP for Greenwich and Woolwich",
        "positionType": "mp",
        "constituency": "Greenwich and Woolwich",
        "chamber": "commons",
        "labourRole": "minister",
        "party": "Labour",
        "fabianSummary": "Chapter in The Shape of Things to Come (2012). Membership is not independently confirmed.",
        "primaryFabianStatus": "pamphlet_author",
        "inclusionBasis": "documented_output_only",
        "involvement": [
            {
                "status": "pamphlet_author",
                "title": "Essay author",
                "current": False,
                "summary": "Named contributor (‘Easing the squeeze’).",
            }
        ],
        "outputs": [
            {
                "kind": "essay",
                "title": "Easing the squeeze, in The Shape of Things to Come",
                "date": "2012-06-27",
                "url": SHAPE,
            }
        ],
        "donations": [],
        "organisations": [],
        "sources": [
            src(SHAPE, "The Shape of Things to Come"),
            src("https://www.gov.uk/government/people/matthew-pennycook", "GOV.UK, Matthew Pennycook"),
            src("https://members.parliament.uk/member/4357/contact", "UK Parliament, Matthew Pennycook"),
        ],
    },
]


def main() -> None:
    people = json.loads(PATH.read_text())
    existing = {p["slug"] for p in people}
    for person in people:
        if person["slug"] == "margaret-hodge":
            person["positionType"] = "former_mp"
            person["labourRole"] = "former_mp"
            person["currentPosition"] = (
                "Fabian Society vice-president; former MP for Barking"
            )
    added = 0
    for person in new_people:
        if person["slug"] in existing:
            raise SystemExit(f"duplicate slug: {person['slug']}")
        people.append(person)
        added += 1
    PATH.write_text(json.dumps(people, indent=2, ensure_ascii=False) + "\n")
    print(f"added {added}; total {len(people)}")


if __name__ == "__main__":
    main()
