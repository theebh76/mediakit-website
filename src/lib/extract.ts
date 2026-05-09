import { parseHTML } from "linkedom";
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

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function injectBaseTag(html: string, url: string): string {
  const base = `<base href="${escapeAttr(url)}">`;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${base}`);
  }
  return `<!doctype html><html><head>${base}</head><body>${html}</body></html>`;
}

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

  try {
    const { document } = parseHTML(injectBaseTag(html, url));
    document
      .querySelectorAll("script, style, noscript, iframe, link[rel=preload]")
      .forEach((n: Element) => n.remove());

    // Readability typings expect a real Document; linkedom's is API-compatible
    // for the methods Readability uses, so cast through unknown.
    const reader = new Readability(document as unknown as Document, {
      keepClasses: false,
      charThreshold: 250,
    });
    const article = reader.parse();

    if (!article || !article.content) {
      return { ok: false, reason: "No readable content found", url };
    }

    const cleanedHtml = sanitizeContentHtml(article.content);

    return {
      ok: true,
      title: article.title || document.title || "Untitled",
      byline: article.byline || null,
      siteName: article.siteName || null,
      excerpt: article.excerpt || null,
      contentHtml: cleanedHtml,
      textContent: article.textContent || "",
      length: article.length || 0,
      publishedTime: article.publishedTime || null,
      url,
    };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? `Parser: ${e.message}` : "Reader extraction failed",
      url,
    };
  }
}

function sanitizeContentHtml(html: string): string {
  try {
    const { document } = parseHTML(`<!doctype html><html><body><div id="root">${html}</div></body></html>`);
    const root = document.getElementById("root");
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
          while (child.firstChild) {
            node.insertBefore(child.firstChild, child);
          }
          child.remove();
          continue;
        }
        const allow = allowedAttrs[tag] ?? new Set<string>();
        for (const attr of Array.from(child.attributes)) {
          if (!allow.has(attr.name)) child.removeAttribute(attr.name);
        }
        if (tag === "a") {
          const href = child.getAttribute("href") || "";
          if (!/^https?:\/\//i.test(href) && !href.startsWith("#")) {
            child.removeAttribute("href");
          } else {
            child.setAttribute("target", "_blank");
            child.setAttribute("rel", "noopener noreferrer");
          }
        }
        if (tag === "img") {
          child.setAttribute("loading", "lazy");
        }
        walk(child);
      }
    };
    walk(root as unknown as Element);

    return root.innerHTML;
  } catch {
    // If sanitization itself fails, return empty content to avoid leaking
    // unsanitised HTML into the page.
    return "";
  }
}
