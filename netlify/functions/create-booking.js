// netlify/functions/create-booking.js
import { getStore } from '@netlify/blobs';
import { Resend } from 'resend';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });

const MIN_ADVANCE_HOURS = 24;

function icsText({ title, startISO, durationMin = 30, description = '', location = '' }) {
  const start = new Date(startISO);
  const end = new Date(start.getTime() + durationMin * 60000);
  const fmt = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rebels Club//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export default async (req, context) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const user = context.clientContext?.user || null;
    const body = await req.json().catch(() => ({}));

    const email = (body.user_email || user?.email || '').trim().toLowerCase();
    const first = (body.first_name || '').trim();
    const last  = (body.last_name  || '').trim();
    const phone = (body.phone      || '').trim();
    const slotISO = body.slot_iso;
    const slotLabel = body.slot_label || '';
    const group = body.group || 'Trening';
    const coach = body.coach || '';
    const room  = body.room  || '';
    const capacity = Math.max(1, parseInt(body.capacity || '1', 10));

    if (!email || !slotISO) return json({ ok: false, error: 'Missing email or slot' }, 400);

    const cutoff = new Date(Date.now() + MIN_ADVANCE_HOURS * 3600_000);
    if (new Date(slotISO) < cutoff) return json({ ok: false, error: 'Too late for this slot (min 24h).' }, 409);

    const store = getStore({ name: 'bookings' });

    const slotKey = `slot/${slotISO}`;
    const userKey = `user/${email}/${slotISO}`;

    const existing = await store.list({ prefix: `${slotKey}/` });
    if ((existing?.blobs?.length || 0) >= capacity) {
      return json({ ok: false, error: 'Slot full' }, 409);
    }

    const payload = {
      email, first, last, phone,
      slot_iso: slotISO,
      slot_label: slotLabel,
      group, coach, room,
      capacity,
      status: 'Zatwierdzone',
      created_at: new Date().toISOString()
    };

    await store.setJSON(`${slotKey}/${email}`, payload);
    await store.setJSON(userKey, payload);

    try {
      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const ics = icsText({
          title: `Rezerwacja — ${group}`,
          startISO: slotISO,
          durationMin: 30,
          description: `Użytkownik: ${first} ${last} (${email}, tel. ${phone})\nSala: ${room}\nTrener: ${coach}`,
          location: 'Rebels Club, Twardogóra, Plac Piastów 24'
        });

        await resend.emails.send({
          from: 'Rebels Club <kontakt@rebelsclub.pl>',
          to: email,
          subject: `Potwierdzenie rezerwacji — ${group} — ${slotLabel}`,
          html: `<p>Cześć ${first || ''} ${last || ''},</p>
                 <p>Potwierdzamy rezerwację: <strong>${group}</strong>, ${slotLabel}</p>
                 <p>Sala: ${room || '-'} • Trener: ${coach || '-'}</p>
                 <p>Adres: Rebels Club, Twardogóra, Plac Piastów 24</p>`,
          attachments: [{ filename: 'rezerwacja.ics', content: Buffer.from(ics) }]
        });
      }
    } catch (e) {
      console.error('Email error:', e);
    }

    return json({ ok: true });
  } catch (e) {
    console.error('create-booking error:', e);
    return json({ ok: false, error: 'Server error' }, 500);
  }
};
