const { makeid } = require('./id');
const QRCode = require('qrcode');
const express = require('express');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
let router = express.Router();
const pino = require("pino");
const {
    default: Wasi_Tech,
    useSingleFileAuthState,
    Browsers,
    delay
} = require("@whiskeysockets/baileys");

// Cleanup function with fs-extra
const removeDirectory = async (dirPath) => {
    try {
        await fse.remove(dirPath);
    } catch (err) {
        console.error('Cleanup error:', err);
    }
};

router.get('/', async (req, res) => {
    const sessionId = makeid();
    const tempBase = path.join(__dirname, 'temp');
    const sessionDir = path.join(tempBase, sessionId);
    const credsPath = path.join(sessionDir, 'creds.json');

    try {
        // 1. Create directories with proper permissions
        await fse.ensureDir(sessionDir, {
            mode: 0o755, // rwxr-xr-x
            recursive: true
        });

        // 2. Initialize WhatsApp connection
        const { state, saveState } = await useSingleFileAuthState(credsPath);
        const waClient = Wasi_Tech({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            browser: Browsers.macOS("Desktop")
        });

        // 3. Handle QR Generation
        waClient.ev.on('creds.update', saveState);
        
        waClient.ev.on("connection.update", async (update) => {
            try {
                if (update.qr) {
                    // Generate QR PNG
                    const qrImage = await QRCode.toBuffer(update.qr);
                    res.writeHead(200, {
                        'Content-Type': 'image/png',
                        'Content-Length': qrImage.length
                    });
                    res.end(qrImage);
                }

                if (update.connection === "open") {
                    // 4. Send credentials file
                    await delay(1500);
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Content-Disposition', 'attachment; filename="creds.json"');
                    fs.createReadStream(credsPath).pipe(res);

                    // 5. Send success message
                    const successMessage = `
*_QR Connected by NTEEJ TECH_*
*_Made With NTEEJ TECH_*
╔════════════════════════╗
║   ✅ CONNECTION SUCCESS ║
╚════════════════════════╝
╔════◇ Useful Links:
║➤ Tgram: _https://t.me/Nteej_
║➤ Owner: _https://wa.me/714497545_
║➤ GitHub: _https://github.com/Ntee-j01_
╚════════════════════════╝
_Don't Forget To Star Our Repo!_`;

                    await waClient.sendMessage(
                        waClient.user.id,
                        { text: successMessage }
                    );

                    // 6. Cleanup
                    await removeDirectory(sessionDir);
                    waClient.ws.close();
                }
            } catch (err) {
                console.error('Connection handler error:', err);
                await removeDirectory(sessionDir);
            }
        });

    } catch (err) {
        console.error('QR Session Error:', err);
        await removeDirectory(sessionDir);
        if (!res.headersSent) {
            res.status(500).json({
                status: false,
                message: "Service unavailable. Try again later."
            });
        }
    }
});

module.exports = router;
