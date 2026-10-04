import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Mail, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Sparkles
} from 'lucide-react';
import { StaffAdmin, UserProfile, isUserSuperAdmin } from '../types';

interface AdminManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffAdmin[];
  onAddStaff: (staffData: Omit<StaffAdmin, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteStaff: (staffId: string) => Promise<void>;
  currentUser: UserProfile | null;
  onSwitchUserRole?: (role: 'super_admin' | 'admin' | 'kasir') => void;
}

export const AdminManagementModal: React.FC<AdminManagementModalProps> = ({
  isOpen,
  onClose,
  staffList,
  onAddStaff,
  onDeleteStaff,
  currentUser,
  onSwitchUserRole,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'kasir'>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isSuper = isUserSuperAdmin(currentUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
      setErrorMsg('Nama dan email wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onAddStaff({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role,
        assignedBy: currentUser?.email || 'Super Admin',
      });
      setSuccessMsg(`Berhasil menambahkan ${name} sebagai ${role === 'admin' ? 'Admin' : 'Kasir'}.`);
      setEmail('');
      setName('');
      setRole('admin');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambahkan staf admin.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Manajemen Admin & Staf</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola hak akses Admin (bisa lihat Dashboard) dan Kasir (khusus transaksi)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick role test switcher */}
          {onSwitchUserRole && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Uji Coba Hak Akses Peran (Testing Role)</span>
                </span>
                <span className="text-[10px] text-slate-500">Ubah peran Anda saat ini untuk melihat perbedaan</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onSwitchUserRole('super_admin')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentUser?.role === 'super_admin'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  ★ Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchUserRole('admin')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentUser?.role === 'admin'
                      ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-950'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  Admin Toko
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchUserRole('kasir')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentUser?.role === 'kasir'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  Kasir Biasa
                </button>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                * Catatan: Ketika menjadi <b>Kasir Biasa</b>, bagian Dashboard penjualan otomatis terkunci dan tidak bisa diakses.
              </p>
            </div>
          )}

          {/* Form Tambah Admin Baru */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Tambah Admin atau Kasir Baru</span>
            </h4>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nama Lengkap Staf
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Sarah Wijaya"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Akun Staf
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sarah@toko.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-300">Pilih Hak Akses:</span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="staffRole"
                      checked={role === 'admin'}
                      onChange={() => setRole('admin')}
                      className="text-amber-500 focus:ring-0"
                    />
                    <span className="font-semibold text-amber-400">Admin (Bisa Lihat Dashboard)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="staffRole"
                      checked={role === 'kasir'}
                      onChange={() => setRole('kasir')}
                      className="text-emerald-500 focus:ring-0"
                    />
                    <span>Kasir Biasa</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : '+ Tambahkan Staf'}
                </button>
              </div>
            </form>
          </div>

          {/* List Staf / Admin yang Terdaftar */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Daftar Admin & Staf Aktif ({staffList.length + 1})
            </h4>

            <div className="divide-y divide-slate-800 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
              {/* Default Super Admin */}
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                    SA
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{currentUser?.displayName || 'Super Admin Owner'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                        Owner / Super Admin
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {currentUser?.email || 'aroyansabilalmustakim@gmail.com'}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 italic">Hak Akses Penuh</div>
              </div>

              {/* Added Staff List */}
              {staffList.map((staf) => (
                <div key={staf.id} className="p-3.5 flex items-center justify-between hover:bg-slate-900/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      staf.role === 'admin' 
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {staf.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{staf.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          staf.role === 'admin'
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {staf.role === 'admin' ? 'Admin Toko' : 'Kasir'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{staf.email}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteStaff(staf.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Staf"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
