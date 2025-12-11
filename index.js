// index.js — DC Realtime Signaling Proxy (SDK 6.10.0, REST via fetch)
const http = require("http");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const PORT = process.env.PORT || 8080;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY");
  process.exit(1);
}

const LOG_DIR = path.join(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
const LOG_FILE = path.join(LOG_DIR, `conversation-${Date.now()}.txt`);

function logLine(obj) {
  try {
    const line = `[${new Date().toISOString()}] ${typeof obj === "string" ? obj : JSON.stringify(obj)}\n`;
    fs.appendFileSync(LOG_FILE, line);
  } catch (e) {
    console.error("Logger error:", e);
  }
}

async function createRealtimeSession() {
  const resp = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview-latest",
      voice: "cedar",
      format: "webrtc",
    }),
  });

  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch {
    throw new Error(`Session create returned non-JSON: ${text}`);
  }
  if (!resp.ok) {
    throw new Error(`Session create failed: ${resp.status} ${resp.statusText} :: ${text}`);
  }
  if (!json.id) {
    throw new Error(`Session JSON missing id: ${text}`);
  }
  return json;
}

async function exchangeSDP(sessionId, offerSDP) {
  const resp = await fetch("https://api.openai.com/v1/realtime/sdp", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      sdp: offerSDP,
    }),
  });

  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch {
    throw new Error(`SDP exchange returned non-JSON: ${text}`);
  }
  if (!resp.ok) {
    throw new Error(`SDP exchange failed: ${resp.status} ${resp.statusText} :: ${text}`);
  }
  if (!json.sdp || typeof json.sdp !== "string") {
    throw new Error(`SDP answer missing sdp field: ${text}`);
  }
  return json.sdp;
}

http.createServer(async (req, res) => {
  // CORS
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

  let body = "";
  req.on("data", chunk => (body += chunk));
  req.on("end", async () => {
    try {
      const offerSDP = body || "";
      logLine({ type: "incoming_sdp_offer", preview: offerSDP.slice(0, 40) });

      if (!offerSDP.startsWith("v=")) {
        throw new Error("Incoming offer SDP does not start with 'v=' — invalid SDP");
      }

      // 1) Create session
      const session = await createRealtimeSession();
      logLine({ type: "session_created", id: session.id });

      // 2) Exchange SDP
      const answerSDP = await exchangeSDP(session.id, offerSDP);
      logLine({ type: "sdp_answer_preview", preview: answerSDP.slice(0, 40) });

      if (!answerSDP.startsWith("v=")) {
        throw new Error("Answer SDP does not start with 'v=' — invalid SDP from upstream");
      }

      // 3) Return pure SDP answer
      res.writeHead(200, { "Content-Type": "application/sdp" });
      return res.end(answerSDP);
    } catch (err) {
      console.error("❌ REALTIME ERROR:", err);
      logLine({ type: "error", error: String(err?.stack || err) });
      res.writeHead(500, { "Content-Type": "text/plain" });
      return res.end("ERROR");
    }
  });
}).listen(PORT, () => {
  console.log(`🚀 DC Realtime Signaling Server listening on port ${PORT}`);
  logLine({ type: "server_start", port: PORT });
});
