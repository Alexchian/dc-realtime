// server.js — DC Realtime HTTP Signaling Proxy
const http = require("http");
const dotenv = require("dotenv");
const fetch = require("node-fetch"); // нужно добавить в package.json

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 3001;

if (!OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY in .env");
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/offer") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        console.log("➡️  Received SDP offer from browser, length:", body.length);

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
          console.error("❌ OpenAI /v1/realtime error", oaiRes.status, text);
          res.writeHead(502, { "Content-Type": "text/plain" });
          res.end("OpenAI error: " + text);
          return;
        }

        const answerSdp = await oaiRes.text();
        console.log("✅ Got SDP answer from OpenAI, length:", answerSdp.length);

        res.writeHead(200, { "Content-Type": "application/sdp" });
        res.end(answerSdp);
      } catch (err) {
        console.error("❌ Error talking to OpenAI:", err);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Server error");
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`🚀 DC Realtime Signaling Server listening on http://localhost:${PORT}`);
});
