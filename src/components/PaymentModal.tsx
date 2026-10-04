import React, { useState } from 'react';
import { 
  X, 
  Banknote, 
  QrCode, 
  CreditCard, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onConfirmPayment: (
    paymentMethod: 'cash' | 'qris' | 'transfer' | 'card',
    paymentAmount: number,
    changeAmount: number
  ) => Promise<void>;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onConfirmPayment,
}) => {
  const [method, setMethod] = useState<'cash' | 'qris' | 'transfer' | 'card'>('cash');
  const [cashGiven, setCashGiven] = useState<number>(totalAmount);
  const [customInput, setCustomInput] = useState<string>(totalAmount.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const changeAmount = method === 'cash' ? Math.max(0, cashGiven - totalAmount) : 0;
  const isUnderpaid = method === 'cash' && cashGiven < totalAmount;

  // Quick cash buttons
  const cashSuggestions = [
    totalAmount,
    10000,
    20000,
    50000,
    100000,
    200000,
  ].filter((amt, idx, arr) => amt >= totalAmount && arr.indexOf(amt) === idx).slice(0, 5);

  const handleCashSelect = (amount: number) => {
    setCashGiven(amount);
    setCustomInput(amount.toString());
  };

  const handleCustomInputChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setCustomInput(clean);
    setCashGiven(Number(clean) || 0);
  };

  const handleSubmit = async () => {
    if (isUnderpaid) {
      setErrorMsg(`Uang pembayaran kurang ${formatRupiah(totalAmount - cashGiven)}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const paid = method === 'cash' ? cashGiven : totalAmount;
      const change = method === 'cash' ? changeAmount : 0;
      await onConfirmPayment(method, paid, change);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses pembayaran.';
      setErrorMsg(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-white">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Pembayaran Kasir</h3>
            <p className="text-xs text-slate-400 mt-0.5">Pilih metode pembayaran dan masukkan jumlah uang</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Display */}
        <div className="bg-slate-950/60 p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Tagihan</span>
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight mt-0.5">
              {formatRupiah(totalAmount)}
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            {method === 'cash' ? 'Tunai' : method === 'qris' ? 'QRIS Digital' : method === 'transfer' ? 'Transfer Bank' : 'Kartu Debit'}
          </div>
        </div>

        {/* Payment Methods Tabs */}
        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setMethod('cash')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                method === 'cash'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span className="text-xs font-medium">Tunai</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('qris')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                method === 'qris'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span className="text-xs font-medium">QRIS</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('transfer')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                method === 'transfer'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span className="text-xs font-medium">Transfer</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('card')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                method === 'card'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-xs font-medium">Kartu</span>
            </button>
          </div>

          {/* Method specifics */}
          {method === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Uang Diterima dari Pelanggan (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customInput}
                    onChange={(e) => handleCustomInputChange(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-xl font-bold text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Fast Amount Chips */}
              <div>
                <div className="text-xs text-slate-400 mb-2 font-medium">Nominal Cepat:</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleCashSelect(totalAmount)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      cashGiven === totalAmount
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    Uang Pas ({formatRupiah(totalAmount)})
                  </button>
                  {cashSuggestions
                    .filter((amt) => amt !== totalAmount)
                    .map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleCashSelect(amt)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                          cashGiven === amt
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {formatRupiah(amt)}
                      </button>
                    ))}
                </div>
              </div>

              {/* Change / Kembalian Calculation */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isUnderpaid 
                  ? 'bg-rose-500/10 border-rose-500/30' 
                  : 'bg-emerald-500/10 border-emerald-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">
                    {isUnderpaid ? 'Kurang Bayar' : 'Uang Kembalian'}
                  </span>
                  <span className={`text-xl font-extrabold ${isUnderpaid ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {isUnderpaid ? formatRupiah(totalAmount - cashGiven) : formatRupiah(changeAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {method === 'qris' && (
            <div className="text-center p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl shadow-md flex items-center justify-center">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020101021226680016ID.CO.QRIS.WWW011893600503000008920215ID10200238491025802ID5910KASIRKU_POS6007JAKARTA62070703A016304C92E"
                  alt="QRIS Static / Dynamic"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Scan QRIS Nasional</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  BCA, GoPay, OVO, Dana, ShopeePay, LinkAja, Mandiri Livin, BRImo
                </p>
              </div>
            </div>
          )}

          {method === 'transfer' && (
            <div className="space-y-2.5 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <div className="font-semibold text-slate-300 mb-1">Rekening Pembayaran Toko:</div>
              <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="font-bold text-white">Bank BCA</span>
                <span className="font-mono text-emerald-400 font-bold">882-019-3381 (KasirKu)</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="font-bold text-white">Bank Mandiri</span>
                <span className="font-mono text-emerald-400 font-bold">137-00-19283-11</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pastikan nama pengirim dan bukti transfer telah diverifikasi oleh kasir.
              </p>
            </div>
          )}

          {method === 'card' && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-2">
              <CreditCard className="w-10 h-10 mx-auto text-emerald-400 mb-1" />
              <div className="text-sm font-semibold text-white">Mesin EDC Siap Digunakan</div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Silakan gesek / tap kartu debit atau kartu kredit pelanggan pada mesin EDC kasir.
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUnderpaid}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/50 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Selesaikan Transaksi</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
