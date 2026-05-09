import Link from "next/link";
import { extractArticle } from "@/lib/extract";
import { SOURCES } from "@/lib/sources";
import { MarkReadOnLoad } from "@/components/MarkReadOnLoad";

export const revalidate = 3600;

type SearchParams = Promise<{ u?: string | string[] }>;

function originLabel(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const known = SOURCES.find((s) => {
      try {
        return new URL(s.url).hostname.replace(/^www\./, "") === host;
      } catch {
        return false;
      }
    });
    return known?.name ?? host;
  } catch {
    return url;
  }
}

function fmtDate(s: string | null): string | null {
  if (!s) return null;
  const t = Date.parse(s);
  if (isNaN(t)) return null;
  return new Date(t).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const u = typeof sp.u === "string" ? sp.u : Array.isArray(sp.u) ? sp.u[0] : undefined;
  if (!u) return { title: "Read · Mediakit" };
  const article = await extractArticle(u);
  const title = article.ok ? article.title : "Article · Mediakit";
  return {
    title: `${title} · Mediakit`,
    description: article.ok ? article.excerpt ?? undefined : undefined,
  };
}

export default async function ReadPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const u = typeof sp.u === "string" ? sp.u : Array.isArray(sp.u) ? sp.u[0] : undefined;

  if (!u) {
    return (
      <Shell>
        <p className="meta">No article specified.</p>
        <Link href="/" target="_self" className="hover:text-accent underline">
          Back to Mediakit
        </Link>
      </Shell>
    );
  }

  const result = await extractArticle(u);
  const source = originLabel(u);

  if (!result.ok) {
    return (
      <Shell>
        <article className="reader">
          <p className="kicker">Reader view unavailable</p>
          <h1 className="headline text-3xl md:text-4xl font-bold mt-2 mb-4">
            We couldn&rsquo;t render this article in Mediakit&rsquo;s reader
          </h1>
          <p className="summary text-base md:text-lg mb-3">
            Some publishers block automated reader views, require a
            subscription, or use layouts our extractor doesn&rsquo;t recognise.
          </p>
          <p className="meta mb-6">
            <span style={{ fontStyle: "italic" }}>Source said:</span> {result.reason}
          </p>
          <p>
            <a
              href={u}
              target="_blank"
              rel="noopener noreferrer"
              className="kicker"
              style={{ fontSize: 13 }}
            >
              ↗ Open the original on {source}
            </a>
          </p>
        </article>
      </Shell>
    );
  }

  const date = fmtDate(result.publishedTime);

  return (
    <Shell>
      <MarkReadOnLoad link={u} />
      <article className="reader">
        <div className="flex items-center gap-2 mb-3">
          <span className="kicker">{source}</span>
          {date && (
            <>
              <span className="meta">·</span>
              <span className="meta">{date}</span>
            </>
          )}
          {result.byline && (
            <>
              <span className="meta">·</span>
              <span className="meta">{result.byline}</span>
            </>
          )}
        </div>
        <h1 className="headline text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
          {result.title}
        </h1>
        {result.excerpt && (
          <p className="summary text-base md:text-lg max-w-3xl mb-6">
            {result.excerpt}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 mb-8 pb-4 border-b rule">
          <a
            href={u}
            target="_blank"
            rel="noopener noreferrer"
            className="kicker"
            style={{
              fontSize: 12,
              padding: "6px 10px",
              border: "1px solid var(--rule)",
              borderRadius: 3,
              background: "var(--paper-soft)",
            }}
          >
            ↗ Read original on {source}
          </a>
          <span className="meta">
            Reader view · ~{Math.max(1, Math.round(result.length / 1000))} min read
          </span>
        </div>

        <div
          className="reader-body"
          dangerouslySetInnerHTML={{ __html: result.contentHtml }}
        />

        <div className="mt-10 pt-6 border-t rule">
          <p className="meta mb-2">
            Mediakit shows a simplified reader view for legibility. Copyright
            and full editorial context belong to the original publisher.
          </p>
          <a
            href={u}
            target="_blank"
            rel="noopener noreferrer"
            className="kicker"
          >
            ↗ Read original on {source}
          </a>
        </div>
      </article>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b rule">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between py-3 meta">
            <Link href="/" target="_self" className="hover:text-accent">
              ← Mediakit
            </Link>
            <span className="hidden sm:inline">Reader view</span>
          </div>
          <div className="text-center py-3 md:py-4">
            <Link href="/" target="_self" className="masthead-title text-3xl md:text-4xl">
              Mediakit
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {children}
      </main>
      <footer className="border-t-2 border-ink mt-16">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 meta flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <Link href="/" target="_self" className="hover:text-accent">
            ← All stories
          </Link>
          <span>© {new Date().getFullYear()} Mediakit</span>
        </div>
      </footer>
    </div>
  );
}
