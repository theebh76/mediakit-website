"use client";

import Link from "next/link";

export default function ReadError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen">
      <header className="border-b rule">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between py-3 meta">
            <Link href="/" target="_self" className="hover:text-accent">← Mediakit</Link>
            <span className="hidden sm:inline">Reader view</span>
          </div>
          <div className="text-center py-3 md:py-4">
            <Link href="/" target="_self" className="masthead-title text-3xl md:text-4xl">Mediakit</Link>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <article className="reader">
          <p className="kicker">Reader view unavailable</p>
          <h1 className="headline text-3xl md:text-4xl font-bold mt-2 mb-4">
            Something went wrong rendering this article
          </h1>
          <p className="summary text-base md:text-lg mb-6">
            Try again, or open the original on the publisher&rsquo;s site.
          </p>
          <button
            onClick={() => reset()}
            className="kicker"
            style={{
              fontSize: 12,
              padding: "6px 10px",
              border: "1px solid var(--rule)",
              borderRadius: 3,
              background: "var(--paper-soft)",
              cursor: "pointer",
            }}
          >
            ↻ Try again
          </button>
        </article>
      </main>
    </div>
  );
}
