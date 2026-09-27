import React,{useState,useCallback} from 'react'
import {analyzePhoto,generateOutfits as fetchOutfits} from './api.js'
import {Spinner} from './components/ui.jsx'
import UploadScreen from './pages/UploadScreen.jsx'
import {ProfileScreen,OccasionScreen,ResultsScreen,DetailScreen} from './pages/Screens.jsx'
export default function App(){
 const [step,setStep]=useState('upload'),[photoUrl,setPhotoUrl]=useState(null),[photoBase64,setPhotoBase64]=useState(null),[photoMediaType,setPhotoMediaType]=useState(null),[profile,setProfile]=useState(null),[occasion,setOccasion]=useState(null),[customOccasion,setCustomOccasion]=useState(''),[outfitData,setOutfitData]=useState(null),[selectedOutfit,setSelectedOutfit]=useState(null),[error,setError]=useState(null)
 const handleFile=useCallback(file=>{if(!file||!file.type.startsWith('image/'))return;setError(null);const reader=new FileReader();reader.onload=()=>{const [,base64]=reader.result.split(',');setPhotoUrl(reader.result);setPhotoBase64(base64);setPhotoMediaType(file.type)};reader.readAsDataURL(file)},[])
 const runAnalysis=async()=>{setStep('analyzing');setError(null);try{const parsed=await analyzePhoto(photoBase64,photoMediaType);if(!parsed.usable){setError(parsed.note||"Couldn't get a clear read on that photo — try a well-lit, front-facing shot.");setStep('upload');return}setProfile(parsed);setStep('profile')}catch(e){setError(e.message||'Something went wrong analyzing the photo.');setStep('upload')}}
 const runGenerate=async(chosenOccasion,another=false)=>{setStep('generating');setError(null);try{const parsed=await fetchOutfits(profile,chosenOccasion,another);setOutfitData(parsed);setOccasion(chosenOccasion);setStep('results')}catch(e){setError(e.message||'Could not generate outfits just now.');setStep('occasion')}}
 const restart=()=>{setStep('upload');setPhotoUrl(null);setPhotoBase64(null);setPhotoMediaType(null);setProfile(null);setOccasion(null);setCustomOccasion('');setOutfitData(null);setSelectedOutfit(null);setError(null)}
 const effectiveOccasion=occasion==='Custom'?customOccasion:occasion
 const back=step==='profile'?()=>setStep('upload'):step==='occasion'?()=>setStep('profile'):step==='results'?()=>setStep('occasion'):step==='detail'?()=>setStep('results'):null
 return <div className="min-h-screen bg-stone-50 text-stone-900 font-sans"><div className="max-w-md mx-auto min-h-screen flex flex-col"><Header step={step} onBack={back} onRestart={step!=='upload'?restart:null}/><main className="flex-1 px-5 pb-10">
 {step==='upload'&&<UploadScreen photoUrl={photoUrl} onFile={handleFile} onAnalyze={runAnalysis} error={error}/>}
 {step==='analyzing'&&<Spinner label="Reading your photo for styling cues…"/>}
 {step==='profile'&&profile&&<ProfileScreen profile={profile} photoUrl={photoUrl} onContinue={()=>setStep('occasion')}/>}
 {step==='occasion'&&<OccasionScreen occasion={occasion} customOccasion={customOccasion} setCustomOccasion={setCustomOccasion} onPick={setOccasion} onGenerate={()=>runGenerate(effectiveOccasion)} error={error}/>}
 {step==='generating'&&<Spinner label="Putting together looks for you…"/>}
 {step==='results'&&outfitData&&<ResultsScreen data={outfitData} occasion={effectiveOccasion} onSelect={o=>{setSelectedOutfit(o);setStep('detail')}} onAnother={()=>runGenerate(effectiveOccasion,true)}/>}
 {step==='detail'&&selectedOutfit&&<DetailScreen outfit={selectedOutfit} onBack={()=>setStep('results')} onAnother={()=>runGenerate(effectiveOccasion,true)}/>}
 </main></div></div>
}
function Header({step,onBack,onRestart}){const titles={upload:'Atelier AI',analyzing:'Atelier AI',profile:'Your style profile',occasion:'Choose an occasion',generating:'Atelier AI',results:'Your looks',detail:'Outfit detail'};return <header className="px-5 pt-6 pb-4 flex items-center justify-between"><div className="flex items-center gap-2">{onBack&&<button onClick={onBack} aria-label="Back" className="w-8 h-8 -ml-2 flex items-center justify-center text-stone-500 hover:text-stone-900"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg></button>}<h1 className="font-display text-lg">{titles[step]}</h1></div>{onRestart&&<button onClick={onRestart} className="text-xs text-stone-500 hover:text-stone-900">Start over</button>}</header>}
