// /.netlify/functions/cancel-booking.js
// Cancels a booking by row number and (optionally) deletes the Google Calendar event.
// ENV:
//  - GOOGLE_SERVICE_ACCOUNT (base64 JSON)
//  - GOOGLE_SHEET_ID
//  - GOOGLE_CALENDAR_ID (calendar to delete event)
// Requires user to be logged in; only allows cancelling own bookings.
const { google } = require('googleapis');

exports.handler = async (event, context) => {
  try {
    if (!context.clientContext || !context.clientContext.user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const userEmail = context.clientContext.user.email;
    const body = JSON.parse(event.body||'{}');
    const { row, eventId } = body;
    if(!row) return { statusCode: 400, body: JSON.stringify({ error: 'Missing row' }) };

    const keyB64 = process.env.GOOGLE_SERVICE_ACCOUNT;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if(!keyB64 || !sheetId) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing env GOOGLE_SERVICE_ACCOUNT/GOOGLE_SHEET_ID' }) };
    }
    const key = JSON.parse(Buffer.from(keyB64, 'base64').toString('utf8'));
    const jwtSheets = new google.auth.JWT(key.client_email, null, key.private_key, ['https://www.googleapis.com/auth/spreadsheets']);
    const sheets = google.sheets({ version: 'v4', auth: jwtSheets });

    // Read the specific row to verify ownership
    const read = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: `A${row}:K${row}` });
    const vals = read.data.values && read.data.values[0];
    if(!vals) return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
    const headerResp = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: 'A1:K1' });
    const header = headerResp.data.values[0];
    const idx = Object.fromEntries(header.map((h,i)=>[h,i]));
    const rowEmail = (vals[idx['user_email']]||'').toLowerCase();
    if(rowEmail !== userEmail.toLowerCase()){
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };
    }

    // Update status to "Anulowane"
    vals[idx['status']] = 'Anulowane';
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `A${row}:K${row}`,
      valueInputOption: 'RAW',
      requestBody: { values: [vals] }
    });

    // Delete Google Calendar event if provided
    const calId = process.env.GOOGLE_CALENDAR_ID;
    const evId = eventId || vals[idx['event_id']];
    if (calId && evId) {
      const jwtCal = new google.auth.JWT(key.client_email, null, key.private_key, ['https://www.googleapis.com/auth/calendar']);
      const calendar = google.calendar({ version: 'v3', auth: jwtCal });
      try { await calendar.events.delete({ calendarId: calId, eventId: evId }); } catch(e){ /* ignore if missing */ }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
