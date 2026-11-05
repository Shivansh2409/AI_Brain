// Topic categories (Gemini assigns one per saved item).
// Keep the ids in sync with backend/src/constants/categories.js.
import {
  Briefcase,
  Clapperboard,
  Code,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  Newspaper,
  Palette,
  Shapes,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface Category {
  id: string;
  label: string;
  color: string;
  icon: LucideIcon;
}

export const CATEGORIES: Category[] = [
  { id: "ai", label: "AI & ML", color: "#c084fc", icon: Sparkles },
  { id: "tech", label: "Tech & Dev", color: "#60a5fa", icon: Code },
  { id: "design", label: "Web & UI Design", color: "#f472b6", icon: Palette },
  { id: "business", label: "Business & Startups", color: "#fbbf24", icon: Briefcase },
  { id: "finance", label: "Finance & Crypto", color: "#34d399", icon: Wallet },
  { id: "science", label: "Science", color: "#22d3ee", icon: FlaskConical },
  { id: "learning", label: "Learning & Productivity", color: "#a3e635", icon: GraduationCap },
  { id: "news", label: "News & World", color: "#f87171", icon: Newspaper },
  { id: "health", label: "Health & Fitness", color: "#4ade80", icon: HeartPulse },
  { id: "entertainment", label: "Entertainment", color: "#fb923c", icon: Clapperboard },
  { id: "other", label: "Other", color: "#a1a1aa", icon: Shapes },
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function categoryMeta(id: string | undefined): Category {
  return BY_ID.get(id ?? "other") ?? BY_ID.get("other")!;
}
