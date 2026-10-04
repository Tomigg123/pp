import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Receipt, 
  Printer, 
  Tag, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Banknote, 
  QrCode, 
  Building2, 
  Sparkles, 
  Percent, 
  DollarSign, 
  ArrowRight, 
  Lock, 
  Calendar,
  Layers,
  Barcode,
  Coins
} from 'lucide-react';
import { Product, Transaction, UserProfile, canAccessStaffArea, isUserSuperAdmin } from '../types';
import { formatRupiah, formatDateTime } from '../utils/formatters';

interface BusinessAuditViewProps {
  products: Product[];
  transactions: Transaction[];
  currentUser: UserProfile | null;
  onNavigateToPos: () => void;
}

export const BusinessAuditView: React.FC<BusinessAuditViewProps> = ({
  products,
  transactions,
  currentUser,
  onNavigateToPos,
}) => {
  const isStaff = canAccessStaffArea(currentUser);
  const isSuper = isUserSuperAdmin(currentUser);

  // Active Sub-Tool Tab
  const [activeTool, setActiveTool] = useState<'closing' | 'pricing' | 'labels'>('closing');

  // ==========================================
  // 1. Z-REPORT & CASH REGISTER AUDIT STATE
  // ==========================================
  const [openingFloat, setOpeningFloat] = useState<number>(100000); // Modal Awal Kasir
  const [shiftNotes, setShiftNotes] = useState('');
  const [cashierInCharge, setCashierInCharge] = useState(currentUser?.displayName || 'Admin Toko');

  // Denominations count
  const [denom, setDenom] = useState({
    c100k: 0,
    c50k: 0,
    c20k: 0,
    c10k: 0,
    c5k: 0,
    c2k: 0,
    c1k: 0,
    coins: 0,
  });

  // Calculate today's system sales
  const todayTransactions = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return transactions.filter(tx => tx.createdAt.startsWith(todayStr));
  }, [transactions]);

  const todayCashSales = useMemo(() => {
    return todayTransactions
      .filter(tx => tx.paymentMethod === 'cash')
      .reduce((sum, tx) => sum + tx.finalAmount, 0);
  }, [todayTransactions]);

  const todayQrisSales = useMemo(() => {
    return todayTransactions
      .filter(tx => tx.paymentMethod === 'qris')
      .reduce((sum, tx) => sum + tx.finalAmount, 0);
  }, [todayTransactions]);

  const todayTransferSales = useMemo(() => {
    return todayTransactions
      .filter(tx => tx.paymentMethod === 'transfer' || tx.paymentMethod === 'card')
      .reduce((sum, tx) => sum + tx.finalAmount, 0);
  }, [todayTransactions]);

  const totalSystemRevenue = todayCashSales + todayQrisSales + todayTransferSales;

  // Expected physical cash in drawer = Opening Float + Cash Sales
  const expectedCashInDrawer = openingFloat + todayCashSales;

  // Actual physical cash counted
  const actualCountedCash = useMemo(() => {
    return (
      denom.c100k * 100000 +
      denom.c50k * 50000 +
      denom.c20k * 20000 +
      denom.c10k * 10000 +
      denom.c5k * 5000 +
      denom.c2k * 2000 +
      denom.c1k * 1000 +
      denom.coins
    );
  }, [denom]);

  const cashDiscrepancy = actualCountedCash - expectedCashInDrawer;

  // Quick helper to adjust denomination
  const updateDenom = (key: keyof typeof denom, delta: number) => {
    setDenom(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta)
    }));
  };

  const handlePrintZReport = () => {
    window.print();
  };

  // ==========================================
  // 2. SMART PRICING & MARGIN SIMULATOR STATE
  // ==========================================
  const [simCostPrice, setSimCostPrice] = useState<number>(20000);
  const [targetMargin, setTargetMargin] = useState<number>(30); // 30% margin
  const [simPromoDiscount, setSimPromoDiscount] = useState<number>(10); // 10% discount

  // Selling price formula based on margin: price = cost / (1 - margin/100)
  const calculatedSellingPrice = useMemo(() => {
    if (targetMargin >= 100) return simCostPrice * 2;
    const price = simCostPrice / (1 - targetMargin / 100);
    // Round to nearest 500
    return Math.round(price / 500) * 500;
  }, [simCostPrice, targetMargin]);

  const calculatedProfitPerUnit = calculatedSellingPrice - simCostPrice;
  const promoPrice = Math.round(calculatedSellingPrice * (1 - simPromoDiscount / 100));
  const promoProfit = promoPrice - simCostPrice;

  // ==========================================
  // 3. SHELF LABEL & BARCODE GENERATOR STATE
  // ==========================================
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  if (!isStaff) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[70vh]">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-white">Menu Eksklusif Admin</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Fitur <b>Audit Kas, Tutup Buku Kasir, & Generator Label Rak</b> hanya dapat diakses oleh akun <b>Super Admin</b> dan <b>Admin Toko</b>.
          </p>
          <button
            onClick={onNavigateToPos}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Buka Mesin Kasir (POS)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-5 w-full max-w-full overflow-hidden">
      {/* Top Banner & Mode Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full overflow-hidden">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Pusat Kontrol Bisnis {isSuper ? 'Super Admin' : 'Admin'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 truncate">Audit Kas & Peralatan Toko</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tutup kasir harian (Z-Report), simulasi harga jual & margin laba, serta cetak label rak etalase
          </p>
        </div>

        {/* Sub-tools Navigation Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-semibold w-full md:w-auto overflow-x-auto no-scrollbar scroll-smooth shrink-0">
          <button
            onClick={() => setActiveTool('closing')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTool === 'closing'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Tutup Kasir (Z-Report)</span>
          </button>

          <button
            onClick={() => setActiveTool('pricing')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTool === 'pricing'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Simulasi Margin & Harga</span>
          </button>

          <button
            onClick={() => setActiveTool('labels')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTool === 'labels'
                ? 'bg-indigo-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Label Rak & Barcode</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. TUTUP KASIR & REKONSILIASI LACI KAS (Z-REPORT)        */}
      {/* ======================================================== */}
      {activeTool === 'closing' && (
        <div className="space-y-5">
          {/* Top Quick Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Modal Awal Kasir
              </span>
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Kas uang kecil pecahan awal</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Penjualan Tunai Sistem
              </span>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {formatRupiah(todayCashSales)}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {todayTransactions.filter(t => t.paymentMethod === 'cash').length} transaksi tunai hari ini
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Target Uang di Laci
              </span>
              <div className="text-xl font-bold font-mono text-white">
                {formatRupiah(expectedCashInDrawer)}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Modal Awal + Penjualan Tunai</span>
            </div>

            <div className={`border rounded-2xl p-4 ${
              cashDiscrepancy === 0
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : cashDiscrepancy > 0
                ? 'bg-sky-950/40 border-sky-500/40 text-sky-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}>
              <span className="text-[11px] font-semibold uppercase tracking-wider block mb-1">
                Status Selisih Kasir
              </span>
              <div className="text-xl font-black font-mono">
                {cashDiscrepancy === 0 ? 'SEIMBANG (Rp 0)' : `${cashDiscrepancy > 0 ? '+' : ''}${formatRupiah(cashDiscrepancy)}`}
              </div>
              <span className="text-[10px] mt-1 block">
                {cashDiscrepancy === 0 ? '✓ Uang fisik tepat cocok' : cashDiscrepancy > 0 ? '↑ Kas fisik lebih (Surplus)' : '⚠ Kas fisik kurang (Minus)'}
              </span>
            </div>
          </div>

          {/* Main Grid: Denomination Counter & Closing Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 cols: Denomination counter */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">Perhitungan Fisik Uang di Laci Kasir</h3>
                    <p className="text-[11px] text-slate-400">Masukkan jumlah lembar masing-masing pecahan uang kertas</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDenom({ c100k: 0, c50k: 0, c20k: 0, c10k: 0, c5k: 0, c2k: 0, c1k: 0, coins: 0 })}
                  className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Reset Hitungan
                </button>
              </div>

              {/* Denominations Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'c100k' as const, label: 'Rp 100.000', value: 100000, color: 'text-rose-400' },
                  { key: 'c50k' as const, label: 'Rp 50.000', value: 50000, color: 'text-sky-400' },
                  { key: 'c20k' as const, label: 'Rp 20.000', value: 20000, color: 'text-emerald-400' },
                  { key: 'c10k' as const, label: 'Rp 10.000', value: 10000, color: 'text-purple-400' },
                  { key: 'c5k' as const, label: 'Rp 5.000', value: 5000, color: 'text-amber-400' },
                  { key: 'c2k' as const, label: 'Rp 2.000', value: 2000, color: 'text-slate-300' },
                  { key: 'c1k' as const, label: 'Rp 1.000', value: 1000, color: 'text-teal-400' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className={`text-xs font-bold font-mono ${item.color}`}>{item.label}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Subtotal: {formatRupiah(denom[item.key] * item.value)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateDenom(item.key, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={denom[item.key]}
                        onChange={(e) => setDenom(prev => ({ ...prev, [item.key]: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="w-12 text-center bg-slate-900 border border-slate-700 rounded-lg py-1 text-xs font-mono font-bold text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => updateDenom(item.key, 1)}
                        className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}

                {/* Coins & Other */}
                <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold font-mono text-amber-300">Uang Koin / Lainnya</div>
                    <div className="text-[10px] text-slate-500">Total nominal rupiah koin</div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={denom.coins}
                    onChange={(e) => setDenom(prev => ({ ...prev, coins: Math.max(0, parseInt(e.target.value) || 0) }))}
                    placeholder="Rp 0"
                    className="w-28 text-right px-2 bg-slate-900 border border-slate-700 rounded-lg py-1 text-xs font-mono font-bold text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Total Counted Banner */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between font-mono">
                <span className="text-xs text-slate-400">Total Uang Fisik Aktual di Laci:</span>
                <span className="text-base font-extrabold text-emerald-400">
                  {formatRupiah(actualCountedCash)}
                </span>
              </div>
            </div>

            {/* Right 1 col: Z-Report Preview & Print */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">Lembar Berita Acara (Z-Report)</h3>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Kasir Bertugas:</label>
                    <input
                      type="text"
                      value={cashierInCharge}
                      onChange={(e) => setCashierInCharge(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Catatan Shift Kasir:</label>
                    <textarea
                      rows={2}
                      value={shiftNotes}
                      onChange={(e) => setShiftNotes(e.target.value)}
                      placeholder="Kondisi laci kas, serah terima shift..."
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none resize-none"
                    />
                  </div>

                  {/* Summary Breakdown */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Omzet Toko:</span>
                      <span className="text-white font-bold">{formatRupiah(totalSystemRevenue)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Penerimaan QRIS:</span>
                      <span className="text-teal-300">{formatRupiah(todayQrisSales)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Transfer Bank:</span>
                      <span className="text-sky-300">{formatRupiah(todayTransferSales)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1">
                      <span>Penerimaan Kasir Tunai:</span>
                      <span className="text-emerald-400">{formatRupiah(todayCashSales)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Target Fisik Laci:</span>
                      <span>{formatRupiah(expectedCashInDrawer)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1 font-bold">
                      <span>Selisih Akhir:</span>
                      <span className={cashDiscrepancy === 0 ? 'text-emerald-400' : cashDiscrepancy > 0 ? 'text-sky-400' : 'text-rose-400'}>
                        {formatRupiah(cashDiscrepancy)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePrintZReport}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Z-Report Kasir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SMART PRICING & MARGIN SIMULATOR                      */}
      {/* ======================================================== */}
      {activeTool === 'pricing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Simulator Inputs */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-white text-base">Kalkulator Margin & Harga Jual Barang</h3>
                <p className="text-xs text-slate-400">Hitung harga jual optimal berdasarkan modal HPP dan target laba</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Harga Modal Pokok / HPP Barang (Rp)
                </label>
                <input
                  type="number"
                  step="500"
                  value={simCostPrice}
                  onChange={(e) => setSimCostPrice(Math.max(100, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Target Margin Laba Bersih:</span>
                  <span className="font-mono text-emerald-400 font-bold">{targetMargin}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  step="5"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 mt-2">
                  {[15, 25, 30, 40, 50].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTargetMargin(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                        targetMargin === preset
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Simulasi Diskon Promo Kilat:</span>
                  <span className="font-mono text-amber-400 font-bold">{simPromoDiscount}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={simPromoDiscount}
                  onChange={(e) => setSimPromoDiscount(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Pricing Results Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-lg flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Rekomendasi Keputusan Harga
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  Margin {targetMargin}%
                </span>
              </div>

              <div className="space-y-3 font-mono">
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Rekomendasi Harga Jual Normal:</span>
                  <span className="text-xl font-black text-emerald-400">
                    {formatRupiah(calculatedSellingPrice)}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Keuntungan Bersih Normal:</span>
                  <span className="text-base font-extrabold text-teal-300">
                    +{formatRupiah(calculatedProfitPerUnit)} / unit
                  </span>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Harga Jika Diskon Promo ({simPromoDiscount}%):</span>
                  <span className="text-base font-extrabold text-amber-400">
                    {formatRupiah(promoPrice)}
                  </span>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Sisa Keuntungan Saat Promo:</span>
                    <span className={promoProfit > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {formatRupiah(promoProfit)} / unit
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimasi PPN 11% (jika kena pajak):</span>
                    <span>{formatRupiah(Math.round(calculatedSellingPrice * 0.11))}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onNavigateToPos}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Terapkan Saat Menjual di Kasir</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SHELF PRICE TAG & BARCODE GENERATOR                   */}
      {/* ======================================================== */}
      {activeTool === 'labels' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Product Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Tag className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-bold text-white text-base">Pilih Barang untuk Label Rak</h3>
                <p className="text-xs text-slate-400">Pilih produk barang yang ingin dicetak label rak etalasenya</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Katalog Produk Toko ({products.length} barang):
              </label>
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {products.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProductId(p.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      selectedProductId === p.id
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="truncate min-w-0 pr-2">
                      <div className="text-xs font-bold truncate">{p.name}</div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {p.sku} • {p.category}
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                      {formatRupiah(p.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right 2 cols: Shelf Label Preview & Print Sheet */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Barcode className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-sm sm:text-base text-white">Pratinjau Label Harga Rak Etalase Toko</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Format Standar Ritel</span>
              </div>

              {selectedProduct ? (
                /* The Shelf Price Tag Component (High-contrast, professional design) */
                <div className="max-w-md mx-auto bg-white text-slate-950 p-4 rounded-2xl shadow-xl border-2 border-slate-300 font-sans space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm tracking-tight text-slate-900">KasirKu</span>
                      <span className="text-[9px] font-bold bg-slate-900 text-white px-1.5 py-0.2 rounded">MART</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">
                      {selectedProduct.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 line-clamp-2 leading-tight">
                      {selectedProduct.name}
                    </h4>
                  </div>

                  {/* Price Tag Body */}
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">Harga Jual</span>
                      <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-700">
                        {formatRupiah(selectedProduct.price)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Satuan</span>
                      <span className="text-xs font-bold text-slate-700 uppercase">
                        per {selectedProduct.unit || 'unit'}
                      </span>
                    </div>
                  </div>

                  {/* Fake Barcode Representation */}
                  <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                    <div className="space-y-0.5">
                      {/* Barcode visual stripes */}
                      <div className="h-6 flex items-center gap-0.5">
                        {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 3, 1, 2, 4].map((w, idx) => (
                          <div
                            key={idx}
                            style={{ width: `${w}px` }}
                            className="h-full bg-slate-900"
                          />
                        ))}
                      </div>
                      <span className="text-[9px] font-mono text-slate-600 font-bold block">
                        SKU: {selectedProduct.sku}
                      </span>
                    </div>
                    <span className="text-[8px] text-slate-400 font-mono">
                      Cetak: {new Date().toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-slate-500 text-xs">
                  Pilih produk barang untuk melihat label rak
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Label Rak Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
