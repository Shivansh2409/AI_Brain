"use client";

import { LinkIcon, FileText, FileIcon, ImageIcon } from "lucide-react";

interface ItemCardProps {
  item: any;
  onLink: () => void;
}

export default function ItemCard({ item, onLink }: ItemCardProps) {
  return (
    <div className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-blue-500 rounded-xl p-5 transition duration-300 hover:shadow-xl hover:shadow-blue-500/20 flex flex-col h-full relative overflow-hidden">
      {/* Background gradient effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-cyan-600/0 group-hover:from-blue-600/5 group-hover:to-cyan-600/5 transition duration-300" />

      {/* Item Type Icon */}
      <div className="absolute top-3 right-3 p-2 opacity-40 group-hover:opacity-100 transition duration-300">
        {item.itemType === "youtube" && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-red-500"
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

      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-lg font-bold mb-2 line-clamp-2 pr-8 text-slate-100 group-hover:text-blue-100 transition">
          {item.title}
        </h3>
        <p className="text-slate-400 text-sm mb-4 line-clamp-3 flex-grow">
          {item.summary}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {item.tags?.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full border border-blue-600/30 hover:border-blue-400/50 transition"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Save Reason & Note */}
        <div className="mb-4 flex flex-col gap-2">
          <span className="self-start text-[10px] font-bold uppercase tracking-wider bg-blue-600/30 text-blue-300 px-3 py-1 rounded-full border border-blue-600/50">
            {item.saveReason}
          </span>
          {item.userNote && (
            <div className="bg-blue-600/10 border-l-2 border-blue-500 p-3 text-sm italic text-slate-300 line-clamp-2 rounded">
              "{item.userNote}"
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-700 relative z-10">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition font-medium"
        >
          <LinkIcon size={14} /> Visit
        </a>

        <button
          onClick={onLink}
          className="text-sm bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-600/50 hover:border-blue-400 px-3 py-1.5 rounded-lg transition duration-300 font-medium"
        >
          🔗 Connect
        </button>
      </div>
    </div>
  );
}
