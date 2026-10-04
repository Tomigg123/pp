/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  auth, 
  db, 
  handleFirestoreError, 
  OperationType, 
  loginWithGoogle 
} from './firebase';
import { Product, CartItem, Transaction, UserProfile, StaffAdmin, isUserSuperAdmin, canAccessDashboard, canAccessStaffArea, ActiveTab } from './types';
import { INITIAL_SAMPLE_PRODUCTS } from './data/sampleProducts';
import { generateInvoiceNumber } from './utils/formatters';

import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { PosView } from './components/PosView';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { TransactionsView } from './components/TransactionsView';
import { CustomerStorefrontView } from './components/CustomerStorefrontView';
import { BusinessAuditView } from './components/BusinessAuditView';
import { AdminManagementModal } from './components/AdminManagementModal';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ProductFormModal } from './components/ProductFormModal';
import { LoginModal } from './components/LoginModal';

import { Store, User, Sparkles, CheckCircle2, ShoppingBag, ShieldCheck, ShoppingCart, Lock } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ActiveTab>('storefront');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Database states
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [staffList, setStaffList] = useState<StaffAdmin[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  // Cart state for POS
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isAdminManagementOpen, setIsAdminManagementOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);

  // Checkout discounts & taxes
  const [activeDiscount, setActiveDiscount] = useState<number>(0);
  const [activeTax, setActiveTax] = useState<number>(0);

  // Sidebar layout states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMapsQuotaExceeded, setIsMapsQuotaExceeded] = useState(false);

  // Listen for Google Maps quota exceeded events
  useEffect(() => {
    const handleQuota = () => setIsMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // 1. Listen for Authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const isSuper = firebaseUser.email?.toLowerCase() === 'aroyansabilalmustakim@gmail.com'.toLowerCase();
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || 'kasir@toko.com',
          displayName: firebaseUser.displayName || (isSuper ? 'Super Admin' : 'Kasir Toko'),
          photoURL: firebaseUser.photoURL || undefined,
          role: isSuper ? 'super_admin' : 'kasir',
          createdAt: new Date().toISOString(),
        });
      } else {
        setUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Realtime Firestore synchronization for Products (available publicly for Storefront too)
  useEffect(() => {
    setIsLoadingProducts(true);

    const unsubscribeProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const list: Product[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Product, 'id'>) });
        });
        list.sort((a, b) => a.name.localeCompare(b.name));
        setProducts(list);
        setIsLoadingProducts(false);
      },
      (error) => {
        console.error('Error fetching products:', error);
        setIsLoadingProducts(false);
      }
    );

    return () => unsubscribeProducts();
  }, []);

  // 3. Realtime Firestore synchronization for Transactions & Staff Admins (when authenticated)
  useEffect(() => {
    // CRITICAL: Only attach onSnapshot listeners if auth is ready and user is authenticated in Firebase Auth
    if (!auth.currentUser) {
      if (user && transactions.length === 0) {
        // Initial demo transactions for guest shift mode
        setTransactions([
          {
            id: 'demo_tx_1',
            invoiceNumber: 'INV-20261003-8821',
            cashierId: user.id,
            cashierName: user.displayName,
            cashierEmail: user.email,
            items: [
              { productId: 'mkn-001', name: 'Nasi Goreng Spesial', price: 25000, costPrice: 12000, quantity: 2, subtotal: 50000 },
              { productId: 'mnm-001', name: 'Kopi Susu Gula Aren', price: 18000, costPrice: 8000, quantity: 2, subtotal: 36000 },
            ],
            totalAmount: 86000,
            discountAmount: 0,
            taxAmount: 0,
            finalAmount: 86000,
            paymentMethod: 'cash',
            paymentAmount: 100000,
            changeAmount: 14000,
            status: 'completed',
            orderSource: 'pos',
            createdAt: new Date().toISOString(),
          }
        ]);
      }
      setIsLoadingTransactions(false);
      return;
    }

    setIsLoadingTransactions(true);

    // Transactions listener
    const txQuery = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const unsubscribeTransactions = onSnapshot(
      txQuery,
      (snapshot) => {
        const list: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Transaction, 'id'>) });
        });
        setTransactions(list);
        setIsLoadingTransactions(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'transactions');
        setIsLoadingTransactions(false);
      }
    );

    // Staff / Admins listener
    const unsubscribeAdmins = onSnapshot(
      collection(db, 'admins'),
      (snapshot) => {
        const list: StaffAdmin[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<StaffAdmin, 'id'>) });
        });
        setStaffList(list);

        // Check if current user email is in staffList and update role accordingly
        if (user) {
          const matched = list.find((s) => s.email.toLowerCase() === user.email.toLowerCase());
          if (matched && user.role !== 'super_admin') {
            setUser((prev) => prev ? { ...prev, role: matched.role } : null);
          }
        }
      },
      (error) => {
        console.warn('Admins collection status:', error);
      }
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeAdmins();
    };
  }, [user]);

  // Protect staff tabs (Mesin Kasir sampai bawah): strictly visible and accessible by Super Admin and Admin only
  useEffect(() => {
    if (currentTab !== 'storefront' && !canAccessStaffArea(user)) {
      setCurrentTab('storefront');
    }
  }, [currentTab, user]);

  // Auth actions
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCart([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Seed initial sample products into Firestore
  const handleSeedSampleProducts = async () => {
    try {
      const now = new Date().toISOString();
      for (const item of INITIAL_SAMPLE_PRODUCTS) {
        await addDoc(collection(db, 'products'), {
          ...item,
          createdAt: now,
          updatedAt: now,
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  // Cart operations for POS
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * product.price,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            subtotal: product.price,
          },
        ];
      }
    });
  };

  const handleUpdateCartQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const validQty = Math.min(quantity, item.product.stock);
          return {
            ...item,
            quantity: validQty,
            subtotal: validQty * item.product.price,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Checkout process from POS
  const handleOpenCheckout = (discount: number, tax: number) => {
    setActiveDiscount(discount);
    setActiveTax(tax);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (
    paymentMethod: 'cash' | 'qris' | 'transfer' | 'card',
    paymentAmount: number,
    changeAmount: number
  ) => {
    if (!user) throw new Error('Harap login terlebih dahulu untuk memproses transaksi.');

    const subtotal = cart.reduce((s, item) => s + item.subtotal, 0);
    const finalAmount = Math.max(0, subtotal - activeDiscount + activeTax);
    const invoiceNumber = generateInvoiceNumber();
    const createdAt = new Date().toISOString();

    const txPayload: Omit<Transaction, 'id'> = {
      invoiceNumber,
      cashierId: user.id,
      cashierName: user.displayName,
      cashierEmail: user.email,
      items: cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        costPrice: item.product.costPrice || 0,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
      totalAmount: subtotal,
      discountAmount: activeDiscount,
      taxAmount: activeTax,
      finalAmount,
      paymentMethod,
      paymentAmount,
      changeAmount,
      status: 'completed',
      orderSource: 'pos',
      createdAt,
    };

    try {
      let createdId = `tx_${Date.now()}`;
      if (auth.currentUser) {
        const docRef = await addDoc(collection(db, 'transactions'), txPayload);
        createdId = docRef.id;

        // Deduct stock in Firestore
        for (const cartItem of cart) {
          const targetProd = products.find((p) => p.id === cartItem.product.id);
          if (targetProd) {
            const newStock = Math.max(0, targetProd.stock - cartItem.quantity);
            await updateDoc(doc(db, 'products', targetProd.id), {
              stock: newStock,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } else {
        // Guest mode fallback
        for (const cartItem of cart) {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === cartItem.product.id
                ? { ...p, stock: Math.max(0, p.stock - cartItem.quantity) }
                : p
            )
          );
        }
      }

      const createdTx: Transaction = { id: createdId, ...txPayload };
      setTransactions((prev) => [createdTx, ...prev]);
      setActiveReceipt(createdTx);
      setIsPaymentModalOpen(false);
      setCart([]);
      setIsReceiptModalOpen(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'transactions');
    }
  };

  // Customer self-order from Beranda Pelanggan
  const handleCustomerPlaceOrder = async (orderPayload: {
    items: { productId: string; name: string; price: number; costPrice: number; quantity: number; subtotal: number; notes?: string }[];
    totalAmount: number;
    finalAmount: number;
    paymentMethod: 'cash' | 'qris' | 'transfer';
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerTable: string;
    orderType: 'pickup' | 'delivery' | 'dine_in' | 'take_away';
    deliveryCoordinates?: { lat: number; lng: number };
  }) => {
    const invoiceNumber = generateInvoiceNumber();
    const createdAt = new Date().toISOString();

    const txPayload: Omit<Transaction, 'id'> = {
      invoiceNumber,
      cashierId: 'customer_self_order',
      cashierName: orderPayload.customerName,
      cashierEmail: orderPayload.customerEmail,
      items: orderPayload.items,
      totalAmount: orderPayload.totalAmount,
      discountAmount: 0,
      taxAmount: 0,
      finalAmount: orderPayload.finalAmount,
      paymentMethod: orderPayload.paymentMethod,
      paymentAmount: orderPayload.finalAmount,
      changeAmount: 0,
      status: 'completed',
      orderSource: 'customer_web',
      orderType: orderPayload.orderType,
      customerName: orderPayload.customerName,
      customerEmail: orderPayload.customerEmail,
      customerPhone: orderPayload.customerPhone,
      customerTable: orderPayload.customerTable,
      deliveryCoordinates: orderPayload.deliveryCoordinates,
      createdAt,
    };

    let createdId = `order_${Date.now()}`;
    try {
      const docRef = await addDoc(collection(db, 'transactions'), txPayload);
      createdId = docRef.id;
    } catch (err) {
      console.warn('Customer order fallback:', err);
    }

    // Deduct stock in Firestore or locally
    for (const item of orderPayload.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        const newStock = Math.max(0, prod.stock - item.quantity);
        if (auth.currentUser) {
          try {
            await updateDoc(doc(db, 'products', prod.id), {
              stock: newStock,
              updatedAt: new Date().toISOString(),
            });
          } catch {
            // local update
          }
        }
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, stock: newStock } : p))
        );
      }
    }

    const created: Transaction = { id: createdId, ...txPayload };
    setTransactions((prev) => [created, ...prev]);
    return created;
  };

  // Product CRUD
  const handleSaveProduct = async (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const now = new Date().toISOString();
    // Clean any undefined fields before sending to Firestore
    const cleanedPayload: Record<string, any> = {};
    Object.entries(productData).forEach(([k, v]) => {
      if (v !== undefined) {
        cleanedPayload[k] = v;
      }
    });

    try {
      if (auth.currentUser) {
        if (productToEdit) {
          await updateDoc(doc(db, 'products', productToEdit.id), {
            ...cleanedPayload,
            updatedAt: now,
          });
        } else {
          await addDoc(collection(db, 'products'), {
            ...cleanedPayload,
            createdAt: now,
            updatedAt: now,
          });
        }
      } else {
        if (productToEdit) {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === productToEdit.id
                ? { ...p, ...productData, updatedAt: now }
                : p
            )
          );
        } else {
          const newProd: Product = {
            id: `prd_${Date.now()}`,
            ...productData,
            createdAt: now,
            updatedAt: now,
          };
          setProducts((prev) => [newProd, ...prev]);
        }
      }
    } catch (err) {
      handleFirestoreError(
        err,
        productToEdit ? OperationType.UPDATE : OperationType.CREATE,
        'products'
      );
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      if (auth.currentUser) {
        await deleteDoc(doc(db, 'products', productId));
      }
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      handleRemoveFromCart(productId);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'products');
    }
  };

  const handleAdjustStock = async (productId: string, newStock: number) => {
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'products', productId), {
          stock: newStock,
          updatedAt: new Date().toISOString(),
        });
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'products');
    }
  };

  // Admin & Staff CRUD
  const handleAddStaff = async (staffData: Omit<StaffAdmin, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'admins'), {
      ...staffData,
      createdAt: new Date().toISOString(),
    });
  };

  const handleDeleteStaff = async (staffId: string) => {
    await deleteDoc(doc(db, 'admins', staffId));
  };

  const handleSwitchUserRole = (role: 'super_admin' | 'admin' | 'kasir') => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  const subtotalCart = cart.reduce((s, i) => s + i.subtotal, 0);
  const totalPayable = Math.max(0, subtotalCart - activeDiscount + activeTax);

  // Today's summary metrics for header and sidebar
  const todayMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayTx = transactions.filter((tx) => tx.createdAt.startsWith(todayStr));
    return {
      sales: todayTx.reduce((s, tx) => s + tx.finalAmount, 0),
      txCount: todayTx.length,
    };
  }, [transactions]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased selection:bg-emerald-500 selection:text-slate-950 w-full max-w-full overflow-x-hidden relative">
      {/* Sidebar with Navigation and Live Side Dashboard */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenAdminManagement={() => setIsAdminManagementOpen(true)}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        products={products}
        transactions={transactions}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div
        className={`flex-1 flex flex-col min-w-0 w-full max-w-full overflow-x-hidden transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {isMapsQuotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}

        <TopHeader
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
          user={user}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
          todaySales={todayMetrics.sales}
          todayTxCount={todayMetrics.txCount}
        />

        {/* Main View Router */}
        <main className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
          {/* Customer Storefront Tab: Open to everyone without login barrier */}
          {currentTab === 'storefront' ? (
            <CustomerStorefrontView
              products={products}
              onPlaceOrder={handleCustomerPlaceOrder}
              onSwitchToStaff={() => setCurrentTab('pos')}
            />
          ) : isAuthLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
              <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-slate-400">Menghubungkan ke KasirKu POS...</p>
            </div>
          ) : (
            /* Views (Mesin Kasir, Dashboard, Produk, Transaksi) rendered directly without popups */
            <>
              {currentTab === 'pos' && (
                <PosView
                  products={products}
                  cart={cart}
                  currentUser={user}
                  onAddToCart={handleAddToCart}
                  onUpdateCartQty={handleUpdateCartQty}
                  onRemoveFromCart={handleRemoveFromCart}
                  onClearCart={handleClearCart}
                  onOpenCheckout={handleOpenCheckout}
                  onSeedSampleProducts={handleSeedSampleProducts}
                  onOpenAddProduct={() => {
                    setProductToEdit(null);
                    setIsProductModalOpen(true);
                  }}
                  isLoadingProducts={isLoadingProducts}
                />
              )}

              {currentTab === 'dashboard' && (
                <DashboardView
                  products={products}
                  transactions={transactions}
                  currentUser={user}
                  onOpenReceipt={(tx) => {
                    setActiveReceipt(tx);
                    setIsReceiptModalOpen(true);
                  }}
                  onNavigateToProducts={() => setCurrentTab('products')}
                  onNavigateToPos={() => setCurrentTab('pos')}
                />
              )}

              {currentTab === 'audit' && (
                <BusinessAuditView
                  products={products}
                  transactions={transactions}
                  currentUser={user}
                  onNavigateToPos={() => setCurrentTab('pos')}
                />
              )}

              {currentTab === 'products' && (
                <ProductsView
                  products={products}
                  currentUser={user}
                  onOpenAddModal={() => {
                    setProductToEdit(null);
                    setIsProductModalOpen(true);
                  }}
                  onOpenEditModal={(prod) => {
                    setProductToEdit(prod);
                    setIsProductModalOpen(true);
                  }}
                  onDeleteProduct={handleDeleteProduct}
                  onAdjustStock={handleAdjustStock}
                  onSeedSampleProducts={handleSeedSampleProducts}
                  isLoading={isLoadingProducts}
                />
              )}

              {currentTab === 'transactions' && (
                <TransactionsView
                  transactions={transactions}
                  onOpenReceipt={(tx) => {
                    setActiveReceipt(tx);
                    setIsReceiptModalOpen(true);
                  }}
                  isLoading={isLoadingTransactions}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Login Dialog for Registered Staff & Super Admin Only */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          setCurrentTab('pos');
        }}
        staffList={staffList}
        onBackToStorefront={() => setCurrentTab('storefront')}
      />

      {/* Admin / Staff Management Dialog (Super Admin) */}
      <AdminManagementModal
        isOpen={isAdminManagementOpen}
        onClose={() => setIsAdminManagementOpen(false)}
        staffList={staffList}
        onAddStaff={handleAddStaff}
        onDeleteStaff={handleDeleteStaff}
        currentUser={user}
        onSwitchUserRole={handleSwitchUserRole}
      />

      {/* Payment / Checkout Dialog */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={totalPayable}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Printable Receipt Dialog */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transaction={activeReceipt}
        onNewTransaction={() => {
          setCurrentTab('pos');
        }}
      />

      {/* Product Add / Edit Dialog */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        onSubmit={handleSaveProduct}
        productToEdit={productToEdit}
        currentUser={user}
      />
    </div>
  );
}
