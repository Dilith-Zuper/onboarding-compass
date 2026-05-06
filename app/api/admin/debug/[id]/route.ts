import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createClient } from '@/lib/supabase/server';

const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  if (!token) return false;
  try { await jwtVerify(token, secret); return true; } catch { return false; }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const { data: session } = await supabase
    .from('sessions')
    .select('zuper_api_key, dc_region')
    .eq('id', params.id)
    .single();

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const base   = `https://${session.dc_region}.zuperpro.com/api`;
  const headers = { 'x-api-key': session.zuper_api_key };

  // 1. Get categories to find first category + status UIDs
  const catRes  = await fetch(`${base}/jobs/category?populate_statuses=true`, { headers });
  const catJson = await catRes.json();
  const firstCat = catJson?.data?.[0];

  // 2. Raw checklist for first category × first status
  let rawChecklist: any = null;
  let rawChecklistAlt: any = null;
  if (firstCat) {
    const catUid = firstCat.category_uid;
    const statUid = firstCat.job_statuses?.[0]?.status_uid;
    if (statUid) {
      const clRes = await fetch(`${base}/settings/checklist?category_uid=${catUid}&job_status_uid=${statUid}`, { headers });
      rawChecklist = await clRes.json();
    }
    // Try second status too
    const statUid2 = firstCat.job_statuses?.[1]?.status_uid;
    if (statUid2) {
      const clRes2 = await fetch(`${base}/settings/checklist?category_uid=${catUid}&job_status_uid=${statUid2}`, { headers });
      rawChecklistAlt = await clRes2.json();
    }
  }

  // 3. Raw notification (first one)
  const notifRes  = await fetch(`${base}/customer_notification?count=5&page=1`, { headers });
  const notifJson = await notifRes.json();
  const firstNotif = notifJson?.data?.[0];

  return NextResponse.json({
    category_sample: {
      name: firstCat?.category_name,
      uid: firstCat?.category_uid,
      statuses: firstCat?.job_statuses?.map((s: any) => ({ uid: s.status_uid, name: s.status_name })),
    },
    checklist_status0: {
      status_uid_used: firstCat?.job_statuses?.[0]?.status_uid,
      raw: rawChecklist,
    },
    checklist_status1: {
      status_uid_used: firstCat?.job_statuses?.[1]?.status_uid,
      raw: rawChecklistAlt,
    },
    notification_sample: firstNotif,
  });
}
