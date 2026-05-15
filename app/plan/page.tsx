import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import PlanForm from './PlanForm';

const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);

export default async function PlanPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_token')?.value;

  let saEmail = '';
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      saEmail = (payload.email as string) || '';
    } catch {}
  }

  return <PlanForm saEmail={saEmail} />;
}
