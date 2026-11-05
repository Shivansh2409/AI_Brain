"use client";

import { Sparkles } from "lucide-react";
import ItemCard from "./ItemCard";

interface ItemGridProps {
  items: any[];
  isLoading: boolean;
  isSearchResult: boolean;
  onItemLink: (item: any) => void;
}

function SkeletonCard() {
  return (
    <div className="glass flex h-64 flex-col gap-3 rounded-2xl p-5">
      <div className="shimmer h-5 w-20 rounded-full" />
      <div className="shimmer mt-2 h-4 w-4/5 rounded" />
      <div className="shimmer h-4 w-3/5 rounded" />
      <div className="shimmer mt-2 h-3 w-full rounded" />
      <div className="shimmer h-3 w-11/12 rounded" />
      <div className="mt-auto flex justify-between">
        <div className="shimmer h-4 w-14 rounded" />
        <div className="shimmer h-7 w-24 rounded-full" />
      </div>
    </div>
  );
}

export default function ItemGrid({
  items,
  isLoading,
  isSearchResult,
  onItemLink,
}: ItemGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass mx-auto max-w-lg rounded-3xl px-6 py-14 text-center">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-linear-to-br from-violet-500/20 to-pink-500/20 ring-1 ring-white/10">
          <Sparkles className="text-fuchsia-300" size={22} />
        </div>
        <h3 className="text-lg font-semibold text-zinc-100">
          {isSearchResult ? "Nothing matched that search" : "Nothing here yet"}
        </h3>
        <p className="mt-2 text-sm text-zinc-400">
          {isSearchResult
            ? "Try describing the idea in different words. Search works on meaning, not exact keywords."
            : "Save pages, videos, PDFs and images with the browser extension and they'll appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item: any) => (
        <ItemCard key={item._id} item={item} onLink={() => onItemLink(item)} />
      ))}
    </div>
  );
}
