import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Sparkles, 
  ArrowUpDown, 
  Boxes, 
  DollarSign, 
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Shirt,
  ShoppingBag,
  ShieldCheck,
  Download,
  Filter,
  Layers,
  ArrowRight,
  TrendingUp,
  X,
  PlusCircle,
  Lock
} from 'lucide-react';
import { Product, UserProfile, isUserSuperAdmin, canManageProducts } from '../types';
import { formatRupiah, formatDateTime } from '../utils/formatters';

interface ProductsViewProps {
  products: Product[];
  currentUser: UserProfile | null;
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onDeleteProduct: (productId: string) => Promise<void>;
  onAdjustStock: (productId: string, newStock: number) => Promise<void>;
  onSeedSampleProducts: () => Promise<void>;
  isLoading: boolean;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  currentUser,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteProduct,
  onAdjustStock,
  onSeedSampleProducts,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'safe' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'priceAsc' | 'priceDesc' | 'stockAsc' | 'stockDesc'>('name');

  // Deletion modal
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Restock modal
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);
  const [isRestocking, setIsRestocking] = useState(false);

  const isSuper = isUserSuperAdmin(currentUser);

  // Categories list
  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category)));
    return ['Semua', ...list];
  }, [products]);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category
        const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
        // Search
        const matchSearch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchTerm.toLowerCase());

        // Stock status
        const min = p.minStock || 5;
        let matchStock = true;
        if (stockStatusFilter === 'safe') matchStock = p.stock > min;
        else if (stockStatusFilter === 'low') matchStock = p.stock > 0 && p.stock <= min;
        else if (stockStatusFilter === 'out') matchStock = p.stock <= 0;

        return matchCat && matchSearch && matchStock;
      })
      .sort((a, b) => {
        if (sortBy === 'priceAsc') return a.price - b.price;
        if (sortBy === 'priceDesc') return b.price - a.price;
        if (sortBy === 'stockAsc') return a.stock - b.stock;
        if (sortBy === 'stockDesc') return b.stock - a.stock;
        return a.name.localeCompare(b.name);
      });
  }, [products, selectedCategory, searchTerm, stockStatusFilter, sortBy]);

  // Aggregate inventory metrics
  const totalItems = products.length;
  const totalStockUnits = products.reduce((s, p) => s + p.stock, 0);
  const totalCostValue = products.reduce((s, p) => s + (p.costPrice || 0) * p.stock, 0);
  const totalSalesValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= (p.minStock || 5)).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  // Export CSV
  const handleExportCSV = () => {
    if (products.length === 0) return;
    const headers = ['Kode SKU', 'Nama Produk', 'Kategori', 'Harga Modal', 'Harga Jual', 'Stok', 'Satuan'];
    const rows = products.map((p) => [
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.costPrice || 0,
      p.price,
      p.stock,
      `"${p.unit || 'pcs'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `katalog_produk_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      await onDeleteProduct(productToDelete.id);
      setProductToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmRestock = async () => {
    if (!restockProduct) return;
    try {
      setIsRestocking(true);
      const newStock = Math.max(0, restockProduct.stock + Number(restockAmount));
      await onAdjustStock(restockProduct.id, newStock);
      setRestockProduct(null);
    } finally {
      setIsRestocking(false);
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner with Super Admin status */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            {isSuper ? (
              <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/25">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Super Admin Panel (Hak Penuh Kelola Produk)</span>
              </span>
            ) : currentUser?.role === 'admin' ? (
              <span className="flex items-center gap-1.5 text-teal-400 bg-teal-500/10 px-3 py-1 rounded-xl border border-teal-500/25">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Admin Toko Panel (Bisa Tambah & Kelola Produk)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-400 bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700">
                <Package className="w-4 h-4 text-slate-400" />
                <span>Mode Kasir (Hanya Pantau Stok Produk)</span>
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
            Database Produk Kasir
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {canManageProducts(currentUser)
              ? 'Tambah produk baru yang dijual, perbarui harga modal & jual, kelola persediaan stok barang, atau hapus item dari katalog database toko Anda.'
              : 'Pantau daftar produk, harga jual, dan ketersediaan stok barang toko.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            title="Download CSV Katalog"
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Ekspor CSV</span>
          </button>

          {products.length === 0 && canManageProducts(currentUser) && (
            <button
              onClick={onSeedSampleProducts}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Muat Contoh Data</span>
            </button>
          )}

          {canManageProducts(currentUser) ? (
            <button
              onClick={onOpenAddModal}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-950 cursor-pointer hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk Baru</span>
            </button>
          ) : (
            <div className="px-3.5 py-2.5 bg-slate-800/60 rounded-xl text-xs text-slate-500 border border-slate-700/50 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Tambah Produk (Khusus Admin)</span>
            </div>
          )}
        </div>
      </div>

      {/* Inventory KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SKUs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Total Jenis Produk</span>
            <Boxes className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalItems} SKU</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
            <span>{categories.length - 1} Kategori</span>
          </div>
        </div>

        {/* Total Stock Units */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Total Kuantitas Stok</span>
            <Package className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalStockUnits} Unit</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {outOfStockCount > 0 ? (
              <span className="text-rose-400 font-semibold">{outOfStockCount} produk habis</span>
            ) : (
              <span className="text-emerald-400">Semua tersedia</span>
            )}
          </div>
        </div>

        {/* Total Cost Asset */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Total Aset Modal</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {formatRupiah(totalCostValue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Modal tertahan di gudang</div>
        </div>

        {/* Potential Sales Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Estimasi Nilai Jual</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatRupiah(totalSalesValue)}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            Potensi Laba: {formatRupiah(Math.max(0, totalSalesValue - totalCostValue))}
          </div>
        </div>
      </div>

      {/* Search, Filter Status, Category and Sorting Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama produk, SKU, barcode..."
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

          {/* Stock Filter Chips */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setStockStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                stockStatusFilter === 'all'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Stok
            </button>
            <button
              onClick={() => setStockStatusFilter('low')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                stockStatusFilter === 'low'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Menipis ({lowStockCount})
            </button>
            <button
              onClick={() => setStockStatusFilter('out')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                stockStatusFilter === 'out'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Habis ({outOfStockCount})
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="name">Nama (A - Z)</option>
              <option value="priceAsc">Harga: Termurah</option>
              <option value="priceDesc">Harga: Termahal</option>
              <option value="stockAsc">Stok: Paling Sedikit</option>
              <option value="stockDesc">Stok: Paling Banyak</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Menyinkronkan data produk dari Firestore...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <Package className="w-12 h-12 text-slate-600 mb-3" />
              <h4 className="text-base font-semibold text-slate-300">
                {products.length === 0 ? 'Belum Ada Produk di Database' : 'Tidak Ada Produk yang Cocok'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 mb-4 max-w-md">
                {products.length === 0
                  ? 'Klik tombol Tambah Produk Baru di atas atau gunakan Muat Contoh Data untuk memulai.'
                  : 'Coba ubah kata kunci pencarian atau reset filter kategori/status stok.'}
              </p>
              <button
                onClick={onOpenAddModal}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-950 cursor-pointer"
              >
                + Tambah Produk Sekarang
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Nama Produk & Info</th>
                  <th className="py-3.5 px-4">SKU / Kode</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4 text-right">Harga Modal</th>
                  <th className="py-3.5 px-4 text-right">Harga Jual</th>
                  <th className="py-3.5 px-4 text-center">Margin Laba</th>
                  <th className="py-3.5 px-4 text-center">Stok Saat Ini</th>
                  <th className="py-3.5 px-4 text-center">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredProducts.map((p) => {
                  const margin =
                    p.price > 0 && p.costPrice > 0
                      ? Math.round(((p.price - p.costPrice) / p.price) * 100)
                      : 0;
                  const profitUnit = Math.max(0, p.price - (p.costPrice || 0));
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock <= (p.minStock || 5);

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Product Name & Pic */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              getCategoryIcon(p.category)
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{p.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Satuan: <b className="text-slate-300">{p.unit || 'pcs'}</b></span>
                              {p.lastUpdatedBy && (
                                <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                                  • {p.lastUpdatedBy}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono text-slate-300 font-semibold">{p.sku}</td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium text-[11px]">
                          {p.category}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {formatRupiah(p.costPrice || 0)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                        {formatRupiah(p.price)}
                      </td>

                      {/* Profit Margin % */}
                      <td className="py-3 px-4 text-center font-mono">
                        <div className="flex flex-col items-center">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              margin >= 30
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : margin > 0
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {margin}%
                          </span>
                          <span className="text-[9px] text-slate-500 mt-0.5">
                            +{formatRupiah(profitUnit)}
                          </span>
                        </div>
                      </td>

                      {/* Current Stock & Quick Adjust */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="inline-flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                            <button
                              onClick={() => onAdjustStock(p.id, Math.max(0, p.stock - 1))}
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Kurangi 1 unit"
                            >
                              -
                            </button>
                            <span
                              className={`font-mono font-bold text-xs min-w-[32px] text-center ${
                                isOutOfStock
                                  ? 'text-rose-400'
                                  : isLowStock
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {p.stock}
                            </span>
                            <button
                              onClick={() => onAdjustStock(p.id, p.stock + 1)}
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Tambah 1 unit"
                            >
                              +
                            </button>
                          </div>

                          {/* Quick Restock button */}
                          <button
                            onClick={() => {
                              setRestockProduct(p);
                              setRestockAmount(10);
                            }}
                            className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
                          >
                            <PlusCircle className="w-3 h-3" />
                            <span>Restock</span>
                          </button>
                        </div>
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="py-3 px-4 text-center">
                        {canManageProducts(currentUser) ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onOpenEditModal(p)}
                              title="Edit Data Produk (Nama, Harga, Stok)"
                              className="p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-700"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setProductToDelete(p)}
                              title="Hapus Produk dari Database"
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-500/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-800/40 px-2 py-1 rounded-md">
                            Hanya Lihat
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl text-white">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white">Konfirmasi Hapus Produk</h3>
            <p className="text-xs text-slate-400 mt-1">
              Apakah Anda yakin ingin menghapus produk ini dari database secara permanen?
            </p>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 my-4 space-y-1">
              <div className="font-bold text-white text-sm">{productToDelete.name}</div>
              <div className="text-xs text-slate-400 font-mono">
                SKU: {productToDelete.sku} • Harga: {formatRupiah(productToDelete.price)} • Stok: {productToDelete.stock} {productToDelete.unit || 'pcs'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950 flex items-center gap-2"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Produk'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Amount Modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-sm">Restock Barang Masuk</h4>
              </div>
              <button
                onClick={() => setRestockProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div className="text-xs text-slate-300">
                Tambah stok untuk <b className="text-white">{restockProduct.name}</b>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Jumlah Stok yang Masuk ({restockProduct.unit || 'pcs'})
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-lg font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Quick addition chips */}
              <div className="flex gap-2">
                {[5, 10, 20, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRestockAmount(amt)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    +{amt}
                  </button>
                ))}
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between">
                <span className="text-slate-400">Total Stok Baru:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {restockProduct.stock + Number(restockAmount)} {restockProduct.unit || 'pcs'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestockProduct(null)}
                disabled={isRestocking}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRestock}
                disabled={isRestocking || restockAmount <= 0}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold"
              >
                {isRestocking ? 'Menyimpan...' : 'Simpan Stok Masuk'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
