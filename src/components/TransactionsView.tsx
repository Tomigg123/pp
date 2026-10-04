import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Printer, 
  Calendar, 
  DollarSign, 
  Filter, 
  CreditCard,
  Banknote,
  QrCode,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { Transaction } from '../types';
import { formatRupiah, formatDateTime } from '../utils/formatters';

interface TransactionsViewProps {
  transactions: Transaction[];
  onOpenReceipt: (tx: Transaction) => void;
  isLoading: boolean;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onOpenReceipt,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'all'>('7days');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      // Date filter
      const txDate = new Date(tx.createdAt);
      let matchDate = true;
      if (period === 'today') {
        matchDate =
          txDate.getDate() === now.getDate() &&
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear();
      } else if (period === '7days') {
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        matchDate = diffDays <= 7;
      } else if (period === '30days') {
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        matchDate = diffDays <= 30;
      }

      // Method filter
      const matchMethod = selectedMethod === 'all' || tx.paymentMethod === selectedMethod;

      // Search filter
      const matchSearch =
        tx.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.cashierName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchDate && matchMethod && matchSearch;
    });
  }, [transactions, period, selectedMethod, searchTerm]);

  // Aggregate metrics for filtered view
  const totalVolume = filteredTransactions.reduce((s, tx) => s + tx.finalAmount, 0);
  const totalCount = filteredTransactions.length;
  const avgBasketSize = totalCount > 0 ? Math.round(totalVolume / totalCount) : 0;

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-[11px]">
            <Banknote className="w-3.5 h-3.5" />
            <span>Tunai</span>
          </span>
        );
      case 'qris':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 font-semibold text-[11px]">
            <QrCode className="w-3.5 h-3.5" />
            <span>QRIS</span>
          </span>
        );
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-semibold text-[11px]">
            <Building2 className="w-3.5 h-3.5" />
            <span>Transfer</span>
          </span>
        );
      case 'card':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 font-semibold text-[11px]">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Kartu</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px]">
            {method}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Receipt className="w-4 h-4" />
            <span>Audit & Pembukuan Penjualan</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Riwayat Transaksi</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar lengkap nota dan bukti pembayaran kasir tersimpan di database
          </p>
        </div>

        {/* Filter Period Buttons */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-medium">
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Transaksi Terfilter
          </span>
          <div className="text-2xl font-black text-white font-mono">{totalCount} Struk</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Nilai Transaksi
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatRupiah(totalVolume)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Rata-rata per Transaksi
          </span>
          <div className="text-2xl font-black text-sky-400 font-mono">
            {formatRupiah(avgBasketSize)}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor nota invoice atau nama kasir..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Metode:</span>
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="all">Semua Metode</option>
            <option value="cash">Tunai (Cash)</option>
            <option value="qris">QRIS</option>
            <option value="transfer">Transfer Bank</option>
            <option value="card">Kartu Debit/Kredit</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Memuat data transaksi dari database...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <Receipt className="w-12 h-12 text-slate-600 mb-3" />
              <h4 className="text-base font-semibold text-slate-300">Belum Ada Transaksi</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Tidak ada data transaksi yang cocok dengan filter yang dipilih.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">No. Invoice</th>
                  <th className="py-3.5 px-4">Tanggal & Waktu</th>
                  <th className="py-3.5 px-4">Kasir</th>
                  <th className="py-3.5 px-4">Rincian Item</th>
                  <th className="py-3.5 px-4">Metode</th>
                  <th className="py-3.5 px-4 text-right">Total Transaksi</th>
                  <th className="py-3.5 px-4 text-center">Struk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Invoice */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-white text-sm">
                        {tx.invoiceNumber}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-slate-300">
                      {formatDateTime(tx.createdAt)}
                    </td>

                    {/* Cashier */}
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {tx.cashierName}
                    </td>

                    {/* Items count & summary */}
                    <td className="py-3.5 px-4 text-slate-400">
                      <span className="text-slate-200 font-semibold">
                        {tx.items.length} macam
                      </span>{' '}
                      ({tx.items.reduce((s, i) => s + i.quantity, 0)} total pcs)
                      <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                        {tx.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4">{getMethodBadge(tx.paymentMethod)}</td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatRupiah(tx.finalAmount)}
                    </td>

                    {/* Print / View receipt button */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onOpenReceipt(tx)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors mx-auto cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Buka Struk</span>
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
