import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Strip BOM and zero-width characters from env-var strings before passing to
 * Headers or other byte-string APIs. Vercel env values pasted from Windows
 * can include a leading U+FEFF which breaks `new Headers()`.
 */
export function cleanEnv(value: string | undefined): string {
  if (!value) return '';
  // U+FEFF = BOM, U+200B/200C/200D = zero-width space/non-joiner/joiner
  return value.replace(/[﻿​‌‍]/g, '').trim();
}
