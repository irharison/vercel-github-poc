/**
 * Plain-English notes for the UK deal screen.
 * They describe this model. They are not tax or lending advice.
 */
export const dealHelp = {
  price:
    "The price in the contract. Stamp duty is worked from the bands in Settings. The loan is capped against this price, or against the valuation if you enter one and the lender uses it.",

  sdlt: "Stamp Duty Land Tax on a residential purchase in England. Each slice of the price is charged at that band's rate. Once the price is at least £40,000, the additional-dwelling surcharge is added to every band, including the nil-rate band. A company can instead pay a flat rate above the threshold in Settings. Check the bands against HMRC.",

  legal:
    "The solicitor's fee for the purchase, as a lump sum. It is cash you need on day one, and it is included in the base cost that reduces the taxable gain on sale.",

  survey:
    "A building survey, as a lump sum. It is cash on day one. It is not added to the base cost for the tax on sale.",

  refurb:
    "Work you expect to do on the property. It is always cash out. If you treat it as capital, it is added to the base cost and reduces the taxable gain when you sell. If you do not, the gain ignores it.",

  rent: "The monthly rent when the property is let. A year's rent divided by the purchase price is the gross yield. The same rent limits the loan, because the lender tests whether it covers the interest.",

  hold: "How long you keep the property, in months. Rent, interest and tax run for that period, and the sale is assumed at the end.",

  voids:
    "The share of the rent you expect to lose while the property is empty. That portion is taken off the gross rent before costs and tax.",

  management:
    "The letting agent's fee, as a percentage of the gross rent. It is an operating cost during the hold. Voids are a separate reduction, not part of this percentage.",

  deposit:
    "The cash you put in. On maximum borrowing it is whatever the lender will not advance. If you ask for a smaller deposit than the lender's minimum, the model raises the deposit to that minimum.",

  loan: "The amount borrowed. It is the lower of the loan-to-value cap and the interest-cover cap, unless you set a smaller loan yourself. Interest is charged on this balance.",

  ltv: "Loan to value is the loan divided by the price, or by the valuation if that is what the lender uses. The default cap is 75%. The loan cannot go above this cap.",

  icr: "Interest cover compares the rent the lender counts with the interest at the stress rate. The default test is 1.25 times. If this limit binds before the loan-to-value cap, the loan is cut and the deposit rises.",

  monthlyInterest:
    "A month of interest on the drawn balance at the pay rate. The loan in this model is interest only, so the payment does not reduce the capital.",

  profit:
    "Rental profit after tax, plus the cash you get back on sale, minus the cash you put in at the start. A negative figure means the deal returns less cash than it took.",

  returnOnCash:
    "Total profit divided by the cash you put in. The yearly figure spreads that return over the hold. It is a cash calculation from these inputs, not a forecast.",

  rentalProfit:
    "Rent left after voids, running costs, interest and tax, over the whole hold. Held personally, mortgage interest is not deducted from residential rent; a basic-rate credit is given instead, so tax can be due in a year that loses cash.",

  gainTax:
    "Tax on the gain when you sell. The gain is the sale price, after agent and legal fees, minus the base cost. A company pays corporation tax and has no annual exempt amount. A person pays capital gains tax after the annual exempt amount in Settings. A loss means no tax on the sale. Check the rates against HMRC.",
} as const;

export type DealHelpKey = keyof typeof dealHelp;

const dealLineNotes: Record<string, string> = {
  Deposit: dealHelp.deposit,
  "Stamp duty": dealHelp.sdlt,
  "Legal fees": dealHelp.legal,
  Survey: dealHelp.survey,
  Refurbishment: dealHelp.refurb,
};

export function dealLineInfo(label: string): string | undefined {
  return dealLineNotes[label];
}
