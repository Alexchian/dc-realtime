// !!! server.js — DC Realtime WebRTC Signaling Proxy (OpenAI SDK v6.x)

const http = require("http");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 3001;

http
  .createServer(async (req, res) => {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "POST, GET, OPTIONS"
    );
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
    req.on("data", (c) => (body += c));

    req.on("end", async () => {
      try {
        const offerSDP = body;

        // === New: create realtime session via new SDK v6 ===
        const session = await client.realtime.sessions.create({
          model: "gpt-4o-realtime-preview",
          voice: "cedar",
          modalities: ["audio", "text"],
          format: "webrtc",
        });

        // === new API call to exchange SDP ===
        const answer = await client.realtime.sessions.exchange(
          session.id,
          {
            sdp: offerSDP,
          }
        );

        const answerSDP = answer.sdp;

        // === return SDP answer ===
        res.writeHead(200, {
          "Content-Type": "application/sdp",
        });
        res.end(answerSDP);
      } catch (err) {
        console.error("❌ SERVER ERROR:", err);
        res.writeHead(500);
        res.end("ERROR");
      }
    });
  })
  .listen(PORT, () =>
    console.log(`🚀 Realtime server running on port ${PORT}`)
  );
