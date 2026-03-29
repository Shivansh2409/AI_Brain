"use client";

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
  const handleLink = async (targetId: string) => {
    try {
      const token = localStorage.getItem("jwtToken");
      await fetch("http://localhost:3000/api/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceId: sourceItem._id,
          targetId: targetId,
        }),
      });
      onClose();
      onRefresh();
    } catch (error) {
      console.error("Error linking items:", error);
    }
  };

  const handleUnlink = async (targetId: string) => {
    try {
      const token = localStorage.getItem("jwtToken");
      await fetch("http://localhost:3000/api/unlink", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceId: sourceItem._id,
          targetId: targetId,
        }),
      });
      onClose();
      onRefresh();
    } catch (error) {
      console.error("Error unlinking items:", error);
    }
  };

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
                      className="shrink-0 px-4 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-600/50 hover:border-red-400 rounded-lg text-sm font-medium transition duration-300 shadow-lg hover:shadow-red-500/50"
                    >
                      Unlink
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLink(targetItem._id)}
                      className="shrink-0 px-4 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-600/50 hover:border-blue-400 rounded-lg text-sm font-medium transition duration-300 shadow-lg hover:shadow-blue-500/50"
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
