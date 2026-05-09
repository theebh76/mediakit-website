export type Source = {
  id: string;
  name: string;
  url: string;
  feed: string;
  category: "security" | "tech" | "ai";
  // 1-10. Weights ranking. Based on editorial track record, depth, originality.
  reputation: number;
};

export const SOURCES: Source[] = [
  { id: "krebs", name: "Krebs on Security", url: "https://krebsonsecurity.com", feed: "https://krebsonsecurity.com/feed/", category: "security", reputation: 10 },
  { id: "schneier", name: "Schneier on Security", url: "https://www.schneier.com", feed: "https://www.schneier.com/feed/atom/", category: "security", reputation: 10 },
  { id: "register", name: "The Register", url: "https://www.theregister.com", feed: "https://www.theregister.com/headlines.atom", category: "tech", reputation: 9 },
  { id: "bleeping", name: "BleepingComputer", url: "https://www.bleepingcomputer.com", feed: "https://www.bleepingcomputer.com/feed/", category: "security", reputation: 9 },
  { id: "ars", name: "Ars Technica", url: "https://arstechnica.com", feed: "https://feeds.arstechnica.com/arstechnica/index", category: "tech", reputation: 9 },
  { id: "darkreading", name: "Dark Reading", url: "https://www.darkreading.com", feed: "https://www.darkreading.com/rss.xml", category: "security", reputation: 8 },
  { id: "securityweek", name: "SecurityWeek", url: "https://www.securityweek.com", feed: "https://www.securityweek.com/feed/", category: "security", reputation: 8 },
  { id: "thn", name: "The Hacker News", url: "https://thehackernews.com", feed: "https://feeds.feedburner.com/TheHackersNews", category: "security", reputation: 7 },
  { id: "wired", name: "WIRED Security", url: "https://www.wired.com/category/security/", feed: "https://www.wired.com/feed/category/security/latest/rss", category: "security", reputation: 8 },
  { id: "verge", name: "The Verge", url: "https://www.theverge.com", feed: "https://www.theverge.com/rss/index.xml", category: "tech", reputation: 7 },
  { id: "techcrunch", name: "TechCrunch", url: "https://techcrunch.com", feed: "https://techcrunch.com/feed/", category: "tech", reputation: 7 },
  { id: "cisa", name: "CISA Advisories", url: "https://www.cisa.gov", feed: "https://www.cisa.gov/cybersecurity-advisories/all.xml", category: "security", reputation: 10 },

  // AI — applied AI for business, technology, and engineering
  { id: "mittr", name: "MIT Technology Review", url: "https://www.technologyreview.com", feed: "https://www.technologyreview.com/feed/", category: "ai", reputation: 9 },
  { id: "hbr", name: "Harvard Business Review", url: "https://hbr.org", feed: "https://hbr.org/the-latest/feed", category: "ai", reputation: 9 },
  { id: "a16z", name: "Andreessen Horowitz", url: "https://a16z.com", feed: "https://a16z.com/feed/", category: "ai", reputation: 8 },
  { id: "stratechery", name: "Stratechery", url: "https://stratechery.com", feed: "https://stratechery.com/feed/", category: "ai", reputation: 9 },
  { id: "simonw", name: "Simon Willison's Weblog", url: "https://simonwillison.net", feed: "https://simonwillison.net/atom/everything/", category: "ai", reputation: 9 },
  { id: "latent", name: "Latent Space", url: "https://www.latent.space", feed: "https://www.latent.space/feed", category: "ai", reputation: 8 },
  { id: "anthropic", name: "Anthropic News", url: "https://www.anthropic.com/news", feed: "https://www.anthropic.com/news/rss.xml", category: "ai", reputation: 9 },
  { id: "openai", name: "OpenAI", url: "https://openai.com/news/", feed: "https://openai.com/news/rss.xml", category: "ai", reputation: 8 },
  { id: "googleai", name: "Google Research Blog", url: "https://research.google/blog/", feed: "https://research.google/blog/rss/", category: "ai", reputation: 8 },
  { id: "huggingface", name: "Hugging Face Blog", url: "https://huggingface.co/blog", feed: "https://huggingface.co/blog/feed.xml", category: "ai", reputation: 7 },
  { id: "vbai", name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/", feed: "https://venturebeat.com/category/ai/feed/", category: "ai", reputation: 7 },
];

// Keywords used to *promote* AI-relevant articles from non-AI sources into
// the AI section. Tuned for applied AI in business/tech: client research,
// value proposition, operational efficiency, and AI-assisted/vibe coding.
export const AI_KEYWORDS: { pattern: RegExp; weight: number }[] = [
  { pattern: /\b(generative ai|genai|llm|large language model|foundation model|frontier model|gpt-?\d|claude|gemini|mistral|llama)\b/i, weight: 1.0 },
  { pattern: /\b(ai agent|agentic|autonomous agent|multi[- ]agent|tool use|copilot|assistant)\b/i, weight: 0.9 },
  { pattern: /\b(rag|retrieval[- ]augmented|vector (db|database|store)|embeddings?|fine[- ]tun(e|ing)|prompt engineering)\b/i, weight: 0.7 },
  { pattern: /\b(vibe cod(e|ing)|ai[- ]assisted (coding|development)|cursor|windsurf|claude code|github copilot|codegen)\b/i, weight: 1.0 },
  { pattern: /\b(productivity|operational efficiency|automation|workflow|back[- ]office|cost reduction|roi|deploy(ed|ing)?)\b.*\b(ai|llm|model)\b/i, weight: 0.6 },
  { pattern: /\b(ai|llm).*\b(productivity|efficiency|automation|workflow|back[- ]office|cost|roi|enterprise|business case|customer|client|sales|marketing|research)\b/i, weight: 0.6 },
  { pattern: /\b(value proposition|go[- ]to[- ]market|customer research|market research|product[- ]market fit)\b/i, weight: 0.5 },
];
