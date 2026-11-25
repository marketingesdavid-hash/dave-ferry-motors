// Run against a local server serving this checkout: npm install --no-save playwright && npx playwright install chromium
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:1000}});
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:8000/')?r.continue():r.abort());
 const bad=[],errors=[];
 page.on('request',r=>{if(/assets\/approved\/models\/[^/]+-(black|white)\.webp(?:\?|$)/.test(r.url()))bad.push(r.url())});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8000/index.html',{waitUntil:'domcontentloaded'});
 const gallery=page.locator('#dfm3-feature-gallery');
 const labels=['Jack','Sophie','George','Emma'],garments=['T-shirt','Hoodie'],colours=['Black','White','Grey'];
 const pick=async(sel,i)=>{await gallery.locator(sel).nth(i).click();await gallery.locator(sel).nth(i).waitFor({state:'visible'});await page.waitForFunction(({sel,i})=>{const g=document.querySelector('#dfm3-feature-gallery');return !g.hasAttribute('aria-busy')&&g.querySelectorAll(sel)[i]?.getAttribute('aria-pressed')==='true'},{sel,i});};
 let reference;
 fs.mkdirSync('qa-preview',{recursive:true});
 for(let g=0;g<2;g++)for(let m=0;m<4;m++){
  await pick('[data-garment]',g);await pick('[data-model]',m);
  const unique=new Set();
  for(let c=0;c<3;c++){
   await pick('[data-color]',c);
   const data=await gallery.evaluate(el=>{const portrait=el.querySelector('.dfm3-portrait'),img=portrait.querySelector('.dfm3-base'),print=portrait.querySelector('.dfm3-print'),r=portrait.getBoundingClientRect(),p=print.getBoundingClientRect();return {count:portrait.querySelectorAll('.dfm3-base').length,src:img.src,loaded:img.complete&&img.naturalWidth>0,coords:[(p.left+p.width/2-r.left)/r.width,(p.top-r.top)/r.height,p.width/r.width],counter:el.querySelector('.dfm3-stage-counter').textContent}});
   assert.equal(data.count,1);assert.ok(data.loaded);assert.ok(data.src.startsWith('data:image/png'));assert.equal(data.counter,labels[m]+' · '+colours[c]+' '+garments[g]);unique.add(data.src);
   if(!reference)reference=data.coords;data.coords.forEach((x,j)=>assert.ok(Math.abs(x-reference[j])<.002,'Print anchor/width changed'));
   await gallery.locator('.dfm3-portrait').screenshot({path:'qa-preview/'+g+'-'+m+'-'+c+'.png'});
  }
  assert.equal(unique.size,3,'Colour variants must differ');
 }
 assert.deepEqual(bad,[],'Separate coloured photo loaded');assert.deepEqual(errors,[],'Page JavaScript error');
 // Mobile must use the same relative anchor.
 await page.setViewportSize({width:390,height:844});await pick('[data-color]',0);
 const mobile=await gallery.evaluate(el=>{const r=el.querySelector('.dfm3-portrait').getBoundingClientRect(),p=el.querySelector('.dfm3-print').getBoundingClientRect();return [(p.left+p.width/2-r.left)/r.width,(p.top-r.top)/r.height,p.width/r.width]});
 mobile.forEach((x,j)=>assert.ok(Math.abs(x-reference[j])<.002,'Mobile print anchor/width changed'));
 console.log('PASS: 24 combinations, shared anchor, one neutral image source, mobile. Visual garment-edge review is still required.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
