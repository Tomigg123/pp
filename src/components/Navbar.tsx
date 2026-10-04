import React from 'react';
import { 
  ShoppingCart, 
  LayoutDashboard, 
  Package, 
  Receipt, 
  LogOut, 
  User as UserIcon,
  Store,
  Sparkles
} from 'lucide-react';
import { UserProfile, isUserSuperAdmin } from '../types';

interface NavbarProps {
  currentTab: 'pos' | 'dashboard' | 'products' | 'transactions';
  setCurrentTab: (tab: 'pos' | 'dashboard' | 'products' | 'transactions') => void;
  user: UserProfile | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  cartCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onLogout,
  onOpenLogin,
  cartCount,
}) => {
  const isSuper = isUserSuperAdmin(user);
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 select-none shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Store Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-bold">
              <Store className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">KasirKu</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  POS PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">Sistem Kasir & Manajemen Toko</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setCurrentTab('pos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'pos'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Kasir</span>
              {cartCount > 0 && (
                <span className="ml-0.5 text-xs bg-emerald-300 text-slate-900 font-bold px-1.5 py-0.2 rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentTab('products')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'products'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Database Produk</span>
            </button>

            <button
              onClick={() => setCurrentTab('transactions')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'transactions'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Riwayat Transaksi</span>
            </button>
          </nav>

          {/* User profile / Login */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-2.5">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-9 h-9 rounded-full ring-2 ring-emerald-500/40 object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden md:block text-left">
                    <div className="text-xs font-semibold text-slate-100 line-clamp-1 max-w-[120px]">
                      {user.displayName}
                    </div>
                    <div className={`text-[10px] font-bold flex items-center gap-1 ${
                      isSuper ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {isSuper ? '★ Super Admin' : 'Kasir Aktif'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="Keluar / Logout"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-md transition-all shadow-emerald-900/30"
              >
                <UserIcon className="w-4 h-4" />
                <span>Masuk Kasir</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
