"use client";

import { useEffect, useState } from "react";

type Configured = {
  configured: true;
  budget: number;
  spent: number;
  remaining: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  asOf: string;
};
type Unconfigured = { configured: false; reason: string };
type Data = Configured | Unconfigured;

function fmt(n: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

export function CreditsWidget() {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let cancel = false;
    fetch("/api/credits", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: Data) => {
        if (!cancel) setData(d);
      })
      .catch(() => {
        if (!cancel) setData({ configured: false, reason: "Could not load." });
      });
    return () => {
      cancel = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="border rule" style={shellStyle}>
        <span className="kicker">Claude API Credits</span>
        <span className="meta">Loading…</span>
      </div>
    );
  }

  if (!data.configured) {
    return (
      <div className="border rule" style={shellStyle} title={data.reason}>
        <span className="kicker">Claude API Credits</span>
        <span className="meta">Not configured</span>
        <span className="meta hidden md:inline" style={{ opacity: 0.75 }}>
          {data.reason}
        </span>
      </div>
    );
  }

  const { budget, spent, remaining, currency } = data;
  const pctUsed = Math.min(100, Math.max(0, (spent / budget) * 100));
  const low = pctUsed >= 80;
  const veryLow = pctUsed >= 95;
  const barColor = veryLow ? "var(--accent)" : low ? "#b8860b" : "var(--ink)";

  return (
    <div className="border rule" style={shellStyle}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="kicker">Claude API Credits</span>
        <span
          className="headline"
          style={{ fontWeight: 700, fontSize: 18, color: veryLow ? "var(--accent)" : "var(--ink)" }}
        >
          {fmt(remaining, currency)} left
        </span>
        <span className="meta">
          of {fmt(budget, currency)} · {fmt(spent, currency)} spent this month
        </span>
      </div>
      <div
        style={{
          marginTop: 6,
          height: 4,
          width: "100%",
          background: "var(--rule)",
          borderRadius: 2,
          overflow: "hidden",
        }}
        aria-label={`${pctUsed.toFixed(0)}% of monthly budget used`}
      >
        <div
          style={{
            width: `${pctUsed}%`,
            height: "100%",
            background: barColor,
            transition: "width 400ms ease",
          }}
        />
      </div>
    </div>
  );
}

const shellStyle: React.CSSProperties = {
  borderWidth: 1,
  borderStyle: "solid",
  borderRadius: 4,
  padding: "10px 14px",
  display: "flex",
  flexDirection: "column",
  gap: 4,
  background: "var(--paper-soft)",
};
