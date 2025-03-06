const {
    BufferJSON,
    useMultiFileAuthState,
    DisconnectReason,
    makeWASocket,
} = require("@whiskeysockets/baileys");

const fs = require("fs");

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
            console.log("Connection opened, Welcome to CyCrime Whatsapp Bot!");
        }
    });

    sock.ev.on("group-participants.update", async (update) => {
        console.log(`Event Data: ${update}`);
        if (update.action === "add") {
            // To handle if there is a new member joined the group
            const new_members = update.participants;
            const group_jid = update.id;

            try {
                const group_metadata = await sock.groupMetadata(group_jid);
                const group_name = group_metadata.subject; // Stands for group name
            } catch (err) {
                console.log("Error while sending welcome message: ", err);
            }
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

connect_to_whatsapp();
