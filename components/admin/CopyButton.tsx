'use client';

import { useState } from 'react';

export function CopyButton({ text, label = 'Copy link' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text.replace(/^﻿/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className={`text-xs font-medium underline underline-offset-2 transition-colors ${
        copied ? 'text-green-600' : 'text-gray-400 hover:text-orange-500'
      }`}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}
