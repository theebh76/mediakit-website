import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 300; // 5 minutes

type CreditsResponse =
  | {
      configured: true;
      budget: number;
      spent: number;
      remaining: number;
      currency: string;
      periodStart: string;
      periodEnd: string;
      asOf: string;
    }
  | {
      configured: false;
      reason: string;
    };

function startOfMonthUTC(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0));
}

function startOfNextMonthUTC(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 0, 0, 0));
}

function extractAmount(node: unknown): number {
  // Defensively walk an unknown JSON shape and sum any numeric "amount" or
  // "cost" fields we encounter. This keeps the widget resilient if the
  // Anthropic Admin API response schema evolves.
  if (node == null) return 0;
  if (typeof node === "number") return 0;
  if (Array.isArray(node)) return node.reduce<number>((s, v) => s + extractAmount(v), 0);
  if (typeof node === "object") {
    const o = node as Record<string, unknown>;
    let total = 0;
    // Direct amount/cost shapes
    for (const key of ["amount", "cost", "total_cost", "value"]) {
      const v = o[key];
      if (typeof v === "number") total += v;
      else if (v && typeof v === "object") {
        const inner = (v as Record<string, unknown>).value;
        if (typeof inner === "number") total += inner;
      }
    }
    // Recurse into nested arrays/objects
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (Array.isArray(v) || (v && typeof v === "object")) {
        total += extractAmount(v);
      }
    }
    return total;
  }
  return 0;
}

export async function GET(): Promise<NextResponse<CreditsResponse>> {
  const adminKey = process.env.ANTHROPIC_ADMIN_KEY;
  const budgetRaw = process.env.ANTHROPIC_MONTHLY_BUDGET;
  const budget = budgetRaw ? Number(budgetRaw) : NaN;

  if (!adminKey) {
    return NextResponse.json({
      configured: false,
      reason: "Set ANTHROPIC_ADMIN_KEY in Vercel to enable.",
    });
  }
  if (!Number.isFinite(budget) || budget <= 0) {
    return NextResponse.json({
      configured: false,
      reason: "Set ANTHROPIC_MONTHLY_BUDGET (USD) in Vercel to enable.",
    });
  }

  const start = startOfMonthUTC();
  const end = startOfNextMonthUTC();
  const url = new URL("https://api.anthropic.com/v1/organizations/cost_report");
  url.searchParams.set("starting_at", start.toISOString());
  url.searchParams.set("ending_at", end.toISOString());

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "x-api-key": adminKey,
        "anthropic-version": "2023-06-01",
      },
      // Cache on the server for 5 minutes to avoid rate-limit pressure.
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({
        configured: false,
        reason: `Anthropic API ${res.status}: ${text.slice(0, 120) || "request failed"}`,
      });
    }

    const json = (await res.json()) as unknown;
    const spent = Math.round(extractAmount(json) * 100) / 100;
    const remaining = Math.max(0, Math.round((budget - spent) * 100) / 100);

    return NextResponse.json({
      configured: true,
      budget,
      spent,
      remaining,
      currency: "USD",
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      asOf: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({
      configured: false,
      reason: e instanceof Error ? e.message : "Failed to reach Anthropic API",
    });
  }
}
