# AquaSmart HMI - IoT Water Vending Machine

AquaSmart HMI adalah antarmuka berbasis web (Human Machine Interface) untuk mesin penjual air otomatis (Water Vending Machine) terintegrasi Internet of Things (IoT). Proyek ini merespons aksi secara *real-time* dan memberikan pengalaman visual interaktif yang futuristik.

## Fitur Utama

- **Dark Industrial UI**: Desain antarmuka yang modern, elegan, dan imersif menggunakan paduan warna neon dan gelap (dark mode).
- **MQTT Real-time**: Komunikasi *real-time* dua arah antara HMI dan mesin perangkat keras (misalnya ESP32) menggunakan protokol MQTT via WebSockets.
- **Konfirmasi QR HP**: Simulasi proses pembayaran via *e-wallet* dengan memindai kode QR dinamis yang terhubung langsung dan otomatis memicu perubahan state saat dikonfirmasi.
- **Simulasi PWM tanpa Flow Meter**: Menyimulasikan aliran pengisian air dan visualisasi kontrol kecepatan pompa (PWM) secara perlahan saat menjelang penuh untuk mencegah *overflow*.

## Topik MQTT

Proyek ini terhubung menggunakan *broker* HiveMQ (`wss://broker.hivemq.com:8884/mqtt`). Berikut adalah topik-topik MQTT yang digunakan:

1. **Topik Perintah (`filling/perintah`)**
   HMI mem-publish perintah ke topik ini ketika pengguna diminta meletakkan wadah di dispenser.
   - Payload: `CMD_600ML`, `CMD_2L`, atau `CMD_GALON`.

2. **Topik Konfirmasi (`filling/confirm`)**
   HMI men-subscribe topik ini untuk menerima sinyal konfirmasi bahwa pembayaran QR via HP telah berhasil.
   - Payload: `OK` (Otomatis mengubah status otentikasi).

3. **Topik Status (`filling/status`)**
   HMI men-subscribe topik ini untuk menerima status *real-time* dari sensor/hardware ESP32.
   - Payload `FILLING_START`: Menginstruksikan HMI untuk berpindah ke status Pengisian dan mulai memutar animasi aliran air.
   - Payload `DONE`: Menginstruksikan HMI bahwa mesin telah selesai mengisi air sesuai kapasitas, lalu mengarahkan antarmuka ke layar Selesai.

## Cara Menjalankan Secara Lokal

Untuk menjalankan *dashboard* web HMI secara lokal, Anda sangat disarankan menggunakan *local web server* untuk menghindari masalah CORS (terutama saat memuat aset atau *script* MQTT). 

Jalankan perintah berikut di terminal (pastikan Python sudah terinstal) pada direktori proyek:

```bash
python3 -m http.server 8080
```

Setelah server berjalan, buka browser Anda dan akses:
[http://localhost:8080](http://localhost:8080)

## Pengembang

Proyek ini dikembangkan oleh **Ficram Manifur Farissa**.
