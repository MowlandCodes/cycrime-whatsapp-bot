const {
    BufferJSON,
    useMultiFileAuthState,
    DisconnectReason,
    makeWASocket,
} = require("@whiskeysockets/baileys");

const fs = require("fs");

const tag_all = require("./handlers/tag_all");
const welcome_member = require("./handlers/welcome_member");

async function connect_to_whatsapp() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("Generate QR");
            console.log(qr);
        }

        if (connection === "close") {
            const should_reconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;

            console.log(
                `Connection closed due to ${lastDisconnect?.error}. Reconnect: ${should_reconnect}`,
            );

            if (should_reconnect) {
                connect_to_whatsapp();
            }
        } else if (connection === "open") {
            console.log(
                "\n\n\x1b[1;92mConnection opened, \x1b[1;93mWelcome to CyCrime Whatsapp Bot!\x1b[0m",
            );
        }
    });

    // Handle incoming messages
    tag_all(sock);

    // Handle group update
    welcome_member(sock);

    sock.ev.on("creds.update", saveCreds); // Save the credentials
}

connect_to_whatsapp();
