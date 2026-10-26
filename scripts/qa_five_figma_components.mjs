import {chromium} from 'playwright';
import fs from 'node:fs';
import registry from '../data/figma-components.json' with {type:'json'};

const cases=[['T1','B_025'],['T1','B_037'],['T11','B_053'],['T10','B_099'],['T13','B_075']];
const browser=await chromium.launch({headless:true});
const report={basis:'Figma REST mapped outer frame geometry and Auto Layout only',fullVisualDesignAccuracy:'not_measurable_from_available_data',components:[],checks:0,passed:0,failed:0};
const near=(a,b,t=.6)=>Math.abs(a-b)<=t;
const url='http://127.0.0.1:4173/Migration-ust/component-lab.html';
try{
  for(const [variant,width] of [['desktop',1280],['mobile',390]]){
    const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1});
    const page=await context.newPage();
    const response=await page.goto(url,{waitUntil:'networkidle',timeout:45000});
    if(!response?.ok()) throw Error('Component lab did not load: '+response?.status());
    if(variant==='mobile')await page.getByLabel('Variant').selectOption('mobile');
    for(const [template,code] of cases){
      const spec=registry.templates[template].variants[variant].components.find(c=>c.code===code);
      const item=page.locator('[data-component="'+code+'"]');
      const details=await item.evaluate(el=>{
        const box=el.getBoundingClientRect(),sty=getComputedStyle(el);
        return {code:el.dataset.component,variant:el.dataset.variant,figmaNode:el.dataset.figmaId,
          width:box.width,height:box.height,display:sty.display,flexDirection:sty.flexDirection,
          paddingTop:parseFloat(sty.paddingTop),paddingRight:parseFloat(sty.paddingRight),
          paddingBottom:parseFloat(sty.paddingBottom),paddingLeft:parseFloat(sty.paddingLeft),
          gap:parseFloat(sty.gap)||0,childCount:el.children.length};
      });
      const checks=[];
      function add(property,expected,actual,ok){
        checks.push({property,expected,actual,passed:ok});
        report.checks++;if(ok)report.passed++;else report.failed++;
      }
      add('componentCode',code,details.code,code===details.code);
      add('figmaNode',spec.figmaInstanceId,details.figmaNode,spec.figmaInstanceId===details.figmaNode);
      add('variant',variant,details.variant,variant===details.variant);
      for(const k of ['width','height'])add(k,spec.geometry[k],details[k],near(details[k],spec.geometry[k]));
      const layout=spec.layout;
      for(const k of ['paddingTop','paddingRight','paddingBottom','paddingLeft']){
        add(k,layout[k]??0,details[k],near(details[k],layout[k]??0));
      }
      add('direction',layout.layoutMode==='HORIZONTAL'?'row':'column',details.flexDirection,
        details.flexDirection===(layout.layoutMode==='HORIZONTAL'?'row':'column'));
      add('gap',layout.itemSpacing??0,details.gap,near(details.gap,layout.itemSpacing??0));
      add('renderedMarkup',true,details.childCount>0,details.childCount>0);
      report.components.push({template,code,variant,checks,passes:checks.filter(x=>x.passed).length,total:checks.length,
        fidelity:'outer frame only; imagery typography nested properties unverified'});
    }
    if(variant==='mobile'){
      await page.getByLabel('Component').selectOption('B_075');
      const btn=page.getByRole('button',{name:'Stories',exact:true});
      await btn.click();
      const visible=await page.locator('.collection-list article').count();
      const ok=visible===1;
      report.checks++;if(ok)report.passed++;else report.failed++;
      report.components.push({template:'T13',code:'B_075',variant:'mobile',interaction:'filter Stories',
        checks:[{property:'interactiveFilter',expected:1,actual:visible,passed:ok}]});
    }
    await context.close();
  }
}finally{await browser.close();}
report.structuralAndOuterGeometryCompliancePct=Math.round(report.passed/report.checks*10000)/100;
report.status=report.failed?'fail':'outer-contract-pass';
fs.mkdirSync('component-qa-output',{recursive:true});
fs.writeFileSync('component-qa-output/five-component-validation.json',JSON.stringify(report,null,2));
const out=['# Five React components: Figma design-contract QA','',
  'Real rendered React components checked against copied Figma REST frame geometry and Auto Layout metadata.',
  '',`**${report.passed} / ${report.checks}** tested properties passed; **${report.failed}** failed.`,
  '',`Outer-contract compliance: **${report.structuralAndOuterGeometryCompliancePct}%**.`,
  '',
  'This is **not** an overall visual accuracy percentage. No nested Figma typography, source imagery, original SVGs, text or color values were available for verification.',
  '',
  '| Component | Desktop checks | Mobile checks |',
  '|---|---|---|',
  ...cases.map(([_,code])=>{
    const a=report.components.find(x=>x.code===code&&x.variant==='desktop');
    const b=report.components.find(x=>x.code===code&&x.variant==='mobile'&&x.total);
    return `| ${code} | ${a.passes}/${a.total} | ${b.passes}/${b.total} |`;
  }),
  '','**Sign-off:** not approved for pixel-perfect fidelity; requires authoritative nested design context and actual Figma assets.'
].join('\n');
fs.writeFileSync('component-qa-output/five-component-validation.md',out+'\n');
console.log(out);
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,out+'\n');
if(report.failed)process.exit(1);
