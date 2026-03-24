// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, Brain, Link as LinkIcon, FileText } from "lucide-react";
import KnowledgeGraph from "./components/KnowledgeGraph";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'graph'

  // Fetch the default feed on load
  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      // Assuming your backend feed route is on port 3000
      const res = await fetch("http://localhost:3000/api/feed");
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    }
  };

  // Step 11: Implement Semantic Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchFeed(); // Reset to feed if search is empty
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/search?q=${encodeURIComponent(searchQuery)}`,
      );
      const responseData = await res.json();
      setItems(responseData.data); // The search API returns results in the .data array
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      {/* Header & Search Bar */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="text-blue-500" size={36} />
            AI Second Brain
          </h1>

          {/* View Toggles */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 rounded-md transition ${viewMode === "grid" ? "bg-blue-600" : "hover:bg-slate-700"}`}
            >
              Feed
            </button>
            <button
              onClick={() => setViewMode("graph")}
              className={`px-4 py-2 rounded-md transition ${viewMode === "graph" ? "bg-blue-600" : "hover:bg-slate-700"}`}
            >
              Graph View
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <Search
            className="absolute left-4 top-3.5 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by meaning... (e.g. 'crypto', 'healthy food')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-lg focus:outline-none focus:border-blue-500 transition"
          />
          <button
            type="submit"
            className="absolute right-3 top-2.5 bg-blue-600 hover:bg-blue-500 px-4 py-1 rounded-lg font-medium transition"
          >
            {isSearching ? "Thinking..." : "Search"}
          </button>
        </form>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto">
        {viewMode === "grid" ? (
          // Step 10: The Dashboard Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: any) => (
              <div
                key={item._id}
                className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-blue-500 transition group flex flex-col h-full"
              >
                <h3 className="text-xl font-bold mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-3 flex-grow">
                  {item.summary}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {item.tags?.slice(0, 3).map((tag: string) => (
                    <span
                      key={tag}
                      className="text-xs bg-slate-700 text-blue-300 px-2 py-1 rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition mt-auto pt-4 border-t border-slate-700"
                >
                  <LinkIcon size={14} /> Visit Source
                </a>
              </div>
            ))}
          </div>
        ) : (
          // Step 12: Graph View Container
          <div className="h-[600px] w-full bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <KnowledgeGraph items={items} />
          </div>
        )}
      </div>
    </div>
  );
}
