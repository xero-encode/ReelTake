# ReelTake v1 — Statements, Review, Deals

Build the three screens end-to-end against the existing Supabase schema, seed
demo data, and wire the design system. No new tables or columns.

## Design system (applied from the start)

Overwrite `src/styles.css` tokens to match the knowledge file:

- **Base**: ink black `oklch(0.14 0 0)` on warm off-white `oklch(0.98 0.01 85)`.
- **Accent (ticket-stub red)**: `oklch(0.58 0.22 27)` — used only for the
  primary CTA, active nav underline, and the "Needs review" chip.
- **Type**: editorial serif for headings (Fraunces via `<link>` in
  `__root.tsx`), clean sans (Inter) for body, `font-feature-settings: "tnum"`
  on every money column.
- **Chips**: quiet, low-contrast pills — Received (slate), Needs review
  (red), Parsed (slate), Reviewed (ink outline), Invoiced (ink solid),
  Paid (green), Failed (destructive).
- Update `__root.tsx` head to real ReelTake title/description and font `<link>`s.

## Shared plumbing

- `src/lib/format.ts` — `formatCurrency(amount)` → `£1,234.56`, `formatDate(iso)`
  → `DD/MM/YYYY`, `formatPeriod(start, end)`.
- `src/lib/split.ts` — **the one pure split utility**:
  `distributorShare(gross: number, splitPercentage: number): number` that
  multiplies then rounds half-up to the nearest penny **once at the end**.
  Also `statementTotals(lines)` returning `{ totalGross, totalOwed,
  linesMissingDeal }`, built on top of it. Unit-tested with vitest
  (`src/lib/split.test.ts`) covering: basic split, rounding boundary
  (£12.345 → £12.35), null gross, missing deal (line contributes to gross
  but not to owed).
- `src/lib/db/types.ts` — hand-written TS types for the seven tables from the
  knowledge file (no generated `types.ts` since we're BYO Supabase).
- `src/lib/services/statements.ts`, `deals.ts`, `titles.ts`, `venues.ts`,
  `exhibitors.ts`, `boxOfficeLines.ts` — every Supabase call lives here;
  components use React Query with these services (no direct `supabase.from`
  in components, per the knowledge file).

## Routes

Flat file-based routing under `src/routes/`:

```text
__root.tsx       ← shared shell + header nav (Statements / Deals)
index.tsx        ← redirect to /statements  (keeps home clean)
statements.tsx           ← layout with <Outlet />
statements.index.tsx     ← screen 1 (list)
statements.$id.tsx       ← screen 2 (review)
deals.tsx                ← screen 3 (list + add form)
```

### 1. Statements list (`/statements`)

- Loader primes React Query with `listStatementsWithTotals()` — one query
  that joins statements → titles → exhibitors and sums
  `box_office_lines.gross_amount` per statement (single RPC-less query
  using nested selects).
- Filter tabs (URL search param `?status=...`) — All / Needs review
  (`status in received|parsed|reviewed`) / Invoiced / Paid / Failed.
- Rows sorted `created_at desc`, grouped visually by status with a soft
  section header inside the current tab.
- Row: film title (serif), exhibitor, `formatPeriod`, total gross (tabular),
  status chip. Whole row is a link to `/statements/$id`.
- Empty state: "No statements yet — they'll appear here as cinemas email
  them in."

### 2. Statement review (`/statements/$id`)

- Loader fetches the statement + title + exhibitor + all
  `box_office_lines` + their matched `deals`.
- Header block: title (serif, large), exhibitor, period, status chip.
- Lines table: play date, venue name, screen, ticket type, admissions
  (tabular), gross (tabular), split %, distributor share (from
  `distributorShare()`). Lines with `deal_id === null` render a red
  "Needs deal" chip in the split column and a `—` in share.
- Summary strip: total gross, total owed to distributor, count of
  lines missing a deal.
- **Confirm figures** button — disabled while any line lacks a deal, or
  when status isn't in `{received, parsed}`. On click: update
  `statements.status = 'reviewed'`, invalidate query.
- **Create invoice in Xero** button — visible only when status is
  `reviewed`. Uses `useMutation` calling
  `supabase.functions.invoke('create-invoice', { body: { statementId } })`.
  Disabled while pending; toast on success/failure. On failure the edge
  function is expected to leave status as `reviewed` (retryable).

### 3. Deals (`/deals`)

- Loader fetches deals + titles + venues.
- Grouped by title (serif heading + poster placeholder), each group lists
  deals with venue, split %, valid from → to (open-ended shown as "ongoing").
- "Add deal" opens a shadcn `Dialog` with a `react-hook-form` + zod form:
  title (Select), venue (Select — filtered to that title's exhibitor's
  venues, or all), split % (number, 0–100), valid from (DatePicker),
  valid to (DatePicker, optional). Submits via
  `dealsService.create(...)`, invalidates the query.

## Edge function stub

Create `supabase/functions/create-invoice/index.ts` — a Deno edge function
that:

1. Reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from Deno env.
2. Verifies caller is authenticated (accepts any signed-in user for now).
3. Loads the statement; rejects unless `status = 'reviewed'`.
4. Rejects if an invoice row already exists for that statement (product
   rule: one invoice per statement, enforced here, not in the DB).
5. Recomputes the totals server-side from `box_office_lines` + `deals`
   using the same math as `distributorShare` (duplicated in Deno; kept
   trivially small).
6. Inserts an `invoices` row with a fake `xero_invoice_id` like
   `DEMO-INV-<timestamp>` and `xero_status = 'DRAFT'`, sets
   `statements.status = 'invoiced'`, returns
   `{ ok: true, xeroInvoiceId, xeroStatus }`.
7. On any error, returns `{ ok: false, error }` and does not mutate.

Note: this file is not auto-deployed by Lovable (BYO Supabase). It ships
as source so you can `supabase functions deploy create-invoice` from the
CLI. Until then the review-page invoice button will return an error — the
UI handles that gracefully. Flagging so there are no surprises.

## Demo data seed

One-off SQL migration file at `supabase/migrations/<ts>_seed_demo.sql`
that inserts rows into existing tables only. Reuses 3 of the 6 exhibitors
already in the DB (Curzon, Everyman, Odeon). Adds:

- **Titles (3)**: *Aftersun in Margate*, *The Salt Path Diaries*, *A
  Quiet Kind of Loud*.
- **Venues (4)**: Rio Cinema (Everyman-linked for demo), Curzon
  Bloomsbury, Everyman Crystal Palace, Odeon Covent Garden.
- **Deals (5)**: e.g. *Aftersun in Margate* at Curzon Bloomsbury 50%
  weeks 1–2 then 40% ongoing; *Salt Path* at Rio flat 45%; etc. — split
  changes modelled as two consecutive deals with adjacent date ranges.
- **Statements (5)** across statuses: 1 `received` (no lines yet), 1
  `parsed` with lines including one line whose `play_date`/`venue`
  matches no deal (to exercise the "Needs deal" flag), 1 `reviewed`, 1
  `invoiced` (with matching `invoices` row + fake xero id), 1 `paid`.
- **Box office lines** for each statement with realistic ticket types
  (Standard, Concession, Member), gross amounts in the £80–£1,400 range,
  matched to the appropriate `deal_id`.

The seed is idempotent-ish via `ON CONFLICT DO NOTHING` on stable UUIDs
so re-running won't duplicate.

## Testing

- `bunx vitest run src/lib/split.test.ts` — the split utility.
- After build: manually verify each screen in the preview, and confirm
  the review page correctly disables "Confirm figures" when a line lacks
  a deal.

## Files created / changed

Created:
- `src/lib/format.ts`, `src/lib/split.ts`, `src/lib/split.test.ts`
- `src/lib/db/types.ts`
- `src/lib/services/{statements,deals,titles,venues,exhibitors,boxOfficeLines}.ts`
- `src/components/AppHeader.tsx`, `src/components/StatusChip.tsx`,
  `src/components/EmptyState.tsx`, `src/components/MoneyCell.tsx`
- `src/routes/index.tsx` (replaced with redirect),
  `src/routes/statements.tsx`, `src/routes/statements.index.tsx`,
  `src/routes/statements.$id.tsx`, `src/routes/deals.tsx`
- `supabase/functions/create-invoice/index.ts`
- `supabase/migrations/<ts>_seed_demo.sql`
- shadcn components as needed (`button`, `table`, `tabs`, `dialog`,
  `select`, `input`, `form`, `calendar`, `popover`, `toast`)

Edited:
- `src/styles.css` (tokens, fonts)
- `src/routes/__root.tsx` (real head metadata, font link, header)

## Out of scope for this pass

- Auth screens (the tables have no RLS per your last change, so all reads
  go through the anon key for now).
- Real Make webhook wiring — the edge function returns fake Xero data.
- Realtime updates on the statements list.
- Investor waterfall, flat-fee deals, statement upload UI, multi-currency.
