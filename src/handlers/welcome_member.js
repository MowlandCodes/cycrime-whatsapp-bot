module.exports = (sock) => {
    sock.ev.on("group-participants.update", async (update) => {
        console.log(`Event Data: ${update}`);
        if (update.action === "add") {
            // To handle if there is a new member joined the group
            const new_members = update.participants;
            const group_jid = update.id;

            try {
                const group_metadata = await sock.groupMetadata(group_jid);
                const group_name = group_metadata.subject; // Stands for group name

                const welcome_message = `👋 *Selamat Datang di CyCrime Community!* 👋

Komunitas IT yang fokus pada *Cyber Security 🔒 & Programming 💻.Beginner - friendly,* semua dipersilakan bergabung!

📌 *Struktur Komunitas* :

1️⃣ *CyCrime Community</>* : Diskusi umum seputar IT, Cyber Security, & Programming.
2️⃣ *Ngoding Santuy* : Sharing & belajar coding dengan santai.
3️⃣ *CyCrime Promosi* : Media promosi jasa, lowongan kerja, & info bermanfaat lainnya.

💬 Mari Berdiskusi & Berkembang Bersama!
*Silahkan Perkenalkan dirimu dengan format berikut* :

✅ *Nama:*
✅ *Domisili:*
✅ *Minat:*
✅ *Harapan di grup ini:*

🚀 *Stay active & enjoy the journey!* `;

                console.log(welcome_message);
                console.log("\n\n\x1b[92mMessage sent successfully!\x1b[0m");
            } catch (err) {
                console.log(
                    `\n\x1b[1; 91mError while sending welcome message: \x1b[93m${err} \x1b[0m`,
                );
            }
        }
    });
};
