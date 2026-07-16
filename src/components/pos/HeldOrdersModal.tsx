"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, ShoppingBag } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { formatRupiah } from "@/lib/utils/currency";
import { createClient } from "@/lib/supabase/client";
import type { HeldOrder } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onResume: (order: HeldOrder) => void;
}

export function HeldOrdersModal({ open, onClose, onResume }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Pesanan Tersimpan">
      {open && <HeldOrdersList onResume={onResume} />}
    </Modal>
  );
}

function orderTotal(order: HeldOrder) {
  const subtotal = order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return Math.max(0, subtotal - order.discount);
}

function HeldOrdersList({ onResume }: { onResume: (order: HeldOrder) => void }) {
  const [orders, setOrders] = useState<HeldOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("held_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders(data ?? []);
        setLoading(false);
      });
  }, []);

  async function handleDelete(order: HeldOrder) {
    const supabase = createClient();
    const { error } = await supabase.from("held_orders").delete().eq("id", order.id);
    if (error) {
      toast.error("Gagal menghapus pesanan tersimpan.");
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
  }

  if (loading) return <p className="py-6 text-center text-sm text-slate-400">Memuat...</p>;
  if (orders.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">Belum ada pesanan tersimpan.</p>;
  }

  return (
    <ul className="space-y-2">
      {orders.map((order) => (
        <li
          key={order.id}
          className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
        >
          <button onClick={() => onResume(order)} className="flex-1 text-left">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <ShoppingBag size={14} />
              {order.label || `${order.items.length} item`}
            </p>
            <p className="text-xs text-slate-400">
              {new Date(order.created_at).toLocaleString("id-ID", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              &middot; {formatRupiah(orderTotal(order))}
            </p>
          </button>
          <button
            onClick={() => handleDelete(order)}
            className="ml-2 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </li>
      ))}
    </ul>
  );
}
