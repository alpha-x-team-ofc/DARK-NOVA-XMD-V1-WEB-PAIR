const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const express = require("express");
const qrcode = require("qrcode-terminal");

const app = express();
const PORT = 3000;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");

  const { version, isLatest } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true, // Shows QR in terminal
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update;
    if (qr) {
      console.log("Scan this QR to pair:");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "open") {
      console.log("✅ DARK-NOVA-XMD is connected!");
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

startBot();

app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
