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

/** "Hari ini" versi WIB, dipecah jadi bagian-bagian buat nentuin kapan laporan
 * mingguan/bulanan harus jalan (Senin = laporan minggu lalu, tanggal 1 = laporan bulan lalu). */
export function getStoreTodayParts(): { dateStr: string; weekday: number; day: number } {
  const dateStr = getDateStringInTimezone(new Date(), STORE_TIMEZONE);
  // Diproses sebagai tanggal kalender polos (bukan konversi zona waktu lagi) - aman dari isu DST/offset.
  const asUtc = new Date(`${dateStr}T00:00:00Z`);
  return { dateStr, weekday: asUtc.getUTCDay(), day: asUtc.getUTCDate() };
}

/** Rentang UTC buat "minggu lalu" (Senin s.d Minggu) versi kalender WIB. */
export function getStoreLastWeekRangeUtc(): { from: Date; to: Date } {
  const { dateStr } = getStoreTodayParts();
  const today = new Date(`${dateStr}T00:00:00Z`);
  const daysSinceMonday = (today.getUTCDay() + 6) % 7; // Senin=0, Selasa=1, ... Minggu=6

  const mondayThisWeek = new Date(today);
  mondayThisWeek.setUTCDate(mondayThisWeek.getUTCDate() - daysSinceMonday);

  const mondayLastWeek = new Date(mondayThisWeek);
  mondayLastWeek.setUTCDate(mondayLastWeek.getUTCDate() - 7);
  const sundayLastWeek = new Date(mondayThisWeek);
  sundayLastWeek.setUTCDate(sundayLastWeek.getUTCDate() - 1);

  const fromStr = mondayLastWeek.toISOString().slice(0, 10);
  const toStr = sundayLastWeek.toISOString().slice(0, 10);

  return {
    from: new Date(`${fromStr}T00:00:00+07:00`),
    to: new Date(`${toStr}T23:59:59+07:00`),
  };
}

/** Rentang UTC buat "bulan lalu" (tanggal 1 s.d akhir bulan) versi kalender WIB. */
export function getStoreLastMonthRangeUtc(): { from: Date; to: Date; monthIndex: number; year: number } {
  const { dateStr } = getStoreTodayParts();
  const [y, m] = dateStr.split("-").map(Number); // m = bulan berjalan, 1-indexed

  const lastMonthDate = new Date(Date.UTC(y, m - 2, 1)); // m-1 = bulan berjalan (0-indexed), -1 lagi = bulan lalu
  const lastMonthYear = lastMonthDate.getUTCFullYear();
  const lastMonthIdx = lastMonthDate.getUTCMonth();

  const firstDayStr = `${lastMonthYear}-${String(lastMonthIdx + 1).padStart(2, "0")}-01`;
  const lastDayOfMonth = new Date(Date.UTC(lastMonthYear, lastMonthIdx + 1, 0)).getUTCDate();
  const lastDayStr = `${lastMonthYear}-${String(lastMonthIdx + 1).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;

  return {
    from: new Date(`${firstDayStr}T00:00:00+07:00`),
    to: new Date(`${lastDayStr}T23:59:59+07:00`),
    monthIndex: lastMonthIdx,
    year: lastMonthYear,
  };
}
