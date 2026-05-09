export type Source = {
  id: string;
  name: string;
  url: string;
  feed: string;
  category: "security" | "tech";
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
];
