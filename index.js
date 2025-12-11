// index.js — DC Realtime Signaling Proxy (SDK 6.10.0, REST approach)
const http = require("http");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PORT = process.env.PORT || 8080;
const LOG_DIR = path.join(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
const LOG_FILE = path.join(LOG_DIR, `conversation-${Date.now()}.txt`);

function logLine(obj) {
  const line = `[${new Date().toISOString()}] ${typeof obj === "string" ? obj : JSON.stringify(obj)}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

http.createServer(async (req, res) => {
  // ✅ CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // или конкретный домен
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.url !== "/offer" || req.method !== "POST") {
    res.writeHead(404);
    return res.end("Not Found");
  }

  let body = "";
  req.on("data", chunk => (body += chunk));
  req.on("end", async () => {
    try {
      const offerSDP = body;
      logLine({ type: "incoming_sdp_offer", length: offerSDP.length });

      // Создаём realtime‑сессию через REST
      const session = await client.post("/v1/realtime/sessions", {
        body: {
          model: "gpt-4o-realtime-preview-latest",
          voice: "cedar",
          format: "webrtc",
        },
      });

      logLine({ type: "session_created", session });

      // ⚠️ В SDK 6.10.0 нет sendSDP — обмен SDP делается напрямую:
      // Отправляем оффер в OpenAI и получаем answer
      const answer = await client.post("/v1/realtime/sdp", {
        body: {
          session_id: session.id,
          sdp: offerSDP,
        },
      });

      logLine({ type: "outgoing_sdp_answer", length: answer.sdp.length });

      // Возвращаем чистый SDP‑answer
      res.writeHead(200, { "Content-Type": "application/sdp" });
      res.end(answer.sdp);
    } catch (err) {
      console.error("❌ REALTIME ERROR:", err);
      logLine({ type: "error", error: String(err?.stack || err) });
      res.writeHead(500);
      res.end("ERROR");
    }
  });
}).listen(PORT, () => {
  console.log(`🚀 DC Realtime Signaling Server listening on port ${PORT}`);
  logLine({ type: "server_start", port: PORT });
});
