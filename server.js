// server.js — DC Realtime HTTP Signaling Proxy
const http = require("http");
const dotenv = require("dotenv");
const fetch = require("node-fetch");

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// Railway задаёт PORT автоматически, поэтому слушаем именно его
const PORT = process.env.PORT;

if (!OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY in environment");
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  // CORS заголовки
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Healthcheck endpoint
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }

  // Offer endpoint
  if (req.method === "POST" && req.url === "/offer") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        console.log("📨 Received SDP offer, length:", body.length);

        const oaiRes = await fetch(
          "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/sdp",
            },
            body,
          }
        );

        if (!oaiRes.ok) {
          const text = await oaiRes.text();
          console.error("❌ OpenAI error", oaiRes.status, text);
          res.writeHead(502, { "Content-Type": "text/plain" });
          res.end("OpenAI error: " + text);
          return;
        }

        const answerSdp = await oaiRes.text();
        console.log("✅ Got SDP answer, length:", answerSdp.length);

        res.writeHead(200, { "Content-Type": "application/sdp" });
        res.end(answerSdp);
      } catch (err) {
        console.error("❌ Server error:", err);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Server error");
      }
    });
    return;
  }

  // Fallback
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`🚀 DC Realtime Signaling Server listening on http://localhost:${PORT}`);
});
