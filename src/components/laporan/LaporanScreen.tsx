"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils/currency";
import { PAYMENT_LABELS } from "@/lib/printer/receipt";
import { SalesChart } from "@/components/laporan/SalesChart";
import type { Transaction } from "@/lib/types";

type RangePreset = "today" | "yesterday" | "2d" | "7d" | "month" | "custom";

const PRESETS: { key: RangePreset; label: string }[] = [
  { key: "today", label: "Hari Ini" },
  { key: "yesterday", label: "Kemarin" },
  { key: "2d", label: "2 Hari Lalu" },
  { key: "7d", label: "7 Hari" },
  { key: "month", label: "Bulan Ini" },
];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function LaporanScreen({ initialTransactions }: { initialTransactions: Transaction[] }) {
  const now = new Date();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [preset, setPreset] = useState<RangePreset>("today");
  const [loading, setLoading] = useState(false);
  const [customMonth, setCustomMonth] = useState(now.getMonth());
  const [customYear, setCustomYear] = useState(now.getFullYear());

  const YEARS = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  async function loadRange(p: RangePreset) {
    setPreset(p);
    setLoading(true);
    const supabase = createClient();

    const today = new Date();
    let from: Date;
    let to: Date | null = null;

    switch (p) {
      case "yesterday": {
        const d = new Date(today);
        d.setDate(d.getDate() - 1);
        from = startOfDay(d);
        to = endOfDay(d);
        break;
      }
      case "2d": {
        const d = new Date(today);
        d.setDate(d.getDate() - 2);
        from = startOfDay(d);
        to = endOfDay(d);
        break;
      }
      case "7d": {
        const d = new Date(today);
        d.setDate(d.getDate() - 6);
        from = startOfDay(d);
        break;
      }
      case "month":
        from = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
        break;
      default:
        from = startOfDay(today);
    }

    let query = supabase
      .from("transactions")
      .select("*, items:transaction_items(*), employee:employees(full_name), customer:customers(name)")
      .eq("status", "selesai")
      .gte("created_at", from.toISOString());
    if (to) query = query.lte("created_at", to.toISOString());

    const { data } = await query.order("created_at", { ascending: false });

    setTransactions(data ?? []);
    setLoading(false);
  }

  async function loadCustomMonth(monthIdx: number, year: number) {
    setPreset("custom");
    setCustomMonth(monthIdx);
    setCustomYear(year);
    setLoading(true);
    const supabase = createClient();

    const from = new Date(year, monthIdx, 1, 0, 0, 0, 0);
    const to = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);

    const { data } = await supabase
      .from("transactions")
      .select("*, items:transaction_items(*), employee:employees(full_name), customer:customers(name)")
      .eq("status", "selesai")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
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

  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const t of transactions) {
      const entry = map.get(t.payment_method) ?? { count: 0, total: 0 };
      entry.count += 1;
      entry.total += t.total;
      map.set(t.payment_method, entry);
    }
    return Array.from(map.entries())
      .map(([method, v]) => ({ method, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const soldProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const t of transactions) {
      for (const item of t.items ?? []) {
        const entry = map.get(item.product_name) ?? { name: item.product_name, qty: 0, revenue: 0 };
        entry.qty += item.qty;
        entry.revenue += item.subtotal;
        map.set(item.product_name, entry);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [transactions]);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Laporan Penjualan</h1>
        <div className="flex flex-wrap items-center gap-2">
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

          <div
            className={clsx(
              "flex items-center gap-1 rounded-full px-2 py-1",
              preset === "custom" ? "bg-blue-600" : "bg-slate-100"
            )}
          >
            <select
              value={customMonth}
              onChange={(e) => loadCustomMonth(Number(e.target.value), customYear)}
              className={clsx(
                "cursor-pointer rounded-full bg-transparent py-0.5 pl-2 pr-1 text-sm font-medium outline-none",
                preset === "custom" ? "text-white" : "text-slate-600"
              )}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i} value={i} className="text-slate-900">
                  {name}
                </option>
              ))}
            </select>
            <select
              value={customYear}
              onChange={(e) => loadCustomMonth(customMonth, Number(e.target.value))}
              className={clsx(
                "cursor-pointer rounded-full bg-transparent py-0.5 pl-1 pr-2 text-sm font-medium outline-none",
                preset === "custom" ? "text-white" : "text-slate-600"
              )}
            >
              {YEARS.map((y) => (
                <option key={y} value={y} className="text-slate-900">
                  {y}
                </option>
              ))}
            </select>
          </div>
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
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Rincian Metode Pembayaran</h2>
        {paymentBreakdown.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Belum ada data.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {paymentBreakdown.map((p) => (
              <li key={p.method} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium text-slate-700">
                  {PAYMENT_LABELS[p.method] ?? p.method}
                </span>
                <span className="text-slate-500">{p.count} transaksi</span>
                <span className="font-medium">{formatRupiah(p.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Barang Terjual</h2>
        {soldProducts.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Belum ada data.</p>
        ) : (
          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {soldProducts.map((p, i) => (
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
