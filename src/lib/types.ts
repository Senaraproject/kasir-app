export type Role = "owner" | "admin" | "kasir";
export type PaymentMethod = "tunai" | "qris" | "debit" | "kredit" | "ewallet" | "transfer";
export type TransactionStatus = "selesai" | "dibatalkan";

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  created_at: string;
}

export interface Employee {
  id: string;
  branch_id: string | null;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  branch_id: string | null;
  category_id: string | null;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  cost_price: number;
  stock: number;
  low_stock_threshold: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export interface StockMovement {
  id: string;
  product_id: string;
  change: number;
  reason: "penjualan" | "restock" | "penyesuaian" | "pembatalan";
  employee_id: string | null;
  note: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  branch_id: string | null;
  employee_id: string | null;
  transaction_number: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  cash_received: number | null;
  change_amount: number | null;
  status: TransactionStatus;
  created_at: string;
  employee?: Employee | null;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string | null;
  product_name: string;
  price: number;
  qty: number;
  subtotal: number;
}

export interface StoreSettings {
  id: number;
  store_name: string;
  address: string | null;
  phone: string | null;
  receipt_footer: string | null;
  tax_percent: number;
}

// Minimal placeholder so @supabase/ssr generics compile without
// generating the full Supabase CLI type definitions.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
