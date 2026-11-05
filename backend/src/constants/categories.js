// Topic categories for saved items. Gemini picks one when an item is saved;
// the keywords are a fallback when the AI answer is missing or invalid.
// Keep the ids in sync with brain-frontend/app/lib/categories.ts.

const CATEGORIES = [
  {
    id: "ai",
    label: "AI & ML",
    description: "artificial intelligence, machine learning, LLMs, data science",
    keywords: ["ai", "artificial intelligence", "machine learning", "deep learning", "llm", "gpt", "chatgpt", "openai", "gemini", "claude", "neural", "nlp", "transformer", "prompt", "embedding", "computer vision", "data science", "generative"],
  },
  {
    id: "tech",
    label: "Tech & Dev",
    description: "programming, software engineering, dev tools, cloud, gadgets, tech industry",
    keywords: ["programming", "software", "developer", "coding", "code", "javascript", "typescript", "python", "java", "react", "node", "api", "database", "docker", "kubernetes", "cloud", "devops", "backend", "frontend", "github", "linux", "web development", "framework", "security", "cybersecurity", "hardware", "gadget", "smartphone", "tech"],
  },
  {
    id: "design",
    label: "Web & UI Design",
    description: "UI/UX, web design, product design, graphics, branding, typography",
    keywords: ["design", "ui", "ux", "figma", "css", "tailwind", "typography", "branding", "logo", "web design", "landing page", "dribbble", "behance", "layout", "color", "illustration", "animation", "glassmorphism", "dashboard", "prototype"],
  },
  {
    id: "business",
    label: "Business & Startups",
    description: "startups, entrepreneurship, marketing, sales, product management, careers in business",
    keywords: ["startup", "business", "entrepreneur", "marketing", "sales", "product management", "growth", "saas", "fundraising", "venture", "strategy", "management", "leadership", "company", "customer", "seo", "brand"],
  },
  {
    id: "finance",
    label: "Finance & Crypto",
    description: "personal finance, investing, markets, economics, crypto",
    keywords: ["finance", "investing", "investment", "stock", "market", "crypto", "bitcoin", "ethereum", "blockchain", "economy", "economics", "money", "trading", "bank", "tax", "inflation"],
  },
  {
    id: "science",
    label: "Science",
    description: "physics, biology, chemistry, space, climate, research papers",
    keywords: ["science", "physics", "biology", "chemistry", "space", "astronomy", "nasa", "climate", "research", "quantum", "genetics", "neuroscience", "mathematics", "math"],
  },
  {
    id: "learning",
    label: "Learning & Productivity",
    description: "self-improvement, productivity, education, study, note-taking, careers",
    keywords: ["productivity", "learning", "education", "study", "course", "tutorial", "habit", "self-improvement", "career", "notes", "note-taking", "second brain", "memory", "focus", "time management", "book"],
  },
  {
    id: "news",
    label: "News & World",
    description: "current events, politics, government, law, world affairs",
    keywords: ["news", "politics", "government", "election", "world", "war", "policy", "law", "court", "protest", "international", "geopolitics", "parliament", "president"],
  },
  {
    id: "health",
    label: "Health & Fitness",
    description: "health, fitness, nutrition, medicine, mental health",
    keywords: ["health", "fitness", "workout", "exercise", "nutrition", "diet", "medicine", "medical", "mental health", "sleep", "wellness", "yoga"],
  },
  {
    id: "entertainment",
    label: "Entertainment",
    description: "movies, music, gaming, sports, TV, pop culture",
    keywords: ["movie", "film", "music", "song", "gaming", "game", "sports", "football", "cricket", "tv", "series", "entertainment", "celebrity", "anime", "art", "culture"],
  },
  {
    id: "other",
    label: "Other",
    description: "anything that doesn't fit the categories above",
    keywords: [],
  },
];

const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

/** "- ai: artificial intelligence, ..." lines for prompts */
const CATEGORY_PROMPT_LIST = CATEGORIES.map(
  (c) => `- ${c.id}: ${c.description}`,
).join("\n");

// Whole-word / whole-phrase match, so "ai" doesn't match "said".
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const KEYWORD_PATTERNS = CATEGORIES.map((c) => ({
  id: c.id,
  patterns: c.keywords.map((k) => new RegExp(`(^|[^a-z0-9])${escape(k)}s?([^a-z0-9]|$)`, "i")),
}));

/** Best-guess category from an item's tags and title. */
function guessCategory({ tags = [], title = "" } = {}) {
  const texts = [...tags, title].filter(Boolean).map((t) => String(t).toLowerCase());
  let best = { id: "other", score: 0 };
  for (const { id, patterns } of KEYWORD_PATTERNS) {
    let score = 0;
    for (const text of texts) {
      for (const p of patterns) if (p.test(text)) score++;
    }
    if (score > best.score) best = { id, score };
  }
  return best.id;
}

/** Use the AI's category if it's valid, otherwise fall back to keywords. */
function normalizeCategory(aiCategory, item) {
  const id = typeof aiCategory === "string" ? aiCategory.trim().toLowerCase() : "";
  if (CATEGORY_IDS.includes(id) && id !== "other") return id;
  const guess = guessCategory(item);
  return guess !== "other" ? guess : CATEGORY_IDS.includes(id) ? id : "other";
}

module.exports = {
  CATEGORIES,
  CATEGORY_IDS,
  CATEGORY_PROMPT_LIST,
  guessCategory,
  normalizeCategory,
};
