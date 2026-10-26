import fs from 'node:fs';
import { chromium } from 'playwright';

const registry=JSON.parse(fs.readFileSync('data/figma-template-registry.json','utf8'));
const specificationPath=process.env.FIGMA_COMPONENT_SPEC || '';
const specification=specificationPath && fs.existsSync(specificationPath)
  ? JSON.parse(fs.readFileSync(specificationPath,'utf8')) : null;
const templateId=process.env.TEMPLATE_ID || 'T1';
const url=process.env.PAGE_URL || 'http://127.0.0.1:4173/Migration-ust/our-approach-mapped/';
const family=registry.templates.find(t=>t.id===templateId);
if (!family) throw new Error('Unknown template '+templateId);
fs.mkdirSync('component-qa-output',{recursive:true});

function normalized(value){
  return String(value||'').match(/B_\d{3}/)?.[0] ?? null;
}

const browser=await chromium.launch({headless:true});
const report={templateId,source:url,figmaSpecificationAvailable:!!specification,variants:{},status:'not-certified'};
try {
  for (const [variant,width] of [['desktop',1280],['mobile',390]]) {
    const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1});
    const page=await context.newPage();
    const response=await page.goto(url,{waitUntil:'networkidle',timeout:45000});
    if (!response?.ok()) throw new Error('Page unavailable: '+response?.status());
    await page.evaluate(()=>document.fonts.ready);
    const rendered=await page.locator('[data-component]').evaluateAll(elements=>elements.map(el=>{
      const box=el.getBoundingClientRect(),style=getComputedStyle(el);
      const heading=el.querySelector('h1,h2,h3');
      const hs=heading?getComputedStyle(heading):null;
      return {
        code:(el.dataset.component||'').match(/B_\d{3}/)?.[0]||null,
        elementTag:el.tagName.toLowerCase(),
        box:{x:box.x+scrollX,y:box.y+scrollY,width:box.width,height:box.height},
        style:{display:style.display,backgroundColor:style.backgroundColor,color:style.color,
          paddingTop:style.paddingTop,paddingRight:style.paddingRight,paddingBottom:style.paddingBottom,
          paddingLeft:style.paddingLeft,gap:style.gap,borderRadius:style.borderRadius},
        heading:hs?{fontFamily:hs.fontFamily,fontSize:hs.fontSize,fontWeight:hs.fontWeight,
          lineHeight:hs.lineHeight,letterSpacing:hs.letterSpacing}:null
      };
    }));
    const expected=specification?.families?.find(f=>f.id===templateId)?.variants?.[variant]?.components;
    const expectedCodes=expected?.map(x=>normalized(x.code))||family.componentsOriginalSource;
    const presentCodes=rendered.map(x=>x.code);
    const checks=[];
    const sameOrder=JSON.stringify(expectedCodes)===JSON.stringify(presentCodes);
    checks.push({rule:'component_order',status:sameOrder?'pass':'fail',expected:expectedCodes,rendered:presentCodes});
    if (expected) {
      expected.forEach((entry,i)=>{
        const element=rendered[i];
        if (!element || normalized(entry.code)!==element.code) return;
        const expectedBox=entry.geometry;
        if (expectedBox) {
          // Compare block size only. Figma frame-relative Y may differ when content changes.
          for (const field of ['width','height']) {
            if(typeof expectedBox[field]!=='number') continue;
            const delta=Math.abs(element.box[field]-expectedBox[field]);
            checks.push({rule:'component_'+field,code:element.code,instanceId:entry.instanceId,
              expected:expectedBox[field],rendered:Math.round(element.box[field]*100)/100,
              delta:Math.round(delta*100)/100,status:delta<=2?'pass':'fail'});
          }
        }
        // Component map currently lacks nested typography/color and padding tokens.
        // Do not manufacture pass results for properties not extracted from Figma.
      });
    }
    const passed=checks.filter(x=>x.status==='pass').length;
    report.variants[variant]={viewportWidth:width,componentCount:rendered.length,
      testedChecks:checks.length,passedChecks:passed,
      results:checks,computedStyles:rendered,
      qualification:expected?'Layout checks only; properties/assets unverified':
        'Registry component order only; authoritative Figma component geometry unavailable'};
    await context.close();
  }
} finally {
  await browser.close();
}
const total=Object.values(report.variants).reduce((sum,v)=>sum+v.testedChecks,0);
const passed=Object.values(report.variants).reduce((sum,v)=>sum+v.passedChecks,0);
report.measuredStructuralLayoutCompliance=total?Math.round(10000*passed/total)/100:null;
report.status='not-certified';
report.reason='Component structure/layout results are partial; fonts, assets, nested styles, content and interactions have not been verified against full Figma specifications.';
fs.writeFileSync('component-qa-output/component-contract-report.json',JSON.stringify(report,null,2));
const md=['# Figma-to-GitHub component contract validation','','**This compares Figma component metadata to actual DOM elements, not PNG screenshots.**',
  '',`Template: **${templateId}** · Figma specification loaded: **${!!specification}**`,'',
  '| Viewport | Measured checks | Passed | Status |','|---|---:|---:|---|',
  ...Object.entries(report.variants).map(([name,v])=>`| ${name} | ${v.testedChecks} | ${v.passedChecks} | ${v.passedChecks===v.testedChecks?'Structural checks passed':'Differences found'} |`),
  '','**Visual fidelity is not certified.** This initial contract includes block IDs, sequence and optional frame geometry; full tokens and nested Figma styles must be extracted before an overall 98% score is meaningful.',
  '','See component-contract-report.json for mismatches and computed DOM properties.'].join('\n');
fs.writeFileSync('component-qa-output/component-contract-report.md',md+'\n');
console.log(md);
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,md+'\n');
// Pass the CI job when diagnostic results exist. Approval must be performed separately.
