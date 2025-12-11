// index.js — минимальный сервер для выдачи client_secret
const http = require("http");
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 8080;

http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.url !== "/offer" || req.method !== "POST") {
    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Not Found" }));
  }

  try {
    const resp = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-latest",
        voice: "cedar",
        format: "webrtc",
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Session create failed: ${resp.status} ${text}`);
    }

    const session = await resp.json();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      client_secret: session.client_secret?.value,
      id: session.id,
    }));
  } catch (err) {
    console.error("❌ REALTIME ERROR:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(err) }));
  }
}).listen(PORT, () =>
  console.log(`🚀 Server listening on port ${PORT}`)
);
