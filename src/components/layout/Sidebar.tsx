"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Store,
  History,
  Printer,
  Contact,
  MoreHorizontal,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";
import { PrinterConnectModal } from "@/components/layout/PrinterConnectModal";
import { useAutoReconnectPrinter } from "@/hooks/useAutoReconnectPrinter";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/kasir", label: "Kasir", icon: ShoppingCart, roles: ["owner", "admin", "kasir"] },
  { href: "/riwayat", label: "Riwayat", icon: History, roles: ["owner", "admin", "kasir"] },
  { href: "/member", label: "Member", icon: Contact, roles: ["owner", "admin", "kasir"] },
  { href: "/produk", label: "Produk", icon: Package, roles: ["owner", "admin"] },
  { href: "/laporan", label: "Laporan", icon: BarChart3, roles: ["owner", "admin"] },
  { href: "/karyawan", label: "Karyawan", icon: Users, roles: ["owner", "admin"] },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings, roles: ["owner", "admin"] },
];

// Berapa item yang tampil langsung di bottom nav mobile, sisanya masuk "Lainnya".
const MOBILE_PRIMARY_COUNT = 3;

export function Sidebar({ role, fullName }: { role: Role; fullName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [printerModalOpen, setPrinterModalOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  useAutoReconnectPrinter();

  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const mobilePrimary = items.slice(0, MOBILE_PRIMARY_COUNT);
  const mobileMore = items.slice(MOBILE_PRIMARY_COUNT);
  const isMoreActive = mobileMore.some((item) => pathname.startsWith(item.href));

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Store size={18} />
          </div>
          <span className="font-semibold text-slate-900">Kasir App</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setPrinterModalOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <Printer size={18} />
            Sambungkan Printer
          </button>
        </nav>

        <div className="border-t border-slate-100 px-3 py-4">
          <div className="mb-2 px-3 text-xs text-slate-500">
            <p className="truncate font-medium text-slate-700">{fullName}</p>
            <p className="capitalize">{role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Bottom nav mobile - dibatasi biar gak penuh sesak */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white md:hidden">
        {mobilePrimary.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                active ? "text-blue-600" : "text-slate-500"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className={clsx(
            "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
            isMoreActive ? "text-blue-600" : "text-slate-500"
          )}
        >
          <MoreHorizontal size={20} />
          Lainnya
        </button>
      </nav>

      {/* Bottom sheet "Lainnya" - mobile */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
          <div className="relative w-full rounded-t-2xl bg-white p-4 pb-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Menu Lainnya</p>
              <button onClick={() => setMoreOpen(false)} className="text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {mobileMore.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={clsx(
                    "flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium",
                    pathname.startsWith(item.href) ? "text-blue-600" : "text-slate-600"
                  )}
                >
                  <item.icon size={22} />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  setMoreOpen(false);
                  setPrinterModalOpen(true);
                }}
                className="flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium text-slate-600"
              >
                <Printer size={22} />
                Printer
              </button>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="truncate px-1 text-xs font-medium text-slate-700">{fullName}</p>
              <p className="px-1 text-xs capitalize text-slate-400">{role}</p>
              <button
                onClick={handleLogout}
                className="mt-2 flex w-full items-center gap-2 rounded-lg px-1 py-2 text-sm font-medium text-red-600"
              >
                <LogOut size={18} />
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      <PrinterConnectModal open={printerModalOpen} onClose={() => setPrinterModalOpen(false)} />
    </>
  );
}
