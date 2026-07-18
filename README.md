# 💧 IoT Water Vending Machine (State-Machine)

Sebuah Human-Machine Interface (HMI) berbasis web untuk simulasi dan kontrol Smart Water Vending Machine. Proyek ini mengimplementasikan konsep *Finite State Machine* (FSM) untuk mengatur alur transaksi dari pemilihan volume, pembayaran QR, hingga pengisian otomatis berbasis waktu (Time-Based Filling).

**Pengembang:** Ficram Manifur Farissa

---

## 📑 Table of Contents

- [Fitur Utama](#-fitur-utama)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Konsep State Machine](#-konsep-state-machine)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Cara Menjalankan](#-cara-menjalankan)
- [Simulasi & Testing](#-simulasi--testing)

---

## ✨ Fitur Utama

- **Antarmuka Futuristik & Responsif**: UI/UX HMI modern, dilengkapi animasi pengisian air dinamis menggunakan SVG.
- **Sistem Pembayaran QR Code**: Integrasi simulasi pembayaran digital melalui QRIS / E-Wallet.
- **Finite State Machine (FSM)**: Alur kerja sistem dikendalikan dengan transisi state yang aman (Pemilihan -> QR -> Standby -> Filling -> Selesai).
- **Time-Based Filling (Relay PWM)**: Simulasi kendali laju aliran air. Fase awal 0-80% menggunakan kecepatan maksimal, dan 80-100% melambat (simulasi PWM) untuk mencegah air meluber.
- **Komunikasi Real-Time MQTT**: Integrasi broker MQTT WebSockets (`wss://broker.hivemq.com:8884/mqtt`) untuk menjembatani komunikasi UI dengan perangkat keras (NodeMCU/ESP32).

---

## 🏗 Arsitektur Sistem

Sistem ini dirancang untuk bekerja sebagai antarmuka pengguna (Frontend) yang berkomunikasi dengan Mikrokontroler IoT melalui MQTT Broker.

```text
[ Web HMI UI ] <--- WebSocket (MQTT) ---> [ HiveMQ Public Broker ] <--- MQTT ---> [ ESP32 / NodeMCU ]
      |                                                                                  |
      |-- app.js (State Machine)                                                         |-- Relay / Pompa Air
      |-- confirm.js (Simulasi Pembayaran)                                               |-- Sensor Proximity
```

---

## 🔄 Konsep State Machine

Proyek ini berjalan menggunakan 5 state berurutan:

1. **PEMILIHAN**: Layar default bagi pengguna untuk memilih volume air (600ml, 2L, Galon 19L).
2. **OTENTIKASI_QR**: Menampilkan QR Code dinamis dan menunggu pembayaran dengan batas waktu 60 detik.
3. **SENSOR_STANDBY**: Menunggu pengguna meletakkan botol di area nozzle (berkomunikasi dengan sensor proximity di hardware).
4. **PENGISIAN**: Proses *Time-Based Filling* berjalan dan visual tangki menampilkan progress air secara realtime.
5. **SELESAI**: Transaksi berhasil, menampilkan struk digital, lalu sistem mereset diri kembali ke State 1.

---

## 💻 Teknologi yang Digunakan

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6)
- **Protokol Komunikasi**: MQTT via WebSockets (menggunakan pustaka `mqtt.min.js`)
- **Desain & Animasi**: Custom SVG, CSS Keyframes, CSS Transitions

---

## 🚀 Cara Menjalankan

Karena proyek ini menggunakan Vanilla JavaScript tanpa *framework* khusus, sangat mudah untuk menjalankannya.

### Menjalankan secara Lokal
1. *Clone* atau unduh *repository* ini ke komputer Anda.
2. Buka folder proyek.
3. Buka file `index.html` menggunakan *web browser* modern (Google Chrome, Firefox, Edge).
4. Tidak diperlukan server backend khusus karena koneksi MQTT berjalan melalui public broker.

### Deploy ke GitHub Pages
Proyek ini sudah siap di-deploy (Ready-to-deploy) ke GitHub Pages!
1. Buat repository baru di GitHub dan *push* seluruh file (*app.js*, *confirm.js*, *index.html*, *confirm.html*, *style.css*, folder *assets/*).
2. Pergi ke tab **Settings** pada repository.
3. Klik menu **Pages** di sidebar kiri.
4. Pada bagian **Build and deployment**, pilih *Source*: **Deploy from a branch**.
5. Pilih *Branch*: **main** atau **master**, lalu klik **Save**.
6. GitHub akan memproses build, dan *link* proyek akan muncul di bagian atas halaman pengaturan tersebut.

---

## 🧪 Simulasi & Testing

Proyek ini menyediakan file `confirm.html` untuk menyimulasikan *device* HP pelanggan yang sedang melakukan pembayaran (Scan QR Code):

1. Buka HMI (`index.html`) di browser (Tab 1).
2. Pilih volume air hingga masuk ke layar **Scan QR** (State 2).
3. Buka tab baru (Tab 2), lalu akses `confirm.html?cmd=600ml` (sesuaikan `cmd` dengan produk yang dipilih).
4. Halaman `confirm.html` akan langsung *publish* pesan `OK` ke MQTT `filling/confirm`.
5. Tab 1 otomatis berpindah ke State 3 (Standby).
6. Gunakan tombol **Simulasi IoT** di panel bawah pada Tab 1 (jika testing tanpa ESP32) untuk menyimulasikan sensor mendeteksi botol, dan proses pengisian akan berjalan.

---
*© 2026 Ficram Manifur Farissa. All Rights Reserved.*
