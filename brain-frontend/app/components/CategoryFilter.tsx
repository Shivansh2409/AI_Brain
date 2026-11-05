"use client";

import {
  LayoutGrid,
  FileText,
  FileIcon,
  ImageIcon,
  Play,
  type LucideIcon,
} from "lucide-react";
import { ITEM_TYPES } from "../lib/itemTypes";

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CATEGORIES: { id: string; label: string; icon: LucideIcon; color?: string }[] = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "article", label: "Articles", icon: FileText, color: ITEM_TYPES.article.color },
  { id: "youtube", label: "YouTube", icon: Play, color: ITEM_TYPES.youtube.color },
  { id: "pdf", label: "PDFs", icon: FileIcon, color: ITEM_TYPES.pdf.color },
  { id: "image", label: "Images", icon: ImageIcon, color: ITEM_TYPES.image.color },
];

export default function CategoryFilter({
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {CATEGORIES.map(({ id, label, icon: Icon, color }) => {
        const active = activeCategory === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onCategoryChange(id)}
            aria-pressed={active}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition ${
              active
                ? "border-white/20 bg-white/10 text-white"
                : "border-white/7 bg-black/30 text-zinc-400 hover:border-white/15 hover:text-zinc-200"
            }`}
          >
            <Icon
              size={14}
              style={{ color: active || !color ? undefined : color }}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}
