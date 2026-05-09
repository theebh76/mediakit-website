import { getArticles, rankAiArticles } from "@/lib/feed";
import { ArticleCard } from "@/components/ArticleCard";
import { ReadControls } from "@/components/ReadControls";

export const revalidate = 600;

export default async function Home() {
  const articles = await getArticles();
  const lead = articles[0];
  const sub = articles.slice(1, 5);
  const security = articles.filter((a) => a.source.category === "security").slice(0, 8);
  const tech = articles.filter((a) => a.source.category === "tech").slice(0, 8);
  const ai = rankAiArticles(articles).slice(0, 9);
  const rest = articles.slice(5, 30);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen">
      <header className="border-b rule">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between py-3 meta gap-3">
            <span>{today}</span>
            <div className="flex items-center gap-4">
              <ReadControls />
              <span className="hidden sm:inline">Tech &amp; Cybersecurity, ranked by reputation</span>
            </div>
          </div>
          <div className="text-center py-4 md:py-6">
            <h1 className="masthead-title text-4xl md:text-6xl">Mediakit</h1>
            <p className="meta mt-1 italic">Substantive technology and cybersecurity reporting</p>
          </div>
          <nav className="flex items-center justify-center gap-6 py-3 text-sm border-t rule overflow-x-auto whitespace-nowrap">
            <a href="#top" target="_self" className="hover:text-accent">Top Stories</a>
            <a href="#security" target="_self" className="hover:text-accent">Cybersecurity</a>
            <a href="#tech" target="_self" className="hover:text-accent">Technology</a>
            <a href="#ai" target="_self" className="hover:text-accent">Applied AI</a>
            <a href="#latest" target="_self" className="hover:text-accent">Latest</a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {!lead && <p className="meta">Loading the latest reporting…</p>}
        <section id="top" className="grid md:grid-cols-3 gap-6 md:gap-10">
          <div className="md:col-span-2">
            {lead && <ArticleCard a={lead} variant="lead" />}
            <div className="grid sm:grid-cols-2 gap-x-8">
              {sub.slice(0, 2).map((a) => (
                <ArticleCard key={a.id} a={a} variant="big" />
              ))}
            </div>
          </div>
          <aside className="md:border-l md:pl-8 rule">
            <h3 className="kicker mb-3">The Briefing</h3>
            {sub.slice(2).map((a) => (
              <ArticleCard key={a.id} a={a} />
            ))}
          </aside>
        </section>

        <section id="security" className="mt-12">
          <div className="flex items-baseline justify-between mb-4 border-b-2 border-ink pb-2">
            <h2 className="masthead-title text-2xl md:text-3xl">Cybersecurity</h2>
            <span className="meta hidden sm:inline">Highest-reputation sources first</span>
          </div>
          <div className="grid md:grid-cols-2 gap-x-10">
            {security.map((a) => (
              <ArticleCard key={a.id} a={a} />
            ))}
          </div>
        </section>

        <section id="tech" className="mt-12">
          <div className="flex items-baseline justify-between mb-4 border-b-2 border-ink pb-2">
            <h2 className="masthead-title text-2xl md:text-3xl">Technology</h2>
            <span className="meta hidden sm:inline">Depth and clarity, weighted</span>
          </div>
          <div className="grid md:grid-cols-2 gap-x-10">
            {tech.map((a) => (
              <ArticleCard key={a.id} a={a} />
            ))}
          </div>
        </section>

        <section id="ai" className="mt-12">
          <div className="flex items-baseline justify-between mb-2 border-b-2 border-ink pb-2">
            <h2 className="masthead-title text-2xl md:text-3xl">Applied AI</h2>
            <span className="meta hidden sm:inline">For business and engineering</span>
          </div>
          <p className="summary text-sm md:text-base mb-4 max-w-3xl">
            Curated stories on how teams are putting AI to work — client and
            market research, value proposition, operational efficiency, and
            AI-assisted (&ldquo;vibe&rdquo;) coding.
          </p>
          {ai.length === 0 ? (
            <p className="meta">No qualifying AI stories at the moment — check back shortly.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-x-8">
              {ai.map((a) => (
                <ArticleCard key={a.id} a={a} />
              ))}
            </div>
          )}
        </section>

        <section id="latest" className="mt-12">
          <div className="mb-4 border-b-2 border-ink pb-2">
            <h2 className="masthead-title text-2xl md:text-3xl">More to read</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-x-8">
            {rest.map((a) => (
              <ArticleCard key={a.id} a={a} />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-ink mt-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 grid md:grid-cols-2 gap-6 meta">
          <div>
            <div className="masthead-title text-2xl">Mediakit</div>
            <p className="mt-2 max-w-md">
              Mediakit aggregates publicly available headlines from leading
              technology and cybersecurity publications. Articles are ranked by
              source reputation, recency, and editorial depth. Copyright belongs
              to the original publishers — click any headline to read on the
              source. Read articles are remembered on this device only.
            </p>
          </div>
          <div>
            <div className="font-semibold text-ink mb-1">Sources</div>
            <p>
              Krebs on Security · Schneier on Security · The Register ·
              BleepingComputer · Ars Technica · Dark Reading · SecurityWeek ·
              The Hacker News · WIRED · The Verge · TechCrunch · CISA · MIT
              Technology Review · Harvard Business Review · Stratechery · a16z ·
              Simon Willison · Latent Space · Anthropic · OpenAI · Google
              Research · Hugging Face · VentureBeat AI
            </p>
          </div>
        </div>
        <div className="border-t rule">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 meta flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Mediakit</span>
            <span>Updated every 10 minutes</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
