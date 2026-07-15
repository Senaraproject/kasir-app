"use client";

import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah } from "@/lib/utils/currency";
import { PAYMENT_LABELS } from "@/lib/printer/receipt";
import type { Transaction } from "@/lib/types";

export function TransactionDetailModal({
  transaction,
  onClose,
}: {
  transaction: Transaction | null;
  onClose: () => void;
}) {
  if (!transaction) return null;

  const date = new Date(transaction.created_at);

  return (
    <Modal open={!!transaction} onClose={onClose} title="Detail Transaksi" size="sm">
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">No. Order</span>
            <span className="font-mono font-medium">{transaction.transaction_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tanggal</span>
            <span>
              {date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Jam</span>
            <span>{date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          {transaction.employee?.full_name && (
            <div className="flex justify-between">
              <span className="text-slate-500">Kasir</span>
              <span>{transaction.employee.full_name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Status</span>
            <Badge tone={transaction.status === "selesai" ? "green" : "red"}>
              {transaction.status === "selesai" ? "Selesai" : "Dibatalkan"}
            </Badge>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase text-slate-400">Item</p>
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
            {(transaction.items ?? []).map((item) => (
              <li key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{item.product_name}</p>
                  <p className="text-xs text-slate-400">
                    {item.qty} x {formatRupiah(item.price)}
                  </p>
                </div>
                <span className="font-medium">{formatRupiah(item.subtotal)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-1 border-t border-dashed border-slate-200 pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span>{formatRupiah(transaction.subtotal)}</span>
          </div>
          {transaction.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">Diskon</span>
              <span>-{formatRupiah(transaction.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span className="text-blue-600">{formatRupiah(transaction.total)}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-500">Metode Bayar</span>
            <Badge tone="blue">{PAYMENT_LABELS[transaction.payment_method] ?? transaction.payment_method}</Badge>
          </div>
          {transaction.payment_method === "tunai" && transaction.cash_received != null && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-500">Uang Diterima</span>
                <span>{formatRupiah(transaction.cash_received)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kembalian</span>
                <span>{formatRupiah(transaction.change_amount ?? 0)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
