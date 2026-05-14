# Plaid Sandbox Integration

A local Node.js + Express project that integrates with Plaid Link in **Sandbox** mode, exchanges a `public_token` for an `access_token`, and pulls account transaction data with `/transactions/sync`. This project was built to practice API integration, troubleshooting, and support-style debugging with realistic Plaid flows.

## Overview

This app walks through the main Plaid sandbox lifecycle:

- Create a **Link token** so the frontend can launch Plaid Link.
- Connect a sandbox institution and complete login / MFA when required.
- Exchange the returned **public token** on the backend for an **access token** and **item ID**.
- Call **`/transactions/sync`** to retrieve transaction updates and track the returned **`next_cursor`** for future sync calls.
- Review raw JSON responses to understand payload structure and debug the integration more effectively.

## Why I built it

I built this project to get hands-on experience with the kind of issues support and integration engineers handle in real products: OAuth flows, MFA friction, token exchange, endpoint debugging, and explaining raw API responses clearly.

## Tech stack

- Node.js
- Express.js
- Plaid API / Plaid Link
- JavaScript
- dotenv
- HTML / CSS / frontend JavaScript

## Project flow

```text
Frontend
  -> POST /api/create_link_token
  -> Launch Plaid Link
  -> Receive public_token
  -> POST /api/exchange_public_token
  -> Backend stores access_token + item_id
  -> POST /api/transactions_sync
  -> Return transactions + next_cursor
```

## Repository structure

```text
plaid-sandbox-integration/
├── public/
│   └── index.html
├── docs/
│   ├── transactions-sync.md
│   └── error-walkthroughs.md
├── server.js
├── plaidClient.js
├── package.json
├── .env.example
└── README.md
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create your environment file

```bash
cp .env.example .env
```

Example `.env` values:

```env
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_sandbox_secret
PLAID_ENV=sandbox
PLAID_PRODUCTS=transactions
PLAID_COUNTRY_CODES=US
PLAID_REDIRECT_URI=
```

### 3. Start the app

```bash
node server.js
```

Then open:

```text
http://localhost:4000
```

## Usage

1. Open the app in your browser.
2. Click the Plaid Link button.
3. Complete the sandbox bank login flow.
4. Let the frontend send the returned `public_token` to the backend.
5. Exchange the token and store the returned `access_token`.
6. Call the transactions sync route to fetch transaction data and the latest `next_cursor`.

Example request:

```bash
curl -X POST http://localhost:4000/api/transactions_sync \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Main endpoints

### `POST /api/create_link_token`
Creates the Plaid Link token required to initialize Link in the frontend.

### `POST /api/exchange_public_token`
Exchanges a short-lived `public_token` for a persistent sandbox `access_token` and `item_id` on the server.

### `POST /api/transactions_sync`
Retrieves transaction updates from Plaid and returns pagination state through `next_cursor`.

## What I learned

- How Plaid Link and backend token exchange fit together in a real integration.
- How `/transactions/sync` differs from a one-time fetch by using cursors for incremental updates.
- How to inspect raw API payloads and explain technical behavior in a support-friendly way.
- How sandbox test flows help reproduce common user issues before working with production data.

## Current limitations

- Tokens and cursors are currently stored in memory, so restarting the server clears the local session.
- The project is focused on sandbox testing and local development, not production deployment.
- The frontend currently emphasizes visibility and debugging over polished data visualization.

## Next improvements

- Persist the `access_token` and `next_cursor` in a database.
- Render transactions in a frontend table instead of raw output.
- Add more sandbox error scenarios to `docs/error-walkthroughs.md`.
- Add screenshots or short request / response examples for faster repo review.

## Notes

This project uses Plaid **Sandbox** for learning and testing.
