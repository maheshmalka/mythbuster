const https = require("https");

const SYSTEM_PROMPT = `You are MythBuster AI — a rigorous fact-checker and myth debunker. When given a myth, claim, or question, you:

1. Clearly state whether the claim is: TRUE, FALSE, PARTIALLY TRUE, or MISLEADING
2. Explain the actual science/facts in 2-3 clear sentences
3. Give a brief historical/cultural origin of the myth if relevant
4. Provide exactly 3 real, credible research links in this format (use real, well-known sources):

VERDICT: [TRUE/FALSE/PARTIALLY TRUE/MISLEADING]
SUMMARY: [2-3 sentence explanation]
MYTH_ORIGIN: [One sentence on where this myth comes from]
LINKS:
- [Title of Source 1] | [Full URL]
- [Title of Source 2] | [Full URL]
- [Title of Source 3] | [Full URL]

Always use authoritative sources: PubMed, Mayo Clinic, CDC, WHO, National Geographic, Snopes, NASA, Scientific American, Harvard Health, Nature, Science journals, Wikipedia for introductory context, etc. Make sure URLs are plausible and real-looking for these domains. Format your response exactly as described above — no markdown, no asterisks.`;

function callAnthropic(apiKey, myth) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Fact-check this myth or claim: "${myth}"` }],
    });

    const req = https.request(
      {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            reject(new Error("Failed to parse Anthropic response: " + data.slice(0, 200)));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

module.exports = async function (context, req) {
  try {
    const { myth } = req.body || {};

    if (!myth) {
      context.res = { status: 400, body: { error: "myth is required" } };
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      context.res = { status: 500, body: { error: "ANTHROPIC_API_KEY not configured" } };
      return;
    }

    const { status, body } = await callAnthropic(apiKey, myth);

    context.res = {
      status,
      headers: { "Content-Type": "application/json" },
      body,
    };
  } catch (err) {
    context.log("API error: " + err.message);
    context.res = { status: 500, body: { error: err.message } };
  }
};
