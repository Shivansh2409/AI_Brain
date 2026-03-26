"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useMemo } from "react";

// Dynamically import react-force-graph-2d to avoid Next.js SSR errors
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

export default function KnowledgeGraph({ items }: { items: any[] }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update canvas size to fit the container
  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById("graph-container");
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Process the items into Nodes and Links
  useEffect(() => {
    if (!items || items.length === 0) return;

    const nodes: any[] = [];
    const links: any[] = [];

    // 1. Create Nodes
    items.forEach((item) => {
      nodes.push({
        id: item._id,
        name: item.title,
        val: 5, // Node size
        color: "#3b82f6", // Blue
        ...item,
      });
    });

    // 2. Create Links based on shared tags
    // Compare every node to every other node to see if they share tags
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const tagsA = nodes[i].tags || [];
        const tagsB = nodes[j].tags || [];

        // Find common tags
        const sharedTags = tagsA.filter((tag: string) => tagsB.includes(tag));

        if (sharedTags.length > 0) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            // The more tags they share, the stronger/thicker the link
            value: sharedTags.length,
          });
        }
      }
    }

    setGraphData({ nodes, links });
  }, [items]);

  return (
    <div id="graph-container" className="w-full h-full cursor-move">
      <ForceGraph2D
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel="name"
        nodeColor={(node) => node.color}
        linkColor={() => "#475569"} // Slate-600 line color
        linkWidth={(link) => link.value}
        // Add a nice glow effect and draw the title next to the node
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.fillStyle = node.color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
          ctx.fill();

          ctx.fillStyle = "#cbd5e1"; // Text color
          ctx.fillText(label, node.x + node.val + 2, node.y + fontSize / 3);
        }}
      />
    </div>
  );
}
