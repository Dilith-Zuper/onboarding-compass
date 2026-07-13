import { Question, QUESTIONS, SECTIONS, Section, getEffectiveOptions } from './questions';

/**
 * Reserved response keys live alongside real question answers in the same
 * `responses` table / answers object:
 *   __customer_name          — customer's first name from the Welcome step
 *   __rename:<kind>:<uid>    — inline category/status renames
 *   __other:<questionId>     — free text typed when "Other" is selected
 */
export const OTHER_PREFIX = '__other:';

export function isReservedKey(key: string): boolean {
  return key.startsWith('__');
}

export function getOtherText(answers: Record<string, any>, questionId: string): string {
  const v = answers[`${OTHER_PREFIX}${questionId}`];
  return typeof v === 'string' ? v.trim() : '';
}

function isEmptyAnswer(raw: any): boolean {
  if (raw === undefined || raw === null || raw === '') return true;
  if (Array.isArray(raw) && raw.length === 0) return true;
  return false;
}

/**
 * Single source of truth for turning a stored answer into a human-readable
 * string. Handles file uploads, dynamic options (optionsFromQuestion),
 * option labels, and "Other" free text. Returns null when unanswered.
 */
export function formatAnswer(q: Question, answers: Record<string, any>): string | null {
  const raw = answers[q.id];
  if (isEmptyAnswer(raw)) return null;

  if (q.type === 'file_upload') {
    return raw && typeof raw === 'object' && raw.fileName
      ? `${raw.fileName} (uploaded)`
      : 'File uploaded';
  }

  const opts = getEffectiveOptions(q, answers);
  const labelByValue = new Map(opts.map((o) => [o.value, o.label]));

  if (Array.isArray(raw)) {
    const parts = raw
      .filter((v) => v !== 'other')
      .map((v) => labelByValue.get(v) || String(v));
    if (raw.includes('other')) {
      const otherText = getOtherText(answers, q.id);
      parts.push(otherText ? `Other: ${otherText}` : 'Other');
    }
    return parts.join(', ');
  }

  if (typeof raw === 'object') {
    // Unknown object shape — never leak [object Object]
    return JSON.stringify(raw);
  }

  if (opts.length > 0) return labelByValue.get(raw) || String(raw);
  return String(raw);
}

export interface AnsweredItem {
  question: Question;
  display: string;
}

/** All answered questions with display strings, in registry order. */
export function getAnsweredQuestions(answers: Record<string, any>): AnsweredItem[] {
  return QUESTIONS.flatMap((q) => {
    const display = formatAnswer(q, answers);
    return display ? [{ question: q, display }] : [];
  });
}

/** Answered questions grouped by section, preserving SECTIONS order. */
export function getAnsweredBySection(
  answers: Record<string, any>
): Array<{ section: Section; items: AnsweredItem[] }> {
  const all = getAnsweredQuestions(answers);
  return SECTIONS.map((section) => ({
    section,
    items: all.filter((a) => a.question.section === section.id),
  })).filter((g) => g.items.length > 0);
}
