# Payment System — Current State (branch: `payment-system`)

Snapshot of the existing payment implementation, written before rebuilding it in a simpler way on a new branch. Use this as the reference for "what it did before" — not as a spec to preserve.

## App location

- Backend: `backend/apps/payment/` (Django app label `lms_payment`)
- Frontend: `frontend/src/service/paymentService.js`, `frontend/src/service/subscriptionService.js`, `frontend/src/store/usePaymentStore.js`, `frontend/src/store/useSubscriptionStore.js`, pages under `frontend/src/app/[locale]/(website)/payment/*`, `.../student/subscription`, `.../parents/subscription`, `.../pricing`.
- Payment provider: **Dinger** (Myanmar payment gateway). RSA-encrypted checkout payload + AES-encrypted/HMAC-checksummed callback.

## Data model (`models.py`)

- `SubscriptionPlan` — name, auto-generated `code` (`P0001`, `P0002`, …), price, `duration_days`, M2M to `PaymentPermission`, `is_active`.
- `PaymentPermission` — simple code/name/description used to gate features (e.g. `VIEW_PREMIUM_CONTENT`), attached to plans.
- `Feature` / `PlanFeature` — marketing feature list shown on plan cards (name + value per plan), ordered for display.
- `ParentOrder` — groups multiple children's payments into one checkout when a parent pays for several kids at once. Has its own `order_number`, `total_amount`, `status`.
- `PaymentTransaction` — one row per (child) payment attempt. Has `payer` (who paid) vs `user` (who benefits — a student), `plan`, `grade_level`, `amount`, `order_number`, `transaction_id`, `provider_transaction_id`, `callback_payload` (raw JSON from Dinger), `status` (pending/processing/success/failed/cancelled), `failure_reason`, optional FK to `ParentOrder`.
- `Subscription` — the actual entitlement: user, plan, grade_level, start/end date, status (active/expired/cancelled), FK to the `PaymentTransaction` that created it.
- `PurchaseRequest` — token-based "ask my parent to pay" flow (student requests, parent gets emailed a link with a UUID token). Note: **not actually wired up** — `ParentPaymentRequestView` just emails a generic request without creating a `PurchaseRequest` row or token link (see Gaps below).
- `SubscriptionReminderSetting` / `SubscriptionReminderLog` — configurable "N days before expiry" email reminders, deduped via a log table + `unique_together`.

## Request flow

### 1. Plan listing
`GET /payment/plans/` (`SubscriptionPlanListView`, public) → active plans with nested features.

### 2. Single (self or parent-for-one-child) checkout
`POST /payment/initialize/` (`InitializePaymentView`, requires `create_payment` perm)
- Body: `{ grade, plan_code, payment_method, child_user_id? }`.
- If `child_user_id` given, resolves the child via `ParentService.get_child(payer, child_id)` — enforces the payer actually parents that child.
- `PaymentService.initialize_payment`:
  - If the target already has an active, non-expired subscription for that grade, **reuses that plan** (ignores the requested `plan_code` — this is for renewals).
  - Blocks a second checkout if a `pending` transaction was created within the last 60 seconds; otherwise auto-fails the stale pending transaction and proceeds.
  - Creates a `PaymentTransaction`, then calls `DingerService.generate_checkout_url` to build the redirect URL. On any failure building the URL, marks the transaction failed and re-raises.
- Response: `{ checkout_url, order_number }`.

### 3. Parent multi-child checkout
`POST /payment/parent-checkout/` (`InitializeParentPaymentView`, requires `create_payment` perm)
- Body: `{ children: [{ child_id, plan_code }], payment_method }`.
- Creates one `ParentOrder`, one `PaymentTransaction` per child (same active-subscription-reuse logic as above, but **no duplicate-pending-payment guard** here), sums the total, builds one combined Dinger checkout (`generate_parent_checkout`) with one line item per child.
- Response: `{ checkout_url, order_number }` (parent order number, `PO-...`).

### 4. Dinger checkout URL construction (`dinger_services.py`)
- Builds a payload dict (client/public/merchant keys, customer info, hardcoded Mandalay/MM billing address, item list).
- RSA-encrypts the JSON payload with `DINGER_ENCRYPTION_KEY` in 64-byte chunks (`PKCS1_v1_5`), base64s it.
- HMAC-SHA256s the **plaintext** JSON with `DINGER_SECRET_KEY` as a separate `hashValue`.
- Redirect URL: `{DINGER_BASE_URL}?payload=...&hashValue=...`.

### 5. Callback
`POST /payment/callback/` (`DingerCallbackView`, public — Dinger calls this server-to-server)
- `CallbackService.get_callback_data`: in dev (`DINGER_DEV_CALLBACK = True`, currently hardcoded on in `settings.py`), ignores the real request body and always replays a canned payload/checksum from `dinger_local_dev.py`, then **rewrites `merchantOrderId` to whichever transaction/parent-order was created most recently** — a hack to let local checkout flows "complete" without a real gateway.
- In prod mode: reads `paymentResult` + `checksum` from the POST body.
- `CallbackService.process_callback`:
  - AES-ECB decrypts `paymentResult` with `DINGER_CALLBACK_KEY`, strips PKCS-style padding.
  - Verifies checksum = `sha256(decrypted_json)`.
  - Looks up `ParentOrder` by `merchantOrderId` first (parent multi-child flow), else falls back to a single `PaymentTransaction`.
  - For a `ParentOrder`: marks it `success` and calls `PaymentService.complete_payment` for every child transaction unconditionally (doesn't map Dinger's actual per-order status — always treats it as success).
  - For a single transaction: maps Dinger status strings (`SUCCESS`/`DECLINED`/`TIMEOUT`/`CANCELLED`/`SYSTEM_ERROR`/`ERROR`) to internal status, checks `totalAmount` against the transaction amount (fails with `AMOUNT_MISMATCH` on mismatch), then on success calls `PaymentService.complete_payment`.
- `PaymentService.complete_payment(order_number)`: idempotent-ish — marks transaction `success`, and if no `Subscription` already exists for that transaction, creates one. If the user already had an active subscription for that grade, **extends it** (new end_date = old end_date + plan duration, old row marked `expired`) instead of stacking two active rows.

### 6. Status polling
`GET /payment/status/<order_number>/` (`PaymentStatusView`, authenticated) — frontend polls this after redirect back from Dinger. Checks `ParentOrder` first, then `PaymentTransaction`.

### 7. Subscription views
- `GET /payment/subscription/` (`StudentSubscriptionView`) — current subscription (active one preferred) + full payment history for the logged-in user.
- `GET /payment/renew-info/` (`RenewInfoView`) — current active subscription's plan/grade, used to prefill a renewal checkout.
- `POST /payment/request-parent-payment/` (`ParentPaymentRequestView`) — sends a generic "please pay" email to a given address. Does **not** create a `PurchaseRequest` or a token link despite the model existing for that purpose.

## Permissions

Two separate, overlapping permission layers:
1. **Django model permissions** checked via `request.user.has_perm("lms_payment.<perm>")` in `permissions.py` (`CanCreatePayment`, `CanViewSubscription`, `CanRenewSubscription`, `CanCreatePurchaseRequest`, etc.), assigned to role groups by `apps/auth/management/commands/assign_permissions.py`.
2. **Feature-gate permission** (`PaymentPermissionService` in `permission_service.py`) — checks whether the user's *active subscription's plan* grants a `PaymentPermission` code (currently only `VIEW_PREMIUM_CONTENT`). Used in `apps/course/access.py` (`can_access_item`) to decide whether a student can view a paid lesson/item, alongside role checks (staff/superuser/teacher-role/admin-role bypass, free courses, preview items).

These are independent: #1 governs who can call the payment *endpoints*, #2 governs whether a *subscription* unlocks *content*.

## Supporting pieces

- `crypto_utils.py` — `DingerCrypto`: AES-ECB decrypt + checksum verify for callbacks (paired with the RSA/HMAC encode side in `dinger_services.py`).
- `dinger_local_dev.py` — hardcoded fake callback payload/checksum/key for local testing, only used when `DINGER_DEV_CALLBACK=True`.
- `email_utils.py` — three transactional emails: parent payment request, subscription reminder, subscription expired — all via Django templates in `templates/payment/`.
- `management/commands/subscription_expiry.py` — cron-style command: flips overdue active subscriptions to `expired`, emails the student.
- `management/commands/subscription_reminders.py` — cron-style command: for each active subscription, checks configurable `SubscriptionReminderSetting.days_before_expiry` thresholds, emails once per threshold (dedup via `SubscriptionReminderLog`).
- Tests: `tests/test_initialize_payment.py`, `tests/test_verify_payment.py` (callback/complete-payment flow), `tests/test_subscription_plans.py`.

## Frontend integration

- `paymentService.js`: `initializePayment`, `initializeParentPayment`, `getPlans`, `getRenewInfo`, `getPaymentStatus`, `processCallback`.
- `subscriptionService.js`: `getMySubscription`, `getRenewInfo`.
- Pages: `/payment` (kicks off checkout, redirects to Dinger), `/payment/process`, `/payment/success`, `/payment/failed` (post-redirect landing pages that poll `getPaymentStatus`), `/pricing` (plan list), `/student/subscription`, `/parents/subscription`.
- `PremiumUpgradeModal.jsx`, `Navbar.jsx`, `AdminSidebar.jsx` reference subscription state for gating UI.

## Known gaps / oddities worth knowing before a rewrite

- `DINGER_DEV_CALLBACK = True` is hardcoded in `settings.py` (not env-driven) — real callbacks are currently unreachable in this checkout unless that's flipped.
- The dev-callback path guesses which order to "complete" by picking whichever `ParentOrder`/`PaymentTransaction` was most recently created — fragile if two checkouts are in flight.
- `PurchaseRequest` model (token-based parent-pays-for-student flow) exists but `ParentPaymentRequestView` doesn't use it at all — it's dead/unfinished scaffolding.
- Parent multi-child checkout (`initialize_parent_payment`) has no duplicate-pending-payment guard, unlike the single-child path.
- Parent-order callback completion doesn't actually branch on Dinger's per-order status — any callback matched to a `ParentOrder` is treated as success.
- Two independent permission systems (Django perms for endpoint access, `PaymentPermissionService` for content-gating) — easy to confuse when reasoning about "can this user do X".
- `views.py` has a few `print()`/`traceback.print_exc()` debug statements left in (`InitializePaymentView`, `DingerCallbackView`) and `PaymentService.complete_payment` has leftover `print()` calls too.
- Order numbers are generated client-independent (`MM-<12 hex>`, `PO-<12 hex>`) with no external reference back to Dinger until the callback arrives.
