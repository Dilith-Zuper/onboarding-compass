'use client';

import { useEffect, useRef, useState } from 'react';

export type RenameKind = 'category' | 'status';
export type RenameStatus = 'idle' | 'saving' | 'saved';

export interface StoredRename {
  newName: string;
  originalName: string;
}

export function renameQuestionId(kind: RenameKind, uid: string): string {
  return `__rename:${kind}:${uid}`;
}

/**
 * Pull every existing rename for a given kind out of the wizard's merged answers map.
 * Returns a uid → StoredRename map.
 */
export function getRenamesByKind(
  answers: Record<string, any>,
  kind: RenameKind
): Record<string, StoredRename> {
  const out: Record<string, StoredRename> = {};
  const prefix = `__rename:${kind}:`;
  for (const key of Object.keys(answers)) {
    if (!key.startsWith(prefix)) continue;
    const value = answers[key];
    if (
      value &&
      typeof value === 'object' &&
      typeof value.newName === 'string' &&
      typeof value.originalName === 'string'
    ) {
      out[key.slice(prefix.length)] = value as StoredRename;
    }
  }
  return out;
}

interface UseRenameArgs {
  token: string;
  kind: RenameKind;
  uid: string;
  originalName: string;
  initialNewName?: string;
  isPreview: boolean;
  onPersisted?: (rename: StoredRename | null) => void;
}

/**
 * Manages a single rename's edit state + debounced persistence via the existing
 * `/api/customer/[token]/response` endpoint. The wizard already reads these
 * responses on load, so on next mount the rename re-hydrates automatically.
 */
export function useRename({
  token,
  kind,
  uid,
  originalName,
  initialNewName,
  isPreview,
  onPersisted,
}: UseRenameArgs) {
  const [value, setValue] = useState<string>(initialNewName ?? originalName);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<RenameStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const isRenamed = (initialNewName ?? '').trim().length > 0 && (initialNewName ?? '') !== originalName;

  function persist(next: string) {
    if (isPreview) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = next.trim();
    const questionId = renameQuestionId(kind, uid);

    setStatus('saving');
    debounceRef.current = setTimeout(async () => {
      const isClearing = !trimmed || trimmed === originalName;
      const body = isClearing
        ? { question_id: questionId, answer: null }
        : { question_id: questionId, answer: { newName: trimmed, originalName } };

      try {
        await fetch(`/api/customer/${token}/response`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        setStatus('saved');
        onPersisted?.(isClearing ? null : { newName: trimmed, originalName });
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setStatus('idle'), 1500);
      } catch {
        setStatus('idle');
      }
    }, 500);
  }

  function startEdit() {
    setIsEditing(true);
  }

  function commit() {
    setIsEditing(false);
    const trimmed = value.trim();
    if (trimmed === (initialNewName ?? originalName)) return;
    persist(trimmed || originalName);
  }

  function cancel() {
    setValue(initialNewName ?? originalName);
    setIsEditing(false);
  }

  return {
    value,
    setValue,
    isEditing,
    startEdit,
    commit,
    cancel,
    status,
    isRenamed,
  };
}
