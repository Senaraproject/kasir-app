let cachedDevice: USBDevice | null = null;
let cachedEndpointNumber = 0;
let cachedInterfaceNumber = 0;

export function isUsbSupported(): boolean {
  return typeof navigator !== "undefined" && "usb" in navigator;
}

/** Minta user memilih printer USB (butuh interaksi/klik user, hanya jalan di Chrome/Edge Desktop & Android). */
export async function connectUsbPrinter(): Promise<string> {
  const usb = navigator.usb;
  if (!usb) {
    throw new Error("WebUSB tidak didukung di browser ini. Gunakan Chrome/Edge.");
  }

  const device = await usb.requestDevice({ filters: [] });
  await device.open();

  if (device.configuration === null) {
    await device.selectConfiguration(1);
  }

  const iface = device.configuration!.interfaces.find((i) =>
    i.alternates.some((a) => a.interfaceClass === 7) // 7 = Printer class
  ) ?? device.configuration!.interfaces[0];

  await device.claimInterface(iface.interfaceNumber);

  const alternate = iface.alternates[0];
  const outEndpoint = alternate.endpoints.find((e) => e.direction === "out");
  if (!outEndpoint) throw new Error("Printer tidak memiliki endpoint OUT.");

  cachedDevice = device;
  cachedInterfaceNumber = iface.interfaceNumber;
  cachedEndpointNumber = outEndpoint.endpointNumber;

  return device.productName ?? "Printer USB";
}

export function isUsbPrinterConnected(): boolean {
  return !!cachedDevice?.opened;
}

export async function disconnectUsbPrinter() {
  if (cachedDevice) {
    try {
      await cachedDevice.releaseInterface(cachedInterfaceNumber);
      await cachedDevice.close();
    } catch {
      // device may already be disconnected physically
    }
  }
  cachedDevice = null;
}

export async function printViaUsb(data: Uint8Array): Promise<void> {
  if (!cachedDevice) {
    throw new Error("Printer USB belum terhubung.");
  }
  await cachedDevice.transferOut(cachedEndpointNumber, data);
}
