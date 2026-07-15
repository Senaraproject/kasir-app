"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils/currency";
import { PAYMENT_LABELS } from "@/lib/printer/receipt";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { TransactionDetailModal } from "@/components/riwayat/TransactionDetailModal";
import type { Transaction } from "@/lib/types";

type RangePreset = "today" | "7d" | "30d" | "custom";

const PRESETS: { key: RangePreset; label: string }[] = [
  { key: "today", label: "Hari Ini" },
  { key: "7d", label: "7 Hari" },
  { key: "30d", label: "30 Hari" },
];

function toDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function RiwayatScreen({
  initialTransactions,
  canCancel,
}: {
  initialTransactions: Transaction[];
  canCancel: boolean;
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [preset, setPreset] = useState<RangePreset>("7d");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);

  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const [dateFrom, setDateFrom] = useState(toDateInputValue(weekAgo));
  const [dateTo, setDateTo] = useState(toDateInputValue(today));

  async function loadRange(from: string, to: string) {
    setLoading(true);
    const supabase = createClient();

    const fromDate = new Date(from + "T00:00:00");
    const toDate = new Date(to + "T23:59:59");

    const { data } = await supabase
      .from("transactions")
      .select("*, items:transaction_items(*), employee:employees(full_name)")
      .gte("created_at", fromDate.toISOString())
      .lte("created_at", toDate.toISOString())
      .order("created_at", { ascending: false });

    setTransactions(data ?? []);
    setLoading(false);
  }

  function handlePreset(p: RangePreset) {
    setPreset(p);
    const to = new Date();
    const from = new Date();
    if (p === "today") {
      // from = to = today
    } else if (p === "7d") {
      from.setDate(from.getDate() - 6);
    } else if (p === "30d") {
      from.setDate(from.getDate() - 29);
    }
    const fromStr = toDateInputValue(from);
    const toStr = toDateInputValue(to);
    setDateFrom(fromStr);
    setDateTo(toStr);
    loadRange(fromStr, toStr);
  }

  function handleCustomDateChange(from: string, to: string) {
    setPreset("custom");
    setDateFrom(from);
    setDateTo(to);
    loadRange(from, to);
  }

  async function handleCancel(trx: Transaction) {
    if (!confirm(`Batalkan transaksi ${trx.transaction_number}?`)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("transactions")
      .update({ status: "dibatalkan" })
      .eq("id", trx.id);

    if (error) {
      toast.error("Gagal membatalkan: " + error.message);
      return;
    }
    toast.success("Transaksi dibatalkan");
    loadRange(dateFrom, dateTo);
  }

  const filtered = useMemo(
    () =>
      transactions.filter((t) => t.transaction_number.toLowerCase().includes(search.toLowerCase())),
    [transactions, search]
  );

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Riwayat Transaksi</h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => handlePreset(p.key)}
            className={clsx(
              "rounded-full px-3 py-1.5 text-sm font-medium",
              preset === p.key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
            )}
          >
            {p.label}
          </button>
        ))}

        <div className="flex items-center gap-2 pl-2">
          <Input
            type="date"
            className="h-9 w-auto"
            value={dateFrom}
            max={dateTo}
            onChange={(e) => handleCustomDateChange(e.target.value, dateTo)}
          />
          <span className="text-sm text-slate-400">s/d</span>
          <Input
            type="date"
            className="h-9 w-auto"
            value={dateTo}
            min={dateFrom}
            max={toDateInputValue(today)}
            onChange={(e) => handleCustomDateChange(dateFrom, e.target.value)}
          />
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <Input
          className="max-w-sm pl-10"
          placeholder="Cari no. order..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">No. Order</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Jam</th>
              <th className="px-4 py-3">Metode</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3"></th>
              {canCancel && <th className="px-4 py-3 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Memuat...
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((t) => {
                const date = new Date(t.created_at);
                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-900">
                      {t.transaction_number}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="blue">{PAYMENT_LABELS[t.payment_method] ?? t.payment_method}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatRupiah(t.total)}</td>
                    <td className="px-4 py-3">
                      {t.status === "dibatalkan" && <Badge tone="red">Dibatalkan</Badge>}
                    </td>
                    {canCancel && (
                      <td className="px-4 py-3 text-right">
                        {t.status === "selesai" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancel(t);
                            }}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Batalkan
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  Belum ada transaksi pada rentang ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TransactionDetailModal transaction={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
