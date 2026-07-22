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
import {
  nodeTypes,
  NODE_WIDTH,
  NODE_WIDTH_COMPACT,
  type CompassNode,
  type CompassGroupNode,
} from './FlowNodes';
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

const EDGE_COLOR = '#A6A195';

/** Fan-out nodes render narrower so wide rows stay tidy. */
function isCompact(id: string): boolean {
  return /^(source_|provider_|supplier_)/.test(id);
}

const ICON_BY_ID: Record<string, string> = {
  lead_or_customer:  'person',
  website_lead:      'calendar',
  zuper_connect:     'phone',
  hubspot_lead:      'link',
  lead_qualification:'clipboard',
  inspection:        'home',
  insurance_claim:   'shield',
  cpq:               'calculator',
  proposal:          'doc',
  material_ordering: 'box',
  production:        'hammer',
  invoicing:         'dollar',
};

function iconFor(id: string): string {
  if (ICON_BY_ID[id]) return ICON_BY_ID[id];
  if (id.startsWith('source_'))   return 'zap';
  if (id.startsWith('provider_')) return 'ruler';
  if (id.startsWith('supplier_')) return 'truck';
  return 'zap';
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

  // Variant positions are CENTER coordinates; convert to top-left per node width
  // so every row shares a true centerline (this is what keeps the spine straight).
  const compassNodes: CompassNode[] = variant.nodes
    .filter((n) => revealedIds.has(n.id))
    .map((n) => {
      const compact = isCompact(n.id);
      const width = compact ? NODE_WIDTH_COMPACT : NODE_WIDTH;
      return {
        id: n.id,
        type: 'compass' as const,
        position: { x: n.position.x - width / 2, y: n.position.y },
        data: {
          label: n.label,
          description: n.description,
          nodeType: n.type,
          isOptional: n.isOptional,
          isExternal: n.isExternal,
          compact,
          iconId: iconFor(n.id),
          notifications: (notifsByNode[n.id] ?? []).map((x) => ({ title: x.title, channel: x.channel })),
        },
      };
    });

  // Dashed "Lead sources" container behind the source fan-out (reference style)
  const rfNodes: Node[] = [...compassNodes];
  const sourceNodes = variant.nodes.filter((n) => n.id.startsWith('source_'));
  if (sourceNodes.length > 1 && sourceNodes.every((n) => revealedIds.has(n.id))) {
    const centers = sourceNodes.map((n) => n.position.x);
    const half = NODE_WIDTH_COMPACT / 2;
    const pad = 20;
    const left = Math.min(...centers) - half - pad;
    const right = Math.max(...centers) + half + pad;
    const top = sourceNodes[0].position.y - pad;
    const group: CompassGroupNode = {
      id: '__group_sources',
      type: 'compassGroup',
      position: { x: left, y: top },
      data: { label: 'Lead sources', width: right - left, height: 64 + pad * 2 },
      selectable: false,
      draggable: false,
      zIndex: -1,
    };
    rfNodes.unshift(group);
  }

  // Same-row edges connect side-to-side; everything else flows top-to-bottom.
  const posById = new Map(variant.nodes.map((n) => [n.id, n.position]));
  const rfEdges: Edge[] = variant.edges
    .filter((e) => revealedIds.has(e.from) && revealedIds.has(e.to))
    .map((e) => {
      const from = posById.get(e.from);
      const to = posById.get(e.to);
      const sameRow = !!from && !!to && Math.abs(from.y - to.y) < 40;
      const targetIsRight = !!from && !!to && to.x > from.x;
      return {
        id: `${e.from}-${e.to}`,
        source: e.from,
        target: e.to,
        sourceHandle: sameRow ? (targetIsRight ? 's-right' : 's-left') : 's-bottom',
        targetHandle: sameRow ? (targetIsRight ? 't-left' : 't-right') : 't-top',
        type: 'smoothstep' as const,
        pathOptions: { borderRadius: 10 },
        label: e.label,
        labelStyle: { fontSize: 10, fill: '#8A857B', fontWeight: 600 },
        labelBgStyle: { fill: '#FAF9F7', fillOpacity: 0.95 },
        labelBgPadding: [4, 6] as [number, number],
        style: { stroke: EDGE_COLOR, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLOR, width: 18, height: 18 },
      };
    });

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type !== 'compass') return;
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
        fitViewOptions={{ padding: 0.15 }}
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
            if (node.type === 'compassGroup') return 'transparent';
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
