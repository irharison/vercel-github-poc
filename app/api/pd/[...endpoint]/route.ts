import { auth } from "@/auth";
import { isAllowedEmail } from "@/lib/auth-domain";
import { ALLOWED_ENDPOINTS, normalisePostcode } from "@/lib/propertydata";

const PD_BASE = "https://api.propertydata.co.uk";

export async function GET(
  request: Request,
  context: { params: Promise<{ endpoint: string[] }> },
) {
  const session = await auth();
  if (!isAllowedEmail(session?.user?.email)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { endpoint: parts } = await context.params;
  const endpoint = parts.join("/");
  const spec = ALLOWED_ENDPOINTS[endpoint];
  if (!spec) {
    return Response.json(
      { error: `Endpoint "${endpoint}" is not allowlisted`, allowed: Object.keys(ALLOWED_ENDPOINTS) },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const refresh = url.searchParams.get("refresh") === "1" || Boolean(spec.noCache);
  const key = process.env.PROPERTYDATA_API_KEY;
  if (!key) {
    return Response.json(
      {
        error: "No PROPERTYDATA_API_KEY configured in Vercel env. Deal appraisal still works without it.",
        cache: refresh ? "BYPASS" : "MISS",
        endpoint,
      },
      { status: 503 },
    );
  }

  const upstream = new URL(`${PD_BASE}/${endpoint}`);
  for (const [name, value] of url.searchParams.entries()) {
    const k = name.trim().toLowerCase();
    if (k === "key" || k === "refresh" || k === "token") continue;
    let v = value.trim();
    if (!v) continue;
    if (k === "postcode") v = normalisePostcode(v);
    upstream.searchParams.append(k, v);
  }
  upstream.searchParams.set("key", key);

  let response: Response;
  try {
    response = await fetch(upstream.toString(), { headers: { accept: "application/json" } });
  } catch (err) {
    return Response.json(
      { error: `Upstream request failed: ${err instanceof Error ? err.message : String(err)}`, endpoint },
      { status: 502 },
    );
  }

  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json(
      { error: "Upstream returned a non-JSON response", endpoint, status: response.status, raw: text.slice(0, 500) },
      { status: 502 },
    );
  }

  if (!response.ok) {
    return Response.json(
      { error: "Upstream returned an error", endpoint, status: response.status, data: body },
      { status: response.status },
    );
  }

  return Response.json({
    cache: spec.noCache ? "NO_CACHE" : refresh ? "REFRESH" : "MISS",
    endpoint,
    fetchedAt: new Date().toISOString(),
    ageDays: 0,
    creditsSpent: spec.credits,
    data: body,
  });
}
