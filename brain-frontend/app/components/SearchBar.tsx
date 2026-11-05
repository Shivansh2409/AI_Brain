"use client";

import { ArrowUp, Search } from "lucide-react";
import { FormEvent, ReactNode } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isSearching: boolean;
  /** Rendered along the bottom of the panel (the category chips) */
  footer?: ReactNode;
}

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  isSearching,
  footer,
}: SearchBarProps) {
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      {/* colour wash behind the panel */}
      <div
        aria-hidden
        className="aurora pointer-events-none absolute -inset-x-16 -bottom-10 top-10 opacity-70"
      />

      <form
        onSubmit={onSubmit}
        className="glass relative rounded-3xl p-2 transition focus-within:border-white/20"
      >
        <div className="flex items-center gap-3 rounded-[18px] bg-black/40 px-4 py-3 ring-1 ring-white/6">
          <Search size={18} className="shrink-0 text-zinc-500" />
          <input
            type="text"
            aria-label="Search your brain"
            placeholder="Search by meaning, e.g. 'startup ideas' or 'how transformers work'"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            disabled={isSearching}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-black transition hover:bg-zinc-200 disabled:opacity-70"
          >
            {isSearching ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
            ) : (
              <ArrowUp size={18} strokeWidth={2.4} />
            )}
          </button>
        </div>

        {footer && <div className="px-2 pt-2.5 pb-1">{footer}</div>}
      </form>
    </div>
  );
}
