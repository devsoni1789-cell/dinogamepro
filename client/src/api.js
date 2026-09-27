export async function analyzePhoto(imageBase64, mediaType) {
  const res = await fetch('/api/analyze', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({imageBase64, mediaType}) })
  if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Analysis failed')
  return res.json()
}
export async function generateOutfits(profile, occasion, another=false) {
  const res = await fetch('/api/outfits', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({profile,occasion,another}) })
  if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Outfit generation failed')
  return res.json()
}
