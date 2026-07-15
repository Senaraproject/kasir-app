"use client";

import { useState } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import { Bluetooth, Usb, Printer, Wifi } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select, Label } from "@/components/ui/Input";
import { usePrinterStore, type PrinterMode } from "@/store/printer-store";
import { connectBluetoothPrinter, disconnectBluetoothPrinter, isBluetoothSupported } from "@/lib/printer/bluetooth";
import { connectUsbPrinter, disconnectUsbPrinter, isUsbSupported } from "@/lib/printer/usb";
import { printReceipt } from "@/lib/printer/print";
import type { StoreSettings, Transaction } from "@/lib/types";

const MODES: { key: PrinterMode; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: "browser", label: "Print via Browser", icon: Printer },
  { key: "bluetooth", label: "Thermal Bluetooth", icon: Bluetooth },
  { key: "usb", label: "Thermal USB", icon: Usb },
];

function buildDummyTransaction(): Transaction {
  return {
    id: "dummy",
    branch_id: null,
    employee_id: null,
    transaction_number: "TRX-TEST-0001",
    subtotal: 25000,
    discount: 0,
    tax: 0,
    total: 25000,
    payment_method: "tunai",
    cash_received: 30000,
    change_amount: 5000,
    status: "selesai",
    created_at: new Date().toISOString(),
    items: [
      { id: "1", transaction_id: "dummy", product_id: null, product_name: "Contoh Produk", price: 25000, qty: 1, subtotal: 25000 },
    ],
  };
}

export function PrinterSettings({ storeSettings }: { storeSettings: StoreSettings }) {
  const printer = usePrinterStore();
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);

  async function handleSelectMode(mode: PrinterMode) {
    if (mode === "browser") {
      printer.setMode("browser");
      return;
    }

    if (mode === "bluetooth") {
      if (!isBluetoothSupported()) {
        toast.error("Web Bluetooth tidak didukung di browser ini. Gunakan Chrome di Android/Desktop.");
        return;
      }
      setConnecting(true);
      try {
        const name = await connectBluetoothPrinter();
        printer.setMode("bluetooth", name);
        toast.success(`Terhubung ke ${name}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal terhubung ke printer.");
      } finally {
        setConnecting(false);
      }
      return;
    }

    if (mode === "usb") {
      if (!isUsbSupported()) {
        toast.error("WebUSB tidak didukung di browser ini. Gunakan Chrome/Edge.");
        return;
      }
      setConnecting(true);
      try {
        const name = await connectUsbPrinter();
        printer.setMode("usb", name);
        toast.success(`Terhubung ke ${name}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal terhubung ke printer.");
      } finally {
        setConnecting(false);
      }
    }
  }

  function handleDisconnect() {
    if (printer.mode === "bluetooth") disconnectBluetoothPrinter();
    if (printer.mode === "usb") disconnectUsbPrinter();
    printer.setMode("browser");
  }

  async function handleTestPrint() {
    setTesting(true);
    try {
      await printReceipt(printer.mode, printer.columns, buildDummyTransaction(), storeSettings);
      toast.success("Perintah cetak terkirim");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mencetak");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Wifi size={16} /> Pengaturan Printer Struk
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Printer thermal 58mm/80mm bisa disambungkan langsung via Bluetooth atau USB dari Chrome.
        Jika tidak, gunakan mode Browser untuk cetak ke printer apa pun (atau simpan sebagai PDF).
      </p>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => handleSelectMode(m.key)}
            disabled={connecting}
            className={clsx(
              "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium",
              printer.mode === m.key
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <m.icon size={20} />
            {m.label}
          </button>
        ))}
      </div>

      {printer.mode !== "browser" && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-600">
            {printer.deviceName ? `Terhubung: ${printer.deviceName}` : "Belum terhubung"}
          </span>
          <button onClick={handleDisconnect} className="text-red-600 hover:underline">
            Putuskan
          </button>
        </div>
      )}

      <div className="mb-4">
        <Label>Lebar Kertas (kolom karakter)</Label>
        <Select
          value={printer.columns}
          onChange={(e) => printer.setColumns(Number(e.target.value) as 32 | 42 | 48)}
        >
          <option value={32}>58mm (32 kolom)</option>
          <option value={42}>80mm (42 kolom)</option>
          <option value={48}>80mm - font kecil (48 kolom)</option>
        </Select>
      </div>

      <Button variant="secondary" onClick={handleTestPrint} disabled={testing}>
        {testing ? "Mencetak..." : "Cetak Struk Percobaan"}
      </Button>
    </div>
  );
}
