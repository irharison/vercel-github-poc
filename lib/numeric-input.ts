/** Shared parsing for MoneyField / PercentField draft editing. */

const ALLOWED_DRAFT = /^-?(?:\d+\.?\d*|\.\d*)?$/;

export function isAllowedNumericDraft(text: string): boolean {
  return ALLOWED_DRAFT.test(text);
}

/**
 * Parse a field draft into a number. Empty, "-", "." and "-." stay
 * uncommitted so the user can delete digits and retype without snapping to 0.
 */
export function parseNumericInput(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "" || trimmed === "-" || trimmed === "." || trimmed === "-.") {
    return null;
  }
  if (!ALLOWED_DRAFT.test(trimmed)) return null;
  const next = Number(trimmed);
  return Number.isFinite(next) ? next : null;
}

export function clampNumber(
  value: number,
  options: { min?: number; max?: number; integer?: boolean } = {},
): number {
  let next = options.integer ? Math.round(value) : value;
  if (options.min != null) next = Math.max(options.min, next);
  if (options.max != null) next = Math.min(options.max, next);
  return next;
}

/** Apply min/max (and optional integer rounding) when the field blurs. */
export function settleNumericDraft(
  text: string,
  options: { min?: number; max?: number; integer?: boolean; emptyValue?: number } = {},
): number {
  const parsed = parseNumericInput(text);
  const fallback = options.emptyValue ?? options.min ?? 0;
  return clampNumber(parsed ?? fallback, options);
}
