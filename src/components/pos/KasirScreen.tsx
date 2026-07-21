"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Minus, Trash2, ShoppingCart, User, X, PackageOpen, ShoppingBag } from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart-store";
import { usePrinterStore } from "@/store/printer-store";
import { formatRupiah } from "@/lib/utils/currency";
import { generateTransactionNumber } from "@/lib/utils/transaction-number";
import { printReceipt } from "@/lib/printer/print";
import type { Category, Customer, Employee, HeldOrder, ItemType, Product, StoreSettings, Transaction } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { CustomerPickerModal } from "@/components/pos/CustomerPickerModal";
import { HeldOrdersModal } from "@/components/pos/HeldOrdersModal";
import { KitchenPrintPromptModal } from "@/components/pos/KitchenPrintPromptModal";

const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  default: "Menu Utama",
  addon: "Add On",
  paket: "Paket",
};

interface Props {
  initialProducts: Product[];
  categories: Category[];
  storeSettings: StoreSettings | null;
  employee: Employee;
}

export function KasirScreen({ initialProducts, categories, storeSettings, employee }: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ItemType | "all">("all");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cartOpenMobile, setCartOpenMobile] = useState(false);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [heldOrdersOpen, setHeldOrdersOpen] = useState(false);
  const [holding, setHolding] = useState(false);
  const [kitchenPromptTransaction, setKitchenPromptTransaction] = useState<Transaction | null>(null);
  const [heldOrdersCount, setHeldOrdersCount] = useState(0);

  const cart = useCartStore();
  const printer = usePrinterStore();

  async function refreshHeldOrdersCount() {
    const supabase = createClient();
    const { count } = await supabase.from("held_orders").select("id", { count: "exact", head: true });
    setHeldOrdersCount(count ?? 0);
  }

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("held_orders")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setHeldOrdersCount(count ?? 0));
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode ?? "").includes(search) ||
        (p.sku ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryId === "all" || p.category_id === categoryId;
      const matchType = typeFilter === "all" || p.item_type === typeFilter;
      return matchSearch && matchCategory && matchType;
    });
  }, [products, search, categoryId, typeFilter]);

  async function refreshProducts() {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("is_active", true)
      .order("name");
    if (data) setProducts(data as Product[]);
  }

  async function handleHoldOrder() {
    if (cart.items.length === 0) return;
    setHolding(true);
    const supabase = createClient();
    const { error } = await supabase.from("held_orders").insert({
      branch_id: employee.branch_id,
      employee_id: employee.id,
      label: cart.items[0]?.name ? `${cart.items[0].name} dkk` : null,
      items: cart.items,
      discount: cart.discountAmount(),
    });
    setHolding(false);

    if (error) {
      toast.error("Gagal menyimpan pesanan: " + error.message);
      return;
    }

    toast.success("Pesanan disimpan");
    cart.clear();
    setSelectedCustomer(null);
    setCartOpenMobile(false);
    refreshHeldOrdersCount();
  }

  async function handleResumeOrder(order: HeldOrder) {
    cart.loadItems(order.items, order.discount);
    setHeldOrdersOpen(false);

    const supabase = createClient();
    await supabase.from("held_orders").delete().eq("id", order.id);
    refreshHeldOrdersCount();
  }

  async function handleConfirmPayment(payment: {
    method: Transaction["payment_method"];
    cashReceived: number | null;
    note: string | null;
  }) {
    if (cart.items.length === 0) return;
    setSubmitting(true);

    try {
      const supabase = createClient();
      const subtotal = cart.subtotal();
      const total = cart.total();
      const changeAmount =
        payment.method === "tunai" && payment.cashReceived != null
          ? Math.max(0, payment.cashReceived - total)
          : null;

      const { data: transaction, error: trxError } = await supabase
        .from("transactions")
        .insert({
          transaction_number: generateTransactionNumber(),
          employee_id: employee.id,
          branch_id: employee.branch_id,
          customer_id: selectedCustomer?.id ?? null,
          subtotal,
          discount: cart.discountAmount(),
          tax: 0,
          total,
          payment_method: payment.method,
          cash_received: payment.cashReceived,
          change_amount: changeAmount,
          note: payment.note,
        })
        .select()
        .single();

      if (trxError || !transaction) {
        throw new Error(trxError?.message ?? "Gagal membuat transaksi");
      }

      const items = cart.items.map((item) => ({
        transaction_id: transaction.id,
        product_id: item.productId,
        product_name: item.name,
        price: item.price,
        qty: item.qty,
        subtotal: item.price * item.qty,
      }));

      const { error: itemsError } = await supabase.from("transaction_items").insert(items);
      if (itemsError) throw new Error(itemsError.message);

      if (storeSettings) {
        const transactionWithEmployee = {
          ...transaction,
          items,
          employee: { full_name: employee.full_name } as Transaction["employee"],
        } as Transaction;

        try {
          await printReceipt(printer.mode, printer.columns, transactionWithEmployee, storeSettings);
          toast.success("Transaksi berhasil! Struk tercetak.");
        } catch (printErr) {
          toast.error(
            "Transaksi tersimpan, tapi cetak struk gagal: " +
              (printErr instanceof Error ? printErr.message : String(printErr))
          );
        }

        setKitchenPromptTransaction(transactionWithEmployee);
      } else {
        toast.success("Transaksi berhasil!");
      }

      cart.clear();
      setSelectedCustomer(null);
      setPaymentOpen(false);
      setCartOpenMobile(false);
      await refreshProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-screen flex-col md:flex-row">
      {/* Produk */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-slate-200 bg-white p-4">
          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                className="pl-10"
                placeholder="Cari produk, SKU, atau scan barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <button
              onClick={() => setHeldOrdersOpen(true)}
              className="relative flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <PackageOpen size={16} />
              <span className="hidden sm:inline">Pesanan Tersimpan</span>
              {heldOrdersCount > 0 && (
                <span className="ml-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-semibold text-white">
                  {heldOrdersCount}
                </span>
              )}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCategoryId("all")}
              className={clsx(
                "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium",
                categoryId === "all" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
              )}
            >
              Semua
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={clsx(
                  "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium",
                  categoryId === c.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setTypeFilter("all")}
              className={clsx(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
                typeFilter === "all"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 text-slate-500"
              )}
            >
              Semua Tipe
            </button>
            {(Object.keys(ITEM_TYPE_LABELS) as ItemType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={clsx(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
                  typeFilter === t
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-500"
                )}
              >
                {ITEM_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => cart.addItem(product)}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition-all hover:border-blue-200 hover:shadow-md active:scale-95"
              >
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className="line-clamp-1 flex-1 text-sm font-medium text-slate-900">
                    {product.name}
                  </span>
                  {product.item_type !== "default" && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                      {ITEM_TYPE_LABELS[product.item_type]}
                    </span>
                  )}
                </div>
                <span className="mt-auto text-sm font-semibold text-blue-600">
                  {formatRupiah(product.price)}
                </span>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-slate-400">
                Produk tidak ditemukan.
              </p>
            )}
          </div>
        </div>

        <div className="hidden shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 py-2 text-xs text-slate-400 md:flex">
          <span>Total {filteredProducts.length} produk</span>
        </div>
      </div>

      {/* Cart mobile trigger */}
      {cart.items.length > 0 && (
        <button
          onClick={() => setCartOpenMobile(true)}
          className="fixed inset-x-4 bottom-20 z-30 flex items-center justify-between rounded-xl bg-blue-600 px-4 py-3 text-white shadow-lg md:hidden"
        >
          <span className="flex items-center gap-2 font-medium">
            <ShoppingCart size={18} />
            {cart.items.reduce((n, i) => n + i.qty, 0)} item
          </span>
          <span className="font-semibold">{formatRupiah(cart.total())}</span>
        </button>
      )}

      {/* Cart panel */}
      <div
        className={clsx(
          "w-full shrink-0 flex-col border-l border-slate-200 bg-white md:flex md:w-96",
          cartOpenMobile
            ? "fixed inset-0 z-40 flex"
            : "hidden"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900">Keranjang</h2>
          <div className="flex items-center gap-2">
            {cart.items.length > 0 && (
              <>
                <button
                  onClick={handleHoldOrder}
                  disabled={holding}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {holding ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  onClick={() => cart.clear()}
                  className="text-sm text-red-600 hover:underline"
                >
                  Kosongkan
                </button>
              </>
            )}
            <button onClick={() => setCartOpenMobile(false)} className="md:hidden text-slate-500">
              Tutup
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <ShoppingBag size={28} className="text-blue-300" />
              </div>
              <p className="text-sm font-medium text-slate-600">Keranjang masih kosong</p>
              <p className="mt-0.5 text-xs text-slate-400">Tambah produk untuk memulai transaksi</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{formatRupiah(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => cart.decrementItem(item.productId)}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                    <button
                      onClick={() => cart.incrementItem(item.productId)}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={() => cart.removeItem(item.productId)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-slate-200 p-4 space-y-3">
          <button
            onClick={() => setCustomerPickerOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            <span className="flex items-center gap-2 text-slate-600">
              <User size={15} />
              {selectedCustomer ? selectedCustomer.name : "Pilih Member (opsional)"}
            </span>
            {selectedCustomer && (
              <X
                size={15}
                className="text-slate-400 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCustomer(null);
                }}
              />
            )}
          </button>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium">{formatRupiah(cart.subtotal())}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-slate-500">Diskon</span>
            <div className="flex overflow-hidden rounded-lg border border-slate-300">
              <Input
                type="number"
                min={0}
                className="h-8 w-20 rounded-none border-none text-right shadow-none focus:ring-0"
                value={cart.discount || ""}
                onChange={(e) => cart.setDiscount(Number(e.target.value) || 0)}
                placeholder="0"
              />
              <button
                type="button"
                onClick={() => cart.setDiscountType(cart.discountType === "amount" ? "percent" : "amount")}
                className="shrink-0 border-l border-slate-300 bg-slate-50 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                {cart.discountType === "percent" ? "%" : "Rp"}
              </button>
            </div>
          </div>
          {cart.discountType === "percent" && cart.discount > 0 && (
            <div className="flex items-center justify-end text-xs text-slate-400">
              -{formatRupiah(cart.discountAmount())}
            </div>
          )}
          <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-3 text-base font-semibold">
            <span>Total</span>
            <span className="text-blue-600">{formatRupiah(cart.total())}</span>
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={cart.items.length === 0}
            onClick={() => setPaymentOpen(true)}
          >
            Bayar
          </Button>
        </div>
      </div>

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={cart.total()}
        submitting={submitting}
        onConfirm={handleConfirmPayment}
      />

      <CustomerPickerModal
        open={customerPickerOpen}
        onClose={() => setCustomerPickerOpen(false)}
        onSelect={setSelectedCustomer}
      />

      <HeldOrdersModal
        open={heldOrdersOpen}
        onClose={() => {
          setHeldOrdersOpen(false);
          refreshHeldOrdersCount();
        }}
        onResume={handleResumeOrder}
      />

      <KitchenPrintPromptModal
        transaction={kitchenPromptTransaction}
        storeSettings={storeSettings}
        printerMode={printer.mode}
        printerColumns={printer.columns}
        onClose={() => setKitchenPromptTransaction(null)}
      />
    </div>
  );
}
