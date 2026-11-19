# Papan Proyek — SF Group

Papan proyek Kanban internal untuk mengelola tugas antar divisi: mulai dari
backlog, dikerjakan, sampai selesai. Dibuat dengan Next.js, Tailwind CSS, dan
dnd-kit.

## Inovasi (pembeda dari Kanban biasa)

1. **Fokus Hari Ini — skor prioritas otomatis.** Setiap tugas aktif diberi skor
   0–100 dari kombinasi prioritas, kedekatan tenggat, status kolom, dan lama
   menunggu. Tiga tugas teratas ditampilkan lengkap dengan alasan skornya,
   jadi tidak perlu menebak mana yang harus dikerjakan dulu.
2. **Generator Ringkasan Standup.** Satu klik mengubah isi papan menjadi teks
   laporan harian (selesai / dikerjakan / perlu perhatian / berikutnya) yang
   siap disalin ke WhatsApp atau Teams.
3. **Beban Tim.** Visualisasi jumlah tugas aktif per anggota dengan status
   Ringan / Seimbang / Padat, penanda tugas urgent, dan peringatan ketika ada
   anggota yang kelebihan beban.
4. **Command Palette (Ctrl + K).** Cari tugas dan jalankan perintah (tambah
   tugas, buka standup, ganti tema, ganti tampilan) tanpa menyentuh mouse.
5. **Tampilan Timeline 14 hari.** Papan bisa diganti menjadi jadwal per
   anggota: siapa sibuk di tanggal berapa, tugas terlambat di kolom khusus, dan
   klik sel kosong untuk langsung membuat tugas pada tanggal & orang tersebut.
6. **Tampilan Matriks Prioritas.** Kuadran Penting × Mendesak (Eisenhower):
   Kerjakan Sekarang / Jadwalkan / Delegasikan / Nanti Saja — bukan daftar
   kolom, jadi keputusan prioritas langsung terlihat.
7. **Mode Fokus (Pomodoro 25 menit).** Layar penuh berisi satu tugas dengan
   timer, cincin progres, tombol tandai selesai (otomatis pindah ke kolom
   Selesai) dan lewati ke tugas berikutnya menurut skor prioritas.
8. **Saran pemerataan beban otomatis.** Tombol **Seimbangkan** menganalisis
   jumlah tugas aktif per anggota, lalu mengusulkan pemindahan dari yang paling
   padat ke yang paling ringan — memilih tugas non-urgent yang belum dikerjakan
   lebih dulu. Semua saran ditampilkan sebelum diterapkan.
9. **PWA — bisa dipasang & jalan offline.** Ada manifest, service worker, dan
   ikon aplikasi. Saat dibuka di Chrome/Edge, muncul kartu “Pasang Papan
   Proyek”. Setelah dipasang, aplikasi terbuka tanpa address bar dan tetap
   menampilkan data (localStorage) saat internet mati, lengkap dengan badge
   “Mode offline”.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000

Untuk versi produksi:

```bash
npm run build
npm start
```

## Fitur

- **Drag & drop kartu** antar kolom (Backlog → Akan Dikerjakan → Dikerjakan →
  Selesai), termasuk mengurutkan ulang di dalam kolom.
- **Tambah / ubah / hapus tugas** lewat modal: judul, deskripsi, penanggung
  jawab, prioritas, tenggat, label, dan kolom tujuan.
- **Cari** berdasarkan judul, deskripsi, nama orang, atau label.
- **Filter** per anggota dan per prioritas.
- **Ringkasan** jumlah tugas, sedang dikerjakan, selesai, terlambat, dan
  progress bar keseluruhan.
- **Skor prioritas otomatis + Fokus Hari Ini** (lihat bagian Inovasi).
- **Ringkasan standup siap salin** (lihat bagian Inovasi).
- **Beban tim per anggota** (lihat bagian Inovasi).
- **Command palette Ctrl+K** (lihat bagian Inovasi).
- **Tiga model tampilan**: Papan (Kanban), Timeline 14 hari, dan Matriks
  prioritas — pilihan tampilan tersimpan otomatis.
- **Mode fokus Pomodoro 25 menit** dengan tandai selesai & lewati tugas.
- **Saran pemerataan beban** satu klik dengan pratinjau sebelum diterapkan.
- **Bisa dipasang sebagai aplikasi (PWA)** dan tetap berjalan offline.
- **Penanda tenggat**: tanggal lewat berwarna merah, jatuh tempo hari ini
  berwarna kuning.
- **Mode gelap** dengan preferensi tersimpan.
- **Penyimpanan otomatis** di `localStorage` — data tidak hilang saat refresh.
- **Responsif**: 4 kolom di desktop, 2 kolom di tablet, 1 kolom di ponsel.
- **Aksesibilitas**: kartu bisa dipindahkan dengan keyboard (Tab + panah),
  modal bisa ditutup dengan Escape.

## Struktur

```
app/
  layout.tsx        # metadata, viewport, script tema (anti-flicker)
  page.tsx          # entry halaman
  globals.css       # Tailwind + komponen dasar (.field, .btn-*)
  manifest.ts       # manifest PWA
components/
  KanbanApp.tsx     # state papan, drag & drop, filter, statistik, shortcut
  Column.tsx        # satu kolom + area drop
  TaskCard.tsx      # kartu (versi sortable & versi overlay)
  TaskModal.tsx     # form tambah/ubah tugas
  InsightsPanel.tsx # Fokus Hari Ini + Beban Tim
  StandupModal.tsx  # ringkasan standup + tombol salin
  CommandPalette.tsx# pencarian cepat Ctrl+K
  TimelineView.tsx  # jadwal 14 hari per anggota
  MatrixView.tsx    # kuadran penting × mendesak
  FocusMode.tsx     # pomodoro layar penuh
  RebalanceModal.tsx# pratinjau saran pemerataan beban
  PwaStatus.tsx     # registrasi service worker, tombol pasang, badge offline
  Avatar.tsx        # inisial anggota
lib/
  types.ts          # tipe Task, Board, Priority, ColumnId
  data.ts           # anggota, kolom, prioritas, data contoh
  insights.ts       # skor prioritas, beban tim, standup, saran rebalancing
  utils.ts          # helper tanggal, cn(), uid()
public/
  sw.js             # service worker (cache offline)
  icons/            # ikon 192/512 + apple-touch-icon
```

## Catatan teknis

- Data disimpan di browser, **belum ada backend/database**. Kandidat
  pengembangan berikutnya: API route + Prisma/Postgres, autentikasi, dan
  riwayat aktivitas per kartu.
- Tombol ↺ di kanan atas mengembalikan papan ke data contoh.
- Data contoh memakai tanggal relatif terhadap hari ini supaya penanda
  "terlambat" selalu terlihat saat demo.

## Ide pengembangan lanjutan

1. Login & peran (anggota vs admin) — bisa pakai NextAuth.
2. Database nyata + sinkronisasi antar perangkat.
3. Komentar dan lampiran di setiap kartu.
4. Notifikasi (email/WhatsApp) saat tenggat mendekat.
5. Log aktivitas: siapa memindahkan kartu dan kapan.
6. Export laporan mingguan ke CSV/PDF.
