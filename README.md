# Kasir App

Aplikasi kasir (POS) berbasis web untuk toko - bisa dipakai di Android, tablet, maupun desktop lewat browser, dan bisa di-install seperti aplikasi (PWA). Fitur: transaksi & cetak struk (thermal Bluetooth/USB atau print browser), manajemen produk & stok, data & login karyawan dengan peran (owner/admin/kasir), laporan penjualan, serta pengaturan toko.

Dibangun dengan Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (database, auth, dan API).

## 1. Siapkan Database (Supabase)

1. Buat akun gratis di [supabase.com](https://supabase.com) dan buat **New Project**.
2. Setelah project siap, buka menu **SQL Editor**, buat query baru, lalu copy-paste seluruh isi file [`supabase/schema.sql`](supabase/schema.sql) dari folder ini dan jalankan (Run). Ini akan membuat semua tabel, trigger, dan aturan keamanan (RLS) yang dibutuhkan.
3. Buka menu **Project Settings > API**. Catat 3 nilai berikut:
   - `Project URL`
   - `anon public` key
   - `service_role` key (klik "Reveal" - **jaga kerahasiaan key ini**, jangan pernah dipakai di kode frontend/browser)

## 2. Konfigurasi Environment

Copy file `.env.local.example` menjadi `.env.local`, lalu isi dengan nilai dari langkah sebelumnya:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=isi-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=isi-service-role-key
```

## 3. Buat Akun Owner Pertama

Aplikasi ini tidak punya halaman "sign up" publik (memang disengaja, supaya kasir tidak bisa didaftarkan sembarang orang). Akun pertama (owner) dibuat manual sekali saja lewat Supabase:

1. Di dashboard Supabase, buka **Authentication > Users > Add user > Create new user**. Isi email & password, lalu centang **Auto Confirm User**.
2. Copy `User UID` yang baru dibuat.
3. Buka **SQL Editor**, jalankan query berikut (ganti nilai sesuai data Anda):

```sql
insert into employees (id, full_name, email, role)
values ('paste-user-uid-di-sini', 'Nama Anda', 'email@anda.com', 'owner');
```

Setelah ini, Anda bisa login ke aplikasi sebagai owner dan menambah karyawan lain langsung dari halaman **Karyawan** di aplikasi (tidak perlu lewat Supabase lagi).

## 4. Jalankan Aplikasi

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000), lalu login dengan akun owner yang dibuat di langkah 3.

## 5. Install di HP Android (PWA)

1. Deploy aplikasi ini ke hosting (lihat bagian Deploy) atau akses lewat jaringan lokal yang sama.
2. Buka alamat aplikasi di **Chrome Android**.
3. Tap menu (titik tiga) > **Add to Home screen / Install app**.
4. Aplikasi akan muncul sebagai ikon di HP seperti aplikasi native.

## 6. Menyambungkan Printer Struk

Buka halaman **Pengaturan** di aplikasi:

- **Thermal Bluetooth**: klik tombol, pilih printer Anda dari daftar (hanya didukung Chrome di Android/Desktop). Setelah tersambung, cetak struk otomatis lewat Bluetooth.
- **Thermal USB**: sama seperti Bluetooth tapi via kabel USB (Chrome/Edge Desktop, atau Android dengan kabel OTG).
- **Print via Browser**: bila printer Anda belum didukung/belum ada printer thermal, struk akan dicetak lewat dialog print bawaan browser (bisa ke printer apa saja, atau disimpan sebagai PDF).

Printer thermal yang umum dijual di Indonesia (58mm/80mm, Bluetooth/USB, chipset generik) biasanya langsung terdeteksi. Jika printer Bluetooth Anda tidak muncul di daftar perangkat, kemungkinan printer memakai profil Bluetooth Classic (SPP) yang tidak didukung Web Bluetooth - gunakan mode **Print via Browser** sebagai gantinya, atau hubungkan lewat USB.

## Deploy ke Produksi

Cara termudah adalah deploy ke [Vercel](https://vercel.com) (gratis untuk skala kecil):

1. Push folder ini ke repository GitHub.
2. Import project di Vercel, lalu isi environment variables yang sama seperti di `.env.local`.
3. Deploy. Aplikasi bisa langsung diakses dari domain yang diberikan Vercel dan di-install di Android lewat Chrome.

## Struktur Peran Karyawan

| Peran | Akses |
|---|---|
| **Owner** | Semua fitur, termasuk kelola karyawan & pengaturan toko |
| **Admin** | Sama seperti owner |
| **Kasir** | Halaman Kasir & Produk (lihat/transaksi), tanpa akses Karyawan/Laporan/Pengaturan |

Untuk multi-cabang di masa depan, tabel `branches` sudah disiapkan di skema database - tinggal tambah baris cabang baru dan hubungkan karyawan/produk ke `branch_id` masing-masing.
