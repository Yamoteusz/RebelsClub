// netlify/functions/cancel-booking.js
import { getStore } from '@netlify/blobs';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });

export default async (req, context) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const user = context.clientContext?.user || null;
    const body = await req.json().catch(() => ({}));
    const email = (user?.email || '').toLowerCase();
    const slotISO = body.slot_iso;

    if (!email || !slotISO) return json({ ok:false, error:'Bad request' }, 400);

    const store = getStore({ name: 'bookings' });
    await store.delete(`slot/${slotISO}/${email}`).catch(() => {});
    await store.delete(`user/${email}/${slotISO}`).catch(() => {});

    return json({ ok:true });
  } catch (e) {
    console.error('cancel-booking error:', e);
    return json({ ok:false, error:'Server error' }, 500);
  }
};
