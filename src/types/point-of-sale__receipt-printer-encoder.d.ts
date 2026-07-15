// Paket ini tidak menyertakan tipe TypeScript bawaan, jadi kita deklarasikan
// secara minimal sesuai API yang benar-benar dipakai di aplikasi ini.
declare module "@point-of-sale/receipt-printer-encoder" {
  export interface ReceiptPrinterEncoderOptions {
    language?: "esc-pos" | "star-prnt" | "star-line";
    columns?: 32 | 35 | 42 | 44 | 48;
    width?: number;
    imageMode?: string;
  }

  export interface TableColumn {
    width: number;
    marginRight?: number;
    align?: "left" | "right" | "center";
  }

  export interface RuleOptions {
    style?: "single" | "double" | "dashed";
    width?: number;
  }

  export default class ReceiptPrinterEncoder {
    constructor(options?: ReceiptPrinterEncoderOptions);
    initialize(): this;
    codepage(codepage: string): this;
    text(value: string): this;
    line(value: string): this;
    newline(): this;
    bold(enabled?: boolean): this;
    italic(enabled?: boolean): this;
    underline(enabled?: boolean): this;
    invert(enabled?: boolean): this;
    size(size: "normal" | "small" | number): this;
    font(font: string): this;
    height(height: number): this;
    width(width: number): this;
    align(alignment: "left" | "center" | "right"): this;
    rule(options?: RuleOptions): this;
    box(options: Record<string, unknown>, content: string): this;
    table(columns: TableColumn[], rows: (string | number)[][]): this;
    barcode(value: string, symbology: string, height?: number): this;
    qrcode(value: string, model?: number, size?: number, errorLevel?: string): this;
    pdf417(value: string, options?: Record<string, unknown>): this;
    image(image: unknown, width: number, height: number, algorithm?: string): this;
    pulse(device?: number, on?: number, off?: number): this;
    raw(data: number[] | Uint8Array): this;
    cut(mode?: "full" | "partial"): this;
    encode(): Uint8Array;
  }
}
