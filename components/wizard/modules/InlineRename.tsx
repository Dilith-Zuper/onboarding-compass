'use client';

import { useEffect, useRef } from 'react';
import { useRename, type RenameKind, type StoredRename } from './useRename';

interface Props {
  token: string;
  kind: RenameKind;
  uid: string;
  originalName: string;
  storedRename?: StoredRename;
  isPreview: boolean;
  /** Tailwind classes for the displayed name text (e.g. font-bold sizing). */
  textClassName?: string;
  /** Optional callback when a rename is persisted so the parent can update local cache. */
  onPersisted?: (rename: StoredRename | null) => void;
}

export function InlineRename({
  token,
  kind,
  uid,
  originalName,
  storedRename,
  isPreview,
  textClassName = 'text-sm font-bold text-[#1A1A1A]',
  onPersisted,
}: Props) {
  const initialNewName = storedRename?.newName;

  const {
    value,
    setValue,
    isEditing,
    startEdit,
    commit,
    cancel,
    status,
    isRenamed,
  } = useRename({ token, kind, uid, originalName, initialNewName, isPreview, onPersisted });

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div className="flex-1 min-w-0">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
          }}
          className={`w-full bg-orange-50 border border-orange-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-200 ${textClassName}`}
        />
        <p className="text-[10px] text-gray-400 mt-1">
          Enter to save · Esc to cancel
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={isPreview ? undefined : startEdit}
      disabled={isPreview}
      className={`group flex-1 min-w-0 text-left rounded-md -mx-1 px-1 py-0.5 ${
        isPreview ? '' : 'hover:bg-orange-50/60 transition-colors cursor-text'
      }`}
      title={isPreview ? 'Preview mode — edits disabled' : 'Click to rename'}
    >
      <div className="flex items-center gap-1.5">
        <span className={textClassName}>{value}</span>
        {isRenamed && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-orange-700 bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded-full">
            Renamed
          </span>
        )}
        {status === 'saving' && (
          <span className="inline-block w-3 h-3 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
        )}
        {status === 'saved' && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="text-green-600">
            <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {!isPreview && !isEditing && (
          <svg
            width="11" height="11" viewBox="0 0 12 12" fill="none"
            className="text-gray-300 group-hover:text-orange-400 transition-colors shrink-0"
            aria-hidden
          >
            <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      {isRenamed && (
        <p className="text-[10px] text-gray-400 mt-0.5">
          was: <span className="line-through">{originalName}</span>
        </p>
      )}
    </button>
  );
}
