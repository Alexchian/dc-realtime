// index.js — DC Realtime WebRTC Signaling Server (SDK 3.3.0)
const http = require("http");
const dotenv = require("dotenv");
dotenv.config();

const OpenAI = require("openai");

// ✔ Правильная инициализация SDK 3.3.0 (НЕ через new)
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const PORT = process.env.PORT || 8080;

http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  // Мы принимаем только POST /offer
  if (req.url !== "/offer" || req.method !== "POST") {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Not Found");
  }

  let body = "";
  req.on("data", chunk => body += chunk);

  req.on("end", async () => {
    try {
      const offerSDP = body;

      // ✔ ВАЖНО: WebRTC Realtime API в SDK 3.3.0
      const session = await client.realtime.sessions.create({
        model: "gpt-4o-realtime-preview-latest",  // рабочая модель для WebRTC
        voice: "cedar",
        format: "webrtc"
      });

      // ✔ Отправляем offer → получаем answer
      const answerSDP = await session.sendSDP(offerSDP);

      res.writeHead(200, { "Content-Type": "application/sdp" });
      res.end(answerSDP);

    } catch (err) {
      console.error("❌ REALTIME ERROR:", err);
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("ERROR");
    }
  });

}).listen(PORT, () => {
  console.log(`🚀 WebRTC Signaling Server running on port ${PORT}`);
});
