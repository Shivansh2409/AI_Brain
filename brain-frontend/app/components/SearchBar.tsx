"use client";

import { Search } from "lucide-react";
import { FormEvent } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isSearching: boolean;
}

export default function SearchBar({
  value,
  onChange,
  onSubmit,
  isSearching,
}: SearchBarProps) {
  return (
    <form onSubmit={onSubmit} className="relative mb-8 group">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition duration-300" />
      <div className="relative flex items-center">
        <Search
          className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-400 transition"
          size={20}
        />
        <input
          type="text"
          placeholder="Search by meaning... (e.g. 'coding', 'design', 'AI')"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 group-hover:border-slate-600 group-focus-within:border-blue-500 rounded-xl py-3 pl-12 pr-32 text-base text-slate-100 placeholder-slate-500 focus:outline-none transition duration-300 shadow-lg focus:shadow-blue-500/20"
        />
        <button
          type="submit"
          className="absolute right-2 top-2 px-6 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg font-medium transition duration-300 shadow-lg hover:shadow-blue-500/50 text-sm"
        >
          {isSearching ? (
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Search
            </span>
          ) : (
            "Search"
          )}
        </button>
      </div>
    </form>
  );
}
