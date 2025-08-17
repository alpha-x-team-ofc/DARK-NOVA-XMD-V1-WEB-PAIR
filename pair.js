const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const router = express.Router();
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  makeCacheableSignalKeyStore,
  Browsers,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");
const { upload } = require("./mega");

function removeFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  try {
    fs.rmSync(filePath, { recursive: true, force: true });
    return true;
  } catch (err) {
    console.error(`Error removing file ${filePath}:`, err);
    return false;
  }
}

router.get("/", async (req, res) => {
  const num = req.query.number?.replace(/[^0-9]/g, "");
  
  if (!num || num.length < 11) {
    return res.status(400).json({ error: "Invalid phone number" });
  }

  async function initPairing() {
    const sessionDir = path.join(__dirname, "session");
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    
    try {
      const socket = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(
            state.keys,
            pino({ level: "fatal" }).child({ level: "fatal" })
          ),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }).child({ level: "fatal" }),
        browser: Browsers.macOS("Safari"),
      });

      if (!socket.authState.creds.registered) {
        await delay(1500);
        const code = await socket.requestPairingCode(num);
        if (!res.headersSent) {
          res.json({ code });
        }
      }

      socket.ev.on("creds.update", saveCreds);
      socket.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === "open") {
          try {
            await delay(10000);
            const credsPath = path.join(sessionDir, "creds.json");
            
            if (!fs.existsSync(credsPath)) {
              throw new Error("Credentials file not found");
            }

            const megaUrl = await upload(
              fs.createReadStream(credsPath),
              `DARK-NOVA-SESSION-${Date.now()}.json`
            );

            const stringSession = megaUrl.replace("https://mega.nz/file/", "");
            const userJid = jidNormalizedUser(socket.user.id);
            const message = `
*🤖 DARK-NOVA-XMD [The powerful WA BOT]*

👉 ${stringSession} 👈

*This is your Session ID, copy this id and paste into config.js file*

*ᴄʀᴇᴀᴛᴏʀ=👨🏻‍💻 ᴍʀ ᴅᴜʟɪɴᴀ ɴᴇᴛʜᴍɪʀᴀ ᴀɴᴅ ꜱʜᴇʀᴏɴ ᴇʟɪᴊᴀʜ ⚖*

*You can join my whatsapp channel*
https://whatsapp.com/channel/0029Vb9yA9K9sBI799oc7U2T

*> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 - : 𝕎ℍ𝕀𝕋𝔼 𝔸𝕃ℙℍ𝔸 𝕎𝕆𝕃𝔽 𝕏 𝕋𝔼𝔸𝕄 *
            `;

            await socket.sendMessage(userJid, {
              image: { url: "https://github.com/dula9x/DARK-NOVA-XMD-V1-WEB-PAIR/raw/main/images/WhatsApp%20Image%202025-08-15%20at%2017.22.03_c520eb7b.jpg" },
              caption: message
            });

            await socket.sendMessage(userJid, {
              text: "🛑 *Do not share this code with anyone* 🛑"
            });

          } catch (err) {
            console.error("Error in session handling:", err);
            exec("pm2 restart DARK-NOVA-XMD");
          } finally {
            removeFile(sessionDir);
            process.exit(0);
          }
        } else if (connection === "close" && lastDisconnect?.error) {
          if (lastDisconnect.error.output.statusCode !== 401) {
            await delay(10000);
            initPairing();
          }
        }
      });
    } catch (err) {
      console.error("Pairing error:", err);
      exec("pm2 restart DARK-NOVA-XMD");
      removeFile(path.join(__dirname, "session"));
      if (!res.headersSent) {
        res.status(503).json({ code: "Service Unavailable" });
      }
    }
  }

  await initPairing();
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  exec("pm2 restart DARK-NOVA-XMD");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

module.exports = router;
