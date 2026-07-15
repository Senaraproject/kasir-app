"use client";

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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/kasir", label: "Kasir", icon: ShoppingCart, roles: ["owner", "admin", "kasir"] },
  { href: "/riwayat", label: "Riwayat", icon: History, roles: ["owner", "admin", "kasir"] },
  { href: "/produk", label: "Produk", icon: Package, roles: ["owner", "admin"] },
  { href: "/laporan", label: "Laporan", icon: BarChart3, roles: ["owner", "admin"] },
  { href: "/karyawan", label: "Karyawan", icon: Users, roles: ["owner", "admin"] },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings, roles: ["owner", "admin"] },
];

export function Sidebar({ role, fullName }: { role: Role; fullName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
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

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white md:hidden">
        {items.map((item) => {
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
      </nav>
    </>
  );
}
