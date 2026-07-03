# ESLtopia

[![Daily Playwright Tests](https://github.com/JovovicMiljan89/ESLtopia/actions/workflows/daily-tests.yml/badge.svg)](https://github.com/JovovicMiljan89/ESLtopia/actions/workflows/daily-tests.yml)

AI-powered English worksheet and lesson-content generator for teachers and language schools.

Built with React + Vite, Supabase (auth, database, edge functions), and deployed on Vercel.

**Live app:** [esltopia.vercel.app](https://esltopia.vercel.app) · **QA docs:** [test plan, test cases, scenario checklist](docs/qa/)

## Features

- AI-generated worksheets and exercises (match, fill-in, true/false, listen & circle, color boxes)
- Class and student management — create classes, add/remove students
- Attendance, payment, and grade tracking per student per class
- Student profile modal with trimester summaries
- Role-based access: **Teacher**, **School** (manages teachers), **Superadmin**
- School admins can invite, deactivate, and remove their teachers
- Password recovery flow via email
- Pending/inactive account enforcement at login and session restore
- Superadmin dashboard — promote roles, delete accounts

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Auth & DB | Supabase (GoTrue, PostgreSQL, Edge Functions) |
| Hosting | Vercel |
| Tests | Playwright (E2E + API) |

## Local development

```bash
npm install
npm run dev        # starts Vite dev server at http://localhost:5173
```

Create `.env.local` and fill in:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Running tests

Tests run against the deployed production URL by default.

```bash
# one-time setup
npx playwright install chromium

# run all tests
npm test

# run with Playwright UI (watch mode)
npm run test:ui

# open the last HTML report
npm run test:report
```

### Required env for tests

Create `.env.test.local` (git-ignored):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # needed to create/delete test users
```

`BASE_URL` defaults to `https://esltopia.vercel.app` — override to target a preview or local build.

Test users are created under the `@example.test` domain and purged automatically after each run.

### Feature-flagged tests

The school-teacher edge-function tests are skipped by default. Add to `.env.test.local`:

```
FEATURE_SCHOOL_TEACHERS=1
```

## Test coverage

| Spec | What it covers |
|---|---|
| `login.spec.ts` | UI login, password/email validation, API token grant (password + refresh) |
| `registration.spec.ts` | UI signup (teacher + school), form validation, API signup, DB trigger role defaults |
| `logout.spec.ts` | UI sign-out, API logout, session invalidation |
| `forgot-password.spec.ts` | UI forgot-password form, API recover endpoint |
| `password-reset.spec.ts` | Recovery link flow, validation, single-use enforcement |
| `roles.spec.ts` | Superadmin coercion, admin portal access, account status restrictions, JWT claims, privilege escalation via REST |
| `navigation.spec.ts` | Auth guards, session persistence across reload, deactivated-account eviction |
| `superadmin.spec.ts` | Admin tab access, profile read/update/delete RLS, role promotion, Admin panel UI |
| `school-teachers.spec.ts` | School creates/manages/removes teachers, edge-function error handling |
| `classes.spec.ts` | Classes & records CRUD, student management, RLS isolation, cascade delete, superadmin full access |
| `profile.spec.ts` | Profile self-update (name fields), trigger protection (role change blocked), cross-user RLS |
| `records.spec.ts` | Records tab UI — attendance/grade/payment toggles, student profile modal, persistence across reload |
| `pdf-modal.spec.ts` | PDF preview modal — open/close (button + Escape), answer-key toggle, "New set" regeneration |

See `docs/qa/` for the full test plan, test case specification, and scenario coverage checklist (including known gaps).

## Database schema

Three core tables, all with Row Level Security:

- **`profiles`** — id, first/last/middle name, email, role, status, school_id
- **`classes`** — id (text PK), name, owner_id, students (jsonb array)
- **`records`** — class_id (PK, cascades from classes), owner_id, data (jsonb: attendance/payment/grades/notes)

Migrations live in `supabase/migrations/`.

## Deployment

Deploys are **not** automatic on push — pushing to `main` only updates the git history. To ship a frontend change:

```bash
git push origin main   # source of truth, but does not trigger a build
vercel --prod --yes    # actually deploys to https://esltopia.vercel.app
```

Verify the deploy landed by checking that the bundle hash changed:

```bash
curl -s https://esltopia.vercel.app/ | grep -o 'assets/index-[A-Za-z0-9]*\.js'
```

Database/edge-function changes are deployed separately via the Supabase CLI (`supabase db push`, `supabase functions deploy`).

## CI

GitHub Actions runs two scheduled workflows:

- **daily-tests** — full Playwright suite against production every day at 13:00 UTC
- **daily-registrations** — new-user report emailed every day at 09:00 UTC
