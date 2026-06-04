const test = require('node:test');
const assert = require('node:assert/strict');

const { buildPortfolioUpdate } = require('../controllers/portfolioController');

test('buildPortfolioUpdate returns empty update for empty body', () => {
  const update = buildPortfolioUpdate({});
  assert.deepEqual(update, {});
});

test('buildPortfolioUpdate updates cashBalance only when provided', () => {
  const update = buildPortfolioUpdate({ cashBalance: '125.5' });
  assert.equal(update.cashBalance, 125.5);
  assert.equal(Object.keys(update).length, 1);
});

test('buildPortfolioUpdate normalizes holdings when provided', () => {
  const update = buildPortfolioUpdate({
    holdings: [{ symbol: 'AAPL', name: 'Apple', qty: '2', avgCost: '150', currentPrice: '170' }]
  });

  assert.equal(update.holdings.length, 1);
  assert.equal(update.holdings[0].symbol, 'AAPL');
  assert.equal(update.holdings[0].qty, 2);
  assert.equal(update.holdings[0].avgCost, 150);
  assert.equal(update.holdings[0].currentPrice, 170);
});

test('buildPortfolioUpdate derives holdings from transactions', () => {
  const update = buildPortfolioUpdate({
    transactions: [{
      symbol: 'AAPL',
      name: 'Apple',
      action: 'buy',
      qty: '2',
      price: '100',
      executedAt: '2024-01-01'
    }]
  });

  assert.equal(update.transactions.length, 1);
  assert.equal(update.holdings.length, 1);
  assert.equal(update.holdings[0].symbol, 'AAPL');
  assert.equal(update.holdings[0].qty, 2);
  assert.equal(update.holdings[0].avgCost, 100);
});

test('transactions take precedence over holdings when both provided', () => {
  const update = buildPortfolioUpdate({
    holdings: [{ symbol: 'MSFT', name: 'Microsoft', qty: '1', avgCost: '50', currentPrice: '60' }],
    transactions: [{
      symbol: 'AAPL',
      name: 'Apple',
      action: 'buy',
      qty: '2',
      price: '100',
      executedAt: '2024-01-01'
    }]
  });

  assert.equal(update.holdings.length, 1);
  assert.equal(update.holdings[0].symbol, 'AAPL');
});
