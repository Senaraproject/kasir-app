"use client";

import { useEffect } from "react";
import { usePrinterStore } from "@/store/printer-store";
import { isBluetoothPrinterConnected, tryReconnectBluetoothPrinter } from "@/lib/printer/bluetooth";

/** Coba sambungkan ulang printer Bluetooth secara diam-diam tiap aplikasi dibuka,
 * biar kasir gak perlu connect manual tiap kali. Cuma jalan kalau browser dukung
 * Web Bluetooth persistent permissions (getDevices) - kalau enggak, gagal senyap
 * dan kasir tinggal connect manual sekali seperti biasa. */
export function useAutoReconnectPrinter() {
  const mode = usePrinterStore((s) => s.mode);
  const deviceId = usePrinterStore((s) => s.deviceId);
  const setMode = usePrinterStore((s) => s.setMode);

  useEffect(() => {
    if (mode !== "bluetooth" || !deviceId) return;
    if (isBluetoothPrinterConnected()) return;

    tryReconnectBluetoothPrinter(deviceId).then((name) => {
      if (name) setMode("bluetooth", name, deviceId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, deviceId]);
}
