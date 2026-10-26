import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const output = 'visual-qa-output';
fs.mkdirSync(output, { recursive: true });
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4173/Migration-ust/our-approach-mapped/';
const browser = await chromium.launch({headless:true});
try {
  for (const variant of ['desktop','mobile']) {
    const width = variant === 'desktop' ? 1280 : 390;
    const context = await browser.newContext({ viewport: {width,height:900}, deviceScaleFactor:1, reducedMotion:'reduce' });
    const page=await context.newPage();
    const response=await page.goto(base,{waitUntil:'networkidle',timeout:45000});
    if (!response || !response.ok()) throw new Error('Preview page unavailable: '+(response?.status() ?? 'no response'));
    await page.addStyleTag({content: `
      .bar,.reviewbar {display:none !important}
      *,*::before,*::after { animation:none !important; transition:none !important; caret-color:transparent !important }
      html { scroll-behavior: auto !important }
    `});
    await page.evaluate(async()=>{await document.fonts.ready;});
    await page.screenshot({path:path.join(output,'browser-'+variant+'.png'),fullPage:true,animations:'disabled'});
    const boxes=await page.locator('[data-component]').evaluateAll(nodes=>nodes.map(n=>{
      const r=n.getBoundingClientRect();
      return {code:n.dataset.component,x:Math.round(r.x),y:Math.round(r.y+window.scrollY),width:Math.round(r.width),height:Math.round(r.height)};
    }));
    fs.writeFileSync(path.join(output,'browser-'+variant+'-sections.json'),JSON.stringify(boxes,null,2));
    await context.close();
    console.log(variant, 'captured, sections=',boxes.length);
  }
} finally {
  await browser.close();
}
