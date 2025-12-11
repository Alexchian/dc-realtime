// !!!!!server.js — DC Realtime HTTP Signaling Proxy (NEW API 2025)
import http from "http";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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
  req.on("data", (chunk) => (body += chunk));

  req.on("end", async () => {
    try {
      const offerSDP = body;

      // Create a REAL realtime session
      const session = await client.realtime.sessions.create({
        model: "gpt-4o-realtime-preview",
        voice: "cedar",
        format: "webrtc"
      });

      // Get SDP answer from OpenAI
      const answer = await session.sendSDP(offerSDP);

      res.writeHead(200, { "Content-Type": "application/sdp" });
      res.end(answer);

    } catch (err) {
      console.error("❌ ERROR:", err);
      res.writeHead(500);
      res.end("ERROR");
    }
  });
});

server.listen(PORT, () =>
  console.log(`🚀 Realtime Server running on port ${PORT}`)
);
