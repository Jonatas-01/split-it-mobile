# Split-It — Mobile Spec

**Status:** v1 spec, pre-implementation
**Repo:** `split-it-mobile` (standalone)
**Related:** `bill-splitter` (existing Next.js prototype → becomes API-only backend)

---

## 1. What this is

A mobile app that turns a photo of a restaurant receipt into a reviewed item list, lets one person assign dishes to the people at the table, and calculates exact per-person totals including service charge.

**The mechanic:** one person at the table scans the receipt on their own phone and drives the entire split. Everyone else just gets told what they owe.

**The trust argument, which drives most decisions below:** people don't distrust bill splitters because the arithmetic is wrong. They distrust them because the arithmetic is invisible. Every screen shows its working.

**Origin:** a working Next.js web prototype exists with a proven extraction pipeline (Gemini 2.5 Flash), a validated 6-step flow, and a design system that has since been reworked for iOS.

---

## 2. Non-Goals

Deliberately excluded from v1. Adding any of them is a scope change, not an enhancement.

- **Multiplayer / multi-device.** No joining a bill from a second phone, no QR codes, no real-time sync.
- **Web UI.** The Next.js app becomes backend-only. Its React components are a design reference and are not maintained as a product.
- **Receipt image storage.** Images are sent to the extraction endpoint and discarded.
- **Reconciliation against the receipt's printed total.** The app never reads or compares the printed total. Scans can be wrong; the fix is the user editing or adding an item in Review, not a warning banner.
- **Per-item scan confidence.** No confidence field, no `SCANNED` row label, no "check this price" flag.
- **E2E tests.** No Detox, no Maestro, until after launch.
- **Payments outside IAP.** No Stripe, no web checkout.
- **Android.** iOS ships first.
- **Shared type package / monorepo.** `types/bill.ts` is duplicated between the two repos on purpose.
- **Anything after sharing.** No payment requests, no settle-up tracking, no reminders.

---

## 3. Core flow

1. **Home** — recent bills, primary "Scan receipt" action.
2. **Capture** — a dashed well, then *Take a Photo* / *Upload from Gallery*. No live viewfinder: iOS already offers camera-or-library from one button. *(Auth gate fires here if signed out.)*
3. **Loading** — a skeleton or dedicated loading screen while extraction runs, then straight into Review.
4. **Review** — extracted items, editable: rename, fix price, add, delete. Tap opens an edit sheet; swipe left deletes.
5. **People** — first names only. Recent diners appear as one-tap chips. The host is tagged `You`.
6. **Assign** — person-first: pick who, then tick what they had.
7. **Service** — presets (0 / 10 / 12.5 / 15) plus ±0.5%, seeded from what the scan read.
8. **Final bill** — a receipt, not a dashboard, because the last step happens in a group chat and the artefact must make sense with no app around it.

Steps 2–8 operate on one in-progress bill held as a single object. They are a stateful stack group, not independently deep-linkable routes.

---

## 4. Screens & navigation

**Expo Router**, file-based. Three tabs, with the bill flow living outside them.

### Tabs

| Tab | Route | Contents |
|---|---|---|
| **Home** | `(tabs)/index` | User greeting in the header, a prominent "Scan receipt" CTA, recent bills |
| **Historic** | `(tabs)/history` | The full list of saved bills. A list and a detail link, nothing else |
| **Account** | `(tabs)/account` | Pro subscription / upgrade, settings, **account deletion**, legal links |

### Outside the tabs

| Route | Purpose |
|---|---|
| `/bill/new/*` | The flow — a full-screen stack group holding the in-progress bill |
| `/bill/[id]` | Saved bill detail (read-only), pushed from Home or Historic |
| `/auth/sign-in`, `/auth/sign-up` | Presented modally, triggered by the scan gate |
| `/paywall` | Presented modally, from Account or a quota block |

### Rules

- **The tab bar is hidden for the entire duration of `/bill/new/*`.** A wizard with a visible tab bar invites a stray tap that abandons a half-assigned table. Leaving is an explicit back/cancel with a confirm.
- **Home's header greeting depends on auth state.** Signed in: the user's name. Signed out: a neutral greeting plus a "Sign in" affordance.
- **Home and Historic both show saved bills.** Home shows a short recent slice as a launch surface; Historic is the complete list. If Home starts growing filters, they belong in Historic.
- The in-progress bill survives backgrounding and crashes via local persistence (§8).

---

## 5. Domain model

Money is **always** integer minor units (pence/cents). There are no floats in the domain layer.

```ts
type MinorUnits = number; // integer; 1250 === £12.50

interface Person {
  id: string;           // uuid
  name: string;         // first name only
  color: string;        // person palette token, by index
  isHost: boolean;      // exactly one per bill; absorbs rounding (§6)
}

interface BillItem {
  id: string;           // uuid
  name: string;
  price: MinorUnits;
  assignedTo: string[]; // Person.id — NEVER names
}

interface Bill {
  id: string;
  restaurantName: string;
  items: BillItem[];
  people: Person[];
  serviceChargePercent: number;        // e.g. 12.5
  currency: string;                    // ISO 4217, e.g. "GBP" — NOT a symbol
  splitMode: "itemised" | "equal";     // UI state only — never read by the math (§7)
  createdAt: string;                   // ISO 8601
}
```

**Host rules:** the first person added is the host. The host is editable. The host cannot be removed while others remain; removing the last non-host person leaves the host alone with the whole bill. If the host is somehow removed, the first remaining person becomes host.

### Changes from the web prototype — and why

| Prototype | Here | Reason |
|---|---|---|
| `assignedTo` holds **names** | holds **`Person.id`** | Two people named "Ana" collide; renaming orphans items |
| `price: number` (float) | `MinorUnits` (integer) | Float division drifts; per-person totals did not sum to the total |
| `currency: "£"` (symbol) | ISO 4217 code | A symbol cannot drive formatting; the prototype also hardcodes `£` in one label regardless of the receipt's currency |
| Unassigned items silently inflate the total | Blocked, with an explicit escape hatch | Per-person totals must reconcile |
| No concept of a host | `isHost` | Rounding is absorbed by a named person, visibly |

---

## 6. Money rules

**The invariant:**

> `sum(every person's total) === grandTotal`, exactly, in minor units, always.

Enforced by a property test. Not an aspiration.

### Bill totals

- `subtotal = sum(item.price)`
- `serviceCharge = round_half_up(subtotal × serviceChargePercent ÷ 100)`
- `grandTotal = subtotal + serviceCharge`

### Per-person allocation — host absorbs the remainder

1. For each item with `n` assignees, each assignee's **exact** share is `price ÷ n` (kept as a rational, not rounded).
2. `itemsTotal_exact(p)` = the sum of that person's exact item shares.
3. `serviceShare_exact(p) = itemsTotal_exact(p) × serviceChargePercent ÷ 100`.
4. `total_exact(p) = itemsTotal_exact(p) + serviceShare_exact(p)`.
5. **Every non-host person** is charged `round_half_up(total_exact(p))`.
6. **The host is charged the remainder:** `grandTotal − sum(rounded non-host totals)`.

The invariant holds by construction. The host's adjustment is bounded by roughly half a penny per other diner, and can be positive or negative.

### The adjustment is always labelled

When the host's charged total differs from `round_half_up(total_exact(host))`, the difference is shown — `+2p` or `−1p` beside their meta line, and named in the Final bill's closing statement.

**Silently absorbing the drift would be easier and would undermine the entire trust argument.** Largest-remainder allocation is marginally fairer but invisible; this is slightly unfair and legible, and legible wins.

Rounding settles against **claimed value only** during the flow. Only the final total closes against the whole bill — otherwise unassigned items appear to land on the host mid-flow.

### Edge cases

- `subtotal === 0` → service charge and all totals are `0`.
- An item with zero assignees cannot reach Service or Final (§7).
- One person on the bill → they are the host and are charged `grandTotal`.
- Service charge is clamped to `0–30%`, in `0.5%` steps. **`0%` is a preset on purpose** — declining a discretionary charge should not take twenty-four taps.

### Formatting

`Intl.NumberFormat(deviceLocale, { style: "currency", currency: bill.currency })`. Minor units become a display value **only at the render boundary** — never earlier, never back again.

### Arithmetic is written out, not summarised

None of these are needed to complete the task. All exist so the person being asked for £14.71 can see where £14.71 came from without asking anyone.

| Where | What it prints |
|---|---|
| Assign card footer | `£5.50 each, split 3 ways` |
| Summary row, expanded | `Red Wine · £16.50 ÷ 3` → `£5.50` |
| Summary row, collapsed | `3 items · service £1.58` |
| Action bar meta | `£29.48 / £45.98` and `3 of 4 items claimed` |
| Final receipt | `£13.13 + £1.58` under each name |

---

## 7. Assignment rules

- An item may be assigned to one, several, or all people.
- **Every item must have at least one assignee before Service.** Blocking shows what is missing: *"Claim the rest to continue."*
- **Every person must have at least one item before Service.** A person owing £0.00 is almost always a typo or a duplicate. Blocking names them by toast — *"Kael has nothing assigned yet"* — and offers two resolutions: assign them something, or remove them.
- Both rules are checked together on the attempt to advance and **reported at once** — never one, then the other after the user fixes it.
- Every row has an **Everyone** shortcut, which flips to *Just \<name\>*. This is the escape hatch for the shared bottle of wine, cover charges, table bread, and taxes — always an explicit tap, never automatic. It also satisfies the person-side rule for everyone at once.
- An **Unclaimed** filter, so the last two dishes don't have to be hunted for.
- A **person rail** carries each diner's running total, so shares are watched growing rather than discovered at the end.
- Removing a person removes their id from every item's `assignedTo`, so removal is a swipe, never a one-tap icon. Any item left with zero assignees re-blocks.

### Split equally

A segmented control — `By what they ate` / `Split equally`.

**`Split equally` assigns every item to every person.** It is a bulk action over the existing model, not a second code path: the math never branches on `splitMode`, and both modes produce identical data shapes. `splitMode` is stored only so the UI can restore the right view. Selecting it trivially satisfies both blocking rules, which is correct.

---

## 8. Architecture

### Injectable client seams

Four interfaces, each with a real and a mock implementation, selected by a `USE_MOCKS` env flag. **The mock implementations are permanent test infrastructure, not scaffolding to be deleted.**

```ts
interface BillExtractionClient {
  extract(image: ImageInput): Promise<ExtractedBill>;
}

interface BillRepository {
  list(): Promise<Bill[]>;
  get(id: string): Promise<Bill | null>;
  save(bill: Bill): Promise<Bill>;
  delete(id: string): Promise<void>;
}

interface AuthClient {
  currentUser(): Promise<User | null>;
  signIn(credentials: Credentials): Promise<User>;
  signUp(credentials: Credentials): Promise<User>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
}

interface SubscriptionClient {
  entitlement(): Promise<"free" | "pro">;
  scansRemaining(): Promise<number>;
  purchase(plan: PlanId): Promise<void>;
  restore(): Promise<void>;
}
```

Build order: **every screen against mocks first, real implementations after.** No component ever imports a concrete client.

### Local persistence

The in-progress bill is written to device storage on every mutation, so a crash or backgrounding never loses a half-assigned table. Saved bills are cached locally and synced to Supabase.

### Stack

Expo (managed) + EAS Build · Expo Router · NativeWind · Supabase · RevenueCat · TypeScript strict · Jest + React Native Testing Library

---

## 9. Backend

The existing `bill-splitter` Next.js app is deployed to Vercel and stripped to API-only. Its layered pipeline (`route → services/billExtraction → lib/gemini`) and Jest coverage stay as they are.

### `POST /api/extract` — changes required

| | Prototype | Here |
|---|---|---|
| Auth | none | `Authorization: Bearer <Supabase JWT>`, verified server-side |
| Quota | none | Checked **before** the Gemini call, incremented **after** a 200 |
| Response `price` | float | minor units (integer) |
| Response `currency` | symbol | ISO 4217 |

New failure modes: `401` unauthenticated, `429` quota exhausted (body names the reset date).

**Quota is enforced here and only here.** The app displays the remaining count; it never decides it.

Unchanged: no printed total, no per-item confidence. Quantity > 1 stays one row per unit.

### Supabase schema (sketch)

- `profiles` — user, plan, `quota_reset_at`, `scans_used`
- `bills` — bill JSON, owner, timestamps
- `saved_people` — reusable names per user (Pro)

RLS on every table: a user reads and writes only their own rows.

---

## 10. Auth

- **Required** to scan — the quota model cannot meter anonymous users.
- **Gated at the scan, not at launch.** The app opens onto Home. Tapping "Scan receipt" while signed out presents auth modally.
- Email/password at minimum. **If Google sign-in ships, Sign in with Apple must ship too** (App Store 4.8).
- **In-app account deletion is mandatory** (App Store 5.1.1(v)) — a real deletion in Settings, not an email request.

---

## 11. Monetization

**Free**
- **3 successful scans per month**, rolling from the signup anniversary (no calendar-month cliff)
- Full core flow, no feature crippling
- **Manual bill entry: unlimited and free, forever** — no API call, no cost, and the app is never fully bricked

**Pro** — £2.99/month or £19.99/year, via **RevenueCat** over StoreKit
- Unlimited scans
- Full bill history and search
- Export / share
- **Saved people** — store the names you split with constantly and add them in one tap
- Saved groups

**Rules**
- Only a **successful** extraction decrements the quota. Blurry photos, "not a receipt", and Gemini `503`s are free — increment after the 200, never before the call.
- Apple takes 15% (Small Business Program) or 30%. Price accordingly.
- A **Restore Purchases** button is required.
- Terms and Privacy Policy links must be visible on the paywall before purchase.
- **The Pro surface is the only surface allowed to sell.** Everything else stays neutral.

**Known business risk, recorded deliberately:** people split restaurant bills maybe 2–4×/month, so a scan ceiling is a weak lever in isolation. Pro's real pull is accumulated value — history, saved people, export. Instrument the free tier and revisit with real data.

---

## 12. Design system

Every colour in the product is a **semantic token**. Nothing references a raw hex. Light mode re-points the same names — **no component knows which theme it is in, and no component carries a light-mode branch.**

### Two rules govern the mapping

**Hue is preserved, lightness is inverted.** The dark base is a warm near-black `#0D0806`; the light base is `#F7F3EB`, the same warmth read from the other end. There is **no pure black anywhere, and no pure white as text** — dark text tops out at `#F7F2EC`. Light-mode cards do use `#FFFFFF`, deliberately, so they lift off the base without a shadow.

**Fills keep their colour; text and lines get a darkened counterpart.** A filled amber button, a progress rail and an avatar are the *same hex* in both themes. What changes is amber used as **ink** — `#E9B935` on `#F7F3EB` is about 1.6:1, unreadable — so amber-as-text is its own role. Applied inconsistently, this looks like a bug: **every amber text role reads `--accent-text`, every amber fill reads `--accent`.**

Amber tints also gain opacity in light (16% → 28%) — a wash that reads against near-black vanishes against off-white. **Shadows change hue, not alpha:** warm brown, because black on a warm off-white reads grey and makes the surface look dirty.

### Tokens

| Token | Dark | Light | Role |
|---|---|---|---|
| `--bg-app` | `#0D0806` | `#F7F3EB` | App background |
| `--bg-well` | `#100B08` | `#EFE8DC` | Upload well |
| `--bg-sunken` | `#14100C` | `#F2ECE1` | Nested panel, fields, segmented track |
| `--bg-card` | `#191310` | `#FFFFFF` | Card / row |
| `--bg-sheet` | `#1C1511` | `#FFFFFF` | Bottom sheet |
| `--bg-chip` | `#1B1510` | `#F5F0E6` | Unselected chip |
| `--bg-control` | `#241C15` | `#F0EADF` | Control fill, secondary button, track |
| `--bd-hair` | `#241C15` | `#EBE3D5` | Hairline |
| `--bd-card` | `#2B211A` | `#E5DCCC` | Card border |
| `--bd-input` | `#33271D` | `#DCD2C0` | Input border |
| `--bd-control` | `#3A2E22` | `#DACFBC` | Control border |
| `--bd-dashed` | `#4A3B2A` | `#C7BBA4` | Dashed border |
| `--bar` | `rgba(18,13,10,.94)` | `rgba(247,243,235,.94)` | Floating bar |
| `--scrim` | `rgba(6,4,3,.7)` | `rgba(46,35,22,.38)` | Sheet scrim |
| `--toast-bg` | `rgba(28,21,17,.96)` | `rgba(255,255,255,.98)` | Toast |
| `--paper-a` / `-b` | `#2A2118` / `#20180F` | `#E9E0CF` / `#DBD0BA` | Final-bill paper gradient |
| `--t1` | `#F7F2EC` | `#191310` | Primary reading text |
| `--t2` | `#D8CEC4` | `#443C33` | Secondary emphasis |
| `--t3` | `#A99C90` | `#6C6156` | Body support, captions |
| `--t4` | `#71675E` | `#8A7F72` | Labels, metadata, inactive tabs |
| `--t5` | `#5C534B` | `#A2978A` | Chevrons and dividers — **never type** |
| `--accent` | `#E9B935` | `#E9B935` | Amber **fill** — identical in both themes |
| `--accent-line` | `#E9B935` | `#C99A1B` | Amber **line** |
| `--accent-text` | `#E9B935` | `#8C6104` | Amber **ink** |
| `--am07` … `--am16` | 7–16% amber | 16–28% amber | Selected-state tints |
| `--am-line18/40/50` | 18/40/50% amber | 30/55/65% of `#C99A1B` | Selected-state hairlines |
| `--chip-on-bg` / `-ink` | `#F7F2EC` / `#170F06` | `#191310` / `#FFF6E2` | Selected chip — both halves swap, so the pill stays the darkest thing on screen |
| `--mint` | `#45D97F` | `#2E9E5B` | Verified — fill |
| `--mint-text` | `#8FD9AC` | `#1D7A43` | Verified — ink |
| `--mint-tint` / `-line` | 9% / 30% | 10% / 34% | Verified — surface |
| `--danger` | `#E9614B` | `#D4472F` | Destructive — fill |
| `--danger-text` / `-soft` | `#F08A82` / `#F0A79A` | `#B03A26` / `#B03A26` | Destructive — ink |
| `--danger-tint` / `-line` / `-line-a` | 10% / `#6B2320` / 35% | 9% / `#E7B3A8` / 30% | Destructive — surface |
| `--swipe-bg` / `--swipe-text` | `#4A1512` / `#FFD9D5` | `#D4472F` / `#FFF1EE` | Swipe-to-delete reveal |
| `--sh-a/b/c` | black 50/55/60% | `rgba(72,54,30,…)` 14/16/20% | Shadows |

**Removed and not to be reintroduced:** all lilac tokens, `--scan-dim`, `--scan-pill`, `--ring-on`, `--ring-hot`. Lilac's meaning ("a model produced this"), the `SCANNED` row label, and the scan sweep are cut entirely — extraction shows a skeleton or loading screen and then goes to Review.

`--bd-hair` and `--bg-control` share `#241C15` in dark. Known and accepted; avoid placing a `--bg-control` element directly on a `--bd-hair` edge.

### Reserved colours

Two colours are vocabulary, not decoration:

- **Mint — verified.** Only on statements the app can actually prove: the assign rail once every item is claimed, and the Final bill's confirmation that the shares sum to the bill total. It is **not** a claim about the receipt's printed total, which the app never reads (§2).
- **Red — destructive.** Removal, deletion, swipe-to-delete.

Because green carries a claim about correctness and red carries a warning, **neither appears in the person palette. A person's colour must never look like a verdict.**

### Person palette

Assigned by index. Identical in both themes — avatars are fills.

| Token | Value | Notes |
|---|---|---|
| `--person-1` | `#E9B935` | **Host only.** Never handed to a second diner — amber on a person means "you" |
| `--person-2` | `#4FA8E9` | |
| `--person-3` | `#F0913C` | Replaced `#E9614B`, which collided with destructive red |
| `--person-4` | `#EE68B4` | |
| `--person-5` | `#A97BEE` | |
| `--person-6` | `#7BD1E9` | |

Each carries a paired dark ink for the initial (e.g. `#0B1620` on `--person-2`, `#25081A` on `--person-4`).

### Typography

**Figtree** for all interface text. **Space Mono** for all money — every amount, total, share, subtotal, service charge and price input, always `tabular-nums`.

**Money never renders in the interface face, and the interface never renders in the money face.** Tabular figures align decimal points down a column of shares, and the face-change is itself the signal that an amount is not a label.

| Role | Spec |
|---|---|
| Screen title | Figtree 800 · 30/1.1 · `-.025em` |
| Card headline | Figtree 700 · 19/1.25 · `-.01em` |
| List row title | Figtree 600 · 15.5/1.2 |
| Body | Figtree 400 · 14/1.45 · `--t3` |
| Section label | Figtree 700 · 11 · `.16em` · uppercase · `--t4` |
| Total | Space Mono 700 · 34/1 · tabular · `-.02em` |
| Row amount | Space Mono 700 · 16 · tabular |
| Amount sub-line | Space Mono 400 · 11 · `--t3` |

Weights: 800 headings · 700 buttons and pill labels · 600 row titles · 500 meta · 400 supporting copy. **Nothing renders below 11px.**

### Shape and depth

| Radius | Applied to |
|---|---|
| 11px | Swatches, small tiles |
| 15px | List rows, buttons |
| 18px | Cards, paywall blocks |
| 26px | Floating tab island |
| 999px | Chips and avatars |

Shadows: `--sh-a` `0 6px 16px` resting card lift · `--sh-b` `0 14px 34px` tab island and floating bars · `--sh-c` `0 22px 48px` sheets over a scrim.

### Accessibility — a stated exception

Body text and interactive labels target **WCAG AA (4.5:1)**. **`--t4` is a deliberate exception**, measuring ~3.6:1 dark and ~3.5:1 light. It is used for section labels, metadata and inactive tab labels, where the muted hierarchy was judged worth the shortfall. This is a decision, not an oversight — revisit if user feedback contradicts it. `--t5` is exempt because it is never type.

---

## 13. Testing

**Non-negotiable — Jest unit tests on pure logic:**
- Item allocation across n assignees, including indivisible remainders
- **Host-absorbs rounding**, including a negative adjustment, and the `+2p` label value
- **Property test: `sum(person totals) === grandTotal`** across randomized bills — random item counts, prices, assignee overlaps and service percentages
- `splitMode: "equal"` produces the same data shape as itemised assignment
- Quota rules: a failed extraction does not decrement; the rolling reset boundary
- Currency formatting across locales

**React Native Testing Library** on flow components, with mock clients injected — both blocking rules firing together, the Everyone shortcut, split-equally, host reassignment, and person removal cascading into `assignedTo`.

**Out of scope:** E2E.

The backend's Jest suite stays in the web repo and must be extended to cover the new auth and quota branches.

---

## 14. Milestones

**M1 — Shell.** Expo + Router + NativeWind, both fonts loaded, every token wired as a themed variable, all routes stubbed.

**M2 — The flow on mocks.** All steps against `MockExtractionClient` and `MockBillRepository`. No network anywhere. Usable end to end with fake data.

**M3 — The math.** Allocation module plus the full unit and property suite. This is where a bug costs someone real money; it lands with its tests or not at all.

**M4 — Backend.** Vercel deploy, Supabase schema + RLS, auth wired, `/api/extract` gains JWT verification and quota. Real clients swapped in behind the flag.

**M5 — Monetization.** RevenueCat, paywall, entitlements, restore purchases, saved people.

**M6 — Publishable.** Account deletion, privacy policy, terms, store assets, TestFlight, submission.

**Design gap:** four screens in this spec have no Figma and must be designed from tokens — **sign-in / sign-up**, **the paywall**, **Historic**, and **the quota-exhausted state** (what a free user sees on their 4th scan). M5/M6 work.

---

## 15. Publishing checklist (iOS first)

- [ ] Apple Developer Program — **$99/year**, required before TestFlight
- [ ] EAS Build + TestFlight is the only device loop (no local iOS builds on Windows; expect 10–20 min per build)
- [ ] **IAP cannot be tested in Expo Go** — needs a development build and a sandbox tester account
- [ ] In-app account deletion (5.1.1(v))
- [ ] Restore Purchases button
- [ ] Privacy Policy + Terms, hosted and linked from the paywall and Settings
- [ ] Privacy Nutrition Label — declare email; declare that no photos are stored
- [ ] Camera and photo-library usage strings that say why
- [ ] App icon, screenshots at required device sizes, description
- [ ] Sign in with Apple, *if* any third-party social login ships

Android (Play, $25 one-time) follows once iOS is stable.

---

## 16. Open questions

- The free-tier number (3/month) is a guess — instrument it and revisit with real data.
- Whether "saved groups" is distinct from "saved people", or just a grouping of them.
- Export format for the Final bill: rendered image, or native share sheet with text?
- **Quantities.** Extraction emits one row per unit, so two beers are two rows. Grouping with a `×2` badge is unresolved.
- **Multi-page receipts.** Nothing handles a second page.
- **Item-first assignment** (one dish at a time, big faces, swipe for next) may be faster for a table of eight and slower for a table of three. Worth building behind a preference?
- Does the host absorbing rounding need a control, or is silently-labelled acceptable?
