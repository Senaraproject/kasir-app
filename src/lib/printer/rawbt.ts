/**
 * RawBT adalah aplikasi Android pihak ketiga yang bisa nge-bridge perintah ESC/POS
 * ke printer thermal apa pun yang dia dukung, termasuk printer built-in/proprietary
 * yang gak bisa diakses Web Bluetooth/WebUSB langsung (mis. printer bawaan mesin kasir).
 * https://www.rawbt.ru
 *
 * RawBT nerima data lewat Android intent URL (cuma jalan di Chrome Android).
 */
export function isRawBTLikelySupported(): boolean {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** Kirim perintah ESC/POS ke aplikasi RawBT yang terinstall di HP/tablet Android. */
export function printViaRawBT(data: Uint8Array): void {
  const base64 = bytesToBase64(data);
  const intentUrl = `intent:base64,${base64}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end`;
  window.location.href = intentUrl;
}
