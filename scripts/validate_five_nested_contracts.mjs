import fs from 'node:fs';
import { chromium } from 'playwright';

const path='figma-spec-input/five-full-design-contracts.json';
if(!fs.existsSync(path)) throw Error('Missing authoritative Figma design contracts; cannot measure fidelity');
const specification=JSON.parse(fs.readFileSync(path,'utf8'));
if(specification.components?.length!==10) throw Error('Expected 10 validated desktop/mobile contracts');
const browser=await chromium.launch({headless:true});
const result={source:'Figma nested REST contract vs browser DOM',status:'not_approved',
  mandatoryFailures:[],propertyResults:[],coverage:{expectedLayers:0,matchedLayers:0},
  score:null};
const tolerance=.75;
const close=(a,b)=>Math.abs(a-b)<=tolerance;
try{
 for(const variant of ['desktop','mobile']){
  const context=await browser.newContext({viewport:{width:variant==='desktop'?1280:390,height:900}});
  const page=await context.newPage();
  const response=await page.goto('http://127.0.0.1:4173/Migration-ust/component-lab.html',{waitUntil:'networkidle'});
  if(!response?.ok())throw Error('Component lab unavailable');
  await page.getByLabel('Variant').selectOption(variant);
  const entries=specification.components.filter(x=>x.variant===variant);
  for(const entry of entries){
   const block=page.locator('[data-component="'+entry.code+'"]');
   if(await block.count()!==1){
    result.mandatoryFailures.push(entry.code+'/'+variant+': missing uniquely identified React component');
    continue;
   }
   const root=entry.contract;
   const checks=[];
   // Frame geometry is authoritative. The pixel-perfect target includes all nested layers.
   const metrics=await block.evaluate(el=>{
    const b=el.getBoundingClientRect(),s=getComputedStyle(el);
    return {width:b.width,height:b.height,display:s.display,
      paddingTop:parseFloat(s.paddingTop),paddingRight:parseFloat(s.paddingRight),
      paddingBottom:parseFloat(s.paddingBottom),paddingLeft:parseFloat(s.paddingLeft),
      gap:parseFloat(s.gap)||0};
   });
   for(const k of ['width','height']){
    const expected=root.geometry?.[k];
    if(typeof expected!=='number'){result.mandatoryFailures.push(entry.code+'/'+variant+': missing '+k+' in Figma');continue;}
    checks.push({name:k,expected,actual:metrics[k],passed:close(expected,metrics[k])});
   }
   for(const k of ['paddingTop','paddingRight','paddingBottom','paddingLeft','itemSpacing']){
    const expected=root.layout?.[k];
    if(expected==null)continue;
    const actual=metrics[k==='itemSpacing'?'gap':k];
    checks.push({name:k,expected,actual,passed:close(expected,actual)});
   }
   const layers=[];
   function visit(node){
    for(const child of node.children||[]){
      layers.push(child);
      visit(child);
    }
   }
   visit(root);
   result.coverage.expectedLayers+=layers.length;
   for(const layer of layers){
     const selector='[data-figma-layer="'+String(layer.id).replaceAll('"','')+'"]';
     const count=await block.locator(selector).count();
     if(count!==1){
       result.mandatoryFailures.push(entry.code+'/'+variant+': missing Figma layer '+layer.id);
       continue;
     }
     result.coverage.matchedLayers++;
     const actual=await block.locator(selector).evaluate(node=>{
       const r=node.getBoundingClientRect(),p=node.parentElement?.getBoundingClientRect();
       const s=getComputedStyle(node);
       return {geometry:{x:p?r.x-p.x:r.x,y:p?r.y-p.y:r.y,width:r.width,height:r.height},
        typography:{fontFamily:s.fontFamily,fontSize:parseFloat(s.fontSize),fontWeight:s.fontWeight,
          letterSpacing:s.letterSpacing,lineHeight:s.lineHeight},color:s.color,backgroundColor:s.backgroundColor};
     });
     for(const key of ['x','y','width','height']){
       const expected=layer.geometry?.[key];
       if(expected==null)continue;
       checks.push({name:layer.id+'/'+key,expected,actual:actual.geometry[key],passed:close(expected,actual.geometry[key])});
     }
     const type=layer.typography||{};
     if(typeof type.fontSize==='number')
       checks.push({name:layer.id+'/fontSize',expected:type.fontSize,actual:actual.typography.fontSize,
         passed:close(type.fontSize,actual.typography.fontSize)});
     // Other colors/paints need deterministic normalization before testing.
     // Never count unsupported properties as passes.
   }
   result.propertyResults.push({component:entry.code,variant,checks,passed:checks.filter(c=>c.passed).length,
    failed:checks.filter(c=>!c.passed).length,coverage:{expected:layers.length,matched:layers.length-result.mandatoryFailures.filter(x=>x.startsWith(entry.code+'/'+variant+': missing Figma layer ')).length}});
  }
  await context.close();
 }
}finally{await browser.close();}
const tested=result.propertyResults.reduce((s,x)=>s+x.checks.length,0);
const passed=result.propertyResults.reduce((s,x)=>s+x.passed,0);
result.score=tested?Math.round(passed/tested*10000)/100:null;
result.status=(result.mandatoryFailures.length===0&&result.coverage.expectedLayers===result.coverage.matchedLayers&&result.score>=98)?'eligible_for_manual_review':'failed_design_contract';
const md=[
 '# Five-component nested Figma-to-React contract validation','',
 '**This is not screenshot similarity.** It checks Figma node IDs and nested DOM geometry/typography.',
 '',
 'Tested properties: '+tested+'; passed: '+passed+'; measured compliance: '+(result.score??'unavailable')+'%.',
 'Nested layer coverage: '+result.coverage.matchedLayers+'/'+result.coverage.expectedLayers+'.',
 'Mandatory failures: '+result.mandatoryFailures.length+'.',
 '',
 '**Status:** '+result.status+'.',
 '',
 'Missing original assets and untested color/effects mean the score, even if high, is NOT final 98% visual sign-off.',
 'The current prototypes are expected to fail nested layer coverage; replace their interiors using these contracts.'
].join('\n')+'\n';
fs.mkdirSync('nested-qa-output',{recursive:true});
fs.writeFileSync('nested-qa-output/report.json',JSON.stringify(result,null,2));
fs.writeFileSync('nested-qa-output/report.md',md);
console.log(md);
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,md);
if(result.status!=='eligible_for_manual_review')process.exitCode=1;
