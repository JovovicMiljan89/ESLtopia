import { createTransport } from 'nodemailer';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const date = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const res = await fetch(
  `${SUPABASE_URL}/rest/v1/profiles?created_at=gte.${encodeURIComponent(yesterday)}&select=email,role,status,created_at&order=created_at.desc`,
  {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  }
);

if (!res.ok) throw new Error(`Supabase query failed: ${res.status} ${await res.text()}`);

const profiles = await res.json();
const users = profiles.filter(p => !p.email?.endsWith('@example.test'));

let body =
  `ESLtopia Daily Registration Report — ${date}\n` +
  `Period: last 24 hours ending ${new Date().toUTCString()}\n\n`;

if (users.length === 0) {
  body += 'No new registrations in the last 24 hours.';
} else {
  body += `New registrations: ${users.length}\n\n`;
  users.forEach((u, i) => {
    body +=
      `${i + 1}. ${u.email}\n` +
      `   Role: ${u.role} | Status: ${u.status}\n` +
      `   Registered: ${new Date(u.created_at).toUTCString()}\n\n`;
  });
}

const transport = createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: 'miljan2810@gmail.com', pass: process.env.GMAIL_APP_PASSWORD },
});

await transport.sendMail({
  from: '"ESLtopia Reports" <miljan2810@gmail.com>',
  to: 'miljan2810@gmail.com',
  subject: `ESLtopia Daily Registrations — ${date}`,
  text: body,
});

console.log(`Sent registration report: ${users.length} new user(s)`);
