import { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import ProductDetail from './ProductDetail'

function App() {
  const navigate = useNavigate()

  // Auth States
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [username, setUsername] = useState(localStorage.getItem('username') || '')
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [authUsername, setAuthUsername] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Catalog, Filter & Search States
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('latest')
  const [loading, setLoading] = useState(true)

  // Cart Drawer States
  const [cartItems, setCartItems] = useState([])
  const [cartTotal, setCartTotal] = useState(0)
  const [cartCount, setCartCount] = useState(0)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Orders History Modal States
  const [orders, setOrders] = useState([])
  const [isOrdersOpen, setIsOrdersOpen] = useState(false)
  const [ordersLoading, setOrdersLoading] = useState(false)

  const BASE_URL = 'http://127.0.0.1:8000'

  const getAuthConfig = () => ({
    headers: { Authorization: `Token ${token}` }
  })

  // 1. Fetch Categories
  const fetchCategories = () => {
    axios.get(`${BASE_URL}/api/categories/`)
      .then(res => setCategories(res.data))
      .catch(err => console.error("Error fetching categories:", err))
  }

  // 2. Fetch Catalog (Category + Search + Sort)
  const fetchProducts = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedCategory !== 'All') params.append('category', selectedCategory)
    if (searchQuery.trim()) params.append('search', searchQuery.trim())
    if (sortBy) params.append('sort', sortBy)

    axios.get(`${BASE_URL}/api/products/?${params.toString()}`)
      .then(res => {
        setProducts(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching products:", err)
        setLoading(false)
      })
  }

  // 3. Fetch Cart
  const fetchCart = () => {
    if (!token) return
    axios.get(`${BASE_URL}/api/cart/`, getAuthConfig())
      .then(res => {
        setCartItems(res.data.items || [])
        setCartTotal(res.data.total_amount || 0)
        setCartCount(res.data.total_items_count || 0)
      })
      .catch(err => {
        if (err.response?.status === 401) handleLogout()
      })
  }

  // 4. Fetch Orders History
  const fetchOrders = () => {
    if (!token) return
    setOrdersLoading(true)
    axios.get(`${BASE_URL}/api/orders/`, getAuthConfig())
      .then(res => {
        setOrders(res.data)
        setOrdersLoading(false)
      })
      .catch(err => {
        console.error("Error fetching orders:", err)
        setOrdersLoading(false)
      })
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, sortBy])

  useEffect(() => {
    if (token) fetchCart()
  }, [token])

  // Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    navigate('/')
    fetchProducts()
  }

  // Add To Cart
  const handleAddToCart = (product) => {
    if (!token) {
      setActionMessage('Please sign in or register to add items to cart!')
      setTimeout(() => setActionMessage(''), 3000)
      return
    }

    axios.post(`${BASE_URL}/api/cart/add/`, { product_id: product.id }, getAuthConfig())
      .then(() => {
        fetchCart()
        setActionMessage(`✓ Added "${product.name}" to cart!`)
        setTimeout(() => setActionMessage(''), 2500)
      })
      .catch(err => console.error(err))
  }

  // Cart +/- Quantity
  const handleUpdateQuantity = (cartItemId, action) => {
    axios.post(`${BASE_URL}/api/cart/update/${cartItemId}/`, { action }, getAuthConfig())
      .then(() => fetchCart())
      .catch(err => console.error("Error updating quantity:", err))
  }

  // Remove Item
  const handleRemoveItem = (cartItemId) => {
    axios.delete(`${BASE_URL}/api/cart/remove/${cartItemId}/`, getAuthConfig())
      .then(() => fetchCart())
      .catch(err => console.error(err))
  }

  // Checkout
  const handleCheckout = () => {
    setCheckoutLoading(true)
    axios.post(`${BASE_URL}/api/checkout/`, {}, getAuthConfig())
      .then(res => {
        setCheckoutLoading(false)
        setIsCartOpen(false)
        fetchCart()
        alert(`Success! Order #${res.data.order_id} placed for ₹${Number(res.data.total_amount).toLocaleString('en-IN')}`)
      })
      .catch(err => {
        setCheckoutLoading(false)
        alert(err.response?.data?.error || 'Checkout failed.')
      })
  }

  // Auth Handler
  const handleAuth = (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    const endpoint = isLoginMode ? `${BASE_URL}/api/login/` : `${BASE_URL}/api/register/`

    axios.post(endpoint, {
      username: authUsername,
      password: authPassword
    })
    .then(res => {
      setAuthLoading(false)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('username', res.data.username)
      setToken(res.data.token)
      setUsername(res.data.username)
      setAuthUsername('')
      setAuthPassword('')
    })
    .catch(err => {
      setAuthLoading(false)
      const msg = err.response?.data?.error || 'Authentication error. Please check credentials.'
      setAuthError(msg)
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setToken('')
    setUsername('')
    setCartItems([])
    setCartTotal(0)
    setCartCount(0)
    setIsCartOpen(false)
    setIsOrdersOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* 1. Header Navigation */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <span className="text-2xl">🛍️</span>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">ApexStore</h1>
              <span className="text-[11px] font-semibold text-indigo-600">Full Commercial Architecture</span>
            </div>
          </Link>

          {/* Search Bar Input */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-sm relative items-center">
            <input
              type="text"
              placeholder="Search products, descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 hover:bg-slate-200/80 focus:bg-white text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
            />
            <button type="submit" className="absolute right-2 text-slate-400 hover:text-indigo-600 text-xs font-bold px-1.5">
              🔍
            </button>
          </form>

          {/* User Controls & Cart */}
          <div className="flex items-center gap-3">
            {token && (
              <button
                onClick={() => { setIsOrdersOpen(true); fetchOrders(); }}
                className="text-xs font-bold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition"
              >
                📦 Orders
              </button>
            )}

            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative bg-slate-100 hover:bg-slate-200 p-2.5 rounded-xl transition flex items-center gap-1.5 border border-slate-200"
            >
              <span className="text-base">🛒</span>
              <span className="text-xs font-bold text-slate-700 hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="bg-indigo-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 min-w-[18px] rounded-full text-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Auth Box with Loading */}
            {token ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <span className="text-xs font-bold text-slate-800">@{username}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg font-semibold transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Username"
                  disabled={authLoading}
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-300 rounded-lg w-20 sm:w-24 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                />
                <input
                  type="password"
                  placeholder="Password"
                  disabled={authLoading}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-300 rounded-lg w-20 sm:w-24 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                />
                <button
                  type="submit"
                  disabled={authLoading}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1 rounded-lg transition flex items-center justify-center min-w-[60px] disabled:opacity-60"
                >
                  {authLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    isLoginMode ? 'Login' : 'Signup'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); }}
                  className="text-[11px] text-slate-500 hover:text-indigo-600 underline ml-1"
                >
                  {isLoginMode ? 'New?' : 'Sign in'}
                </button>
              </form>
            )}
          </div>
        </div>
      </nav>

      {/* Auth Error Banner */}
      {authError && (
        <div className="max-w-6xl mx-auto px-4 mt-3">
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-2.5 rounded-xl flex items-center justify-between shadow-sm">
            <span>⚠️ {authError}</span>
            <button onClick={() => setAuthError('')} className="text-rose-500 font-bold ml-2">✕</button>
          </div>
        </div>
      )}

      {/* Toast */}
      {actionMessage && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl animate-bounce">
          {actionMessage}
        </div>
      )}

      {/* Routes Switch */}
      <Routes>
        {/* Route 1: Catalog Home Page */}
        <Route path="/" element={
          <>
            {/* Filter & Controls */}
            <div className="max-w-6xl mx-auto px-4 pt-6 pb-4">
              <form onSubmit={handleSearchSubmit} className="md:hidden flex mb-4 relative items-center">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="submit" className="absolute right-3 text-sm">🔍</button>
              </form>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition ${
                      selectedCategory === 'All'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition whitespace-nowrap ${
                        selectedCategory === cat.name
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <label className="text-xs font-bold text-slate-500">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer shadow-sm"
                  >
                    <option value="latest">Newest First</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Catalog Grid */}
            <main className="max-w-6xl mx-auto px-4 pb-20">
              {loading ? (
                <div className="flex justify-center items-center py-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  <span className="ml-3 text-slate-600 font-semibold text-xs">Loading collection...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center">
                  <span className="text-3xl block mb-2">🔍</span>
                  <p className="text-slate-600 font-bold text-sm">No products found matching your filters.</p>
                  <button 
                    onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setSortBy('latest'); fetchProducts(); }}
                    className="mt-3 text-xs bg-indigo-50 text-indigo-600 font-bold px-4 py-2 rounded-xl hover:bg-indigo-100 transition"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(product => (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                    >
                      {/* Clickable Image & Content for Product Detail */}
                      <Link to={`/product/${product.id}`} className="block group">
                        <div className="h-52 bg-slate-100 overflow-hidden relative">
                          <img
                            src={product.image_url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=60'}
                            alt={product.name}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-300"
                          />
                          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-black px-2.5 py-1 rounded-md border border-slate-200/80 uppercase tracking-wide">
                            {product.category_name}
                          </span>
                          <span className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            Stock: {product.stock}
                          </span>
                        </div>

                        <div className="p-5">
                          <h3 className="font-extrabold text-slate-900 text-lg leading-snug group-hover:text-indigo-600 transition">
                            {product.name}
                          </h3>
                          <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                            {product.description || 'No description provided.'}
                          </p>
                        </div>
                      </Link>

                      <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black block">Price</span>
                          <span className="text-lg font-black text-slate-900">
                            ₹{Number(product.price).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock <= 0}
                          className={`font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm ${
                            product.stock > 0 
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95' 
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </>
        } />

        {/* Route 2: Dedicated Product Detail Page */}
        <Route path="/product/:id" element={
          <ProductDetail 
            BASE_URL={BASE_URL} 
            handleAddToCart={handleAddToCart} 
            cartCount={cartCount} 
            setIsCartOpen={setIsCartOpen}
          />
        } />
      </Routes>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between z-10">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-900">Your Cart</h3>
                <span className="text-xs text-slate-500 font-medium">{cartCount} total items</span>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              {!token ? (
                <div className="text-center py-16">
                  <span className="text-4xl block mb-2">🔒</span>
                  <p className="text-sm font-bold text-slate-700">Please sign in to view your cart</p>
                </div>
              ) : cartItems.length === 0 ? (
                <div className="text-center py-16">
                  <span className="text-4xl block mb-2">🛒</span>
                  <p className="text-sm font-bold text-slate-700">Your shopping cart is empty</p>
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.id} className="flex gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 items-center">
                    <img 
                      src={item.product.image_url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=60'} 
                      alt={item.product.name} 
                      className="w-16 h-16 object-cover rounded-xl border border-slate-200 bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{item.product.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">₹{Number(item.product.price).toLocaleString('en-IN')}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, 'decrease')}
                          className="w-6 h-6 rounded-md bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 transition"
                        >
                          -
                        </button>
                        <span className="text-xs font-black text-slate-800 min-w-[16px] text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, 'increase')}
                          className="w-6 h-6 rounded-md bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 transition"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-right flex flex-col justify-between items-end h-16 py-0.5">
                      <button onClick={() => handleRemoveItem(item.id)} className="text-slate-400 hover:text-rose-600 transition" title="Remove">
                        🗑️
                      </button>
                      <span className="text-xs font-black text-indigo-600">
                        ₹{Number(item.subtotal).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {token && cartItems.length > 0 && (
              <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Amount</span>
                  <span className="text-2xl font-black text-slate-900">
                    ₹{Number(cartTotal).toLocaleString('en-IN')}
                  </span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition active:scale-98 text-xs flex justify-center items-center gap-2 disabled:opacity-60"
                >
                  {checkoutLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing Order...</span>
                    </>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Orders History Modal */}
      {isOrdersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsOrdersOpen(false)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 z-10 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-900">Order History</h3>
                <span className="text-xs text-slate-500">Records directly saved in Order table</span>
              </div>
              <button 
                onClick={() => setIsOrdersOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {ordersLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-3xl block mb-2">📦</span>
                  <p className="text-sm font-bold text-slate-600">No past orders found.</p>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200">
                      <div>
                        <span className="text-xs font-black text-slate-900">Order #{order.id}</span>
                        <span className="text-[11px] text-slate-400 ml-2">
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          {order.status}
                        </span>
                        <span className="text-xs font-black text-slate-900">
                          ₹{Number(order.total_amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between text-xs text-slate-600">
                          <span>{item.product_name} <strong className="text-slate-800">× {item.quantity}</strong></span>
                          <span className="font-semibold text-slate-800">₹{Number(item.subtotal).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App