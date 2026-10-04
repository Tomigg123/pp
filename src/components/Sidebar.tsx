import React, { useMemo } from 'react';
import { 
  ShoppingCart, 
  LayoutDashboard, 
  Package, 
  Receipt, 
  LogOut, 
  User as UserIcon, 
  Store, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Calendar, 
  Sparkles, 
  ArrowUpRight, 
  X,
  ShoppingBag,
  Users,
  Lock,
  Calculator
} from 'lucide-react';
import { Product, Transaction, UserProfile, isUserSuperAdmin, canAccessStaffArea, ActiveTab } from '../types';
import { formatRupiah } from '../utils/formatters';

interface SidebarProps {
  currentTab: ActiveTab;
  setCurrentTab: (tab: ActiveTab) => void;
  user: UserProfile | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  onOpenAdminManagement: () => void;
  cartCount: number;
  products: Product[];
  transactions: Transaction[];
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean | ((prev: boolean) => boolean)) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onLogout,
  onOpenLogin,
  onOpenAdminManagement,
  cartCount,
  products,
  transactions,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const isSuper = isUserSuperAdmin(user);
  const canAccessStaff = canAccessStaffArea(user);

  // Today's summary metrics for the side dashboard
  const todayMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayTx = transactions.filter((tx) => tx.createdAt.startsWith(todayStr));
    const revenue = todayTx.reduce((sum, tx) => sum + tx.finalAmount, 0);
    const itemsSold = todayTx.reduce(
      (sum, tx) => sum + tx.items.reduce((s, i) => s + i.quantity, 0),
      0
    );
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= (p.minStock || 5)).length;
    const outStock = products.filter((p) => p.stock <= 0).length;

    return {
      revenue,
      txCount: todayTx.length,
      itemsSold,
      lowStock,
      outStock,
    };
  }, [transactions, products]);

  const navItems = [
    {
      id: 'storefront' as const,
      label: 'Beranda Belanja Barang',
      shortLabel: 'Toko',
      icon: ShoppingBag,
      badge: 'Publik',
      badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
    },
    ...(canAccessStaff
      ? [
          {
            id: 'pos' as const,
            label: 'Mesin Kasir (POS)',
            shortLabel: 'Kasir',
            icon: ShoppingCart,
            badge: cartCount > 0 ? `${cartCount} item` : undefined,
            badgeColor: 'bg-emerald-500 text-slate-950 font-bold',
          },
          {
            id: 'dashboard' as const,
            label: 'Dashboard Analitik',
            shortLabel: 'Dashboard',
            icon: LayoutDashboard,
            badge: 'Admin',
            badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
          },
          {
            id: 'audit' as const,
            label: 'Audit & Tutup Kasir',
            shortLabel: 'Audit Kas',
            icon: Calculator,
            badge: 'Admin VIP',
            badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
          },
          {
            id: 'products' as const,
            label: 'Database Produk Barang',
            shortLabel: 'Barang',
            icon: Package,
            badge: products.length > 0 ? `${products.length}` : undefined,
            badgeColor: 'bg-slate-800 text-slate-300',
          },
          {
            id: 'transactions' as const,
            label: 'Riwayat Transaksi Penjualan',
            shortLabel: 'Transaksi',
            icon: Receipt,
            badge: transactions.length > 0 ? `${transactions.length}` : undefined,
            badgeColor: 'bg-slate-800 text-slate-300',
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 text-slate-200 transition-all duration-300 shadow-2xl lg:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Brand Header */}
        <div className={`h-16 border-b border-slate-800 shrink-0 flex items-center ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}>
          {isCollapsed ? (
            /* Collapsed view: Full logo perfectly centered, never cut off! */
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 hover:scale-105 transition-transform cursor-pointer relative group shrink-0"
              title="Klik untuk perluas sidebar"
            >
              <Store className="w-5 h-5 text-slate-950" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-slate-700 text-slate-300 flex items-center justify-center shadow">
                <ChevronRight className="w-2.5 h-2.5" />
              </div>
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 shrink-0">
                  <Store className="w-6 h-6 text-slate-950" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base tracking-tight text-white">KasirKu</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      POS
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">Sistem Kasir & Toko</p>
                </div>
              </div>

              {/* Collapse Button (Desktop) & Close Button (Mobile) */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="hidden lg:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Kecilkan Sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Navigation Menu */}
        <div className="p-3 space-y-1">
          {!isCollapsed && (
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Menu Utama
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 shrink-0 ${
                  isActive 
                    ? 'text-white' 
                    : 'text-slate-400 group-hover:text-emerald-400'
                }`} />
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between text-left truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}

          {/* Super Admin: Manage Admins Button */}
          {isSuper && (
            <button
              onClick={() => {
                onOpenAdminManagement();
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold transition-all group cursor-pointer mt-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 ${
                isCollapsed ? 'justify-center px-2' : ''
              }`}
              title="Kelola Admin & Staf"
            >
              <Users className="w-4 h-4 text-amber-400 shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span>Kelola Admin & Staf</span>
                  <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-black">
                    Kelola
                  </span>
                </div>
              )}
            </button>
          )}
        </div>

        {/* DASHBOARD SAMPING (SIDE DASHBOARD PANEL) */}
        {!isCollapsed ? (
          <div className="flex-1 px-3 py-2 overflow-y-auto space-y-3 border-t border-slate-800/80">
            {!canAccessStaff ? (
              /* CUSTOMER / NON-ADMIN VIEW: Clean, customer-focused store information */
              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                  <ShoppingBag className="w-3.5 h-3.5 text-teal-400" />
                  <span>Katalog Toko Barang</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Silakan pilih barang kebutuhan Anda di Beranda Belanja. Kami menyediakan berbagai barang berkualitas dengan harga terbaik.
                </p>
                <div className="pt-1 text-[10px] text-emerald-400 font-semibold">
                  Tersedia Ambil di Toko & Kirim ke Alamat
                </div>
              </div>
            ) : (
              /* ADMIN & SUPER ADMIN VIEW: Live Sales Dashboard */
              <>
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <LayoutDashboard className="w-3 h-3 text-emerald-400" />
                    <span>Dashboard Hari Ini</span>
                  </span>
                  <button
                    onClick={() => {
                      setCurrentTab('dashboard');
                      setIsMobileOpen(false);
                    }}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 font-semibold"
                  >
                    <span>Lihat Detail</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Omzet Hari Ini */}
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-slate-400">Omzet Penjualan</span>
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-lg font-black text-emerald-400 font-mono">
                    {formatRupiah(todayMetrics.revenue)}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>{todayMetrics.txCount} Transaksi Sukses</span>
                    <span>{todayMetrics.itemsSold} Item Keluar</span>
                  </div>
                </div>

                {/* Alert Stok Menipis */}
                {(todayMetrics.lowStock > 0 || todayMetrics.outStock > 0) ? (
                  <div
                    onClick={() => {
                      setCurrentTab('products');
                      setIsMobileOpen(false);
                    }}
                    className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl cursor-pointer hover:bg-amber-500/15 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Peringatan Stok</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500 text-slate-950 font-black">
                        {todayMetrics.lowStock + todayMetrics.outStock} Item
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                      {todayMetrics.outStock > 0 && <span className="text-rose-400 font-bold">{todayMetrics.outStock} produk habis. </span>}
                      {todayMetrics.lowStock > 0 && <span>{todayMetrics.lowStock} produk menipis (≤5 unit).</span>}
                    </p>
                    <div className="text-[10px] text-amber-400/90 font-semibold mt-1.5 flex items-center gap-1">
                      <span>Klik untuk restock &rarr;</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center gap-2.5 text-xs text-slate-400">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-200">Stok Produk Aman</div>
                      <div className="text-[10px] text-slate-500">Semua persediaan tercukupi</div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Realtime sync badge */}
            <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/40 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Status Koneksi</span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Cloud Realtime
              </span>
            </div>
          </div>
        ) : (
          /* Mini Icons when sidebar collapsed */
          <div className="flex-1 flex flex-col items-center py-4 space-y-3 border-t border-slate-800">
            {canAccessStaff ? (
              <button
                onClick={() => setCurrentTab('dashboard')}
                title={`Omzet Hari Ini: ${formatRupiah(todayMetrics.revenue)}`}
                className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 hover:bg-slate-800 transition-colors"
              >
                <DollarSign className="w-4 h-4" />
              </button>
            ) : (
              <div title="Dashboard Terkunci" className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
            )}
          </div>
        )}

        {/* User Profile & Shift Info at Bottom */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0">
          {user ? (
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between gap-2.5'}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-9 h-9 rounded-full ring-2 ring-emerald-500/40 object-cover shrink-0"
                  />
                ) : (
                  <div className={`w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md ${
                    isSuper 
                      ? 'bg-amber-600 text-slate-950' 
                      : user.role === 'admin'
                      ? 'bg-teal-600'
                      : 'bg-emerald-700'
                  }`}>
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                {!isCollapsed && (
                  <div className="truncate">
                    <div className="text-xs font-bold text-white truncate leading-tight">
                      {user.displayName}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isSuper ? (
                        <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3 text-amber-400" />
                          <span>Super Admin</span>
                        </span>
                      ) : user.role === 'admin' ? (
                        <span className="text-[10px] text-teal-400 font-bold">
                          Admin Toko
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-medium">
                          Kasir Aktif
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <button
                  onClick={onLogout}
                  title="Keluar / Logout"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className={`w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700/80 ${
                isCollapsed ? 'px-2' : ''
              }`}
              title="Portal Masuk Staf & Admin"
            >
              <Lock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              {!isCollapsed && <span>Login Staf / Admin</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
