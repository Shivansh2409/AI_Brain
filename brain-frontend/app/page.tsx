// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Brain,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  LayoutGrid,
  LogOut,
} from "lucide-react";
import KnowledgeGraph from "./components/KnowledgeGraph";

export default function Dashboard() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'graph'
  const [activeCategory, setActiveCategory] = useState("all"); // Tracks the current tab
  const [linkingSource, setLinkingSource] = useState<any>(null); // The item you clicked "Link" on
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

  // 1. Fetch data whenever the active category changes
  useEffect(() => {
    // If we have a search query active, don't overwrite it with the feed
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

  // 2. Handle Semantic Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchFeed(activeCategory);
      return;
    }

    setIsSearching(true);
    // Note: Search searches ALL items by meaning, ignoring the category tab for broader discovery
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

  // 3. Helper to clear search and switch categories
  const switchCategory = (category: string) => {
    setSearchQuery(""); // Clear search bar when clicking a tab
    setActiveCategory(category);
  };

  // 4. Logout handler
  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto mb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="text-blue-500" size={36} />
            AI Second Brain
          </h1>

          <div className="flex items-center gap-4">
            {/* User Info & Logout */}
            {user && (
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <p className="text-slate-300">{user.name}</p>
                  <p className="text-slate-500 text-xs">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-600/20 rounded-lg transition text-red-400 hover:text-red-300"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}

            {/* View Mode Buttons */}
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
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative mb-6">
          <Search
            className="absolute left-4 top-3.5 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by meaning... (e.g. 'coding tutorials', 'healthy food')"
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

        {/* THE FIX: Category Filter Tabs */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => switchCategory("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${activeCategory === "all" ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}
          >
            <LayoutGrid size={16} /> All
          </button>
          <button
            onClick={() => switchCategory("article")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${activeCategory === "article" ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}
          >
            <FileText size={16} /> Articles
          </button>
          <button
            onClick={() => switchCategory("youtube")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${activeCategory === "youtube" ? "bg-red-600 border-red-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}
          >
            {/* <Youtube size={16} /> YouTube */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-youtube-icon lucide-youtube"
            >
              <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
              <path d="m10 15 5-3-5-3z" />
            </svg>{" "}
            YouTube
          </button>
          <button
            onClick={() => switchCategory("pdf")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${activeCategory === "pdf" ? "bg-orange-600 border-orange-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}
          >
            <FileIcon size={16} /> PDFs
          </button>
          <button
            onClick={() => switchCategory("image")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition ${activeCategory === "image" ? "bg-purple-600 border-purple-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}
          >
            <ImageIcon size={16} /> Images
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.length === 0 && !isSearching && (
              <div className="col-span-full text-center py-12 text-slate-500">
                No items found in this category. Go save something!
              </div>
            )}

            {items.map((item: any) => (
              <div
                key={item._id}
                className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-blue-500 transition group flex flex-col h-full relative overflow-hidden"
              >
                {/* Visual indicator of item type */}
                <div className="absolute top-0 right-0 p-2 opacity-30 group-hover:opacity-100 transition">
                  {item.itemType === "youtube" && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-youtube-icon lucide-youtube"
                    >
                      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                      <path d="m10 15 5-3-5-3z" />
                    </svg>
                  )}
                  {item.itemType === "pdf" && (
                    <FileIcon className="text-orange-500" size={24} />
                  )}
                  {item.itemType === "image" && (
                    <ImageIcon className="text-purple-500" size={24} />
                  )}
                  {item.itemType === "article" && (
                    <FileText className="text-blue-500" size={24} />
                  )}
                </div>

                <h3 className="text-xl font-bold mb-2 line-clamp-2 pr-8">
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

                <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-700">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition"
                  >
                    <LinkIcon size={14} /> Visit
                  </a>

                  {/* THE NEW BUTTON */}
                  <button
                    onClick={() => setLinkingSource(item)}
                    className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1 rounded transition"
                  >
                    🔗 Connect
                  </button>
                </div>

                <div className="mb-3 flex flex-col gap-2">
                  <span className="self-start text-[10px] font-bold uppercase tracking-wider bg-blue-900/50 text-blue-300 px-2 py-1 rounded border border-blue-800/50">
                    {item.saveReason}
                  </span>
                  {item.userNote && (
                    <div className="bg-slate-900/50 border-l-2 border-blue-500 p-2 text-sm italic text-slate-300 line-clamp-2">
                      "{item.userNote}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[600px] w-full bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <KnowledgeGraph items={items} />
          </div>
        )}
      </div>
      {/* --- LINKING MODAL --- */}
      {linkingSource && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col">
            <h2 className="text-xl font-bold mb-2 line-clamp-1">
              Manage Links: {linkingSource.title}
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Connect or disconnect items in your knowledge graph.
            </p>

            <div className="overflow-y-auto flex-grow pr-2 space-y-2">
              {items
                .filter((item: any) => item._id !== linkingSource._id) // Don't show the item itself
                .map((targetItem: any) => {
                  // THE MAGIC: Check if they are already friends!
                  const isLinked = linkingSource.linkedItems?.includes(
                    targetItem._id,
                  );

                  return (
                    <div
                      key={targetItem._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-700 border border-slate-600"
                    >
                      <div className="pr-4">
                        <div className="font-semibold line-clamp-1">
                          {targetItem.title}
                        </div>
                        <div className="text-xs text-slate-300 mt-1 capitalize">
                          {targetItem.itemType}
                        </div>
                      </div>

                      {isLinked ? (
                        <button
                          onClick={async () => {
                            // ✂️ Hit the UNLINK API
                            await fetch("http://localhost:3000/api/unlink", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                sourceId: linkingSource._id,
                                targetId: targetItem._id,
                              }),
                            });

                            setLinkingSource(null); // Close modal
                            fetchFeed(activeCategory); // Refresh the UI data
                          }}
                          className="shrink-0 px-4 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition shadow-lg"
                        >
                          Unlink
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            // 🔗 Hit the LINK API
                            await fetch("http://localhost:3000/api/link", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                sourceId: linkingSource._id,
                                targetId: targetItem._id,
                              }),
                            });

                            setLinkingSource(null); // Close modal
                            fetchFeed(activeCategory); // Refresh the UI data
                          }}
                          className="shrink-0 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition shadow-lg"
                        >
                          Link
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>

            <button
              onClick={() => setLinkingSource(null)}
              className="mt-6 w-full py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
