import type { ZuperCategory, ZuperNotification, ZuperWorkflowSummary } from './transformer';

export interface DiffItem {
  uid: string;
  name: string;
  oldName?: string;
}

export interface ModuleDiff {
  added: DiffItem[];
  removed: DiffItem[];
  renamed: DiffItem[];
}

export interface SnapshotDiff {
  categories: ModuleDiff;
  statuses: ModuleDiff;
  notifications: ModuleDiff;
  workflows: ModuleDiff;
  hasChanges: boolean;
}

function diffByUid<T extends { uid: string; name: string }>(
  original: T[],
  current: T[]
): ModuleDiff {
  const origMap = new Map(original.map((x) => [x.uid, x]));
  const currMap = new Map(current.map((x) => [x.uid, x]));

  const added   = current.filter((c) => !origMap.has(c.uid)).map((c) => ({ uid: c.uid, name: c.name }));
  const removed = original.filter((o) => !currMap.has(o.uid)).map((o) => ({ uid: o.uid, name: o.name }));
  const renamed = current
    .filter((c) => { const o = origMap.get(c.uid); return o && o.name !== c.name; })
    .map((c) => ({ uid: c.uid, name: c.name, oldName: origMap.get(c.uid)!.name }));

  return { added, removed, renamed };
}

export function computeDiff(
  originalSnapshot: { categories: ZuperCategory[]; notifications: ZuperNotification[]; workflows: ZuperWorkflowSummary[] },
  currentSnapshot:  { categories: ZuperCategory[]; notifications: ZuperNotification[]; workflows: ZuperWorkflowSummary[] }
): SnapshotDiff {
  // Flatten statuses from all categories for diffing
  const origStatuses = originalSnapshot.categories.flatMap((c) => c.statuses);
  const currStatuses = currentSnapshot.categories.flatMap((c) => c.statuses);

  const categories    = diffByUid(originalSnapshot.categories,    currentSnapshot.categories);
  const statuses      = diffByUid(origStatuses,                   currStatuses);
  const notifications = diffByUid(originalSnapshot.notifications, currentSnapshot.notifications);
  const workflows     = diffByUid(originalSnapshot.workflows,     currentSnapshot.workflows);

  const hasChanges =
    categories.added.length    > 0 || categories.removed.length    > 0 || categories.renamed.length    > 0 ||
    statuses.added.length      > 0 || statuses.removed.length      > 0 || statuses.renamed.length      > 0 ||
    notifications.added.length > 0 || notifications.removed.length > 0 || notifications.renamed.length > 0 ||
    workflows.added.length     > 0 || workflows.removed.length     > 0 || workflows.renamed.length     > 0;

  return { categories, statuses, notifications, workflows, hasChanges };
}
