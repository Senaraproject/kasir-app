"use client";

import { useState } from "react";
import clsx from "clsx";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { formatRupiah } from "@/lib/utils/currency";
import type { PaymentMethod } from "@/lib/types";
import { PAYMENT_LABELS } from "@/lib/printer/receipt";

const METHODS: PaymentMethod[] = ["tunai", "qris", "debit", "kredit", "ewallet", "transfer"];
const QUICK_AMOUNTS = [0, 5000, 10000, 20000, 50000, 100000];

interface Props {
  open: boolean;
  onClose: () => void;
  total: number;
  submitting: boolean;
  onConfirm: (payment: { method: PaymentMethod; cashReceived: number | null }) => void;
}

export function PaymentModal({ open, onClose, total, submitting, onConfirm }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Pembayaran">
      {open && (
        <PaymentForm total={total} submitting={submitting} onConfirm={onConfirm} />
      )}
    </Modal>
  );
}

function PaymentForm({
  total,
  submitting,
  onConfirm,
}: {
  total: number;
  submitting: boolean;
  onConfirm: (payment: { method: PaymentMethod; cashReceived: number | null }) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("tunai");
  const [cashReceived, setCashReceived] = useState<number>(total);

  const change = method === "tunai" ? Math.max(0, cashReceived - total) : 0;
  const insufficientCash = method === "tunai" && cashReceived < total;

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-slate-50 p-4 text-center">
        <p className="text-sm text-slate-500">Total Tagihan</p>
        <p className="text-2xl font-bold text-slate-900">{formatRupiah(total)}</p>
      </div>

      <div>
        <Label>Metode Pembayaran</Label>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={clsx(
                "rounded-lg border px-3 py-2 text-sm font-medium",
                method === m
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {PAYMENT_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {method === "tunai" && (
        <div className="space-y-2">
          <Label>Uang Diterima</Label>
          <Input
            type="number"
            min={0}
            value={cashReceived || ""}
            onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
          />
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setCashReceived(amt === 0 ? total : cashReceived + amt)}
                className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
              >
                {amt === 0 ? "Uang Pas" : `+${formatRupiah(amt)}`}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm">
            <span className="text-green-700">Kembalian</span>
            <span className="font-semibold text-green-700">{formatRupiah(change)}</span>
          </div>
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        disabled={submitting || insufficientCash}
        onClick={() =>
          onConfirm({
            method,
            cashReceived: method === "tunai" ? cashReceived : null,
          })
        }
      >
        {submitting ? "Memproses..." : "Konfirmasi & Cetak Struk"}
      </Button>
    </div>
  );
}
