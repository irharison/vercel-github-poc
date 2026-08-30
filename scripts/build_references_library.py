#!/usr/bin/env python3
"""Write data/references.json and append newly sourced people."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ACCESS = "2026-08-30"


def link(title: str, publisher: str, summary: str, url: str, date: str | None = None) -> dict:
    row = {
        "title": title,
        "publisher": publisher,
        "summary": summary,
        "url": url,
    }
    if date:
        row["date"] = date
    return row


def category(id_: str, title: str, intro: str, links: list[dict]) -> dict:
    return {"id": id_, "title": title, "intro": intro, "links": links}


def src(url: str, label: str) -> dict:
    return {"url": url, "label": label, "accessed": ACCESS}


REFERENCES = {
    "title": "References and further reading",
    "lastUpdated": ACCESS,
    "methodology": (
        "This library was compiled on 30 August 2026 from a wider public-web scan "
        "for pages that name the UK Fabian Society or Fabianism as a political tradition. "
        "Each URL was opened or fetched before it was listed. Wikipedia appears once, as a hub; "
        "the rest are non-Wikipedia pages. Forum dumps, anonymous conspiracy pages and "
        "antisemitic “secret Fabian / cultural Marxism” material were found in the wider web "
        "and omitted. A Labour Party donation page is included only where it also names the Society."
    ),
    "categories": [
        category(
            "official",
            "Official Fabian Society",
            "About pages, rules, history, annual reports, the publications index and named pamphlets on fabians.org.uk.",
            [
                link("Fabian Society home", "Fabian Society", "The Society’s public front page: think tank, membership society and Labour socialist society.", "https://fabians.org.uk/"),
                link("About us", "Fabian Society", "Official description of the Society as an independent left-leaning think tank and democratic membership body affiliated to Labour.", "https://fabians.org.uk/about-us/"),
                link("Our history", "Fabian Society", "Society account of the 1884 founding, Labour affiliation, LSE and New Statesman links, and chairs and general secretaries.", "https://fabians.org.uk/about-us/our-history/", "checked 2026"),
                link("Our people", "Fabian Society", "Current officers, staff and named public figures associated with the Society.", "https://fabians.org.uk/about-us/our-people/"),
                link("Accountability", "Fabian Society", "How the executive, AGM, rules, editorial independence and Electoral Commission status are described.", "https://fabians.org.uk/about-us/accountability/"),
                link("Meet our experts", "Fabian Society", "Staff and research contacts presented as the Society’s public expert list.", "https://fabians.org.uk/about-us/meet-our-experts/"),
                link("Executive committee 2017–19", "Fabian Society", "Archived executive biographies used throughout this register.", "https://fabians.org.uk/about-us/our-people/executive-committee-2017-19/"),
                link("Welsh Fabians", "Fabian Society", "Official page for the Society’s Welsh organisation.", "https://fabians.org.uk/about-us/welsh-fabians/"),
                link("Publications index", "Fabian Society", "Current catalogue of pamphlets, reports and the Fabian Review.", "https://fabians.org.uk/publications/"),
                link("Join the Fabian Society", "Fabian Society", "Public membership offer, including the Review and affiliation to Labour as a socialist society.", "https://fabians.org.uk/join/"),
                link("Rules of the Fabian Society (March 2022)", "Fabian Society", "Current published rules PDF: name, objects, AGM, executive and publication disclaimer.", "https://fabians.org.uk/wp-content/uploads/2022/09/Rules-of-the-Fabian-Society-March-2022.pdf", "2022-03"),
                link("Rules of the Fabian Society (November 2019)", "Fabian Society", "Earlier rules PDF still hosted on the Society site.", "https://fabians.org.uk/wp-content/uploads/2020/01/Rules-of-the-Fabian-Society-November-2019.pdf", "2019-11"),
                link("Annual report 2024–25", "Fabian Society", "Latest audited annual report, including the unpublished 141 Fabian MPs figure.", "https://fabians.org.uk/wp-content/uploads/2025/12/ANNUAL-REPORT-2024-2025-3.pdf", "2025"),
                link("Annual report 2023–24", "Fabian Society", "Previous year’s report: membership, executive elections and financial statements.", "https://fabians.org.uk/wp-content/uploads/2024/11/Final-ANNUAL-REPORT-2023-2024-compressed.pdf", "2024"),
                link("Annual report 2015", "Fabian Society", "Archived annual report PDF still on the Society site.", "https://fabians.org.uk/wp-content/uploads/2018/01/Annual-report-2015-small.pdf", "2015"),
                link("Annual report 2014", "Fabian Society", "Archived annual report PDF.", "https://fabians.org.uk/wp-content/uploads/2018/01/Annual-Report-2014.pdf", "2014"),
                link("Financial transparency 2017–18", "Fabian Society", "Published funding-transparency note for a single financial year.", "https://fabians.org.uk/wp-content/uploads/2019/06/Financial-Transparency-2017-18.pdf", "2018"),
                link("Views from the Top", "Fabian Society", "Dianne Hayter interviews with former chairs; source for the 1981 SDP split on the executive.", "https://fabians.org.uk/views-from-the-top/"),
                link("Slow and Steady", "Fabian Society", "Paul Richards on the 4 January 1884 founding meeting, the Fellowship of the New Life and the original nine.", "https://fabians.org.uk/slow-and-steady/", "2024"),
                link("On the Horizon", "Fabian Society", "Andrew Harrop on the Society’s recent programme and personnel.", "https://fabians.org.uk/on-the-horizon/"),
                link("Joe Dromey announced as general secretary", "Fabian Society", "Official appointment notice for the current general secretary.", "https://fabians.org.uk/joe-dromey-announced-as-new-general-secretary-of-the-fabian-society/"),
                link("Andrew Harrop to step down", "Fabian Society", "Official notice of the previous general secretary’s departure.", "https://fabians.org.uk/andrew-harrop-to-step-down-as-general-secretary-of-the-fabian-society/"),
                link("The Road Ahead", "Fabian Society", "Keir Starmer pamphlet (2021) published by the Society.", "https://fabians.org.uk/publication/the-road-ahead/", "2021-09-22"),
                link("The Labour Leadership", "Fabian Society", "Society pamphlet on Labour leadership, used as an authorship source in this register.", "https://fabians.org.uk/publication/the-labour-leadership/"),
                link("Leading Labour: the Fabian essays", "Fabian Society", "Essay collection published by the Society.", "https://fabians.org.uk/publication/leading-labour-the-fabian-essays/"),
                link("The Shape of Things to Come", "Fabian Society", "Society pamphlet page.", "https://fabians.org.uk/publication/the-shape-of-things-to-come/"),
                link("Common Endeavour", "Fabian Society", "Society pamphlet page, cited for several authorship-only records.", "https://fabians.org.uk/publication/common-endeavour/"),
                link("New Arrivals", "Fabian Society", "Society pamphlet page.", "https://fabians.org.uk/publication/new-arrivals/"),
                link("Let Us Face The Future Again", "Fabian Society", "Wes Streeting pamphlet page.", "https://fabians.org.uk/publication/let-us-face-the-future-again/", "2020-03-22"),
                link("The Economic Alternative", "Fabian Society", "Society pamphlet later reported by the Daily Telegraph.", "https://fabians.org.uk/publication/the-economic-alternative/"),
                link("Equal Footing", "Fabian Society", "Society pamphlet page.", "https://fabians.org.uk/publication/equal-footing/"),
                link("Fairness not Favours", "Fabian Society", "Society pamphlet page.", "https://fabians.org.uk/publication/fairness-not-favours/"),
                link("Together", "Fabian Society", "Society pamphlet page.", "https://fabians.org.uk/publication/together/"),
                link("In the Fast Lane", "Fabian Society", "Society pamphlet page.", "https://fabians.org.uk/publication/in-the-fast-lane/"),
                link("Where’s the Harm?", "Fabian Society", "Society pamphlet page.", "https://fabians.org.uk/publication/wheres-the-harm/"),
                link("Going Up a Gear", "Fabian Society", "Society pamphlet page.", "https://fabians.org.uk/publication/going-up-a-gear/"),
                link("In Tandem", "Fabian Society", "Pamphlet on Treasury–Bank coordination, later reported by the Guardian.", "https://fabians.org.uk/publication/in-tandem/", "2023"),
                link("Sadiq Khan: this city has been the backdrop to my life", "Fabian Society", "Society page in Khan’s name; the byline states he is vice-president of the Society.", "https://fabians.org.uk/sadiq-khan-this-city-has-been-the-backdrop-to-my-life/"),
                link("Punishment and Reform", "Fabian Society", "2011 pamphlet edited by Sadiq Khan; the author note calls him a former chair.", "https://fabians.org.uk/publication/punishment-and-reform/", "2011-12-01"),
                link("Fabian Review, winter 2025", "Fabian Society", "Quarterly magazine masthead, staff list and editorial disclaimer.", "https://fabians.org.uk/wp-content/uploads/2025/12/FABPN0614-winter-Review-2025-251210-WEB-1.pdf", "2025-12"),
                link("Fabian Review, spring 2026", "Fabian Society", "Quarterly issue listing Katherine Sangster as national director for Scotland.", "https://fabians.org.uk/wp-content/uploads/2026/04/FAB-Review-Spring-2026-WEB_.pdf", "2026-04"),
            ],
        ),
        category(
            "parliament",
            "Parliament and Electoral Commission",
            "Westminster, Holyrood, Senedd and Electoral Commission pages that name the Fabian Society. Generic institution homepages are not listed unless the page itself mentions the Society.",
            [
                link(
                    "Electoral Commission search: Fabian Society",
                    "Electoral Commission",
                    "Official political-finance search filtered on the Society’s name.",
                    "https://search.electoralcommission.org.uk/?currentPage=1&rows=20&query=Fabian%20Society&sort=AcceptedDate&order=desc&tab=1",
                ),
                link("Electoral Commission search home", "Electoral Commission", "Starting point for donations, loans and regulated-entity records.", "https://search.electoralcommission.org.uk/"),
                link(
                    "List of ministers’ interests, November 2024",
                    "GOV.UK",
                    "Cabinet Office list in which many ministers declare “Member, Fabian Society” or a named Society office.",
                    "https://www.gov.uk/government/publications/list-of-ministers-interests/list-of-ministers-interests-november-2024-html",
                    "2024-11",
                ),
                link("TheyWorkForYou search: Fabian Society", "TheyWorkForYou", "Unofficial index of parliamentary mentions; use it to find the official Hansard or register page.", "https://www.theyworkforyou.com/search/?q=Fabian+Society"),
                link("Katherine Sangster, register of interests", "Scottish Parliament", "Holyrood register: she resigned as a Director at the Fabian Society on 8 May 2026.", "https://www.parliament.scot/msps/current-and-previous-msps/katherine-sangster", "2026-06-10"),
                link("Joe Fagan, register of interests", "Scottish Parliament", "MSP voluntary register: “I am a member of the Fabian Society.”", "https://www.parliament.scot/msps/current-and-previous-msps/joe-fagan"),
                link("Joe Long, register of interests", "Scottish Parliament", "MSP voluntary register naming Fabian Society membership.", "https://www.parliament.scot/msps/current-and-previous-msps/joe-long"),
                link("Daniel Johnson, register of interests", "Scottish Parliament", "MSP register naming Fabian Society membership.", "https://www.parliament.scot/msps/current-and-previous-msps/daniel-johnson"),
                link(
                    "What might a Universal Basic Income mean for Wales?",
                    "Senedd Research",
                    "Senedd research article citing a Fabian Society report for the TUC on universal benefits.",
                    "https://research.senedd.wales/research-articles/what-might-a-universal-basic-income-mean-for-wales/",
                ),
                link("Martin McCluskey, MP contact page", "UK Parliament", "Official Commons page for the Inverclyde and Renfrewshire West MP; ministers’ interests record a previous Scottish Fabians chairmanship.", "https://members.parliament.uk/member/5129/contact"),
                link("Lord Kennedy of Southwark", "UK Parliament", "Official Lords page for Roy Kennedy, who declares Fabian membership on the ministers’ interests list.", "https://members.parliament.uk/member/4153/contact"),
                link("Lord Leong", "UK Parliament", "Official Lords page for Sonny Leong, listed as a Fabian member on the ministers’ interests list.", "https://members.parliament.uk/member/4959/contact"),
                link(
                    "The political foundations of the NHS",
                    "House of Commons Library",
                    "Library essay crediting Beatrice Webb, a founding Fabian, with an early state medical-service idea in the 1909 Minority Report.",
                    "https://commonslibrary.parliament.uk/the-most-civilised-thing-in-the-world-the-political-foundations-of-the-nhs/",
                ),
                link(
                    "Contributory benefits and social insurance in the UK",
                    "House of Commons Library",
                    "Briefing that cites a 2019 Fabian Society paper on relaunching contributory benefits.",
                    "https://commonslibrary.parliament.uk/contributory-benefits-and-social-insurance-in-the-uk/",
                ),
            ],
        ),
        category(
            "encyclopaedia",
            "Encyclopaedia and reference",
            "Standard reference works. Wikipedia is listed once only, as a hub.",
            [
                link("Fabian Society", "Encyclopaedia Britannica", "Reference article: 1884 founding attributed to Thomas Davidson; early members; gradualism; Labour affiliation.", "https://www.britannica.com/topic/Fabian-Society"),
                link("Fabianism", "Encyclopaedia Britannica", "Doctrinal article on gradualist democratic socialism associated with the Society.", "https://www.britannica.com/money/Fabianism"),
                link("Labour and the New Social Order", "Encyclopaedia Britannica", "1918 Labour programme associated with Sidney Webb and Fabian drafting.", "https://www.britannica.com/topic/Labour-and-the-New-Social-Order"),
                link("R. H. S. Crossman", "Encyclopaedia Britannica", "Biography linking Crossman to New Fabian Essays and later Fabian politicians.", "https://www.britannica.com/topic/R-H-S-Crossman"),
                link("Sidney and Beatrice Webb", "Encyclopaedia Britannica", "Joint biography: early Fabian members and LSE founders.", "https://www.britannica.com/biography/Sidney-and-Beatrice-Webb"),
                link("Fabian Society (Scholars)", "Britannica Kids / Scholars", "Shorter encyclopaedia article repeating the Davidson founding attribution and later bureaux.", "https://kids.britannica.com/scholars/article/Fabian-Society/33515"),
                link("Fabian Society", "Wikipedia", "Single Wikipedia hub for the Society. Used here only as a starting index, not as the source of this library.", "https://en.wikipedia.org/wiki/Fabian_Society"),
            ],
        ),
        category(
            "academic",
            "Academic and university",
            "University pages, journal abstracts and open texts on Fabianism as a political tradition.",
            [
                link(
                    "Fabianism, permeation and Independent Labour",
                    "The Historical Journal / Cambridge",
                    "Classic journal article (abstract) on competing Fabian ideas of permeation and the ILP.",
                    "https://www.cambridge.org/core/journals/historical-journal/article/abs/fabianism-permeation-and-independent-labour/75B50164ED4A2D30A356F546C4D2F240",
                    "1981",
                ),
                link(
                    "DOI: Fabianism, permeation and Independent Labour",
                    "Cambridge University Press",
                    "Stable DOI for the same Historical Journal article.",
                    "https://doi.org/10.1017/s0018246x00020720",
                    "1981",
                ),
                link(
                    "Fabian Socialism: a Theory of Rent as Exploitation",
                    "Journal of British Studies / Cambridge",
                    "Abstract of David Ricci’s 1969 essay on the Fabian theory of rent.",
                    "https://www.cambridge.org/core/journals/journal-of-british-studies/article/abs/fabian-socialism-a-theory-of-rent-as-exploitation/5C487860045F9601B8C5AE43D61DE6E5",
                    "1969",
                ),
                link(
                    "The Fabian Society (chapter)",
                    "Cambridge University Press",
                    "Chapter from George Bernard Shaw in Context on the Society’s origins in the Fellowship of the New Life.",
                    "https://www.cambridge.org/core/books/george-bernard-shaw-in-context/fabian-society/A00CA68EB00D9D14DC2C0F0035B88AA1",
                ),
                link(
                    "Charlotte Wilson and late Victorian radicalism",
                    "International Review of Social History / Cambridge",
                    "Article naming Wilson as the only woman on the original Fabian executive.",
                    "https://www.cambridge.org/core/journals/international-review-of-social-history/article/charlotte-wilson-the-woman-question-and-the-meanings-of-anarchist-socialism-in-late-victorian-radicalism/BD2F720B7A1123C6E51D659332F11C28",
                ),
                link(
                    "The History of the Fabian Society",
                    "Project Gutenberg",
                    "Edward R. Pease’s 1916 history, open text: founding meetings, Keddell as first secretary, Dale Owen and Chubb.",
                    "https://www.gutenberg.org/files/13715/13715-h/13715-h.htm",
                    "1916",
                ),
                link(
                    "The History of the Fabian Society (ebook record)",
                    "Project Gutenberg",
                    "Catalogue record for Pease’s history (ebook 13715).",
                    "https://www.gutenberg.org/ebooks/13715",
                    "1916",
                ),
                link(
                    "Fabian Essays in Socialism",
                    "Internet Archive",
                    "1889 Shaw-edited collection, digitised public-domain scan.",
                    "https://archive.org/details/fabianessaysinso00shawuoft",
                    "1889",
                ),
                link(
                    "The history of the Fabian society (Cornell scan)",
                    "Internet Archive",
                    "1916 Pease volume from Cornell University Library.",
                    "https://archive.org/details/cu31924002405599",
                    "1916",
                ),
                link(
                    "The History of the Fabian Society (LibriVox)",
                    "Internet Archive",
                    "Public-domain audio edition of Pease’s history.",
                    "https://archive.org/details/historyoffabiansociety_2209_librivox",
                    "1916",
                ),
                link(
                    "The History of the Fabian Society",
                    "HathiTrust",
                    "Catalogue record for the Pease history.",
                    "https://catalog.hathitrust.org/Record/000438595",
                    "1916",
                ),
                link(
                    "CHUBB, Percival Ashley, 1860–1960, Fabian",
                    "Archives Hub / Jisc",
                    "University archive description of a founding Fabian later active in Ethical Culture.",
                    "https://archiveshub.jisc.ac.uk/search/archives/18dfc4cd-9f0e-3d2a-ab2e-433b1d48ef9f",
                ),
                link(
                    "Beatrice Webb diaries",
                    "LSE Digital Library",
                    "Digitised Webb diaries held by LSE, a principal source for early Fabian politics.",
                    "https://digital.library.lse.ac.uk/collections/list/collections/18",
                ),
                link("LSE Digital Library home", "London School of Economics", "Portal for digitised Webb, Shaw and related collections.", "https://digital.library.lse.ac.uk/"),
            ],
        ),
        category(
            "news",
            "News and long reads",
            "Reputable newspapers and magazines that discuss the Society, a named officer, or a named pamphlet.",
            [
                link(
                    "Lord Sainsbury returns to the Labour fold with £2m donation",
                    "The Guardian",
                    "News report of a Labour donation; useful context, not a Society gift.",
                    "https://www.theguardian.com/politics/2023/feb/25/lord-sainsbury-returns-to-the-labour-fold-with-2m-donation",
                    "2023-02-25",
                ),
                link(
                    "Labour boosts election war chest with record quarter for donations",
                    "The Guardian",
                    "Donation reporting that names large Labour gifts in the same period as Society finance stories.",
                    "https://www.theguardian.com/politics/2023/sep/07/labour-boosts-election-war-chest-with-record-quarter-for-donations",
                    "2023-09-07",
                ),
                link(
                    "Treasury should use price controls in cost of living crisis, say Fabians",
                    "The Guardian",
                    "Report of the Society’s In Tandem pamphlet on Treasury and Bank coordination.",
                    "https://www.theguardian.com/politics/2023/nov/14/treasury-should-use-price-controls-in-cost-of-living-crisis-say-fabians",
                    "2023-11-14",
                ),
                link(
                    "Rishi Sunak’s cuts ‘risk plunging more than 3 million into poverty’",
                    "The Guardian",
                    "News piece built on a Fabian Society poverty study.",
                    "https://www.theguardian.com/society/2020/dec/04/rishi-sunaks-cuts-risk-plunging-more-than-3-million-into-poverty",
                    "2020-12-04",
                ),
                link(
                    "Rishi Sunak’s measures only ‘temporary relief’ on cost of living crisis",
                    "The Guardian",
                    "Quotes Andrew Harrop as general secretary of the Society.",
                    "https://www.theguardian.com/business/2022/may/26/rishi-sunaks-measures-only-temporary-relief-on-cost-of-living-crisis",
                    "2022-05-26",
                ),
                link(
                    "Labour donations reporting (Sainsbury)",
                    "BBC News",
                    "BBC political-finance report used in this register for Labour gifts, not Society gifts.",
                    "https://www.bbc.co.uk/news/uk-politics-68499719",
                    "2024",
                ),
                link(
                    "Social care: Labour urged to commit to care worker pay increases",
                    "BBC News",
                    "BBC report of a Fabian Society care-service report commissioned with Unison.",
                    "https://www.bbc.co.uk/news/uk-politics-65839730",
                    "2023-06-08",
                ),
                link(
                    "Labour received EU-linked donation via FEPS",
                    "The Independent",
                    "News report on a FEPS payment and the Society’s European affiliation.",
                    "https://www.the-independent.com/news/uk/politics/labour-eu-donation-brexit-b2690635.html",
                ),
                link(
                    "Are you already thinking like a Fabian?",
                    "LabourList",
                    "2026 piece on Society co-chairs and the current programme.",
                    "https://labourlist.org/2026/08/are-you-already-thinking-like-a-fabian/",
                    "2026-08",
                ),
                link(
                    "Fabians appoint Kate Green as chair",
                    "LabourList",
                    "2016 appointment report for a named Society chair.",
                    "https://labourlist.org/2016/12/fabians-appoint-centre-left-former-shadow-minister-kate-green-as-chair/",
                    "2016-12",
                ),
                link(
                    "Keir Starmer: my vision for the future of the Labour party",
                    "The Spectator",
                    "Spectator reprint of Starmer’s Society pamphlet The Road Ahead.",
                    "https://www.spectator.co.uk/article/keir-starmer-my-vision-for-the-future-of-the-labour-party/",
                    "2021",
                ),
                link(
                    "Pro-growth Labour MPs throw their weight behind Angela Rayner",
                    "The Times",
                    "Politics report quoting Fabian living-standards analysis by Luke Raikes.",
                    "https://www.thetimes.com/uk/politics/article/rachel-reeves-budget-cuts-labour-2v7gvbx3j",
                ),
                link(
                    "Winter fuel payments for all — is this the beginning of Reeves’ undoing?",
                    "The Times",
                    "Report of a Fabian two-child-limit proposal by Ben Cooper.",
                    "https://www.thetimes.com/uk/politics/article/is-winter-fuel-u-turn-just-the-beginning-of-reevess-undoing-vd3b6l53v",
                ),
                link(
                    "Call for independent body to help tackle the pensions crisis",
                    "The Times",
                    "Joint Bright Blue and Fabian Society pensions-commission report; quotes Andrew Harrop.",
                    "https://www.thetimes.com/uk/politics/article/call-for-independent-body-to-help-tackle-the-pensions-crisis-600p2wfsf",
                ),
                link(
                    "Politicians have the power to order ceasefire in culture wars",
                    "The Times",
                    "Comment on the Society pamphlet Counterculture.",
                    "https://www.thetimes.com/uk/politics/article/politicians-have-the-power-to-order-ceasefire-in-culture-wars-8d9hdgwjx",
                ),
                link(
                    "Labour needs Plan B on economy says Fabian Society",
                    "The Daily Telegraph",
                    "2012 report of The Economic Alternative and Andrew Harrop’s argument with Ed Balls.",
                    "https://www.telegraph.co.uk/news/politics/9084535/Labour-needs-Plan-B-on-economy-says-Fabian-Society.html",
                    "2012-02-16",
                ),
                link(
                    "Reeves urged to launch tax raid on lump sum pensions",
                    "The Daily Telegraph",
                    "2024 business report citing a similar Fabian Society pensions proposal.",
                    "https://www.telegraph.co.uk/business/2024/09/11/reeves-urged-launch-tax-raid-lump-sum-pensions/",
                    "2024-09-11",
                ),
                link(
                    "Labour must ‘dare to lose’ and champion parish pump politics",
                    "The Daily Telegraph",
                    "2014 report of a Fabian localism pamphlet launched with Jon Cruddas.",
                    "https://www.telegraph.co.uk/news/politics/labour/10889918/Labour-must-dare-to-lose-and-champion-parish-pump-politics.html",
                    "2014",
                ),
                link(
                    "About the New Statesman",
                    "New Statesman",
                    "House history: founded in 1913 by Sidney and Beatrice Webb with Shaw and Wells; first editor Clifford Sharp.",
                    "https://www.newstatesman.com/about-us-newstatesman",
                ),
                link(
                    "History of the New Statesman",
                    "New Statesman",
                    "Longer founding narrative: Webbs, Shaw, a small Fabian group, and Sharp as editor.",
                    "https://www.newstatesman.com/history-of-the-new-statesman",
                    "1913",
                ),
                link(
                    "A dissenting tradition: The New Statesman and the left",
                    "New Statesman",
                    "Essay on the Webbs founding the magazine in the same spirit as the Society.",
                    "https://www.newstatesman.com/uncategorized/2013/05/dissenting-tradition-new-statesman-and-left",
                    "2013-05",
                ),
                link(
                    "The secret life of Clifford Sharp",
                    "New Statesman",
                    "Profile of the first editor as a “Fabian technocrat”.",
                    "https://www.newstatesman.com/culture/2013/04/secret-life-clifford-sharp",
                    "2013-04-03",
                ),
                link(
                    "The changing face of the New Statesman, 1913–2013",
                    "New Statesman",
                    "Centenary piece on the first issue and the Webbs’ “What is Socialism?” series.",
                    "https://www.newstatesman.com/uncategorized/2013/04/changing-face-new-statesman-1913-2013",
                    "2013-04-12",
                ),
            ],
        ),
        category(
            "hansard",
            "Hansard debates",
            "Official Hansard records that mention the Fabian Society or Fabianism. Parliament sometimes returns 403 to automated clients; each of these pages was opened in this research pass.",
            [
                link(
                    "Hansard search: “Fabian Society”",
                    "UK Parliament Hansard",
                    "Official full-text search across Commons and Lords.",
                    "https://hansard.parliament.uk/search?searchTerm=%22Fabian%20Society%22",
                ),
                link(
                    "A Democratic Socialist Society",
                    "House of Lords Hansard",
                    "19 May 1993 debate on a democratic socialist society, with named Society references.",
                    "https://hansard.parliament.uk/Lords/1993-05-19/debates/2563e18c-0321-4467-8da0-d0ef9e2b21ce/ADemocraticSocialistSociety",
                    "1993-05-19",
                ),
                link(
                    "Nationalisation",
                    "House of Commons Hansard",
                    "3 November 1948 debate including the phrase “Fabian planner in a nightmare”.",
                    "https://hansard.parliament.uk/commons/1948-11-03/debates/71834d64-0ad7-4ada-8ae5-5383b76bb259/Nationalisation",
                    "1948-11-03",
                ),
                link(
                    "Social Mobility",
                    "House of Lords Hansard",
                    "6 February 2014 debate citing the Society’s 2030 Vision work.",
                    "https://hansard.parliament.uk/Lords/2014-02-06/debates/14020664000342/SocialMobility",
                    "2014-02-06",
                ),
                link(
                    "Tackling Poverty in the UK",
                    "House of Commons Hansard",
                    "10 June 2010 debate that mentions Fabian Society poverty work.",
                    "https://hansard.parliament.uk/commons/2010-06-10/debates/10061031000001/TacklingPovertyInTheUK",
                    "2010-06-10",
                ),
                link(
                    "National Carers Week",
                    "House of Commons Hansard",
                    "8 June 2023 debate referring to Fabian Society social-care proposals published that day.",
                    "https://hansard.parliament.uk/commons/2023-06-08/debates/8A70DFCD-BEFC-49F7-8B3D-2B369DD6008C/NationalCarersWeek",
                    "2023-06-08",
                ),
                link(
                    "National Insurance Contributions (Reduction in Rates) (No. 2) Bill",
                    "House of Commons Hansard",
                    "13 March 2024 debate quoting Andrew Harrop as general secretary.",
                    "https://hansard.parliament.uk/commons/2024-03-13/debates/310F0D59-4DFA-4030-9C7C-4197DCBC05C8/NationalInsuranceContributions(ReductionInRates)(No2)Bill",
                    "2024-03-13",
                ),
                link(
                    "Music Education",
                    "House of Lords Hansard",
                    "9 November 2022 debate citing a joint Fabian Society and Musicians’ Union report.",
                    "https://hansard.parliament.uk/lords/2022-11-09/debates/B902CB55-9827-4C3F-B500-66EED4F53B66/MusicEducation",
                    "2022-11-09",
                ),
            ],
        ),
        category(
            "archives",
            "Archives and official records",
            "National Archives, British Library, LSE and AIM25 catalogue records for Webb, Shaw and Fabian papers.",
            [
                link(
                    "Fabian Society (organisation record)",
                    "The National Archives Discovery",
                    "TNA organisation authority record pointing to deposited Fabian papers.",
                    "https://discovery.nationalarchives.gov.uk/details/c/F127133",
                ),
                link(
                    "Published work: Fabian Tracts 1–114",
                    "The National Archives Discovery",
                    "Catalogue entry for early tracts held at the University of Manchester Library.",
                    "https://discovery.nationalarchives.gov.uk/details/r/019b7ae4-2eb8-4274-a51e-3f4fd686fc3e",
                    "1884–1903",
                ),
                link(
                    "Fabian Society archives",
                    "AIM25 / LSE",
                    "Archival description of the main Fabian Society deposit.",
                    "https://atom.aim25.com/index.php/fabian-society-archives-2",
                ),
                link(
                    "Fabian Society records",
                    "LSE Archives",
                    "LSE catalogue series for the Society’s own papers.",
                    "https://archives.lse.ac.uk/records/FABIAN_SOCIETY",
                ),
                link(
                    "Beatrice Webb",
                    "LSE History blog",
                    "LSE historical note on Beatrice Webb as Fabian and School founder.",
                    "https://blogs.lse.ac.uk/lsehistory/2019/01/22/beatrice-webb/",
                    "2019-01-22",
                ),
                link(
                    "Borough Farm, 4 August 1894: the idea for LSE",
                    "LSE History blog",
                    "Account of the Hutchinson will and the breakfast at which LSE was proposed.",
                    "https://blogs.lse.ac.uk/lsehistory/2025/08/04/borough-farm-4-august-1894-the-idea-for-lse/",
                    "2025-08-04",
                ),
                link(
                    "Henry Hunt Hutchinson and his will",
                    "LSE History blog",
                    "Derby solicitor, Fabian member and donor; bequest went to trustees, not simply to the Society.",
                    "https://blogs.lse.ac.uk/lsehistory/2015/09/30/funding-the-vision-henry-hunt-hutchinson-and-his-will/",
                    "2015-09-30",
                ),
                link(
                    "LSE’s first Board of Governors",
                    "LSE History blog",
                    "Includes Edward Pease as founding Fabian, Society secretary and LSE governor 1901–1945.",
                    "https://blogs.lse.ac.uk/lsehistory/2021/12/20/first-governors/",
                    "2021-12-20",
                ),
                link(
                    "Bernard Shaw papers: Fabian Society series",
                    "British Library",
                    "Add MS 50593–50743 classification, including section D Fabian Society (50680–50690).",
                    "https://searcharchives.bl.uk/catalog/033-002084179",
                ),
                link(
                    "Add MS 50680",
                    "British Library",
                    "Shaw papers volume of Fabian circulars, membership discussions and Pease notes, 1888–1906.",
                    "https://searcharchives.bl.uk/catalog/040-002084327",
                ),
                link(
                    "Add MS 50680–50682",
                    "British Library",
                    "Memoranda, reports and ephemera relating to Society affairs, 1888–1920.",
                    "https://searcharchives.bl.uk/catalog/037-002084326",
                ),
                link(
                    "Add MS 50683–50688",
                    "British Library",
                    "Shaw lectures given to or arranged by the Fabian Society.",
                    "https://searcharchives.bl.uk/catalog/037-002084330",
                ),
                link(
                    "Add MS 50690",
                    "British Library",
                    "Printed Fabian publications in the Shaw papers, including early annual reports and the 1884 Manifesto.",
                    "https://searcharchives.bl.uk/catalog/040-002084338",
                ),
                link("British Library Archives and Manuscripts search", "British Library", "Catalogue search home for further Shaw and Fabian shelfmarks.", "https://searcharchives.bl.uk/"),
            ],
        ),
        category(
            "related",
            "Sister and related organisations",
            "Published pages that link the Society to LSE, the Labour Party as a socialist society, the New Statesman, or FEPS.",
            [
                link("Our history", "London School of Economics", "LSE’s institutional history page for the School founded by early Fabians.", "https://www.lse.ac.uk/about-lse/our-history"),
                link("Socialist societies", "Labour Party", "Labour’s official list of affiliated socialist societies, including The Fabian Society.", "https://labour.org.uk/about-us/socialist-societies/"),
                link("The Labour Party Rule Book 2025", "Labour Party", "Current rule book PDF, including socialist-society affiliation fees.", "https://labour.org.uk/wp-content/uploads/2025/07/The-Labour-Party-Rule-Book-2025.pdf", "2025"),
                link("Labour Party Rule Book (resources page)", "Labour Party", "Landing page for the published rule book.", "https://labour.org.uk/resources/labour-party-rulebook/"),
                link("Labour Party home", "Labour Party", "Party front page; affiliation is documented on the socialist-societies page above.", "https://labour.org.uk/"),
                link("Foundation for European Progressive Studies", "FEPS", "European progressive foundation; the UK Society describes itself as affiliated.", "https://www.feps-europe.eu/"),
                link("About FEPS", "FEPS", "Institutional about page for the European network.", "https://www.feps-europe.eu/about/"),
            ],
        ),
        category(
            "international",
            "International Fabian and allied references",
            "Overseas democratic-socialist organisations that name the UK Society or the Fabian tradition.",
            [
                link("Australian Fabians", "Australian Fabians", "Sister organisation in Australia.", "https://www.fabians.org.au/"),
                link("Mission and history", "Australian Fabians", "History page that names the UK Fabian Society as the originating body.", "https://www.fabians.org.au/mission_and_history"),
                link("NZ Fabians", "NZ Fabian Society", "New Zealand organisation in the same named tradition.", "https://www.fabians.org.nz/"),
                link(
                    "About NZ Fabians",
                    "NZ Fabian Society",
                    "About page placing the NZ society in the UK and Australian Fabian tradition.",
                    "https://www.fabians.org.nz/index.php?id=25&view=category",
                ),
                link(
                    "The Internationals: a brief history",
                    "Democratic Socialists of America",
                    "DSA history essay: Eduard Bernstein was “influenced greatly by the Fabian Socialists of Britain”.",
                    "https://www.dsausa.org/blog/the_internationals_a_brief_history/",
                ),
                link(
                    "What SPA leader Norman Thomas can teach today’s DSA",
                    "Democratic Left / DSA",
                    "US socialist commentary naming “Socialist education of the sort done by the Fabian Society in Great Britain”.",
                    "https://democraticleft.dsausa.org/2025/04/09/what-spa-leader-norman-thomas-can-teach-todays-dsa/",
                    "2025-04-09",
                ),
            ],
        ),
        category(
            "criticism",
            "Criticism and commentary",
            "Identifiable, named authors in newspapers, journals or collected works. Anonymous forums and conspiracy pages are not listed.",
            [
                link(
                    "The Reith Lectures are a new low in BBC history",
                    "The Spectator",
                    "Toby Young column criticising a Reith lecturer’s treatment of Fabianism.",
                    "https://www.spectator.co.uk/article/the-reith-lectures-are-a-new-low-in-bbc-history/",
                ),
                link(
                    "The Reith Lectures are a new low in BBC history",
                    "Spectator (US edition)",
                    "Same Young column on the US Spectator site.",
                    "https://spectator.com/article/the-reith-lectures-are-a-new-low-in-bbc-history/",
                ),
                link(
                    "Why Labour remains haunted by the ghosts of Soviet past",
                    "The Daily Telegraph",
                    "Named commentary linking G. D. H. Cole’s Fabian chairmanship to mid-century arguments about liberty and soviets.",
                    "https://www.telegraph.co.uk/men/thinking-man/labour-remains-haunted-ghosts-soviet-past/",
                ),
                link(
                    "The Two Souls of Socialism, chapter 6: The Fabians",
                    "Marxists Internet Archive",
                    "Hal Draper’s 1966 critique of Fabian gradualism and permeation.",
                    "https://www.marxists.org/archive/draper/1966/twosouls/6-fabians.htm",
                    "1966",
                ),
                link(
                    "Where is Britain Going?",
                    "Marxists Internet Archive",
                    "Leon Trotsky’s 1925 book, including the attack on Fabian theory.",
                    "https://www.marxists.org/archive/trotsky/britain/wibg/",
                    "1925",
                ),
                link(
                    "The Fabian “Theory” of Socialism",
                    "Marxists Internet Archive",
                    "Chapter 4 of Where is Britain Going?, naming the Webbs, MacDonald and the Society.",
                    "https://www.marxists.org/archive/trotsky/britain/wibg/ch04.htm",
                    "1925",
                ),
                link(
                    "Old Tortoise",
                    "Marxists Internet Archive",
                    "Raymond Challinor (1962) on contradictions in Fabian gradualism.",
                    "https://www.marxists.org/history/etol/writers/challinor/1962/xx/fabians.htm",
                    "1962",
                ),
                link(
                    "The Gradualists",
                    "Marxists Internet Archive",
                    "G. B. Judd (1951) essay on gradualism associated with the Society.",
                    "https://www.marxists.org/history/etol/writers/judd/1951/01/gradual.html",
                    "1951",
                ),
                link(
                    "The Welfare State: an historical approach",
                    "Marxists Internet Archive",
                    "John Saville (1957) on Fabians as draughtsmen of twentieth-century social policy.",
                    "https://www.marxists.org/archive/saville/1957/xx/welfare.htm",
                    "1957",
                ),
                link(
                    "Trotsky and His English Critics",
                    "Marxists Internet Archive",
                    "R. Palme Dutt (1926) on gradualism as a conservative catchphrase, with the Society in view.",
                    "https://www.marxists.org/archive/dutt/articles/1926/trotsky.htm",
                    "1926",
                ),
                link(
                    "A Brave New World: the Left, social engineering, and eugenics",
                    "International Review of Social History / Cambridge",
                    "Scholarly article discussing Fabian engagement with eugenics and the “residuum”.",
                    "https://www.cambridge.org/core/journals/international-review-of-social-history/article/brave-new-world-the-left-social-engineering-and-eugenics-in-twentiethcentury-europe/94158269859ADC577FA74AC0271CF444",
                ),
            ],
        ),
    ],
}


NEW_PEOPLE = [
    {
        "slug": "edward-pease",
        "name": "Edward R. Pease",
        "living": False,
        "died": "1955",
        "jobTitle": "First long-serving secretary of the Fabian Society",
        "organisation": "Fabian Society",
        "sector": "think_tank",
        "currentPosition": "Founding member; secretary 1891–1913 and acting secretary 1915–19; LSE governor 1901–45 (died 1955)",
        "positionType": "historical",
        "chamber": "none",
        "labourRole": "none",
        "party": "Labour",
        "fabianSummary": "Present at the 4 January 1884 founding meeting. The Society’s history table lists E. R. Pease as general secretary 1891–1913 and acting secretary 1915–19. He wrote The History of the Fabian Society (1916) and sat on Labour’s NEC as the Society’s representative.",
        "primaryFabianStatus": "general_secretary",
        "inclusionBasis": "named_role_or_membership",
        "sourceQuality": "corroborated",
        "involvement": [
            {
                "status": "member",
                "title": "Founding member",
                "start": "1884",
                "current": False,
                "summary": "Named by the Society’s Slow and Steady history as one of the nine present on 4 January 1884, and later at the founding of the LRC.",
            },
            {
                "status": "general_secretary",
                "title": "General secretary",
                "start": "1891",
                "end": "1913",
                "current": False,
                "summary": "Listed on the official chairs and general secretaries table. LSE’s first-governors note says he served as secretary from 1889 and represented the Society on Labour’s NEC, 1900–13.",
            },
        ],
        "outputs": [
            {
                "kind": "report",
                "title": "The History of the Fabian Society",
                "date": "1916",
                "url": "https://www.gutenberg.org/files/13715/13715-h/13715-h.htm",
            }
        ],
        "donations": [],
        "organisations": [
            {"name": "Fabian Society", "kind": "think_tank", "role": "Secretary"},
            {"name": "London School of Economics and Political Science", "kind": "academia", "role": "Governor, 1901–1945"},
            {"name": "Labour Party", "kind": "politics", "role": "NEC representative for the Society, 1900–1913"},
        ],
        "sources": [
            src("https://fabians.org.uk/about-us/our-history/", "Fabian Society, Our history"),
            src("https://fabians.org.uk/slow-and-steady/", "Paul Richards, Slow and Steady, Fabian Society"),
            src("https://blogs.lse.ac.uk/lsehistory/2021/12/20/first-governors/", "LSE History, first Board of Governors"),
            src("https://www.gutenberg.org/files/13715/13715-h/13715-h.htm", "Edward R. Pease, The History of the Fabian Society (Gutenberg)"),
        ],
    },
    {
        "slug": "henry-hunt-hutchinson",
        "name": "Henry Hunt Hutchinson",
        "living": False,
        "died": "1894-07-26",
        "jobTitle": "Solicitor; consulting clerk to the Derby magistrates",
        "organisation": "Derby magistrates / private practice",
        "sector": "other",
        "currentPosition": "Derby solicitor and Fabian member whose 1894 will funded trustees who started LSE (died 1894)",
        "positionType": "historical",
        "chamber": "none",
        "labourRole": "none",
        "party": "none",
        "fabianSummary": "LSE’s history blog says Hutchinson was a member and donor to the Fabian Society. After family bequests, the residue went to trustees (including Sidney Webb and Edward Pease), not to the Society as legal legatee. Those trustees then funded an experimental London School of Economics.",
        "primaryFabianStatus": "donor",
        "inclusionBasis": "named_role_or_membership",
        "sourceQuality": "corroborated",
        "involvement": [
            {
                "status": "member",
                "title": "Member and donor",
                "end": "1894",
                "current": False,
                "summary": "Named by LSE as a Society member who sent cheques and complaints. The same page is careful that the will created a trust; it did not leave the estate simply “to the Fabian Society”.",
            }
        ],
        "outputs": [],
        "donations": [
            {
                "donor": "Henry Hunt Hutchinson",
                "date": "1894",
                "nature": "Testamentary trust whose objects included propaganda and other purposes connected with the Society’s socialism. Legal legatees were trustees, not the Society itself.",
                "recipient": "Hutchinson trustees (including Sidney Webb and Edward Pease)",
                "recordUrl": "https://blogs.lse.ac.uk/lsehistory/2015/09/30/funding-the-vision-henry-hunt-hutchinson-and-his-will/",
                "fabianRelated": True,
            }
        ],
        "organisations": [
            {"name": "Derby magistrates", "kind": "public_body", "role": "Consulting clerk (retired 1877)"},
            {"name": "Fabian Society", "kind": "think_tank", "role": "Member and donor"},
        ],
        "sources": [
            src("https://blogs.lse.ac.uk/lsehistory/2015/09/30/funding-the-vision-henry-hunt-hutchinson-and-his-will/", "LSE History, Henry Hunt Hutchinson and his will"),
            src("https://blogs.lse.ac.uk/lsehistory/2025/08/04/borough-farm-4-august-1894-the-idea-for-lse/", "LSE History, Borough Farm and the idea for LSE"),
        ],
    },
    {
        "slug": "thomas-davidson",
        "name": "Thomas Davidson",
        "living": False,
        "jobTitle": "Philosopher; founder of the Fellowship of the New Life",
        "organisation": "Fellowship of the New Life",
        "sector": "academia",
        "currentPosition": "Scottish-born philosopher whose New Life lectures prompted the group from which the Fabian Society split (nineteenth century)",
        "positionType": "historical",
        "chamber": "none",
        "labourRole": "none",
        "party": "none",
        "fabianSummary": "Encyclopaedia Britannica attributes the Society’s founding to Davidson. The Society’s own Slow and Steady article, and Cambridge’s Shaw-in-Context chapter, describe a split from the Fellowship of the New Life after his “New Life” lecture. This record is a published founding attribution, not a claim that he sat as an ordinary Society member.",
        "primaryFabianStatus": "member",
        "inclusionBasis": "named_role_or_membership",
        "sourceQuality": "corroborated",
        "involvement": [
            {
                "status": "member",
                "title": "Founding attribution / Fellowship of the New Life",
                "start": "1883",
                "current": False,
                "summary": "Britannica names him as the attributed founder. The Society describes itself as born from frustration with the Fellowship he inspired. Do not read this as a modern membership card.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [
            {"name": "Fellowship of the New Life", "kind": "think_tank", "role": "Inspiring lecturer / founder"},
        ],
        "sources": [
            src("https://www.britannica.com/topic/Fabian-Society", "Encyclopaedia Britannica, Fabian Society"),
            src("https://fabians.org.uk/slow-and-steady/", "Paul Richards, Slow and Steady, Fabian Society"),
            src("https://www.cambridge.org/core/books/george-bernard-shaw-in-context/fabian-society/A00CA68EB00D9D14DC2C0F0035B88AA1", "Cambridge, The Fabian Society chapter in George Bernard Shaw in Context"),
        ],
    },
    {
        "slug": "katherine-sangster",
        "name": "Katherine Sangster",
        "living": True,
        "jobTitle": "Member of the Scottish Parliament",
        "organisation": "Scottish Parliament",
        "sector": "politics",
        "currentPosition": "MSP for Edinburgh and Lothians East; former national director of the Scottish Fabians",
        "positionType": "msp",
        "constituency": "Edinburgh and Lothians East",
        "chamber": "holyrood",
        "labourRole": "backbench",
        "party": "Labour",
        "fabianSummary": "Her Holyrood register states that until 8 May 2026 she was a Director at the Fabian Society. The spring 2026 Fabian Review masthead lists her as national director for Scotland.",
        "primaryFabianStatus": "local_officer",
        "inclusionBasis": "named_role_or_membership",
        "sourceQuality": "corroborated",
        "involvement": [
            {
                "status": "local_officer",
                "title": "National director, Scottish Fabians / Director, Fabian Society",
                "end": "2026-05-08",
                "current": False,
                "summary": "Holyrood register: director at 61 Petty France, eight hours a week, pay band £10,001–£15,000, resigned 8 May 2026. The Review masthead names the Scotland post.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [
            {"name": "Scottish Parliament", "kind": "politics", "role": "MSP, Edinburgh and Lothians East"},
            {"name": "Fabian Society", "kind": "think_tank", "role": "Director (to May 2026)"},
        ],
        "sources": [
            src("https://www.parliament.scot/msps/current-and-previous-msps/katherine-sangster", "Scottish Parliament, Katherine Sangster register"),
            src("https://fabians.org.uk/wp-content/uploads/2026/04/FAB-Review-Spring-2026-WEB_.pdf", "Fabian Review, spring 2026, staff list"),
        ],
    },
    {
        "slug": "percival-chubb",
        "name": "Percival Chubb",
        "living": False,
        "died": "1960",
        "jobTitle": "Civil servant, later Ethical Culture leader",
        "organisation": "Local Government Board / Society for Ethical Culture",
        "sector": "charity",
        "currentPosition": "Founding Fabian; later associate leader of the New York Society for Ethical Culture (died 1960)",
        "positionType": "historical",
        "chamber": "none",
        "labourRole": "none",
        "party": "none",
        "fabianSummary": "The Society’s Slow and Steady article names Percival Chubb as one of the original nine in 1884. Jisc Archives Hub describes him as a founder member (1884) who later led Ethical Culture societies in the United States.",
        "primaryFabianStatus": "member",
        "inclusionBasis": "named_role_or_membership",
        "sourceQuality": "corroborated",
        "involvement": [
            {
                "status": "member",
                "title": "Founding member",
                "start": "1884",
                "current": False,
                "summary": "Named by the Society and by the Jisc catalogue as a founder member of 1884.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [
            {"name": "Local Government Board", "kind": "civil_service", "role": "Legal department (from 1878)"},
            {"name": "Society for Ethical Culture of New York", "kind": "charity", "role": "Associate leader"},
        ],
        "sources": [
            src("https://fabians.org.uk/slow-and-steady/", "Paul Richards, Slow and Steady, Fabian Society"),
            src("https://archiveshub.jisc.ac.uk/search/archives/18dfc4cd-9f0e-3d2a-ab2e-433b1d48ef9f", "Jisc Archives Hub, Percival Ashley Chubb"),
        ],
    },
    {
        "slug": "rosamund-dale-owen",
        "name": "Rosamund Dale Owen",
        "living": False,
        "jobTitle": "Writer and lecturer on Robert Owen’s communities",
        "organisation": "Independent / New Harmony tradition",
        "sector": "other",
        "currentPosition": "Granddaughter of Robert Owen; present at the 1884 founding meetings (later Mrs Laurence Oliphant)",
        "positionType": "historical",
        "chamber": "none",
        "labourRole": "none",
        "party": "none",
        "fabianSummary": "The Society’s Slow and Steady article names Robert Owen’s granddaughter among the nine present on 4 January 1884. Pease’s History says Miss Owen (afterwards Mrs Laurence Oliphant) was asked to narrate the New Harmony experience, and that Miss Dale Owen attended the 23 November 1883 meeting.",
        "primaryFabianStatus": "member",
        "inclusionBasis": "named_role_or_membership",
        "sourceQuality": "corroborated",
        "involvement": [
            {
                "status": "member",
                "title": "Founding meeting attendee",
                "start": "1883",
                "current": False,
                "summary": "Named in the Society history article and in Pease’s 1916 History as present in the founding sequence.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [
            {"name": "Fabian Society", "kind": "think_tank", "role": "Founding meeting attendee"},
        ],
        "sources": [
            src("https://fabians.org.uk/slow-and-steady/", "Paul Richards, Slow and Steady, Fabian Society"),
            src("https://www.gutenberg.org/files/13715/13715-h/13715-h.htm", "Edward R. Pease, The History of the Fabian Society (Gutenberg)"),
        ],
    },
    {
        "slug": "frederick-keddell",
        "name": "Frederick Keddell",
        "living": False,
        "jobTitle": "First secretary of the Fabian Society",
        "organisation": "Fabian Society",
        "sector": "think_tank",
        "currentPosition": "Named by Edward Pease as the first secretary of the Society",
        "positionType": "historical",
        "chamber": "none",
        "labourRole": "none",
        "party": "none",
        "fabianSummary": "Pease’s History of the Fabian Society names Frederick Keddell as the first secretary and as present at the 23 November 1883 meeting with Miss Dale Owen and William Clarke.",
        "primaryFabianStatus": "general_secretary",
        "inclusionBasis": "named_role_or_membership",
        "sourceQuality": "corroborated",
        "involvement": [
            {
                "status": "general_secretary",
                "title": "First secretary",
                "start": "1884",
                "current": False,
                "summary": "Primary statement in Pease’s 1916 history, written by a fellow founder.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [
            {"name": "Fabian Society", "kind": "think_tank", "role": "First secretary"},
        ],
        "sources": [
            src("https://www.gutenberg.org/files/13715/13715-h/13715-h.htm", "Edward R. Pease, The History of the Fabian Society (Gutenberg)"),
        ],
    },
    {
        "slug": "mohandas-gandhi",
        "name": "Mohandas Karamchand Gandhi",
        "honorific": "Mahatma",
        "living": False,
        "died": "1948-01-30",
        "jobTitle": "Barrister; leader of the Indian independence movement",
        "organisation": "Indian National Congress",
        "sector": "politics",
        "currentPosition": "Barrister of the Inner Temple; later leader of the Indian independence movement (died 1948)",
        "positionType": "historical",
        "chamber": "none",
        "labourRole": "none",
        "party": "none",
        "fabianSummary": "A 2024 Society history article by executive member Paul Richards states that Gandhi, while a student at the Inner Temple in 1888–91, joined the Fabian Society. That is a published Society statement, not an independent membership roll.",
        "primaryFabianStatus": "member",
        "inclusionBasis": "named_role_or_membership",
        "sourceQuality": "corroborated",
        "involvement": [
            {
                "status": "member",
                "title": "Member (named on the Society history article)",
                "start": "1888",
                "end": "1891",
                "current": False,
                "summary": "Slow and Steady says he joined while studying at the Inner Temple. No second contemporary roll was found in this pass; the citation is the Society’s own page.",
            }
        ],
        "outputs": [],
        "donations": [],
        "organisations": [
            {"name": "Inner Temple", "kind": "other", "role": "Student, 1888–91"},
            {"name": "Indian National Congress", "kind": "politics", "role": "Leader of the independence movement"},
        ],
        "sources": [
            src("https://fabians.org.uk/slow-and-steady/", "Paul Richards, Slow and Steady, Fabian Society"),
        ],
    },
]


def main() -> None:
    refs_path = ROOT / "data" / "references.json"
    refs_path.write_text(json.dumps(REFERENCES, indent=2) + "\n")
    n = sum(len(c["links"]) for c in REFERENCES["categories"])
    print(f"wrote {refs_path} ({n} links, {len(REFERENCES['categories'])} groups)")

    people_path = ROOT / "data" / "people.json"
    people = json.loads(people_path.read_text())
    existing = {p["slug"] for p in people}
    added = []
    for person in NEW_PEOPLE:
        if person["slug"] in existing:
            print("skip existing", person["slug"])
            continue
        people.append(person)
        added.append(person["slug"])
    people_path.write_text(json.dumps(people, indent=2) + "\n")
    print("added people:", ", ".join(added) or "(none)")


if __name__ == "__main__":
    main()
