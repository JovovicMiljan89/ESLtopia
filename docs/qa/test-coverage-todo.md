# Test Coverage TODO

A standing, prioritized backlog of scenarios not yet covered by the automated suite, consolidated from `test-scenarios.pdf`. Check items off there too (flip the row from `GAP`/`PARTIAL` to `AUTOMATED`) when closing one here, and keep the case/module counts in `test-cases.pdf` and `test-plan.pdf` in sync — see their revision-note conventions.

Last synced: 2026-07-03, against Test Scenario Coverage Checklist v1.3.

## High priority

- [ ] **Classes tab UI click-through** — create a class via the "add class" form, add/remove a student via the roster input, delete a class via its button. All three are REST-tested (`CLS-01–08`) but never clicked through the real UI. Mirrors the pattern already used in `tests/app/records.spec.ts`.
- [ ] **XSS/HTML-injection resilience** in free-text fields (student names, class names, notes). React escapes by default, but nothing explicitly verifies it — worth one test injecting `<script>`/HTML markup into a student name and confirming it renders as literal text, not markup.
- [ ] **Rate limiting / brute-force protection** on `/auth/v1/token` and `/auth/v1/recover`. No test exercises repeated failed attempts against Supabase's own limiter — worth confirming the behavior exists and what it does (lockout? delay? nothing?).

## Medium priority

- [ ] **Worksheet generation across the remaining task types** — `match`, `true/false`, `listen-and-circle`, `color-the-boxes`. Only `fillin` (via the "am / is / are" topic) is exercised today; the modal-rendering path for the other four `WorksheetTasks.jsx` components has zero coverage.
- [ ] **Student profile trimester breakdown** — expanding a term, viewing its attendance/grade log, setting a final grade. A rich sub-feature of the profile modal with no test coverage at all.
- [ ] **Admin panel "Delete" button UI click-through** — deletion is only tested at the REST layer (`SADM-12`); no test clicks the actual button and confirms the row updates (grays out, shows "Deleted", offers "Restore").
- [ ] **Employees panel UI click-through** — invite form submission, deactivate/reactivate buttons, roster list rendering. Only tab visibility (`SCHT-05`) and the remove-confirm dialog (`SCHT-15`) are UI-driven; everything else calls the edge functions directly.
- [ ] **Generator settings**: grade filter dropdown, exercise-type pills (Match vs. True/False), exercise-count input bounds (min 5 / max 20, non-numeric input).
- [ ] **Assigning a class/student to a worksheet** and confirming the Name/Class fields actually populate on the generated sheet — current PDF-modal tests never select a class/student first.
- [ ] **Background worksheet toolbar** (the "Show answers" / "New set" / "Preview PDF" controls that render behind the modal before it's opened) — generation immediately opens the modal in every existing test, so this path is unexercised.
- [ ] **Records tab date/month pickers** — every current test implicitly uses "today"/"this month"; switching them to view a different day/month's data is untested.
- [ ] **Duplicate student names / very long or unicode class & student names** — no boundary/edge-case input testing on these free-text fields.

## Lower priority / harder to automate

- [ ] **PDF modal**: Print button's actual `window.print()` + print-CSS behavior, Download PDF's new-tab content, pop-up-blocked fallback alert, scroll-reset-on-New-set. All awkward to assert headlessly; consider Playwright's print-emulation APIs if this becomes worth the effort.
- [ ] **Cross-browser coverage** (Firefox, WebKit/Safari, mobile browsers) — Chromium only today; would need `playwright.config.ts` project changes.
- [ ] **Responsive/mobile layout** at the 860px and 480px CSS breakpoints — no viewport-sized visual assertions exist.
- [ ] **Accessibility** — screen-reader labeling, full keyboard navigation, color contrast. Only incidental keyboard support (Escape-to-close) is covered.
- [ ] **Performance under load** (many classes/students/records for one teacher) — no defined SLA for this ~10-user portfolio app.
- [ ] **Network-failure handling** beyond the record-sync path already covered by `RECUI-08` — e.g. what happens if the initial classes/records load itself fails.
- [ ] **Concurrent edits to the same record from two sessions** (last-write-wins behavior) — the debounced upsert has no defined conflict-resolution test.
- [ ] **Access-token expiry mid-session** (not just at the refresh-endpoint API level) — simulating a real in-browser session sitting past expiry mid-action.
- [ ] **Multiple concurrent sessions/tabs** for the same user.
- [ ] **Invited-teacher email content and the `?setup=1` link flow**, end-to-end via UI (currently simulated via the admin API, per the project's deliberate email-testing tradeoff — see the Test Plan).
- [ ] **Row-level security for any future table** — not a specific gap, a process reminder: pair every new table with an RLS test before merging.
- [ ] **Account lockout / suspicious-activity handling** — no such feature exists in the app today; only relevant if one is added.

## Out of scope by design (not on this list)

These appeared in the Scenario Checklist as `PARTIAL` but are deliberate tradeoffs documented in the Test Plan, not backlog items:
- Email deliverability/content (tests use the admin API instead of reading a real inbox).
- School-scoped data isolation for the school-teachers feature (covered at the API level; UI click-through is the actual gap, listed above).
- Deploy verification (manual bundle-hash + smoke check today, by design — see Test Plan §11).
