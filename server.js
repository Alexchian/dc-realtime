//!!! server.js — Realtime Signaling Proxy for OpenAI SDK 4.47.0 (WORKING)

const http = require("http");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
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
  req.on("data", chunk => body += chunk);

  req.on("end", async () => {
    try {
      const offerSDP = body;

      // ✔ WORKING REALTIME API for SDK 4.47.0
      const session = await client.realtime.sessions.create({
        model: "gpt-4o-realtime-preview",
        voice: "cedar",
        format: "webrtc"
      });

      const answerSDP = await session.sendSDP(offerSDP);

      res.writeHead(200, { "Content-Type": "application/sdp" });
      res.end(answerSDP);

    } catch (err) {
      console.error("❌ SERVER ERROR:", err);
      res.writeHead(500);
      res.end("ERROR");
    }
  });

});

server.listen(PORT, () =>
  console.log(`🚀 Realtime Server running on port ${PORT}`)
);
