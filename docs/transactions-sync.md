# Transactions Sync – Sandbox Walkthrough

Called `/api/transactions_sync` after successfully linking a Plaid sandbox Item. The initial response returned multiple `added` transactions, including:

- `name`: "ACH Electronic CreditGUSTO PAY 123456"
- `amount`: 5850
- `date`: "2026-05-13"
- `payment_channel`: "online"
- `personal_finance_category.primary`: "TRANSFER_OUT"

This demonstrates the full Link → token exchange → transactions sync pipeline working end‑to‑end in the sandbox.