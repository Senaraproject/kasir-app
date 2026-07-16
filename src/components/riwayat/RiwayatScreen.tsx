"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils/currency";
import { PAYMENT_LABELS } from "@/lib/printer/receipt";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TransactionDetailModal } from "@/components/riwayat/TransactionDetailModal";
import type { Transaction } from "@/lib/types";

function toDateInputValue(d: Date) {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addDays(dateStr: string, delta: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return toDateInputValue(d);
}

function formatDayLabel(dateStr: string) {
  const today = toDateInputValue(new Date());
  const yesterday = addDays(today, -1);
  if (dateStr === today) return "Hari Ini";
  if (dateStr === yesterday) return "Kemarin";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function RiwayatScreen({
  initialTransactions,
  canCancel,
}: {
  initialTransactions: Transaction[];
  canCancel: boolean;
}) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [selectedDay, setSelectedDay] = useState(() => toDateInputValue(new Date()));

  async function loadDay(day: string) {
    setLoading(true);
    const supabase = createClient();

    const fromDate = new Date(day + "T00:00:00");
    const toDate = new Date(day + "T23:59:59");

    const { data } = await supabase
      .from("transactions")
      .select("*, items:transaction_items(*), employee:employees(full_name), customer:customers(name)")
      .gte("created_at", fromDate.toISOString())
      .lte("created_at", toDate.toISOString())
      .order("created_at", { ascending: false });

    setTransactions(data ?? []);
    setLoading(false);
  }

  function changeDay(day: string) {
    setSelectedDay(day);
    loadDay(day);
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
    loadDay(selectedDay);
  }

  const filtered = useMemo(
    () =>
      transactions.filter((t) => t.transaction_number.toLowerCase().includes(search.toLowerCase())),
    [transactions, search]
  );

  const dayTotal = useMemo(
    () => filtered.filter((t) => t.status === "selesai").reduce((sum, t) => sum + t.total, 0),
    [filtered]
  );

  const isToday = selectedDay === toDateInputValue(new Date());

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Riwayat Transaksi</h1>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <button
          onClick={() => changeDay(addDays(selectedDay, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          title="Hari sebelumnya"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex flex-1 items-center justify-center gap-2">
          <CalendarDays size={16} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-800">{formatDayLabel(selectedDay)}</span>
          <Input
            type="date"
            className="h-8 w-auto border-none bg-transparent px-1 text-xs text-slate-400 shadow-none"
            value={selectedDay}
            max={toDateInputValue(new Date())}
            onChange={(e) => changeDay(e.target.value)}
          />
        </div>

        <button
          onClick={() => changeDay(addDays(selectedDay, 1))}
          disabled={isToday}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          title="Hari berikutnya"
        >
          <ChevronRight size={18} />
        </button>

        {!isToday && (
          <Button variant="outline" size="sm" onClick={() => changeDay(toDateInputValue(new Date()))}>
            Hari Ini
          </Button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            className="pl-10"
            placeholder="Cari no. order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-500">
          {filtered.length} transaksi &middot; Total <span className="font-semibold text-slate-800">{formatRupiah(dayTotal)}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">No. Order</th>
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
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
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
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Belum ada transaksi di hari ini.
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
