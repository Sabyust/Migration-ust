import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import registry from '../../data/figma-components.json';
import './fiveComponents.css';

const examples=[
  {code:'B_025',template:'T1',name:'Card Collection',eyebrow:'B_025 / T1 ORIGINS'},
  {code:'B_037',template:'T1',name:'Text + Media',eyebrow:'B_037 / T1 ORIGINS'},
  {code:'B_053',template:'T11',name:'Media',eyebrow:'B_053 / T11 MOMENTS'},
  {code:'B_099',template:'T10',name:'Statistics',eyebrow:'B_099 / T10 BLUEPRINT'},
  {code:'B_075',template:'T13',name:'Filter / Table',eyebrow:'B_075 / T13 ANTHOLOGY'},
];
function specification(item,variant){
  const frame=registry.templates[item.template].variants[variant];
  return frame.components.find(c=>c.code===item.code);
}
function SkeletonMedia({label}){
  return <div className="prototype-asset" role="img" aria-label={'Illustrative placeholder, not original Figma asset: '+label}><div className="asset-mark" aria-hidden="true">✳</div><span>Asset placeholder</span><small>{label}</small></div>;
}
function Label({children}){return <span className="prototype-label">{children}</span>;}
function Block025(){return <><header className="block-heading"><Label>Our approach</Label><h2>Ideas become impact through collaboration.</h2><p>Illustrative copy for component construction. This is not approved UST website text.</p></header><div className="block025-grid"><article className="feature-card"><SkeletonMedia label="Featured collection image"/><div><h3>Build with purpose</h3><p>Editorial content slot and image placement require design approval.</p></div></article><article className="feature-card compact"><div className="card-index">01</div><h3>Understand</h3><p>Discover what matters and align on outcomes.</p></article><article className="feature-card compact"><div className="card-index">02</div><h3>Deliver</h3><p>Turn ideas into a measurable experience.</p></article></div></>}
function Block037(){return <><header className="block-heading"><Label>People and technology</Label><h2>Built around what makes us human.</h2></header><div className="block037-split"><div className="block037-text"><p>Representative text only. Original Figma typography, image and nested spacing remain unverified.</p><div className="prototype-pill">Explore the approach <span>↗</span></div></div><SkeletonMedia label="Text + media photograph"/></div></>}
function Block053(){return <div className="block053-inner"><Label>Experience</Label><h2>See the story unfold.</h2><div className="media-stage"><SkeletonMedia label="Wide media or video composition"/><button type="button" className="play" title="Preview unavailable" disabled>▶</button></div><p className="microcopy">No original media provided. Playback intentionally disabled.</p></div>}
function Block099(){return <><header className="block-heading"><Label>Progress</Label><h2>Outcomes that matter.</h2><p>Illustrative, non-customer statistics for layout testing only.</p></header><div className="metrics-grid">{[['01','Discover'],['02','Design'],['03','Deliver']].map(([n,t])=><article className="metric" key={n}><strong>{n}</strong><span>{t}</span><p>Placeholder metric slot</p></article>)}</div></>}
const filters=['All','Insights','Stories'];
function Block075(){const [active,setActive]=useState('All');const items=[{title:'Sample editorial collection',tag:'Insights'},{title:'Illustrative customer story',tag:'Stories'},{title:'Content review example',tag:'Insights'}];return <><header className="block-heading"><Label>Explore</Label><h2>Browse our collection.</h2></header><div className="filter-row" role="group" aria-label="Filter collection">{filters.map(f=><button type="button" key={f} className={active===f?'selected':''} aria-pressed={active===f} onClick={()=>setActive(f)}>{f}</button>)}</div><div className="collection-list">{items.filter(x=>active==='All'||x.tag===active).map(x=><article key={x.title}><span>{x.tag}</span><h3>{x.title}</h3><span aria-hidden="true">↗</span></article>)}</div><p className="microcopy">Prototype records only; not connected to real UST content.</p></>}
const implementations={'B_025':Block025,'B_037':Block037,'B_053':Block053,'B_099':Block099,'B_075':Block075};
function ComponentFrame({item,variant}){
  const spec=specification(item,variant),Component=implementations[item.code];
  const {width,height}=spec.geometry;
  const layout=spec.layout;
  const style={
    '--figma-width':width+'px',
    '--figma-height':height+'px',
    '--pad-top':(layout.paddingTop??0)+'px',
    '--pad-right':(layout.paddingRight??0)+'px',
    '--pad-bottom':(layout.paddingBottom??0)+'px',
    '--pad-left':(layout.paddingLeft??0)+'px',
    '--figma-gap':(layout.itemSpacing??0)+'px',
  };
  return <section className={'figma-block '+item.code.toLowerCase()} style={style} data-component={item.code} data-variant={variant} data-figma-id={spec.figmaInstanceId} aria-label={item.name}>
    <Component/>
  </section>;
}
function App(){
  const [variant,setVariant]=useState('desktop');
  const [selected,setSelected]=useState('all');
  const visible=examples.filter(i=>selected==='all'||selected===i.code);
  return <div className="lab">
    <header className="lab-top"><div><strong>UST COMPONENT LAB</strong><p>Five coded prototypes · Source: copied Figma component registry</p></div><div className="lab-tools"><label>Variant <select value={variant} onChange={e=>setVariant(e.target.value)} aria-label="Variant"><option value="desktop">Desktop 1280</option><option value="mobile">Mobile 390</option></select></label><label>Component <select value={selected} onChange={e=>setSelected(e.target.value)} aria-label="Component"><option value="all">All five</option>{examples.map(i=><option key={i.code} value={i.code}>{i.code} — {i.name}</option>)}</select></label></div></header>
    <p className="lab-warning">Design engineering prototypes. Outer frame sizes and padding use imported Figma data; nested visuals, fonts, images and colors are not certified.</p>
    <main>{visible.map(item=><article className="lab-item" key={item.code}><div className="lab-item-head"><b>{item.code} · {item.name}</b><small>{item.template} · {variant} · Figma node {specification(item,variant).figmaInstanceId}</small></div><div className={'frame-wrap '+variant}><ComponentFrame item={item} variant={variant}/></div></article>)}</main>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
