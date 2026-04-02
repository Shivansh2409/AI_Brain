"use client";

import { useOptimistic, useRef } from "react";
import { saveItemAction } from "../actions";

// Matches the data returned by your Mongoose backend
export type SavedItem = {
  _id: string;
  url: string;
  title: string;
  summary?: string;
  itemType?: string;
};

export default function SavedItemsList({
  initialItems,
}: {
  initialItems: SavedItem[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  // 1. Initialize the optimistic hook
  // It takes the real server data (initialItems) and a reducer function to add the fake item
  const [optimisticItems, addOptimisticItem] = useOptimistic<
    SavedItem[],
    SavedItem
  >(
    initialItems,
    (currentState, optimisticValue) => [optimisticValue, ...currentState], // Add fake item to the top of the list
  );

  // 2. Handle the form submission
  async function formAction(formData: FormData) {
    const url = formData.get("url") as string;
    if (!url) return;

    // Create the temporary "Pending" object based on your Mongoose defaults
    const pendingItem: SavedItem = {
      _id: Math.random().toString(), // Temporary ID for React keys
      url,
      title: "Pending Title...",
      summary: "Scraping content and generating AI summary...",
      itemType: "unknown",
    };

    // This triggers instantly!
    addOptimisticItem(pendingItem);

    // Reset the form input instantly
    formRef.current?.reset();

    try {
      // Execute the actual server action
      await saveItemAction(url);
    } catch (error) {
      console.error("Failed to save the item", error);
      // Note: If this throws, Next.js automatically reverts the
      // optimisticItems array back to its original state!
    }
  }

  return (
    <div>
      <form action={formAction} ref={formRef} className="mb-8 flex gap-2">
        <input
          type="url"
          name="url"
          placeholder="https://..."
          required
          className="border p-2 rounded w-full"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Save
        </button>
      </form>

      <ul className="space-y-4">
        {optimisticItems.map((item) => (
          <li
            key={item._id}
            className={`p-4 border rounded ${item.title === "Pending Title..." ? "animate-pulse bg-gray-50" : "bg-white"}`}
          >
            <h3 className="font-bold">{item.title}</h3>
            <p className="text-sm text-gray-500">{item.url}</p>
            {item.summary && <p className="mt-2 text-sm">{item.summary}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
