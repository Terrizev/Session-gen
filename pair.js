const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
const path = require('path');
let router = express.Router()
const pino = require("pino");
const {
    default: Gifted_Tech,
    useSingleFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("maher-zubair-baileys");

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

    let num = req.query.number;
    
    async function GENERATE_CREDS() {
        const { state, saveState } = await useSingleFileAuthState(authFile);
        
        try {
            let Pair_Instance = Gifted_Tech({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino()),
                },
                printQRInTerminal: false,
                logger: pino({ level: 'fatal' }),
                browser: ["Chrome (Linux)", "", ""]
            });

            Pair_Instance.ev.on('creds.update', saveState);
            Pair_Instance.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect, qr } = update;
                
                if (connection === "open") {
                    await delay(2000);
                    
                    // Send credentials file
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Content-Disposition', 'attachment; filename="creds.json"');
                    fs.createReadStream(authFile).pipe(res);
                    
                    // Send success message
                    let data = fs.readFileSync(authFile);
                    let session = await Pair_Instance.sendMessage(
                        Pair_Instance.user.id, 
                        { text: Buffer.from(data).toString('base64') }
                    );

                    const SUCCESS_MESSAGE = `
*_Pair Code Connected by NTEEJ TECH_*
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

                    await Pair_Instance.sendMessage(
                        Pair_Instance.user.id,
                        { text: SUCCESS_MESSAGE },
                        { quoted: session }
                    );

                    // Cleanup
                    await delay(1000);
                    Pair_Instance.ws.close();
                    removeFile(tempDir);
                }
                
                if (connection === "close") {
                    removeFile(tempDir);
                }
            });

            if (!Pair_Instance.authState.creds.registered) {
                num = num.replace(/[^0-9]/g, '');
                await Pair_Instance.requestPairingCode(num);
            }

        } catch (err) {
            console.error("Pairing Error:", err);
            removeFile(tempDir);
            if (!res.headersSent) {
                res.status(500).send("Service Unavailable");
            }
        }
    }
    
    await GENERATE_CREDS();
});

module.exports = router;