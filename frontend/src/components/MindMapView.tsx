import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { Phase } from "../types/roadmap";

interface Props {
  phases: Phase[];
  title: string;
}

interface MindMapNode {
  name: string;
  children?: MindMapNode[];
  description?: string;
  difficulty?: string;
}

function buildTree(phases: Phase[], title: string): MindMapNode {
  return {
    name: title,
    children: phases.map((phase) => ({
      name: phase.name,
      children: phase.tasks.map((task) => ({
        name: task.title,
        description: task.description,
        difficulty: task.difficulty,
      })),
    })),
  };
}

export default function MindMapView({ phases, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Use container width for responsive sizing
    const containerWidth = containerRef.current.clientWidth;
    const width = Math.max(containerWidth, 600);
    const nodeCount = phases.reduce((sum, p) => sum + p.tasks.length + 1, 0) + 1;
    const height = Math.max(500, nodeCount * 28);
    const margin = { top: 20, right: 160, bottom: 20, left: 140 };

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const treeData = buildTree(phases, title);
    const root = d3.hierarchy(treeData);

    const treeLayout = d3.tree<MindMapNode>().size([
      height - margin.top - margin.bottom,
      width - margin.left - margin.right,
    ]);

    treeLayout(root);

    // Links
    g.selectAll(".link")
      .data(root.links())
      .join("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 1.5)
      .attr("d", (() => {
        const link = d3.linkHorizontal() as any;
        link.x((d: any) => d.y).y((d: any) => d.x);
        return link;
      })() as any);

    // Nodes
    const node = g
      .selectAll(".node")
      .data(root.descendants())
      .join("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

    node
      .append("circle")
      .attr("r", (d) => (d.depth === 0 ? 8 : d.depth === 1 ? 6 : 4))
      .attr("fill", (d) =>
        d.depth === 0 ? "#2563eb" : d.depth === 1 ? "#3b82f6" : "#93c5fd"
      )
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    node
      .append("text")
      .attr("dy", "0.35em")
      .attr("x", (d: any) => (d.children ? -12 : 12))
      .attr("text-anchor", (d: any) => (d.children ? "end" : "start"))
      .text((d) => d.data.name)
      .attr("font-size", (d) => (d.depth === 0 ? "14px" : d.depth === 1 ? "12px" : "11px"))
      .attr("font-weight", (d) => (d.depth <= 1 ? "bold" : "normal"))
      .attr("fill", "#1e293b");
  }, [phases, title]);

  return (
    <div ref={containerRef} className="bg-white rounded-xl p-4 shadow-sm border overflow-x-auto">
      <svg ref={svgRef} className="w-full" style={{ minHeight: "500px" }} />
    </div>
  );
}
