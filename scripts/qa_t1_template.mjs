import {chromium} from 'playwright';
import fs from 'node:fs';
import registry from '../data/figma-components.json' with {type:'json'};

const expected=registry.templates.T1;
const browser=await chromium.launch({headless:true});
const result={template:'T1 Origins',mode:'template-only',checks:[],status:'not-certified'};
let failures=0;
try {
 for(const [variant,width] of [['desktop',1280],['mobile',390]]) {
  const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1});
  const page=await context.newPage();
  const response=await page.goto('http://127.0.0.1:4173/Migration-ust/our-approach-template.html',{waitUntil:'networkidle',timeout:45000});
  if(!response?.ok())throw new Error('Template route unavailable '+response?.status());
  const actual=await page.locator('.template-block').evaluateAll(elements=>elements.map(el=>{
   const r=el.getBoundingClientRect();
   return {code:el.getAttribute('data-component'),w:r.width,h:r.height}
  }));
  const list=expected.variants[variant].components;
  const same=JSON.stringify(actual.map(c=>c.code))===JSON.stringify(list.map(c=>c.code));
  result.checks.push({variant,property:'component_order',passed:same});
  if(!same)failures++;
  for(let i=0;i<list.length;i++){
   const spec=list[i],live=actual[i];
   if(!live)continue;
   for(const [property,desired,observed] of [['width',spec.geometry.width,live.w],['height',spec.geometry.height,live.h]]){
    const passed=Math.abs(desired-observed)<1;
    result.checks.push({variant,code:spec.code,property,expected:desired,actual:observed,passed});
    if(!passed)failures++;
   }
  }
  const text=await page.locator('main').innerText();
  const forbidden=['ideas become impact','built around what makes us human','our approach is'];
  const copyFree=forbidden.every(t=>!text.toLowerCase().includes(t));
  result.checks.push({variant,property:'no_mapped_copy',passed:copyFree});
  if(!copyFree)failures++;
  await context.close();
 }
}finally{await browser.close()}
result.status=failures?'fail':'outer_contract_pass';
result.failures=failures;
result.passed=result.checks.filter(x=>x.passed).length;
result.tested=result.checks.length;
fs.mkdirSync('template-qa-output',{recursive:true});
fs.writeFileSync('template-qa-output/t1-template.json',JSON.stringify(result,null,2));
const summary='# T1 template-only build QA\n\n'+
 `Passed: ${result.passed}/${result.tested} checks. Status: ${result.status}.\n\n`+
 'Checks: seven component IDs in order, mapped copy excluded, and Figma frame dimensions at 1280px/390px.\n\n'+
 '**Not certified:** inner Figma design layers, fonts, colors, imagery and interactions are still unverified.\n';
fs.writeFileSync('template-qa-output/summary.md',summary);
console.log(summary);
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);
if(failures)process.exit(1);
