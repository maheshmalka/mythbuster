const Anthropic = require("@anthropic-ai/sdk");

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

module.exports = async function (context, req) {
  const { myth } = req.body || {};

  if (!myth) {
    context.res = { status: 400, body: { error: "myth is required" } };
    return;
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Fact-check this myth or claim: "${myth}"` }],
    });

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: message,
    };
  } catch (err) {
    context.res = {
      status: err.status || 500,
      body: { error: err.message },
    };
  }
};
