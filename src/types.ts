export type ActiveTab = 'storefront' | 'pos' | 'dashboard' | 'products' | 'transactions' | 'audit';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  costPrice: number;
  price: number;
  stock: number;
  unit: string;
  minStock?: number;
  imageUrl?: string;
  lastUpdatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export interface TransactionItem {
  productId: string;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  cashierId: string;
  cashierName: string;
  cashierEmail: string;
  items: TransactionItem[];
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  paymentMethod: 'cash' | 'qris' | 'transfer' | 'card';
  paymentAmount: number;
  changeAmount: number;
  status: 'completed' | 'cancelled' | 'pending';
  orderSource?: 'pos' | 'customer_web';
  orderType?: 'pickup' | 'delivery' | 'dine_in' | 'take_away';
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerTable?: string;
  deliveryCoordinates?: { lat: number; lng: number };
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'super_admin' | 'admin' | 'kasir' | 'pelanggan';
  createdAt: string;
}

export interface StaffAdmin {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'kasir';
  assignedBy?: string;
  createdAt: string;
}

export function isUserSuperAdmin(user: UserProfile | null): boolean {
  if (!user) return false;
  return (
    user.email.toLowerCase().trim() === 'aroyansabilalmustakim@gmail.com'.toLowerCase().trim() ||
    user.role === 'super_admin'
  );
}

export function canAccessStaffArea(user: UserProfile | null): boolean {
  if (!user) return false;
  return isUserSuperAdmin(user) || user.role === 'admin';
}

export function canAccessDashboard(user: UserProfile | null): boolean {
  return canAccessStaffArea(user);
}

export function canManageProducts(user: UserProfile | null): boolean {
  return canAccessStaffArea(user);
}
