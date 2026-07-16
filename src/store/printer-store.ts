import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PrinterMode = "none" | "bluetooth" | "usb" | "browser" | "rawbt";

interface PrinterState {
  mode: PrinterMode;
  deviceName: string | null;
  columns: 32 | 42 | 48;
  printKitchen: boolean;
  setMode: (mode: PrinterMode, deviceName?: string | null) => void;
  setColumns: (columns: 32 | 42 | 48) => void;
  setPrintKitchen: (value: boolean) => void;
}

export const usePrinterStore = create<PrinterState>()(
  persist(
    (set) => ({
      mode: "browser",
      deviceName: null,
      columns: 32,
      printKitchen: false,
      setMode: (mode, deviceName = null) => set({ mode, deviceName }),
      setColumns: (columns) => set({ columns }),
      setPrintKitchen: (value) => set({ printKitchen: value }),
    }),
    { name: "kasir-printer-settings" }
  )
);
