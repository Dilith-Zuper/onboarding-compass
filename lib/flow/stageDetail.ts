import type { ZuperCategory, ZuperStatus } from '@/lib/zuper/transformer';

/**
 * Maps flow-chart stage nodes to the customer's REAL job categories from the
 * cached snapshot, so clicking a stage shows their actual status pipeline.
 * Matching is keyword-based (their category might be "Roof Replacement", not
 * "Production") and fails gracefully to null — the detail panel then shows
 * only the generic description.
 */

const NODE_CATEGORY_KEYWORDS: Record<string, string[]> = {
  lead_qualification: ['lead qual', 'qualification', 'lead'],
  inspection:         ['inspect', 'assessment', 'site visit'],
  insurance_claim:    ['insurance', 'claim', 'storm', 'adjuster'],
  cpq:                ['estimat', 'proposal', 'quote', 'cpq'],
  proposal:           ['proposal', 'quote', 'estimat'],
  material_ordering:  ['material', 'order'],
  production:         ['production', 'install', 'replacement', 'repair', 'build'],
  invoicing:          ['invoic', 'billing', 'payment', 'closeout'],
};

export interface StagePipelineStatus {
  uid: string;
  name: string;
  type: string;
  color: string;
  requireSignature: boolean;
  trackTime: boolean;
}

export interface StagePipeline {
  categoryUid: string;
  categoryName: string;
  statuses: StagePipelineStatus[];
}

/** NEW first, terminal statuses last, everything else in account order. */
function statusRank(type: string): number {
  if (type === 'NEW') return 0;
  if (type === 'COMPLETED') return 2;
  if (type === 'CANCELLED') return 3;
  return 1;
}

interface StoredRename {
  newName: string;
  originalName: string;
}

function renameFor(answers: Record<string, any>, kind: 'category' | 'status', uid: string): string | null {
  const v = answers[`__rename:${kind}:${uid}`];
  return v && typeof v === 'object' && typeof v.newName === 'string' ? (v as StoredRename).newName : null;
}

export function getStagePipeline(
  nodeId: string,
  categories: ZuperCategory[] | undefined | null,
  answers: Record<string, any>
): StagePipeline | null {
  const keywords = NODE_CATEGORY_KEYWORDS[nodeId];
  if (!keywords || !categories?.length) return null;

  let match: ZuperCategory | undefined;
  for (const kw of keywords) {
    match = categories.find((c) => c.name?.toLowerCase().includes(kw));
    if (match) break;
  }
  if (!match || !match.statuses.length) return null;

  const sorted = [...match.statuses].sort(
    (a, b) => statusRank(a.type) - statusRank(b.type)
  );

  return {
    categoryUid: match.uid,
    categoryName: renameFor(answers, 'category', match.uid) ?? match.name,
    statuses: sorted.map((s: ZuperStatus) => ({
      uid: s.uid,
      name: renameFor(answers, 'status', s.uid) ?? s.name,
      type: s.type,
      color: s.color,
      requireSignature: s.requireSignature,
      trackTime: s.trackTime,
    })),
  };
}
