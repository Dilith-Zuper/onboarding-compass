'use client';

import { useRef, useState } from 'react';

interface UploadedFile {
  url: string;
  fileName: string;
  uploadedAt: string;
}

interface Props {
  token: string;
  questionId: string;
  value: UploadedFile | null | undefined;
  onChange: (v: UploadedFile | null) => void;
}

export function FileUploadField({ token, questionId, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');

  async function handleFile(file: File) {
    setError('');

    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large — max 10MB.');
      return;
    }

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('questionId', questionId);

    try {
      const res = await fetch(`/api/customer/${token}/upload`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed. Please try again.');
        setUploading(false);
        return;
      }
      onChange({
        url: data.url,
        fileName: data.fileName,
        uploadedAt: new Date().toISOString(),
      });
    } catch {
      setError('Network error during upload.');
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ''; // allow re-selecting same file
  }

  function handleRemove() {
    onChange(null);
    setError('');
  }

  if (value?.url) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 9l3.5 3.5 6.5-7" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Uploaded</p>
          <a
            href={value.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#1A1A1A] hover:text-orange-500 transition-colors truncate block"
          >
            {value.fileName}
          </a>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="text-xs font-semibold text-gray-400 hover:text-orange-500 transition-colors"
        >
          Replace
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full bg-white rounded-2xl border-2 border-dashed border-[#E5E2DC] hover:border-orange-400 disabled:opacity-60 px-5 py-8 transition-all flex flex-col items-center gap-2"
      >
        {uploading ? (
          <>
            <span className="w-5 h-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
            <p className="text-sm font-semibold text-gray-500">Uploading…</p>
          </>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 16V4M5 10l6-6 6 6"/>
              <path d="M3 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
            </svg>
            <p className="text-sm font-semibold text-[#1A1A1A]">Click to upload a file</p>
            <p className="text-xs text-gray-400">PDF, DOCX, PNG, or JPG — up to 10MB</p>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
        onChange={handleChange}
        className="hidden"
      />
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
