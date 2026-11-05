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

export default function Dashboard() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
    async (path: string, pickList: (body: any) => unknown) => {
      const requestId = ++latestRequest.current;
      const isCurrent = () => requestId === latestRequest.current;
      setError(null);

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
        if (isCurrent()) setIsSearching(false);
      }
    },
    [router],
  );

  const fetchFeed = useCallback(
    (category: string) =>
      loadItems(
        `/api/feed?type=${encodeURIComponent(category)}`,
        (b: any) => b,
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
    );
  };

  const switchCategory = (category: string) => {
    setSearchQuery("");
    setIsSearching(false);
    setActiveCategory(category);
  };

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <Header
          user={user}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleSearch}
            isSearching={isSearching}
          />

          {/* Category Filter */}
          <CategoryFilter
            activeCategory={activeCategory}
            onCategoryChange={switchCategory}
          />

          {/* Content Area */}
          <div className="mt-10">
            {error ? (
              <div
                role="alert"
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
              >
                {error}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ItemGrid
                  items={items}
                  isSearching={isSearching}
                  onItemLink={setLinkingSource}
                />
              </div>
            ) : (
              <div className="h-[600px] w-full bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                <KnowledgeGraph items={items} />
              </div>
            )}
          </div>
        </div>

        {/* Linking Modal */}
        {linkingSource && (
          <LinkingModal
            sourceItem={linkingSource}
            allItems={items}
            activeCategory={activeCategory}
            onClose={() => setLinkingSource(null)}
            onRefresh={() => fetchFeed(activeCategory)}
          />
        )}
      </div>
    </ProtectedLayout>
  );
}
