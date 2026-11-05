import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

function ProductDetail({ BASE_URL, handleAddToCart, cartCount, setIsCartOpen }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    axios.get(`${BASE_URL}/api/products/${id}/`)
      .then(res => {
        setProduct(res.data)
        setLoading(false)
      })
      .catch(err => {
        setError('Product not found or removed.')
        setLoading(false)
      })
  }, [id, BASE_URL])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-600 font-semibold text-sm">Loading product details...</span>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Oops!</h2>
        <p className="text-sm text-slate-500 mb-6">{error || 'Product not found.'}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition"
        >
          ← Return to Catalog
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 mb-6 group transition"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Catalog
      </button>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-10">
        {/* Left: Image Container */}
        <div className="bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center p-4 border border-slate-100 max-h-[420px]">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=60'}
            alt={product.name}
            className="w-full h-full object-contain max-h-[380px] hover:scale-105 transition duration-300"
          />
        </div>

        {/* Right: Product Meta & Purchase */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border border-indigo-100">
                {product.category_name}
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                product.stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {product.stock > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock'}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight mb-3">
              {product.name}
            </h1>

            <div className="mb-6">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Price</span>
              <span className="text-3xl font-black text-slate-900">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="border-t border-slate-100 pt-5 mb-8">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {product.description || 'No detailed specifications provided for this product.'}
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => handleAddToCart(product)}
              disabled={product.stock <= 0}
              className={`flex-1 font-bold text-sm py-3.5 px-6 rounded-2xl shadow-sm transition active:scale-98 flex items-center justify-center gap-2 ${
                product.stock > 0
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>🛒</span>
              <span>{product.stock > 0 ? 'Add to Shopping Cart' : 'Currently Unavailable'}</span>
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-3.5 px-4 rounded-2xl transition"
              title="Open Cart"
            >
              View Cart ({cartCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail