import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'customer-uploads';
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.webp'];

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient();

  // Verify token maps to a valid session
  const { data: session, error: sessionErr } = await supabase
    .from('sessions')
    .select('id, status')
    .eq('unique_token', params.token)
    .single();

  if (sessionErr || !session) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  }

  if (session.status === 'submitted' || session.status === 'live') {
    return NextResponse.json({ error: 'Session already submitted' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const questionId = formData.get('questionId')?.toString();

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!questionId) return NextResponse.json({ error: 'Missing questionId' }, { status: 400 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 });
  }

  // Server-side extension allowlist (client `accept` is only a hint)
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `File type not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(', ')}` },
      { status: 415 }
    );
  }

  // Sanitise filename. Path uses the session id, NOT the wizard token —
  // the public file URL must never leak wizard access.
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${session.id}/${questionId}/${Date.now()}-${cleanName}`;

  const bytes = await file.arrayBuffer();

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadErr) {
    console.error('Upload failed:', uploadErr);
    return NextResponse.json(
      { error: `Upload failed: ${uploadErr.message}. Make sure the "${BUCKET}" Storage bucket exists in Supabase.` },
      { status: 500 }
    );
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({
    url: publicUrl.publicUrl,
    fileName: file.name,
    path,
  });
}
