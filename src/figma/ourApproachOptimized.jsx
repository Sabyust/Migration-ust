import React from 'react';
import {createRoot} from 'react-dom/client';
import registry from '../../data/figma-components.json';
import content from './ourApproachContent.json';
import './ourApproachTemplate.css';
import './ourApproachOptimized.css';

const templates=registry.templates.T1;
const names={B_209:'Secondary Banner',B_025:'Card Collection',B_122:'Timeline',B_013:'Card Collection',B_037:'Text + Media',B_149:'Card Collection',B_151:'Card Collection'};
function AssetSlot({label}){return <div className="oa-asset-slot" role="img" aria-label={'Original Figma asset needed: '+label}><span className="oa-asset-icon" aria-hidden="true">▧</span><span>Design image pending</span><small>{label}</small></div>;}
function CTA({cta}){return cta?<a className="oa-cta" href={cta.href} target="_blank" rel="noreferrer">{cta.label}<span aria-hidden="true">↗</span></a>:null;}
function CopyHead({item}){return <div className="oa-head"><span className="oa-eyebrow">{item.eyebrow}</span><h2>{item.title}</h2>{item.body&&<p>{item.body}</p>}</div>;}
function Cards({cards}){return <div className={'oa-cards count-'+cards.length}>{cards.map((c,i)=><article className="oa-card" key={c.title}><AssetSlot label={'Card '+(i+1)}/><div className="oa-card-copy"><span className="oa-card-index">{String(i+1).padStart(2,'0')}</span><h3>{c.title}</h3><p>{c.body}</p></div></article>)}</div>}
function Banner({item}){return <div className="oa-hero"><AssetSlot label="Full-bleed hero image"/><div className="oa-hero-copy"><span className="oa-eyebrow">{item.eyebrow}</span><h1>{item.title}</h1><p>{item.body}</p><CTA cta={item.cta}/></div><div className="oa-hero-highlights">{item.highlights.map(x=><article key={x.title}><h3>{x.title}</h3><p>{x.body}</p></article>)}</div></div>}
function Timeline({item}){return <><CopyHead item={item}/><ol className="oa-timeline">{item.steps.map((step,i)=><li key={step.title}><span className="oa-timeline-number">{String(i+1).padStart(2,'0')}</span><h3>{step.title}</h3><p>{step.body}</p></li>)}</ol></>}
function TextMedia({item}){return <div className="oa-split"><div><CopyHead item={item}/><CTA cta={item.cta}/></div><AssetSlot label="Human-centered image"/></div>}
function SectionContent({code}){const item=content.sections[code];if(code==='B_209')return <Banner item={item}/>;if(code==='B_122')return <Timeline item={item}/>;if(code==='B_037')return <TextMedia item={item}/>;return <><CopyHead item={item}/><Cards cards={item.cards}/></>;}
function TemplateSection({desktop}){
 const mobile=templates.variants.mobile.components.find(c=>c.code===desktop.code);
 const style={'--dh':desktop.geometry.height+'px','--mh':mobile.geometry.height+'px',
 '--dpt':(desktop.layout.paddingTop??0)+'px','--dpr':(desktop.layout.paddingRight??0)+'px','--dpb':(desktop.layout.paddingBottom??0)+'px','--dpl':(desktop.layout.paddingLeft??0)+'px',
 '--mpt':(mobile.layout.paddingTop??0)+'px','--mpr':(mobile.layout.paddingRight??0)+'px','--mpb':(mobile.layout.paddingBottom??0)+'px','--mpl':(mobile.layout.paddingLeft??0)+'px'};
 return <section className={'template-block oa-block block-'+desktop.code} style={style} data-component={desktop.code} data-figma-desktop={desktop.figmaInstanceId} data-figma-mobile={mobile.figmaInstanceId} aria-label={names[desktop.code]}><SectionContent code={desktop.code}/></section>
}
function App(){return <><div className="review-notice"><strong>OUR APPROACH · EDITORIAL ADAPTATION</strong><span>Source-grounded copy · Pending UST content approval and Figma asset verification</span><a href="https://www.ust.com/en/our-approach" target="_blank" rel="noreferrer">Original page ↗</a></div><div className="page oa-page"><header className="site-header"><a className="wordmark" href="https://www.ust.com/" aria-label="UST home">UST.</a><nav aria-label="Page navigation"><a href="#B_025">Our principles</a><a href="#B_122">Our process</a><a href="#B_149">What drives us</a></nav><span className="hamburger" aria-label="Mobile menu placeholder">☰</span></header><main>{templates.variants.desktop.components.map(x=><div key={x.code} id={x.code}><TemplateSection desktop={x}/></div>)}</main><footer className="site-footer oa-footer"><div><a className="wordmark" href="https://www.ust.com/">UST.</a><div className="oa-footer-links"><a href="https://www.ust.com/en/what-we-do">What we do</a><a href="https://www.ust.com/en/our-approach">Our approach</a><a href="https://www.ust.com/">UST home</a></div></div><div className="footer-bottom">Editorial review copy · Not an approved replacement for ust.com</div></footer></div></>}
document.title=content.page.title;
const desc=document.querySelector('meta[name="description"]');if(desc)desc.setAttribute('content',content.page.description);
createRoot(document.getElementById('root')).render(<App/>);
