"use client";

import { useRouter } from "next/navigation";
import { LogOut, LayoutGrid, Network } from "lucide-react";
import { clearSession } from "../lib/api";
import Logo from "./Logo";

interface HeaderProps {
  user: { name: string; email: string } | null;
  viewMode: "grid" | "graph";
  onViewModeChange: (mode: "grid" | "graph") => void;
}

const VIEWS = [
  { id: "grid", label: "Library", icon: LayoutGrid },
  { id: "graph", label: "Graph", icon: Network },
] as const;

export default function Header({
  user,
  viewMode,
  onViewModeChange,
}: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    router.replace("/auth/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/6 bg-[#050507]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />

        {/* View switcher */}
        <nav
          aria-label="View"
          className="flex rounded-full border border-white/10 bg-white/3 p-1"
        >
          {VIEWS.map(({ id, label, icon: Icon }) => {
            const active = viewMode === id;
            return (
              <button
                key={id}
                onClick={() => onViewModeChange(id)}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition sm:px-4 ${
                  active
                    ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <>
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium leading-tight text-zinc-100">
                  {user.name}
                </p>
                <p className="text-xs text-zinc-500">{user.email}</p>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-linear-to-br from-violet-500 to-pink-500 text-sm font-semibold text-white">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </>
          )}
          <button
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="grid h-9 w-9 place-items-center rounded-full text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}
