import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  DollarSign, 
  Layers, 
  Barcode, 
  Tag, 
  Image as ImageIcon, 
  AlertCircle,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Product, UserProfile, isUserSuperAdmin } from '../types';
import { formatRupiah } from '../utils/formatters';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  productToEdit?: Product | null;
  currentUser: UserProfile | null;
}

const DEFAULT_CATEGORIES = [
  'Elektronik & Gadget',
  'Aksesoris & Gadget',
  'Alat Tulis & Kantor',
  'Perlengkapan Rumah',
  'Kebutuhan Pokok',
  'Pakaian & Fashion',
  'Perkakas & Otomotif',
  'Kesehatan & Perawatan',
  'Lainnya'
];
const DEFAULT_UNITS = ['pcs', 'unit', 'box', 'pack', 'set', 'lusin', 'roll', 'kg', 'meter', 'pasang', 'buku', 'karung', 'pouch'];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  productToEdit,
  currentUser,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Elektronik & Gadget');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(10);
  const [minStock, setMinStock] = useState<number>(5);
  const [unit, setUnit] = useState('pcs');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSuper = isUserSuperAdmin(currentUser);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku || '');
      if (DEFAULT_CATEGORIES.includes(productToEdit.category)) {
        setCategory(productToEdit.category);
        setIsCustomCategory(false);
      } else {
        setCategory('Lainnya');
        setCustomCategory(productToEdit.category);
        setIsCustomCategory(true);
      }
      setCostPrice(productToEdit.costPrice || 0);
      setPrice(productToEdit.price);
      setStock(productToEdit.stock);
      setMinStock(productToEdit.minStock || 5);
      setUnit(productToEdit.unit || 'pcs');
      setImageUrl(productToEdit.imageUrl || '');
    } else {
      setName('');
      setSku(generateSku('Makanan'));
      setCategory('Makanan');
      setCustomCategory('');
      setIsCustomCategory(false);
      setCostPrice(0);
      setPrice(0);
      setStock(20);
      setMinStock(5);
      setUnit('pcs');
      setImageUrl('');
    }
    setErrorMsg(null);
  }, [productToEdit, isOpen]);

  function generateSku(cat: string) {
    const prefix = cat.slice(0, 3).toUpperCase();
    const rand = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${rand}`;
  }

  const handleRegenerateSku = () => {
    const activeCat = isCustomCategory ? (customCategory || 'PRD') : category;
    setSku(generateSku(activeCat));
  };

  if (!isOpen) return null;

  // Margin calculation
  const profitMargin = price > 0 ? price - costPrice : 0;
  const marginPercentage = price > 0 ? Math.round((profitMargin / price) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama produk wajib diisi.');
      return;
    }
    if (price < 0) {
      setErrorMsg('Harga jual tidak boleh kurang dari 0.');
      return;
    }
    if (stock < 0) {
      setErrorMsg('Jumlah stok tidak boleh kurang dari 0.');
      return;
    }

    const finalCategory = isCustomCategory && customCategory.trim() 
      ? customCategory.trim() 
      : category;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const productPayload: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        sku: sku.trim() || generateSku(finalCategory),
        category: finalCategory,
        costPrice: Number(costPrice) || 0,
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        minStock: Number(minStock) || 5,
        unit: unit.trim() || 'pcs',
        lastUpdatedBy: currentUser?.displayName || currentUser?.email || 'Admin',
      };
      if (imageUrl && imageUrl.trim()) {
        productPayload.imageUrl = imageUrl.trim();
      }
      await onSubmit(productPayload);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan produk ke database.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  {productToEdit ? 'Edit Data Produk' : 'Tambah Produk Baru'}
                </h3>
                {isSuper ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    <span>Super Admin</span>
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-400" />
                    <span>Admin Toko</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola informasi nama, harga modal, harga jual, dan stok produk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nama Produk <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Kopi Susu Aren Spesial"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Kode Barcode / SKU
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateSku}
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Generate Acak</span>
                  </button>
                </div>
                <div className="relative">
                  <Barcode className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="MNM-101"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kategori Produk <span className="text-rose-400">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={isCustomCategory ? 'custom' : category}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsCustomCategory(true);
                      } else {
                        setIsCustomCategory(false);
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="custom">+ Kategori Lainnya...</option>
                  </select>
                </div>
                {isCustomCategory && (
                  <input
                    type="text"
                    required
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Ketik kategori baru..."
                    className="w-full mt-2 px-3 py-2 bg-slate-950 border border-emerald-500/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Profit Margin */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pengaturan Harga & Estimasi Profit</span>
              </span>
              {price > 0 && (
                <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-md ${
                  profitMargin >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  Margin: {formatRupiah(profitMargin)} ({marginPercentage}%)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Harga Beli / Modal (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={costPrice || ''}
                  onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1">
                  Harga Jual Kasir (Rp) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={price || ''}
                  onChange={(e) => setPrice(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-emerald-500/60 rounded-xl text-base font-bold text-emerald-400 font-mono focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Stock Management */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>Manajemen Stok & Satuan</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Jumlah Stok Saat Ini <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Peringatan Minimum Stok
                </label>
                <input
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Satuan
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  {DEFAULT_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Photo / Image URL */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              URL Foto Produk (Opsional)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ImageIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              {imageUrl && (
                <div className="w-9 h-9 rounded-xl border border-slate-700 overflow-hidden shrink-0 bg-slate-950">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setImageUrl('')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Super Admin confirmation note */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Perubahan produk akan langsung tersimpan di Cloud Firestore dan diperbarui di layar kasir secara realtime.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-950 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  <span>{productToEdit ? 'Simpan Perubahan' : 'Tambahkan Produk'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
