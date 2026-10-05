const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Report on the previous full UTC calendar day rather than "the last 24h from
// now": GitHub starts scheduled runs hours late and at a different time each
// day, so a rolling window leaves gaps (and overlaps) between reports.
const end = new Date();
end.setUTCHours(0, 0, 0, 0);
const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
const day = start.toISOString().split('T')[0];

const res = await fetch(
  `${SUPABASE_URL}/rest/v1/profiles` +
    `?created_at=gte.${encodeURIComponent(start.toISOString())}` +
    `&created_at=lt.${encodeURIComponent(end.toISOString())}` +
    `&select=email,role,status,created_at&order=created_at.desc`,
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
  `ESLtopia Daily Registration Report — ${day}\n` +
  `Period: ${day} 00:00–24:00 UTC\n\n`;

if (users.length === 0) {
  body += `No new registrations on ${day}.`;
} else {
  body += `New registrations: ${users.length}\n\n`;
  users.forEach((u, i) => {
    body +=
      `${i + 1}. ${u.email}\n` +
      `   Role: ${u.role} | Status: ${u.status}\n` +
      `   Registered: ${new Date(u.created_at).toUTCString()}\n\n`;
  });
}

const subject = `ESLtopia Daily Registrations — ${day}`;

if (process.env.REPORT_DRY_RUN) {
  console.log(`Subject: ${subject}\n\n${body}`);
} else {
  const { createTransport } = await import('nodemailer');
  const transport = createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: 'miljan2810@gmail.com', pass: process.env.GMAIL_APP_PASSWORD },
  });

  await transport.sendMail({
    from: '"ESLtopia Reports" <miljan2810@gmail.com>',
    to: 'miljan2810@gmail.com',
    subject,
    text: body,
  });

  console.log(`Sent registration report for ${day}: ${users.length} new user(s)`);
}
