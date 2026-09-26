export type LearnTopic = {
  kicker: string;
  title: string;
  paragraphs: string[];
  mapping: string;
};

export const LEARN: Record<string, LearnTopic> = {
  "/": {
    kicker: "Start here",
    title: "The desk in one glance",
    paragraphs: [
      "A front-to-back desk keeps the trade, the price, the risk, and the cash in one place. The cockpit is the morning view: what the book is worth, what changed overnight, and which trades are stuck before operations will touch them.",
      "Present value (PV) is the model's value of the open trades in US dollars. Day P&L is today's value minus yesterday's value, with brand-new trades counted as model value minus any premium paid.",
      "DV01 is how many dollars the book loses if yields rise by one basis point, which is 0.01%. A positive DV01 means you are long rates, like owning bonds or receiving fixed on a swap.",
      "VaR is a loss number from recent scenarios, not a promise. The figure here is a one-day 95% historical VaR on a simplified sensitivity map. Read the Risk screen before you trust the shape of it.",
      "On the hosted desk, the book lives inside the server process that answered you. A cold start loads the sample trades. A trade you book is there for the next request that hits the same process. Another process, or the next cold start, begins again from the sample book. Reset data does the same thing on purpose for the process you are talking to.",
    ],
    mapping:
      "Public descriptions of platforms in this category, including Orchestrade, call this the portfolio view: positions, P&L, and risk together, updated as trades and market data change. Orchestrade's own pages also mention flash P&L for the front office.",
  },
  "/blotter": {
    kicker: "Front office",
    title: "Trade blotter",
    paragraphs: [
      "The blotter is the list of trades. It is the screen a trader or a middle-office analyst lives on: filter it, sort it, and open a row when you need the ticket or the lifecycle.",
      "Each row is one deal, whatever the asset class. A bond, a swap, an FX forward, and an option share the same columns so the book can be scanned without switching systems.",
      "Status is where the trade is in the operational life, not whether it made money. Cancelled trades stay visible so the history is not erased.",
    ],
    mapping:
      "Orchestrade's treasury material names a unified cross-asset trade blotter, and a middle-office note says risk measures for treasury and derivatives sit on a single blotter. The columns on this screen are a teaching set, not a published Orchestrade layout.",
  },
  "/ticket": {
    kicker: "Front office",
    title: "Trade ticket",
    paragraphs: [
      "The ticket is how a trade gets into the system by hand. Booking means writing the economics: who, which book, which way, how much, and which dates.",
      "Rates are decimals in the API (0.04 means 4%). This form lets you type 4 for a coupon or a swap rate and converts it. FX rates and commodity prices are typed as prices, not percentages.",
      "Price draft asks the model what the ticket is worth before you save it. That is pre-trade analysis. It does not create a trade.",
      "Amend changes an existing trade and sends it back to Booked. Someone has to check the new economics again. Settled and cancelled trades cannot be amended.",
      "Booking writes into the book of this server process. On a hosted copy that book is not shared with the next process, so a trade can be on the blotter now and absent after a fresh start. The sample book is loaded again when that happens.",
    ],
    mapping:
      "Orchestrade's materials describe booking, manual trade capture, and pre-trade analysis with live market data. They do not publish the field list. These fields follow ordinary market conventions for the products their brochure lists.",
  },
  "/lifecycle": {
    kicker: "Middle office",
    title: "Lifecycle and audit trail",
    paragraphs: [
      "After a trade is booked, someone checks it (Verified), the counterparty confirmation matches (Confirmed), and operations mark the settlement instruction done (Settled). Cancel is allowed until it is settled.",
      "Settled does not mean the position vanished. A bond you have already paid for is still on the book, and it still has price risk. An FX spot whose value date has passed is economically finished, so it drops out of risk.",
      "Every step writes an event: who, when, from which status, to which status. Amend writes the fields that changed. That trail is what audit and operations argue from when a number looks wrong.",
    ],
    mapping:
      "Orchestrade describes confirmation, settlement, and a dictionary of business events kept separate from the product. A third-party client of the Web API names event types such as AmendEvent, SettlementEvent, TerminationEvent, NovationEvent, and ExerciseEvent. This screen writes the first three, plus teaching steps Verified and Confirmed. Novation, exercise, and clearing are named and not implemented. The status names are a teaching machine, not a published Orchestrade workflow.",
  },
  "/pricing": {
    kicker: "Valuation",
    title: "Pricing",
    paragraphs: [
      "Pricing turns the ticket plus today's market into a present value. Bonds are discounted cash flows. Swaps compare a fixed leg with a floating leg projected from the curve. FX forwards use covered-interest parity: the fair outright is spot adjusted by the two discount factors.",
      "Equity options use Black-Scholes-Merton. FX options use the same formula with two interest rates (Garman-Kohlhagen). A flat volatility is a simplification; a real book has a surface by strike and expiry.",
      "Commodity swaps settle (forward − fixed) × volume, then discount. Futures are marked to the forward with no discount, because variation margin is paid as the price moves.",
      "The curve is a single curve per currency, bootstrapped from deposits and par swaps. Real desks often discount on one curve and project the floating rate on another. That multi-curve setup is not in this demo.",
    ],
    mapping:
      "Orchestrade publishes that it has a valuation library, curves, and volatility inputs, and that clients can plug in their own models. It does not name QuantLib. QuantLib is the engine in this demo so the numbers are real and inspectable.",
  },
  "/market": {
    kicker: "Market data",
    title: "Curves, spots, and vols",
    paragraphs: [
      "Nothing prices itself from the ticket alone. The model needs a yield curve, FX spots, equity spots, volatilities, and commodity forwards. Edit a pillar and save. Pricing, risk, and P&L all reread this screen.",
      "A basis point is 0.01 percentage points. The +1bp button adds 0.0001 to every USD pillar so you can watch a bond's value fall.",
      "Yesterday's close is frozen. Day P&L is the gap between that close and whatever you have on the screen now. The levels are fictional. They are not a market close and not anyone's data vendor feed.",
    ],
    mapping:
      "Orchestrade's technology notes list market-data connectivity, and a published demonstration description says curve points can be edited and drilled into from a position. This editor is a small version of that idea.",
  },
  "/risk": {
    kicker: "Risk",
    title: "Sensitivities, VaR, and stress",
    paragraphs: [
      "DV01 bumps the yield curve up by one basis point and records how much present value you lose. Pillar DV01 bumps one maturity at a time so you can see whether the risk sits in 2-year or 10-year rates. Those pieces do not add exactly to the parallel number.",
      "Delta is the value change for a one-point move in a price: an equity, an FX spot, or a commodity forward. Vega is the value change for one volatility point, meaning volatility rises from 20% to 21%.",
      "Historical VaR replays stored daily factor moves through those sensitivities and reads off a loss percentile. Parametric VaR assumes the same moves are a normal distribution. Both are one-day, linear, and fed by synthetic scenarios. A stress test is different: it fully reprices the book under a shock you can explain in words, such as equities down 20%.",
    ],
    mapping:
      "Orchestrade's hedge-fund page lists greeks, DV01, key-rate analysis across curves, VaR, and stress shocks to equities, FX, rates, and volatility. It does not publish the VaR method. CS01, cross-greeks, and limits are named there and are not on this screen.",
  },
  "/positions": {
    kicker: "Front office",
    title: "Positions",
    paragraphs: [
      "A position is trades added up. Ten buys and four sells in the same instrument become one signed notional. Present value is still the sum of the trade values, converted to dollars.",
      "The currency panel is only the FX trades: how much EUR, GBP, USD, and JPY the forwards and spots will exchange. A bond does not create that kind of currency balance until its coupons are paid, and those sit on the operations ladder.",
      "Cancelled trades and trades that have already matured are left out. A settled bond is still a position.",
    ],
    mapping:
      "Orchestrade materials describe positions by book and a currency-position view next to the blotter, with drill-down from portfolio to trade. This screen is that rollup.",
  },
  "/pnl": {
    kicker: "P&L",
    title: "Daily P&L explain",
    paragraphs: [
      "Day P&L asks why the number moved, not only by how much. New trades contribute model value minus premium. Everything already on the book yesterday is walked forward in a fixed order.",
      "Time keeps yesterday's market and moves the valuation date. Rates then swaps in today's curves. FX swaps in today's spots. Prices covers equity spots and commodity forwards. Volatility is last. Residual is the part that does not land in a single bucket, mostly because the effects interact.",
      "If you edit today's curve, the rates column should move and yesterday should stay still. That is the point of keeping two market snapshots.",
    ],
    mapping:
      "Orchestrade's pages say P&L can be explained by moves in rates, currency, and equity markets, and sliced by book, trader, and currency. The waterfall order on this screen is a teaching choice, not a published Orchestrade report.",
  },
  "/operations": {
    kicker: "Operations",
    title: "Cash and settlement ladder",
    paragraphs: [
      "Operations care about cash: who pays whom, in which currency, on which day. The ladder sums those amounts. Coupons and FX exchanges are known. Floating swap coupons and commodity settlements are estimates from today's curve, which is why they are marked estimated.",
      "A future's open mark-to-market is shown on the contract date as one projected flow. On an exchange that amount would have been paid gradually as variation margin.",
      "This is not a payment factory. Nothing here sends a wire or matches a confirmation message.",
    ],
    mapping:
      "Orchestrade describes projected cash flows, payment schedules, and treasury cash ladders, plus confirmation and settlement as back-office steps. Collateral, margin calls, and accounting entries are part of that public description and are not built here.",
  },
  "/static": {
    kicker: "Reference data",
    title: "Books, counterparties, currencies, calendars",
    paragraphs: [
      "Static data changes slowly. A book is a portfolio you group trades into. A counterparty is who is on the other side. Currencies are the units. Calendars say which days are holidays so schedules do not pretend a bond pays on a closed day.",
      "The ticket will only offer active books and counterparties. Add a fictional firm here and it shows up the next time you book.",
      "Holiday lists are generated from standard financial calendars so the dates are real. The firms are not.",
    ],
    mapping:
      "Orchestrade's materials talk about a shared data model and about slicing the book by book, fund, strategy, and entity. The Web API snapshot groups parties, calendars, currencies, and CSA agreements as reference data. This screen lists those. CSA rows are not used in pricing. A field-level master screen is not published.",
  },
  "/api-guide": {
    kicker: "Integration",
    title: "The same desk over HTTP",
    paragraphs: [
      "Every button on this desk calls the API. Resource names are PascalCase and grouped the way a published third-party client of the Orchestrade Web API groups them: Trades, Position, Pricing, Risk, Report, Quote, curves, Party, and Monitoring.",
      "Sign in with HTTP Basic (desk or ops, password fathom). GET /fathom/Monitoring/Ping is the one call that does not ask for that classroom login. POST /fathom/api/Trades books a trade. PUT /fathom/api/Trades with an Action moves the teaching workflow; without an Action it amends. GET /fathom/api/Pricing/GetTradePriceFromTradeId reads a saved mark. GET /fathom/api/Risk/AnalysisReport and GET /fathom/api/Report/PLReport/Default read risk and P&L.",
      "Read a response before you trust it. Present values are model output from fictional market data. They are for learning the shape of that API, not for a real position. FRTB, SIMM, and novation are named in the real model and return an error here.",
    ],
    mapping:
      "Orchestrade's technology page says the platform exposes C#, Python, and REST APIs. The path names on this page follow Derivitec's Orchestrade.Client, a third-party library generated from a Swagger file, not an official Orchestrade document. This demo implements only the subset the screens use.",
  },
};

export function learnFor(pathname: string): LearnTopic {
  const local = pathname.startsWith("/fathom") ? pathname.slice("/fathom".length) || "/" : pathname;
  if (local.startsWith("/ticket")) return LEARN["/ticket"];
  return LEARN[local] ?? LEARN["/"];
}
