// Validate the current static shop, including all pre-rendered v3.2 variants.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:1000}});
 await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>{window.__copied=t}},configurable:true})});
 await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:8000/')?r.continue():r.abort());
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:8000';
 const gallery=page.locator('#dfm3-feature-gallery');
 const labels=['Jack','Sophie','George','Emma'],keys=['jack','sophie','george','emma'],garments=['T-shirt','Hoodie'],gkeys=['tshirt','hoodie'],colours=['Black','White','Grey','Khaki green','Burgundy'],ckeys=['black','white','gray','khaki','burgundy'];
 const pick=async(sel,i)=>{await gallery.locator(sel).nth(i).click();await page.waitForFunction(({sel,i})=>{const g=document.querySelector('#dfm3-feature-gallery');return !g.hasAttribute('aria-busy')&&g.querySelectorAll(sel)[i]?.getAttribute('aria-pressed')==='true'},{sel,i});};
 const read=()=>gallery.evaluate(el=>{const portrait=el.querySelector('.dfm3-portrait'),img=portrait.querySelector('.dfm3-base'),print=portrait.querySelector('.dfm3-print'),r=portrait.getBoundingClientRect(),p=print.getBoundingClientRect();return {count:portrait.querySelectorAll('.dfm3-base').length,src:img.src,loaded:img.complete&&img.naturalWidth===596&&img.naturalHeight===653,coords:[(p.left+p.width/2-r.left)/r.width,(p.top-r.top)/r.height,p.width/r.width,p.height/r.height],counter:el.querySelector('.dfm3-stage-counter').textContent,printSrc:print.querySelector('img').getAttribute('src')}});
 fs.mkdirSync('qa-preview',{recursive:true});
 let reference;
 for(const [route,viewport,tag] of [['/index.html',{width:1280,height:1000},'desktop'],['/index.html',{width:390,height:844},'mobile'],['/shop/nsu-500-1t-1930/?model=sophie&garment=hoodie&color=burgundy',{width:390,height:844},'product']]){
  await page.setViewportSize(viewport);
  await page.goto(base+route,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{const g=document.querySelector('#dfm3-feature-gallery');return g.querySelectorAll('[data-color]').length===5&&!g.hasAttribute('aria-busy')});
  if(tag==='product')assert.equal((await read()).counter,'Sophie · Burgundy Hoodie · preview');
  const initialPrint=(await read()).printSrc;
  for(let g=0;g<2;g++)for(let m=0;m<4;m++){
   await pick('[data-garment]',g);await pick('[data-model]',m);
   const unique=new Set();
   for(let c=tag==='desktop'?0:3;c<5;c++){
    await pick('[data-color]',c);const data=await read();
    assert.equal(data.count,1);assert.ok(data.loaded);
    assert.equal(data.counter,labels[m]+' · '+colours[c]+' '+garments[g]+(c>=3?' · preview':''));
    if(c>=3)assert.ok(data.src.includes('/assets/models-v32/'+keys[m]+'-'+gkeys[g]+'-'+ckeys[c]+'.webp?v=32'));
    else assert.ok(data.src.startsWith('data:image/'));
    if(!reference)reference=data.coords;data.coords.forEach((v,j)=>assert.ok(Math.abs(v-reference[j])<.003,'Print anchor/width changed'));
    assert.equal(data.printSrc,initialPrint,'Motorcycle art changed when only garment colour changed');
    unique.add(data.src);
    if(c>=3)await gallery.locator('.dfm3-portrait').screenshot({path:'qa-preview/'+tag+'-'+g+'-'+m+'-'+c+'.png'});
   }
   assert.equal(unique.size,tag==='desktop'?5:2,'Colour previews must be distinct');
  }
  if(tag==='product'){
   await page.locator('#dfm3-size-home').selectOption('M');
   await page.locator('[data-action="copy"]').click();
   await page.waitForFunction(()=>window.__copied?.includes('Colour: Burgundy'));
   assert.ok((await page.evaluate(()=>window.__copied)).includes('Size: M'));
  }
 }
 assert.deepEqual(errors,[],'Page JavaScript error');
 console.log('PASS: 40 desktop, 16 mobile, 16 product combinations; static images decoded, same print rectangle, colour order copy.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
