// Proves the LLM agent path actually works end-to-end against an
// OpenAI-compatible endpoint — without any paid key — by pointing
// LLM_BASE_URL at a local mock. Swap in a real Groq key and the same code path
// hits Llama 3.3. (The money math still never touches the LLM.)
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { extractIntentLLM, llmConfigured } from "@/lib/agent/llm";

test("LLM intent extraction calls an OpenAI-compatible endpoint and parses JSON", async () => {
  let sawAuth = false;
  let sawPath = "";
  const server = http.createServer((req, res) => {
    sawPath = req.url || "";
    sawAuth = Boolean(req.headers["authorization"]);
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const content = JSON.stringify({
        crop: "onion",
        quantityQuintals: 80,
        locationText: "Dewas",
        fpo: false,
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ choices: [{ message: { content } }] }));
    });
  });
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as { port: number }).port;
  process.env.LLM_BASE_URL = `http://127.0.0.1:${port}`;
  try {
    assert.equal(llmConfigured(), true);
    const intent = await extractIntentLLM("mujhe bechna hai, samajh lo");
    assert.equal(intent?.crop, "onion");
    assert.equal(intent?.quantityQuintals, 80);
    assert.equal(intent?.locationText, "Dewas");
    assert.equal(sawPath, "/chat/completions");
    assert.equal(sawAuth, true);
  } finally {
    delete process.env.LLM_BASE_URL;
    await new Promise<void>((r) => server.close(() => r()));
  }
});

test("bad upstream (500) → returns null, caller falls back to rules", async () => {
  const server = http.createServer((_req, res) => {
    res.writeHead(500);
    res.end("boom");
  });
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as { port: number }).port;
  process.env.LLM_BASE_URL = `http://127.0.0.1:${port}`;
  try {
    const intent = await extractIntentLLM("50 quintal wheat at Rau");
    assert.equal(intent, null);
  } finally {
    delete process.env.LLM_BASE_URL;
    await new Promise<void>((r) => server.close(() => r()));
  }
});
