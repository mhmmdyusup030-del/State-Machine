document.addEventListener("DOMContentLoaded", () => {
    const statusElement = document.getElementById("confirmStatus");
    const spinnerElement = document.getElementById("loadingSpinner");
    
    // Ambil parameter cmd dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const cmd = urlParams.get('cmd');
    
    if (!cmd) {
        statusElement.textContent = "Error: Parameter 'cmd' tidak ditemukan di URL (misal: ?cmd=600ml).";
        statusElement.style.color = "#ff3b30";
        spinnerElement.style.display = "none";
        return;
    }
    
    statusElement.textContent = `Menghubungkan ke server untuk pesanan: ${cmd}...`;
    
    // Koneksi MQTT
    const mqttClientId = 'mqttjs_confirm_' + Math.random().toString(16).substr(2, 8);
    const mqttHost = 'wss://broker.hivemq.com:8884/mqtt';
    
    const client = mqtt.connect(mqttHost, { clientId: mqttClientId });
    
    client.on('connect', () => {
        statusElement.textContent = "Terhubung ke broker! Mengirim konfirmasi pembayaran...";
        
        // Publish pesan OK ke topik filling/confirm
        client.publish('filling/confirm', 'OK', (err) => {
            if (err) {
                statusElement.textContent = "Gagal mengirim konfirmasi.";
                statusElement.style.color = "#ff3b30";
                spinnerElement.style.display = "none";
            } else {
                statusElement.textContent = "✅ Pembayaran Berhasil! Halaman akan ditutup dalam 2 detik...";
                statusElement.style.color = "#00ff00";
                spinnerElement.style.display = "none";
                
                // Tutup tab setelah 2 detik
                setTimeout(() => {
                    // Coba untuk tutup tab secara otomatis
                    window.close();
                    // Fallback jika window.close() diblokir oleh browser untuk tab yang tidak dibuka oleh script
                    statusElement.innerHTML = "✅ Transaksi Sukses.<br><br>Silakan kembali ke layar Vending Machine.";
                }, 2000);
            }
            client.end();
        });
    });
    
    client.on('error', (err) => {
        statusElement.textContent = "Error koneksi MQTT: " + err.message;
        statusElement.style.color = "#ff3b30";
        spinnerElement.style.display = "none";
        console.error(err);
    });
});
