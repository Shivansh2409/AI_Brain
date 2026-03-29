// app/page.tsx
"use client";

import { useState, useEffect } from "react";
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
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "graph">("grid");
  const [activeCategory, setActiveCategory] = useState("all");
  const [linkingSource, setLinkingSource] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // Check JWT token on mount
  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    const userData = localStorage.getItem("user");

    if (!token) {
      router.push("/auth/login");
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  // Fetch data whenever the active category changes
  useEffect(() => {
    if (!searchQuery) {
      fetchFeed(activeCategory);
    }
  }, [activeCategory]);

  const fetchFeed = async (category: string) => {
    try {
      const token = localStorage.getItem("jwtToken");
      const res = await fetch(
        `http://localhost:3000/api/feed?type=${category}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchFeed(activeCategory);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem("jwtToken");
      const res = await fetch(
        `http://localhost:3000/api/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const responseData = await res.json();
      setItems(responseData.data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const switchCategory = (category: string) => {
    setSearchQuery("");
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
            {viewMode === "grid" ? (
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
