/** Nomor order 17 digit acak (13 digit timestamp + 4 digit acak) - gak ada makna khusus, cuma buat tracking unik. */
export function generateTransactionNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(1000 + Math.random() * 9000).toString();
  return (timestamp + random).slice(0, 17);
}
