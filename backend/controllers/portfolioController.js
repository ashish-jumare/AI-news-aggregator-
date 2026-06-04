const Portfolio = require('../models/Portfolio');

const normalizeHoldings = (holdings = []) => {
  if (!Array.isArray(holdings)) return [];
  return holdings.map((holding) => ({
    symbol: String(holding.symbol || '').trim(),
    name: String(holding.name || '').trim(),
    qty: Number(holding.qty) || 0,
    avgCost: Number(holding.avgCost) || 0,
    currentPrice: Number(holding.currentPrice) || 0
  })).filter((holding) => holding.symbol && holding.name);
};

const normalizeTransactions = (transactions = []) => {
  if (!Array.isArray(transactions)) return [];
  return transactions
    .map((tx) => ({
      symbol: String(tx.symbol || '').trim(),
      name: String(tx.name || '').trim(),
      action: tx.action === 'sell' ? 'sell' : 'buy',
      qty: Number(tx.qty) || 0,
      price: Number(tx.price) || 0,
      executedAt: tx.executedAt ? new Date(tx.executedAt) : new Date()
    }))
    .filter((tx) => tx.symbol && tx.name && tx.qty > 0 && tx.price > 0);
};

const buildHoldingsFromTransactions = (transactions = []) => {
  const map = new Map();

  transactions.forEach((tx) => {
    const existing = map.get(tx.symbol) || {
      symbol: tx.symbol,
      name: tx.name,
      qty: 0,
      avgCost: 0,
      currentPrice: tx.price
    };

    if (tx.action === 'buy') {
      const newQty = existing.qty + tx.qty;
      const newAvg = newQty
        ? ((existing.qty * existing.avgCost) + (tx.qty * tx.price)) / newQty
        : tx.price;
      map.set(tx.symbol, {
        ...existing,
        qty: newQty,
        avgCost: newAvg,
        currentPrice: existing.currentPrice || tx.price
      });
      return;
    }

    const remainingQty = Math.max(existing.qty - tx.qty, 0);
    if (remainingQty === 0) {
      map.delete(tx.symbol);
      return;
    }

    map.set(tx.symbol, {
      ...existing,
      qty: remainingQty
    });
  });

  return Array.from(map.values());
};

const buildPortfolioUpdate = (body = {}) => {
  const hasCashBalance = Object.prototype.hasOwnProperty.call(body, 'cashBalance');
  const hasTransactions = Object.prototype.hasOwnProperty.call(body, 'transactions');
  const hasHoldings = Object.prototype.hasOwnProperty.call(body, 'holdings');

  const update = {};

  if (hasCashBalance) {
    update.cashBalance = Number(body.cashBalance) || 0;
  }

  if (hasTransactions) {
    const normalizedTransactions = normalizeTransactions(body.transactions);
    update.transactions = normalizedTransactions;
    update.holdings = buildHoldingsFromTransactions(normalizedTransactions);
  } else if (hasHoldings) {
    update.holdings = normalizeHoldings(body.holdings);
  }

  return update;
};

exports.getPortfolio = async (req, res) => {
  try {
    const userId = req.user._id;
    let portfolio = await Portfolio.findOne({ user: userId }).lean();

    if (!portfolio) {
      const created = await Portfolio.create({ user: userId, cashBalance: 0, holdings: [] });
      portfolio = created.toObject();
    }

    res.json({
      success: true,
      portfolio
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load portfolio',
      error: error.message
    });
  }
};

exports.updatePortfolio = async (req, res) => {
  try {
    const userId = req.user._id;
    const update = buildPortfolioUpdate(req.body);

    if (Object.keys(update).length === 0) {
      let existing = await Portfolio.findOne({ user: userId }).lean();
      if (!existing) {
        const created = await Portfolio.create({ user: userId, cashBalance: 0, holdings: [] });
        existing = created.toObject();
      }

      res.json({
        success: true,
        portfolio: existing
      });
      return;
    }

    const portfolio = await Portfolio.findOneAndUpdate(
      { user: userId },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({
      success: true,
      portfolio
    });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save portfolio',
      error: error.message
    });
  }
};

exports.buildPortfolioUpdate = buildPortfolioUpdate;
