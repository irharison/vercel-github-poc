/**
 * Plain-English notes for the Spain villa screen.
 * They describe this model. They are not tax, legal or mortgage advice.
 */
export const spainHelp = {
  itp: "ITP (Impuesto de Transmisiones Patrimoniales) is the transfer tax on a resale home. In Andalucía the general rate is 7% of the price. A non-resident buying a second home usually does not qualify for the reduced rates some residents can get. This figure is the price multiplied by the rate you enter, and it is not charged on a new build. Check the current rate with your lawyer or gestor.",

  iva: "IVA is VAT on a new home bought from a developer. It is usually 10% of the price; some purchases are 21%. It replaces ITP, so the model never charges both. The figure is the price multiplied by the rate you enter. Check the rate with your lawyer or gestor.",

  ajd: "AJD (Actos Jurídicos Documentados) is stamp duty on the new-build deed. About 1.2% of the price is a common Andalucía figure, charged as well as IVA and instead of ITP. The figure is the price multiplied by the rate you enter. Check the current rate with your lawyer or gestor.",

  notary: "The notary prepares and witnesses the purchase deed. In Andalucía a usual planning range is about 0.5–1% of the price. This figure is the price multiplied by the percentage you enter. The official tariff depends on the price and the length of the deed, so treat it as an allowance and check the quote with your lawyer or gestor.",

  landRegistry: "The land registry records you as the owner. A usual planning range is about 0.5–1% of the price. This figure is the price multiplied by the percentage you enter. The official fee is banded, so this is an allowance rather than the exact tariff. Check it with your lawyer or gestor.",

  lawyer: "Your Spanish lawyer checks the title, debts and planning, and handles completion. About 1% of the price, plus 21% IVA on that fee, is a common allowance. The model multiplies the price by the fee percent, then adds IVA on the fee only, not on the price. Agree the quote with your lawyer.",

  nie: "An NIE is the foreigner's identity number you need to buy in Spain and to open a Spanish bank account. This lump sum is an allowance for the NIE, the account and small admin costs. A few hundred euros is typical; €1,000 is a round planning figure. Your gestor can tell you the current fees.",

  fx: "The currency spread is what you lose on top of the exchange rate when pounds are turned into euros. A specialist is often under 1%; a high-street bank can be nearer 2–3%. It is this percentage of the euros that finance option actually converts. A Spanish mortgage does not convert the borrowed euros, so that option pays the spread only on the cash you send. Check the live rate and the spread with your broker.",

  renovationTiers:
    "These are planning rates per square metre, not a builder's quote. Light, about €500/m², is decoration and minor fittings. Medium, about €1,000/m², covers kitchens, bathrooms, services and finishes. Full, about €1,800/m², is layout, structure and new services. The works budget is the floor area times the rate for the tier you select. Line items, if you switch them on, are added on top, so do not price the same work twice. Get a local quote before you rely on it.",

  icio: "The licencia de obra is the town hall's permission to do the work, and ICIO is the municipal tax on that work. Many Andalucía town halls charge up to about 4% of the works budget. This figure is the works budget times the percentage you enter. Contingency does not increase it. Rates differ by town, so check them with your lawyer, gestor or architect.",

  worksIva:
    "This is VAT on the building work. The standard rate is 21%. A reduced 10% can apply to some renovations of a home. The model charges it on the works, the architect and project-manager fees, and the contingency. It is not charged on the licence. Confirm the rate with your gestor and the builder.",

  contingency:
    "Contingency is money set aside for work you cannot see yet. About 10% of the works plus the architect and project-manager fees is a common allowance; an older house often needs more. It is that percentage of the works plus those fees. It is included in the works IVA, and it does not increase the licence.",

  cash: "Paying cash means no mortgage on the villa. There is no loan-to-value, no lender's deposit, no arrangement fee, no monthly payment and no interest. You fund the price, the purchase costs, the renovation and the currency transfer on the whole project. Total cost of ownership is that sum. Yearly bills such as IBI are extra.",

  spanishMortgage:
    "A Spanish bank lends against the villa. Non-residents are often capped at 60–70% of the price, so the deposit is the other 30–40%, and purchase costs and the renovation stay in cash. The arrangement fee is a percentage of the loan, paid up front and not added to the balance. The monthly payment is a repayment mortgage at the rate you enter, and total interest runs over the full term. Total cost of ownership adds those fees and that interest to the project, with currency transfer only on the cash you send. Check the offer with the lender.",

  ukRemortgage:
    "This raises pounds against property in the UK, then converts them. You choose the sterling amount; there is no Spanish loan-to-value. The arrangement fee is a percentage of that sterling loan, paid in cash and not added to the balance. The monthly payment and the total interest are worked out in pounds over the term you enter. Total cost of ownership adds those costs to the Spanish project and to the currency transfer on the whole project. The villa itself is not mortgaged in Spain. Check the offer with the UK lender.",

  ltv: "Loan-to-value is the share of the purchase price the Spanish bank will lend. Many lenders cap a non-resident at 60–70%. The loan is the price times this percentage, and never more than the price. It does not pay the purchase costs or the renovation. Check what the lender will actually advance.",

  mortgageDeposit:
    "This deposit is the part of the purchase price the Spanish loan does not cover: the price minus the loan. Non-residents are usually asked for 30–40% of the price. Purchase costs, the renovation and the mortgage fees are further cash on top. It is not the same as a tenant's deposit.",

  arrangement:
    "An arrangement fee is what the lender charges to set up the loan. About 1% of the amount borrowed is a common allowance. It is paid in cash and is not added to the balance, so it does not increase the monthly payment. The Spanish fee is on the euro loan; the UK fee is on the sterling loan.",

  monthlyPayment:
    "The monthly payment is a repayment mortgage: interest plus enough capital to clear the balance over the term, at the rate you enter. A variable Spanish rate will move with Euribor; the figure assumes your rate holds for the whole term. Cash has no payment. The UK payment is calculated in pounds.",

  totalInterest:
    "Total interest is the interest over the full mortgage term at the rate you enter, with no overpayments. It is not the interest for a single year. The rent-or-buy table uses only the years in that column, not this full-term total. Cash has none.",

  totalCost:
    "Total cost of ownership is the price, purchase costs and renovation, plus that option's currency transfer, lender fees and interest over the full mortgage term. Yearly running costs, such as IBI and community fees, are not in it. They stay in the annual cost.",

  ibi: "IBI is the Spanish council tax, billed each year by the town hall. It follows the cadastral value, which is usually well below the price you pay, so it is not a percentage of the purchase price. The model uses the yearly amount you enter. A bill or the town hall is the source; your gestor can confirm it.",

  community:
    "Community fees pay for shared gardens, a pool, roads or an administrator in an urbanisation. A detached villa can be far above or below the default. The model uses the yearly amount you enter. Ask the community administrator for last year's charges.",

  basura:
    "Basura is the town's rubbish collection charge. It is billed yearly and it is separate from IBI. It is usually a small fixed amount. The model uses the figure you enter. The town hall or your gestor can confirm it.",

  irnr: "IRNR is Spanish tax on a non-resident's income from the villa. If you do not let it, Spain taxes an imputed income: the cadastral value times 1.1% when that value was revised in the last ten years, otherwise 2%, then times the tax rate. UK residents are generally 24%. EU and EEA residents are often 19%. If you do let it, tax is on the rent instead, and imputed income remains only for the months you do not offer. Check this with your gestor.",

  vft: "Andalucía requires a holiday let to be registered as a vivienda con fines turísticos (VFT) before it is advertised. This is a one-off allowance for that registration. It is not in the recurring yearly cost; the rent-or-buy comparison counts it in the first year only. You still need the registration even if the fee is small. Check the current rules with your lawyer or gestor.",

  occupancy:
    "Occupancy is the share of the peak-season months you expect to be booked. Gross income is the peak monthly rent times the months offered times this percentage. 60% is a planning guess, not a forecast. Empty days inside a booked month are not modelled separately.",

  management:
    "A holiday manager markets the villa and looks after guests. Fees are often about 15–25% of the gross rent, plus 21% IVA on the fee. The model multiplies the gross by the fee percent, then adds IVA on that fee. The cost is taken off before the net annual cost.",

  rentDeposit:
    "A tenant's deposit is usually one or two months' rent, paid at the start and returned at the end if the villa is left in order. It is shown here and it is not part of the season cost, because you should get it back. It is not the same as the deposit on a mortgage.",

  agency:
    "The letting agency often charges the tenant about one month's rent, plus 21% IVA on that fee. The model takes the monthly rent times the number of months of fee, then adds IVA on the fee, and it does this again each season. Set the months to 0 if you pay the agency only once.",

  comparison:
    "Each column is the cost after 1, 5 or 10 years. Rent is the season cost, rising by the annual increase you set. Buying is the price, purchase costs, renovation, currency transfer and finance fees, plus interest and running costs for those years only, minus what the villa is worth by then. A negative buying cost means the villa is worth more than the money spent. Selling costs are not deducted.",

  appreciation:
    "Appreciation is your estimate of how fast the villa's value grows each year. It is not a forecast. The comparison starts from the post-renovation value, or from the purchase price if that is left at 0, and compounds this percentage. The model does not know the market.",

  breakeven:
    "This is the first year, looking ahead up to 40, in which buying costs less than renting for that finance option. It uses the same sums as the 1, 5 and 10 year columns, including the appreciation rate and the yearly rent rise. If buying is still dearer after 40 years, it says so. It compares these estimates; it is not advice to buy or to rent.",
} as const;

export type SpainHelpKey = keyof typeof spainHelp;
