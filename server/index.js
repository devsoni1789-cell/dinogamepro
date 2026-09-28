import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json({ limit: "12mb" }));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env["Gemini API Key"];
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

if (!GEMINI_API_KEY) console.warn("\n⚠️ GEMINI_API_KEY is not set. Add it in Railway Variables.\n");

function cleanJson(text) {
  return String(text || "").replace(/\`\`\`json/gi, "").replace(/\`\`\`/g, "").trim();
}

async function callGemini(contents, maxOutputTokens = 1200) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(MODEL) + ":generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: maxOutputTokens,
          responseMimeType: "application/json"
        }
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || JSON.stringify(data);
    throw new Error("Gemini API " + response.status + ": " + message);
  }

  return data?.candidates?.[0]?.content?.parts
    ?.map(part => part.text || "")
    .filter(Boolean)
    .join("\n") || "";
}

const ANALYSIS_INSTRUCTIONS = `You are a professional fashion stylist looking at one photo a client uploaded of themselves.

Analyze ONLY styling-relevant visible traits: face shape, hair length/texture/style, skin-tone-compatible color palette, apparent build/proportions in purely visual-styling terms, and current visual style.

Strict rules:
- Never infer or mention age, weight, health, ethnicity, race, or medical/biometric details.
- Never judge attractiveness or make negative appearance judgments.
- Use warm, practical, confidence-building language.
- If the photo is unclear, low quality, or doesn't clearly show a person, set "usable" to false and explain briefly.

Respond with ONLY compact JSON:
{
  "usable": true,
  "note": "",
  "faceShape": "e.g. oval",
  "faceShapeConfidence": 0.8,
  "hairstyle": "short description of current hair",
  "proportions": "short visual-styling description",
  "skinToneUndertone": "warm | cool | neutral",
  "bestColors": ["navy","olive","cream","burgundy","charcoal"],
  "existingStyle": "one short phrase",
  "summary": "2-3 sentence warm, specific stylist summary"
}`;

function occasionInstructions(profile, occasion, another) {
  let prompt = `You are a personal stylist. Here is your client's style profile, derived from their photo:
${JSON.stringify(profile)}

They want outfit ideas for this occasion: "${occasion}".

Generate exactly 3 distinct, complete outfits using these categories: t-shirt, shirt, trousers, jeans, cargo pants, jacket, shoes, watch, sunglasses/glasses, and one other accessory.
Each outfit needs at minimum a top, bottom, and shoes.

Ground every "why" explanation in specifics from the profile and occasion. Keep each "why" to 1-2 sentences.

Also suggest one hairstyle direction, one eyewear direction, and one accessory approach.

Respond with ONLY compact JSON:
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
Omit item keys that don't apply.`;
  if (another) prompt += "\nGenerate 3 genuinely different looks from previous suggestions.";
  return prompt;
}

app.post("/api/analyze", async (req, res) => {
  try {
    const { imageBase64, mediaType } = req.body;
    if (!imageBase64 || !mediaType) {
      return res.status(400).json({ error: "imageBase64 and mediaType are required" });
    }

    const contents = [{
      role: "user",
      parts: [
        { inline_data: { mime_type: mediaType, data: imageBase64 } },
        { text: ANALYSIS_INSTRUCTIONS }
      ]
    }];

    const parsed = JSON.parse(cleanJson(await callGemini(contents, 1200)));
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to analyze photo. Check the Gemini API key and server logs." });
  }
});

app.post("/api/outfits", async (req, res) => {
  try {
    const { profile, occasion, another } = req.body;
    if (!profile || !occasion) {
      return res.status(400).json({ error: "profile and occasion are required" });
    }

    const contents = [{
      role: "user",
      parts: [{ text: occasionInstructions(profile, occasion, Boolean(another)) }]
    }];

    const parsed = JSON.parse(cleanJson(await callGemini(contents, 1400)));
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate outfits. Check the Gemini API key and server logs." });
  }
});

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, aiConfigured: Boolean(GEMINI_API_KEY), provider: "Google Gemini", model: MODEL })
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => console.log("Stylist server running on port " + PORT));


const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";

app.post("/api/try-on", async (req, res) => {
  try {
    const { imageBase64, mediaType, outfit, occasion, hairstyle, eyewear, accessory } = req.body;
    if (!imageBase64 || !mediaType || !outfit) {
      return res.status(400).json({ error: "imageBase64, mediaType and outfit are required" });
    }

    const outfitText = [
      "Top: " + (outfit.top || "not specified"),
      "Bottom: " + (outfit.bottom || "not specified"),
      "Outerwear: " + (outfit.outerwear || "none"),
      "Shoes: " + (outfit.shoes || "not specified"),
      "Watch: " + (outfit.watch || "none"),
      "Eyewear: " + (outfit.eyewear || eyewear || "none"),
      "Accessory: " + (outfit.accessory || accessory || "none"),
      "Hairstyle: " + (hairstyle || "keep a neat hairstyle that suits the person")
    ].join("\n");

    const prompt = `Create a photorealistic "this is how I would look after getting ready" fashion preview.

Use the uploaded person as the same person. Preserve their facial identity, natural skin appearance, hair characteristics, body proportions, and overall recognizable appearance. Do not create a different person.

Dress the person in this exact recommended outfit:
${outfitText}

Occasion: ${occasion || "everyday"}
Show a realistic full-body or three-quarter-body fashion photo with natural lighting, believable fabric fit, realistic hands, realistic clothing details, and a clean modern background. Apply the recommended hairstyle and accessories naturally.

Do not add text, labels, collages, outfit boards, or before/after panels. This must be a single realistic photo of the person wearing the recommended look.`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        input: [
          { type: "image", mime_type: mediaType, data: imageBase64 },
          { type: "text", text: prompt }
        ],
        response_format: {
          type: "image",
          mime_type: "image/jpeg",
          aspect_ratio: "3:4",
          image_size: "1K"
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data?.error?.message || JSON.stringify(data);
      throw new Error("Gemini image API " + response.status + ": " + message);
    }

    let image = data?.output_image?.data;
    let mime = data?.output_image?.mime_type || "image/jpeg";

    if (!image && Array.isArray(data?.steps)) {
      for (const step of data.steps) {
        if (step?.type === "model_output" && Array.isArray(step.content)) {
          const block = step.content.find(item => item?.type === "image" && item?.data);
          if (block) {
            image = block.data;
            mime = block.mime_type || mime;
            break;
          }
        }
      }
    }

    if (!image) throw new Error("Gemini returned no generated image");
    res.json({ imageBase64: image, mediaType: mime });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create the outfit preview. Check the Gemini image model/API access and Railway logs." });
  }
});
