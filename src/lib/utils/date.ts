/** Toko ini beroperasi di WIB (Asia/Jakarta). Server (Vercel) jalan di UTC,
 * jadi "hari ini" gak boleh dihitung pakai zona waktu server - harus eksplisit WIB,
 * biar transaksi jam-jam awal (00:00-06:59 WIB) gak ke-anggap "kemarin".
 */
const STORE_TIMEZONE = "Asia/Jakarta";

function getDateStringInTimezone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Rentang UTC (from-to) yang merepresentasikan "hari ini" di WIB. */
export function getStoreTodayRangeUtc(): { from: Date; to: Date } {
  const dateStr = getDateStringInTimezone(new Date(), STORE_TIMEZONE);
  return {
    from: new Date(`${dateStr}T00:00:00+07:00`),
    to: new Date(`${dateStr}T23:59:59+07:00`),
  };
}
