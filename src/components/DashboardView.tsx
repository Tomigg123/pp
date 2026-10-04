import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  BarChart3, 
  ArrowUpRight, 
  Package, 
  Receipt,
  Sparkles,
  Layers,
  ArrowRight,
  Lock,
  ShieldCheck,
  Download,
  Clock,
  QrCode,
  Banknote,
  Building2,
  Percent,
  CheckCircle2,
  Boxes,
  Briefcase
} from 'lucide-react';
import { Product, Transaction, UserProfile, canAccessDashboard, isUserSuperAdmin } from '../types';
import { formatRupiah, formatDateTime } from '../utils/formatters';

interface DashboardViewProps {
  products: Product[];
  transactions: Transaction[];
  currentUser: UserProfile | null;
  onOpenReceipt: (tx: Transaction) => void;
  onNavigateToProducts: () => void;
  onNavigateToPos: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  transactions,
  currentUser,
  onOpenReceipt,
  onNavigateToProducts,
  onNavigateToPos,
}) => {
  const hasAccess = canAccessDashboard(currentUser);
  const isSuper = isUserSuperAdmin(currentUser);

  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'all'>('7days');

  // Filter transactions based on selected period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      if (period === 'today') {
        return (
          txDate.getDate() === now.getDate() &&
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      }
      if (period === '7days') {
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (period === '30days') {
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 30;
      }
      return true;
    });
  }, [transactions, period]);

  // Aggregate metrics
  const totalRevenue = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + tx.finalAmount, 0);
  }, [filteredTransactions]);

  const totalItemsSold = useMemo(() => {
    return filteredTransactions.reduce(
      (sum, tx) => sum + tx.items.reduce((iSum, item) => iSum + item.quantity, 0),
      0
    );
  }, [filteredTransactions]);

  const totalCost = useMemo(() => {
    return filteredTransactions.reduce(
      (sum, tx) => sum + tx.items.reduce((iSum, item) => iSum + (item.costPrice || 0) * item.quantity, 0),
      0
    );
  }, [filteredTransactions]);

  const estimatedProfit = Math.max(0, totalRevenue - totalCost);
  const profitMarginPercent = totalRevenue > 0 ? Math.round((estimatedProfit / totalRevenue) * 100) : 0;

  // Store Inventory Valuation (Exclusive for Admin & Super Admin)
  const inventoryValuation = useMemo(() => {
    const totalStockUnits = products.reduce((sum, p) => sum + Math.max(0, p.stock), 0);
    const totalCapitalTied = products.reduce((sum, p) => sum + (p.costPrice || 0) * Math.max(0, p.stock), 0);
    const totalPotentialRevenue = products.reduce((sum, p) => sum + p.price * Math.max(0, p.stock), 0);
    const potentialProfit = Math.max(0, totalPotentialRevenue - totalCapitalTied);

    const restockNeededItems = products.filter(p => p.stock <= (p.minStock || 5));
    const restockBudgetNeeded = restockNeededItems.reduce((sum, p) => {
      const deficit = Math.max(0, (p.minStock || 5) * 2 - p.stock);
      return sum + deficit * (p.costPrice || 0);
    }, 0);

    return {
      totalStockUnits,
      totalCapitalTied,
      totalPotentialRevenue,
      potentialProfit,
      totalSku: products.length,
      restockNeededItemsCount: restockNeededItems.length,
      restockBudgetNeeded,
    };
  }, [products]);

  // Payment Breakdown (Exclusive for Admin & Super Admin)
  const paymentBreakdown = useMemo(() => {
    let cash = 0;
    let qris = 0;
    let transfer = 0;
    let card = 0;

    filteredTransactions.forEach(tx => {
      if (tx.paymentMethod === 'cash') cash += tx.finalAmount;
      else if (tx.paymentMethod === 'qris') qris += tx.finalAmount;
      else if (tx.paymentMethod === 'transfer') transfer += tx.finalAmount;
      else card += tx.finalAmount;
    });

    return { cash, qris, transfer, card };
  }, [filteredTransactions]);

  // Peak Hours Analysis (Exclusive for Admin & Super Admin)
  const peakHoursAnalysis = useMemo(() => {
    const slots = [
      { label: 'Pagi (06:00 - 11:59)', count: 0, revenue: 0, color: 'bg-amber-400' },
      { label: 'Siang (12:00 - 15:59)', count: 0, revenue: 0, color: 'bg-emerald-400' },
      { label: 'Sore (16:00 - 18:59)', count: 0, revenue: 0, color: 'bg-teal-400' },
      { label: 'Malam (19:00 - 23:59)', count: 0, revenue: 0, color: 'bg-indigo-400' },
    ];

    filteredTransactions.forEach(tx => {
      const hour = new Date(tx.createdAt).getHours();
      if (hour >= 6 && hour < 12) {
        slots[0].count++;
        slots[0].revenue += tx.finalAmount;
      } else if (hour >= 12 && hour < 16) {
        slots[1].count++;
        slots[1].revenue += tx.finalAmount;
      } else if (hour >= 16 && hour < 19) {
        slots[2].count++;
        slots[2].revenue += tx.finalAmount;
      } else {
        slots[3].count++;
        slots[3].revenue += tx.finalAmount;
      }
    });

    const maxCount = Math.max(...slots.map(s => s.count), 1);
    return slots.map(s => ({
      ...s,
      percentage: Math.round((s.count / maxCount) * 100),
    }));
  }, [filteredTransactions]);

  // Top selling products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>();
    filteredTransactions.forEach((tx) => {
      tx.items.forEach((item) => {
        const cur = map.get(item.productId) || { name: item.name, quantity: 0, revenue: 0 };
        cur.quantity += item.quantity;
        cur.revenue += item.subtotal;
        map.set(item.productId, cur);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredTransactions]);

  // Low stock products
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock <= (p.minStock || 5));
  }, [products]);

  // Daily sales for chart (Last 7 days)
  const dailySales = useMemo(() => {
    const days: { label: string; dateStr: string; total: number; count: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
      const dayNum = d.getDate();

      const dayTx = transactions.filter((tx) => tx.createdAt.startsWith(dateStr));
      const total = dayTx.reduce((sum, tx) => sum + tx.finalAmount, 0);

      days.push({
        label: `${dayName} ${dayNum}`,
        dateStr,
        total,
        count: dayTx.length,
      });
    }

    return days;
  }, [transactions]);

  const maxDailyTotal = Math.max(...dailySales.map((d) => d.total), 1);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filteredTransactions.forEach((tx) => {
      tx.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cat = prod?.category || 'Lainnya';
        map.set(cat, (map.get(cat) || 0) + item.subtotal);
      });
    });

    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, val]) => s + val, 0) || 1;
    return entries.map(([cat, val]) => ({
      category: cat,
      revenue: val,
      percentage: Math.round((val / total) * 100),
    }));
  }, [filteredTransactions, products]);

  // Export CSV Report (Admin & Super Admin Exclusive)
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['No Invoice', 'Waktu', 'Kasir / Pemesan', 'Tipe Pesanan', 'Item Dibeli', 'Metode Bayar', 'Total Pembayaran (Rp)', 'Status'];
    const rows = filteredTransactions.map((tx) => [
      tx.invoiceNumber,
      formatDateTime(tx.createdAt),
      tx.cashierName || tx.customerName || '-',
      tx.orderType || 'pos',
      tx.items.map(i => `${i.name} (x${i.quantity})`).join('; '),
      tx.paymentMethod,
      tx.finalAmount,
      tx.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Rekap_Penjualan_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!hasAccess) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[70vh]">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-white">Akses Dashboard Terkunci</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sesuai kebijakan toko, bagian <b>Dashboard Laporan Keuangan, Omzet, & Valuasi Aset</b> hanya dapat diakses oleh akun <b>Super Admin</b> dan <b>Admin Toko</b>.
          </p>
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span className="text-slate-400">Status Peran Anda:</span>
            <span className="font-bold text-amber-400 uppercase tracking-wider">{currentUser?.role || 'Pelanggan'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Portal Laporan Khusus {isSuper ? 'Super Admin' : 'Admin'}</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Dashboard Analitik Toko</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Laporan keuntungan bersih, margin HPP, valuasi stok gudang, dan rekap transaksi kasir
          </p>
        </div>

        {/* Filter Period Buttons & CSV Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                period === 'today'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPeriod('7days')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                period === '7days'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setPeriod('30days')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                period === '30days'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              30 Hari
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                period === 'all'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            title="Download Rekap Laporan Penjualan Excel/CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Omzet Penjualan
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatRupiah(totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Dari {filteredTransactions.length} nota penjualan selesai
          </p>
        </div>

        {/* Total Cost of Goods (COGS / HPP) - Exclusive Admin */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Modal Barang (HPP)
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {formatRupiah(totalCost)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Biaya pokok barang yang terjual</p>
        </div>

        {/* Net Profit Real - Exclusive Admin */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Laba Bersih Toko
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-300 font-mono">
            {formatRupiah(estimatedProfit)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-teal-400 font-semibold mt-1">
            <Percent className="w-3 h-3" />
            <span>Margin Laba: {profitMarginPercent}%</span>
          </div>
        </div>

        {/* Total Physical Items Sold */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Unit Barang Keluar
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {totalItemsSold}{' '}
            <span className="text-xs font-normal text-slate-400">pcs</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total volume fisik barang retail terjual</p>
        </div>
      </div>

      {/* ADMIN & SUPER ADMIN EXCLUSIVE: INVENTORY VALUATION & CASH SETTLEMENT CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Valuasi Total Aset Inventaris Toko (Nilai Barang di Gudang) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>Valuasi Aset Stok Toko</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-md">Admin Only</span>
                </h3>
                <p className="text-[11px] text-slate-400">Total kekayaan barang fisik di toko</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 font-mono">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Modal Tertanam di Stok:</span>
              <span className="font-bold text-white text-sm">
                {formatRupiah(inventoryValuation.totalCapitalTied)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Potensi Nilai Jual Stok:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {formatRupiah(inventoryValuation.totalPotentialRevenue)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs border-t border-slate-800/80 pt-2 text-teal-300">
              <span className="text-slate-400">Potensi Laba di Gudang:</span>
              <span className="font-extrabold text-sm">
                +{formatRupiah(inventoryValuation.potentialProfit)}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
              <span>Total Varian SKU: {inventoryValuation.totalSku} jenis</span>
              <span>Total Stok Fisik: {inventoryValuation.totalStockUnits} pcs</span>
            </div>
          </div>
        </div>

        {/* Card 2: Rekapitulasi Kas & Settlement Pembayaran */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Rekapitulasi Arus Kas</h3>
                <p className="text-[11px] text-slate-400">Rincian uang masuk kasir vs digital</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span>Uang Tunai (Cash di Kasir)</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {formatRupiah(paymentBreakdown.cash)}
              </span>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <QrCode className="w-4 h-4 text-teal-400" />
                <span>Pembayaran QRIS</span>
              </div>
              <span className="text-xs font-mono font-bold text-teal-300">
                {formatRupiah(paymentBreakdown.qris)}
              </span>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>Transfer Bank / Lainnya</span>
              </div>
              <span className="text-xs font-mono font-bold text-sky-300">
                {formatRupiah(paymentBreakdown.transfer + paymentBreakdown.card)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Analisis Jam Sibuk Toko & Kebutuhan Restok */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Jam Sibuk Toko (Peak Hours)</h3>
                <p className="text-[11px] text-slate-400">Waktu pelanggan paling ramai belanja</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {peakHoursAnalysis.map((slot) => (
              <div key={slot.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 text-[11px]">{slot.label}</span>
                  <span className="font-mono text-emerald-400 font-bold text-[11px]">
                    {slot.count} tx ({formatRupiah(slot.revenue)})
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    style={{ width: `${slot.percentage}%` }}
                    className={`${slot.color} h-full rounded-full transition-all duration-500`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Sales Chart (7 days) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Tren Penjualan 7 Hari Terakhir</h3>
                <p className="text-xs text-slate-400 mt-0.5">Grafik volume omzet harian toko barang</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Realtime Cloud</span>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="h-56 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-800">
              {dailySales.map((day, idx) => {
                const heightPercent =
                  maxDailyTotal > 0 ? Math.max(6, Math.round((day.total / maxDailyTotal) * 100)) : 6;
                const isToday = idx === dailySales.length - 1;

                return (
                  <div key={day.dateStr} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-emerald-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 mb-1 whitespace-nowrap z-10">
                      {formatRupiah(day.total)} ({day.count} tx)
                    </div>
                    <div className="w-full bg-slate-950 rounded-xl p-1 flex items-end h-[160px]">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-lg transition-all duration-500 ${
                          isToday
                            ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-md shadow-emerald-500/20'
                            : 'bg-slate-700 hover:bg-emerald-600/70'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[10px] mt-2 font-medium ${
                        isToday ? 'text-emerald-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-4">
            <span>Rata-rata Penjualan Harian</span>
            <span className="font-bold text-white font-mono">
              {formatRupiah(Math.round(totalRevenue / Math.max(1, dailySales.length)))}
            </span>
          </div>
        </div>

        {/* Right (1 col): Category Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Distribusi Kategori Barang</h3>
                <p className="text-xs text-slate-400 mt-0.5">Kontribusi omzet per kategori produk</p>
              </div>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-4 my-2">
              {categoryBreakdown.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-slate-500 text-xs">
                  Belum ada data penjualan pada periode ini
                </div>
              ) : (
                categoryBreakdown.map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200">{item.category}</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {item.percentage}% ({formatRupiah(item.revenue)})
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={onNavigateToPos}
            className="w-full py-2.5 mt-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Buka Kasir untuk Transaksi</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Bottom Row: Top Products & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Best Sellers */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">5 Barang Terlaris</h3>
              <p className="text-xs text-slate-400 mt-0.5">Produk dengan kuantitas penjualan tertinggi</p>
            </div>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>

          <div className="divide-y divide-slate-800">
            {topProducts.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-slate-500 text-xs">
                Belum ada transaksi pada periode yang dipilih
              </div>
            ) : (
              topProducts.map((p, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                        idx === 0
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-100">{p.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Terjual {p.quantity} item
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {formatRupiah(p.revenue)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Warning Alert */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Peringatan Stok Menipis</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Produk barang yang berada di bawah batas minimum</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">
                {lowStockProducts.length} Produk
              </span>
            </div>

            <div className="divide-y divide-slate-800 max-h-56 overflow-y-auto pr-1">
              {lowStockProducts.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                  <Package className="w-8 h-8 text-emerald-500 mb-1.5" />
                  <span className="text-slate-300 font-medium">Stok Barang Aman Terkendali</span>
                  <span className="text-[11px] text-slate-500">
                    Semua stok barang berada di atas batas minimum.
                  </span>
                </div>
              ) : (
                lowStockProducts.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.sku} • {p.category}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-lg font-bold font-mono ${
                          p.stock === 0
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {p.stock === 0 ? 'Habis' : `Sisa ${p.stock} ${p.unit || ''}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={onNavigateToProducts}
            className="w-full py-2.5 mt-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Kelola Database Produk & Tambah Stok</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Live Recent Transactions Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Transaksi Terbaru</h3>
            <p className="text-xs text-slate-400 mt-0.5">Riwayat nota penjualan kasir & toko online</p>
          </div>
          <Receipt className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-slate-500 text-xs">
              Belum ada transaksi yang tercatat. Silakan lakukan transaksi perdana di tab Kasir atau Beranda Belanja.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">No. Invoice</th>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Kasir / Pemesan</th>
                  <th className="py-3 px-4">Item Terjual</th>
                  <th className="py-3 px-4">Metode</th>
                  <th className="py-3 px-4 text-right">Total Bayar</th>
                  <th className="py-3 px-4 text-center">Struk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions.slice(0, 6).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">{tx.invoiceNumber}</td>
                    <td className="py-3 px-4 text-slate-400">{formatDateTime(tx.createdAt)}</td>
                    <td className="py-3 px-4 text-slate-300">{tx.cashierName}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {tx.items.length} macam ({tx.items.reduce((s, i) => s + i.quantity, 0)} pcs)
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium uppercase text-[10px]">
                        {tx.paymentMethod === 'cash' ? 'Tunai' : tx.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatRupiah(tx.finalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onOpenReceipt(tx)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors text-[11px] font-semibold cursor-pointer"
                      >
                        Lihat Struk
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
