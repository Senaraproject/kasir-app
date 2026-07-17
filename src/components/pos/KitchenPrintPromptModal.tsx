"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChefHat, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { printKitchenReceipt } from "@/lib/printer/print";
import type { PrinterMode } from "@/store/printer-store";
import type { StoreSettings, Transaction } from "@/lib/types";

interface Props {
  transaction: Transaction | null;
  storeSettings: StoreSettings | null;
  printerMode: PrinterMode;
  printerColumns: 32 | 42 | 48;
  onClose: () => void;
}

export function KitchenPrintPromptModal({
  transaction,
  storeSettings,
  printerMode,
  printerColumns,
  onClose,
}: Props) {
  const [printing, setPrinting] = useState(false);

  async function handlePrintKitchen() {
    if (!transaction || !storeSettings) return;
    setPrinting(true);
    try {
      await printKitchenReceipt(printerMode, printerColumns, transaction, storeSettings);
      toast.success("Struk dapur tercetak");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mencetak struk dapur");
    } finally {
      setPrinting(false);
    }
  }

  return (
    <Modal open={!!transaction} onClose={onClose} title="Transaksi Berhasil" size="sm">
      {transaction && (
        <div className="space-y-4 text-center">
          <div className="flex flex-col items-center gap-2 py-2">
            <CheckCircle2 size={40} className="text-green-500" />
            <p className="text-sm text-slate-600">
              Struk pelanggan sudah tercetak. Cetak struk dapur juga?
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handlePrintKitchen} disabled={printing}>
              <ChefHat size={16} /> {printing ? "Mencetak..." : "Cetak Struk Dapur"}
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
