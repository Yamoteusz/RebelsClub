// netlify/functions/my-bookings.js
import { getStore } from '@netlify/blobs';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });

export default async (req, context) => {
  try {
    const user = context.clientContext?.user || null;
    const emailParam = new URL(req.url).searchParams.get('email') || '';
    const email = (user?.email || emailParam || '').toLowerCase();

    if (!email) return json({ ok: false, error: 'No user' }, 401);

    const store = getStore({ name: 'bookings' });
    const list = await store.list({ prefix: `user/${email}/` });
    const items = [];

    for (const b of list?.blobs || []) {
      const data = await store.getJSON(b.key).catch(() => null);
      if (data) items.push(data);
    }
    items.sort((a, b) => new Date(a.slot_iso) - new Date(b.slot_iso));

    return json({ ok: true, items });
  } catch (e) {
    console.error('my-bookings error:', e);
    return json({ ok: false, error: 'Server error' }, 500);
  }
};
