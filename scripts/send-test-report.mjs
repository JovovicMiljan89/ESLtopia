import { existsSync, readFileSync } from 'fs';

// Missing when an earlier step (npm ci, browser install) failed before
// Playwright ever started -- still worth an email, as a failure.
const output = existsSync('test-output.txt') ? readFileSync('test-output.txt', 'utf8') : '';
const date = new Date().toISOString().split('T')[0];
const now = new Date().toUTCString();

// Playwright's end-of-run summary puts each count on its own indented line
// ("  2 flaky", "  302 passed (11.7m)"). Anchoring to that shape keeps test
// stdout that happens to contain e.g. "3 failed" from being counted.
function count(label) {
  const m = output.match(new RegExp(`^ +(\\d+) ${label}\\b`, 'm'));
  return m ? +m[1] : 0;
}

// Test titles listed under a summary line such as "  2 flaky".
function listed(label) {
  const lines = output.split('\n');
  const start = lines.findIndex(l => new RegExp(`^ +\\d+ ${label}$`).test(l.trimEnd()));
  if (start < 0) return [];
  const titles = [];
  for (const line of lines.slice(start + 1)) {
    if (!/^ {4}\S/.test(line)) break;
    titles.push(line.replace(/[\s─]+$/, '').trim());
  }
  return titles;
}

const passed = count('passed');
const failed = count('failed');
const flaky = count('flaky');
const skipped = count('skipped');
const interrupted = count('interrupted');
const didNotRun = count('did not run');
const total = passed + failed + flaky + skipped + interrupted + didNotRun;
const durationMatch = output.match(/^ +\d+ passed \(([^)]+)\)/m);
const duration = durationMatch ? durationMatch[1] : '–';

// "0 failed" alone is not a pass: a run that crashed before executing any
// test also reports no failures.
const ranNothing = passed === 0 && failed === 0;
const allPassed = !ranNothing && failed === 0 && interrupted === 0 && didNotRun === 0;

let subject;
if (ranNothing) subject = `❌ ESLtopia Tests — No Tests Ran (${date})`;
else if (failed > 0) subject = `❌ ESLtopia Tests — ${failed} Failed (${date})`;
else if (!allPassed) subject = `❌ ESLtopia Tests — Run Incomplete (${date})`;
else if (flaky > 0) subject = `⚠️ ESLtopia Tests — All Passed, ${flaky} Flaky (${date})`;
else subject = `✅ ESLtopia Tests — All Passed (${date})`;

let summary =
  `ESLtopia Daily Test Report\n` +
  `Date: ${date}  |  Run: ${now}\n\n` +
  `Total: ${total}  |  Passed: ${passed}  |  Failed: ${failed}  |  Flaky: ${flaky}  |  Skipped: ${skipped}  |  Duration: ${duration}`;
if (interrupted || didNotRun) {
  summary += `\nInterrupted: ${interrupted}  |  Did not run: ${didNotRun}`;
}

function extractFailures(text) {
  const idx = text.indexOf('\n  1)');
  return idx >= 0 ? text.slice(idx).trim() : text;
}

let body;
if (ranNothing) {
  body =
    `${summary}\n\nPlaywright did not report any test results — the run crashed or never started.\n\n` +
    `── Output ────────────────────────────────────────\n\n${output.trim() || '(no test output was produced)'}`;
} else if (!allPassed) {
  body = `${summary}\n\n── Failures ──────────────────────────────────────\n\n${extractFailures(output)}`;
} else if (flaky > 0) {
  body =
    `${summary}\n\nAll tests passed ✅ — but ${flaky} only passed on retry:\n\n` +
    listed('flaky').map(t => `  • ${t}`).join('\n') +
    `\n\n── Flaky failures ────────────────────────────────\n\n${extractFailures(output)}`;
} else {
  body = `${summary}\n\nAll tests passed ✅`;
}

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
    from: '"ESLtopia Tests" <miljan2810@gmail.com>',
    to: 'miljan2810@gmail.com',
    subject,
    text: body,
  });

  console.log('Sent:', subject);
}
