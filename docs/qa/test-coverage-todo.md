# Test Coverage TODO

A standing, prioritized backlog of scenarios not yet covered by the automated suite, consolidated from `test-scenarios.pdf`. Check items off there too (flip the row from `GAP`/`PARTIAL` to `AUTOMATED`) when closing one here, and keep the case/module counts in `test-cases.pdf` and `test-plan.pdf` in sync — see their revision-note conventions.

Last synced: 2026-07-06, against Test Scenario Coverage Checklist v1.6.

v1.6 sync note: cross-browser coverage (previously in "Lower priority / harder to automate") is closed — `playwright.config.ts` now has `firefox` and `webkit` projects running the same suite (minus `classes.spec.ts`/`profile.spec.ts`, which are pure REST with no page rendering, and `tests/visual/`, whose baselines are Chromium-only). All 234 Firefox/WebKit executions pass; one failure and one flake seen in an initial run were confirmed by isolated reruns to be pre-existing parallel-load flakiness, not real per-browser bugs. Mobile viewport emulation was not attempted and remains open if it's ever wanted.

v1.5 sync note: all three former High-priority items below are now closed — see `tests/app/classes-ui.spec.ts` (CLSUI-01–06, Classes tab UI click-through + XSS in class/student names), `tests/app/records.spec.ts` (RECUI-09, XSS in notes), and the new burst tests in `tests/auth/login.spec.ts` (LOGIN-17) / `tests/auth/forgot-password.spec.ts` (FPW-08). One finding worth flagging on its own: the rate-limiting tests observed **no lockout or 429 within a 4–5 request burst on either endpoint** as of 2026-07-06 — that's a product-level fact (no brute-force protection currently active), not just a closed test gap. It's tracked as a risk in the Test Plan §11 and as a `PARTIAL` (not `AUTOMATED`) row in the Scenario Checklist §1, since the test documents current behavior rather than confirming protection exists.

v1.4 sync note: this pass was a doc-accuracy correction only, not new coverage — three things that already existed in `tests/` (the visual-regression suite, REG-11 anti-enumeration, CLS-08 RLS-insert-forgery) were missing from the QA docs and are now reflected there. CLS IDs above CLS-07 shifted by one (old CLS-08–15 → CLS-09–16); the reference below is updated accordingly. None of the gaps listed here were closed by this sync.

## High priority

None currently — the three items previously here (Classes tab UI click-through, XSS/HTML-injection resilience, rate-limiting behavior) were all closed 2026-07-06. See the v1.5 sync note above for the one follow-up worth tracking as a product risk rather than a test gap.

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
- [ ] **Mobile browser/viewport emulation** — desktop Chromium/Firefox/WebKit are covered (2026-07-06); mobile viewports (Playwright's `devices['iPhone...']`/`devices['Pixel...']`) are not.
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
