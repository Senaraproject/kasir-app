"use client";

import { Modal } from "@/components/ui/Modal";
import { PrinterSettings } from "@/components/pengaturan/PrinterSettings";

export function PrinterConnectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Sambungkan Printer" size="lg">
      {open && <PrinterSettings />}
    </Modal>
  );
}
