"use client";

import type { ArchitectureBlueprint } from "@/data/portfolio";

interface ArchitectureDiagramProps {
  readonly blueprint: ArchitectureBlueprint;
}

/**
 * Editorial SVG/HTML System Architecture Blueprint diagram.
 * Renders the 4-layer data flow (CLIENT -> GATEWAY/API -> DATA STORE -> INTEGRATION)
 * with zero "AI slop" decorations—strictly Swiss technical grid & monospace telemetry.
 */
export function ArchitectureDiagram({ blueprint }: ArchitectureDiagramProps) {
  return (
    <div className="border border-border-subtle bg-bg-elevated p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3.5">
        <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
          <span className="h-2 w-2 bg-accent-primary" aria-hidden="true" />
          <span>SYSTEM ARCHITECTURE BLUEPRINT // DATA FLOW</span>
        </div>
        <span className="font-mono text-[11px] text-text-secondary">
          {blueprint.nodes.length} NODES · {blueprint.connections.length} CHANNELS
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-text-secondary">
        {blueprint.summary}
      </p>

      {/* Architectural Nodes Grid */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {blueprint.nodes.map((node, index) => (
          <div
            key={node.id}
            className="flex flex-col justify-between border border-border-subtle bg-bg-primary p-4 transition-colors duration-150 hover:border-border-strong"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] tracking-wider text-accent-primary">
                  {`0${index + 1} // ${node.layer}`}
                </span>
                <span className="border border-border-subtle bg-bg-elevated px-2 py-0.5 font-mono text-[10px] text-text-secondary">
                  {node.tech}
                </span>
              </div>
              <h4 className="mt-2 text-sm font-medium text-text-primary">
                {node.title}
              </h4>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">
              {node.description}
            </p>
          </div>
        ))}
      </div>

      {/* Protocol Connections Matrix */}
      <div className="mt-4 border-t border-border-subtle pt-4">
        <p className="font-mono text-[11px] text-text-muted">
          PROTOCOL &amp; TRANSPORT CHANNELS
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {blueprint.connections.map((conn, idx) => {
            const fromNode = blueprint.nodes.find((n) => n.id === conn.from);
            const toNode = blueprint.nodes.find((n) => n.id === conn.to);
            return (
              <div
                key={`${conn.from}-${conn.to}-${idx}`}
                className="inline-flex flex-wrap items-center gap-1.5 border border-border-subtle bg-bg-primary px-2.5 py-1.5 font-mono text-[11px] text-text-secondary"
              >
                <span className="text-text-primary">
                  {fromNode ? fromNode.layer : conn.from}
                </span>
                <span className="text-accent-primary" aria-hidden="true">
                  →
                </span>
                <span className="text-text-primary">
                  {toNode ? toNode.layer : conn.to}
                </span>
                <span className="text-text-muted">({conn.label}</span>
                {conn.protocol ? (
                  <span className="text-accent-emerald">· {conn.protocol})</span>
                ) : (
                  <span className="text-text-muted">)</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
