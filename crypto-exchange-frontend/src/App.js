import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, ShoppingCart, BarChart3, Clock, LogOut, Bitcoin, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const CryptoExchange = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [portfolio, setPortfolio] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cryptoData, setCryptoData] = useState([]);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // API Helper Function
  const apiRequest = async (endpoint, method = 'GET', body = null, requireAuth = false) => {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (requireAuth && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  };

  // Fetch User Profile
  const fetchUserProfile = async () => {
    try {
      const data = await apiRequest('/user/profile', 'GET', null, true);
      setUser(data.user);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      handleLogout();
    }
  };

  // Fetch Balance
  const fetchBalance = async () => {
    try {
      const data = await apiRequest('/user/balance', 'GET', null, true);
      setBalance(data.balance);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  };

  // Fetch Crypto Data
  const fetchCryptoData = async () => {
    try {
      const data = await apiRequest('/market/crypto');
      setCryptoData(data.cryptos);
    } catch (err) {
      console.error('Failed to fetch crypto data:', err);
    }
  };

  // Fetch Portfolio
  const fetchPortfolio = async () => {
    try {
      const data = await apiRequest('/portfolio', 'GET', null, true);
      setPortfolio(data.portfolio);
    } catch (err) {
      console.error('Failed to fetch portfolio:', err);
    }
  };

  // Fetch Transactions
  const fetchTransactions = async () => {
    try {
      const data = await apiRequest('/transactions', 'GET', null, true);
      setTransactions(data.transactions);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  // Refresh all data
  const refreshData = () => {
    if (token) {
      fetchBalance();
      fetchPortfolio();
      fetchTransactions();
      fetchCryptoData();
    }
  };

  // Auto-refresh data every 30 seconds when logged in
  useEffect(() => {
    if (currentPage !== 'login' && currentPage !== 'signup' && token) {
      refreshData();
      const interval = setInterval(refreshData, 30000);
      return () => clearInterval(interval);
    }
  }, [currentPage, token]);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/auth/login', 'POST', loginForm);
      setToken(data.token);
      setUser(data.user);
      setCurrentPage('dashboard');
      setLoginForm({ email: '', password: '' });
    } catch (err) {
      setError(err.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/auth/signup', 'POST', signupForm);
      setToken(data.token);
      setUser(data.user);
      setCurrentPage('dashboard');
      setSignupForm({ name: '', email: '', password: '' });
    } catch (err) {
      setError(err.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setCurrentPage('login');
    setBalance(0);
    setPortfolio([]);
    setTransactions([]);
    setCryptoData([]);
  };

  // Handle Buy
  const handleBuy = async () => {
    if (!selectedCrypto || !amount || amount <= 0) {
      alert('Masukkan jumlah yang valid!');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/trade/buy', 'POST', {
        crypto_symbol: selectedCrypto,
        amount: parseFloat(amount)
      }, true);

      alert('Pembelian berhasil!');
      setAmount('');
      setSelectedCrypto(null);
      refreshData();
    } catch (err) {
      alert(err.message || 'Pembelian gagal');
    } finally {
      setLoading(false);
    }
  };

  // Handle Sell
  const handleSell = async (cryptoSymbol, amount) => {
    if (!window.confirm(`Apakah Anda yakin ingin menjual ${amount} ${cryptoSymbol}?`)) {
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/trade/sell', 'POST', {
        crypto_symbol: cryptoSymbol,
        amount: amount
      }, true);

      alert('Penjualan berhasil!');
      refreshData();
    } catch (err) {
      alert(err.message || 'Penjualan gagal');
    } finally {
      setLoading(false);
    }
  };

  // Calculate portfolio value
  const portfolioValue = portfolio.reduce((total, item) => {
    return total + (item.current_value || 0);
  }, 0);

  const totalAssets = balance + portfolioValue;

  const priceHistory = [
    { time: '00:00', BTC: 42000, ETH: 2200, BNB: 310, SOL: 95, ADA: 0.51 },
    { time: '04:00', BTC: 42500, ETH: 2250, BNB: 312, SOL: 96, ADA: 0.52 },
    { time: '08:00', BTC: 42800, ETH: 2280, BNB: 313, SOL: 97, ADA: 0.53 },
    { time: '12:00', BTC: 43000, ETH: 2300, BNB: 314, SOL: 98, ADA: 0.52 },
    { time: '16:00', BTC: 43250, ETH: 2280, BNB: 315, SOL: 98, ADA: 0.52 },
    { time: '20:00', BTC: 43500, ETH: 2290, BNB: 316, SOL: 99, ADA: 0.53 }
  ];

  if (currentPage === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-gray-800">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <Bitcoin className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">CryptoChain Exchange</h1>
            <p className="text-gray-400">Platform Trading Cryptocurrency Terpercaya</p>
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4 flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Belum punya akun?{' '}
              <button
                onClick={() => {
                  setCurrentPage('signup');
                  setError('');
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                Daftar Sekarang
              </button>
            </p>
          </div>

          <div className="mt-6 p-4 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
            <p className="text-sm text-blue-200 text-center">
              💡 Demo: Setiap akun baru mendapat saldo awal $10,000
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-8 border border-gray-800">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <Bitcoin className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Daftar Akun Baru</h1>
            <p className="text-gray-400">Mulai trading cryptocurrency hari ini</p>
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4 flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nama Lengkap</label>
              <input
                type="text"
                value={signupForm.name}
                onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={signupForm.email}
                onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={signupForm.password}
                onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Daftar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Sudah punya akun?{' '}
              <button
                onClick={() => {
                  setCurrentPage('login');
                  setError('');
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-2">
              <Bitcoin className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">CryptoChain Exchange</h1>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPage === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage('market')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPage === 'market'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setCurrentPage('portfolio')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPage === 'portfolio'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              Portfolio
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-gray-400">Welcome back,</p>
              <p className="font-semibold text-white">{user?.name || 'User'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentPage === 'dashboard' && (
          <div className="space-y-6">
            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <Wallet className="w-8 h-8 text-white" />
                  <span className="text-blue-200 text-sm font-medium">Saldo USD</span>
                </div>
                <p className="text-3xl font-bold text-white">${balance.toFixed(2)}</p>
                <p className="text-blue-200 text-sm mt-2">Available Balance</p>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="w-8 h-8 text-white" />
                  <span className="text-purple-200 text-sm font-medium">Portfolio</span>
                </div>
                <p className="text-3xl font-bold text-white">${portfolioValue.toFixed(2)}</p>
                <p className="text-purple-200 text-sm mt-2">Crypto Holdings</p>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                  <span className="text-green-200 text-sm font-medium">Total Aset</span>
                </div>
                <p className="text-3xl font-bold text-white">${totalAssets.toFixed(2)}</p>
                <p className="text-green-200 text-sm mt-2">Combined Value</p>
              </div>
            </div>

            {/* Market Overview */}
            <div className="bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-800">
              <h2 className="text-2xl font-bold text-white mb-6">Market Overview</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {cryptoData.slice(0, 2).map((crypto) => (
                  <div key={crypto.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                          style={{ backgroundColor: crypto.color }}
                        >
                          {crypto.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{crypto.name}</h3>
                          <p className="text-gray-400 text-sm">{crypto.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">${crypto.price.toLocaleString()}</p>
                        <p
                          className={`text-sm font-semibold flex items-center justify-end ${
                            crypto.change > 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {crypto.change > 0 ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          )}
                          {Math.abs(crypto.change)}%
                        </p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={priceHistory}>
                        <Line
                          type="monotone"
                          dataKey={crypto.id}
                          stroke={crypto.color}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-800">
              <h2 className="text-2xl font-bold text-white mb-6">Recent Transactions</h2>
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Belum ada transaksi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'BUY' ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                          {tx.type === 'BUY' ? <TrendingUp className="w-5 h-5 text-white" /> : <TrendingDown className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{tx.type} {tx.crypto}</p>
                          <p className="text-sm text-gray-400">{new Date(tx.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{tx.amount} {tx.symbol}</p>
                        <p className={`text-sm font-semibold ${tx.type === 'BUY' ? 'text-red-400' : 'text-green-400'}`}>
                          {tx.type === 'BUY' ? '-' : '+'}${tx.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentPage === 'market' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-800">
              <h2 className="text-2xl font-bold text-white mb-6">Cryptocurrency Market</h2>
              
              <div className="space-y-4">
                {cryptoData.map((crypto) => (
                  <div
                    key={crypto.id}
                    className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex items-center space-x-4">
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: crypto.color }}
                        >
                          {crypto.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{crypto.name}</h3>
                          <p className="text-gray-400">{crypto.symbol}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                        <div>
                          <p className="text-gray-400 text-sm">Price</p>
                          <p className="text-white font-bold text-lg">${crypto.price.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">24h Change</p>
                          <p
                            className={`font-bold text-lg ${
                              crypto.change > 0 ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {crypto.change > 0 ? '+' : ''}{crypto.change}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Volume</p>
                          <p className="text-white font-bold text-lg">{crypto.volume}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Market Cap</p>
                          <p className="text-white font-bold text-lg">{crypto.marketCap}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedCrypto(crypto.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center space-x-2"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        <span>Buy</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedCrypto && (
              <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl p-6 shadow-xl border-2 border-blue-500">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Buy {cryptoData.find(c => c.id === selectedCrypto)?.name}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-200 mb-2 font-medium">Amount ({selectedCrypto})</label>
                    <input
                      type="number"
                      step="0.001"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  {amount && (
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <p className="text-gray-400 mb-2">Total Cost:</p>
                      <p className="text-3xl font-bold text-white">
                        ${(cryptoData.find(c => c.id === selectedCrypto)?.price * parseFloat(amount || 0)).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">Your balance: ${balance.toFixed(2)}</p>
                    </div>
                  )}
                  <div className="flex space-x-4">
                    <button
                      onClick={handleBuy}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Confirm Purchase'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCrypto(null);
                        setAmount('');
                      }}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentPage === 'portfolio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Portfolio Holdings */}
              <div className="bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-800">
                <h2 className="text-2xl font-bold text-white mb-6">Your Holdings</h2>
                {portfolio.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Belum ada cryptocurrency di portfolio Anda</p>
                    <button
                      onClick={() => setCurrentPage('market')}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                    >
                      Go to Market
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {portfolio.map((item) => {
                      const crypto = cryptoData.find(c => c.id === item.crypto_symbol);
                      return (
                        <div
                          key={item.id}
                          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white"
                                style={{ backgroundColor: crypto?.color || '#666' }}
                              >
                                {crypto?.icon || '?'}
                              </div>
                              <div>
                                <h3 className="font-bold text-white">{item.crypto_name}</h3>
                                <p className="text-gray-400 text-sm">{item.amount.toFixed(6)} {item.crypto_symbol}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-white">${item.current_value.toFixed(2)}</p>
                              <p className="text-sm text-gray-400">${item.current_price.toFixed(2)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSell(item.crypto_symbol, item.amount)}
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
                          >
                            Sell All
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Portfolio Chart */}
              <div className="bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-800">
                <h2 className="text-2xl font-bold text-white mb-6">Portfolio Distribution</h2>
                {portfolio.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No data to display</p>
                  </div>
                ) : (
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={portfolio.map(item => ({
                            name: item.crypto_symbol,
                            value: item.current_value,
                            color: cryptoData.find(c => c.id === item.crypto_symbol)?.color || '#666'
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {portfolio.map((item, index) => (
                            <Cell key={`cell-${index}`} fill={cryptoData.find(c => c.id === item.crypto_symbol)?.color || '#666'} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-6 space-y-2">
                      {portfolio.map((item) => {
                        const crypto = cryptoData.find(c => c.id === item.crypto_symbol);
                        const percentage = (item.current_value / portfolioValue * 100).toFixed(1);
                        return (
                          <div key={item.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: crypto?.color || '#666' }}
                              />
                              <span className="text-white font-medium">{item.crypto_symbol}</span>
                            </div>
                            <span className="text-gray-400">{percentage}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* All Transactions */}
            <div className="bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-800">
              <h2 className="text-2xl font-bold text-white mb-6">Transaction History</h2>
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'BUY' ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                          {tx.type === 'BUY' ? <TrendingUp className="w-5 h-5 text-white" /> : <TrendingDown className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{tx.type} {tx.crypto}</p>
                          <p className="text-sm text-gray-400">{new Date(tx.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{tx.amount} {tx.symbol}</p>
                        <p className={`text-sm font-semibold ${tx.type === 'BUY' ? 'text-red-400' : 'text-green-400'}`}>
                          {tx.type === 'BUY' ? '-' : '+'}${tx.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-3">
        <div className="flex justify-around">
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`flex flex-col items-center space-y-1 ${
              currentPage === 'dashboard' ? 'text-blue-500' : 'text-gray-400'
            }`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-xs">Dashboard</span>
          </button>
          <button
            onClick={() => setCurrentPage('market')}
            className={`flex flex-col items-center space-y-1 ${
              currentPage === 'market' ? 'text-blue-500' : 'text-gray-400'
            }`}
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="text-xs">Market</span>
          </button>
          <button
            onClick={() => setCurrentPage('portfolio')}
            className={`flex flex-col items-center space-y-1 ${
              currentPage === 'portfolio' ? 'text-blue-500' : 'text-gray-400'
            }`}
          >
            <Wallet className="w-6 h-6" />
            <span className="text-xs">Portfolio</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default CryptoExchange;