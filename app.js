/**
 * ==========================================================================
 * AquaSmart HMI Controller - IoT Water Vending Machine State Machine
 * Author: Antigravity Code Assistant
 * Language: JavaScript (Vanilla ES6)
 * ==========================================================================
 */

// 1. STATE DEFINITION (Daftar State Machine)
const STATES = {
    PEMILIHAN: 'PEMILIHAN',       // State 1: Menunggu user pilih volume
    OTENTIKASI_QR: 'OTENTIKASI_QR', // State 2: Tampilkan QR & Timer Timeout 60s
    SENSOR_STANDBY: 'SENSOR_STANDBY', // State 3: Instruksi letakkan botol, deteksi IR
    PENGISIAN: 'PENGISIAN',       // State 4: Pengisian air dengan simulasi PWM
    SELESAI: 'SELESAI'            // State 5: Transaksi selesai, hold 5 detik, reset
};

// 2. CONFIGURATION & STATE STORE
const hmiState = {
    currentState: STATES.PEMILIHAN,
    
    // Pilihan Wadah Aktif
    selectedVolume: '',   // '600ml', '2L', 'Galon 19L'
    selectedPrice: '',    // Rp 1.000, Rp 3.000, Rp 15.000
    totalLiters: 0.0,     // Nilai numerik liter untuk perhitungan flow (0.6, 2.0, 19.0)
    
    // Otentikasi QR Timer
    qrTimeoutDuration: 60, // 60 detik
    qrTimerInterval: null,
    qrTimeRemaining: 60,
    
    // Pengisian (Filling) telemetry
    fillProgress: 0.0,    // 0% hingga 100%
    fillInterval: null,
    dispensedLiters: 0.0,
    currentFlowRate: 0.0, // mL per detik
    
    // Auto-reset state selesai
    resetTimeoutDuration: 5, // 5 detik
    resetTimerInterval: null,
    resetTimeRemaining: 5
};

// ==========================================================================
// 3. CORE SYSTEM INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initClock();
    initSimPanel();
    initVolumeSelection();
    initSimButtons();
    initMQTT(); // Initialize MQTT
    
    // Jalankan inisialisasi state awal (State 1)
    transitionTo(STATES.PEMILIHAN);
});

// ==========================================================================
// MQTT INTEGRATION
// ==========================================================================
const mqttClientId = 'mqttjs_' + Math.random().toString(16).substr(2, 8);
const mqttHost = 'wss://broker.hivemq.com:8884/mqtt';
let mqttClient = null;

function initMQTT() {
    console.log('Connecting to MQTT broker...');
    mqttClient = mqtt.connect(mqttHost, { clientId: mqttClientId });
    
    mqttClient.on('connect', () => {
        console.log('Connected to MQTT broker via WebSocket');
        mqttClient.subscribe('filling/confirm');
        mqttClient.subscribe('filling/status');
    });
    
    mqttClient.on('message', (topic, message) => {
        const payload = message.toString();
        console.log(`[MQTT] Received message on ${topic}: ${payload}`);
        
        if (topic === 'filling/confirm' && payload === 'OK') {
            if (hmiState.currentState === STATES.OTENTIKASI_QR) {
                console.log("[MQTT] Konfirmasi HP diterima. Pindah ke SENSOR_STANDBY");
                transitionTo(STATES.SENSOR_STANDBY);
            }
        }
        
        if (topic === 'filling/status') {
            if (payload === 'FILLING_START' && hmiState.currentState === STATES.SENSOR_STANDBY) {
                console.log("[MQTT] Status FILLING_START diterima. Pindah ke PENGISIAN");
                transitionTo(STATES.PENGISIAN);
            } else if (payload === 'DONE' && hmiState.currentState === STATES.PENGISIAN) {
                console.log("[MQTT] Status DONE diterima. Menyelesaikan pengisian.");
                // Set animation progress to 100%
                hmiState.fillProgress = 100.0;
                hmiState.currentFlowRate = 0.0;
                hmiState.dispensedLiters = hmiState.totalLiters;
                updateFillingUI();
                
                if (hmiState.fillInterval) {
                    clearInterval(hmiState.fillInterval);
                    hmiState.fillInterval = null;
                }
                
                // Tahan sebentar lalu transisi ke State 5
                setTimeout(() => {
                    transitionTo(STATES.SELESAI);
                }, 1000);
            }
        }
    });
}

// Realtime Clock Header Display
function initClock() {
    const clockElement = document.getElementById("clock-display");
    
    // Sinkronisasi dengan waktu lokal saat load (2026-07-18 18:36:00)
    let currentTime = new Date("2026-07-18T18:36:00+07:00");
    
    setInterval(() => {
        currentTime.setSeconds(currentTime.getSeconds() + 1);
        const hours = String(currentTime.getHours()).padStart(2, '0');
        const minutes = String(currentTime.getMinutes()).padStart(2, '0');
        const seconds = String(currentTime.getSeconds()).padStart(2, '0');
        clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    }, 1000);

    // Simulasi sensor temperatur dan kapasitas tangki yang sedikit fluktuatif (aesthetic)
    setInterval(() => {
        const tempEl = document.getElementById("temp-display");
        const levelEl = document.getElementById("water-level-display");
        
        // Sedikit goyangan desimal
        const baseTemp = 24.5;
        const randomTemp = (baseTemp + (Math.random() * 0.4 - 0.2)).toFixed(1);
        tempEl.textContent = `${randomTemp} °C`;
        
        // Sensor air dispenser
        if (Math.random() > 0.85) {
            const randomLevel = Math.floor(90 + Math.random() * 5);
            levelEl.textContent = `${randomLevel}% Ready`;
        }
    }, 4000);
}

// UI Volume Selection (Card click listeners)
function initVolumeSelection() {
    const cards = document.querySelectorAll(".volume-card");
    cards.forEach(card => {
        card.addEventListener("click", () => {
            if (hmiState.currentState !== STATES.PEMILIHAN) return;
            
            // Simpan volume yang dipilih ke state store
            hmiState.selectedVolume = card.getAttribute("data-volume");
            hmiState.selectedPrice = card.getAttribute("data-price");
            hmiState.totalLiters = parseFloat(card.getAttribute("data-liters"));
            
            // Transisi ke State 2
            transitionTo(STATES.OTENTIKASI_QR);
        });
    });
}

// ==========================================================================
// 4. TRANSITION MANAGER (STATE MACHINE CORE)
// ==========================================================================
function transitionTo(nextState) {
    console.log(`[STATE MACHINE] Transisi dari ${hmiState.currentState} ke ${nextState}`);
    
    // 1. Eksekusi Exit Handler dari State Saat Ini
    exitCurrentState(hmiState.currentState);
    
    // 2. Perbarui state internal
    hmiState.currentState = nextState;
    
    // 3. Perbarui visual Step Indicator (Wajib)
    updateStepIndicators(nextState);
    
    // 4. Perbarui UI panel section visibility
    updateActiveSection(nextState);
    
    // 5. Perbarui panel diagnosis simulator
    updateSimPanelState(nextState);
    
    // 6. Eksekusi Enter Handler untuk State baru
    enterNewState(nextState);
}

// Exit Handler
function exitCurrentState(state) {
    switch (state) {
        case STATES.PEMILIHAN:
            // Tidak ada timer khusus yang perlu diclear di State 1
            break;
            
        case STATES.OTENTIKASI_QR:
            // Bersihkan timer QR Code
            if (hmiState.qrTimerInterval) {
                clearInterval(hmiState.qrTimerInterval);
                hmiState.qrTimerInterval = null;
            }
            break;
            
        case STATES.SENSOR_STANDBY:
            // Hapus status kedipan visual keran/zona
            document.getElementById("placement-zone").classList.remove("active");
            break;
            
        case STATES.PENGISIAN:
            // Hentikan water stream nozzle
            document.getElementById("water-stream-active").classList.remove("active");
            // Clear interval pengisian jika ada interupsi
            if (hmiState.fillInterval) {
                clearInterval(hmiState.fillInterval);
                hmiState.fillInterval = null;
            }
            break;
            
        case STATES.SELESAI:
            // Clear timer reset otomatis
            if (hmiState.resetTimerInterval) {
                clearInterval(hmiState.resetTimerInterval);
                hmiState.resetTimerInterval = null;
            }
            break;
    }
}

// Enter Handler
function enterNewState(state) {
    switch (state) {
        case STATES.PEMILIHAN:
            handleEnterPemilihan();
            break;
            
        case STATES.OTENTIKASI_QR:
            handleEnterOtentikasiQR();
            break;
            
        case STATES.SENSOR_STANDBY:
            handleEnterSensorStandby();
            break;
            
        case STATES.PENGISIAN:
            handleEnterPengisian();
            break;
            
        case STATES.SELESAI:
            handleEnterSelesai();
            break;
    }
}

// ==========================================================================
// 5. MODULAR STATE HANDLERS (Cocok dihubungkan ke MQTT API)
// ==========================================================================

/**
 * STATE 1: PEMILIHAN
 * Menunggu interaksi dari UI card click.
 */
function handleEnterPemilihan() {
    // Reset state telemetry
    hmiState.selectedVolume = '';
    hmiState.selectedPrice = '';
    hmiState.totalLiters = 0.0;
    hmiState.fillProgress = 0.0;
    
    // Matikan simulator button
    document.getElementById("sim-btn-scan-qr").disabled = true;
    document.getElementById("sim-btn-bottle-detect").disabled = true;
    
    // Update display simulator diagnostic
    document.getElementById("sim-sensor-val").textContent = "IDLE";
    document.getElementById("sim-flow-val").textContent = "0.0%";
}

/**
 * STATE 2: OTENTIKASI QR
 * Menampilkan kode QRIS dan memulai timer timeout 60 detik.
 * MQTT Note: Di sistem real, bisa mempublikasikan topik 'water/vending/invoice/request' 
 *            dan subscribe ke 'water/vending/invoice/status' untuk mendeteksi pembayaran dari HP.
 */
function handleEnterOtentikasiQR() {
    // Tampilkan informasi volume dan harga terpilih di ringkasannya
    document.getElementById("summary-volume").textContent = hmiState.selectedVolume;
    document.getElementById("summary-price").textContent = hmiState.selectedPrice;
    
    // Set sumber gambar QR berdasarkan volume yang dipilih
    const qrImg = document.getElementById("dynamic-qr-img");
    if (qrImg) {
        if (hmiState.selectedVolume === "600ml") {
            qrImg.src = "assets/botol-sedang.gif";
        } else if (hmiState.selectedVolume === "2L") {
            qrImg.src = "assets/botol-besar.gif";
        } else if (hmiState.selectedVolume === "Galon 19L") {
            qrImg.src = "assets/galon.gif";
        }
    }
    
    // Aktifkan simulator tombol QR
    document.getElementById("sim-btn-scan-qr").disabled = false;
    document.getElementById("sim-sensor-val").textContent = "MENUNGGU SCAN QR";
    
    // Setup Countdown Timer 60 Detik
    hmiState.qrTimeRemaining = hmiState.qrTimeoutDuration;
    updateQrTimerDisplay();
    
    hmiState.qrTimerInterval = setInterval(() => {
        hmiState.qrTimeRemaining--;
        updateQrTimerDisplay();
        
        if (hmiState.qrTimeRemaining <= 0) {
            console.log("[STATE MACHINE] Timeout pembayaran QR dicapai. Kembali ke PEMILIHAN.");
            // MQTT Note: Kirim pembatalan invoice ke MQTT broker
            transitionTo(STATES.PEMILIHAN);
        }
    }, 1000);
}

// Update visual countdown ring
function updateQrTimerDisplay() {
    const textEl = document.getElementById("countdown-number");
    const ring = document.getElementById("timer-progress-ring");
    
    textEl.textContent = hmiState.qrTimeRemaining;
    
    // Menghitung offset SVG circle stroke (radius=45, keliling ~ 283)
    const strokeDashOffset = 283 - (283 * hmiState.qrTimeRemaining) / hmiState.qrTimeoutDuration;
    ring.style.strokeDashoffset = strokeDashOffset;
    
    // Warnai ring orange/kuning menuju merah saat sisa waktu tinggal sedikit
    if (hmiState.qrTimeRemaining <= 15) {
        ring.style.stroke = "#ff3b30"; // Red
        textEl.style.color = "#ff3b30";
    } else {
        ring.style.stroke = "#ff7b00"; // Orange
        textEl.style.color = "#ff7b00";
    }
}

/**
 * STATE 3: SENSOR STANDBY
 * Pengguna diminta meletakkan wadah di bawah dispenser.
 * Sensor IR terhubung ke GPIO mikrokontroler akan mendeteksi objek.
 * MQTT Note: Mikrokontroler (ESP32) akan mempublikasikan sensor IR status 
 *            ke topik 'water/vending/sensor/proximity'. Kita subscribe untuk trigger.
 */
function handleEnterSensorStandby() {
    // Publish MQTT command
    if (mqttClient && mqttClient.connected) {
        let cmd = "";
        if (hmiState.selectedVolume === "600ml") cmd = "CMD_600ML";
        else if (hmiState.selectedVolume === "2L") cmd = "CMD_2L";
        else if (hmiState.selectedVolume === "Galon 19L") cmd = "CMD_GALON";
        
        mqttClient.publish('filling/perintah', cmd);
        console.log(`[MQTT] Published perintah: ${cmd}`);
    }

    // Matikan tombol scan QR, aktifkan tombol deteksi botol simulator
    document.getElementById("sim-btn-scan-qr").disabled = true;
    document.getElementById("sim-btn-bottle-detect").disabled = false;
    
    document.getElementById("sim-sensor-val").textContent = "MENUNGGU BOTOL";
    
    // Aktifkan visual kedipan panduan peletakan wadah
    document.getElementById("placement-zone").classList.add("active");
}

/**
 * STATE 4: PENGISIAN / FILLING
 * Simulasi PWM pompa air: pengisian 0-80% cepat, pengisian 80-100% melambat drastis.
 * MQTT Note: Pada mesin sungguhan, UI mengirim publish 'water/vending/pump/control' dengan data 'START'.
 *            Mesin IoT mengirim sinyal feedback flow rate sensor 'water/vending/flow/current' per milidetik.
 */
function handleEnterPengisian() {
    // Matikan simulator buttons selama masa pengisian
    document.getElementById("sim-btn-bottle-detect").disabled = true;
    document.getElementById("sim-sensor-val").textContent = "PENGISIAN AKTIF";
    
    // Hidupkan aliran air dari nozzle secara visual
    document.getElementById("water-stream-active").classList.add("active");
    
    hmiState.fillProgress = 0.0;
    hmiState.dispensedLiters = 0.0;
    
    // Kecepatan update logic loop (50ms per tick)
    const tickMs = 50;
    
    hmiState.fillInterval = setInterval(() => {
        let increment = 0;
        
        // Logika PWM (Simulasi Melambat Saat Mendekati Selesai untuk cegah luber)
        if (hmiState.fillProgress < 80.0) {
            // Fase Aliran Cepat (0-80%): Maksimal pompa bekerja.
            // Butuh waktu sekitar ~3.5 detik untuk mencapai 80% (1.15% per 50ms)
            increment = 1.15;
            hmiState.currentFlowRate = 180.5; // mL/s
            document.getElementById("flow-mode-display").textContent = "CEPAT (MAX)";
            document.getElementById("flow-mode-display").className = "metric-value pulse-green";
            document.getElementById("sim-flow-val").textContent = "100.0% (MAX)";
        } else {
            // Fase Aliran Melambat (80-100%): Pulsa PWM memendek secara drastis
            // Butuh waktu sekitar ~5.5 detik untuk 20% sisa (0.18% per 50ms)
            increment = 0.18;
            
            // Dynamic flow rate simulasi penurunan
            const rangeFactor = (100.0 - hmiState.fillProgress) / 20.0; // 1 down to 0
            hmiState.currentFlowRate = (25.0 + (rangeFactor * 45.0)).toFixed(1); // 70ml/s down to 25ml/s
            
            document.getElementById("flow-mode-display").textContent = "SLOW (PWM)";
            document.getElementById("flow-mode-display").className = "metric-value pulse-orange";
            
            const pwmDutyCycle = (20 + (rangeFactor * 80)).toFixed(0);
            document.getElementById("sim-flow-val").textContent = `${pwmDutyCycle}.0% (PWM)`;
        }
        
        // Update progress (Simulasi ditahan maksimal di 95% sampai MQTT DONE diterima)
        hmiState.fillProgress += increment;
        
        if (hmiState.fillProgress >= 95.0) {
            hmiState.fillProgress = 95.0;
            hmiState.currentFlowRate = 0.0;
        }
        
        // Kalkulasi liter yang terisi secara riil
        hmiState.dispensedLiters = (hmiState.totalLiters * (hmiState.fillProgress / 100.0));
        updateFillingUI();
        
    }, tickMs);
}

// Update DOM elements inside State 4
function updateFillingUI() {
    const progressInt = Math.floor(hmiState.fillProgress);
    
    // 1. Persentase Teks
    document.getElementById("progress-percent-display").textContent = `${progressInt}%`;
    
    // 2. Progress Bar Fill Width
    document.getElementById("progress-bar-fill").style.width = `${hmiState.fillProgress}%`;
    
    // 3. Telemetry Liter Dispensed
    document.getElementById("dispensed-volume-display").textContent = `${hmiState.dispensedLiters.toFixed(2)} L`;
    
    // 4. Telemetry Flow Rate
    document.getElementById("flow-rate-display").textContent = `${hmiState.currentFlowRate} mL/s`;
    
    // 5. SVG Liquid Level (Wave Translation Animation)
    // 150 = empty bottom, 20 = full top. Rentang gerak = 130px.
    const translateHeight = 150 - (hmiState.fillProgress / 100.0) * 130;
    document.getElementById("liquid-group").setAttribute("transform", `translate(0, ${translateHeight})`);
}

/**
 * STATE 5: SELESAI
 * Tampilkan konfirmasi, struk, dan trigger timer 5 detik untuk kembali ke State 1.
 */
function handleEnterSelesai() {
    document.getElementById("sim-sensor-val").textContent = "SELESAI (SUKSES)";
    document.getElementById("sim-flow-val").textContent = "0.0%";
    
    // Tampilkan data struk transaksi di UI
    document.getElementById("receipt-volume-size").textContent = `${hmiState.selectedVolume}`;
    document.getElementById("receipt-volume-actual").textContent = `${hmiState.totalLiters.toFixed(2)} Liter`;
    
    // Jalankan timer mundur reset
    hmiState.resetTimeRemaining = hmiState.resetTimeoutDuration;
    updateResetTimerDisplay();
    
    hmiState.resetTimerInterval = setInterval(() => {
        hmiState.resetTimeRemaining--;
        updateResetTimerDisplay();
        
        if (hmiState.resetTimeRemaining <= 0) {
            transitionTo(STATES.PEMILIHAN);
        }
    }, 1000);
}

function updateResetTimerDisplay() {
    document.getElementById("reset-counter").textContent = hmiState.resetTimeRemaining;
    
    // Progress bar tiny menyusut seiring timer berjalan
    const percentWidth = (hmiState.resetTimeRemaining / hmiState.resetTimeoutDuration) * 100;
    document.getElementById("reset-progress-fill").style.width = `${percentWidth}%`;
}


// ==========================================================================
// 6. UI & VISUAL STATE HELPERS
// ==========================================================================

// Ganti panel section visual berdasarkan state
function updateActiveSection(state) {
    // Sembunyikan semua section
    const sections = document.querySelectorAll(".state-section");
    sections.forEach(sec => sec.classList.remove("active"));
    
    // Tampilkan section yang ditarget
    let targetSectionId = '';
    switch (state) {
        case STATES.PEMILIHAN:
            targetSectionId = 'state-pemilihan';
            break;
        case STATES.OTENTIKASI_QR:
            targetSectionId = 'state-otentikasi';
            break;
        case STATES.SENSOR_STANDBY:
            targetSectionId = 'state-standby';
            break;
        case STATES.PENGISIAN:
            targetSectionId = 'state-pengisian';
            break;
        case STATES.SELESAI:
            targetSectionId = 'state-selesai';
            break;
    }
    
    const activeSection = document.getElementById(targetSectionId);
    if (activeSection) {
        activeSection.classList.add("active");
    }
}

// Memperbarui visual Step Indicator (Langkah 1 s.d. 5)
function updateStepIndicators(state) {
    const step1 = document.getElementById("step-1-indicator");
    const step2 = document.getElementById("step-2-indicator");
    const step3 = document.getElementById("step-3-indicator");
    const step4 = document.getElementById("step-4-indicator");
    const step5 = document.getElementById("step-5-indicator");
    const progressLine = document.getElementById("step-progress-line");
    
    // Reset all status
    const steps = [step1, step2, step3, step4, step5];
    steps.forEach(st => {
        st.classList.remove("active");
        st.classList.remove("completed");
    });
    
    switch (state) {
        case STATES.PEMILIHAN:
            step1.classList.add("active");
            progressLine.style.width = "0%";
            break;
            
        case STATES.OTENTIKASI_QR:
            step1.classList.add("completed");
            step2.classList.add("active");
            progressLine.style.width = "25%";
            break;
            
        case STATES.SENSOR_STANDBY:
            step1.classList.add("completed");
            step2.classList.add("completed");
            step3.classList.add("active");
            progressLine.style.width = "50%";
            break;
            
        case STATES.PENGISIAN:
            step1.classList.add("completed");
            step2.classList.add("completed");
            step3.classList.add("completed");
            step4.classList.add("active");
            progressLine.style.width = "75%";
            break;
            
        case STATES.SELESAI:
            step1.classList.add("completed");
            step2.classList.add("completed");
            step3.classList.add("completed");
            step4.classList.add("completed");
            step5.classList.add("active", "completed");
            progressLine.style.width = "100%";
            break;
    }
}

// ==========================================================================
// 7. SIMULATION INTERACTIVE PANEL LOGIC
// ==========================================================================
function initSimPanel() {
    const simPanel = document.getElementById("sim-panel");
    const simHeader = document.getElementById("sim-header");
    
    // Toggle minimized class on header click
    simHeader.addEventListener("click", () => {
        simPanel.classList.toggle("minimized");
    });
}

// Update current active state name in simulation diagnosis monitor
function updateSimPanelState(state) {
    const stateNameEl = document.getElementById("sim-state-name");
    
    let friendlyName = '';
    switch (state) {
        case STATES.PEMILIHAN:
            friendlyName = 'PEMILIHAN (State 1)';
            break;
        case STATES.OTENTIKASI_QR:
            friendlyName = 'SCAN QR (State 2)';
            break;
        case STATES.SENSOR_STANDBY:
            friendlyName = 'BOTTLE STANDBY (State 3)';
            break;
        case STATES.PENGISIAN:
            friendlyName = 'FILLING WATER (State 4)';
            break;
        case STATES.SELESAI:
            friendlyName = 'COMPLETED (State 5)';
            break;
    }
    
    stateNameEl.textContent = friendlyName;
}

// Attach listeners for IoT dummy trigger buttons
function initSimButtons() {
    // 1. QR code scan simulator
    const btnScanQr = document.getElementById("sim-btn-scan-qr");
    btnScanQr.addEventListener("click", () => {
        if (hmiState.currentState === STATES.OTENTIKASI_QR) {
            console.log("[SIMULATOR] Tombol dinonaktifkan sesuai instruksi. Gunakan MQTT: Publish 'OK' ke 'filling/confirm'");
        }
    });
    
    // 2. Proximity / Bottle Sensor detector simulator
    const btnDetectBottle = document.getElementById("sim-btn-bottle-detect");
    btnDetectBottle.addEventListener("click", () => {
        if (hmiState.currentState === STATES.SENSOR_STANDBY) {
            console.log("[SIMULATOR] Tombol dinonaktifkan sesuai instruksi. Gunakan MQTT: Publish 'FILLING_START' ke 'filling/status'");
        }
    });
}
