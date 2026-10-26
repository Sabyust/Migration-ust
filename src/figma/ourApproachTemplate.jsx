import React from 'react';
import {createRoot} from 'react-dom/client';
import data from '../../data/figma-components.json';
import './ourApproachTemplate.css';

const entries=data.templates.T1;
const names={B_209:'Secondary banner',B_025:'Card collection',B_122:'Timeline',B_013:'Card collection',B_037:'Text and media',B_149:'Card collection',B_151:'Card collection'};
function Lines({count=3}){return <div className="slot-lines">{Array.from({length:count},(_,i)=><i key={i}/>)}</div>}
function Heading(){return <div className="slot-heading"><i/><i/></div>}
function Media(){return <div className="slot-media"><span>MEDIA SLOT</span></div>}
function Card(){return <article className="slot-card"><Media/><div><Heading/><Lines count={2}/></div></article>}
function Content({code}){
 switch(code){
  case 'B_209':return <><Media/><div className="banner-content"><span>SECONDARY BANNER</span><Heading/><Lines/><span className="slot-cta"/></div><div className="banner-stats">{[0,1,2].map(n=><div key={n}><Heading/><Lines count={2}/></div>)}</div></>;
  case 'B_122':return <><div className="block-intro"><small>TIMELINE</small><Heading/></div><div className="timeline">{[0,1,2,3].map(n=><div key={n}><span className="dot"/><Heading/><Lines/></div>)}</div></>;
  case 'B_037':return <div className="split"><div><small>TEXT + MEDIA</small><Heading/><Lines count={6}/><span className="slot-cta"/></div><Media/></div>;
  default:return <><div className="block-intro"><small>{names[code].toUpperCase()}</small><Heading/><Lines count={2}/></div><div className={'cards cards-'+code}>{Array.from({length:code==='B_151'?4:3},(_,i)=><Card key={i}/>)}</div></>;
 }
}
function Block({item}){
 const mobile=entries.variants.mobile.components.find(x=>x.code===item.code);
 const desktop=item;
 const style={
  '--dh':desktop.geometry.height+'px','--mh':mobile.geometry.height+'px',
  '--dpt':(desktop.layout.paddingTop??0)+'px','--dpr':(desktop.layout.paddingRight??0)+'px',
  '--dpb':(desktop.layout.paddingBottom??0)+'px','--dpl':(desktop.layout.paddingLeft??0)+'px',
  '--mpt':(mobile.layout.paddingTop??0)+'px','--mpr':(mobile.layout.paddingRight??0)+'px',
  '--mpb':(mobile.layout.paddingBottom??0)+'px','--mpl':(mobile.layout.paddingLeft??0)+'px'
 };
 return <section className={'template-block block-'+item.code} data-component={item.code} data-figma-desktop={desktop.figmaInstanceId} data-figma-mobile={mobile.figmaInstanceId} style={style} aria-label={names[item.code]}><Content code={item.code}/></section>;
}
function App(){return <><div className="review-notice"><strong>T1 ORIGINS · TEMPLATE ONLY</strong><span>No UST.com copy mapped · Original Figma assets / internal styling awaiting extraction</span></div><div className="page"><header className="site-header"><span className="wordmark">UST.</span><nav aria-label="Navigation placeholders"><span>Navigation slot</span><span>Navigation slot</span><span>Navigation slot</span></nav><span className="hamburger" aria-label="Menu placeholder">☰</span></header><main>{entries.variants.desktop.components.map(item=><Block key={item.code} item={item}/>)}</main><footer className="site-footer"><div><span className="wordmark">UST.</span><div className="footer-cols">{[0,1,2].map(n=><div key={n}><Heading/><Lines/></div>)}</div></div><div className="footer-bottom">FOOTER CONTENT SLOTS · NO CONTENT MAPPING</div></footer></div></>}
createRoot(document.getElementById('root')).render(<App/>);
