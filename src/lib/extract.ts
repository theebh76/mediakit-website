import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export type Extracted =
  | {
      ok: true;
      title: string;
      byline: string | null;
      siteName: string | null;
      excerpt: string | null;
      contentHtml: string;
      textContent: string;
      length: number;
      publishedTime: string | null;
      url: string;
    }
  | {
      ok: false;
      reason: string;
      url: string;
    };

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 Mediakit-Reader/1.0";

export async function extractArticle(url: string): Promise<Extracted> {
  if (!/^https?:\/\//i.test(url)) {
    return { ok: false, reason: "Invalid URL", url };
  }

  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return { ok: false, reason: `Source returned HTTP ${res.status}`, url };
    }
    html = await res.text();
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : "Failed to fetch source",
      url,
    };
  }

  let dom: JSDOM;
  try {
    dom = new JSDOM(html, { url });
  } catch {
    return { ok: false, reason: "Could not parse source HTML", url };
  }

  const doc = dom.window.document;
  // Strip script/style/iframe up front — Readability does this too, but
  // some pages have noisy nav that confuses scoring.
  doc
    .querySelectorAll("script, style, noscript, iframe, link[rel=preload]")
    .forEach((n) => n.remove());

  let article: ReturnType<Readability["parse"]> | null = null;
  try {
    article = new Readability(doc, {
      keepClasses: false,
      charThreshold: 250,
    }).parse();
  } catch {
    return { ok: false, reason: "Reader extraction failed", url };
  }

  if (!article || !article.content) {
    return { ok: false, reason: "No readable content found", url };
  }

  const cleanedHtml = sanitizeContentHtml(article.content);

  return {
    ok: true,
    title: article.title || doc.title || "Untitled",
    byline: article.byline || null,
    siteName: article.siteName || null,
    excerpt: article.excerpt || null,
    contentHtml: cleanedHtml,
    textContent: article.textContent || "",
    length: article.length || 0,
    publishedTime: article.publishedTime || null,
    url,
  };
}

// Conservative allowlist sanitizer. Readability already strips the worst
// stuff; this is belt-and-braces.
function sanitizeContentHtml(html: string): string {
  const dom = new JSDOM(`<div id="root">${html}</div>`);
  const doc = dom.window.document;
  const root = doc.getElementById("root");
  if (!root) return "";

  const allowedTags = new Set([
    "p", "br", "hr", "strong", "em", "b", "i", "u", "s", "small", "sup", "sub",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "a", "img", "figure", "figcaption", "picture", "source",
    "table", "thead", "tbody", "tr", "td", "th",
    "div", "span",
  ]);
  const allowedAttrs: Record<string, Set<string>> = {
    a: new Set(["href", "title"]),
    img: new Set(["src", "srcset", "alt", "width", "height", "loading"]),
    source: new Set(["src", "srcset", "type", "media"]),
  };

  const walk = (node: Element) => {
    const children = Array.from(node.children);
    for (const child of children) {
      const tag = child.tagName.toLowerCase();
      if (!allowedTags.has(tag)) {
        // Replace disallowed elements with their inner content.
        const frag = doc.createDocumentFragment();
        while (child.firstChild) frag.appendChild(child.firstChild);
        child.replaceWith(frag);
        continue;
      }
      // Drop disallowed attributes
      const allow = allowedAttrs[tag] ?? new Set<string>();
      for (const attr of Array.from(child.attributes)) {
        if (!allow.has(attr.name)) child.removeAttribute(attr.name);
      }
      // Force safe link behaviour
      if (tag === "a") {
        const href = child.getAttribute("href") || "";
        if (!/^https?:\/\//i.test(href) && !href.startsWith("#")) {
          child.removeAttribute("href");
        } else {
          child.setAttribute("target", "_blank");
          child.setAttribute("rel", "noopener noreferrer");
        }
      }
      // Lazy-load images and constrain
      if (tag === "img") {
        child.setAttribute("loading", "lazy");
      }
      walk(child);
    }
  };
  walk(root);

  return root.innerHTML;
}
