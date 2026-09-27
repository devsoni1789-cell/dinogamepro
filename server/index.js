import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json({ limit: "12mb" }));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-6";

if (!ANTHROPIC_API_KEY) console.warn("\n⚠️ ANTHROPIC_API_KEY is not set. Copy server/.env.example to server/.env and add your key.\n");

function stripFences(text) {
  return text.replace(/\`\`\`json/gi, "").replace(/\`\`\`/g, "").trim();
}

async function callClaude(content, maxTokens = 1000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages: [{ role: "user", content }] }),
  });
  if (!res.ok) throw new Error("Anthropic API " + res.status + ": " + await res.text());
  const data = await res.json();
  return data.content.map((b) => (b.type === "text" ? b.text : "")).filter(Boolean).join("\n");
}

const ANALYSIS_INSTRUCTIONS = `You are a professional fashion stylist looking at one photo a client uploaded of themselves.

Analyze ONLY styling-relevant visual traits: face shape, hair length/texture/style, skin-tone-compatible color palette, apparent build/proportions in purely visual-styling terms (e.g. "average build, balanced proportions" — nothing clinical), and their current visual style (colors, fit, formality they already gravitate to).

Strict rules:
- Never infer or mention age, weight, health, ethnicity, or any medical/biometric detail.
- Never say anything that could read as a judgment about the person's appearance.
- Use warm, practical, confidence-building language.
- If the photo is unclear, low quality, or doesn't clearly show a person, set "usable" to false and explain briefly in "note".

Respond with ONLY compact JSON, no markdown fences, matching exactly this shape:
{
  "usable": true,
  "note": "",
  "faceShape": "e.g. oval",
  "faceShapeConfidence": 0.8,
  "hairstyle": "short description of current hair",
  "proportions": "short visual-styling description, e.g. balanced shoulders and torso-leg ratio",
  "skinToneUndertone": "warm | cool | neutral",
  "bestColors": ["navy","olive","cream","burgundy","charcoal"],
  "existingStyle": "one short phrase, e.g. relaxed smart-casual",
  "summary": "2-3 sentence warm, specific summary a stylist would say to this client"
}`;

function occasionInstructions(profile, occasion, another) {
  let prompt = `You are a personal stylist. Here is your client's style profile, derived from their photo:
${JSON.stringify(profile)}

They want outfit ideas for this occasion: "${occasion}".

Generate exactly 3 distinct, complete outfits using ONLY items from this category list: t-shirt, shirt, trousers, jeans, cargo pants, jacket, shoes, watch, sunglasses/glasses, and one other accessory (belt, cap, bag, bracelet, or similar).
Not every category needs to appear in every outfit — pick what fits the occasion and the client's profile, but each outfit needs at minimum a top, a bottom, and shoes.

Ground every "why" explanation in specifics from their profile (face shape, proportions, skin tone/undertone, existing style) and the occasion — never generic. Keep each "why" to 1-2 sentences, plain and specific, no clichés.

Also suggest one hairstyle direction, one eyewear direction, and one accessory approach that suits their profile overall (not per-outfit).

Respond with ONLY compact JSON, no markdown fences, matching exactly this shape:
{
  "outfits": [
    {
      "title": "short evocative name",
      "items": { "top": "", "bottom": "", "outerwear": "", "shoes": "", "watch": "", "eyewear": "", "accessory": "" },
      "why": "",
      "colorNotes": ""
    }
  ],
  "hairstyleSuggestion": "",
  "eyewearSuggestion": "",
  "accessorySuggestion": ""
}
Omit any item key that doesn't apply to a given outfit rather than leaving it empty.`;
  if (another) prompt += "\n\nThe client has seen outfit ideas before — generate 3 genuinely different looks this time, same rules.";
  return prompt;
}

app.post("/api/analyze", async (req, res) => {
  try {
    const { imageBase64, mediaType } = req.body;
    if (!imageBase64 || !mediaType) return res.status(400).json({ error: "imageBase64 and mediaType are required" });
    const content = [
      { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
      { type: "text", text: ANALYSIS_INSTRUCTIONS },
    ];
    const parsed = JSON.parse(stripFences(await callClaude(content, 1000)));
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to analyze photo. Check server logs and your API key." });
  }
});

app.post("/api/outfits", async (req, res) => {
  try {
    const { profile, occasion, another } = req.body;
    if (!profile || !occasion) return res.status(400).json({ error: "profile and occasion are required" });
    const parsed = JSON.parse(stripFences(await callClaude([{ type: "text", text: occasionInstructions(profile, occasion, Boolean(another)) }], 1000)));
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate outfits. Check server logs and your API key." });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("Stylist server running on http://localhost:" + PORT));
