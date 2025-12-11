//  ! server.js — OpenAI SDK v6.x Realtime WebRTC Signaling Proxy

const http = require("http");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 3001;

http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== "POST" || req.url !== "/offer") {
    res.writeHead(404);
    return res.end("Not Found");
  }

  let body = "";
  req.on("data", chunk => body += chunk);

  req.on("end", async () => {
    try {
      const offerSDP = body;

      // === NEW SDK v6: Realtime session is created via beta.realtime
      const session = await client.beta.realtime.sessions.create({
        model: "gpt-4o-realtime-preview",
        voice: "cedar",
        modalities: ["audio", "text"],
        format: "webrtc",
      });

      // === NEW SDK v6: WebRTC SDP exchange
      const answer = await client.beta.realtime.sessions.exchange(
        session.id,
        { sdp: offerSDP }
      );

      const answerSDP = answer.sdp;

      res.writeHead(200, { "Content-Type": "application/sdp" });
      res.end(answerSDP);

    } catch (err) {
      console.error("❌ REALTIME ERROR:", err);
      res.writeHead(500);
      res.end("ERROR");
    }
  });

}).listen(PORT, () =>
  console.log(`🚀 Realtime server running on port ${PORT}`)
);
