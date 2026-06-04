import { useEffect, useMemo, useRef, useState } from 'react';
import { COMPANIES } from '../components/Sidebar';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

export default function PortfolioPage({ onClose }) {
  const analysisApiUrl = import.meta.env.VITE_ANALYSIS_API_URL || 'http://localhost:5001';
  const [cashBalance, setCashBalance] = useState('');
  const [tradeForm, setTradeForm] = useState({
    companyId: '',
    action: 'buy',
    quantity: '',
    price: ''
  });
  const [companySearch, setCompanySearch] = useState('');
  const [holdings, setHoldings] = useState([]);
  const [priceBySymbol, setPriceBySymbol] = useState({});
  const [priceError, setPriceError] = useState('');
  const [chartRange, setChartRange] = useState('1Y');
  const [portfolioSeries, setPortfolioSeries] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState('');
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState('');
  const hasLoadedPortfolio = useRef(false);
  const [transactions, setTransactions] = useState([]);
  const [activeSection, setActiveSection] = useState('portfolio');

  const sanitizeNumber = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatMoney = (value) => {
    if (!Number.isFinite(value)) return '0.00';
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const holdingsWithTotals = useMemo(() => {
    return holdings.map((holding) => {
      const qty = sanitizeNumber(holding.qty);
      const avg = sanitizeNumber(holding.avgCost);
      const latestPrice = priceBySymbol[holding.symbol]?.price;
      const change = priceBySymbol[holding.symbol]?.change;
      const price = sanitizeNumber(latestPrice ?? holding.currentPrice);
      const value = qty * price;
      const cost = qty * avg;
      const gain = value - cost;
      const gainPct = cost ? (gain / cost) * 100 : 0;
      const dailyChange = qty * (Number.isFinite(change) ? change : 0);
      const prevClose = price - (Number.isFinite(change) ? change : 0);
      const dailyChangePct = prevClose ? (dailyChange / (qty * prevClose)) * 100 : 0;

      return {
        ...holding,
        qty,
        avg,
        price,
        value,
        gain,
        gainPct,
        dailyChange,
        dailyChangePct
      };
    });
  }, [holdings, priceBySymbol]);

  const buildHoldingsFromTransactions = (transactionList) => {
    const map = new Map();

    transactionList.forEach((tx) => {
      const symbol = String(tx.symbol || '').trim();
      const name = String(tx.name || '').trim();
      const qty = sanitizeNumber(tx.qty);
      const price = sanitizeNumber(tx.price);
      if (!symbol || !name || qty <= 0 || price <= 0) return;

      const existing = map.get(symbol) || {
        symbol,
        name,
        qty: 0,
        avgCost: 0,
        currentPrice: price
      };

      if (tx.action === 'buy') {
        const newQty = existing.qty + qty;
        const newAvg = newQty
          ? ((existing.qty * existing.avgCost) + (qty * price)) / newQty
          : price;
        map.set(symbol, {
          ...existing,
          qty: newQty,
          avgCost: newAvg,
          currentPrice: existing.currentPrice || price
        });
        return;
      }

      const remainingQty = Math.max(existing.qty - qty, 0);
      if (remainingQty === 0) {
        map.delete(symbol);
        return;
      }

      map.set(symbol, {
        ...existing,
        qty: remainingQty
      });
    });

    return Array.from(map.values());
  };

  const totals = useMemo(() => {
    const totalValue = holdingsWithTotals.reduce((sum, holding) => sum + holding.value, 0);
    const totalCost = holdingsWithTotals.reduce((sum, holding) => sum + holding.qty * holding.avg, 0);
    const totalGain = holdingsWithTotals.reduce((sum, holding) => sum + (Number.isFinite(holding.gain) ? holding.gain : 0), 0);
    const totalGainPct = totalCost ? (totalGain / totalCost) * 100 : 0;
    const dailyGain = holdingsWithTotals.reduce((sum, holding) => {
      const change = priceBySymbol[holding.symbol]?.change;
      const safeChange = Number.isFinite(change) ? change : 0;
      return sum + (holding.qty * safeChange);
    }, 0);
    const previousCloseValue = holdingsWithTotals.reduce((sum, holding) => {
      const change = priceBySymbol[holding.symbol]?.change;
      const safeChange = Number.isFinite(change) ? change : 0;
      const prevClose = holding.price - safeChange;
      return sum + (holding.qty * sanitizeNumber(prevClose));
    }, 0);
    const dailyGainPct = previousCloseValue ? (dailyGain / previousCloseValue) * 100 : 0;
    const cash = sanitizeNumber(cashBalance);

    return {
      totalValue,
      totalCost,
      totalGain,
      totalGainPct,
      dailyGain,
      dailyGainPct,
      portfolioValue: totalValue
    };
  }, [cashBalance, holdingsWithTotals, priceBySymbol]);

  const allocation = useMemo(() => {
    const cash = sanitizeNumber(cashBalance);
    const stockValue = holdingsWithTotals.reduce((sum, holding) => sum + holding.value, 0);
    const total = stockValue + cash;
    const stockPct = total ? (stockValue / total) * 100 : 0;
    const cashPct = total ? (cash / total) * 100 : 0;
    return {
      stockValue,
      cash,
      total,
      stockPct,
      cashPct
    };
  }, [cashBalance, holdingsWithTotals]);

  const holdingsAllocation = useMemo(() => {
    const totalValue = holdingsWithTotals.reduce((sum, holding) => sum + holding.value, 0);
    if (!totalValue) return [];
    return holdingsWithTotals.map((holding) => ({
      symbol: holding.symbol,
      name: holding.name,
      value: holding.value,
      percent: (holding.value / totalValue) * 100
    }));
  }, [holdingsWithTotals]);

  const filteredCompanies = useMemo(() => {
    const query = companySearch.trim().toLowerCase();
    if (!query) return COMPANIES;
    return COMPANIES.filter((company) =>
      `${company.name} ${(company.symbol || company.id || '')}`.toLowerCase().includes(query)
    );
  }, [companySearch]);

  const filteredHoldings = useMemo(() => {
    const query = companySearch.trim().toLowerCase();
    if (!query) return holdingsWithTotals;
    return holdingsWithTotals.filter((holding) =>
      `${holding.name} ${holding.symbol}`.toLowerCase().includes(query)
    );
  }, [companySearch, holdingsWithTotals]);

  const chartRangeMap = {
    '1D': '1d',
    '1W': '5d',
    '1M': '1m',
    '3M': '3m',
    '6M': '6m',
    '1Y': '1y',
    'All': 'max'
  };

  const chartRanges = ['1D', '1W', '1M', '3M', '6M', '1Y', 'All'];

  const allocationGradient = useMemo(() => {
    if (!holdingsAllocation.length) return '#E2E8F0';
    const colors = ['#2563EB', '#10B981', '#F97316', '#A855F7', '#0EA5E9', '#F59E0B', '#14B8A6'];
    let acc = 0;
    const stops = holdingsAllocation.map((item, index) => {
      const color = colors[index % colors.length];
      const start = acc;
      acc += item.percent;
      return `${color} ${start.toFixed(2)}% ${acc.toFixed(2)}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }, [holdingsAllocation]);

  const allocationColors = useMemo(() => {
    return ['#2563EB', '#10B981', '#F97316', '#A855F7', '#0EA5E9', '#F59E0B', '#14B8A6'];
  }, []);

  const overviewCards = [
    { label: 'Total Portfolio Value', value: formatMoney(totals.portfolioValue), change: `${totals.totalGainPct.toFixed(2)}% total`, tone: totals.totalGain >= 0 ? 'text-emerald-600' : 'text-red-500' },
    { label: 'Total Gain / Loss', value: formatMoney(totals.totalGain), change: `INR ${formatMoney(totals.totalCost)}`, tone: totals.totalGain >= 0 ? 'text-emerald-600' : 'text-red-500' },
    { label: "Day's Gain / Loss", value: formatMoney(totals.dailyGain), change: `${totals.dailyGainPct.toFixed(2)}% today`, tone: totals.dailyGain >= 0 ? 'text-emerald-600' : 'text-red-500' },
    { label: 'Cash Balance', value: cashBalance ? formatMoney(sanitizeNumber(cashBalance)) : '0.00', change: 'Manual entry', tone: 'text-slate-500' }
  ];

  const navItems = [
    'Dashboard',
    'Portfolio',
    'Transactions',
    'Watchlist',
    'Markets',
    'Dividends',
    'Reports'
  ];

  const navKeyMap = {
    Dashboard: 'dashboard',
    Portfolio: 'portfolio',
    Watchlist: 'watchlist',
    Markets: 'markets',
    Transactions: 'transactions',
    Dividends: 'dividends',
    Reports: 'reports'
  };

  const selectedCompany = COMPANIES.find((company) => company.id === tradeForm.companyId);
  const selectedSymbol = selectedCompany?.symbol || selectedCompany?.id || '';
  const displaySymbol = selectedSymbol.replace('.NS', '').toUpperCase();

  const normalizeSymbol = (symbol) => {
    if (!symbol) return '';
    return symbol.includes('.') ? symbol : `${symbol}.NS`;
  };

  const getHoldingCompany = (holding) => {
    const match = COMPANIES.find((item) => {
      const symbol = (item.symbol || item.id || '').replace('.NS', '').toUpperCase();
      return symbol === holding.symbol;
    });
    if (match) return match;
    return {
      name: holding.name,
      symbol: normalizeSymbol(holding.symbol)
    };
  };

  const fetchCompanyPrice = async (company) => {
    try {
      const response = await axios.get(`${analysisApiUrl}/analysis/company`, {
        params: {
          name: company.name,
          symbol: company.symbol,
          range: '1d'
        }
      });
      const price = response.data?.price || 0;
      let change = response.data?.change;

      if (!Number.isFinite(change)) {
        const history = Array.isArray(response.data?.history) ? response.data.history : [];
        const lastClose = history.length ? history[history.length - 1]?.close : response.data?.ohlc?.close;
        const prevClose = history.length > 1 ? history[history.length - 2]?.close : null;
        if (Number.isFinite(lastClose) && Number.isFinite(prevClose)) {
          change = lastClose - prevClose;
        } else {
          try {
            const fallback = await axios.get(`${analysisApiUrl}/analysis/company`, {
              params: {
                name: company.name,
                symbol: company.symbol,
                range: '5d'
              }
            });
            const fallbackHistory = Array.isArray(fallback.data?.history) ? fallback.data.history : [];
            const last = fallbackHistory.length ? fallbackHistory[fallbackHistory.length - 1]?.close : null;
            const prev = fallbackHistory.length > 1 ? fallbackHistory[fallbackHistory.length - 2]?.close : null;
            if (Number.isFinite(last) && Number.isFinite(prev)) {
              change = last - prev;
            } else {
              change = 0;
            }
          } catch (error) {
            change = 0;
          }
        }
      }

      return {
        price,
        change
      };
    } catch (error) {
      return { price: 0, change: 0 };
    }
  };

  const fetchCompanyHistory = async (company, rangeKey) => {
    try {
      const response = await axios.get(`${analysisApiUrl}/analysis/company`, {
        params: {
          name: company.name,
          symbol: company.symbol,
          range: rangeKey
        }
      });
      return response.data?.history || [];
    } catch (error) {
      return null;
    }
  };

  const buildPortfolioSeries = (historyBySymbol, holdingsList, cashValue) => {
    const allTimes = [];
    const normalizedHoldings = holdingsList.map((holding) => ({
      symbol: holding.symbol,
      qty: sanitizeNumber(holding.qty)
    }));

    normalizedHoldings.forEach((holding) => {
      const history = historyBySymbol[holding.symbol] || [];
      history.forEach((point) => {
        if (point?.time) allTimes.push(point.time);
      });
    });

    const uniqueTimes = Array.from(new Set(allTimes));
    uniqueTimes.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    if (!uniqueTimes.length) return [];

    const maxPoints = 160;
    const step = Math.max(1, Math.floor(uniqueTimes.length / maxPoints));
    const sampledTimes = uniqueTimes.filter((_, index) => index % step === 0);

    const historyState = normalizedHoldings.reduce((acc, holding) => {
      const history = (historyBySymbol[holding.symbol] || [])
        .map((point) => ({
          time: point.time,
          close: Number.isFinite(point.close) ? point.close : null
        }))
        .filter((point) => point.time && point.close !== null)
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      acc[holding.symbol] = {
        history,
        index: 0,
        lastClose: history.length ? history[0].close : 0
      };
      return acc;
    }, {});

    return sampledTimes.map((time) => {
      let totalValue = sanitizeNumber(cashValue);
      normalizedHoldings.forEach((holding) => {
        const state = historyState[holding.symbol];
        if (!state || !state.history.length) return;

        while (state.index < state.history.length && new Date(state.history[state.index].time).getTime() <= new Date(time).getTime()) {
          state.lastClose = state.history[state.index].close;
          state.index += 1;
        }

        totalValue += holding.qty * sanitizeNumber(state.lastClose);
      });

      return {
        time,
        value: totalValue
      };
    });
  };

  const buildChartPath = (series, width, height, padding) => {
    if (!series.length) return '';
    const values = series.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    return series
      .map((point, index) => {
        const x = padding + (innerWidth * index) / (series.length - 1 || 1);
        const y = padding + innerHeight - ((point.value - min) / range) * innerHeight;
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  };

  useEffect(() => {
    const loadPortfolio = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setPortfolioLoading(false);
        return;
      }

      try {
        const response = await axios.get(API_ENDPOINTS.PORTFOLIO, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data?.success && response.data?.portfolio) {
          const portfolio = response.data.portfolio;
          setCashBalance(Number.isFinite(portfolio.cashBalance) ? String(portfolio.cashBalance) : '');
          const loadedTransactions = Array.isArray(portfolio.transactions) ? portfolio.transactions : [];
          const loadedHoldings = Array.isArray(portfolio.holdings) ? portfolio.holdings : [];
          setTransactions(loadedTransactions);
          setHoldings(loadedHoldings.length ? loadedHoldings : buildHoldingsFromTransactions(loadedTransactions));
          setPortfolioError('');
        }
      } catch (error) {
        const message = error.response?.data?.message || 'Unable to load portfolio. Please try again.';
        setPortfolioError(message);
      } finally {
        setPortfolioLoading(false);
        hasLoadedPortfolio.current = true;
      }
    };

    loadPortfolio();
  }, []);

  useEffect(() => {
    if (!transactions.length) return;
    const computedHoldings = buildHoldingsFromTransactions(transactions);
    setHoldings((prev) =>
      computedHoldings.map((holding) => {
        const existing = prev.find((item) => item.symbol === holding.symbol);
        return {
          ...holding,
          currentPrice: existing?.currentPrice ?? holding.currentPrice
        };
      })
    );
  }, [transactions]);

  useEffect(() => {
    if (!hasLoadedPortfolio.current) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const derivedHoldings = transactions.length
      ? buildHoldingsFromTransactions(transactions)
      : holdings;

    const payload = {
      cashBalance: sanitizeNumber(cashBalance),
      holdings: derivedHoldings.map((holding) => ({
        symbol: holding.symbol,
        name: holding.name,
        qty: sanitizeNumber(holding.qty),
        avgCost: sanitizeNumber(holding.avgCost),
        currentPrice: sanitizeNumber(priceBySymbol[holding.symbol]?.price ?? holding.currentPrice)
      })),
      transactions: transactions.map((tx) => ({
        symbol: tx.symbol,
        name: tx.name,
        action: tx.action,
        qty: sanitizeNumber(tx.qty),
        price: sanitizeNumber(tx.price),
        executedAt: tx.executedAt
      }))
    };

    const saveTimer = setTimeout(async () => {
      try {
        await axios.put(API_ENDPOINTS.PORTFOLIO, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPortfolioError('');
      } catch (error) {
        const message = error.response?.data?.message || 'Unable to save portfolio changes.';
        setPortfolioError(message);
      }
    }, 500);

    return () => clearTimeout(saveTimer);
  }, [cashBalance, holdings, priceBySymbol, transactions]);

  useEffect(() => {
    let isActive = true;

    const refreshPrices = async () => {
      if (!holdings.length || !isActive) return;
      const updates = {};

      for (const holding of holdings) {
        const company = getHoldingCompany(holding);
        const latest = await fetchCompanyPrice(company);
        if (latest.price) {
          updates[holding.symbol] = latest;
        }
      }

      if (Object.keys(updates).length > 0 && isActive) {
        setPriceBySymbol((prev) => ({ ...prev, ...updates }));
        setHoldings((prev) =>
          prev.map((holding) => ({
            ...holding,
            currentPrice: updates[holding.symbol]?.price ?? holding.currentPrice
          }))
        );
      }
    };

    refreshPrices();
    const intervalId = setInterval(refreshPrices, 60000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [holdings]);

  useEffect(() => {
    const loadPortfolioHistory = async () => {
      if (!holdings.length) {
        setPortfolioSeries([]);
        return;
      }

      setChartLoading(true);
      setChartError('');
      const rangeKey = chartRangeMap[chartRange] || '1y';

      try {
        const results = await Promise.all(
          holdings.map(async (holding) => {
            const company = getHoldingCompany(holding);
            const history = await fetchCompanyHistory(company, rangeKey);
            return { symbol: holding.symbol, history };
          })
        );

        const historyBySymbol = results.reduce((acc, result) => {
          acc[result.symbol] = result.history || [];
          return acc;
        }, {});

        const hasHistory = results.some((result) => Array.isArray(result.history) && result.history.length > 0);
        if (!hasHistory) {
          setPortfolioSeries([]);
          setChartError('No history data available for the selected range.');
          return;
        }

        const series = buildPortfolioSeries(historyBySymbol, holdings, 0);
        setPortfolioSeries(series);
      } catch (error) {
        setChartError('Unable to load portfolio chart.');
      } finally {
        setChartLoading(false);
      }
    };

    loadPortfolioHistory();
  }, [chartRange, cashBalance, holdings]);

  const handleAddTransaction = async () => {
    setPriceError('');
    const quantity = sanitizeNumber(tradeForm.quantity);
    if (!selectedCompany || quantity <= 0) return;

    if (tradeForm.action === 'sell') {
      const existingHolding = holdings.find((item) => item.symbol === displaySymbol);
      const availableQty = sanitizeNumber(existingHolding?.qty);
      if (!availableQty || quantity > availableQty) {
        setPriceError('Sell quantity exceeds holdings.');
        return;
      }
    }

    const latest = await fetchCompanyPrice(selectedCompany);
    if (!latest.price) {
      setPriceError('Unable to fetch current price. Try again.');
      return;
    }

    const newTransaction = {
      symbol: displaySymbol,
      name: selectedCompany.name,
      action: tradeForm.action,
      qty: quantity,
      price: latest.price,
      executedAt: new Date().toISOString()
    };

    setTransactions((prev) => [...prev, newTransaction]);
    setPriceBySymbol((prev) => ({
      ...prev,
      [displaySymbol]: {
        price: latest.price,
        change: latest.change
      }
    }));

    setTradeForm({ companyId: '', action: 'buy', quantity: '', price: '' });
  };

  const handleRemoveHolding = (symbol) => {
    setHoldings((prev) => prev.filter((holding) => holding.symbol !== symbol));
    setTransactions((prev) => prev.filter((tx) => tx.symbol !== symbol));
    setPriceBySymbol((prev) => {
      const next = { ...prev };
      delete next[symbol];
      return next;
    });
  };

  const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const transactionRows = useMemo(() => {
    return [...transactions].sort(
      (a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
    );
  }, [transactions]);

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-gray-900">
      <div className="h-full flex">
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0EA5E9] text-white flex items-center justify-center shadow-[0_10px_24px_rgba(14,165,233,0.35)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">NEWSINSIGHT</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Portfolio Hub</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => setActiveSection(navKeyMap[item] || 'portfolio')}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === (navKeyMap[item] || 'portfolio')
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
          <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            Portfolio data is entered manually by the user.
          </div>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="px-8 py-5 flex items-center justify-between gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Portfolio Overview</p>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Track NIFTY 100 holdings</h1>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="px-8 py-6 space-y-6">
              {activeSection === 'transactions' ? (
                <section className="grid grid-cols-1 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Transactions</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Latest trades first</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm table-auto">
                        <thead className="text-xs text-gray-500 dark:text-gray-400">
                          <tr>
                            <th className="py-2 text-left whitespace-nowrap">Date</th>
                            <th className="py-2 text-left">Symbol</th>
                            <th className="py-2 text-left">Action</th>
                            <th className="py-2 text-right whitespace-nowrap">Quantity</th>
                            <th className="py-2 text-right whitespace-nowrap">Price</th>
                            <th className="py-2 text-right whitespace-nowrap">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-700 dark:text-gray-200">
                          {transactionRows.length ? (
                            transactionRows.map((tx) => (
                              <tr key={tx._id || `${tx.symbol}-${tx.executedAt}`} className="border-t border-gray-100 dark:border-gray-700">
                                <td className="py-3 whitespace-nowrap">{formatDateTime(tx.executedAt)}</td>
                                <td className="py-3 whitespace-nowrap font-semibold text-gray-900 dark:text-white">{tx.symbol}</td>
                                <td className={`py-3 whitespace-nowrap ${tx.action === 'buy' ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {tx.action === 'buy' ? 'Buy' : 'Sell'}
                                </td>
                                <td className="py-3 text-right whitespace-nowrap tabular-nums">{sanitizeNumber(tx.qty)}</td>
                                <td className="py-3 text-right whitespace-nowrap tabular-nums">INR {formatMoney(sanitizeNumber(tx.price))}</td>
                                <td className="py-3 text-right whitespace-nowrap tabular-nums">
                                  INR {formatMoney(sanitizeNumber(tx.qty) * sanitizeNumber(tx.price))}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                No transactions yet. Add a trade above to see history.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              ) : (
              <>
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Portfolio Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {overviewCards.map((card, index) => (
                    <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">INR {card.value}</p>
                      <p className={`text-xs mt-2 ${card.tone}`}>{card.change}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Cash Balance</p>
                      <input
                        type="text"
                        value={cashBalance}
                        onChange={(event) => setCashBalance(event.target.value)}
                        placeholder="Enter cash balance"
                        className="mt-2 w-48 bg-transparent text-xl font-semibold text-gray-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Portfolio Value Over Time</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {chartRanges.map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setChartRange(label)}
                          className={`px-2 py-1 rounded-full transition-colors ${label === chartRange ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-56 w-full rounded-lg bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 overflow-hidden">
                    {chartLoading && <span>Loading chart...</span>}
                    {!chartLoading && chartError && <span>{chartError}</span>}
                    {!chartLoading && !chartError && !portfolioSeries.length && (
                      <span>Add holdings to see the portfolio trend.</span>
                    )}
                    {!chartLoading && !chartError && portfolioSeries.length > 0 && (
                      <svg viewBox="0 0 600 220" className="w-full h-full">
                        <defs>
                          <linearGradient id="portfolioLine" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d={buildChartPath(portfolioSeries, 600, 220, 24)}
                          fill="none"
                          stroke="#2563EB"
                          strokeWidth="2"
                        />
                        <path
                          d={`${buildChartPath(portfolioSeries, 600, 220, 24)} L576,196 L24,196 Z`}
                          fill="url(#portfolioLine)"
                          opacity="0.6"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Asset Allocation</h3>
                    <button className="text-xs font-semibold text-blue-600 dark:text-blue-400">View details</button>
                  </div>
                  <div className="flex items-center gap-6">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center"
                      style={{ background: allocationGradient }}
                    >
                      <div className="w-14 h-14 rounded-full bg-white dark:bg-gray-800"></div>
                    </div>
                    <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                      {holdingsAllocation.length ? (
                        holdingsAllocation.map((item, index) => (
                          <div key={item.symbol} className="flex items-center justify-between gap-6">
                            <span className="flex items-center gap-2">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-sm"
                                style={{ backgroundColor: allocationColors[index % allocationColors.length] }}
                              ></span>
                              {item.symbol}
                            </span>
                            <span className="text-gray-900 dark:text-white">{item.percent.toFixed(1)}%</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-400">Add holdings to see allocation.</div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Holdings</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Add transactions to build holdings</span>
                  </div>
                  {portfolioLoading && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">Loading portfolio...</div>
                  )}
                  {portfolioError && (
                    <div className="text-xs text-red-500 mb-3">{portfolioError}</div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                    <select
                      value={tradeForm.companyId}
                      onChange={(event) => setTradeForm({ ...tradeForm, companyId: event.target.value })}
                      className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
                    >
                      <option value="">Select NIFTY 100 company</option>
                      {filteredCompanies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={tradeForm.action}
                      onChange={(event) => setTradeForm({ ...tradeForm, action: event.target.value })}
                      className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
                    >
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                    <input
                      type="number"
                      value={tradeForm.quantity}
                      onChange={(event) => setTradeForm({ ...tradeForm, quantity: event.target.value })}
                      placeholder="Quantity"
                      className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
                    />
                    <div className="relative">
                      <input
                        type="text"
                        value={companySearch}
                        onChange={(event) => setCompanySearch(event.target.value)}
                        placeholder="Search company"
                        className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 pr-9"
                      />
                      <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddTransaction}
                      className="md:col-span-4 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
                    >
                      Add to portfolio
                    </button>
                    {selectedCompany && (
                      <p className="md:col-span-4 text-xs text-gray-500 dark:text-gray-400">
                        Selected: {selectedCompany.name} ({displaySymbol})
                      </p>
                    )}
                    {priceError && (
                      <p className="md:col-span-4 text-xs text-red-500">{priceError}</p>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm table-auto">
                      <thead className="text-xs text-gray-500 dark:text-gray-400">
                        <tr>
                          <th className="py-2 text-left whitespace-nowrap">Symbol</th>
                          <th className="py-2 text-left">Name</th>
                          <th className="py-2 text-right whitespace-nowrap">Quantity</th>
                          <th className="py-2 text-right whitespace-nowrap">Avg. Price</th>
                          <th className="py-2 text-right whitespace-nowrap">Current Price</th>
                          <th className="py-2 text-right whitespace-nowrap">Value</th>
                          <th className="py-2 text-right whitespace-nowrap">Gain / Loss</th>
                          <th className="py-2 text-right whitespace-nowrap">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-700 dark:text-gray-200">
                        {filteredHoldings.map((row) => (
                          <tr key={row.symbol} className="border-t border-gray-100 dark:border-gray-700">
                            <td className="py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{row.symbol}</td>
                            <td className="py-3 max-w-[240px] truncate" title={row.name}>{row.name}</td>
                            <td className="py-3 text-right whitespace-nowrap tabular-nums">{row.qty}</td>
                            <td className="py-3 text-right whitespace-nowrap tabular-nums">INR {formatMoney(row.avg)}</td>
                            <td className="py-3 text-right whitespace-nowrap tabular-nums">
                              INR {formatMoney(row.price || priceBySymbol[row.symbol]?.price || 0)}
                            </td>
                            <td className="py-3 text-right whitespace-nowrap tabular-nums">INR {formatMoney(row.value)}</td>
                            <td className={`py-3 text-right whitespace-nowrap tabular-nums ${row.gain >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              <div>INR {formatMoney(row.gain)} ({row.gainPct.toFixed(2)}%)</div>
                              <div className="text-xs text-gray-400">Day: INR {formatMoney(row.dailyChange)} ({row.dailyChangePct.toFixed(2)}%)</div>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveHolding(row.symbol)}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-200"
                                aria-label={`Remove ${row.symbol}`}
                                title="Remove"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                        {!holdingsWithTotals.length && (
                          <tr>
                            <td colSpan={8} className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                              No holdings yet. Add a transaction above to get started.
                            </td>
                          </tr>
                        )}
                        {holdingsWithTotals.length > 0 && !filteredHoldings.length && (
                          <tr>
                            <td colSpan={8} className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                              No holdings match your search.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
              </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
