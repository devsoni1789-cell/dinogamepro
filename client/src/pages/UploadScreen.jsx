import React,{useState} from 'react'
import {PrimaryButton} from '../components/ui.jsx'
export default function UploadScreen({photoUrl,onFile,onAnalyze,error}) {
  const [dragOver,setDragOver]=useState(false)
  return <div>
    <p className="text-stone-500 text-sm mb-1">Personal stylist</p>
    <h2 className="font-display text-3xl leading-tight mb-3">Upload one photo. Get outfits made for you.</h2>
    <p className="text-stone-500 text-sm mb-6">A clear, front-facing photo in natural light works best.</p>
    <label onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);onFile(e.dataTransfer.files?.[0])}} className={'relative block rounded-3xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden aspect-[4/5] flex items-center justify-center '+(dragOver?'border-emerald-500 bg-emerald-50':'border-stone-300 bg-white')}>
      <input type="file" accept="image/*" className="sr-only" onChange={e=>onFile(e.target.files?.[0])}/>
      {photoUrl?<img src={photoUrl} alt="Your upload" className="w-full h-full object-cover"/>:<div className="text-center px-8"><div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C4A3B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M12 4l-4 4M12 4l4 4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg></div><p className="text-sm text-stone-700 font-medium mb-1">Tap to upload a photo</p><p className="text-xs text-stone-400">or drag one here</p></div>}
    </label>
    {photoUrl&&<label className="inline-block text-xs text-emerald-700 mt-3 underline underline-offset-2 cursor-pointer">Choose a different photo<input type="file" accept="image/*" className="sr-only" onChange={e=>onFile(e.target.files?.[0])}/></label>}
    {error&&<p className="text-sm text-red-700 mt-4">{error}</p>}
    <div className="mt-8 mb-8"><p className="text-xs text-stone-400 mb-2">For the best read</p><ul className="space-y-1.5 text-sm text-stone-600"><li>· Stand in natural light, facing the camera</li><li>· Keep the background simple</li><li>· Avoid heavy filters or sunglasses</li></ul></div>
    <PrimaryButton className="w-full" disabled={!photoUrl} onClick={onAnalyze}>Analyze my style</PrimaryButton>
    <p className="text-[11px] text-stone-400 text-center mt-3">Sent to your own server, which calls Claude with your API key. Nothing is stored.</p>
  </div>
}
