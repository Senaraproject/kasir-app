import type { StoreSettings, Transaction } from "@/lib/types";
import { buildReceiptBytes } from "@/lib/printer/receipt";
import { printViaBluetooth, isBluetoothPrinterConnected } from "@/lib/printer/bluetooth";
import { printViaUsb, isUsbPrinterConnected } from "@/lib/printer/usb";
import { printViaBrowser } from "@/lib/printer/print-fallback";
import type { PrinterMode } from "@/store/printer-store";

export async function printReceipt(
  mode: PrinterMode,
  columns: 32 | 42 | 48,
  transaction: Transaction,
  store: StoreSettings
): Promise<void> {
  if (mode === "bluetooth") {
    if (!isBluetoothPrinterConnected()) {
      throw new Error("Printer Bluetooth belum terhubung. Sambungkan lagi di halaman Pengaturan.");
    }
    const bytes = buildReceiptBytes(transaction, store, columns);
    await printViaBluetooth(bytes);
    return;
  }

  if (mode === "usb") {
    if (!isUsbPrinterConnected()) {
      throw new Error("Printer USB belum terhubung. Sambungkan lagi di halaman Pengaturan.");
    }
    const bytes = buildReceiptBytes(transaction, store, columns);
    await printViaUsb(bytes);
    return;
  }

  printViaBrowser(transaction, store);
}
