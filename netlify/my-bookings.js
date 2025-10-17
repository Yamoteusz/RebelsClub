// netlify/functions/my-bookings.js
import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  const user = context.clientContext?.user || null;
  const emailParam = new URL(req.url).searchParams.get('email') || '';
  const email = (user?.email || emailParam).toLowerCase();

  if (!email) return Response.json({ ok: false, error: 'No user' }, { status: 401 });

  const store = getStore({ name: 'bookings' });
  const list = await store.list({ prefix: `user/${email}/` });
  const items = [];

  for (const b of (list?.blobs || [])) {
    const data = await store.getJSON(b.key);
    if (data) items.push(data);
  }
  items.sort((a,b) => new Date(a.slot_iso) - new Date(b.slot_iso));

  return Response.json({ ok: true, items });
};
