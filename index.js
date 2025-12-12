// index.js — DC Realtime Voice WS Server (рабочий)
const http = require("http");
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 8080;

http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  // только POST /session
  if (req.url !== "/session" || req.method !== "POST") {
    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Not Found" }));
  }

  try {
    // создаём realtime-сессию
    const resp = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-latest",
        voice: "alloy",
        modalities: ["audio", "text"]
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(JSON.stringify(data));
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      client_secret: data.client_secret.value,
      session_id: data.id
    }));
  } catch (err) {
    console.error("❌ SESSION ERROR:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(err) }));
  }

}).listen(PORT, () =>
  console.log(`🚀 WS Voice Server running on ${PORT}`)
);
