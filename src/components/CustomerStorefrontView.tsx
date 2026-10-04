import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Cpu, 
  Layers, 
  Shirt, 
  Package, 
  Truck, 
  Boxes, 
  CheckCircle2, 
  QrCode, 
  Banknote, 
  Building2, 
  Clock, 
  MapPin, 
  ArrowRight,
  Store,
  Sparkles,
  Receipt,
  X,
  Printer,
  Lock,
  Mail,
  ExternalLink
} from 'lucide-react';
import { Product, CartItem, Transaction } from '../types';
import { formatRupiah, formatDateTime } from '../utils/formatters';
import { DeliveryLocationPicker } from './DeliveryLocationPicker';

interface CustomerStorefrontViewProps {
  products: Product[];
  onPlaceOrder: (orderPayload: {
    items: { productId: string; name: string; price: number; costPrice: number; quantity: number; subtotal: number; notes?: string }[];
    totalAmount: number;
    finalAmount: number;
    paymentMethod: 'cash' | 'qris' | 'transfer';
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerTable: string;
    orderType: 'pickup' | 'delivery' | 'dine_in' | 'take_away';
    deliveryCoordinates?: { lat: number; lng: number };
  }) => Promise<Transaction>;
  onSwitchToStaff: () => void;
}

export const CustomerStorefrontView: React.FC<CustomerStorefrontViewProps> = ({
  products,
  onPlaceOrder,
  onSwitchToStaff,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Customer order options for goods
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number }>({ lat: -6.208763, lng: 106.845599 });
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'cash' | 'transfer'>('qris');
  
  // Modal state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Transaction | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Categories
  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category)));
    return ['Semua', ...list];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Cart calculations
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const totalQuantity = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * product.price,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            subtotal: product.price,
          },
        ];
      }
    });
  };

  const handleUpdateQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const validQty = Math.min(quantity, item.product.stock);
          return {
            ...item,
            quantity: validQty,
            subtotal: validQty * item.product.price,
          };
        }
        return item;
      })
    );
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!customerEmail.trim()) {
      setErrorMsg('Silakan masukkan akun email Anda untuk penerimaan bukti nota pesanan.');
      return;
    }
    if (!customerEmail.includes('@') || !customerEmail.includes('.')) {
      setErrorMsg('Format akun email tidak valid. Masukkan email lengkap seperti nama@email.com');
      return;
    }
    if (!customerName.trim()) {
      setErrorMsg('Silakan masukkan nama Anda untuk pemesanan barang.');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMsg('Silakan masukkan nomor telepon / WhatsApp yang dapat dihubungi.');
      return;
    }
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setErrorMsg('Harap masukkan alamat pengiriman lengkap untuk pengantaran kurir.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const items = cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        costPrice: item.product.costPrice || 0,
        quantity: item.quantity,
        subtotal: item.subtotal,
        notes: item.notes,
      }));

      const destinationInfo = orderType === 'delivery' 
        ? `Kirim: ${deliveryAddress.trim()} (WA: ${customerPhone.trim()}) [GPS: ${deliveryCoords.lat.toFixed(5)}, ${deliveryCoords.lng.toFixed(5)}]`
        : `Ambil di Toko (WA: ${customerPhone.trim()})`;

      const createdTx = await onPlaceOrder({
        items,
        totalAmount,
        finalAmount: totalAmount,
        paymentMethod,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        customerTable: destinationInfo,
        orderType,
        deliveryCoordinates: orderType === 'delivery' ? deliveryCoords : undefined,
      });

      setCompletedOrder(createdTx);
      setCart([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim pesanan.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <div className="flex-1 flex flex-col min-h-screen bg-slate-950 text-white w-full max-w-full overflow-x-hidden">
      {/* Customer Hero Banner */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-950 border-b border-slate-800 py-6 sm:py-8 px-3.5 sm:px-6 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="text-center md:text-left min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Katalog Belanja Barang & Perlengkapan Toko</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight break-words">
              Selamat Datang di Toko KasirKu
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl">
              Pusat penjualan barang berkualitas, perlengkapan, elektronik, ATK, dan kebutuhan harian. Pilih barang yang Anda butuhkan dan pesan langsung secara online!
            </p>
          </div>
        </div>
      </div>

      {/* Main Storefront Area: Catalog (Left) & Order Basket (Right) */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-6 flex flex-col lg:flex-row gap-5 sm:gap-6 overflow-hidden">
        {/* LEFT: Product Catalog */}
        <div className="flex-1 flex flex-col min-w-0 space-y-4 w-full">
          {/* Search & Category Filter */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama barang atau kode SKU..."
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

            {/* Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/40 font-semibold'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <Boxes className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Barang Tidak Ditemukan</h3>
              <p className="text-xs text-slate-400 mt-1">
                Tidak ada produk barang yang sesuai dengan kata kunci pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((p) => {
                const inCartItem = cart.find((i) => i.product.id === p.id);
                const isOutOfStock = p.stock <= 0;

                return (
                  <div
                    key={p.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3 flex flex-col justify-between transition-all group shadow-sm overflow-hidden w-full"
                  >
                    <div>
                      {/* Product Image */}
                      <div className="aspect-square w-full rounded-xl bg-slate-950 overflow-hidden relative mb-2.5 border border-slate-800/50">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-1">
                            {getCategoryIcon(p.category)}
                            <span className="text-[10px] text-slate-500 font-mono">{p.sku}</span>
                          </div>
                        )}

                        {/* Stock Badge */}
                        <div className="absolute top-2 right-2">
                          {isOutOfStock ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-sm">
                              Habis
                            </span>
                          ) : p.stock <= 5 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/90 text-slate-950 shadow-sm">
                              Sisa {p.stock} {p.unit || 'unit'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-300 backdrop-blur-xs border border-slate-700">
                              Stok {p.stock}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-0.5">
                        {p.category}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug">
                        {p.name}
                      </h4>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                        SKU: {p.sku}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col gap-2">
                      <div className="flex items-baseline justify-between gap-1 overflow-hidden">
                        <div className="text-xs sm:text-sm font-extrabold text-emerald-400 font-mono truncate">
                          {formatRupiah(p.price)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          /{p.unit || 'unit'}
                        </span>
                      </div>

                      {inCartItem ? (
                        <div className="w-full flex items-center justify-between bg-slate-950 rounded-xl p-1 border border-slate-700">
                          <button
                            onClick={() => handleUpdateQty(p.id, inCartItem.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                            title="Kurang"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold font-mono px-2 text-white">
                            {inCartItem.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(p.id, inCartItem.quantity + 1)}
                            disabled={inCartItem.quantity >= p.stock}
                            className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                            title="Tambah"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(p)}
                          disabled={isOutOfStock}
                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Pilih</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Customer Order Basket (Sticky 35% on Desktop) */}
        <div id="customer-order-basket" className="w-full lg:w-96 shrink-0 scroll-mt-20">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm sticky top-20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">Keranjang Belanja</h3>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full">
                {cart.reduce((s, i) => s + i.quantity, 0)} barang
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            {completedOrder ? (
              /* In-Place Order Confirmation Ticket (No intrusive overlay modal!) */
              <div className="space-y-4 animate-in fade-in">
                <div className="text-center py-2">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Pesanan Barang Berhasil!</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pesanan telah dicatat dan sedang disiapkan toko.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Invoice:</span>
                    <span className="font-bold text-white">{completedOrder.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pemesan:</span>
                    <span className="text-white truncate max-w-[140px]">{completedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-emerald-400 truncate max-w-[150px]">{completedOrder.customerEmail || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pengambilan:</span>
                    <span className="text-emerald-400 font-semibold">
                      {completedOrder.orderType === 'delivery' ? 'Kirim ke Alamat' : 'Ambil di Toko'}
                    </span>
                  </div>
                  {completedOrder.deliveryCoordinates && (
                    <div className="flex justify-between items-center text-[11px] pt-0.5">
                      <span className="text-slate-400">Peta GPS:</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${completedOrder.deliveryCoordinates.lat},${completedOrder.deliveryCoordinates.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span>Buka di Google Maps</span>
                      </a>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-800 pt-1.5 font-bold text-emerald-400">
                    <span>Total Belanja:</span>
                    <span>{formatRupiah(completedOrder.finalAmount)}</span>
                  </div>
                </div>

                {completedOrder.paymentMethod === 'qris' && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-1.5">
                    <div className="text-[11px] text-slate-400">Scan QRIS Toko:</div>
                    <div className="w-24 h-24 mx-auto bg-white p-1.5 rounded-lg flex items-center justify-center">
                      <QrCode className="w-20 h-20 text-slate-900" />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setCompletedOrder(null)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  + Belanja Barang Lagi
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="py-8 text-center text-slate-500 space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-xs">Keranjang belanja Anda masih kosong.</p>
                <p className="text-[11px] text-slate-500">
                  Pilih produk barang yang ingin dibeli dari katalog di samping.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-4">
                {/* Cart Items List */}
                <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">
                          {item.product.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {formatRupiah(item.product.price)} x {item.quantity} = {formatRupiah(item.subtotal)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold font-mono px-1">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product.id, 0)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors ml-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery or Pickup Selection */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    Metode Pengambilan Barang:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderType('pickup')}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        orderType === 'pickup'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Ambil di Toko</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('delivery')}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        orderType === 'delivery'
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Kirim ke Alamat</span>
                    </button>
                  </div>
                </div>

                {/* Customer Contact Details */}
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Akun Email Pemesan *</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-normal">Wajib untuk nota transaksi</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="contoh: pelanggan@email.com"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Nama Pemesan *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nama Lengkap"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        No. HP / WA *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="081234..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  {orderType === 'delivery' ? (
                    /* Google Maps Interactive Pin & Delivery Address */
                    <DeliveryLocationPicker
                      coordinates={deliveryCoords}
                      onChangeCoordinates={setDeliveryCoords}
                      addressText={deliveryAddress}
                      onChangeAddressText={setDeliveryAddress}
                    />
                  ) : (
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                        <Store className="w-3.5 h-3.5" />
                        <span>Lokasi Ambil di Toko:</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        Toko KasirKu POS - Jl. Niaga Raya No. 88, Pusat Belanja Barang.
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Barang disiapkan staf kasir. Tunjukkan nomor invoice ini saat mengambil pesanan.
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Method Option */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                    Metode Pembayaran:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('qris')}
                      className={`p-2 rounded-xl border text-[11px] font-semibold flex flex-col items-center gap-1 cursor-pointer ${
                        paymentMethod === 'qris'
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>QRIS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-2 rounded-xl border text-[11px] font-semibold flex flex-col items-center gap-1 cursor-pointer ${
                        paymentMethod === 'cash'
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Di Kasir</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className={`p-2 rounded-xl border text-[11px] font-semibold flex flex-col items-center gap-1 cursor-pointer ${
                        paymentMethod === 'transfer'
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Transfer</span>
                    </button>
                  </div>
                </div>

                {/* Pricing & Submit */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-300">Total Pembayaran:</span>
                    <span className="text-xl font-extrabold text-emerald-400 font-mono">
                      {formatRupiah(totalAmount)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-950 transition-all cursor-pointer flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Pesan Barang Sekarang</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Floating Cart Summary (Only shown on mobile phone when cart has items) */}
      {cart.length > 0 && !completedOrder && (
        <div className="lg:hidden fixed bottom-3 inset-x-3 z-40 max-w-lg mx-auto animate-in slide-in-from-bottom-3 duration-300">
          <div className="bg-emerald-600 text-slate-950 p-3 rounded-2xl shadow-2xl flex items-center justify-between border border-emerald-400/50 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-950 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                {totalQuantity}
              </div>
              <div className="truncate">
                <div className="text-[10px] font-bold leading-tight text-emerald-950 uppercase tracking-wider">Total Belanja:</div>
                <div className="text-sm font-black font-mono leading-tight truncate">{formatRupiah(totalAmount)}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('customer-order-basket');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-emerald-400 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
            >
              <span>Lihat & Pesan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
