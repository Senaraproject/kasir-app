"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils/currency";
import { SalesChart } from "@/components/laporan/SalesChart";
import type { Transaction } from "@/lib/types";

type RangePreset = "today" | "7d" | "30d" | "month";

const PRESETS: { key: RangePreset; label: string; days: number | "month" }[] = [
  { key: "today", label: "Hari Ini", days: 0 },
  { key: "7d", label: "7 Hari", days: 6 },
  { key: "30d", label: "30 Hari", days: 29 },
  { key: "month", label: "Bulan Ini", days: "month" },
];

export function LaporanScreen({ initialTransactions }: { initialTransactions: Transaction[] }) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [preset, setPreset] = useState<RangePreset>("30d");
  const [loading, setLoading] = useState(false);

  async function loadRange(p: RangePreset) {
    setPreset(p);
    setLoading(true);
    const supabase = createClient();

    const from = new Date();
    if (p === "month") {
      from.setDate(1);
    } else {
      const cfg = PRESETS.find((x) => x.key === p)!;
      from.setDate(from.getDate() - (cfg.days as number));
    }
    from.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("transactions")
      .select("*, items:transaction_items(*), employee:employees(full_name)")
      .eq("status", "selesai")
      .gte("created_at", from.toISOString())
      .order("created_at", { ascending: false });

    setTransactions(data ?? []);
    setLoading(false);
  }

  const summary = useMemo(() => {
    const totalOmzet = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalTrx = transactions.length;
    const avg = totalTrx > 0 ? totalOmzet / totalTrx : 0;
    return { totalOmzet, totalTrx, avg };
  }, [transactions]);

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      const d = new Date(t.created_at);
      const key = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      map.set(key, (map.get(key) ?? 0) + t.total);
    }
    return Array.from(map.entries())
      .map(([date, total]) => ({ date, total }))
      .reverse();
  }, [transactions]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const t of transactions) {
      for (const item of t.items ?? []) {
        const entry = map.get(item.product_name) ?? { name: item.product_name, qty: 0, revenue: 0 };
        entry.qty += item.qty;
        entry.revenue += item.subtotal;
        map.set(item.product_name, entry);
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Laporan Penjualan</h1>
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => loadRange(p.key)}
              className={clsx(
                "rounded-full px-3 py-1.5 text-sm font-medium",
                preset === p.key ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="mb-4 text-sm text-slate-400">Memuat...</p>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total Omzet</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatRupiah(summary.totalOmzet)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Jumlah Transaksi</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.totalTrx}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Rata-rata / Transaksi</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatRupiah(summary.avg)}</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Omzet Harian</h2>
        {chartData.length > 0 ? (
          <SalesChart data={chartData} />
        ) : (
          <p className="py-10 text-center text-sm text-slate-400">Belum ada data.</p>
        )}
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Produk Terlaris</h2>
        {topProducts.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Belum ada data.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center justify-between py-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
                    {i + 1}
                  </span>
                  {p.name}
                </span>
                <span className="text-slate-500">{p.qty} terjual</span>
                <span className="font-medium">{formatRupiah(p.revenue)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        href="/riwayat"
        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Lihat daftar & detail semua transaksi di Riwayat Transaksi
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
