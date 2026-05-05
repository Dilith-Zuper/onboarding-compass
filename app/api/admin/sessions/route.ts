import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createClient } from '@/lib/supabase/server';

const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data });
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { org_name, customer_email, sa_email, zuper_api_key, dc_region } = body;

  if (!org_name || !customer_email || !sa_email || !zuper_api_key || !dc_region) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('sessions')
    .insert({ org_name, customer_email, sa_email, zuper_api_key, dc_region })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Trigger snapshot fetch in background (fire-and-forget)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  fetch(`${appUrl}/api/zuper/${data.unique_token}/snapshot`, { method: 'GET' }).catch(() => {});

  return NextResponse.json({ session: data }, { status: 201 });
}
