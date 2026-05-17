import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const port = Number(process.env.PORT || 5190);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  });
  res.end(JSON.stringify(payload));
}

async function parseBody(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function outputText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) parts.push(content.text);
      if (content.type === "text" && content.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

async function runOpenAI(req, res) {
  try {
    const body = await parseBody(req);
    const apiKey = process.env.OPENAI_API_KEY || body.apiKey;

    if (!apiKey) {
      sendJson(res, 400, { error: "Missing OPENAI_API_KEY or temporary API key." });
      return;
    }

    const instructions = `You are Nexus, an executive AI operations analyst.
Review the workspace snapshot and produce a concise, board-ready memo.
Include operational risks, agent actions, priorities, blockers, and next decisions.
Be specific and use markdown headings.`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: body.model || "gpt-4.1-mini",
        instructions,
        input: JSON.stringify(body.workspace || {}, null, 2),
        temperature: 0.25,
        max_output_tokens: 1400
      })
    });

    const data = await response.json();
    if (!response.ok) {
      sendJson(res, response.status, { error: data.error?.message || "OpenAI request failed" });
      return;
    }

    sendJson(res, 200, {
      text: outputText(data),
      model: body.model || "gpt-4.1-mini",
      usage: data.usage || null
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Unexpected server error" });
  }
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const normalizedPath = normalize(join(publicDir, requested));

  if (!normalizedPath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const file = await readFile(normalizedPath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[extname(normalizedPath)] || "application/octet-stream"
    });
    res.end(file);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.url === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      hasServerKey: Boolean(process.env.OPENAI_API_KEY),
      api: "OpenAI Responses API"
    });
    return;
  }

  if (req.url === "/api/brief" && req.method === "POST") {
    await runOpenAI(req, res);
    return;
  }

  if (req.method === "GET") {
    await serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
}).listen(port, () => {
  console.log(`Nexus AI Command Center running at http://localhost:${port}`);
});
