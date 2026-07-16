import type { StoreSettings, Transaction } from "@/lib/types";
import { buildReceiptBytes, buildKitchenReceiptBytes } from "@/lib/printer/receipt";
import { printViaBluetooth, isBluetoothPrinterConnected } from "@/lib/printer/bluetooth";
import { printViaUsb, isUsbPrinterConnected } from "@/lib/printer/usb";
import { printViaBrowser, printKitchenReceiptViaBrowser } from "@/lib/printer/print-fallback";
import { printViaRawBT } from "@/lib/printer/rawbt";
import type { PrinterMode } from "@/store/printer-store";

async function dispatchBytes(
  mode: PrinterMode,
  columns: 32 | 42 | 48,
  buildBytes: () => Uint8Array,
  fallbackViaBrowser: () => void
): Promise<void> {
  if (mode === "bluetooth") {
    if (!isBluetoothPrinterConnected()) {
      throw new Error("Printer Bluetooth belum terhubung. Sambungkan lagi di halaman Pengaturan.");
    }
    await printViaBluetooth(buildBytes());
    return;
  }

  if (mode === "usb") {
    if (!isUsbPrinterConnected()) {
      throw new Error("Printer USB belum terhubung. Sambungkan lagi di halaman Pengaturan.");
    }
    await printViaUsb(buildBytes());
    return;
  }

  if (mode === "rawbt") {
    printViaRawBT(buildBytes());
    return;
  }

  fallbackViaBrowser();
}

export async function printReceipt(
  mode: PrinterMode,
  columns: 32 | 42 | 48,
  transaction: Transaction,
  store: StoreSettings
): Promise<void> {
  await dispatchBytes(
    mode,
    columns,
    () => buildReceiptBytes(transaction, store, columns),
    () => printViaBrowser(transaction, store)
  );
}

export async function printKitchenReceipt(
  mode: PrinterMode,
  columns: 32 | 42 | 48,
  transaction: Transaction,
  store: StoreSettings
): Promise<void> {
  await dispatchBytes(
    mode,
    columns,
    () => buildKitchenReceiptBytes(transaction, store, columns),
    () => printKitchenReceiptViaBrowser(transaction, store)
  );
}
