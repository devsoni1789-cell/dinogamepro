const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://dinogamepro-backend-production.up.railway.app";

async function request(path, body) {
  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function analyzePhoto(imageBase64, mediaType) {
  return request("/api/analyze", {imageBase64, mediaType});
}

export function generateOutfits(profile, occasion, another=false) {
  return request("/api/outfits", {profile, occasion, another});
}
