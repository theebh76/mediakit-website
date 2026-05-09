import { XMLParser } from "fast-xml-parser";
import { SOURCES, type Source } from "./sources";

export type Article = {
  id: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: number;
  source: Source;
  score: number;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "_text",
});

function stripHtml(s: string): string {
  if (!s) return "";
  return s
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function pickText(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null) {
    const o = v as Record<string, unknown>;
    if (typeof o._text === "string") return o._text;
    if (typeof o["#text"] === "string") return o["#text"] as string;
  }
  return "";
}

function pickLink(entry: Record<string, unknown>): string {
  const link = entry.link;
  if (typeof link === "string") return link;
  if (Array.isArray(link)) {
    const alt = link.find((l) => {
      const o = l as Record<string, unknown>;
      return o["@_rel"] === "alternate" || !o["@_rel"];
    });
    const o = (alt ?? link[0]) as Record<string, unknown>;
    return (o?.["@_href"] as string) || pickText(o) || "";
  }
  if (link && typeof link === "object") {
    const o = link as Record<string, unknown>;
    return (o["@_href"] as string) || pickText(o) || "";
  }
  return "";
}

async function fetchFeed(source: Source): Promise<Article[]> {
  try {
    const res = await fetch(source.feed, {
      headers: { "User-Agent": "MediakitNewsBot/1.0 (+aggregator)" },
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const doc = parser.parse(xml);
    const channel = doc?.rss?.channel ?? doc?.feed ?? doc?.["rdf:RDF"]?.channel;
    if (!channel && !doc?.feed) return [];

    const items: Record<string, unknown>[] = (() => {
      if (doc?.feed?.entry) {
        return Array.isArray(doc.feed.entry) ? doc.feed.entry : [doc.feed.entry];
      }
      if (channel?.item) {
        return Array.isArray(channel.item) ? channel.item : [channel.item];
      }
      if (doc?.["rdf:RDF"]?.item) {
        const it = doc["rdf:RDF"].item;
        return Array.isArray(it) ? it : [it];
      }
      return [];
    })();

    const now = Date.now();
    return items
      .map((it) => {
        const title = stripHtml(pickText(it.title));
        const link = pickLink(it);
        const dateStr =
          pickText(it.pubDate) ||
          pickText(it.published) ||
          pickText(it.updated) ||
          pickText(it["dc:date"]);
        const ts = dateStr ? Date.parse(dateStr) : now;
        const desc = stripHtml(
          pickText(it.description) ||
            pickText(it.summary) ||
            pickText(it.content) ||
            pickText(it["content:encoded"])
        );
        return {
          id: link || `${source.id}-${title}`,
          title,
          link,
          summary: desc.slice(0, 320),
          publishedAt: isNaN(ts) ? now : ts,
          source,
          score: 0,
        } satisfies Article;
      })
      .filter((a) => a.title && a.link);
  } catch {
    return [];
  }
}

function scoreArticle(a: Article): number {
  const ageHours = Math.max(1, (Date.now() - a.publishedAt) / 36e5);
  // Half-life ~ 36 hours
  const recency = 1 / (1 + ageHours / 36);
  const rep = a.source.reputation / 10;
  // Heuristic boosts: depth (long titles), specific keywords often signal substantive reporting
  const t = a.title.toLowerCase();
  const sig = a.summary.length;
  const depth = Math.min(1, sig / 280);
  let kw = 0;
  if (/(zero[- ]day|cve-|vulnerab|exploit|breach|ransomware|malware|advisory|patch)/i.test(t)) kw += 0.15;
  if (/(analysis|investigation|deep dive|how|why)/i.test(t)) kw += 0.1;
  if (/(rumor|leak|exclusive)/i.test(t)) kw -= 0.05;
  return recency * 0.55 + rep * 0.3 + depth * 0.1 + kw;
}

export async function getArticles(): Promise<Article[]> {
  const all = await Promise.all(SOURCES.map(fetchFeed));
  const flat = all.flat();
  // Dedupe by link
  const seen = new Set<string>();
  const unique = flat.filter((a) => {
    const key = a.link.split("?")[0];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  for (const a of unique) a.score = scoreArticle(a);
  unique.sort((a, b) => b.score - a.score);
  return unique;
}

export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
