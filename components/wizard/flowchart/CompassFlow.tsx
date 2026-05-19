'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  MarkerType,
} from '@xyflow/react';
// CSS imported globally in app/layout.tsx
import { computeFlowVariant } from '@/lib/flow/variants';
import { nodeTypes, type CompassNode } from './FlowNodes';
import {
  deriveNotificationsFromAnswers,
  getAlwaysOnNotifications,
  groupNotificationsByNode,
  type DerivedNotification,
} from '@/lib/notifications/derive';

interface Props {
  answers: Record<string, any>;
  onNodeClick?: (label: string, description: string, notifications?: DerivedNotification[]) => void;
  className?: string;
}

export function CompassFlow({ answers, onNodeClick, className }: Props) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const variant = computeFlowVariant(answers);
  const variantNodes = variant.nodes;

  // Compute notifications per flow node — answers-driven + always-on defaults
  const allNotifs = [
    ...deriveNotificationsFromAnswers(answers),
    ...getAlwaysOnNotifications(answers),
  ];
  const notifsByNode = groupNotificationsByNode(allNotifs);

  useEffect(() => {
    setRevealedIds(new Set());
    variantNodes.forEach((n, i) => {
      setTimeout(() => {
        setRevealedIds((prev) => new Set(Array.from(prev).concat(n.id)));
      }, i * 100);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  const rfNodes: CompassNode[] = variant.nodes
    .filter((n) => revealedIds.has(n.id))
    .map((n) => ({
      id: n.id,
      type: 'compass' as const,
      position: n.position,
      data: {
        label: n.label,
        description: n.description,
        nodeType: n.type,
        isOptional: n.isOptional,
        isExternal: n.isExternal,
        notifications: (notifsByNode[n.id] ?? []).map((x) => ({ title: x.title, channel: x.channel })),
      },
    }));

  const rfEdges: Edge[] = variant.edges
    .filter((e) => revealedIds.has(e.from) && revealedIds.has(e.to))
    .map((e) => ({
      id: `${e.from}-${e.to}`,
      source: e.from,
      target: e.to,
      label: e.label,
      labelStyle: { fontSize: 10, fill: '#9CA3AF', fontWeight: 600 },
      labelBgStyle: { fill: '#FAF9F7', fillOpacity: 0.9 },
      labelBgPadding: [4, 6] as [number, number],
      style: { stroke: '#E5E2DC', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#E5E2DC', width: 16, height: 16 },
    }));

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as { label: string; description: string };
      onNodeClick?.(data.label, data.description, notifsByNode[node.id] ?? []);
    },
    [onNodeClick, notifsByNode]
  );

  return (
    <div className={className ?? 'w-full h-[520px] rounded-2xl overflow-hidden border border-[#E5E2DC] bg-white'}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        panOnScroll={false}
        zoomOnScroll
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#E5E2DC" gap={20} size={1} />
        <Controls showInteractive={false} className="!border-[#E5E2DC] !shadow-none" />
        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={2}
          nodeColor={(node) => {
            const t = (node.data as { nodeType?: string })?.nodeType;
            if (t === 'start' || t === 'end') return '#1A1A1A';
            if (t === 'job') return '#BFDBFE';
            if (t === 'external') return '#BBF7D0';
            if (t === 'integration') return '#FED7AA';
            return '#E9D5FF';
          }}
          maskColor="rgba(250, 249, 247, 0.6)"
          className="!bg-white !border !border-[#E5E2DC] !rounded-xl"
        />
      </ReactFlow>
    </div>
  );
}
