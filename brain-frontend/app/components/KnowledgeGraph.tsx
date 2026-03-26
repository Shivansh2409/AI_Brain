// app/components/KnowledgeGraph.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

// Helper to match your Dashboard tab colors
const getNodeColor = (itemType: string) => {
  switch (itemType) {
    case "youtube":
      return "#ef4444"; // Red
    case "pdf":
      return "#ea580c"; // Orange
    case "image":
      return "#a855f7"; // Purple
    case "article":
    default:
      return "#3b82f6"; // Blue
  }
};

export default function KnowledgeGraph({ items }: { items: any[] }) {
  const fgRef = useRef<any>();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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

  useEffect(() => {
    if (!items || items.length === 0) return;

    const nodes: any[] = [];
    const links: any[] = [];

    // 1. Create Nodes with Dynamic Colors
    items.forEach((item) => {
      nodes.push({
        id: item._id,
        name: item.title,
        val: 6,
        color: getNodeColor(item.itemType),
        ...item,
      });
    });

    // 2. Create Links with Manual Flagging
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        const sharedTags = (nodeA.tags || []).filter((tag: string) =>
          (nodeB.tags || []).includes(tag),
        );

        const isManuallyLinked =
          (nodeA.linkedItems && nodeA.linkedItems.includes(nodeB.id)) ||
          (nodeB.linkedItems && nodeB.linkedItems.includes(nodeA.id));

        const THRESHOLD = 1;

        if (sharedTags.length >= THRESHOLD || isManuallyLinked) {
          links.push({
            source: nodeA.id,
            target: nodeB.id,
            value: isManuallyLinked ? 10 : sharedTags.length,
            color: isManuallyLinked ? "#f97316" : "rgba(71, 85, 105, 0.3)", // AI links are more subtle now
            isManual: isManuallyLinked, // We flag this so the graph knows to add moving particles!
          });
        }
      }
    }

    setGraphData({ nodes, links });
  }, [items]);

  useEffect(() => {
    const fg = fgRef.current;
    if (fg && graphData.nodes.length > 0) {
      fg.d3Force("charge").strength(-200);
      fg.d3Force("link").distance((link: any) => 50 / link.value);
    }
  }, [graphData]);

  return (
    <div
      id="graph-container"
      className="w-full h-full cursor-move bg-slate-900 rounded-xl"
    >
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        // --- LINK STYLING ---
        linkColor={(link: any) => link.color}
        linkWidth={(link: any) =>
          link.isManual ? 2 : Math.max(1, link.value / 2)
        }
        // 🌟 Add moving particles to Manual Links to make them look alive!
        linkDirectionalParticles={(link: any) => (link.isManual ? 3 : 0)}
        linkDirectionalParticleWidth={3}
        linkDirectionalParticleSpeed={0.005}
        // --- CUSTOM CANVAS NODE STYLING ---
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 14 / globalScale;
          ctx.font = `600 ${fontSize}px Sans-Serif`;

          // 1. Draw the Node Circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color;
          ctx.fill();

          // 2. Add a dark stroke around the circle so it pops off the lines
          ctx.lineWidth = 2 / globalScale;
          ctx.strokeStyle = "#0f172a"; // Match background
          ctx.stroke();

          // 3. Draw a sleek "Pill" background for the text
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(
            (n) => n + fontSize * 1.2,
          );

          ctx.fillStyle = "rgba(15, 23, 42, 0.75)"; // Semi-transparent dark slate
          ctx.beginPath();

          // Using standard rect drawing for maximum browser compatibility
          const xPos = node.x + node.val + 4 / globalScale;
          const yPos = node.y - bckgDimensions[1] / 2;
          const radius = 4 / globalScale; // border radius

          // Draw rounded rectangle
          ctx.moveTo(xPos + radius, yPos);
          ctx.lineTo(xPos + bckgDimensions[0] - radius, yPos);
          ctx.quadraticCurveTo(
            xPos + bckgDimensions[0],
            yPos,
            xPos + bckgDimensions[0],
            yPos + radius,
          );
          ctx.lineTo(
            xPos + bckgDimensions[0],
            yPos + bckgDimensions[1] - radius,
          );
          ctx.quadraticCurveTo(
            xPos + bckgDimensions[0],
            yPos + bckgDimensions[1],
            xPos + bckgDimensions[0] - radius,
            yPos + bckgDimensions[1],
          );
          ctx.lineTo(xPos + radius, yPos + bckgDimensions[1]);
          ctx.quadraticCurveTo(
            xPos,
            yPos + bckgDimensions[1],
            xPos,
            yPos + bckgDimensions[1] - radius,
          );
          ctx.lineTo(xPos, yPos + radius);
          ctx.quadraticCurveTo(xPos, yPos, xPos + radius, yPos);
          ctx.fill();

          // 4. Draw the actual crisp text on top of the pill
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#f8fafc"; // Crisp white text
          ctx.fillText(label, xPos + fontSize * 0.6, node.y + 1 / globalScale);
        }}
      />
    </div>
  );
}
