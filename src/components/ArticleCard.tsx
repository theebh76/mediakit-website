"use client";

import { useState } from "react";
import type { Article } from "@/lib/feed";
import { timeAgo } from "@/lib/feed";
import { useReadTracker } from "./useReadTracker";

type Variant = "lead" | "big" | "small";

export function ArticleCard({ a, variant = "small" }: { a: Article; variant?: Variant }) {
  const { isRead, markRead, hydrated } = useReadTracker();
  const [hover, setHover] = useState(false);
  const read = hydrated && isRead(a.link);

  // While we haven't hydrated from localStorage yet, render in the
  // "unread" state to match the server output and avoid layout flash.
  const dim = read && !hover;

  return (
    <article
      className={`border-b rule ${variant === "lead" ? "pb-6 md:pb-8" : "py-5"} transition-opacity`}
      style={{ opacity: dim ? 0.45 : 1 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="kicker">{categoryLabel(a.source.category)}</span>
        <span className="meta">·</span>
        <span className="meta">{a.source.name}</span>
        {read && (
          <>
            <span className="meta">·</span>
            <span className="meta" style={{ fontStyle: "italic" }}>read</span>
          </>
        )}
      </div>
      <Heading variant={variant}>
        <a
          href={`/read?u=${encodeURIComponent(a.link)}`}
          target="_self"
          onClick={() => markRead(a.link)}
          onAuxClick={() => markRead(a.link)}
          onContextMenu={() => markRead(a.link)}
          style={{ color: read ? "#6b6660" : undefined }}
        >
          {a.title}
        </a>
      </Heading>
      {a.summary && (variant === "lead" || variant === "big") && (
        <p
          className={`summary mb-2 ${variant === "lead" ? "text-base md:text-lg max-w-3xl" : "text-base line-clamp-3"}`}
          style={{ color: read ? "#807a73" : undefined }}
        >
          {a.summary}
        </p>
      )}
      {a.summary && variant === "small" && (
        <p
          className="summary text-sm mb-2 line-clamp-2"
          style={{ color: read ? "#807a73" : undefined }}
        >
          {a.summary}
        </p>
      )}
      <div className="meta flex items-center gap-2">
        <span>{timeAgo(a.publishedAt)}</span>
        <span>·</span>
        <span>{variant === "lead" ? `Reputation ${a.source.reputation}/10` : `Rep ${a.source.reputation}/10`}</span>
        {read && (
          <>
            <span>·</span>
            <button
              onClick={(e) => {
                e.preventDefault();
                markRead(a.link, false);
              }}
              className="hover:text-accent underline"
              style={{ background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit", color: "inherit" }}
            >
              mark unread
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function categoryLabel(c: Article["source"]["category"]): string {
  if (c === "security") return "Cybersecurity";
  if (c === "ai") return "AI";
  return "Technology";
}

function Heading({ variant, children }: { variant: Variant; children: React.ReactNode }) {
  if (variant === "lead") {
    return (
      <h1 className="headline text-3xl sm:text-4xl md:text-5xl font-bold mb-3">{children}</h1>
    );
  }
  if (variant === "big") {
    return <h2 className="headline font-bold mb-2 text-2xl md:text-3xl">{children}</h2>;
  }
  return <h2 className="headline font-bold mb-2 text-lg md:text-xl">{children}</h2>;
}
