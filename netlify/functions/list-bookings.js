// /.netlify/functions/list-bookings.js
const { google } = require('googleapis');

exports.handler = async (event, context) => {
  try {
    if (!context.clientContext || !context.clientContext.user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const userEmail = context.clientContext.user.email;
    const keyB64 = process.env.GOOGLE_SERVICE_ACCOUNT;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if(!keyB64 || !sheetId) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing env GOOGLE_SERVICE_ACCOUNT/GOOGLE_SHEET_ID' }) };
    }
    const key = JSON.parse(Buffer.from(keyB64, 'base64').toString('utf8'));
    const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
    const jwt = new google.auth.JWT(key.client_email, null, key.private_key, scopes);
    const sheets = google.sheets({ version: 'v4', auth: jwt });
    const range = 'A:K';
    const resp = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
    const rows = resp.data.values || [];
    const header = rows[0] || [];
    const idx = Object.fromEntries(header.map((h,i)=>[h,i]));
    const items = rows.slice(1).map((r,ix)=>({r, ix: ix+2})) // +2 because sheet rows start at 1 and skip header
      .filter(o => (o.r[idx['user_email']]||'').toLowerCase() === userEmail.toLowerCase())
      .map(o => ({
        row: String(o.ix),
        timestamp: o.r[idx['timestamp']] || '',
        user_email: o.r[idx['user_email']] || '',
        iso: o.r[idx['slot_iso']] || '',
        label: o.r[idx['slot_label']] || '',
        group: o.r[idx['group']] || '',
        coach: o.r[idx['coach']] || '',
        room: o.r[idx['room']] || '',
        capacity: o.r[idx['capacity']] || '',
        status: o.r[idx['status']] || '',
        event_id: o.r[idx['event_id']] || ''
      }));
    return { statusCode: 200, body: JSON.stringify({ items }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
