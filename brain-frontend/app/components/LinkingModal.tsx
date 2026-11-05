"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { typeMeta } from "../lib/itemTypes";
import { useRouter } from "next/navigation";
import { authFetch, UnauthorizedError } from "../lib/api";

interface LinkingModalProps {
  sourceItem: any;
  allItems: any[];
  onClose: () => void;
  onRefresh: () => void;
}

export default function LinkingModal({
  sourceItem,
  allItems,
  onClose,
  onRefresh,
}: LinkingModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Link or unlink, and only close the modal if the server accepted it
  const updateLink = async (action: "link" | "unlink", targetId: string) => {
    setError(null);
    setPendingId(targetId);
    try {
      const res = await authFetch(`/api/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: sourceItem._id, targetId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || `Couldn't ${action} these items.`);
        return;
      }
      onClose();
      onRefresh();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.replace("/auth/login");
        return;
      }
      console.error(`Error trying to ${action} items:`, err);
      setError("Couldn't reach the server.");
    } finally {
      setPendingId(null);
    }
  };

  const handleLink = (targetId: string) => updateLink("link", targetId);
  const handleUnlink = (targetId: string) => updateLink("unlink", targetId);

  const others = allItems.filter((item: any) => item._id !== sourceItem._id);
  const q = query.trim().toLowerCase();
  const visible = q
    ? others.filter((item: any) => item.title?.toLowerCase().includes(q))
    : others;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-modal-title"
    >
      <div
        className="glass flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-[#0b0b10]/90"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-white/6 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-amber-300/80 uppercase">
                Connect
              </p>
              <h2
                id="link-modal-title"
                className="mt-1 line-clamp-1 text-lg font-semibold text-white"
              >
                {sourceItem.title}
              </h2>
              <p className="text-sm text-zinc-400">
                Link it to related items. Links show up in gold on the graph.
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title…"
            aria-label="Filter items by title"
            className="mt-4 w-full rounded-xl border border-white/8 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/20 focus:outline-none"
          />
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {visible.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">
              No other items to link.
            </p>
          )}
          {visible.map((targetItem: any) => {
            const isLinked = sourceItem.linkedItems?.includes(targetItem._id);
            const meta = typeMeta(targetItem.itemType);

            return (
              <div
                key={targetItem._id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/6 bg-white/2 p-3 transition hover:border-white/15 hover:bg-white/4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
                  />
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-sm font-medium text-zinc-100">
                      {targetItem.title}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      {meta.label}
                      {targetItem.saveReason ? ` · ${targetItem.saveReason}` : ""}
                    </div>
                  </div>
                </div>

                {isLinked ? (
                  <button
                    onClick={() => handleUnlink(targetItem._id)}
                    disabled={pendingId !== null}
                    className="shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1.5 text-[13px] font-medium text-amber-200 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
                  >
                    {pendingId === targetItem._id ? "…" : "Linked"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleLink(targetItem._id)}
                    disabled={pendingId !== null}
                    className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
                  >
                    {pendingId === targetItem._id ? "…" : "Link"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
