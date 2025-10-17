// netlify/functions/cancel-booking.js
import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const user = context.clientContext?.user || null;
  const { slot_iso } = await req.json();
  const email = (user?.email || '').toLowerCase();
  if (!email || !slot_iso) return Response.json({ ok:false, error:'Bad request' }, { status:400 });

  const store = getStore({ name: 'bookings' });
  await store.delete(`slot/${slot_iso}/${email}`);
  await store.delete(`user/${email}/${slot_iso}`);

  return Response.json({ ok:true });
};
