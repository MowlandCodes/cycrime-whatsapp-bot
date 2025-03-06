const {
    BufferJSON,
    useMultiFileAuthState,
    DisconnectReason,
    makeWASocket,
} = require("@whiskeysockets/baileys");

const fs = require("fs");

const COOLDOWN = {};

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
    sock.ev.on("messages.upsert", async (m) => {
        const message = m.messages[0];
        const senderJID = message.key.remoteJid;
        const sender = message.key.participant || senderJID;

        if (message.message?.conversation?.startsWith(".bot_tag_all")) {
            // Check whether the sender is a group admin
            const group_metadata = await sock.groupMetadata(senderJID);
            const is_admin = group_metadata.participants.some(
                (p) => p.id === sender && p.admin, // Check if the sender is an admin
            );

            if (!is_admin) {
                // Reject command from non-admin member
                await sock.sendMessage(senderJID, {
                    text: "🚫 *Command ini hanya bisa digunakan oleh admin!*",
                });
                return;
            }

            const members = group_metadata.participants.map((p) => p.id);
            const names = group_metadata.participants.map(
                (p) => p.name || p.id.split("@")[0],
            );

            const message_to_send = `*Tag semua member di grup ini*

${names.map((name, index) => `@${members[index].split("@")[0]} ( ${name} )`).join("\n")}

*Total Member grup ini* ==> *${members.length} Orang*`;

            try {
                await sock.sendMessage(senderJID, {
                    text: message_to_send,
                    contextInfo: {
                        mentionedJid: members, // Tag all Members in the group
                    },
                });
                console.log("\x1b[1;92mMessage sent successfully!\x1b[0m");
            } catch (err) {
                console.log(
                    "\x1b[1;91mError while sending message: \x1b[93m",
                    err,
                    "\x1b[0m",
                );
            }
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

                const welcome_message = `
👋 * Selamat Datang di CyCrime Community! * 👋

Komunitas IT yang fokus pada * Cyber Security 🔒 & Programming 💻.Beginner - friendly,* semua dipersilakan bergabung!

📌 * Struktur Komunitas * :

            1️⃣ * CyCrime Community</>* : Diskusi umum seputar IT, Cyber Security, & Programming.
2️⃣ * Ngoding Santuy * : Sharing & belajar coding dengan santai.
3️⃣ * CyCrime Promosi * : Media promosi jasa, lowongan kerja, & info bermanfaat lainnya.

💬 Mari Berdiskusi & Berkembang Bersama!
                * Silahkan Perkenalkan dirimu dengan format berikut * :

✅ * Nama:*
✅ * Domisili:*
✅ * Minat:*
✅ * Harapan di grup ini:*

🚀 * Stay active & enjoy the journey! * `;

                console.log(welcome_message);
                console.log("\n\n\x1b[92mMessage sent successfully!\x1b[0m");
            } catch (err) {
                console.log(
                    `\n\x1b[1; 91mError while sending welcome message: \x1b[93m${err} \x1b[0m`,
                );
            }
        }
    });

    sock.ev.on("creds.update", saveCreds); // Save the credentials
}

connect_to_whatsapp();
