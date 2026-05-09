"use client";

import { useReadTracker } from "./useReadTracker";

export function ReadControls() {
  const { count, clearAll, hydrated } = useReadTracker();
  if (!hydrated || count === 0) return null;
  return (
    <button
      onClick={clearAll}
      className="meta hover:text-accent underline"
      style={{ background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" }}
      title="Clear your read history (stored on this device only)"
    >
      Reset {count} read · clear
    </button>
  );
}
