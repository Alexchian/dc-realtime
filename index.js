const http = require("http");
const dotenv = require("dotenv");
dotenv.config();

const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PORT = process.env.PORT || 8080;

http.createServer(async (req, res) => {
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
      const session = await client.realtime.sessions.create({
        model: "gpt-4o-realtime-preview-latest",
        voice: "cedar",
        format: "webrtc"
      });

      const answerSDP = await session.sendSDP(body);

      res.writeHead(200, { "Content-Type": "application/sdp" });
      res.end(answerSDP);

    } catch (err) {
      console.error("❌ REALTIME ERROR:", err);
      res.writeHead(500);
      res.end("ERROR");
    }
  });

}).listen(PORT, () =>
  console.log(`🚀 WebRTC Signaling Server running on port ${PORT}`)
);
