"use client";

// Thin wrapper so KnowledgeGraph can load the canvas with next/dynamic
// (ssr: false — it needs `window`) and still get a ref to the graph instance.
import ForceGraph2D from "react-force-graph-2d";

export default function GraphCanvas({ graphRef, ...props }: any) {
  return <ForceGraph2D ref={graphRef} {...props} />;
}
