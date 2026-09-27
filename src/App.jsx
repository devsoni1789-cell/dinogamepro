import React,{useEffect,useMemo,useRef,useState} from 'react'

const KEY='ai-styling-app.v1'
const DEFAULT={onboarded:false,profile:{name:'',height:'',build:'',style:'Minimal',colors:['Black','White'],occasion:'Daily'},wardrobe:[],saved:[]}
const CATEGORIES=['Shirt','T-Shirt','Trousers','Jeans','Lower','Shoes','Jacket','Accessory']
const COLORS=['Black','White','Navy','Beige','Grey','Olive','Brown','Blue','Cream']
const STYLES=['Minimal','Streetwear','Smart Casual','Classic','Traditional','Sporty']
const OCCASIONS=['Daily','Office','Date','Wedding','Party','Travel']
const looks=[
 {title:'Clean Everyday',items:['White T-shirt','Navy trousers','White sneakers'],why:'Simple contrast and clean proportions make this an easy everyday look.',tags:['Minimal','Daily']},
 {title:'Smart Casual',items:['Cream shirt','Charcoal trousers','Brown loafers','Silver watch'],why:'Neutral tones with a structured bottom create a polished silhouette.',tags:['Smart Casual','Office']},
 {title:'Modern Wedding',items:['Black kurta','Cream trousers','Brown loafers','Watch'],why:'A refined neutral palette works for an evening celebration.',tags:['Traditional','Wedding']},
 {title:'Weekend Street',items:['Oversized black tee','Blue jeans','Sneakers','Cap'],why:'Relaxed proportions keep the outfit casual without looking random.',tags:['Streetwear','Travel']}
]

function load(){try{return {...DEFAULT,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return DEFAULT}}
function save(v){localStorage.setItem(KEY,JSON.stringify(v))}
function scoreLook(l,p){let s=0;if(l.tags.includes(p.style))s+=5;if(l.tags.includes(p.occasion))s+=4;if(p.colors.some(c=>l.items.join(' ').toLowerCase().includes(c.toLowerCase())))s+=2;return s}
function recommend(p){return [...looks].sort((a,b)=>scoreLook(b,p)-scoreLook(a,p)).slice(0,3)}

export default function App(){
 const [state,setState]=useState(load)
 const [tab,setTab]=useState('home')
 const [chat,setChat]=useState([{r:'a',t:'Hi! I’m your styling assistant. Tell me the occasion, budget, or vibe you want.'}])
 const [input,setInput]=useState('')
 const [photo,setPhoto]=useState(null)
 const [newItem,setNewItem]=useState({name:'',category:'Shirt',color:'Black'})
 const fileRef=useRef()
 useEffect(()=>save(state),[state])
 const recs=useMemo(()=>recommend(state.profile),[state.profile])
 const update=(p)=>setState(s=>({...s,profile:{...s.profile,...p}}))
 const complete=()=>setState(s=>({...s,onboarded:true}))
 const addItem=()=>{if(!newItem.name.trim())return;setState(s=>({...s,wardrobe:[...s.wardrobe,{...newItem,id:Date.now()}]}));setNewItem({name:'',category:'Shirt',color:'Black'})}
 const toggleSave=(l)=>setState(s=>({...s,saved:s.saved.some(x=>x.title===l.title)?s.saved.filter(x=>x.title!==l.title):[...s.saved,l]}))
 const send=()=>{const q=input.trim();if(!q)return;let t='Try asking: “What should I wear to a wedding?”, “make it formal”, or “give me a minimal outfit”.';const x=q.toLowerCase();if(x.includes('wedding'))t='For a wedding: try the Modern Wedding look — black kurta, cream trousers, brown loafers and a watch. Keep accessories restrained.';else if(x.includes('formal')||x.includes('office'))t='For a more formal look, choose a structured shirt, tailored trousers and leather shoes. Keep colors close in tone.';else if(x.includes('minimal'))t='Go minimal: white or black top, straight trousers, clean sneakers and one simple accessory.';else if(x.includes('hot')||x.includes('summer'))t='Choose breathable cotton or linen, lighter colors and relaxed fits. Avoid heavy layers.';setChat(c=>[...c,{r:'u',t:q},{r:'a',t}]);setInput('')}
 if(!state.onboarded)return <Onboarding profile={state.profile} update={update} complete={complete} photo={photo} setPhoto={setPhoto} fileRef={fileRef}/>
 return <div className="app"><header><div className="brand"><span className="mark">✦</span><div><b>AI Styling</b><small>your personal stylist</small></div></div><button className="avatar" onClick={()=>setTab('profile')}>{state.profile.name?.[0]||'A'}</button></header>
 <main>{tab==='home'&&<Home p={state.profile} recs={recs} saved={state.saved} toggleSave={toggleSave} go={setTab}/>}
 {tab==='discover'&&<Discover p={state.profile} update={update} recs={recs} toggleSave={toggleSave}/>}
 {tab==='wardrobe'&&<Wardrobe items={state.wardrobe} item={newItem} setItem={setNewItem} add={addItem} remove={id=>setState(s=>({...s,wardrobe:s.wardrobe.filter(x=>x.id!==id)}))}/>}
 {tab==='stylist'&&<section className="page"><p className="eyebrow">AI STYLIST</p><h1>Ask anything.</h1><div className="chat">{chat.map((m,i)=><div key={i} className={m.r==='u'?'bubble user':'bubble'}>{m.t}</div>)}</div><div className="chips">{['Wedding look','Make it formal','Minimal outfit','Hot weather'].map(x=><button onClick={()=>{setInput(x);setTimeout(()=>document.getElementById('send')?.click(),0)}}>{x}</button>)}</div><div className="composer"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask your stylist…"/><button id="send" onClick={send}>Send</button></div></section>}
 {tab==='profile'&&<Profile p={state.profile} update={update} photo={photo} setPhoto={setPhoto} fileRef={fileRef} reset={()=>{localStorage.removeItem(KEY);location.reload()}}/>}</main>
 <nav>{[['home','⌂','Home'],['discover','◌','Discover'],['wardrobe','▢','Wardrobe'],['stylist','✦','Stylist'],['profile','○','Profile']].map(([id,ic,l])=><button className={tab===id?'active':''} onClick={()=>setTab(id)}><span>{ic}</span>{l}</button>)}</nav></div>
}

function Onboarding({profile,update,complete,photo,setPhoto,fileRef}){
 const [step,setStep]=useState(0)
 const steps=[<><p className="eyebrow">WELCOME</p><h1>Dress better.<br/><i>Feel like you.</i></h1><p className="muted">Build a personal style profile and get outfit ideas matched to your proportions, taste and occasion.</p></>,
 <><p className="eyebrow">ABOUT YOU</p><h2>Let’s personalize your fit.</h2><input className="field" placeholder="Your name" value={profile.name} onChange={e=>update({name:e.target.value})}/><div className="grid2"><input className="field" placeholder="Height e.g. 175 cm" value={profile.height} onChange={e=>update({height:e.target.value})}/><select className="field" value={profile.build} onChange={e=>update({build:e.target.value})}><option value="">Build</option><option>Lean</option><option>Average</option><option>Athletic</option><option>Broad</option></select></div></>,
 <><p className="eyebrow">YOUR STYLE</p><h2>What feels like you?</h2><div className="choicegrid">{STYLES.map(x=><button className={profile.style===x?'choice selected':'choice'} onClick={()=>update({style:x})}>{x}</button>)}</div><p className="eyebrow space">FAVORITE COLORS</p><div className="chips">{COLORS.map(x=><button className={profile.colors.includes(x)?'selectedChip':''} onClick={()=>update({colors:profile.colors.includes(x)?profile.colors.filter(c=>c!==x):[...profile.colors,x]})}>{x}</button>)}</div></>,
 <><p className="eyebrow">YOUR PHOTO</p><h2>Optional style reference.</h2><p className="muted">Upload a photo for a future vision-analysis feature. This prototype only previews it locally.</p><div className="photoBox" onClick={()=>fileRef.current?.click()}>{photo?<img src={photo}/>:'＋ Add photo'}</div><input hidden ref={fileRef} type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)setPhoto(URL.createObjectURL(f))}}/></>]
 return <div className="onboarding"><div className="onboardCard">{steps[step]}<div className="dots">{steps.map((_,i)=><span className={i===step?'on':''}/>)}</div><button className="primary" onClick={()=>step<steps.length-1?setStep(step+1):complete()}>{step<steps.length-1?'Continue':'Create my style profile'}</button>{step>0&&<button className="textbtn" onClick={()=>setStep(step-1)}>Back</button>}</div></div>
}

function Home({p,recs,saved,toggleSave,go}){const l=recs[0];return <section className="page"><p className="eyebrow">GOOD MORNING{p.name?' · '+p.name.toUpperCase():''}</p><h1>Your style,<br/><i>sorted.</i></h1><div className="hero"><span className="tag">TODAY'S LOOK</span><h2>{l.title}</h2><p>{l.items.join(' · ')}</p><small>{l.why}</small><button onClick={()=>toggleSave(l)}>{saved.some(x=>x.title===l.title)?'♥ Saved':'♡ Save look'}</button></div><div className="sectionHead"><h2>Made for you</h2><button onClick={()=>go('discover')}>See all</button></div><div className="cards">{recs.map(x=><LookCard l={x} saved={saved.some(y=>y.title===x.title)} toggle={()=>toggleSave(x)}/>)}</div><div className="tip"><b>Style note</b><p>Fit usually matters more than brand. Start with clean shoulder lines, a comfortable rise and trousers that break neatly over your shoes.</p></div></section>}

function LookCard({l,saved,toggle}){return <article className="look"><div className="lookArt"><div className="silhouette">◐</div><button onClick={toggle}>{saved?'♥':'♡'}</button></div><b>{l.title}</b><p>{l.items.join(' · ')}</p></article>}

function Discover({p,update,recs,toggleSave}){return <section className="page"><p className="eyebrow">DISCOVER</p><h1>Explore your <i>palette.</i></h1><p className="muted">Tap a color or occasion to reshape recommendations.</p><div className="palette">{COLORS.map(c=><button className={p.colors.includes(c)?'tone chosen':'tone'} onClick={()=>update({colors:p.colors.includes(c)?p.colors.filter(x=>x!==c):[...p.colors,c]})}><span style={{background:color(c)}}/>{c}</button>)}</div><div className="sectionHead"><h2>Occasion</h2></div><div className="chips">{OCCASIONS.map(x=><button className={p.occasion===x?'selectedChip':''} onClick={()=>update({occasion:x})}>{x}</button>)}</div><div className="sectionHead"><h2>Looks for you</h2></div><div className="cards">{recs.map(x=><LookCard l={x} saved={false} toggle={()=>toggleSave(x)}/>)}</div></section>}

function Wardrobe({items,item,setItem,add,remove}){return <section className="page"><p className="eyebrow">WARDROBE</p><h1>Your <i>closet.</i></h1><div className="addbox"><input className="field" placeholder="Item name" value={item.name} onChange={e=>setItem({...item,name:e.target.value})}/><div className="grid2"><select className="field" value={item.category} onChange={e=>setItem({...item,category:e.target.value})}>{CATEGORIES.map(x=><option>{x}</option>)}</select><select className="field" value={item.color} onChange={e=>setItem({...item,color:e.target.value})}>{COLORS.map(x=><option>{x}</option>)}</select></div><button className="primary small" onClick={add}>Add to wardrobe</button></div><div className="wardrobeGrid">{items.map(x=><article className="wardItem"><div className="itemArt" style={{background:color(x.color)}}><span>{x.category}</span></div><b>{x.name}</b><small>{x.color}</small><button onClick={()=>remove(x.id)}>Remove</button></article>)}{!items.length&&<p className="muted">Your wardrobe is empty. Add your first piece above.</p>}</div></section>}

function Profile({p,update,photo,setPhoto,fileRef,reset}){return <section className="page"><p className="eyebrow">PROFILE</p><h1>Your style <i>DNA.</i></h1><div className="profileCard"><div className="avatar big">{p.name?.[0]||'A'}</div><h2>{p.name||'Style Explorer'}</h2><p>{p.style} · {p.build||'Your build'} {p.height&&'· '+p.height}</p></div><div className="sectionHead"><h2>Preferences</h2></div><label>Style<select className="field" value={p.style} onChange={e=>update({style:e.target.value})}>{STYLES.map(x=><option>{x}</option>)}</select></label><label>Default occasion<select className="field" value={p.occasion} onChange={e=>update({occasion:e.target.value})}>{OCCASIONS.map(x=><option>{x}</option>)}</select></label><button className="danger" onClick={reset}>Reset local profile</button></section>}

function color(n){return {Black:'#15161a',White:'#eeeae1',Navy:'#26344e',Beige:'#cdbb9d',Grey:'#85878a',Olive:'#6d7354',Brown:'#795542',Blue:'#4f7399',Cream:'#e8dcc3'}[n]||'#777'}
