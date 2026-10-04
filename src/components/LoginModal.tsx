import React, { useState } from 'react';
import { Store, ShieldCheck, CheckCircle2, AlertCircle, Lock, ArrowLeft, X } from 'lucide-react';
import { loginWithGoogle, logoutUser } from '../firebase';
import { UserProfile, StaffAdmin } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  staffList: StaffAdmin[];
  onBackToStorefront?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  staffList,
  onBackToStorefront,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await loginWithGoogle();
      const u = res.user;
      const userEmail = (u.email || '').toLowerCase().trim();
      const superAdminEmail = 'aroyansabilalmustakim@gmail.com'.toLowerCase().trim();

      const isSuper = userEmail === superAdminEmail;
      const matchedStaff = staffList.find(
        (s) => s.email.toLowerCase().trim() === userEmail
      );

      // STRICT ACCESS GATE:
      // Hanya Super Admin (aroyansabilalmustakim@gmail.com) dan email yang terdaftar di staffList yang diizinkan!
      if (!isSuper && !matchedStaff) {
        await logoutUser();
        setErrorMsg(
          `Akses Ditolak: Email (${u.email}) belum didaftarkan sebagai Admin atau Kasir. Hubungi Super Admin untuk mendaftarkan akun Anda terlebih dahulu.`
        );
        return;
      }

      // Determine role
      const role: 'super_admin' | 'admin' | 'kasir' = isSuper
        ? 'super_admin'
        : (matchedStaff?.role || 'kasir');

      const userProfile: UserProfile = {
        id: u.uid,
        email: u.email || 'kasir@toko.com',
        displayName: u.displayName || (isSuper ? 'Super Admin' : (matchedStaff?.name || 'Staf Kasir')),
        photoURL: u.photoURL || undefined,
        role: role,
        createdAt: new Date().toISOString(),
      };

      onSuccess(userProfile);
      onClose();
    } catch (err: unknown) {
      const errCode = (err as any)?.code || '';
      const errMsg = err instanceof Error ? err.message : '';

      // User closed or cancelled the popup - no error needed
      if (
        errCode === 'auth/popup-closed-by-user' ||
        errMsg.includes('auth/popup-closed-by-user') ||
        errCode === 'auth/cancelled-popup-request'
      ) {
        return;
      }

      if (errCode === 'auth/popup-blocked') {
        setErrorMsg('Jendela popup login diblokir oleh browser. Harap izinkan popup di browser Anda.');
        return;
      }

      console.error('Google login error:', err);
      const message = err instanceof Error ? err.message : 'Gagal masuk dengan Google.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl text-white relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Heading */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 border border-emerald-500/30 flex items-center justify-center shadow-lg text-emerald-400">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Portal Masuk Staf & Admin
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Hanya dapat diakses oleh <b className="text-amber-400">Super Admin</b> dan akun email staf yang telah didaftarkan.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMsg}</span>
          </div>
        )}

        {/* Security Info Card */}
        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1.5 mb-6">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verifikasi Keamanan Akses:</span>
          </div>
          <ul className="text-[11px] list-disc list-inside space-y-1 text-slate-400 pl-1">
            <li>Akun Owner: <b>aroyansabilalmustakim@gmail.com</b></li>
            <li>Akun staf yang telah didaftarkan oleh Super Admin</li>
          </ul>
        </div>

        {/* Google Login Button */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12c0 2.02.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Masuk dengan Akun Google Terdaftar</span>
              </>
            )}
          </button>

          {/* Quick exit for customers who opened by accident */}
          {onBackToStorefront && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onBackToStorefront();
              }}
              className="w-full py-2.5 text-center text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Bukan Staf? Kembali ke Beranda Belanja Pelanggan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
