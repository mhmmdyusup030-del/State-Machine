<h1 align="center">💧 IoT Water Vending Machine (State-Machine)</h1>

<p align="center">
  <img src="https://img.shields.io/badge/last%20commit-today-brightgreen" />
  <img src="https://img.shields.io/badge/platform-ESP32-informational" />
  <img src="https://img.shields.io/badge/protocol-MQTT-green" />
  <img src="https://img.shields.io/badge/UI-Dark%20Industrial-blue" />
</p>

<p align="center">
  <em>Sistem pengisian air otomatis berbasis IoT dengan antarmuka web interaktif yang dikendalikan oleh Finite State Machine (FSM).</em>
</p>

---

## 📑 Table of Contents
- [✨ Overview](#-overview)
- [🚀 Fitur Utama](#-fitur-utama)
- [🏗️ Arsitektur Sistem](#️-arsitektur-sistem)
- [🔄 Konsep State Machine](#-konsep-state-machine)
- [🚀 Cara Menjalankan](#-cara-menjalankan)
- [🤝 Kontribusi](#-kontribusi)

---

## ✨ Overview
**IoT Water Vending Machine** adalah solusi sistem pengisian air otomatis yang dirancang untuk efisiensi tinggi. Dengan antarmuka HMI berbasis web, pengguna dapat memilih volume air, melakukan pembayaran digital via QRIS, dan memantau proses pengisian secara *real-time*.

### 🌟 Keunggulan
- 🌑 **Dark Industrial UI** - Antarmuka modern dengan gaya futuristik.
- 📱 **QR-Based Authentication** - Konfirmasi transaksi aman melalui smartphone.
- ⏳ **Time-Based Filling** - Pengisian presisi tanpa flow meter menggunakan relay PWM.
- 🛰️ **Real-time IoT** - Komunikasi data stabil menggunakan protokol MQTT.

---

## 🚀 Fitur Utama

- ✅ **Smart Cancellation** - User dapat membatalkan transaksi di tengah jalan.
- ✅ **Payment Success Animation** - Animasi visual elegan saat pembayaran terkonfirmasi.
- ✅ **Auto-Reset System** - Sistem kembali ke posisi idle secara otomatis setelah transaksi selesai.
- ✅ **Flow Rate Simulation** - Simulasi PWM (aliran melambat di akhir) untuk mencegah air tumpah.

---

## 🏗️ Arsitektur Sistem

```text
[ Web HMI UI ] <--- WebSocket (MQTT) ---> [ HiveMQ Broker ] <--- MQTT ---> [ ESP32 / NodeMCU ]
      |                                                                          |
      |-- app.js (FSM Logic)                                                     |-- Relay (Pump)
      |-- confirm.js (QR Auth)                                                   |-- HC-SR04 (Sensor)

```

---

## 🔄 Konsep State Machine

Sistem dikendalikan oleh **5 State** utama:

1. **PEMILIHAN**: User memilih volume air.
2. **OTENTIKASI_QR**: Menampilkan QRIS, user melakukan scan (konfirmasi via smartphone).
3. **PEMBAYARAN_SUKSES**: Animasi ceklis untuk memberikan umpan balik positif.
4. **SENSOR_STANDBY**: Menunggu botol diletakkan di bawah nozzle (deteksi sensor ultrasonik).
5. **PENGISIAN**: Proses pengisian air dengan simulasi PWM.
6. **SELESAI**: Transaksi sukses, menampilkan struk digital, lalu sistem mereset diri.

---

## 🚀 Cara Menjalankan

### 1. Menjalankan Dashboard Web

```bash
python3 -m http.server 8080

```

Akses melalui: `http://localhost:8080/` atau [Link GitHub Pages](https://mhmmdyusup030-del.github.io/State-Machine/)

### 2. Persiapan QR Code

Generate QR Code menggunakan [TEC-IT Barcode Generator](https://barcode.tec-it.com/en/QRCode) dengan link berikut:

* 600ml: `https://mhmmdyusup030-del.github.io/State-Machine/confirm.html?cmd=600ml`
* 2L: `https://mhmmdyusup030-del.github.io/State-Machine/confirm.html?cmd=2L`
* 19L: `https://mhmmdyusup030-del.github.io/State-Machine/confirm.html?cmd=19L`

---

## 👨‍💻 Pengembang

**Ficram Manifur Farissa**

* 🐙 GitHub: [mhmmdyusup030-del](https://www.google.com/search?q=https://github.com/mhmmdyusup030-del)
