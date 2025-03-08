const config = require("../config");
const COOLDOWN = {};

module.exports = (sock) => {
    sock.ev.on("messages.upsert", async (m) => {
        const message = m.messages[0];
        const senderJID = message.key.remoteJid; // Group ID
        const sender = message.key.participant || senderJID; // Sender's JID

        // Skip non-group messages
        if (!senderJID) return;

        if (
            message.message?.conversation?.startsWith(`${config.BOT_PREFIX}tag_all`)
        ) {
            // Checking for Cooldown
            const now = Date.now();

            if (COOLDOWN[senderJID] && now < COOLDOWN[senderJID]) {
                const remaining = Math.ceil((COOLDOWN[senderJID] - now) / 1000);
                await sock.sendMessage(senderJID, {
                    text: `⏳ *Command is on cooldown!* Try again in *${remaining}* seconds.`,
                });
                return;
            }

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

            // Update Cooldown
            COOLDOWN[senderJID] = now + 120 * 1000;

            const members = group_metadata.participants.map((p) => p.id);
            const names = group_metadata.participants.map(
                (p) => p.name || p.id.split("@")[0],
            );

            const message_to_send = `*🔔 Tag semua member di grup ini 🔔*

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
};
