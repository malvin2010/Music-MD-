// index.js
// MALVIN C MUSIC WhatsApp Multi-Device Bot
// Made by handsome tech (Zimbabwe)
require("dotenv").config();
const { default: makeWASocket, useMultiFileAuthState, makeInMemoryStore, Browsers } = require("@whiskeysockets/baileys");
const fs = require("fs-extra");
const path = require("path");

const SESSION_DIR = "./sessions";
const SESSION_FILE = "malvinc-music";

(async () => {
\tconst store = makeInMemoryStore({ logger: console });
\tawait fs.ensureDir(SESSION_DIR);

\tconst { state, saveCreds } = await useMultiFileAuthState(path.join(SESSION_DIR, SESSION_FILE));

\tconst sock = makeWASocket({
\t\tprintQRInTerminal: false,
\t\tauth: state,
\t\tbrowser: Browsers.ubuntu("Chrome"),
\t});

\tstore.bind(sock.ev);

\tlet pairingCodeRequested = false;
\tlet pendingPhone = null;

\tsock.ev.on("connection.update", async (update) => {
\t\tconst { connection, lastDisconnect, qr } = update;

\t\tif (connection === "close") {
\t\t\tconst shouldReconnect = new (require("@whiskeysockets/baileys").Boom)(
\t\t\t\tlastDisconnect.error
\t\t\t).output.statusCode !== 401;
\t\t\tif (shouldReconnect) {
\t\t\t\tconsole.log("Reconnecting...");
\t\t\t\tsetTimeout(() => sock.connect(), 3000);
\t\t\t}
\t\t} else if (connection === "open") {
\t\t\tconsole.log("✅ MALVIN C MUSIC connected!");
\t\t\tpairingCodeRequested = false;
\t\t\tpendingPhone = null;
\t\t}

\t\t// If we're not connected yet and no QR, request pairing code
\t\tif (
\t\t\t!qr &&
\t\t\tconnection !== "open" &&
\t\t\tconnection !== "connecting" &&
\t\t\tpairingCodeRequested &&
\t\t\tpendingPhone
\t\t) {
\t\t\ttry {
\t\t\t\tconst code = await sock.requestPairingCode(pendingPhone);
\t\t\t\tawait sock.sendMessage(pendingPhone + "@s.whatsapp.net", {
\t\t\t\t\ttext: `Pairing code for MALVIN C MUSIC:

${code}

Save this number: +263771234567 (example).`,
\t\t\t\t});
\t\t\t\tconsole.log("Pairing code sent to:", pendingPhone);
\t\t\t\tpairingCodeRequested = false;
\t\t\t\tpendingPhone = null;
\t\t\t} catch (err) {
\t\t\t\tconsole.log("Failed to send pairing code:", err.message);
\t\t\t\tsock.sendMessage(pendingPhone + "@s.whatsapp.net", {
\t\t\t\t\ttext:
\t\t\t\t\t\t"❌ Failed to generate pairing code. Please retry or restart MALVIN C MUSIC.

Made by handsome tech (Zimbabwe).",
\t\t\t\t});
\t\t\t\tpairingCodeRequested = false;
\t\t\t\tpendingPhone = null;
\t\t\t}
\t\t}
\t});

\tsock.ev.on("creds.update", saveCreds);

\tsock.ev.on("messages.upsert", async ({ messages }) => {
\t\tconst msg = messages[0];
\t\tif (!msg.message || msg.key.fromMe || msg.key.remoteJid === "status@broadcast") return;

\t\tconst text =
\t\t\tmsg.message?.conversation ||
\t\t\tmsg.message?.extendedTextMessage?.text ||
\t\t\t"";
\t\tconst sender = msg.key.remoteJid;
\t\tconst command = text.trim();

\t\tif (command.startsWith(".ping")) {
\t\t\tconst start = Date.now();
\t\t\tawait sock.sendMessage(sender, { text: "pong!" });
\t\t\tconst latency = Date.now() - start;
\t\t\tawait sock.sendMessage(sender, { text: `🏓 Latency: ${latency}ms` });
\t\t}

\t\tif (command.startsWith(".play ")) {
\t\t\tconst query = command.slice(6).trim();
\t\t\tif (!query) {
\t\t\t\treturn await sock.sendMessage(sender, {
\t\t\t\t\ttext: "Usage: .play <song name>",
\t\t\t\t});
\t\t\t}
\t\t\tawait sock.sendMessage(sender, {
\t\t\t\ttext: `MALVIN C MUSIC is fetching: "${query}"`,
\t\t\t});
\t\t\t// Here you can plug in a music API (e.g., YouTube, Spotify link fetcher, etc.)
\t\t}
\t});

\tsock.ev.on("messages.update", (updates) => {
\t\tupdates
\t\t\t.filter((update) => update.key && update.update.message)
\t\t\t.forEach((update) => {});
\t});

\t// --- Invite user to enter WhatsApp number (e.g., +263*******)
\t// In a real app you'd collect this via CLI or HTTP, but here we just log:
\tconsole.log("
");
\tconsole.log("MALVIN C MUSIC WhatsApp Multi-Device Bot");
\tconsole.log("Made by handsome tech (Zimbabwe)");
\tconsole.log("==========================================");
\tconsole.log("To register your phone:");
\tconsole.log("1. Send a WhatsApp message to this number with only:");
\tconsole.log("   .register +263771234567");
\tconsole.log("2. The bot will then send you a pairing code to that number.");
\tconsole.log("
");

\tsock.ev.on("messages.upsert", async ({ messages }) => {
\t\tconst msg = messages[0];
\t\tif (!msg.message || msg.key.fromMe || msg.key.remoteJid === "status@broadcast") return;

\t\tconst text =
\t\t\tmsg.message?.conversation ||
\t\t\tmsg.message?.extendedTextMessage?.text ||
\t\t\t"";
\t\tconst sender = msg.key.remoteJid;
\t\tconst senderUser = sender.split("@")[0];

\t\tconst registerMatch = text.trim().match(/^.registers+(+?d+)$/);
\t\tif (registerMatch) {
\t\t\tlet phone = registerMatch[1];

\t\t\tif (!phone.startsWith("+")) {
\t\t\t\tawait sock.sendMessage(sender, {
\t\t\t\t\ttext: "❌ Please include country code, e.g.: .register +263771234567",
\t\t\t\t});
\t\t\t\treturn;
\t\t\t}

\t\t\t// Convert to E164 (Baileys wants no + and only digits)
\t\t\tconst e164 = phone.replace(/D/g, ""); // Remove non‑digits

\t\t\tif (!/^d{10,15}$/.test(e164)) {
\t\t\t\tawait sock.sendMessage(sender, {
\t\t\t\t\ttext: "❌ Invalid phone number format. Example: +263771234567",
\t\t\t\t});
\t\t\t\treturn;
\t\t\t}

\t\t\tawait sock.sendMessage(sender, {
\t\t\t\ttext: `📩 Requesting pairing code for MALVIN C MUSIC...
Phone: ${phone}
Made by handsome tech (Zimbabwe).`,
\t\t\t});

\t\t\t// Baileys will emit "connection.update" with pairing code logic
\t\t\tpairingCodeRequested = true;
\t\t\tpendingPhone = e164;
\t\t}
\t});

\t// Start the bot
\tsock.connect();
})();
