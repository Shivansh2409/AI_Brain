// app/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { authFetch, UnauthorizedError } from "./lib/api";
import { useRouter } from "next/navigation";
import ProtectedLayout from "./components/ProtectedLayout";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import CategoryFilter from "./components/CategoryFilter";
import ItemGrid from "./components/ItemGrid";
import LinkingModal from "./components/LinkingModal";
import KnowledgeGraph from "./components/KnowledgeGraph";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState<string | null>(null); // query the results are for
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "graph">("grid");
  const [activeCategory, setActiveCategory] = useState("all");
  const [linkingSource, setLinkingSource] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // Every feed/search request gets an id; only the newest one may update the
  // page, so a slow older response can't overwrite newer results.
  const latestRequest = useRef(0);

  // Load the user's name/email for the header (ProtectedLayout handles redirects)
  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) setUser(JSON.parse(userData));
    } catch {
      localStorage.removeItem("user"); // corrupted value; header just hides
    }
  }, []);

  const loadItems = useCallback(
    async (
      path: string,
      pickList: (body: any) => unknown,
      searchLabel: string | null,
    ) => {
      const requestId = ++latestRequest.current;
      const isCurrent = () => requestId === latestRequest.current;
      setError(null);
      setIsLoading(true);

      try {
        const res = await authFetch(path);
        const body = await res.json().catch(() => null);
        if (!isCurrent()) return;

        if (!res.ok) {
          setItems([]);
          setError(body?.error || `Request failed (${res.status})`);
          return;
        }
        const list = pickList(body);
        setItems(Array.isArray(list) ? list : []);
        setActiveSearch(searchLabel);
      } catch (err) {
        if (!isCurrent()) return;
        if (err instanceof UnauthorizedError) {
          router.replace("/auth/login");
          return;
        }
        console.error("Request failed:", err);
        setItems([]);
        setError("Couldn't reach the server. Check that it's running.");
      } finally {
        if (isCurrent()) {
          setIsLoading(false);
          setIsSearching(false);
        }
      }
    },
    [router],
  );

  const fetchFeed = useCallback(
    (category: string) =>
      loadItems(
        `/api/feed?type=${encodeURIComponent(category)}`,
        (b: any) => b,
        null,
      ),
    [loadItems],
  );

  // Fetch data whenever the active category changes
  // (switchCategory clears the search, so the feed is always what's wanted)
  useEffect(() => {
    fetchFeed(activeCategory);
  }, [activeCategory, fetchFeed]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      fetchFeed(activeCategory);
      return;
    }

    setIsSearching(true);
    await loadItems(
      `/api/search?q=${encodeURIComponent(query)}`,
      (b: any) => b?.data,
      query,
    );
  };

  const clearSearch = () => {
    setSearchQuery("");
    fetchFeed(activeCategory);
  };

  const switchCategory = (category: string) => {
    setSearchQuery("");
    setIsSearching(false);
    if (category === activeCategory) fetchFeed(category);
    setActiveCategory(category);
  };

  const firstName = user?.name?.split(" ")[0];

  return (
    <ProtectedLayout>
      <div className="relative min-h-screen overflow-x-clip">
        {/* dotted grid, fading out towards the bottom */}
        <div
          aria-hidden
          className="bg-dots pointer-events-none absolute inset-x-0 top-0 h-[900px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />

        <Header
          user={user}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {viewMode === "grid" ? (
          <main className="relative">
            {/* Hero */}
            <section className="relative px-4 pt-16 pb-20 sm:px-6 sm:pt-20">
              <div className="relative z-10 text-center">
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/3 px-3 py-1 text-xs text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_#e879f9]" />
                  {greeting()}
                  {firstName ? `, ${firstName}` : ""}
                </p>
                <h1 className="text-gradient mx-auto max-w-3xl text-4xl leading-[1.08] font-semibold tracking-tight sm:text-6xl">
                  Everything you&apos;ve saved,
                  <br />
                  one search away.
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-[15px] text-zinc-400">
                  Search your articles, videos, PDFs and images by what they
                  mean, not just the words in them.
                </p>
              </div>

              <div className="relative z-10 mt-10">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSubmit={handleSearch}
                  isSearching={isSearching}
                  footer={
                    <CategoryFilter
                      activeCategory={activeCategory}
                      onCategoryChange={switchCategory}
                    />
                  }
                />
              </div>
            </section>

            {/* Library: sits on the glowing horizon */}
            <section className="relative px-4 pt-28 pb-24 sm:px-6">
              {/* Clip box: starts above the section so the glow shows, ends at
                  the section bottom so the huge circle doesn't add scroll height */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-48 bottom-0 overflow-hidden"
              >
                <div className="horizon absolute top-48 left-1/2 h-[6000px] w-[6000px] -translate-x-1/2" />
              </div>

              <div className="relative mx-auto max-w-7xl">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-white">
                      {activeSearch ? "Search results" : "Your library"}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {isLoading
                        ? "Loading…"
                        : activeSearch
                          ? `${items.length} best matches for “${activeSearch}”`
                          : `${items.length} ${items.length === 1 ? "item" : "items"}`}
                    </p>
                  </div>
                  {activeSearch && (
                    <button
                      onClick={clearSearch}
                      className="rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-[13px] text-zinc-300 transition hover:bg-white/8 hover:text-white"
                    >
                      Clear search
                    </button>
                  )}
                </div>

                {error ? (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
                  >
                    {error}
                  </div>
                ) : (
                  <ItemGrid
                    items={items}
                    isLoading={isLoading}
                    isSearchResult={!!activeSearch}
                    onItemLink={setLinkingSource}
                  />
                )}
              </div>
            </section>
          </main>
        ) : (
          <main className="relative mx-auto max-w-[1600px] px-4 pt-4 pb-6 sm:px-6">
            {error ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
              >
                {error}
              </div>
            ) : (
              <KnowledgeGraph items={items} onItemLink={setLinkingSource} />
            )}
          </main>
        )}

        {/* Linking Modal */}
        {linkingSource && (
          <LinkingModal
            sourceItem={linkingSource}
            allItems={items}
            onClose={() => setLinkingSource(null)}
            onRefresh={() => fetchFeed(activeCategory)}
          />
        )}
      </div>
    </ProtectedLayout>
  );
}
