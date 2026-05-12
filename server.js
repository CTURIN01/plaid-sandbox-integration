const express = require('express');
const path = require('path');
require('dotenv').config();

const client = require('./plaidClient');

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let SAVED_ACCESS_TOKEN = null;
let SAVED_ITEM_ID = null;
let SAVED_CURSOR = null;

function parseProducts() {
  return (process.env.PLAID_PRODUCTS || 'transactions')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);
}

function parseCountryCodes() {
  return (process.env.PLAID_COUNTRY_CODES || 'US')
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);
}

app.post('/api/create_link_token', async (req, res) => {
  try {
    const request = {
      user: {
        client_user_id: 'test-user-123',
      },
      client_name: 'Chris Plaid Sandbox App',
      products: parseProducts(),
      country_codes: parseCountryCodes(),
      language: 'en',
    };

    if (process.env.PLAID_REDIRECT_URI) {
      request.redirect_uri = process.env.PLAID_REDIRECT_URI;
    }

    const response = await client.linkTokenCreate(request);
    res.json({ link_token: response.data.link_token });
  } catch (error) {
    console.error('create_link_token error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to create link token',
      details: error.response?.data || error.message,
    });
  }
});

app.post('/api/exchange_public_token', async (req, res) => {
  try {
    const { public_token } = req.body;

    const response = await client.itemPublicTokenExchange({ public_token });

    SAVED_ACCESS_TOKEN = response.data.access_token;
    SAVED_ITEM_ID = response.data.item_id;
    SAVED_CURSOR = null;

    res.json({
      access_token: SAVED_ACCESS_TOKEN,
      item_id: SAVED_ITEM_ID,
    });
  } catch (error) {
    console.error('exchange_public_token error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to exchange public token',
      details: error.response?.data || error.message,
    });
  }
});

app.post('/api/transactions_sync', async (req, res) => {
  try {
    if (!SAVED_ACCESS_TOKEN) {
      return res.status(400).json({ error: 'No access token saved yet. Link an account first.' });
    }

    const response = await client.transactionsSync({
      access_token: SAVED_ACCESS_TOKEN,
      cursor: SAVED_CURSOR,
    });

    SAVED_CURSOR = response.data.next_cursor;

    res.json({
      added: response.data.added,
      modified: response.data.modified,
      removed: response.data.removed,
      next_cursor: response.data.next_cursor,
      has_more: response.data.has_more,
    });
  } catch (error) {
    console.error('transactions_sync error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to sync transactions',
      details: error.response?.data || error.message,
    });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    hasAccessToken: Boolean(SAVED_ACCESS_TOKEN),
    itemId: SAVED_ITEM_ID,
    cursor: SAVED_CURSOR,
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});