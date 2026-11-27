
(()=>{
'use strict';
// The first item is the newest approved design. Add each future design at the beginning.
const products=window.DFM_CATALOG;
const config=window.DFM_ORDER_CONFIG;
const productPage=document.body.dataset.product||'';
const params=new URLSearchParams(location.search);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const urlFor=(p,st)=>'/shop/'+p.slug+'/'+(st?'?'+new URLSearchParams({model:models[st.m].key,garment:garments[st.g].key,color:colors[st.c].key}).toString():'');
function metric(name,p){window.dispatchEvent(new CustomEvent('dfm:shop',{detail:{event:name,productId:p.id}}));}
function checkoutUrl(p,st){if(!config.checkoutEnabled||!p.partner.verified||!p.partner.url)return null;try{const u=new URL(p.partner.url);if(u.protocol!=='https:'||!['spprint.be','www.spprint.be'].includes(u.hostname))return null;const v=p.partner.variants||{},r=p.partner.referral;const selected={garment:garments[st.g].key,color:colors[st.c].key,size:st.size,quantity:String(st.qty)};for(const [k,s] of Object.entries(selected)){const rule=v[k];if(rule?.parameter&&s)u.searchParams.set(rule.parameter,rule.values?.[s]??s)}if(r?.parameter&&r?.value)u.searchParams.set(r.parameter,r.value);return u.href}catch{return null}}
const models=[{"key":"jack","legacy":"athletic","label":"Jack","legacyTop":"42%","legacyWidth":"32%","t":{"box":[12,12,584,625],"print":[50,43,34],"poly":[[124,376],[129,302],[163,252],[240,211],[249,209],[261,232],[300,240],[335,229],[343,208],[401,233],[440,264],[465,310],[471,369],[414,385],[399,438],[407,570],[364,595],[235,599],[197,573],[201,455],[181,384]]},"h":{"box":[12,20,584,614],"print":[50,53,31],"poly":[[111,407],[120,322],[154,269],[215,235],[211,208],[230,181],[253,182],[264,218],[300,246],[327,220],[346,181],[372,190],[388,216],[382,239],[442,266],[471,308],[487,401],[477,492],[440,548],[414,551],[396,535],[377,547],[359,585],[227,585],[210,546],[185,529],[165,546],[138,514],[115,451]]}},{"key":"sophie","legacy":"blonde","label":"Sophie","legacyTop":"45%","legacyWidth":"27%","t":{"box":[12,60,584,601],"print":[55,46,27],"poly":[[157,340],[166,302],[181,270],[216,254],[243,269],[277,268],[317,265],[353,242],[405,265],[432,285],[453,337],[403,360],[392,421],[398,524],[365,551],[344,569],[249,570],[209,551],[206,474],[214,397],[207,355]]},"h":{"box":[12,66,584,595],"print":[54,53,27],"poly":[[134,425],[153,349],[167,301],[197,277],[220,255],[246,261],[282,273],[313,265],[352,236],[400,258],[432,285],[449,341],[481,435],[464,494],[432,540],[402,552],[389,535],[370,534],[344,577],[245,577],[220,538],[196,532],[179,552],[152,524],[137,477]]}},{"key":"george","legacy":"older","label":"George","legacyTop":"42%","legacyWidth":"35%","t":{"box":[12,12,584,630],"print":[50,43,35],"poly":[[104,374],[126,302],[163,251],[238,205],[250,220],[273,238],[320,239],[345,224],[355,201],[413,225],[453,256],[481,303],[501,375],[434,398],[426,442],[429,552],[398,588],[367,608],[229,611],[183,577],[185,481],[169,397]]},"h":{"box":[12,12,584,630],"print":[50,52,33],"poly":[[96,419],[109,337],[135,289],[180,246],[206,229],[202,205],[223,173],[250,176],[264,211],[302,244],[332,221],[350,173],[372,185],[392,208],[386,232],[445,261],[480,309],[502,361],[511,435],[493,501],[459,560],[429,581],[410,555],[388,557],[370,589],[364,606],[234,606],[213,565],[188,552],[162,573],[135,547],[111,493]]}},{"key":"emma","legacy":"curvy","label":"Emma","legacyTop":"45%","legacyWidth":"33%","t":{"box":[12,66,584,593],"print":[50,45,32],"poly":[[138,348],[150,302],[178,265],[219,241],[252,244],[282,263],[320,265],[348,242],[385,239],[424,255],[450,290],[475,349],[417,374],[415,441],[423,530],[390,550],[359,569],[254,569],[213,555],[188,535],[204,440],[198,374]]},"h":{"box":[12,74,584,588],"print":[50,52,31],"poly":[[116,425],[134,347],[152,301],[179,265],[219,242],[241,226],[264,246],[297,258],[327,246],[352,225],[385,240],[427,263],[459,302],[480,352],[500,421],[484,490],[455,539],[425,553],[402,531],[383,543],[354,573],[244,573],[217,542],[193,524],[168,548],[143,523],[125,477]]}}];
const colors=[{key:'black',label:'Black',hex:'#171717'},{key:'white',label:'White',hex:'#fff'},{key:'gray',label:'Grey',hex:'#898989'},{key:'khaki',label:'Khaki green',hex:'#626b46'}];
const garments=[{key:'tshirt',label:'T-shirt'},{key:'hoodie',label:'Hoodie'}];
const stateMap=new WeakMap();
const portraitCache=new Map(),baseCache=new Map();
// Each garment photograph has an independently calibrated, bounded chest rectangle.
const frame={w:596,h:653};
// A single common print rectangle for all four models, both garments and all colours.
const sharedChest=Object.freeze([198,249,200,110]);
function chestArea(m,g){return sharedChest;}
function modelSource(m,g,c){const key=m.key+'-'+g.key+'-'+(c?.key==='khaki'?'gray':c?.key??'black');return window.DFM_MODELS_V4?.[key]??'';}
// Images are stored as compact base64 WebP/PNG wrapped in local SVG text files.
// Some browsers block nested raster rendering inside SVG <img>; unwrap on load.
const imageUrlCache=new Map();
function hydrateImages(root){
 root.querySelectorAll('img[src^="/assets/dfm-"][src$=".svg"]').forEach(img=>{
  const path=img.getAttribute('src');let request=imageUrlCache.get(path);
  if(!request){request=fetch(path,{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error('Asset '+path);return r.text()}).then(svg=>{const m=svg.match(/href="(data:image\/(?:webp|png|jpeg);base64,[^"]+)"/i);return m?m[1]:path});imageUrlCache.set(path,request)}
  request.then(real=>{if(img.getAttribute('src')===path)img.src=real}).catch(()=>{img.alt+=' (image unavailable)'});
 });
}

function stageHtml(p,st){
 const m=models[st.m],c=colors[st.c],g=garments[st.g];
 const src=modelSource(m,g,c),[x,y,w,h]=chestArea(m,g);
 const ink=['black','khaki'].includes(c.key)?'#f5e9d0':'#1d1e1b';
 return `<div class="dfm3-stage" role="group" aria-label="Swipe to view different motorcycle designs"><div class="dfm3-portrait"><img class="dfm3-base" src="${src}" alt="${m.label} wearing a ${c.label.toLowerCase()} ${g.label.toLowerCase()}" draggable="false"><div class="dfm3-print${p.fullPrint?' dfm3-full-print':p.key==='nsu'?' dfm3-nsu-print':''}" style="--chest-left:${100*x/frame.w}%;--chest-top:${100*y/frame.h}%;--chest-width:${100*w/frame.w}%;--chest-height:${100*h/frame.h}%;--ink-on-shirt:${ink}"><img src="${p.print}" alt="" draggable="false">${p.fullPrint?'':`<span class="dfm3-print-name">${p.info}</span><span class="dfm3-print-domain">daveferrymotors.com</span>`}</div></div><button class="dfm3-carousel-btn prev" type="button" aria-label="Previous design"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><button class="dfm3-carousel-btn next" type="button" aria-label="Next design"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></div><div class="dfm3-stage-counter" aria-live="polite">${m.label} · ${c.label} ${g.label}${c.key==='khaki'?' · preview':''}</div>`;
}
function galleryHtml(p,st){
 return stageHtml(p,st)+`<div class="dfm3-design-label">Choose motorcycle design</div><div class="dfm3-design-strip" aria-label="Choose motorcycle design">${products.map((v,i)=>`<button type="button" data-design="${i}" aria-pressed="${v.key===p.key}" aria-label="${v.title}" title="${v.title}"><img src="${v.art}" alt="" draggable="false"><span>${v.title}</span></button>`).join('')}</div><div class="dfm3-garments" aria-label="Choose clothing type">${garments.map((g,i)=>`<button type="button" data-garment="${i}" aria-pressed="${i===st.g}">${g.label}</button>`).join('')}</div><div class="dfm3-mini-models" aria-label="Choose model">${models.map((m,i)=>`<button type="button" data-model="${i}" aria-pressed="${i===st.m}">${m.label}</button>`).join('')}</div><div class="dfm3-colors" aria-label="Choose clothing colour">${colors.map((c,i)=>`<button type="button" class="dfm3-color" data-color="${i}" aria-pressed="${i===st.c}"><span class="dfm3-swatch" style="background:${c.hex}"></span>${c.label}</button>`).join('')}</div>`;
}
function clamp01(v){return Math.max(0,Math.min(1,v));}
// Create a new raster preview from the registered garment photos; no CSS tint.
const rasterCache=new Map();
const smooth=(a,b,x)=>{const t=clamp01((x-a)/(b-a));return t*t*(3-2*t)};
const lum=(d,i)=>.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];
function loadRaster(src){return new Promise((ok,fail)=>{const im=new Image();im.onload=()=>{try{const cv=document.createElement('canvas');cv.width=frame.w;cv.height=frame.h;const cx=cv.getContext('2d',{willReadFrequently:true});cx.drawImage(im,0,0,frame.w,frame.h);ok({cv,cx,pixels:cx.getImageData(0,0,frame.w,frame.h)})}catch(e){fail(e)}};im.onerror=fail;im.src=src})}
function repairBeard(target,reference){const d=target.data,r=reference.data;for(let y=125;y<209;y++)for(let x=232;x<366;x++){const q=Math.sqrt(((x-299)/61)**2+((y-169)/38)**2),a=1-smooth(.68,1,q);if(a<=0)continue;const i=(y*frame.w+x)*4;for(let k=0;k<3;k++)d[i+k]=Math.round(d[i+k]*(1-a)+r[i+k]*a)}}
function khakiPixels(base,gray,white,m,g){
 const d=base.data,r=gray.data,w=white.data,W=frame.w,H=frame.h;
 const top=g.key==='hoodie'?(m.key==='george'?181:179):190;
 const bottom=g.key==='hoodie'?({jack:610,sophie:570,george:624,emma:590}[m.key]):({jack:585,sophie:524,george:634,emma:532}[m.key]);
 // Detect textile by the registered colour variants, not a rectangular neckline exclusion.
 // Preserve skin, hair and background where the source colours do not change.
 const mask=new Float32Array(W*H),visited=new Uint8Array(W*H);
 for(let y=top;y<bottom;y++)for(let x=64;x<536;x++){const p=y*W+x,i=p*4;
 const l=lum(d,i),gl=lum(r,i),wl=lum(w,i),chroma=Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2]);
 mask[p]=smooth(12,48,gl-l)*smooth(30,90,wl-l)*(1-smooth(18,48,chroma))*(1-smooth(95,150,l));
 }
 // Limit the colour change to the connected garment component, including the collar.
 const queue=new Int32Array(W*H);let read=0,end=0;
 const push=p=>{if(p>=0&&p<mask.length&&!visited[p]&&mask[p]>.025){visited[p]=1;queue[end++]=p}};
 for(let y=280;y<350;y+=10)for(let x=260;x<340;x+=10)push(y*W+x);
 while(read<end){const p=queue[read++],x=p%W;if(x>0)push(p-1);if(x<W-1)push(p+1);push(p-W);push(p+W)}
 let changed=0;
 for(let j=0;j<end;j++){const p=queue[j],i=p*4,alpha=mask[p];
 const gl=lum(r,i),shade=clamp01((gl-104)/100+.5),gain=.68+.64*shade;
 const rgb=[98*gain,107*gain,70*gain];for(let k=0;k<3;k++)d[i+k]=Math.round(d[i+k]*(1-alpha)+rgb[k]*alpha);changed++;
 }return changed
}
function recolorPortrait(m,g,c){
 const src=modelSource(m,g,c),repair=m.key==='george'&&g.key==='hoodie'&&c.key!=='gray';
 if(!src)return Promise.reject(new Error('Missing model preview'));
 if(c.key!=='khaki'&&!repair)return Promise.resolve(src);
 const key=m.key+'-'+g.key+'-'+c.key;
 if(!rasterCache.has(key)){const gray=modelSource(m,g,{key:'gray'}),black=modelSource(m,g,{key:'black'}),white=modelSource(m,g,{key:'white'});
 const task=(async()=>{if(c.key==='khaki'){const [b,r,w]=await Promise.all([loadRaster(black),loadRaster(gray),loadRaster(white)]);if(khakiPixels(b.pixels,r.pixels,w.pixels,m,g)<10000)throw Error('Garment mask unavailable');if(repair)repairBeard(b.pixels,r.pixels);b.cx.putImageData(b.pixels,0,0);return b.cv.toDataURL('image/png')}
 const [b,r]=await Promise.all([loadRaster(src),loadRaster(gray)]);repairBeard(b.pixels,r.pixels);b.cx.putImageData(b.pixels,0,0);return b.cv.toDataURL('image/png')})();rasterCache.set(key,task);task.catch(()=>rasterCache.delete(key))}
 return rasterCache.get(key);
}
function artwork(p){return '<button type="button" class="dfm3-zoom-trigger" data-zoom aria-label="Enlarge artwork"><img class="dfm3-art" src="'+esc(p.art)+'" alt="'+esc(p.title)+' artwork"><span>Enlarge artwork ⤢</span></button>'}
const sizeCharts={"women":{"title":"SOL’S 11502 – Imperial Women’s T-shirt","image":"https://spprint.be/image/catalog/meret1.png","rows":[["S",61,41],["M",63,44],["L",65,47],["XL",67,50],["2XL",69,53]]},"men":{"title":"SOL’S 11500 – Imperial Men’s T-shirt","image":"https://spprint.be/image/catalog/meret2.png","rows":[["XS",62,49],["S",70,50],["M",72,53],["L",74,56],["XL",76,59],["2XL",78,62],["3XL",80,64],["4XL",84,68]]},"hoodie":{"title":"SOL’S 13251 – SLAM Unisex Hooded Sweatshirt","image":"https://spprint.be/image/catalog/meret4.png","rows":[["XS",65,48],["S",67,51],["M",69,54],["L",71,57],["XL",73,60],["2XL",75,53]]}};
function chartTable(chart){return '<div class="dfm3-size-table-wrap"><table class="dfm3-size-table"><caption>'+esc(chart.title)+'</caption><thead><tr><th scope="col">Size</th><th scope="col">Length (cm)</th><th scope="col">Width (cm)</th></tr></thead><tbody>'+chart.rows.map(row=>'<tr><th scope="row">'+esc(row[0])+'</th><td>'+row[1]+'</td><td>'+row[2]+(chart===sizeCharts.hoodie&&row[0]==='2XL'?' *':'')+'</td></tr>').join('')+'</tbody></table><a class="dfm3-foot" href="'+chart.image+'" target="_blank" rel="noopener">Original SP Print measurement diagram ↗</a></div>'}
function sizeGuideHtml(st){const hood=garments[st.g].key==='hoodie';return '<details class="dfm3-size-guide" open><summary>Size chart – '+(hood?'Hoodie':'T-shirt')+' (cm)</summary><p class="dfm3-foot">Measurements refer to the garment laid flat, not body circumference. Compare with a garment you own.</p>'+(hood?chartTable(sizeCharts.hoodie)+'<p class="dfm3-foot">* SP Print lists 53 cm for 2XL, less than XL. Please confirm this measurement with the printer before ordering.</p>':chartTable(sizeCharts.men)+chartTable(sizeCharts.women))+'<p class="dfm3-foot">Published garment tolerance: ±2.5/3 cm; shrinkage tolerance: 5%. Reference charts only: the exact garment model, fit, sizes and stock must be confirmed. <a href="'+config.sizeGuide+'" target="_blank" rel="noopener">SP Print official size guide ↗</a></p></details>'}
function detailHtml(p,st){
 const heading='<p class="dfm3-label">Original motorcycle apparel</p><h3>'+esc(p.title)+'</h3><p class="dfm3-muted">'+esc(p.story)+'</p>';
 if(!productPage)return artwork(p)+heading+'<a class="dfm3-cta dfm3-product-link" href="'+urlFor(p,st)+'">View product · sizes &amp; ordering</a>';
 const price=p.prices[garments[st.g].key],ready=checkoutUrl(p,st);
 return artwork(p)+heading+'<p class="dfm3-price">'+(price==null?'Price confirmed on request':esc(price))+'</p><label class="dfm3-size-label" for="dfm3-size-home">Clothing size</label><select id="dfm3-size-home" class="dfm3-size"><option value="">Select size</option>'+p.sizes.map(v=>'<option value="'+esc(v)+'" '+(v===st.size?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select><label class="dfm3-size-label" for="dfm3-qty">Quantity</label><input id="dfm3-qty" type="number" min="1" max="99" step="1" value="'+st.qty+'">'+sizeGuideHtml(st)+(colors[st.c].key==='khaki'?'<p class="dfm3-foot">Khaki is a visual preview; exact shade and availability are subject to printer confirmation.</p>':'')+'<button class="dfm3-cta" type="button" data-action="enquiry">'+(ready?'Continue to order':'Request order quote')+'</button><button class="dfm3-cta dfm3-secondary" type="button" data-action="copy">Copy order details</button><p class="dfm3-foot dfm3-order-status" role="status"></p><p class="dfm3-foot">An enquiry is not a confirmed order. No payment is taken here. The email opens in your email app and is sent only by you. The partner must confirm price, size, availability, shipping and terms.</p><details class="dfm3-order-info"><summary>Production, delivery &amp; policies</summary><p class="dfm3-foot">Printing partner: <a href="'+config.partnerHome+'">SP Print</a>. <a href="'+config.shipping+'" target="_blank" rel="noopener">Shipping and returns</a> · <a href="'+config.terms+'" target="_blank" rel="noopener">Partner terms</a>. A dedicated Dave Ferry Motors checkout is not yet available.</p></details><p class="dfm3-foot">Garment preview is a digital illustration, not a production photograph.</p>'+(p.videoUrl?'<p><a href="'+esc(p.videoUrl)+'" target="_blank" rel="noopener">Watch the original motorcycle film</a></p>':'');
}
function zoomArt(p){let d=document.getElementById('dfm3-art-zoom');if(!d){d=document.createElement('dialog');d.id='dfm3-art-zoom';d.innerHTML='<div class="dfm3-zoom-bar"><strong>Motorcycle artwork</strong><button type="button" data-grow>Zoom +</button><button type="button" data-reset>Reset</button><button type="button" data-close aria-label="Close artwork">×</button></div><div class="dfm3-zoom-scroll"><img alt=""></div>';document.body.appendChild(d);const i=d.querySelector('img');let scale=1;d.querySelector('[data-grow]').onclick=()=>{scale=Math.min(3,scale+.5);i.style.width=scale*100+'%'};d.querySelector('[data-reset]').onclick=()=>{scale=1;i.style.width='100%'};d.querySelector('[data-close]').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d)d.close()});}
 const i=d.querySelector('img');d.querySelector('[data-reset]').click();i.src=p.art;i.alt=p.title;hydrateImages(d);d.showModal();metric('artwork_zoom',p);
}
function mount(gallery,detail,p){
 const pick=(arr,key)=>Math.max(0,arr.findIndex(x=>x.key===params.get(key)));const st={m:productPage?pick(models,'model'):0,c:productPage?pick(colors,'color'):0,g:productPage?pick(garments,'garment'):0,size:'',qty:1,d:products.indexOf(p)};stateMap.set(gallery,{p,st,detail});
 const modal=detail.closest('dialog')!==null;
 function renderDetail(){
  document.getElementById('latest-design-title').textContent=p.title;
  if(productPage)document.title=p.title+' | Dave Ferry Motors apparel';
  detail.innerHTML=detailHtml(p,st);hydrateImages(detail);
  detail.querySelector('[data-zoom]').onclick=()=>zoomArt(p);
  const link=detail.querySelector('.dfm3-product-link');if(link){link.onclick=()=>metric('product_open',p);return}
  const size=detail.querySelector('select'),qty=detail.querySelector('#dfm3-qty'),msg=detail.querySelector('.dfm3-order-status');size.onchange=()=>st.size=size.value;qty.oninput=()=>st.qty=Number(qty.value);
  const reference=st.reference||(st.reference='DFM-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)).toUpperCase());
  function orderText(){if(!p.sizes.includes(st.size)){msg.textContent='Please choose a size.';size.focus();return null}if(!Number.isInteger(st.qty)||st.qty<1||st.qty>99){msg.textContent='Please enter a quantity from 1 to 99.';qty.focus();return null}
  return ['Dave Ferry Motors – order quote request','Reference: '+reference,'Product ID: '+p.id,'Design: '+p.title,'Garment: '+garments[st.g].label,'Colour: '+colors[st.c].label,'Size: '+st.size,'Quantity: '+st.qty,'Product: '+location.origin+urlFor(p,st),'Please confirm availability, total price and shipping before payment.'].join('\n')}
  detail.querySelector('[data-action="enquiry"]').onclick=()=>{const t=orderText();if(!t)return;const destination=checkoutUrl(p,st);if(destination){metric('partner_checkout',p);location.href=destination;return}metric('order_enquiry',p);msg.textContent='Opening your email app. Review and send the request to SP Print. No order has been placed.';location.href='mailto:'+config.enquiryEmail+'?subject='+encodeURIComponent('Dave Ferry Motors quote – '+p.id)+'&body='+encodeURIComponent(t)};
  detail.querySelector('[data-action="copy"]').onclick=async()=>{const t=orderText();if(!t)return;try{await navigator.clipboard.writeText(t);msg.textContent='Order details copied.'}catch{msg.textContent=t;msg.style.whiteSpace='pre-wrap'}};
 }
 let redrawVersion=0,lastGood=null;
 function redraw(){
  const version=++redrawVersion,selected={...st},selectedProduct=p;
  const oldStrip=gallery.querySelector('.dfm3-design-strip'),left=oldStrip?oldStrip.scrollLeft:0;
  const pending=document.createElement('div');pending.innerHTML=galleryHtml(selectedProduct,selected);
  const img=pending.querySelector('.dfm3-base'),m=models[selected.m],g=garments[selected.g],c=colors[selected.c];
  gallery.setAttribute('aria-busy','true');
  recolorPortrait(m,g,c).then(async url=>{
   img.src=url;await img.decode();
   if(version!==redrawVersion||!gallery.isConnected)return;
   // One atomic DOM replacement: no intermediate old/new garment superposition.
   gallery.replaceChildren(...pending.childNodes);gallery.removeAttribute('aria-busy');lastGood={...selected,p:selectedProduct};
   const strip=gallery.querySelector('.dfm3-design-strip');strip.scrollLeft=left;
   const chosen=strip.querySelector('[aria-pressed="true"]');if(chosen){const b=chosen.getBoundingClientRect(),v=strip.getBoundingClientRect();if(b.left<v.left)strip.scrollLeft-=v.left-b.left+4;else if(b.right>v.right)strip.scrollLeft+=b.right-v.right+4}
   hydrateImages(gallery);
  }).catch(()=>{
   if(version!==redrawVersion||!gallery.isConnected)return;
   gallery.removeAttribute('aria-busy');
   // Never fall back to a different coloured photograph with mismatched pose or outline.
   if(lastGood){const {p:previous,...previousState}=lastGood;Object.assign(st,previousState);p=previous;stateMap.get(gallery).p=p;renderDetail();}
   else {gallery.replaceChildren(...pending.childNodes);gallery.querySelector('.dfm3-base').hidden=true;gallery.querySelector('.dfm3-print').hidden=true;hydrateImages(gallery);}
   const note=gallery.querySelector('.dfm3-stage-counter');if(note)note.textContent='Selected preview unavailable — please retry.';
  });
 }
 function changeDesign(i){st.d=(i+products.length)%products.length;p=products[st.d];stateMap.get(gallery).p=p;renderDetail();redraw()}
 gallery.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.design!==undefined){changeDesign(+b.dataset.design);return}if(b.matches('.next')){changeDesign(st.d+1);return}if(b.matches('.prev')){changeDesign(st.d-1);return}if(b.dataset.model!==undefined)st.m=+b.dataset.model;else if(b.dataset.color!==undefined)st.c=+b.dataset.color;else if(b.dataset.garment!==undefined)st.g=+b.dataset.garment;else return;renderDetail();redraw()});
 let touch=null;gallery.addEventListener('touchstart',e=>{if(e.target.closest('.dfm3-stage'))touch=[e.changedTouches[0].screenX,e.changedTouches[0].screenY]},{passive:true});
 gallery.addEventListener('touchend',e=>{if(!touch)return;const dx=e.changedTouches[0].screenX-touch[0],dy=e.changedTouches[0].screenY-touch[1];touch=null;if(!productPage&&Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.3)changeDesign(st.d+(dx<0?1:-1))},{passive:true});gallery.addEventListener('touchcancel',()=>{touch=null},{passive:true});
 renderDetail();redraw();
}
function card(p){const price=Object.values(p.prices).filter(v=>v!=null)[0];return '<article class="dfm3-card"><a class="dfm3-card-art" href="'+urlFor(p)+'"><img src="'+esc(p.art)+'" alt="'+esc(p.title)+'" loading="lazy"></a><h3>'+esc(p.title)+'</h3>'+(price?'<p>From '+esc(price)+'</p>':'')+'<a class="dfm3-cta" href="'+urlFor(p)+'">View Product</a></article>'}
const gallery=document.getElementById('dfm3-feature-gallery'),detail=document.getElementById('dfm3-feature-detail');
const f=productPage?products.find(p=>p.slug===productPage):products[0];
if(!f||!gallery||!detail)throw Error('Product catalogue unavailable');
document.getElementById('latest-design-title').textContent=f.title;mount(gallery,detail,f);
if(productPage){metric('product_view',f)}else{const list=document.getElementById('dfm3-archive'),more=document.getElementById('dfm3-show-all');let expanded=false;function renderCollection(){list.innerHTML=products.slice(0,expanded?products.length:6).map(card).join('');hydrateImages(list);more.hidden=products.length<=6;more.textContent=expanded?'Show fewer designs':'Show All Designs ('+products.length+')';more.setAttribute('aria-expanded',String(expanded))}more.onclick=()=>{expanded=!expanded;renderCollection()};renderCollection()}
})();
