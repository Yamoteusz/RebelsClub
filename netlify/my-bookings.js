// netlify/functions/my-bookings.js
import { getStore } from '@netlify/blobs';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });

export default async (req) => {
  try {
    const url = new URL(req.url);
    const email = (url.searchParams.get('email') || '').trim().toLowerCase();
    if (!email) return json({ ok: false, error: 'No email' }, 400);

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
