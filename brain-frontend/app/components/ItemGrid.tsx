"use client";

import ItemCard from "./ItemCard";

interface ItemGridProps {
  items: any[];
  isSearching: boolean;
  onItemLink: (item: any) => void;
}

export default function ItemGrid({
  items,
  isSearching,
  onItemLink,
}: ItemGridProps) {
  if (isSearching) {
    return (
      <div className="col-span-full flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          </div>
          <p className="text-slate-400 font-medium">Searching your brain...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="col-span-full">
        <div className="text-center py-16 px-6">
          <div className="inline-block p-4 bg-blue-600/10 border border-blue-600/30 rounded-full mb-4">
            <svg
              className="w-12 h-12 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m0 0h6m0-6h6m0 0h6M6 12a6 6 0 1112 0 6 6 0 01-12 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">
            Your knowledge vault is empty
          </h3>
          <p className="text-slate-400 mb-6">
            Start saving content from the web using the browser extension
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {items.map((item: any) => (
        <ItemCard key={item._id} item={item} onLink={() => onItemLink(item)} />
      ))}
    </>
  );
}
