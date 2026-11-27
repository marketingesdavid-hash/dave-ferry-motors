const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
 const browser = await chromium.launch({headless:true});
 fs.mkdirSync('qa-single-screen',{recursive:true});
 for(const [w,h] of [[320,568],[360,640],[390,740],[430,820],[740,360],[832,384]]){
  for(const path of ['/', '/shop/nsu-500-1t-1930/']){
   const page=await browser.newPage({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:1});
   const errors=[];page.on('pageerror', e=>errors.push(String(e)));
   await page.goto('http://127.0.0.1:8000'+path,{waitUntil:'domcontentloaded'});
   const g=page.locator('.dfm3-gallery');
   await g.locator('.dfm3-base').waitFor();
   await page.waitForFunction(()=>document.querySelector('.dfm3-base')?.naturalWidth>0);
   const open=g.locator('[data-editor-open]');
   assert.ok(await open.isVisible(),'Editor button hidden at '+w+'x'+h+' '+path);
   await open.click();
   const d=page.locator('.dfm41-editor[open]');
   await d.waitFor();
   await d.locator('[data-color="4"]').click();
   await page.waitForFunction(()=>document.querySelector('.dfm41-editor .dfm3-base')?.alt.includes('burgundy'));
   await d.locator('[data-garment="1"]').click();
   await page.waitForFunction(()=>document.querySelector('.dfm41-editor .dfm3-base')?.alt.includes('hoodie'));
   await d.locator('[data-model="1"]').click();
   await page.waitForFunction(()=>document.querySelector('.dfm41-editor .dfm3-base')?.alt.startsWith('Sophie'));
   await d.locator('[data-scale="-1"]').click();
   const box=await d.evaluate(el=>{
    const sels=['.dfm3-stage','.dfm3-colors','.dfm3-mini-models','.dfm3-garments','.dfm3-scale-row','.dfm3-direction-pad','[data-print-reset]','[data-editor-apply]','[data-editor-cancel]'];
    if(el.querySelector('.dfm3-mobile-design'))sels.push('.dfm3-mobile-design');
    return {viewport:[innerWidth,innerHeight],height:el.clientHeight,scrollHeight:el.scrollHeight,items:sels.map(s=>{const n=el.querySelector(s),r=n.getBoundingClientRect();return {selector:s,x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}})};
   });
   const tag=w+'x'+h+(path==='/'?'-home':'-nsu');
   fs.writeFileSync('qa-single-screen/'+tag+'.json',JSON.stringify({box,errors},null,2));
   await page.screenshot({path:'qa-single-screen/'+tag+'.png'});
   assert.equal(errors.length,0,tag+' JS errors '+errors.join(';'));
   assert.ok(box.scrollHeight<=box.height+2,tag+' overflow '+JSON.stringify(box));
   for(const a of box.items)assert.ok(a.x>=-1&&a.y>=-1&&a.right<=w+1&&a.bottom<=h+1&&a.width>0&&a.height>0,tag+' clipped '+JSON.stringify(a));
   await d.locator('[data-editor-apply]').click();
   await page.waitForFunction(()=>!document.querySelector('.dfm41-editor')&&document.querySelector('.dfm3-base')?.alt.startsWith('Sophie'));
   await page.close();
  }
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
