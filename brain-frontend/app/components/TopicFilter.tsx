"use client";

import { CATEGORIES } from "../lib/categories";

interface TopicFilterProps {
  activeTopic: string;
  onTopicChange: (topic: string) => void;
  /** item count per category id; categories with 0 items are hidden */
  counts: Record<string, number> | null;
}

export default function TopicFilter({
  activeTopic,
  onTopicChange,
  counts,
}: TopicFilterProps) {
  // Until counts load, show every category; afterwards only ones with items
  // (plus the active one, so it can always be switched off).
  const visible = CATEGORIES.filter(
    (c) => !counts || (counts[c.id] ?? 0) > 0 || c.id === activeTopic,
  );
  if (visible.length === 0) return null;

  return (
    <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible">
      <button
        type="button"
        onClick={() => onTopicChange("all")}
        aria-pressed={activeTopic === "all"}
        className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-medium transition ${
          activeTopic === "all"
            ? "bg-white text-black"
            : "text-zinc-400 hover:text-zinc-100"
        }`}
      >
        All topics
      </button>
      {visible.map(({ id, label, color, icon: Icon }) => {
        const active = activeTopic === id;
        const count = counts?.[id];
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTopicChange(active ? "all" : id)}
            aria-pressed={active}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium transition ${
              active
                ? "text-white"
                : "border-transparent text-zinc-400 hover:border-white/10 hover:text-zinc-100"
            }`}
            style={
              active
                ? { borderColor: `${color}66`, background: `${color}1f` }
                : undefined
            }
          >
            <Icon size={13} style={{ color }} />
            {label}
            {count !== undefined && (
              <span className="text-[11px] text-zinc-500 tabular-nums">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
