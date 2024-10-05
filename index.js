const makeWASocket = require("@whiskeysockets/baileys").default;
const fs = require('fs');
const pino = require("pino");
const { delay, useMultiFileAuthState, fetchLatestBaileysVersion, PHONENUMBER_MCC, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const readline = require("readline");
const chalk = require("chalk");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

// Always assume pairing code is required
const pairingCode = true;  
const useMobile = process.argv.includes("--mobile");

async function qr() {
    let { version, isLatest } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(`./sessions`);

    const LinucxMDInc = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !pairingCode,
        mobile: useMobile,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
    });

    // Request pairing code since pairingCode is set to true
    if (pairingCode && !LinucxMDInc.authState.creds.registered) {
        let phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Input Your Number:\nFor example: +916909137213 : `)));
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

        // Validate phone number
        if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
            console.log(chalk.bgBlack(chalk.redBright("Start with country code of your WhatsApp Number, Example: +916909137213")));
            rl.close();
            return;
        }

        setTimeout(async () => {
            let code = await LinucxMDInc.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(chalk.black(chalk.bgGreen(`Your Pairing Code: `)), chalk.black(chalk.white(code)));
        }, 3000);
    }

    LinucxMDInc.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect } = s;

        if (connection == "open") {
            await delay(1000 * 10);
            await LinucxMDInc.sendMessage(LinucxMDInc.user.id, { text: `🪀Support/Contact Developer\n\n⎆Donate: https://saweria.co/YUSUP909\n⎆WhatsApp Gc1: https://chat.whatsapp.com/Kjm8rnDFcpb04gQNSTbW2d\n⎆WhatsApp Pm: https://wa.me/6283897390164\n⎆Instagram: https://instagram.com/yusupk._\n⎆GitHub: https://github.com/NeofetchNpc/\n\nThank You For Using This Sc` });
            let sessionLinucx = fs.readFileSync('./sessions/creds.json');
            await delay(1000 * 2);
            const linucxses = await LinucxMDInc.sendMessage(LinucxMDInc.user.id, { document: sessionLinucx, mimetype: `application/json`, fileName: `creds.json` });
            await LinucxMDInc.sendMessage(LinucxMDInc.user.id, { text: `⚠️Do not share this file with anybody⚠️\n\n┌─❖\n│ Ohayo 😽\n└┬❖  \n┌┤✑  Thanks for using LinucxMD Pair Code!\n│└────────────┈ ⳹\n│© 2024 NeastooID\n└─────────────────┈ ⳹\n\n` }, { quoted: linucxses });
            await delay(1000 * 2);
            process.exit(0);
        }

        if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
            qr();
        }
    });

    LinucxMDInc.ev.on('creds.update', saveCreds);
    LinucxMDInc.ev.on("messages.upsert", () => { });
}

qr();

process.on('uncaughtException', function (err) {
    let e = String(err);
    if (e.includes("Socket connection timeout")) return;
    if (e.includes("rate-overlimit")) return;
    if (e.includes("Connection Closed")) return;
    if (e.includes("Timed Out")) return;
    if (e.includes("Value not found")) return;
    console.log('Caught exception: ', err);
});
