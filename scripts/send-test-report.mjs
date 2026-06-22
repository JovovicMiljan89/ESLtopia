import { readFileSync } from 'fs';
import { createTransport } from 'nodemailer';

const output = readFileSync('test-output.txt', 'utf8');
const date = new Date().toISOString().split('T')[0];
const now = new Date().toUTCString();

const passedMatch = output.match(/(\d+) passed/);
const failedMatch = output.match(/(\d+) failed/);
const skippedMatch = output.match(/(\d+) skipped/);
const durationMatch = output.match(/\d+ passed \(([^)]+)\)/);

const passed = passedMatch ? +passedMatch[1] : 0;
const failed = failedMatch ? +failedMatch[1] : 0;
const skipped = skippedMatch ? +skippedMatch[1] : 0;
const total = passed + failed + skipped;
const duration = durationMatch ? durationMatch[1] : '–';

const allPassed = failed === 0;
const subject = allPassed
  ? `✅ ESLtopia Tests — All Passed (${date})`
  : `❌ ESLtopia Tests — ${failed} Failed (${date})`;

const summary =
  `ESLtopia Daily Test Report\n` +
  `Date: ${date}  |  Run: ${now}\n\n` +
  `Total: ${total}  |  Passed: ${passed}  |  Failed: ${failed}  |  Skipped: ${skipped}  |  Duration: ${duration}`;

function extractFailures(text) {
  const idx = text.indexOf('\n  1)');
  return idx >= 0 ? text.slice(idx).trim() : text;
}

const body = allPassed
  ? `${summary}\n\nAll tests passed ✅`
  : `${summary}\n\n── Failures ──────────────────────────────────────\n\n${extractFailures(output)}`;

const transport = createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: 'miljan2810@gmail.com', pass: process.env.GMAIL_APP_PASSWORD },
});

await transport.sendMail({
  from: '"ESLtopia Tests" <miljan2810@gmail.com>',
  to: 'miljan2810@gmail.com',
  subject,
  text: body,
});

console.log('Sent:', subject);
