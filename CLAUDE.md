# Split-it — Mobile

React Native (Expo) app that turns a receipt photo into a per-person split.

**Read [SPEC.md](SPEC.md) before any non-trivial work.** It is the source of truth for scope, architecture, business rules, and design. This file only carries the rules that must never be violated.

---

## Non-negotiable invariants

1. **Money is integer minor units.** No floats in the domain layer, ever. Convert to a display value only at the render boundary, never back.

2. **`sum(every person's total) === grandTotal`, exactly.** Non-host people are rounded half-up from their exact share; **the host is charged the remainder**, and that adjustment is always labelled (`+2p` / `−1p`). There is a property test — it does not get skipped or loosened.

3. **`assignedTo` holds `Person.id`, never names.** The web prototype used names; that was a bug.

4. **Quota is enforced server-side only,** inside `/api/extract`, before the Gemini call, incremented only after a `200`. The app displays the remaining count; it never decides it. A failed extraction never decrements.

5. **Receipt images are never persisted.** Not on device, not in Supabase, not anywhere. Send, use, discard.

6. **No component imports a concrete client.** Everything goes through `BillExtractionClient`, `BillRepository`, `AuthClient`, `SubscriptionClient`. Mock implementations are permanent infrastructure, not scaffolding.

7. **Service is blocked until every item has a person and every person has an item.** Both directions, checked together and reported at once. Blocking is intentional. The escape hatch is the explicit per-row "Everyone" shortcut — never assign automatically.

   `Split equally` is a bulk action that assigns everyone to every item. **The math never branches on `splitMode`** — both modes produce identical data.

   The tab bar is hidden for the whole of `/bill/new/*`; the flow lives outside the tab group.

8. **Nothing references a raw hex.** Every colour is a semantic token, re-pointed for light mode. No component reads `colorScheme`; no component carries a light-mode branch.

   **Amber fills are `--accent` and identical in both themes. Amber ink is `--accent-text` and darkens in light.** Getting this backwards looks like a bug.

   **Mint means verified and red means destructive — neither is decorative, and neither appears in the person palette.** `--person-1` is amber and reserved for the host alone.

9. **Figtree for interface, Space Mono for money. No exceptions in either direction.** Money never renders in the interface face; the interface never renders in the money face. Money is always `tabular-nums`. Nothing renders below 11px.

10. **The app never reads or compares the receipt's printed total.** No reconciliation banner, no per-item confidence, no `SCANNED` label. A wrong scan is fixed by editing in Review.

---

## Stack

Expo (managed) + EAS Build · Expo Router · NativeWind · Supabase · RevenueCat · TypeScript strict · Jest + React Native Testing Library

## Related repo

`bill-splitter` — the original Next.js app, now **backend-only**. Hosts `/api/extract` on Vercel. Its UI components are a design reference and are not maintained. `types/bill.ts` is duplicated between the repos on purpose; do not build a shared package.

## Out of scope

Multiplayer, web UI, receipt image storage, printed-total reconciliation, scan confidence, lilac, E2E tests, Stripe or any non-IAP payment, Android (until iOS is stable).
