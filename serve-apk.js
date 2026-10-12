const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const PORT = 5555;
const APK_PATH = path.join(__dirname, 'furniture-app.apk');

function getWifiIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
        if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wireless') || name.toLowerCase().includes('wlan')) {
          return net.address;
        }
      }
    }
  }
  // Fallback to any non-internal IPv4
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIp = getWifiIp();
const downloadUrl = `http://${localIp}:${PORT}/furniture-app.apk`;
const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(downloadUrl)}`;

const server = http.createServer((req, res) => {
  if (req.url === '/furniture-app.apk') {
    if (!fs.existsSync(APK_PATH)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('File APK không tồn tại.');
      return;
    }
    const stat = fs.statSync(APK_PATH);
    res.writeHead(200, {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="furniture-app.apk"',
      'Content-Length': stat.size,
    });
    fs.createReadStream(APK_PATH).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tải Furniture App (APK)</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; }
          .card { background: #1e293b; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; max-width: 400px; width: 90%; }
          h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #38bdf8; }
          p { font-size: 0.95rem; color: #94a3b8; margin-bottom: 1.5rem; }
          .qr-box { background: white; padding: 1rem; border-radius: 0.75rem; display: inline-block; margin-bottom: 1.5rem; }
          .qr-box img { display: block; width: 220px; height: 220px; }
          .btn { display: inline-block; background: #0284c7; color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; font-size: 1rem; transition: background 0.2s; }
          .btn:hover { background: #0369a1; }
          .tip { font-size: 0.8rem; color: #64748b; margin-top: 1rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>📱 Furniture App (APK)</h1>
          <p>Dùng camera điện thoại hoặc Zalo quét mã QR bên dưới để tải và cài đặt app:</p>
          <div class="qr-box">
            <img src="${qrCodeUrl}" alt="Mã QR tải ứng dụng" />
          </div>
          <div>
            <a class="btn" href="/furniture-app.apk">Tải trực tiếp APK (4.2 MB)</a>
          </div>
          <p class="tip">Lưu ý: Điện thoại và máy tính cần kết nối cùng mạng Wi-Fi.</p>
        </div>
      </body>
      </html>
    `);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`🚀 Cổng chia sẻ APK đang chạy!`);
  console.log(`🌐 Link tải: ${downloadUrl}`);
  console.log(`🖥️ Mở trang QR trên máy tính: http://localhost:${PORT}`);
  console.log(`========================================\n`);
});

