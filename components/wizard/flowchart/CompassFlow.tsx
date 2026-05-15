'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
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

const NODE_POS: Record<string, { x: number; y: number }> = {
  website_lead:       { x: 160, y: 0    },
  lead_in:            { x: 160, y: 110  },
  zuper_connect:      { x: 400, y: 110  },
  hubspot_lead:       { x: 400, y: 220  },
  lead_qualification: { x: 160, y: 220  },
  inspection:         { x: 160, y: 350  },
  insurance_claim:    { x: 400, y: 460  },
  cpq:                { x: 160, y: 570  },
  proposal:           { x: 160, y: 680  },
  production:         { x: 160, y: 790  },
  complete:           { x: 160, y: 900  },
  invoicing:          { x: 160, y: 1010 },
};

interface Props {
  answers: Record<string, any>;
  onNodeClick?: (label: string, description: string, notifications?: DerivedNotification[]) => void;
}

export function CompassFlow({ answers, onNodeClick }: Props) {
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
      }, i * 150);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  const rfNodes: CompassNode[] = variant.nodes
    .filter((n) => revealedIds.has(n.id))
    .map((n) => ({
      id: n.id,
      type: 'compass' as const,
      position: NODE_POS[n.id] ?? { x: 160, y: 0 },
      data: {
        label: n.label,
        description: n.description,
        nodeType: n.type,
        isOptional: n.isOptional,
        isExternal: n.isExternal,
        notificationCount: (notifsByNode[n.id] ?? []).length,
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
    <div className="w-full h-[380px] sm:h-[520px] rounded-2xl overflow-hidden border border-[#E5E2DC] bg-white">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#E5E2DC" gap={20} size={1} />
        <Controls showInteractive={false} className="!border-[#E5E2DC] !shadow-none" />
      </ReactFlow>
    </div>
  );
}
