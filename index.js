// index.js — минимальный сервер для выдачи client_secret
const http = require("http");
const dotenv = require("dotenv");
dotenv.config();

const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    res.writeHead(404);
    return res.end("Not Found");
  }

  try {
    // создаём realtime‑сессию
    const session = await client.post("/v1/realtime/sessions", {
      body: {
        model: "gpt-4o-realtime-preview-latest",
        voice: "cedar",
        format: "webrtc",
      },
    });

    // возвращаем только нужное
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
