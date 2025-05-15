const { makeid } = require('./id');
const QRCode = require('qrcode');
const express = require('express');
const path = require('path');
const fs = require('fs');
let router = express.Router()
const pino = require("pino");
const {
    default: Wasi_Tech,
    useSingleFileAuthState,
    Browsers
} = require("@whiskeysockets/baileys");

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true })
};

router.get('/', async (req, res) => {
    const id = makeid();
    const tempDir = path.join(__dirname, 'temp', id);
    const authFile = path.join(tempDir, 'creds.json');
    
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    async function QR_CREDS_GENERATOR() {
        const { state, saveState } = await useSingleFileAuthState(authFile);
        
        try {
            let Qr_Instance = Wasi_Tech({
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: 'silent' }),
                browser: Browsers.macOS("Desktop"),
            });

            Qr_Instance.ev.on('creds.update', saveState);
            Qr_Instance.ev.on("connection.update", async (update) => {
                const { connection, qr } = update;
                
                if (qr) {
                    try {
                        const qrImage = await QRCode.toBuffer(qr);
                        res.writeHead(200, {
                            'Content-Type': 'image/png',
                            'Content-Length': qrImage.length
                        });
                        res.end(qrImage);
                    } catch (err) {
                        console.error('QR Generation Error:', err);
                    }
                }
                
                if (connection === "open") {
    await delay(2000);
    
    // Corrected headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="creds.json"');
                    
                    // Send success message
                    let data = fs.readFileSync(authFile);
                    let session = await Qr_Instance.sendMessage(
                        Qr_Instance.user.id, 
                        { text: Buffer.from(data).toString('base64') }
                    );

                    const SUCCESS_MESSAGE = `
*_QR Connected by NTEEJ TECH_*
*_Made With NTEEJ TECH_*
______________________________________
╔════◇
║ *『 WOW YOU'VE CHOSEN NTEEJ MD 』*
║ _You Have Completed the First Step to Deploy a Whatsapp Bot._
╚════════════════════════╝
╔═════◇
║  『••• 𝗩𝗶𝘀𝗶𝘁 𝗙𝗼𝗿 𝗛𝗲𝗹𝗽 •••』
║❍ *Tgram:* _https://t.me/Nteej_
║❍ *Owner:* _https://wa.me/714497545_
║❍ *Repo:* _https://github.com/Ntee-j01/NTEEJ-MD_
║❍ *WaGroup:* _https://chat.whatsapp.com/Er6RNNNVWV5LORN9Nr6hL7_
║❍ *WaChannel:* _https://whatsapp.com/channel/0029Vae3GZF9Bb658QgSCl1I_
║❍ *Plugins:* _https://github.com/Ntee-j01/NTEEJ-MD-PLUGINS_
╚════════════════════════╝
_____________________________________

_Don't Forget To Give Star To My Repo_`;

                    await Qr_Instance.sendMessage(
                        Qr_Instance.user.id,
                        { text: SUCCESS_MESSAGE },
                        { quoted: session }
                    );

                    // Cleanup
                    await delay(1000);
                    Qr_Instance.ws.close();
                    removeFile(tempDir);
                }
            });

        } catch (err) {
            console.error("QR Session Error:", err);
            removeFile(tempDir);
            if (!res.headersSent) {  // FIXED LINE 108
                res.status(500).send("Service Unavailable");
            }
        }
    }
    
    await QR_CREDS_GENERATOR();
});

module.exports = router;
