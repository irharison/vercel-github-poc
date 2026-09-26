import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ALLOWED_EMAIL_DOMAIN,
  SESSION_MAX_AGE_SECONDS,
  SESSION_UPDATE_AGE_SECONDS,
  canCreateSession,
  isAllowedEmail,
  isApiPath,
  isPublicPath,
  safeCallbackUrl,
} from "../lib/auth-domain";
import { apps, activeApp } from "../lib/apps";
import { isAuthDevBypass } from "../lib/auth-dev";

describe("isAllowedEmail", () => {
  it("accepts nataliedennis.co.uk addresses case-insensitively", () => {
    expect(isAllowedEmail("ian@nataliedennis.co.uk")).toBe(true);
    expect(isAllowedEmail("Ian@NatalieDennis.CO.UK")).toBe(true);
    expect(isAllowedEmail("  ian+deals@nataliedennis.co.uk  ")).toBe(true);
  });

  it("rejects other Google / Gmail accounts and lookalikes", () => {
    expect(isAllowedEmail("ian@gmail.com")).toBe(false);
    expect(isAllowedEmail("someone@googlemail.com")).toBe(false);
    expect(isAllowedEmail("ian@notnataliedennis.co.uk")).toBe(false);
    expect(isAllowedEmail("ian@nataliedennis.co.uk.evil.com")).toBe(false);
    expect(isAllowedEmail("ian@sub.nataliedennis.co.uk")).toBe(false);
    expect(isAllowedEmail(`ian@${ALLOWED_EMAIL_DOMAIN}.example`)).toBe(false);
    expect(isAllowedEmail("nataliedennis.co.uk")).toBe(false);
    expect(isAllowedEmail("@nataliedennis.co.uk")).toBe(false);
    expect(isAllowedEmail("")).toBe(false);
    expect(isAllowedEmail(null)).toBe(false);
    expect(isAllowedEmail(undefined)).toBe(false);
  });
});

describe("canCreateSession", () => {
  it("requires a verified allowed email", () => {
    expect(canCreateSession({ email: "ian@nataliedennis.co.uk", emailVerified: true })).toBe(
      true,
    );
    expect(canCreateSession({ email: "ian@nataliedennis.co.uk" })).toBe(true);
    expect(
      canCreateSession({ email: "ian@nataliedennis.co.uk", emailVerified: false }),
    ).toBe(false);
    expect(canCreateSession({ email: "ian@gmail.com", emailVerified: true })).toBe(false);
  });
});

describe("isPublicPath", () => {
  it("allows auth routes only", () => {
    expect(isPublicPath("/signin")).toBe(true);
    expect(isPublicPath("/auth/error")).toBe(true);
    expect(isPublicPath("/api/auth/callback/google")).toBe(true);
    expect(isPublicPath("/api/auth/session")).toBe(true);
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/research")).toBe(false);
    expect(isPublicPath("/cache")).toBe(false);
    expect(isPublicPath("/settings")).toBe(false);
    expect(isPublicPath("/api/pd/sold-prices")).toBe(false);
    expect(isPublicPath("/property")).toBe(false);
    expect(isPublicPath("/fathom")).toBe(false);
    expect(isPublicPath("/fathom/api/Trades")).toBe(false);
    expect(isPublicPath("/fathom/docs")).toBe(false);
  });
});

describe("isApiPath", () => {
  it("covers the host APIs and the Fathom API, not the desk pages", () => {
    expect(isApiPath("/api/pd/sold-prices")).toBe(true);
    expect(isApiPath("/api/auth/session")).toBe(true);
    expect(isApiPath("/fathom/api/Trades")).toBe(true);
    expect(isApiPath("/fathom/Monitoring/Ping")).toBe(true);
    expect(isApiPath("/fathom/openapi.json")).toBe(true);
    expect(isApiPath("/fathom/docs")).toBe(false);
    expect(isApiPath("/fathom/blotter")).toBe(false);
    expect(isApiPath("/property")).toBe(false);
  });
});

describe("session lifetime", () => {
  it("persists 30 days and rolls at least daily", () => {
    expect(SESSION_MAX_AGE_SECONDS).toBe(30 * 24 * 60 * 60);
    expect(SESSION_UPDATE_AGE_SECONDS).toBe(24 * 60 * 60);
    expect(SESSION_UPDATE_AGE_SECONDS).toBeLessThan(SESSION_MAX_AGE_SECONDS);
  });
});

describe("safeCallbackUrl", () => {
  it("keeps same-origin relative paths and drops open redirects", () => {
    expect(safeCallbackUrl("/research")).toBe("/research");
    expect(safeCallbackUrl("/property/research")).toBe("/property/research");
    expect(safeCallbackUrl("/fathom/blotter")).toBe("/fathom/blotter");
    expect(safeCallbackUrl("/fathom/docs")).toBe("/fathom/docs");
    expect(safeCallbackUrl("/settings?tab=tax")).toBe("/settings?tab=tax");
    expect(safeCallbackUrl("https://evil.example/")).toBe("/");
    expect(safeCallbackUrl("//evil.example")).toBe("/");
    expect(safeCallbackUrl("/signin")).toBe("/");
    expect(safeCallbackUrl("/api/pd/x")).toBe("/");
    expect(safeCallbackUrl("/fathom/api/Trades")).toBe("/");
    expect(safeCallbackUrl("/fathom/openapi.json")).toBe("/");
    expect(safeCallbackUrl(undefined)).toBe("/");
  });
});

describe("apps", () => {
  it("lists each app once, under its own prefix", () => {
    const ids = apps.map((app) => app.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(apps.map((app) => app.href)).toEqual(["/property", "/fathom"]);
    expect(activeApp("/property/research")?.id).toBe("property");
    expect(activeApp("/fathom/blotter")?.id).toBe("fathom");
    expect(activeApp("/")).toBeUndefined();
  });
});

describe("isAuthDevBypass", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stays off on Vercel and in production", () => {
    vi.stubEnv("AUTH_DEV_BYPASS", "1");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL", "1");
    expect(isAuthDevBypass()).toBe(false);

    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(isAuthDevBypass()).toBe(false);

    vi.stubEnv("NODE_ENV", "development");
    expect(isAuthDevBypass()).toBe(true);

    vi.stubEnv("AUTH_DEV_BYPASS", "");
    expect(isAuthDevBypass()).toBe(false);
  });
});
