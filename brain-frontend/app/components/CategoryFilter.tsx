"use client";

import { LayoutGrid, FileText, FileIcon, ImageIcon } from "lucide-react";

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  const categories = [
    { id: "all", label: "All", icon: LayoutGrid, color: "blue" },
    { id: "article", label: "Articles", icon: FileText, color: "blue" },
    { id: "youtube", label: "YouTube", icon: null, color: "red" },
    { id: "pdf", label: "PDFs", icon: FileIcon, color: "orange" },
    { id: "image", label: "Images", icon: ImageIcon, color: "purple" },
  ];

  const colorClasses = {
    blue: "bg-blue-600 border-blue-500",
    red: "bg-red-600 border-red-500",
    orange: "bg-orange-600 border-orange-500",
    purple: "bg-purple-600 border-purple-500",
  };

  return (
    <div className="flex flex-wrap gap-3">
      {categories.map((category) => {
        const Icon = category.icon;
        const isActive = activeCategory === category.id;
        const colorClass =
          colorClasses[category.color as keyof typeof colorClasses];

        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition duration-300 font-medium ${
              isActive
                ? `${colorClass} text-white shadow-lg scale-105`
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600"
            }`}
          >
            {Icon && <Icon size={16} />}
            {category.id === "youtube" && !Icon && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                <path d="m10 15 5-3-5-3z" />
              </svg>
            )}
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
