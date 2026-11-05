// One place for how each saved-item type looks: label + colour.
// Used by the cards, the category filter and the knowledge graph legend.

export type ItemType = "article" | "youtube" | "pdf" | "image";

export const ITEM_TYPES: Record<ItemType, { label: string; color: string }> = {
  article: { label: "Article", color: "#a78bfa" }, // violet
  youtube: { label: "YouTube", color: "#f87171" }, // red
  pdf: { label: "PDF", color: "#fb923c" }, // orange
  image: { label: "Image", color: "#2dd4bf" }, // teal
};

// Graph-only node colours
export const CORE_COLOR = "#fbbf24"; // the centre "your brain" node (gold)
export const TOPIC_COLOR = "#f472b6"; // topic hubs (pink)

export function typeMeta(type: string | undefined) {
  return ITEM_TYPES[(type as ItemType) ?? "article"] ?? ITEM_TYPES.article;
}

/** Only real web links get a "Visit" button (direct uploads use upload://). */
export function isWebUrl(url: unknown): url is string {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

export function formatDate(value: string | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}
