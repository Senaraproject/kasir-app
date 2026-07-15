// Kebanyakan printer thermal Bluetooth (BLE) murah memakai salah satu dari
// beberapa service UUID "serial-like" ini untuk menerima perintah ESC/POS.
const KNOWN_PRINTER_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb", // umum di printer thermal China (58/80mm)
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // ISSC / banyak modul BLE serial
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // beberapa printer POS
];

let cachedDevice: BluetoothDevice | null = null;
let cachedCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

export function isBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

async function findWritableCharacteristic(
  server: BluetoothRemoteGATTServer
): Promise<BluetoothRemoteGATTCharacteristic> {
  const services = await server.getPrimaryServices();
  for (const service of services) {
    const characteristics = await service.getCharacteristics();
    const writable = characteristics.find(
      (c) => c.properties.write || c.properties.writeWithoutResponse
    );
    if (writable) return writable;
  }
  throw new Error("Tidak menemukan characteristic yang bisa ditulis pada printer ini.");
}

/**
 * Minta user memilih printer Bluetooth (butuh interaksi/klik user, hanya jalan di Chrome Android/Desktop).
 * `showAll=true` menampilkan semua perangkat BLE di sekitar (gak difilter service UUID),
 * berguna kalau printer gak muncul di pencarian normal karena UUID-nya gak dikenali.
 */
export async function connectBluetoothPrinter(showAll = false): Promise<string> {
  const bluetooth = navigator.bluetooth;
  if (!bluetooth) {
    throw new Error(
      "Web Bluetooth tidak didukung di browser ini. Gunakan Chrome di Android atau Desktop."
    );
  }

  const device = await bluetooth.requestDevice(
    showAll
      ? { acceptAllDevices: true, optionalServices: KNOWN_PRINTER_SERVICES }
      : {
          filters: KNOWN_PRINTER_SERVICES.map((s) => ({ services: [s] })),
          optionalServices: KNOWN_PRINTER_SERVICES,
        }
  );

  const server = await device.gatt?.connect();
  if (!server) throw new Error("Gagal terhubung ke printer.");

  const characteristic = await findWritableCharacteristic(server);

  cachedDevice = device;
  cachedCharacteristic = characteristic;

  return device.name ?? "Printer Bluetooth";
}

export function disconnectBluetoothPrinter() {
  cachedDevice?.gatt?.disconnect();
  cachedDevice = null;
  cachedCharacteristic = null;
}

export function isBluetoothPrinterConnected(): boolean {
  return !!cachedDevice?.gatt?.connected && !!cachedCharacteristic;
}

/** Kirim data ESC/POS ke printer yang sudah terhubung, dipecah per-chunk karena batas MTU BLE. */
export async function printViaBluetooth(data: Uint8Array): Promise<void> {
  if (!cachedCharacteristic) {
    throw new Error("Printer Bluetooth belum terhubung.");
  }
  const CHUNK_SIZE = 180;
  for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
    const chunk = data.slice(offset, offset + CHUNK_SIZE);
    if (cachedCharacteristic.properties.writeWithoutResponse) {
      await cachedCharacteristic.writeValueWithoutResponse(chunk);
    } else {
      await cachedCharacteristic.writeValueWithResponse(chunk);
    }
  }
}
