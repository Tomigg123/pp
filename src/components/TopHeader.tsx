import React from 'react';
import { 
  Menu, 
  Store, 
  ShieldCheck, 
  User as UserIcon, 
  Calendar, 
  DollarSign, 
  Receipt,
  ShoppingCart,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Sparkles,
  Lock,
  Calculator
} from 'lucide-react';
import { UserProfile, isUserSuperAdmin, canAccessDashboard, canAccessStaffArea, ActiveTab } from '../types';
import { formatRupiah } from '../utils/formatters';

interface TopHeaderProps {
  currentTab: ActiveTab;
  setCurrentTab: (tab: ActiveTab) => void;
  onToggleMobileMenu: () => void;
  user: UserProfile | null;
  onOpenLogin: () => void;
  cartCount: number;
  todaySales: number;
  todayTxCount: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  setCurrentTab,
  onToggleMobileMenu,
  user,
  onOpenLogin,
  cartCount,
  todaySales,
  todayTxCount,
}) => {
  const isSuper = isUserSuperAdmin(user);
  const canViewDashboard = canAccessDashboard(user);
  const canAccessStaff = canAccessStaffArea(user);

  const getPageInfo = () => {
    switch (currentTab) {
      case 'storefront':
        return {
          title: 'Beranda Belanja Barang',
          subtitle: 'Katalog barang retail dan pemesanan online langsung dari toko',
          icon: ShoppingBag,
        };
      case 'pos':
        return {
          title: 'Mesin Kasir (POS)',
          subtitle: 'Kasir transaksi penjualan barang toko (Khusus Admin & Super Admin)',
          icon: ShoppingCart,
        };
      case 'dashboard':
        return {
          title: 'Dashboard Analitik & Penjualan',
          subtitle: 'Laporan keuangan, grafik performa omzet penjualan barang',
          icon: LayoutDashboard,
        };
      case 'products':
        return {
          title: 'Database Produk Barang',
          subtitle: 'Kelola stok, harga modal, harga jual, dan kategori barang',
          icon: Package,
        };
      case 'transactions':
        return {
          title: 'Riwayat Transaksi Penjualan',
          subtitle: 'Daftar semua bukti faktur dan nota penjualan barang di cloud',
          icon: Receipt,
        };
      case 'audit':
        return {
          title: 'Audit Kas & Tutup Toko',
          subtitle: 'Rekonsiliasi kasir Z-Report, simulasi margin harga, dan label rak',
          icon: Calculator,
        };
    }
  };

  const page = getPageInfo();
  const PageIcon = page.icon;

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs w-full max-w-full overflow-hidden">
      {/* Left: Mobile hamburger + Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 lg:hidden cursor-pointer shrink-0"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 hidden sm:flex items-center justify-center border border-emerald-500/20 shrink-0">
            <PageIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-white leading-tight truncate">
              {page.title}
            </h1>
            <p className="text-[11px] text-slate-400 hidden md:block truncate">
              {page.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Quick Storefront Switcher, Live Stats, and Profile Pill */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Switch between Storefront & POS (Only for Super Admin & Admin) */}
        {canAccessStaff && currentTab === 'storefront' && (
          <button
            onClick={() => setCurrentTab('pos')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 border border-slate-700 transition-colors cursor-pointer shrink-0"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Buka Mesin Kasir</span>
          </button>
        )}

        {user && currentTab !== 'storefront' && (
          <button
            onClick={() => setCurrentTab('storefront')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-xs font-bold text-teal-300 border border-teal-500/30 transition-colors cursor-pointer shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Beranda Pelanggan</span>
          </button>
        )}

        {/* Live today revenue pill (Only for Admin & Super Admin) */}
        {user && canViewDashboard && (
          <div className="hidden lg:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs shrink-0">
            <span className="text-slate-400 text-[11px]">Omzet:</span>
            <span className="font-extrabold text-emerald-400 font-mono">
              {formatRupiah(todaySales)}
            </span>
          </div>
        )}

        {/* User Badge / Login button */}
        {user ? (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 py-1 px-2 sm:px-2.5 rounded-xl bg-slate-950 border border-slate-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-500/40 shrink-0"
                />
              ) : (
                <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 ${
                  isSuper ? 'bg-amber-600 text-slate-950' : user.role === 'admin' ? 'bg-teal-600' : 'bg-emerald-600'
                }`}>
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-white line-clamp-1 max-w-[100px]">
                  {user.displayName}
                </div>
                <div className={`text-[9px] font-bold ${
                  isSuper ? 'text-amber-400' : user.role === 'admin' ? 'text-teal-400' : 'text-emerald-400'
                }`}>
                  {isSuper ? '★ Super Admin' : user.role === 'admin' ? 'Admin Toko' : 'Kasir'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-xl border border-slate-700 transition-colors cursor-pointer shrink-0"
            title="Portal Masuk Staf & Admin"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] sm:text-xs">Login Staf</span>
          </button>
        )}
      </div>
    </header>
  );
};
