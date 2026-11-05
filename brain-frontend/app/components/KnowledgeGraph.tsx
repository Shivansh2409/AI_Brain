// app/components/KnowledgeGraph.tsx
"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Link2,
  Maximize,
  Minus,
  Network,
  Orbit,
  Plus,
  Shapes,
  X,
} from "lucide-react";
import {
  CORE_COLOR,
  ITEM_TYPES,
  TOPIC_COLOR,
  formatDate,
  isWebUrl,
  typeMeta,
} from "../lib/itemTypes";
import { CategoryBadge, TypeBadge } from "./ItemCard";
import { CATEGORIES, categoryMeta } from "../lib/categories";

const GraphCanvas = dynamic(() => import("./GraphCanvas"), { ssr: false });

/* ------------------------------------------------------------------ types */

type Mode = "categories" | "topics" | "network";
type NodeKind = "core" | "item" | "topic";
type LinkKind = "core" | "topic" | "manual" | "similar";

interface GNode {
  id: string;
  kind: NodeKind;
  label: string;
  color: string;
  size: number; // radius in graph units
  item?: any;
  count?: number; // topic: number of items
  share?: number; // topic: % of items
  group?: "tag" | "category"; // what a hub node represents
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface GLink {
  source: string | GNode;
  target: string | GNode;
  kind: LinkKind;
}

const CORE_ID = "__core__";
const MAX_TOPICS = 8;
const TOPICS_PER_ITEM = 2;
const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

/* ------------------------------------------------------------ graph data */

const normTag = (t: string) => t.trim().toLowerCase();
const idOf = (end: string | GNode) => (typeof end === "object" ? end.id : end);

function itemNode(item: any): GNode {
  return {
    id: item._id,
    kind: "item",
    label: item.title || "Untitled",
    color: typeMeta(item.itemType).color,
    size: 5 + Math.min(item.linkedItems?.length ?? 0, 4),
    item,
  };
}

function manualLinks(items: any[]): GLink[] {
  const ids = new Set(items.map((i) => i._id));
  const seen = new Set<string>();
  const links: GLink[] = [];
  for (const item of items) {
    for (const other of item.linkedItems ?? []) {
      const otherId = String(other);
      if (!ids.has(otherId) || otherId === item._id) continue;
      const key = [item._id, otherId].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({ source: item._id, target: otherId, kind: "manual" });
    }
  }
  return links;
}

/** Brain at the centre → most common tags as topic hubs → items around them. */
function buildTopicGraph(items: any[]) {
  const tagCounts = new Map<string, number>();
  for (const item of items) {
    for (const tag of new Set((item.tags ?? []).map(normTag))) {
      if (tag) tagCounts.set(tag as string, (tagCounts.get(tag as string) ?? 0) + 1);
    }
  }
  const topics = [...tagCounts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TOPICS);
  const topicRank = new Map(topics.map(([tag], i) => [tag, i]));

  const nodes: GNode[] = [
    {
      id: CORE_ID,
      kind: "core",
      label: "Your Brain",
      color: CORE_COLOR,
      size: 16,
      fx: 0,
      fy: 0,
    },
    ...topics.map(([tag, count]) => ({
      id: `topic:${tag}`,
      kind: "topic" as const,
      label: tag,
      color: TOPIC_COLOR,
      size: 8 + Math.min(count, 10) * 0.6,
      count,
      share: Math.round((count / items.length) * 100),
      group: "tag" as const,
    })),
    ...items.map(itemNode),
  ];

  const links: GLink[] = topics.map(([tag]) => ({
    source: CORE_ID,
    target: `topic:${tag}`,
    kind: "core",
  }));

  for (const item of items) {
    const itemTopics = [...new Set((item.tags ?? []).map(normTag))]
      .filter((t) => topicRank.has(t as string))
      .sort((a, b) => topicRank.get(a as string)! - topicRank.get(b as string)!)
      .slice(0, TOPICS_PER_ITEM);
    if (itemTopics.length === 0) {
      links.push({ source: CORE_ID, target: item._id, kind: "core" });
    }
    for (const t of itemTopics) {
      links.push({ source: `topic:${t}`, target: item._id, kind: "topic" });
    }
  }

  return { nodes, links: [...links, ...manualLinks(items)] };
}

/** Brain at the centre → one hub per category → items in that category. */
function buildCategoryGraph(items: any[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const id = categoryMeta(item.category).id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const nodes: GNode[] = [
    { id: CORE_ID, kind: "core", label: "Your Brain", color: CORE_COLOR, size: 16, fx: 0, fy: 0 },
    // keep the canonical category order so colours/positions feel stable
    ...CATEGORIES.filter((c) => counts.has(c.id)).map((c) => {
      const count = counts.get(c.id)!;
      return {
        id: `category:${c.id}`,
        kind: "topic" as const,
        label: c.label,
        color: c.color,
        size: 8 + Math.min(count, 12) * 0.6,
        count,
        share: Math.round((count / items.length) * 100),
        group: "category" as const,
      };
    }),
    ...items.map(itemNode),
  ];

  const links: GLink[] = [
    ...[...counts.keys()].map((id) => ({
      source: CORE_ID,
      target: `category:${id}`,
      kind: "core" as const,
    })),
    ...items.map((item) => ({
      source: `category:${categoryMeta(item.category).id}`,
      target: item._id,
      kind: "topic" as const,
    })),
  ];

  return { nodes, links: [...links, ...manualLinks(items)] };
}

/** Items only, each joined to its few most similar items (shared tags). */
function buildNetworkGraph(items: any[]) {
  const tagSets = items.map((i) => new Set((i.tags ?? []).map(normTag)));
  const seen = new Set<string>();
  const links: GLink[] = [];

  items.forEach((item, i) => {
    const scored: { j: number; shared: number }[] = [];
    items.forEach((_, j) => {
      if (i === j) return;
      let shared = 0;
      for (const t of tagSets[i]) if (tagSets[j].has(t)) shared++;
      if (shared >= 2) scored.push({ j, shared });
    });
    scored
      .sort((a, b) => b.shared - a.shared)
      .slice(0, 3)
      .forEach(({ j }) => {
        const key = [item._id, items[j]._id].sort().join("|");
        if (seen.has(key)) return;
        seen.add(key);
        links.push({ source: item._id, target: items[j]._id, kind: "similar" });
      });
  });

  // manual links win over "similar" for the same pair
  const manual = manualLinks(items);
  const manualKeys = new Set(
    manual.map((l) => [idOf(l.source), idOf(l.target)].sort().join("|")),
  );
  return {
    nodes: items.map(itemNode),
    links: [
      ...links.filter(
        (l) => !manualKeys.has([idOf(l.source), idOf(l.target)].sort().join("|")),
      ),
      ...manual,
    ],
  };
}

/* ---------------------------------------------------------------- canvas */

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex: string, a: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function shade(hex: string, amount: number) {
  // amount < 0 darkens, > 0 lightens
  const [r, g, b] = hexToRgb(hex).map((c) =>
    Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount),
  );
  return `rgb(${r},${g},${b})`;
}

/** A glossy glowing sphere. */
function drawOrb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  glow: number,
) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.28, shade(color, 0.25));
  g.addColorStop(0.75, color);
  g.addColorStop(1, shade(color, -0.55));
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

/** Gold core with a ring of radiating ticks. */
function drawCore(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  scale: number,
) {
  ctx.save();
  ctx.strokeStyle = rgba(CORE_COLOR, 0.55);
  ctx.lineWidth = 1 / scale;
  const ticks = 64;
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2;
    const inner = r * 1.25;
    const outer = inner + (i % 4 === 0 ? r * 0.55 : r * 0.28);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner);
    ctx.lineTo(x + Math.cos(a) * outer, y + Math.sin(a) * outer);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x, y, r * 2, 0, Math.PI * 2);
  ctx.strokeStyle = rgba(CORE_COLOR, 0.12);
  ctx.stroke();
  ctx.restore();
  drawOrb(ctx, x, y, r, CORE_COLOR, 40);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const truncate = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;

const LINK_COLORS: Record<LinkKind, string> = {
  core: "rgba(251,191,36,0.42)",
  topic: "rgba(94,234,212,0.24)",
  manual: "rgba(251,191,36,0.9)",
  similar: "rgba(167,139,250,0.22)",
};

/* -------------------------------------------------------------- component */

interface KnowledgeGraphProps {
  items: any[];
  onItemLink?: (item: any) => void;
}

export default function KnowledgeGraph({ items, onItemLink }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [mode, setMode] = useState<Mode>("categories");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const fittedRef = useRef(false);
  // Canvas can't use CSS variables, so copy the page's resolved font stack (Geist)
  const fontRef = useRef(FONT);

  // Track the container size so the canvas always fills it
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    fontRef.current = getComputedStyle(el).fontFamily || FONT;
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(
    () =>
      mode === "categories"
        ? buildCategoryGraph(items)
        : mode === "topics"
          ? buildTopicGraph(items)
          : buildNetworkGraph(items),
    [items, mode],
  );

  const nodeById = useMemo(
    () => new Map(graphData.nodes.map((n) => [n.id, n])),
    [graphData],
  );

  // neighbours of every node, for hover/selection highlighting
  const neighbours = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const l of graphData.links) {
      const a = idOf(l.source);
      const b = idOf(l.target);
      if (!map.has(a)) map.set(a, new Set());
      if (!map.has(b)) map.set(b, new Set());
      map.get(a)!.add(b);
      map.get(b)!.add(a);
    }
    return map;
  }, [graphData]);

  // Re-fit the view once the layout settles after the data or mode changes.
  // (A selection that no longer exists simply resolves to nothing below.)
  useEffect(() => {
    fittedRef.current = false;
  }, [graphData]);

  // The canvas loads asynchronously, so configure the physics the moment the
  // graph instance exists. The accessors are re-read whenever data changes.
  // Strong repulsion for hubs, short links from topics to their items.
  const attachGraph = useCallback((fg: any) => {
    graphRef.current = fg;
    if (!fg) return;
    fg.d3Force("charge")?.strength((n: GNode) =>
      n.kind === "core" ? -900 : n.kind === "topic" ? -380 : -70,
    );
    fg.d3Force("link")
      ?.distance((l: GLink) =>
        l.kind === "core" ? 150 : l.kind === "topic" ? 55 : l.kind === "manual" ? 45 : 70,
      )
      .strength((l: GLink) => (l.kind === "topic" ? 0.5 : l.kind === "similar" ? 0.15 : 0.7));
    fg.d3ReheatSimulation();
  }, []);

  const focusId = hoverId ?? selectedId;
  const focusSet = focusId ? neighbours.get(focusId) : undefined;

  const isDimmed = useCallback(
    (id: string) => !!focusId && id !== focusId && !focusSet?.has(id),
    [focusId, focusSet],
  );

  const paintNode = useCallback(
    (node: GNode, ctx: CanvasRenderingContext2D, scale: number) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const r = node.size;
      const focused = node.id === focusId;
      ctx.globalAlpha = isDimmed(node.id) ? 0.15 : 1;

      if (node.kind === "core") {
        drawCore(ctx, x, y, r, scale);
      } else {
        if (node.kind === "topic") {
          ctx.beginPath();
          ctx.arc(x, y, r * 1.45, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(node.color, 0.35);
          ctx.lineWidth = 1 / scale;
          ctx.stroke();
        }
        drawOrb(ctx, x, y, r, node.color, node.kind === "topic" ? 22 : 12);
      }

      if (focused || node.id === selectedId) {
        ctx.beginPath();
        ctx.arc(x, y, r + 4 / scale, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 1.5 / scale;
        ctx.stroke();
      }

      // Labels: always for the core/topics. Items get labels when zoomed in,
      // when focused, or in Network mode (no topic labels to orient by) when
      // the graph is small enough not to turn into a wall of text.
      const showLabel =
        node.kind !== "item" ||
        scale > 1.7 ||
        focused ||
        (!!focusId && !isDimmed(node.id)) ||
        (mode === "network" && !focusId && graphData.nodes.length <= 40);
      if (showLabel) {
        const fontSize = (node.kind === "core" ? 13 : node.kind === "topic" ? 12 : 11) / scale;
        ctx.font = `${node.kind === "item" ? 500 : 600} ${fontSize}px ${fontRef.current}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const lx = x + r * (node.kind === "core" ? 2.3 : 1.6) + 4 / scale;
        const ly = node.kind === "topic" ? y - 5 / scale : y;
        const text = truncate(node.label, node.kind === "item" ? 36 : 28);

        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 6;
        ctx.fillStyle = "rgba(244,244,245,0.95)";
        ctx.fillText(text, lx, ly);
        ctx.shadowBlur = 0;

        if (node.kind === "topic") {
          const badge = `${node.count} · ${node.share}%`;
          const bfs = 9.5 / scale;
          ctx.font = `600 ${bfs}px ${fontRef.current}`;
          const w = ctx.measureText(badge).width + 8 / scale;
          const h = bfs + 5 / scale;
          const by = y + 5 / scale;
          roundRect(ctx, lx, by, w, h, 3 / scale);
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.fill();
          ctx.fillStyle = "rgba(212,212,216,0.9)";
          ctx.fillText(badge, lx + 4 / scale, by + h / 2);
        }
      }
      ctx.globalAlpha = 1;
    },
    [focusId, selectedId, isDimmed, mode, graphData.nodes.length],
  );

  const linkColor = useCallback(
    (l: GLink) => {
      const base = LINK_COLORS[l.kind];
      if (!focusId) return base;
      const touches = idOf(l.source) === focusId || idOf(l.target) === focusId;
      return touches ? base.replace(/[\d.]+\)$/, "0.95)") : "rgba(255,255,255,0.03)";
    },
    [focusId],
  );

  const zoomBy = (factor: number) => {
    const fg = graphRef.current;
    if (fg) fg.zoom(fg.zoom() * factor, 300);
  };
  const fit = () => graphRef.current?.zoomToFit(600, 70);

  const selected = selectedId ? nodeById.get(selectedId) : undefined;

  const selectNode = (id: string) => {
    setSelectedId(id);
    const n = nodeById.get(id);
    if (n?.x !== undefined && n?.y !== undefined) {
      graphRef.current?.centerAt(n.x, n.y, 600);
    }
  };

  const stats = useMemo(() => {
    const count = (k: LinkKind) => graphData.links.filter((l) => l.kind === k).length;
    return [
      { label: "Items", value: items.length },
      {
        label: mode === "network" ? "Similar pairs" : mode === "topics" ? "Topics" : "Categories",
        value: mode !== "network"
          ? graphData.nodes.filter((n) => n.kind === "topic").length
          : count("similar"),
      },
      { label: "Your links", value: count("manual") },
    ];
  }, [graphData, items.length, mode]);

  return (
    <div
      ref={containerRef}
      className="relative h-[calc(100vh-9rem)] min-h-[560px] w-full overflow-hidden rounded-3xl border border-white/8 bg-[radial-gradient(ellipse_at_50%_45%,#0f2422_0%,#081413_40%,#050507_85%)]"
    >
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-60" />

      {items.length === 0 ? (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <div>
            <p className="text-lg font-semibold text-zinc-100">Your graph is empty</p>
            <p className="mt-1 text-sm text-zinc-400">
              Saved items and their connections will appear here.
            </p>
          </div>
        </div>
      ) : (
        size.width > 0 && (
          <GraphCanvas
            graphRef={attachGraph}
            width={size.width}
            height={size.height}
            graphData={graphData}
            backgroundColor="rgba(0,0,0,0)"
            nodeRelSize={1}
            nodeVal={(n: GNode) => (n.size + 3) ** 2}
            nodeCanvasObject={paintNode}
            nodeLabel={() => ""}
            linkColor={linkColor}
            linkWidth={(l: GLink) => (l.kind === "manual" ? 1.6 : l.kind === "core" ? 1.1 : 0.8)}
            linkCurvature={(l: GLink) => (l.kind === "similar" ? 0.15 : 0)}
            linkDirectionalParticles={(l: GLink) => (l.kind === "manual" ? 3 : l.kind === "core" ? 1 : 0)}
            linkDirectionalParticleWidth={(l: GLink) => (l.kind === "manual" ? 2.5 : 1.6)}
            linkDirectionalParticleSpeed={0.004}
            linkDirectionalParticleColor={() => CORE_COLOR}
            cooldownTicks={150}
            onEngineStop={() => {
              if (!fittedRef.current) {
                fittedRef.current = true;
                fit();
              }
            }}
            onNodeHover={(n: GNode | null) => setHoverId(n?.id ?? null)}
            onNodeClick={(n: GNode) => (n.kind === "core" ? setSelectedId(null) : selectNode(n.id))}
            onBackgroundClick={() => setSelectedId(null)}
          />
        )
      )}

      {/* Toolbar */}
      <div className="glass absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-2xl p-1">
        {(
          [
            { id: "categories", label: "Categories", icon: Shapes },
            { id: "topics", label: "Tags", icon: Orbit },
            { id: "network", label: "Network", icon: Network },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            aria-pressed={mode === id}
            title={
              id === "categories"
                ? "Group items by category (Tech, Design, AI…)"
                : id === "topics"
                  ? "Group items around their most common tags"
                  : "Connect items that share tags"
            }
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-medium transition ${
              mode === id ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-white/10" />
        {(
          [
            { label: "Zoom in", icon: Plus, factor: 1.4 },
            { label: "Zoom out", icon: Minus, factor: 1 / 1.4 },
            { label: "Fit to screen", icon: Maximize, factor: 0 },
          ] as const
        ).map(({ label, icon: Icon, factor }) => (
          <button
            key={label}
            onClick={() => (factor ? zoomBy(factor) : fit())}
            title={label}
            aria-label={label}
            className="grid h-8 w-8 place-items-center rounded-xl text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            <Icon size={15} />
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="glass absolute bottom-4 left-4 hidden rounded-2xl px-4 py-3 sm:block">
        <p className="mb-2 text-[10px] font-semibold tracking-[0.14em] text-zinc-500 uppercase">
          Legend
        </p>
        <ul className="space-y-1.5 text-xs text-zinc-300">
          {mode !== "network" && (
            <>
              <LegendDot color={CORE_COLOR} label="Your brain" />
              <LegendDot
                color={mode === "categories" ? "#60a5fa" : TOPIC_COLOR}
                label={mode === "categories" ? "Category (own colour)" : "Tag"}
              />
            </>
          )}
          {Object.values(ITEM_TYPES).map((t) => (
            <LegendDot key={t.label} color={t.color} label={t.label} />
          ))}
          <li className="flex items-center gap-2 pt-1">
            <span className="h-px w-4 bg-amber-300" />
            Your link
          </li>
        </ul>
      </div>

      {/* Stats */}
      <div className="glass absolute right-4 bottom-4 flex gap-5 rounded-2xl px-4 py-3">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-[10px] font-medium tracking-wide text-zinc-500 uppercase">
              {s.label}
            </p>
            <p className="text-lg font-semibold text-zinc-100 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <aside className="glass absolute top-4 right-4 bottom-24 flex w-[min(20rem,calc(100%-2rem))] flex-col overflow-hidden rounded-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-white/6 p-4">
            {selected.kind === "topic" ? (
              <div>
                <p className="text-[10px] font-semibold tracking-[0.14em] uppercase" style={{ color: selected.color }}>
                  {selected.group === "category" ? "Category" : "Tag"}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  {selected.group === "category" ? selected.label : `#${selected.label}`}
                </h3>
                <p className="text-xs text-zinc-400">
                  {selected.count} items · {selected.share}% of your library
                </p>
              </div>
            ) : (
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <TypeBadge type={selected.item?.itemType} />
                  <CategoryBadge category={selected.item?.category} />
                  <span className="text-xs text-zinc-500">
                    {formatDate(selected.item?.createdAt)}
                  </span>
                </div>
                <h3 className="mt-2 text-[15px] leading-snug font-semibold text-white">
                  {selected.label}
                </h3>
              </div>
            )}
            <button
              onClick={() => setSelectedId(null)}
              aria-label="Close"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
            {selected.kind === "topic" ? (
              <ul className="space-y-1">
                {[...(neighbours.get(selected.id) ?? [])]
                  .map((id) => nodeById.get(id))
                  .filter((n): n is GNode => n?.kind === "item")
                  .map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => selectNode(n.id)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-zinc-300 hover:bg-white/5 hover:text-white"
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: n.color }}
                        />
                        <span className="line-clamp-1">{n.label}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            ) : (
              <>
                {selected.item?.summary && (
                  <p className="leading-relaxed text-zinc-300">{selected.item.summary}</p>
                )}
                {selected.item?.userNote && (
                  <p className="border-l-2 border-fuchsia-400/50 pl-3 text-zinc-300 italic">
                    “{selected.item.userNote}”
                  </p>
                )}
                {selected.item?.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selected.item.tags.slice(0, 12).map((t: string) => (
                      <span
                        key={t}
                        className="rounded-full border border-white/7 bg-white/3 px-2 py-0.5 text-[11px] text-zinc-400"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {selected.kind === "item" && (
            <div className="flex gap-2 border-t border-white/6 p-3">
              {isWebUrl(selected.item?.url) && (
                <a
                  href={selected.item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-white px-3 py-2 text-[13px] font-medium text-black hover:bg-zinc-200"
                >
                  Open <ArrowUpRight size={14} />
                </a>
              )}
              {onItemLink && (
                <button
                  onClick={() => onItemLink(selected.item)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-[13px] font-medium text-zinc-200 hover:bg-white/8"
                >
                  <Link2 size={14} /> Connect
                </button>
              )}
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 30%, #fff 0%, ${color} 45%, ${color} 100%)`,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      {label}
    </li>
  );
}
