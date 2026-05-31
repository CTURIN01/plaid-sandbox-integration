# Plaid API Support Reference

A field guide mapping common Plaid error codes to root cause, reproduction
steps, and resolution. Built by intentionally triggering errors in Sandbox.

---

## Error Reference

### INVALID_API_KEYS
- **Root cause:** `client_id` or `secret` is missing, incorrect, or from the
  wrong environment (e.g. Production key used against Sandbox host).
- **How to reproduce:** Set an incorrect `PLAID_SECRET` in `.env` and call
  any endpoint.
- **Resolution:** Verify both values in the Plaid Dashboard. Confirm
  `PLAID_ENV=sandbox` matches `https://sandbox.plaid.com` as the API host.

---

### ITEM_LOGIN_REQUIRED
- **Root cause:** The Item's access token is no longer valid. The institution
  requires the user to re-authenticate (expired session, MFA reset, or
  password change).
- **How to reproduce:** In Sandbox, call
  `/sandbox/item/reset_login` with a valid `access_token`.
- **Resolution:** Re-run the Plaid Link flow for the affected Item and
  exchange a new `public_token` for a fresh `access_token`.

---

### INVALID_ACCESS_TOKEN
- **Root cause:** The `access_token` passed in the request does not exist or
  has been invalidated.
- **How to reproduce:** Pass a malformed or deleted token to
  `/transactions/get`.
- **Resolution:** Check that the correct `access_token` is being read from
  storage. If deleted, re-link the Item.

---

### PRODUCT_NOT_READY
- **Root cause:** The requested product (e.g. Transactions) has not finished
  initializing for the Item. Plaid fetches data asynchronously after Link.
- **How to reproduce:** Call `/transactions/get` immediately after
  `/item/public_token/exchange` with no delay.
- **Resolution:** Wait for the `INITIAL_UPDATE` or `HISTORICAL_UPDATE`
  webhook before calling `/transactions/get`. Implement retry with backoff.

---

### NO_ACCOUNTS
- **Root cause:** The linked Item has no accounts that match the product
  requirements (e.g. no depository accounts for Auth).
- **Resolution:** Confirm the correct institution and account type were
  selected during Link. Re-run Link and select a valid account.

---

### INSTITUTION_DOWN / INSTITUTION_NOT_RESPONDING
- **Root cause:** The financial institution's connection is temporarily
  unavailable. Not a bug in your integration.
- **Resolution:** Retry after a delay. In Sandbox, use
  `/sandbox/item/fire_webhook` to simulate recovery. In Production, monitor
  `status.plaid.com` for institution-level outages.

---

### RATE_LIMIT_EXCEEDED
- **Root cause:** Too many API calls in a short window.
- **Resolution:** Implement exponential backoff. Cache responses where
  possible. Use `/transactions/sync` (cursor-based) instead of repeated
  `/transactions/get` calls for efficiency. [web:2798]

---

## Webhook Reference

| Webhook | When it fires | What to do |
|---|---|---|
| `INITIAL_UPDATE` | First ~30 transactions loaded | Safe to call `/transactions/get` |
| `HISTORICAL_UPDATE` | Full transaction history loaded | Sync full history |
| `DEFAULT_UPDATE` | New transactions available | Pull latest transactions |
| `TRANSACTIONS_REMOVED` | Transactions were deleted/reversed | Remove from local DB |
| `ERROR` | Item error (e.g. login required) | Prompt user to re-link |

---

## Sandbox Test Credentials

| Scenario | Username | Password |
|---|---|---|
| Normal login | `user_good` | `pass_good` |
| Wrong password | `user_good` | `pass_bad` |
| MFA required | `user_good` | `pass_mfa` |
| Locked account | `user_locked` | `pass_good` |

---

## Useful Sandbox Endpoints

```bash
# Force an Item into LOGIN_REQUIRED state
POST /sandbox/item/reset_login
{ "access_token": "access-sandbox-..." }

# Fire a webhook manually
POST /sandbox/item/fire_webhook
{ "access_token": "access-sandbox-...", "webhook_code": "DEFAULT_UPDATE" }

# Create a test public_token (bypasses Link UI)
POST /sandbox/public_token/create
{ "institution_id": "ins_109508", "initial_products": ["transactions"] }
```
