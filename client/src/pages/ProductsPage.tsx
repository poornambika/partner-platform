import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  Plus,
  Minus,
  ShoppingCart,
  Check,
  AlertCircle,
  Eye,
  Edit2,
  RefreshCw,
  X,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';

interface ProductsPageProps {
  onProductAddedToCart?: () => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ onProductAddedToCart }) => {
  const { token, currentUser, showToast } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [quantityMap, setQuantityMap] = useState<Record<string, number>>({});

  const isOwner = currentUser?.role === 'OWNER';

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (categoryFilter !== 'ALL') queryParams.set('category', categoryFilter);
      if (search) queryParams.set('search', search);

      const res = await fetch(`/api/products?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error('Failed to fetch products', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, search]);

  const handleQuantityChange = (prodId: string, delta: number) => {
    const current = quantityMap[prodId] || 1;
    const next = Math.max(1, current + delta);
    setQuantityMap((prev) => ({ ...prev, [prodId]: next }));
  };

  const addToCart = async (product: Product) => {
    if (!token) return;
    setAddingId(product.id);
    const qty = quantityMap[product.id] || 1;

    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id, quantity: qty }),
      });

      if (res.ok) {
        showToast(`Added ${qty} × ${product.name} to cart`);
        if (onProductAddedToCart) onProductAddedToCart();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to add to cart', 'error');
      }
    } catch (e) {
      showToast('Error communicating with cart service', 'error');
    } finally {
      setAddingId(null);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !token) return;

    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sellingPrice: Number(editingProduct.sellingPrice),
          costPrice: Number(editingProduct.costPrice),
          stockQuantity: Number(editingProduct.stockQuantity),
          isActive: editingProduct.isActive,
        }),
      });

      if (res.ok) {
        showToast(`Product ${editingProduct.id} inventory and pricing updated`);
        setEditingProduct(null);
        fetchProducts();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to update product', 'error');
      }
    } catch (e) {
      showToast('Error updating product', 'error');
    }
  };

  const categories = ['ALL', 'Personal Care', 'Household', 'Packaged Goods', 'Wellness'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Catalogue</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              8 FMCG & Wellness Products
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Browse verified products, check real-time stock levels, and place mock test orders.
          </p>
        </div>

        {isOwner && (
          <span className="text-xs font-medium text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
            Admin Inventory Controls Active
          </span>
        )}
      </div>

      {/* Filter and Category Pills */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100 rounded-xl">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Loading product catalogue...
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          No products found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((p) => {
            const qty = quantityMap[p.id] || 1;
            const inStock = p.stockQuantity > 0;

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
              >
                {/* Product Image */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-700 px-2 py-0.5 rounded-md shadow-xs">
                    {p.category}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs ${
                        inStock
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {inStock ? `${p.stockQuantity} in stock` : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">{p.id}</div>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5 line-clamp-1">{p.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <span className="text-lg font-black text-slate-900">
                          ₹{p.sellingPrice.toLocaleString('en-IN')}
                        </span>
                        {isOwner && (
                          <span className="text-[10px] text-slate-400 ml-2">
                            (Cost: ₹{p.costPrice})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        6% Comm (₹{Math.round(p.sellingPrice * 0.06)})
                      </span>
                    </div>

                    {/* Quantity Selector & Action */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                        <button
                          onClick={() => handleQuantityChange(p.id, -1)}
                          disabled={qty <= 1}
                          className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-40"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold w-6 text-center text-slate-800">
                          {qty}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(p.id, 1)}
                          disabled={qty >= p.stockQuantity}
                          className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => addToCart(p)}
                        disabled={!inStock || addingId === p.id}
                        className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {addingId === p.id ? 'Adding...' : 'Add to Cart'}
                      </button>

                      {isOwner && (
                        <button
                          onClick={() => setEditingProduct(p)}
                          title="Edit Inventory / Price"
                          className="p-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Owner Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
          <form
            onSubmit={handleUpdateProduct}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                Edit Product Inventory ({editingProduct.id})
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Product Name</label>
                <input
                  type="text"
                  disabled
                  value={editingProduct.name}
                  className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.sellingPrice}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, sellingPrice: Number(e.target.value) })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Cost Price (COGS ₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.costPrice}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={editingProduct.stockQuantity}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, stockQuantity: Number(e.target.value) })
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editingProduct.isActive}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="isActive" className="text-slate-700 font-semibold">
                  Product Active for Online Ordering
                </label>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
