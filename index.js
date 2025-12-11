const http = require("http");
const dotenv = require("dotenv");
dotenv.config();

const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PORT = process.env.PORT || 8080;

http.createServer(async (req, res) => {
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

      // Создаём realtime‑сессию
      const session = await client.post("/v1/realtime/sessions", {
        body: {
          model: "gpt-4o-realtime-preview-latest",
          voice: "cedar",
          format: "webrtc",
        },
      });

      // В ответе будет client_secret и другие данные
      // Здесь ты можешь вернуть их браузеру вместе с SDP‑answer
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(session));
    } catch (err) {
      console.error("❌ REALTIME ERROR:", err);
      res.writeHead(500);
      res.end("ERROR");
    }
  });
}).listen(PORT, () =>
  console.log(`🚀 DC Realtime Signaling Server listening on port ${PORT}`)
);
