import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PrinterMode = "none" | "bluetooth" | "usb" | "browser" | "rawbt";

interface PrinterState {
  mode: PrinterMode;
  deviceName: string | null;
  deviceId: string | null;
  columns: 32 | 42 | 48;
  setMode: (mode: PrinterMode, deviceName?: string | null, deviceId?: string | null) => void;
  setColumns: (columns: 32 | 42 | 48) => void;
}

export const usePrinterStore = create<PrinterState>()(
  persist(
    (set) => ({
      mode: "browser",
      deviceName: null,
      deviceId: null,
      columns: 32,
      setMode: (mode, deviceName = null, deviceId = null) => set({ mode, deviceName, deviceId }),
      setColumns: (columns) => set({ columns }),
    }),
    { name: "kasir-printer-settings" }
  )
);
