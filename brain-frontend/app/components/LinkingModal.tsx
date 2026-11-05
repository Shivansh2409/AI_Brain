"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch, UnauthorizedError } from "../lib/api";

interface LinkingModalProps {
  sourceItem: any;
  allItems: any[];
  activeCategory: string;
  onClose: () => void;
  onRefresh: () => void;
}

export default function LinkingModal({
  sourceItem,
  allItems,
  activeCategory,
  onClose,
  onRefresh,
}: LinkingModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-b border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white line-clamp-1 mb-1">
            🔗 Connect: {sourceItem.title}
          </h2>
          <p className="text-sm text-slate-400">
            Link this item to others in your knowledge graph
          </p>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-3">
          {allItems
            .filter((item: any) => item._id !== sourceItem._id)
            .map((targetItem: any) => {
              const isLinked = sourceItem.linkedItems?.includes(targetItem._id);

              return (
                <div
                  key={targetItem._id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 hover:bg-slate-800 transition group"
                >
                  <div className="flex-grow pr-4 min-w-0">
                    <div className="font-semibold text-slate-100 line-clamp-1 group-hover:text-blue-300 transition">
                      {targetItem.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 capitalize">
                      {targetItem.itemType} • {targetItem.saveReason}
                    </div>
                  </div>

                  {isLinked ? (
                    <button
                      onClick={() => handleUnlink(targetItem._id)}
                      disabled={pendingId !== null}
                      className="disabled:opacity-50 shrink-0 px-4 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-600/50 hover:border-red-400 rounded-lg text-sm font-medium transition duration-300 shadow-lg hover:shadow-red-500/50"
                    >
                      Unlink
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLink(targetItem._id)}
                      disabled={pendingId !== null}
                      className="disabled:opacity-50 shrink-0 px-4 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-600/50 hover:border-blue-400 rounded-lg text-sm font-medium transition duration-300 shadow-lg hover:shadow-blue-500/50"
                    >
                      Link
                    </button>
                  )}
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-6 bg-slate-900/50">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 rounded-lg font-medium transition duration-300 text-slate-100 shadow-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
