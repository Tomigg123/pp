import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Tag, 
  Percent, 
  ArrowRight, 
  Package, 
  Cpu, 
  Layers, 
  Shirt, 
  ShoppingBag,
  Sparkles,
  AlertCircle,
  Box
} from 'lucide-react';
import { Product, CartItem, UserProfile, canManageProducts } from '../types';
import { formatRupiah } from '../utils/formatters';

interface PosViewProps {
  products: Product[];
  cart: CartItem[];
  currentUser?: UserProfile | null;
  onAddToCart: (product: Product) => void;
  onUpdateCartQty: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onOpenCheckout: (discountAmount: number, taxAmount: number) => void;
  onSeedSampleProducts: () => Promise<void>;
  onOpenAddProduct?: () => void;
  isLoadingProducts: boolean;
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  cart,
  currentUser,
  onAddToCart,
  onUpdateCartQty,
  onRemoveFromCart,
  onClearCart,
  onOpenCheckout,
  onSeedSampleProducts,
  onOpenAddProduct,
  isLoadingProducts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [discountType, setDiscountType] = useState<'nominal' | 'percent'>('percent');
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [applyTax, setApplyTax] = useState(false);

  // Extract distinct categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['Semua', ...cats];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountVal <= 0 || subtotal <= 0) return 0;
    if (discountType === 'percent') {
      const p = Math.min(100, discountVal);
      return Math.round((subtotal * p) / 100);
    }
    return Math.min(subtotal, discountVal);
  }, [subtotal, discountType, discountVal]);

  const taxAmount = useMemo(() => {
    if (!applyTax || subtotal <= 0) return 0;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    return Math.round(taxableAmount * 0.11); // 11% PPN
  }, [applyTax, subtotal, discountAmount]);

  const finalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

  const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('elektronik') || lower.includes('gadget') || lower.includes('hp')) {
      return <Cpu className="w-5 h-5 text-indigo-400" />;
    }
    if (lower.includes('tulis') || lower.includes('kantor') || lower.includes('atk') || lower.includes('buku')) {
      return <Layers className="w-5 h-5 text-amber-400" />;
    }
    if (lower.includes('pakaian') || lower.includes('fashion') || lower.includes('baju')) {
      return <Shirt className="w-5 h-5 text-rose-400" />;
    }
    if (lower.includes('pokok') || lower.includes('sembako') || lower.includes('beras')) {
      return <ShoppingBag className="w-5 h-5 text-emerald-400" />;
    }
    return <Package className="w-5 h-5 text-teal-400" />;
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full min-h-[calc(100vh-4rem)]">
      {/* LEFT: Product Catalog & Search (65% width) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search & Filter Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari produk atau scan barcode SKU..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Quick Add Product button for Admin & Super Admin */}
            {canManageProducts(currentUser ?? null) && onOpenAddProduct && (
              <button
                onClick={onOpenAddProduct}
                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition-all cursor-pointer shrink-0 hover:scale-[1.02]"
                title="Tambah Produk Baru yang Dijual (Khusus Admin & Super Admin)"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">+ Produk Baru</span>
              </button>
            )}

            {/* Empty state shortcut button */}
            {products.length === 0 && !isLoadingProducts && (
              <button
                onClick={onSeedSampleProducts}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Muat Contoh Produk</span>
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/40 font-semibold'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {isLoadingProducts ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Memuat database produk...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-72 bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <Package className="w-12 h-12 text-slate-600 mb-3" />
              <h4 className="text-base font-semibold text-slate-300">
                {products.length === 0 ? 'Belum Ada Produk di Database' : 'Produk Tidak Ditemukan'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                {products.length === 0
                  ? 'Katalog produk Anda masih kosong. Anda dapat mengimpor contoh produk siap jual atau menambah manual di tab Database Produk.'
                  : 'Coba ubah kata kunci pencarian atau pilih kategori lain.'}
              </p>
              {products.length === 0 && (
                <button
                  onClick={onSeedSampleProducts}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-950 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Muat Data Contoh Warung & Cafe</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((prod) => {
                const isOutOfStock = prod.stock <= 0;
                const cartItem = cart.find((c) => c.product.id === prod.id);
                const isLowStock = prod.stock > 0 && prod.stock <= 5;

                return (
                  <div
                    key={prod.id}
                    onClick={() => !isOutOfStock && onAddToCart(prod)}
                    className={`group bg-slate-900 border rounded-2xl p-3 flex flex-col justify-between transition-all select-none relative overflow-hidden ${
                      isOutOfStock
                        ? 'border-slate-800 opacity-60 cursor-not-allowed'
                        : 'border-slate-800 hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-950/20 cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    {/* Active count badge if in cart */}
                    {cartItem && (
                      <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 text-xs font-black flex items-center justify-center shadow-md">
                        {cartItem.quantity}
                      </div>
                    )}

                    {/* Image / Thumbnail */}
                    <div className="w-full aspect-4/3 rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden mb-2.5 flex items-center justify-center relative">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-500">
                          {getCategoryIcon(prod.category)}
                          <span className="text-[10px] font-mono">{prod.category}</span>
                        </div>
                      )}

                      {/* Stock Pill */}
                      <div className="absolute bottom-1.5 left-1.5">
                        {isOutOfStock ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/90 text-white font-bold backdrop-blur-xs">
                            Habis
                          </span>
                        ) : isLowStock ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/90 text-slate-950 font-bold backdrop-blur-xs">
                            Sisa {prod.stock}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900/80 text-emerald-400 font-semibold backdrop-blur-xs border border-emerald-500/20">
                            Stok: {prod.stock} {prod.unit || ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                          <span>{prod.sku}</span>
                          <span>{prod.category}</span>
                        </div>
                        <h4 className="font-semibold text-sm text-slate-100 line-clamp-2 mt-0.5 leading-tight">
                          {prod.name}
                        </h4>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-sm font-extrabold text-emerald-400 font-mono">
                          {formatRupiah(prod.price)}
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-slate-800 group-hover:bg-emerald-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart & Order Panel (35% width) */}
      <div id="pos-cart-panel" className="w-full lg:w-[380px] xl:w-[410px] bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between shrink-0 scroll-mt-20">
        <div>
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Pesanan Kasir</h3>
                <p className="text-[11px] text-slate-400">{cart.length} jenis item di keranjang</p>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="divide-y divide-slate-800 max-h-[38vh] overflow-y-auto pr-1 my-3 scrollbar-thin">
            {cart.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center text-slate-500 p-4">
                <ShoppingCart className="w-10 h-10 text-slate-700 mb-2 stroke-[1.5]" />
                <p className="text-sm font-medium text-slate-400">Keranjang Masih Kosong</p>
                <p className="text-xs text-slate-600 mt-1 max-w-[200px]">
                  Klik pada produk di sebelah kiri untuk memasukkannya ke kasir.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-semibold text-slate-100 truncate">
                      {item.product.name}
                    </h5>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {formatRupiah(item.product.price)}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => onUpdateCartQty(item.product.id, item.quantity - 1)}
                      className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-white min-w-[18px] text-center font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateCartQty(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-emerald-400 disabled:opacity-30 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Subtotal & Delete */}
                  <div className="text-right flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {formatRupiah(item.subtotal)}
                    </span>
                    <button
                      onClick={() => onRemoveFromCart(item.product.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Calculations & Checkout */}
        <div className="pt-3 border-t border-slate-800 space-y-2.5">
          {/* Discount / Tax quick toggles */}
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Diskon Transaksi:</span>
              <div className="flex items-center gap-1.5">
                <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-[10px]">
                  <button
                    onClick={() => setDiscountType('percent')}
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      discountType === 'percent' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => setDiscountType('nominal')}
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      discountType === 'nominal' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Rp
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  value={discountVal || ''}
                  onChange={(e) => setDiscountVal(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-right font-mono text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Pajak Resto/PPN (11%):</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyTax}
                  onChange={(e) => setApplyTax(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Pricing summary */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono text-slate-200">{formatRupiah(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Diskon</span>
                <span className="font-mono">-{formatRupiah(discountAmount)}</span>
              </div>
            )}

            {taxAmount > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>PPN (11%)</span>
                <span className="font-mono text-slate-200">{formatRupiah(taxAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
              <span>Total Bayar</span>
              <span className="text-emerald-400 font-mono text-lg">{formatRupiah(finalAmount)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={() => onOpenCheckout(discountAmount, taxAmount)}
            disabled={cart.length === 0}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer text-sm"
          >
            <span>Bayar Sekarang ({formatRupiah(finalAmount)})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Floating Cart Summary for POS Staff on Smartphone */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-3 inset-x-3 z-40 max-w-lg mx-auto animate-in slide-in-from-bottom-3 duration-300">
          <div className="bg-emerald-600 text-slate-950 p-3 rounded-2xl shadow-2xl flex items-center justify-between border border-emerald-400/50 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-950 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </div>
              <div className="truncate">
                <div className="text-[10px] font-bold leading-tight text-emerald-950 uppercase tracking-wider">Total Kasir:</div>
                <div className="text-sm font-black font-mono leading-tight truncate">{formatRupiah(finalAmount)}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('pos-cart-panel');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-emerald-400 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
            >
              <span>Bayar Kasir</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
