"use client";

import { useRouter } from "next/navigation";
import { Brain, LogOut, Grid, Zap } from "lucide-react";

interface HeaderProps {
  user: { name: string; email: string } | null;
  viewMode: "grid" | "graph";
  onViewModeChange: (mode: "grid" | "graph") => void;
}

export default function Header({
  user,
  viewMode,
  onViewModeChange,
}: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg shadow-lg">
              <Brain className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Brain</h1>
              <p className="text-xs text-slate-400">Knowledge Sanctuary</p>
            </div>
          </div>

          {/* Center - View Mode Buttons */}
          <div className="flex bg-slate-800 rounded-xl p-1 shadow-lg border border-slate-700">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition duration-300 ${
                viewMode === "grid"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              <Grid size={18} />
              <span className="text-sm font-medium">Feed</span>
            </button>
            <button
              onClick={() => onViewModeChange("graph")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition duration-300 ${
                viewMode === "graph"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                  : "text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
            >
              <Zap size={18} />
              <span className="text-sm font-medium">Graph</span>
            </button>
          </div>

          {/* Right - User Info & Logout */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-100">
                  {user.name}
                </p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="p-2.5 hover:bg-red-600/20 rounded-lg transition duration-300 text-red-400 hover:text-red-300 hover:shadow-lg"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
