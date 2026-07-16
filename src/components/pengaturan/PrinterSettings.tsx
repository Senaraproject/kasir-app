"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import clsx from "clsx";
import { Bluetooth, Usb, Printer, Wifi, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select, Label } from "@/components/ui/Input";
import { usePrinterStore, type PrinterMode } from "@/store/printer-store";
import { connectBluetoothPrinter, disconnectBluetoothPrinter, isBluetoothSupported } from "@/lib/printer/bluetooth";
import { connectUsbPrinter, disconnectUsbPrinter, isUsbSupported } from "@/lib/printer/usb";
import { printReceipt, printKitchenReceipt } from "@/lib/printer/print";
import { createClient } from "@/lib/supabase/client";
import type { StoreSettings, Transaction } from "@/lib/types";

const MODES: { key: PrinterMode; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: "browser", label: "Print via Browser", icon: Printer },
  { key: "bluetooth", label: "Thermal Bluetooth", icon: Bluetooth },
  { key: "usb", label: "Thermal USB", icon: Usb },
  { key: "rawbt", label: "RawBT (Android)", icon: Smartphone },
];

function buildDummyTransaction(): Transaction {
  return {
    id: "dummy",
    branch_id: null,
    employee_id: null,
    customer_id: null,
    transaction_number: "TRX-TEST-0001",
    subtotal: 25000,
    discount: 0,
    tax: 0,
    total: 25000,
    payment_method: "tunai",
    cash_received: 30000,
    change_amount: 5000,
    note: null,
    status: "selesai",
    created_at: new Date().toISOString(),
    employee: { full_name: "Contoh Kasir" } as Transaction["employee"],
    items: [
      { id: "1", transaction_id: "dummy", product_id: null, product_name: "Contoh Produk", price: 25000, qty: 1, subtotal: 25000 },
    ],
  };
}

/** Panel koneksi printer - dipakai di halaman Pengaturan (dengan storeSettings dari server)
 * maupun di modal cepat yang bisa diakses semua peran (fetch storeSettings sendiri). */
export function PrinterSettings({ storeSettings: initialStoreSettings }: { storeSettings?: StoreSettings }) {
  const printer = usePrinterStore();
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingKitchen, setTestingKitchen] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(initialStoreSettings ?? null);

  useEffect(() => {
    if (initialStoreSettings) return;
    const supabase = createClient();
    supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) setStoreSettings(data);
      });
  }, [initialStoreSettings]);

  async function handleSelectMode(mode: PrinterMode) {
    if (mode === "browser" || mode === "rawbt") {
      printer.setMode(mode);
      return;
    }

    if (mode === "bluetooth") {
      await handleConnectBluetooth(false);
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

  async function handleConnectBluetooth(showAll: boolean) {
    if (!isBluetoothSupported()) {
      toast.error("Web Bluetooth tidak didukung di browser ini. Gunakan Chrome di Android/Desktop.");
      return;
    }
    setConnecting(true);
    try {
      const name = await connectBluetoothPrinter(showAll);
      printer.setMode("bluetooth", name);
      toast.success(`Terhubung ke ${name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal terhubung ke printer.");
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    if (printer.mode === "bluetooth") disconnectBluetoothPrinter();
    if (printer.mode === "usb") disconnectUsbPrinter();
    printer.setMode("browser");
  }

  async function handleTestPrint() {
    if (!storeSettings) return;
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

  async function handleTestKitchenPrint() {
    if (!storeSettings) return;
    setTestingKitchen(true);
    try {
      await printKitchenReceipt(printer.mode, printer.columns, buildDummyTransaction(), storeSettings);
      toast.success("Perintah cetak struk dapur terkirim");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mencetak");
    } finally {
      setTestingKitchen(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Wifi size={16} /> Printer Struk
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        Printer thermal ada di device masing-masing kasir, jadi sambungkan langsung dari device yang
        dipakai. Pilih <strong>Thermal Bluetooth</strong> kalau printernya BLE biasa. Kalau printer
        built-in/bawaan mesin kasir (gak muncul di pencarian Bluetooth/USB), pakai{" "}
        <strong>RawBT (Android)</strong> — install app RawBT dulu, hasil cetaknya jauh lebih rapi
        & cepat dibanding mode Print via Browser biasa.
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

      {(printer.mode === "bluetooth" || printer.mode === "usb") && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-600">
            {printer.deviceName ? `Terhubung: ${printer.deviceName}` : "Belum terhubung"}
          </span>
          <button onClick={handleDisconnect} className="text-red-600 hover:underline">
            Putuskan
          </button>
        </div>
      )}

      {printer.mode === "rawbt" && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
          Pastikan aplikasi <strong>RawBT Print Service</strong> sudah di-install & printer sudah
          dipilih di pengaturan RawBT (mis. driver &quot;Inner Printer&quot; buat printer built-in).
          Setiap cetak struk, RawBT bakal otomatis kebuka sebentar buat proses print.
        </div>
      )}

      {printer.mode === "bluetooth" && !printer.deviceName && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          <p className="mb-2">
            Printer gak muncul di daftar? Coba cari tanpa filter (nampilin semua perangkat
            Bluetooth di sekitar, gak cuma yang cocok pola printer umum).
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={connecting}
            onClick={() => handleConnectBluetooth(true)}
          >
            Cari Semua Perangkat
          </Button>
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

      <label className="mb-4 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={printer.printKitchen}
          onChange={(e) => printer.setPrintKitchen(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        Otomatis cetak Struk Dapur juga setiap transaksi
      </label>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={handleTestPrint} disabled={testing || !storeSettings}>
          {testing ? "Mencetak..." : "Cetak Struk Percobaan"}
        </Button>
        <Button
          variant="outline"
          onClick={handleTestKitchenPrint}
          disabled={testingKitchen || !storeSettings}
        >
          {testingKitchen ? "Mencetak..." : "Cetak Struk Dapur Percobaan"}
        </Button>
      </div>
    </div>
  );
}
