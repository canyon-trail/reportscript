# Pagination layer — behavioral specification

Status: **IMPLEMENTED**. This describes the intended behavior of the
pagination layer (`src/paginate/`). The implementation has been aligned to this
spec; see "Implementation alignment" below for the actual change surface.

## Purpose

The pagination layer takes a `MeasuredDocument` (sections → tables → rows, every
row already measured for height) and distributes its rows across fixed-height
pages, producing a `PaginatedDocument`. It must always terminate.

## Definitions

- **Page space** — the usable vertical height of a page after report
  header/footer reservation (`getAvailablePageSpace`). This is **page-dependent**:
  - the report **footer** is reserved on every page;
  - the report **header** is reserved on page 0 always, but on subsequent pages
    only when `repeatReportHeaders` is set.
    So a non-first page of a document without `repeatReportHeaders` has _more_
    page space than page 0. `paginateStep` already recomputes page space per page
    index, so the normal fit/defer logic (rules 1–2) already sees the correct,
    larger space on later pages.
- **Remaining space** — page space minus the height of rows already committed
  to the current page. On a fresh page, remaining space == that page's page
  space.
- **Most-generous page space** — the largest page space any page in the
  document could offer:
  `pageInnerHeight − footerSpace − (repeatReportHeaders ? headerSpace : 0)`.
  The report header counts against this only when it is guaranteed to appear on
  every page; otherwise some page exists (page 1+) without it.
- **Applicable headers** for a row on a given page — the headers drawn above
  that row on that specific page:
  - report footer — every page; report header — page 0, plus every page when
    `repeatReportHeaders`;
  - section headers — the section's first page always, and continuation pages
    when `repeatSectionHeaders`;
  - table headers — every page a table spans.
    The pagination code already deducts the applicable headers before a row-level
    fit decision: `getAvailablePageSpace` removes the report reservation for that
    page index, `splitSection` subtracts section headers, `splitTable` subtracts
    table headers. So when a single row is tested for fit, the space it is tested
    against has _already_ had that page's applicable headers removed.
- **Fresh page** — a page with no data rows committed yet. That page's full
  page space (minus its applicable headers) is available to the first row.
- **Oversized row** — a row that cannot fit on **any** page, i.e. its
  `minHeight` exceeds even the _most-generous_ page space minus the headers that
  would still be applicable on that most-generous page (section headers if
  `repeatSectionHeaders` and this is not the section's first page is itself
  page-dependent — use the worst case that still applies, plus table headers).
  Equivalently: there is no page index at which this row, alone on a fresh page,
  would fit.
  - A row that does not fit in _remaining_ space, and does not fit on _page 0's_
    fresh space, but _would_ fit on a roomier later page, is **not** oversized.
    It is a normal row that simply needs a later page (rule 2).
- **Splittable row** — `canSplitRow` is true: every column that overflows the
  available space has a `splitFn`, and at least one line of text fits.
- **Unsplittable row** — not splittable.

## Top-level invariant

> The `paginate` loop terminates on every input.

Every iteration of the `while (remaining.length > 0)` loop in `paginate` must
make **forward progress**: it either commits at least one row to a page, or it
strictly reduces the count of un-placed rows. A loop iteration that re-queues
its input unchanged is a defect.

## Intended behavior

### Normal rows

1. A row that fits in remaining space is placed on the current page.
2. A row that does not fit in remaining space but is **not oversized** (it would
   fit on a fresh page) is deferred: the current page is finalized and the row
   is placed on a fresh page.

### Splittable rows

3. A row taller than remaining space that is splittable is split: the portion
   that fits is placed on the current page with a `(continued on next page)`
   marker; the remainder is carried to the next page with a
   `(continued from prev page)` marker.
4. Each split makes progress: the carried-forward remainder is strictly shorter
   (in content) than the input. `splitColumn` enforces this and falls back to
   truncation when no split can.

### Oversized rows — the termination-critical case

5. **An oversized row is force-placed on its own fresh page and allowed to
   overflow** past the page boundary. It is _never_ re-queued unchanged.

   - Rationale (Q1): there is no page tall enough to contain it. The library
     does not silently truncate the user's data, and does not suppress headers
     to claw back space. A row that overflows its page is a **report-design
     problem for the user to fix** — the library's only obligation is to
     terminate and render, not to rescue a malformed report.
   - This applies whether the row is splittable or not. (A splittable row tall
     enough to still overflow after `splitColumn` has done everything it can is
     also oversized and is force-placed.)

6. Force-placing affects **only the specific oversized row(s)**. Rows before an
   oversized row are committed normally; rows after it are paginated normally on
   subsequent pages. The offending row overflows; its neighbors do not.

7. Multiple oversized rows in one table are each force-placed on their own page,
   independently. An oversized row's position within its table (first, middle,
   last) does not change this behavior.

8. Headers are always drawn as specified (Q2). The library never suppresses or
   shrinks report/section/table headers to make an oversized row fit. The
   headers applicable to a force-placed oversized row are still drawn above it,
   even though that guarantees the row overflows.

### Tables and sections

9. `splitTable(table, availableSpace)` returns `{ first, rest }`:

   - `first` is the portion placed on the current page. It either fits within
     `availableSpace`, **or** it consists of exactly one force-placed oversized
     row (rule 5).
   - `rest` contains the rows not yet placed. Whenever `first` is non-empty,
     `rest` has strictly fewer rows than the input.
   - `first` may be empty only when nothing can be placed in `availableSpace` —
     i.e. the page is partially full and not even the first row (nor one split
     line) fits. On a _fresh_ page `first` is always non-empty (rules 1–8
     guarantee the front row fits, splits, or is force-placed).

10. `splitSection` and `paginateStep` uphold the same contract one level up.
    A non-empty `first` from `splitSection` is **committed to a page**; it is
    never round-tripped back through the "does the whole section fit?" check in
    a way that could re-split the same content indefinitely.

11. When `splitTable` / `splitSection` return an empty `first` (rule 9, last
    bullet), the caller must finalize the current page and start a fresh one
    before retrying. On the fresh page, progress is guaranteed by rules 1–8.

12. Sections with more than one table follow the same rules with no special
    cases (Q4). An oversized row in one table is force-placed per rules 5–8;
    the section's other tables paginate normally and are unaffected.

## Reproduction (current defect)

`src/paginate/oversizedRows.test.ts` reproduces the hang: the downstream
"all-expense-report" payload — a 12-column gridded table, **no `splitFn` on any
column**, one `Notes` cell containing ~250 newlines + a short line, making that
row ~3162pt tall (far taller than a page). On `main`, `paginate` spins forever:

- `splitTable` hits its `else` branch for the oversized unsplittable row and
  re-queues it unchanged — violating rules 5 and 9.
- `splitSection` therefore returns an empty `first` — but the current page is
  fresh, so rule 11's "start a fresh page" does not help and is not even
  reached.
- `paginateStep` re-queues the section unchanged and never advances the page —
  violating rules 10 and the top-level termination invariant.

## Implementation alignment

The implementation was aligned to this spec in the ordered steps below. As
built, the change surface is:

- **`src/paginate/oversized.ts`** (new) — `getMostGenerousPageSpace`,
  `isRowOversized`, `stampOversizedRows`. Computes the page-independent
  "oversized" property; `stampOversizedRows` stamps each data row's
  `isOversized` flag.
- **`src/measure/types.ts`** — `MeasuredRow` gains the optional `isOversized`
  field.
- **`src/paginate/index.ts`** — `prepareDoc` calls `stampOversizedRows`;
  `paginate`'s loop has a forward-progress guard (`paginationProgress`) that
  throws on a stalled step instead of hanging; `paginateStep`'s
  `sectionHeight > remainingSpace` branch commits a non-empty `first` directly
  and pushes a fresh page for `rest`, and starts a fresh page on empty-`first`
  deferral — it no longer re-queues `first` unchanged.
- **`src/paginate/splitTable.ts`** — the `else` branch force-places an
  oversized row when it is alone at the front of the page (`fitRows` empty);
  otherwise defers it. `splitSection` needed no change — it already propagates
  `splitTable`'s result correctly.
- **Tests** — new `oversized.test.ts` (helper units) and `oversizedRows.test.ts`
  (end-to-end, drives public `paginate`); new "oversized rows" blocks in
  `splitTable.test.ts` and `splitSection.test.ts`; one expectation in
  `paginate.test.ts` updated for the new `isOversized` field on data rows.

`paginateStep` / `prepareDoc` are **not** exported — the forward-progress guard
inside `paginate` makes a regression surface as a fast throw, so the
end-to-end test drives the public entry point directly.

Full suite: 255 tests passing, `tsc --noEmit` clean.

### Guiding constraints

- Keep changes minimal and local to `src/paginate/`. No new abstractions beyond
  what the rules require.
- The "oversized" decision is **page-independent** (worst-case). It must be
  computed where the document-level facts are known (`repeatReportHeaders`,
  `footerSpace`, `headerSpace`, layout) — that is `paginate` / `prepareDoc`
  level, not inside `splitTable`.
- Do not approximate "oversized" with `row.minHeight > availableSpace`. That
  conflates "fits on no page" with "doesn't fit on this particular page" and
  would wrongly overflow a row that should merely be deferred.
- `paginateStep` / `prepareDoc` stay private. The forward-progress guard inside
  `paginate` turns a stalled loop into a fast throw, so the end-to-end test can
  drive the public entry point without hanging.

### Step 0 — lock in the failing reproduction

- Add `src/paginate/oversizedRows.test.ts` driving the real
  normalize → measure → paginate pipeline. (During development it stepped the
  loop directly; the final form drives public `paginate`, which throws on a
  stalled loop via the forward-progress guard.)
- Confirm the test fails (hangs / stalls) on the unfixed code.
- Outcome: one red test that pins the defect, no production code changed yet.

### Step 1 — define "oversized" as a computed, page-independent property

- Add a helper (in `src/paginate/index.ts` or a small new module) that, given
  the `MeasuredDocument` and a row's `minHeight`, returns whether the row can
  fit on _any_ page:
  `minHeight <= mostGenerousPageSpace`, where `mostGenerousPageSpace` is the
  roomiest page the row could ever land on:
  `pageInnerHeight − footerSpace − reportHeader − sectionHeaders − tableHeaders`,
  with each header term included only when it is _unavoidable_ for that row:
  - **report header** — included only if `repeatReportHeaders`. Otherwise a
    document page exists (page 1+) without it.
  - **section headers** (plus the section's tableGap) — included only if
    `repeatSectionHeaders`. Otherwise the row can land on a continuation page of
    its section that has no section headers (an oversized/deferred row forces
    exactly such a page).
  - **table headers** — always included. The row is always inside its table,
    and table headers are re-drawn on every page the table spans, so there is
    no page the row can reach without them.
  - report/section **footers** are always reserved (`footerSpace` is
    unconditional in `getAvailablePageSpace`), so they are always subtracted.
- Decide the carrier for this fact. Preferred: compute once and stamp each
  `MeasuredRow` (or wrap it) with an `isOversized: boolean` during `prepareDoc`,
  so `splitTable` / `splitSection` read a flag instead of recomputing. Confirm
  this is acceptable vs. threading a number through the call chain.
- Unit tests for the helper: oversized vs. not, across `repeatReportHeaders`
  on/off and `repeatSectionHeaders` on/off, including the boundary (row exactly
  equal to the threshold).

### Step 2 — `splitTable`: force-place oversized rows; never re-queue unchanged

- In the `else` branch (row neither fits nor splits):
  - if the row `isOversized` → push it into `fitRows` and `break` (rule 5):
    it is force-placed on whatever page it is on and allowed to overflow.
  - if the row is **not** oversized → it is too big for _this_ page but fits on
    a fresh one. `splitTable` cannot itself start a new page, so it returns with
    this row left in `remainingRows` and `fitRows` holding whatever fit before
    it. The empty-`first` / non-empty-`first` outcome is handled by the caller
    (steps 3–4).
- Guarantee rule 9: whenever `first` is non-empty, `rest` has strictly fewer
  rows; an oversized row that gets force-placed leaves `rest` strictly smaller.
- Tests in `splitTable.test.ts`:
  - oversized row at index 0 → `first` = `[thatRow]`, `rest` = the remainder.
  - oversized row mid-table → rows before it fit into `first`, oversized row +
    rows after it go to `rest` (it is force-placed on its _own_ page next).
  - oversized row last → preceding rows in `first`, oversized row in `rest`.
  - multiple oversized rows → each ends up alone on its own page across
    successive `splitTable` calls.
  - negative case: a tall-but-not-oversized row is left in `rest`, never pushed
    into `fitRows` to overflow.
  - existing "split table shows a breakPage row" test (a tall no-`splitFn` row
    expected in `first.rows`) — confirm it still passes; it is the pre-existing
    expression of rule 5 and the new code must agree with it.

### Step 3 — `splitSection`: propagate force-place; correct empty-`first` handling

- Mirror step 2 at the table granularity:
  - a non-empty `first` from `splitTable` is always carried into `fitTables`
    (rule 10) — including the force-placed-oversized-row case.
  - when `splitTable` returns an empty `first` (the front row is not oversized
    but does not fit this page), `splitSection` returns its `first` (possibly
    empty) and a `rest` that still holds that table — the caller starts a fresh
    page (step 4).
- Verify the `canSplitTable` / `canFitTable` gates do not short-circuit an
  oversized row away from `splitTable`; if they do, adjust so an oversized row
  always reaches the force-place path.
- Tests in `splitSection.test.ts`: oversized row inside the only table; inside
  one of several tables (rule 12 — sibling tables unaffected); empty-`first`
  deferral case.

### Step 4 — `paginateStep`: guarantee forward progress every iteration

- Rework the `sectionHeight > remainingSpace` branch so that:
  - a non-empty `first` from `splitSection` is **committed to the current page**
    (via `paginateSection`) rather than unshifted back onto `remaining` — it is
    done and must not be re-split (rule 10).
  - after committing a non-empty `first`, if `rest` has content, push a fresh
    page for it.
  - if `first` is empty and `rest` is non-empty (nothing could be placed on a
    partially-full page), finalize the current page and push a fresh one before
    re-queueing `rest`, so the deferred content gets full / roomier space
    (rule 11).
  - never unshift the input section back unchanged — that is the current defect.
- Add an assertion / invariant check (at least in tests, possibly a dev-time
  guard) that each `paginateStep` call strictly decreases a well-founded measure
  (committed rows increases, or remaining row count decreases).
- Tests in `paginate.test.ts`: the end-to-end repro from step 0 now terminates;
  page count and row distribution match expectation for oversized-row-first /
  -mid / -last, multiple oversized rows, multi-table section, and a
  not-oversized-deferred row. Include `repeatReportHeaders` on/off variants.

### Step 5 — full regression pass and cleanup

- Run the entire `src/paginate/**` suite plus `measure` and top-level
  `renderSnapshot` tests; investigate any snapshot diffs (a changed page break
  is expected only where an oversized row is now force-placed — anything else is
  a regression to fix).
- Confirm `paginateStep` / `prepareDoc` are no longer exported (step 0 removed
  the test dependency on them).
- Update this section's status to "implemented" and record the actual diff
  surface.

### Out of scope (explicitly not changing)

- `splitColumn` and its delimiter/character/truncate strategies — already
  bounded by commit `9536b90`; the hang is not there.
- The `trySplitDelimiter` `.trim().filter()` behavior the downstream reporter
  flagged — it is a _quality_ concern (newline-only cells do not split nicely),
  not the _termination_ defect. Leave it unless a separate decision is made.
- Rendering (`src/render/`) — overflow is a layout consequence the renderer
  already handles by drawing past the page edge; no renderer change is needed
  for termination.
