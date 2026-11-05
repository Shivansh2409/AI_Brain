"use client";

import { ArrowUpRight, Link2 } from "lucide-react";
import { formatDate, isWebUrl, typeMeta } from "../lib/itemTypes";

interface ItemCardProps {
  item: any;
  onLink: () => void;
}

export function TypeBadge({ type }: { type?: string }) {
  const meta = typeMeta(type);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-2.5 py-1 text-[11px] font-medium text-zinc-300">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
      />
      {meta.label}
    </span>
  );
}

export default function ItemCard({ item, onLink }: ItemCardProps) {
  const linkedCount = item.linkedItems?.length ?? 0;

  return (
    <article className="glass group relative flex h-full flex-col rounded-2xl p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/15">
      {/* hover glow along the top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 -top-px h-px bg-linear-to-r from-transparent via-fuchsia-400/70 to-transparent opacity-0 transition group-hover:opacity-100"
      />

      <div className="mb-4 flex items-center justify-between gap-2">
        <TypeBadge type={item.itemType} />
        <span className="text-xs text-zinc-500">{formatDate(item.createdAt)}</span>
      </div>

      <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-zinc-100">
        {item.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-400">
        {item.summary}
      </p>

      {item.tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.tags.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="rounded-full border border-white/7 bg-white/3 px-2 py-0.5 text-[11px] text-zinc-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {(item.saveReason || item.userNote) && (
        <div className="mt-4 space-y-2">
          {item.saveReason && (
            <span className="inline-block rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-violet-300 uppercase">
              {item.saveReason}
            </span>
          )}
          {item.userNote && (
            <p className="line-clamp-2 border-l-2 border-fuchsia-400/50 pl-3 text-[13px] text-zinc-300 italic">
              “{item.userNote}”
            </p>
          )}
        </div>
      )}

      {/* pushes the footer to the bottom while keeping a minimum gap */}
      <div className="min-h-5 flex-1" />

      <div className="flex items-center justify-between border-t border-white/6 pt-4">
        {isWebUrl(item.url) ? (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-sm font-medium text-zinc-300 transition hover:text-white"
          >
            Open <ArrowUpRight size={15} />
          </a>
        ) : (
          <span className="text-sm text-zinc-500">Uploaded file</span>
        )}

        <button
          onClick={onLink}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-[13px] font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/8"
        >
          <Link2 size={14} />
          Connect
          {linkedCount > 0 && (
            <span className="ml-0.5 rounded-full bg-amber-400/15 px-1.5 text-[11px] text-amber-300">
              {linkedCount}
            </span>
          )}
        </button>
      </div>
    </article>
  );
}
