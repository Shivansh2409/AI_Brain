"use server";

import { revalidatePath } from "next/cache";

export async function saveItemAction(url: string) {
  // 1. Send the URL to your Node.js backend
  // Replace with your actual backend URL/port
  const res = await fetch("http://localhost:5000/api/saved-items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Include auth tokens if required by your backend
    },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    throw new Error("Failed to save item to the backend");
  }

  // 2. Tell Next.js to purge the cache for the dashboard.
  // This fetches the real, finalized data from your backend.
  revalidatePath("/dashboard");
}
