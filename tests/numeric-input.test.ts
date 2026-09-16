import { describe, expect, it } from "vitest";
import {
  isAllowedNumericDraft,
  parseNumericInput,
  settleNumericDraft,
} from "../lib/numeric-input";

describe("numeric field drafts", () => {
  it("lets the user clear the field without snapping to 0", () => {
    expect(parseNumericInput("")).toBeNull();
    expect(parseNumericInput("-")).toBeNull();
    expect(parseNumericInput(".")).toBeNull();
    expect(parseNumericInput("-.")).toBeNull();
  });

  it("commits parseable numbers while leaving partial drafts uncommitted", () => {
    expect(parseNumericInput("24")).toBe(24);
    expect(parseNumericInput("36")).toBe(36);
    expect(parseNumericInput("3.")).toBe(3);
    expect(parseNumericInput("0")).toBe(0);
    expect(parseNumericInput(".5")).toBe(0.5);
  });

  it("rejects non-numeric keystrokes", () => {
    expect(isAllowedNumericDraft("24")).toBe(true);
    expect(isAllowedNumericDraft("")).toBe(true);
    expect(isAllowedNumericDraft("-")).toBe(true);
    expect(isAllowedNumericDraft("abc")).toBe(false);
    expect(isAllowedNumericDraft("12e3")).toBe(false);
    expect(parseNumericInput("abc")).toBeNull();
  });

  it("clamps hold period only when settling (blur), not while empty", () => {
    expect(parseNumericInput("")).toBeNull();
    expect(settleNumericDraft("", { min: 1, max: 600, integer: true })).toBe(1);
    expect(settleNumericDraft("0", { min: 1, max: 600, integer: true })).toBe(1);
    expect(settleNumericDraft("36", { min: 1, max: 600, integer: true })).toBe(36);
    expect(settleNumericDraft("999", { min: 1, max: 600, integer: true })).toBe(600);
    expect(settleNumericDraft("24.7", { min: 1, max: 600, integer: true })).toBe(25);
  });

  it("settles empty money fields to 0 so mid-edit empty does not display as 0 until blur", () => {
    expect(parseNumericInput("")).toBeNull();
    expect(settleNumericDraft("")).toBe(0);
    expect(settleNumericDraft("1500.25")).toBe(1500.25);
  });
});
