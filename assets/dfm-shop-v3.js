
(()=>{
'use strict';
// The first item is the newest approved design. Add each future design at the beginning.
const products=window.DFM_CATALOG;
const config=window.DFM_ORDER_CONFIG;
const productPage=document.body.dataset.product||'';
const params=new URLSearchParams(location.search);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const urlFor=(p,st)=>'/shop/'+p.slug+'/'+(st?'?'+new URLSearchParams({model:models[st.m].key,garment:garments[st.g].key,color:colors[st.c].key,ps:st.ps.toFixed(5),nx:(st.px/frame.w).toFixed(7),ny:(st.py/frame.h).toFixed(7),size:st.size||'',qty:String(st.qty||1)}).toString():'');
function metric(name,p){window.dispatchEvent(new CustomEvent('dfm:shop',{detail:{event:name,productId:p.id}}));}
function checkoutUrl(p,st){if(!config.checkoutEnabled||!p.partner.verified||!p.partner.url)return null;try{const u=new URL(p.partner.url);if(u.protocol!=='https:'||!['spprint.be','www.spprint.be'].includes(u.hostname))return null;const v=p.partner.variants||{},r=p.partner.referral;const selected={garment:garments[st.g].key,color:colors[st.c].key,size:st.size,quantity:String(st.qty)};for(const [k,s] of Object.entries(selected)){const rule=v[k];if(rule?.parameter&&s)u.searchParams.set(rule.parameter,rule.values?.[s]??s)}if(r?.parameter&&r?.value)u.searchParams.set(r.parameter,r.value);return u.href}catch{return null}}
const models=[{"key":"jack","legacy":"athletic","label":"Jack","legacyTop":"42%","legacyWidth":"32%","t":{"box":[12,12,584,625],"print":[50,43,34],"poly":[[124,376],[129,302],[163,252],[240,211],[249,209],[261,232],[300,240],[335,229],[343,208],[401,233],[440,264],[465,310],[471,369],[414,385],[399,438],[407,570],[364,595],[235,599],[197,573],[201,455],[181,384]]},"h":{"box":[12,20,584,614],"print":[50,53,31],"poly":[[111,407],[120,322],[154,269],[215,235],[211,208],[230,181],[253,182],[264,218],[300,246],[327,220],[346,181],[372,190],[388,216],[382,239],[442,266],[471,308],[487,401],[477,492],[440,548],[414,551],[396,535],[377,547],[359,585],[227,585],[210,546],[185,529],[165,546],[138,514],[115,451]]}},{"key":"sophie","legacy":"blonde","label":"Sophie","legacyTop":"45%","legacyWidth":"27%","t":{"box":[12,60,584,601],"print":[55,46,27],"poly":[[157,340],[166,302],[181,270],[216,254],[243,269],[277,268],[317,265],[353,242],[405,265],[432,285],[453,337],[403,360],[392,421],[398,524],[365,551],[344,569],[249,570],[209,551],[206,474],[214,397],[207,355]]},"h":{"box":[12,66,584,595],"print":[54,53,27],"poly":[[134,425],[153,349],[167,301],[197,277],[220,255],[246,261],[282,273],[313,265],[352,236],[400,258],[432,285],[449,341],[481,435],[464,494],[432,540],[402,552],[389,535],[370,534],[344,577],[245,577],[220,538],[196,532],[179,552],[152,524],[137,477]]}},{"key":"george","legacy":"older","label":"George","legacyTop":"42%","legacyWidth":"35%","t":{"box":[12,12,584,630],"print":[50,43,35],"poly":[[104,374],[126,302],[163,251],[238,205],[250,220],[273,238],[320,239],[345,224],[355,201],[413,225],[453,256],[481,303],[501,375],[434,398],[426,442],[429,552],[398,588],[367,608],[229,611],[183,577],[185,481],[169,397]]},"h":{"box":[12,12,584,630],"print":[50,52,33],"poly":[[96,419],[109,337],[135,289],[180,246],[206,229],[202,205],[223,173],[250,176],[264,211],[302,244],[332,221],[350,173],[372,185],[392,208],[386,232],[445,261],[480,309],[502,361],[511,435],[493,501],[459,560],[429,581],[410,555],[388,557],[370,589],[364,606],[234,606],[213,565],[188,552],[162,573],[135,547],[111,493]]}},{"key":"emma","legacy":"curvy","label":"Emma","legacyTop":"45%","legacyWidth":"33%","t":{"box":[12,66,584,593],"print":[50,45,32],"poly":[[138,348],[150,302],[178,265],[219,241],[252,244],[282,263],[320,265],[348,242],[385,239],[424,255],[450,290],[475,349],[417,374],[415,441],[423,530],[390,550],[359,569],[254,569],[213,555],[188,535],[204,440],[198,374]]},"h":{"box":[12,74,584,588],"print":[50,52,31],"poly":[[116,425],[134,347],[152,301],[179,265],[219,242],[241,226],[264,246],[297,258],[327,246],[352,225],[385,240],[427,263],[459,302],[480,352],[500,421],[484,490],[455,539],[425,553],[402,531],[383,543],[354,573],[244,573],[217,542],[193,524],[168,548],[143,523],[125,477]]}}];
const colors=[{key:'black',label:'Black',hex:'#171717'},{key:'white',label:'White',hex:'#fff'},{key:'gray',label:'Grey',hex:'#898989'},{key:'khaki',label:'Military Green',hex:'#626b46'},{key:'burgundy',label:'Burgundy',hex:'#722f37'}];
const garments=[{key:'tshirt',label:'T-shirt'},{key:'hoodie',label:'Hoodie'}];
const stateMap=new WeakMap();
const portraitCache=new Map(),baseCache=new Map();
// Each garment photograph has an independently calibrated, bounded chest rectangle.
const frame={w:596,h:653};
// Conservative visual chest rectangles, calibrated against the preserved photos.
// Coordinates reference the 596 × 653 portrait, not physical manufacturing dimensions.
const safeChest={jack:{tshirt:[188,238,220,168],hoodie:[180,244,236,166]},sophie:{tshirt:[209,240,179,137],hoodie:[205,244,187,154]},george:{tshirt:[164,239,268,177],hoodie:[165,244,266,181]},emma:{tshirt:[191,239,214,150],hoodie:[185,247,226,164]}};
function chestArea(m,g){return safeChest[m.key][g.key]}
const printBase={w:200/1.2,h:110},limits={min:.5,max:1.8};
const bounded=(v,min,max)=>Math.max(min,Math.min(max,v));
function maxScale(st){const [,,w,h]=chestArea(models[st.m],garments[st.g]);return Math.floor(Math.min(limits.max,w/printBase.w,h/printBase.h)*100)/100}
function fitPrint(st){
 const [x,y,w,h]=chestArea(models[st.m],garments[st.g]);
 st.ps=bounded(Number.isFinite(st.ps)?st.ps:1,limits.min,maxScale(st));
 const a=printBase.w*st.ps,b=printBase.h*st.ps;
 st.px=bounded(Number.isFinite(st.px)?st.px:298,x+a/2,x+w-a/2);
 st.py=bounded(Number.isFinite(st.py)?st.py:304,y+b/2,y+h-b/2);
 return [st.px-a/2,st.py-b/2,a,b];
}
function printStyle(st){const [x,y,w,h]=fitPrint(st);return '--chest-left:'+100*x/frame.w+'%;--chest-top:'+100*y/frame.h+'%;--chest-width:'+100*w/frame.w+'%;--chest-height:'+100*h/frame.h+'%;--print-scale:'+st.ps}
function safeStyle(st){const [x,y,w,h]=chestArea(models[st.m],garments[st.g]);return 'left:'+100*x/frame.w+'%;top:'+100*y/frame.h+'%;width:'+100*w/frame.w+'%;height:'+100*h/frame.h+'%'}
function posParam(key,legacy,dimension,fallback){return params.has(key)?paramNumber(key,fallback/dimension)*dimension:paramNumber(legacy,fallback)}
function paramNumber(k,fallback){const v=params.get(k);return v===null||v.trim()===''?fallback:Number(v)}
function installPrintCss(){const style=document.createElement('style');style.textContent=`
.dfm3-feature{display:block}
.dfm3-gallery{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr) minmax(0,.78fr);gap:clamp(.65rem,2vw,1.5rem);align-items:start}
.dfm3-gallery>*{min-width:0}
.dfm3-stage,#dfm3-modal .dfm3-stage{width:100%;max-width:495px}
.dfm3-photo-column .dfm3-stage-counter{font-size:.84rem}
.dfm3-options-column .dfm3-design-strip{margin-bottom:.8rem}
.dfm3-options-column .dfm3-garments,.dfm3-options-column .dfm3-mini-models{margin-bottom:.8rem}
.dfm3-quick-product{display:block!important;width:100%;margin-top:.65rem}
.dfm3-feature>.dfm3-detail{margin:1rem 0 0}
.dfm3-portrait .dfm3-print{pointer-events:none}
.dfm3-portrait .dfm3-print-name{font-size:calc(1.15cqw * var(--print-scale,1))}
.dfm3-portrait .dfm3-print-domain{font-size:calc(.87cqw * var(--print-scale,1))}
.dfm3-portrait .dfm3-nsu-print .dfm3-print-name{font-size:calc(1.08cqw * var(--print-scale,1))}
.dfm3-portrait .dfm3-nsu-print .dfm3-print-domain{font-size:calc(.84cqw * var(--print-scale,1))}
.dfm3-print-touch{position:absolute;z-index:2;touch-action:none;cursor:grab;outline-offset:2px;user-select:none}
.dfm3-print-touch:active{cursor:grabbing}
.dfm3-edit-outline{position:absolute;z-index:3;pointer-events:none;border:1px dashed #e2f5d4;box-shadow:0 0 0 1px #0007;opacity:0}
.dfm3-portrait.dfm3-editing .dfm3-edit-outline,.dfm3-portrait:focus-within .dfm3-edit-outline,.dfm3-portrait:hover .dfm3-edit-outline{opacity:1}
.dfm3-resize-handle{position:absolute;right:-6px;bottom:-6px;pointer-events:auto;width:22px;height:22px;background:#a2d49c;border:2px solid #273c28;border-radius:4px;cursor:nwse-resize;touch-action:none;opacity:0}
.dfm3-portrait.dfm3-editing .dfm3-resize-handle,.dfm3-portrait:focus-within .dfm3-resize-handle,.dfm3-portrait:hover .dfm3-resize-handle{opacity:1}
.dfm3-print-controls{border:1px solid #63745d;background:#20251e;border-radius:10px;padding:.8rem;display:grid;gap:.55rem;font-size:.84rem}
.dfm3-print-controls h3{margin:0;font-size:1.05rem}
.dfm3-print-controls label{display:flex;align-items:center;justify-content:space-between;gap:.35rem;color:#f5e5c5}
.dfm3-print-controls input[type=range]{width:100%;margin:0;padding:0;accent-color:#a2d49c;background:transparent;border:0}
.dfm3-print-controls button{padding:.35rem .55rem;min-width:38px;min-height:38px;background:#172017;color:#f5e5c5;border:1px solid #75866a;border-radius:6px;line-height:1.15}
.dfm3-print-controls button:focus-visible{outline:2px solid #a2d49c;outline-offset:2px}
.dfm3-scale-row{display:flex;align-items:center;justify-content:center;gap:.7rem}
.dfm3-scale-row output{min-width:3.3em;text-align:center;font-weight:800;font-variant-numeric:tabular-nums}
.dfm3-direction-pad{display:grid;grid-template-columns:repeat(3,38px);gap:.3rem;justify-content:center}
.dfm3-direction-pad [data-move=up]{grid-column:2}.dfm3-direction-pad [data-move=left]{grid-column:1;grid-row:2}.dfm3-direction-pad [data-move=right]{grid-column:3;grid-row:2}.dfm3-direction-pad [data-move=down]{grid-column:2;grid-row:3}
.dfm3-print-controls [data-print-reset]{width:100%}
.dfm3-print-controls .dfm3-print-hint{margin:0;font-size:.75rem;color:#ccc7b7;line-height:1.35}
.dfm3-colors{overflow:visible!important;flex-wrap:wrap!important;max-height:none!important;gap:.45rem}
.dfm3-color{min-height:40px;font-size:.78rem}
.dfm3-color .dfm3-swatch{flex:0 0 19px}
.dfm3-options-title{font-size:.8rem;margin:.5rem 0 .25rem;font-weight:750;color:#e5e0d3}
@media(min-width:751px){.dfm3-feature>.dfm3-detail{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:.5rem 1.5rem;align-items:start}.dfm3-detail>.dfm3-zoom-trigger{grid-row:span 4}.dfm3-detail>.dfm3-size-guide,.dfm3-detail>.dfm3-order-info{grid-column:1/-1}}
@media(max-width:900px){.dfm3-gallery{grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr)}.dfm3-print-controls{grid-column:1/-1}}
@media(max-width:600px){.dfm3-gallery{display:flex;flex-direction:column;gap:.65rem}.dfm3-gallery>*{width:100%}.dfm3-stage,#dfm3-modal .dfm3-stage{width:100%;max-width:390px}.dfm3-print-controls{padding:.7rem}.dfm3-print-controls button{min-height:42px}.dfm3-direction-pad{grid-template-columns:repeat(3,42px)}.dfm3-colors{gap:.4rem}.dfm3-color{font-size:.8rem}}

.dfm3-editor-open{display:none}
.dfm41-editor{position:fixed;inset:0;width:100%;height:100%;height:100dvh;max-width:none;max-height:none;margin:0;padding:8px 12px max(8px,env(safe-area-inset-bottom));box-sizing:border-box;border:0;background:#171b16;color:#f5e5c5;overflow:auto}
.dfm41-editor[open]{display:flex;flex-direction:column;align-items:center;gap:6px}
.dfm41-editor::backdrop{background:#10120f}
.dfm41-editor-head,.dfm41-editor-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;width:min(100%,520px);flex:none}
.dfm41-editor .dfm41-editor-head{border:0;position:static;background:none;padding:0;min-height:0}.dfm41-editor .dfm41-editor-head h2{font-size:1.05rem;line-height:1.15;margin:0;padding:0}
.dfm41-editor-actions button,.dfm41-editor-head button{font:inherit;color:#f5e5c5;background:#263528;border:1px solid #75866a;border-radius:6px;min-height:42px;padding:5px 12px}
.dfm41-editor-actions button[data-editor-apply]{background:#a2d49c;color:#172017;font-weight:800;flex:1}
.dfm41-editor .dfm3-photo-column{flex:1;min-height:0;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden}
.dfm41-editor .dfm3-stage{width:min(100%,calc(max(110px,100dvh - 285px)*596/653));max-width:520px;flex:none;margin:0 auto;aspect-ratio:596/653}.dfm41-editor .dfm3-portrait{height:100%;width:100%;aspect-ratio:596/653;flex:none}.dfm41-editor .dfm3-base{object-fit:contain!important}
.dfm41-editor .dfm3-stage-counter{font-size:.7rem;line-height:1.1;margin:4px 0 0}
.dfm41-editor .dfm3-carousel-btn,.dfm41-editor .dfm3-editor-open,.dfm41-editor [data-share-config],.dfm41-editor [data-share-status]{display:none!important}
.dfm41-editor .dfm3-print-controls{width:min(100%,520px);box-sizing:border-box;flex:none}
.dfm41-editor .dfm3-print-controls,.dfm3-print-controls.dfm41-compact{display:grid;grid-template-columns:1fr;gap:5px;padding:6px 8px}
.dfm41-editor .dfm3-print-controls h3,.dfm41-editor .dfm3-print-controls>label,.dfm41-editor .dfm3-print-hint,.dfm41-compact .dfm3-print-controls h3{display:none}
.dfm41-editor .dfm3-scale-row,.dfm41-compact .dfm3-scale-row{gap:7px}
.dfm41-editor .dfm3-direction-pad,.dfm41-compact .dfm3-direction-pad{display:flex;gap:6px;justify-content:center}
.dfm41-editor .dfm3-print-controls button,.dfm41-compact button{min-height:38px;min-width:40px;padding:4px 8px}
.dfm41-editor .dfm3-print-controls [data-print-reset]{width:auto;justify-self:center}
@media(max-width:600px){
 .dfm3-gallery>.dfm3-photo-column{order:0}
 .dfm3-gallery>.dfm3-print-controls{order:1}
 .dfm3-gallery>.dfm3-options-column{order:2}
 .dfm3-gallery>.dfm3-photo-column .dfm3-stage{width:min(100%,calc(max(180px,100dvh - 240px)*596/653));margin:auto}
 .dfm3-gallery>.dfm3-print-controls{gap:5px;padding:6px 8px}
 .dfm3-gallery>.dfm3-print-controls h3{font-size:.9rem}
 .dfm3-gallery>.dfm3-print-controls>label{display:none}
 .dfm3-gallery>.dfm3-print-controls .dfm3-direction-pad{display:flex;justify-content:center;gap:6px}
 .dfm3-gallery>.dfm3-print-controls button{min-height:40px;min-width:40px;padding:4px 8px}
 .dfm3-gallery>.dfm3-print-controls .dfm3-print-hint{font-size:.68rem}
 .dfm3-gallery>.dfm3-print-controls .dfm3-print-hint:nth-last-of-type(1){display:none}
 .dfm3-gallery>.dfm3-print-controls .dfm3-editor-open{display:block;width:100%;background:#a2d49c;color:#172017;font-weight:750}
 .dfm3-gallery>.dfm3-print-controls [data-print-reset]{width:auto;justify-self:center}
 .dfm41-editor .dfm3-print-controls button{min-height:38px}
 .dfm41-editor .dfm3-stage{max-width:100%}
}
@media(max-height:500px) and (orientation:landscape){
 .dfm41-editor[open]{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto minmax(0,1fr) auto;overflow:auto}
 .dfm41-editor-head,.dfm41-editor-actions{grid-column:1/-1;width:100%;max-width:none}
 .dfm41-editor .dfm3-stage{width:min(100%,calc(max(100px,100dvh - 120px)*596/653))}
}
`;document.body.appendChild(style)}
installPrintCss();
function modelSource(m,g,c){const key=m.key+'-'+g.key+'-'+(c?.key??'black');return ['white','gray'].includes(c?.key)?'/assets/models-v41/'+key+'.webp?v=41':['khaki','burgundy'].includes(c?.key)?'/assets/models-v32/'+key+'.webp?v=40':window.DFM_MODELS_V4?.[key]??'';}
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
 const src=modelSource(m,g,c);
 const ink=['black','khaki','burgundy'].includes(c.key)?'#f5e9d0':'#1d1e1b';
 return `<div class="dfm3-stage" role="group" aria-label="Swipe to view different motorcycle designs"><div class="dfm3-portrait"><img class="dfm3-base" src="${src}" alt="${m.label} wearing a ${c.label.toLowerCase()} ${g.label.toLowerCase()}" draggable="false"><div class="dfm3-print${p.fullPrint?' dfm3-full-print':p.key==='nsu'?' dfm3-nsu-print':''}" style="${printStyle(st)};--ink-on-shirt:${ink}"><img src="${p.print}" alt="" draggable="false">${p.fullPrint?'':`<span class="dfm3-print-name">${p.info}</span><span class="dfm3-print-domain">daveferrymotors.com</span>`}</div><div class="dfm3-print-touch" style="${safeStyle(st)}" tabindex="0" role="group" aria-label="Move artwork with arrow keys or drag; pinch or use size slider"></div><div class="dfm3-edit-outline" aria-hidden="true"><span class="dfm3-resize-handle"></span></div></div><button class="dfm3-carousel-btn prev" type="button" aria-label="Previous design"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><button class="dfm3-carousel-btn next" type="button" aria-label="Next design"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></div><div class="dfm3-stage-counter" aria-live="polite">${m.label} · ${c.label} ${g.label}${['khaki','burgundy'].includes(c.key)?' · preview':''}</div>`;
}
function galleryHtml(p,st){
 return '<div class="dfm3-photo-column">'+stageHtml(p,st)+'</div>'+ `<div class="dfm3-options-column"><p class="dfm3-options-title dfm3-current-design">${esc(p.title)}</p><div class="dfm3-design-label">Choose motorcycle design</div><div class="dfm3-design-strip" aria-label="Choose motorcycle design">${products.map((v,i)=>`<button type="button" data-design="${i}" aria-pressed="${v.key===p.key}" aria-label="${v.title}" title="${v.title}"><img src="${v.art}" alt="" draggable="false"><span>${v.title}</span></button>`).join('')}</div><p class="dfm3-options-title">Garment</p><div class="dfm3-garments" aria-label="Choose clothing type">${garments.map((g,i)=>`<button type="button" data-garment="${i}" aria-pressed="${i===st.g}">${g.label}</button>`).join('')}</div><p class="dfm3-options-title">Model</p><div class="dfm3-mini-models" aria-label="Choose model">${models.map((m,i)=>`<button type="button" data-model="${i}" aria-pressed="${i===st.m}">${m.label}</button>`).join('')}</div><p class="dfm3-options-title">Colour</p><div class="dfm3-colors" aria-label="Choose clothing colour">${colors.map((c,i)=>`<button type="button" class="dfm3-color" data-color="${i}" aria-pressed="${i===st.c}"><span class="dfm3-swatch" style="background:${c.hex}"></span>${c.label}</button>`).join('')}</div>${!productPage?'<a class="dfm3-cta dfm3-quick-product" href="'+urlFor(p,st)+'">View Product →</a>':''}</div><div class="dfm3-print-controls"><h3>Artwork Size &amp; Position</h3><label for="dfm4-scale">Artwork size</label><input id="dfm4-scale" aria-label="Artwork size" type="range" min="50" max="${Math.round(maxScale(st)*100)}" step="1" value="${Math.round(st.ps*100)}"><div class="dfm3-scale-row"><button type="button" data-scale="-1" aria-label="Decrease artwork size">−</button><output for="dfm4-scale">${Math.round(st.ps*100)}%</output><button type="button" data-scale="1" aria-label="Increase artwork size">+</button></div><div class="dfm3-direction-pad" role="group" aria-label="Move artwork"><button type="button" data-move="up" aria-label="Move print up">↑</button><button type="button" data-move="left" aria-label="Move print left">←</button><button type="button" data-move="right" aria-label="Move print right">→</button><button type="button" data-move="down" aria-label="Move print down">↓</button></div><button type="button" data-print-reset>Reset Design</button><button type="button" class="dfm3-editor-open" data-editor-open>Edit Design ⤢</button><p class="dfm3-print-hint">Pinch to resize · Drag to move</p><p class="dfm3-print-hint">Visual chest limits depend on the selected model. Final print dimensions are confirmed by SP Print.</p>${productPage?'<button type="button" data-share-config>Copy configuration link</button><p class="dfm3-print-hint" data-share-status role="status"></p>':''}</div>`;
}
function clamp01(v){return Math.max(0,Math.min(1,v));}
// Create a new raster preview from the registered garment photos; no CSS tint.
const rasterCache=new Map();
const smooth=(a,b,x)=>{const t=clamp01((x-a)/(b-a));return t*t*(3-2*t)};
const lum=(d,i)=>.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];
function loadRaster(src){return new Promise((ok,fail)=>{const im=new Image();im.onload=()=>{try{const cv=document.createElement('canvas');cv.width=frame.w;cv.height=frame.h;const cx=cv.getContext('2d',{willReadFrequently:true});cx.drawImage(im,0,0,frame.w,frame.h);ok({cv,cx,pixels:cx.getImageData(0,0,frame.w,frame.h)})}catch(e){fail(e)}};im.onerror=fail;im.src=src})}
function repairBeard(target,reference){const d=target.data,r=reference.data;for(let y=125;y<209;y++)for(let x=232;x<366;x++){const q=Math.sqrt(((x-299)/61)**2+((y-169)/38)**2),a=1-smooth(.68,1,q);if(a<=0)continue;const i=(y*frame.w+x)*4;for(let k=0;k<3;k++)d[i+k]=Math.round(d[i+k]*(1-a)+r[i+k]*a)}}
// New colours use individually pre-rendered and reviewed garment photographs.
const preparedColours=new Set(['khaki','burgundy','white','gray']);
function recolorPortrait(m,g,c){
 if(preparedColours.has(c.key))return Promise.resolve(modelSource(m,g,c));
 const src=modelSource(m,g,c),repair=m.key==='george'&&g.key==='hoodie'&&c.key!=='gray';
 if(!src)return Promise.reject(new Error('Missing model preview'));
 if(!repair)return Promise.resolve(src);
 const key=m.key+'-'+g.key+'-'+c.key;
 if(!rasterCache.has(key)){const gray=window.DFM_MODELS_V4?.[m.key+'-'+g.key+'-gray'];
 const task=(async()=>{const [b,r]=await Promise.all([loadRaster(src),loadRaster(gray)]);repairBeard(b.pixels,r.pixels);b.cx.putImageData(b.pixels,0,0);return b.cv.toDataURL('image/png')})();rasterCache.set(key,task);task.catch(()=>rasterCache.delete(key))}
 return rasterCache.get(key);
}
function artwork(p){return '<button type="button" class="dfm3-zoom-trigger" data-zoom aria-label="Enlarge artwork"><img class="dfm3-art" src="'+esc(p.art)+'" alt="'+esc(p.title)+' artwork"><span>Enlarge artwork ⤢</span></button>'}
const sizeCharts={"women":{"title":"SOL’S 11502 – Imperial Women’s T-shirt","image":"https://spprint.be/image/catalog/meret1.png","rows":[["S",61,41],["M",63,44],["L",65,47],["XL",67,50],["2XL",69,53]]},"men":{"title":"SOL’S 11500 – Imperial Men’s T-shirt","image":"https://spprint.be/image/catalog/meret2.png","rows":[["XS",62,49],["S",70,50],["M",72,53],["L",74,56],["XL",76,59],["2XL",78,62],["3XL",80,64],["4XL",84,68]]},"hoodie":{"title":"SOL’S 13251 – SLAM Unisex Hooded Sweatshirt","image":"https://spprint.be/image/catalog/meret4.png","rows":[["XS",65,48],["S",67,51],["M",69,54],["L",71,57],["XL",73,60],["2XL",75,53]]}};
function chartTable(chart){return '<div class="dfm3-size-table-wrap"><table class="dfm3-size-table"><caption>'+esc(chart.title)+'</caption><thead><tr><th scope="col">Size</th><th scope="col">Length (cm)</th><th scope="col">Width (cm)</th></tr></thead><tbody>'+chart.rows.map(row=>'<tr><th scope="row">'+esc(row[0])+'</th><td>'+row[1]+'</td><td>'+row[2]+(chart===sizeCharts.hoodie&&row[0]==='2XL'?' *':'')+'</td></tr>').join('')+'</tbody></table><a class="dfm3-foot" href="'+chart.image+'" target="_blank" rel="noopener">Original SP Print measurement diagram ↗</a></div>'}
function sizeGuideHtml(st){const hood=garments[st.g].key==='hoodie';return '<details class="dfm3-size-guide" open><summary>Size chart – '+(hood?'Hoodie':'T-shirt')+' (cm)</summary><p class="dfm3-foot">Measurements refer to the garment laid flat, not body circumference. Compare with a garment you own.</p>'+(hood?chartTable(sizeCharts.hoodie)+'<p class="dfm3-foot">* SP Print lists 53 cm for 2XL, less than XL. Please confirm this measurement with the printer before ordering.</p>':chartTable(sizeCharts.men)+chartTable(sizeCharts.women))+'<p class="dfm3-foot">Published garment tolerance: ±2.5/3 cm; shrinkage tolerance: 5%. Reference charts only: the exact garment model, fit, sizes and stock must be confirmed. <a href="'+config.sizeGuide+'" target="_blank" rel="noopener">SP Print official size guide ↗</a></p></details>'}
function detailHtml(p,st){
 const heading='<p class="dfm3-label">Original motorcycle apparel</p><h3>'+esc(p.title)+'</h3><p class="dfm3-muted">'+esc(p.story)+'</p>';
 if(!productPage)return artwork(p)+heading+'<a class="dfm3-cta dfm3-product-link" href="'+urlFor(p,st)+'">View product · sizes &amp; ordering</a>';
 const price=p.prices[garments[st.g].key],ready=st.ps===1&&Math.abs(st.px-298)<.01&&Math.abs(st.py-304)<.01&&checkoutUrl(p,st);
 return artwork(p)+heading+'<p class="dfm3-price">'+(price==null?'Price confirmed on request':esc(price))+'</p><label class="dfm3-size-label" for="dfm3-size-home">Clothing size</label><select id="dfm3-size-home" class="dfm3-size"><option value="">Select size</option>'+p.sizes.map(v=>'<option value="'+esc(v)+'" '+(v===st.size?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select><label class="dfm3-size-label" for="dfm3-qty">Quantity</label><input id="dfm3-qty" type="number" min="1" max="99" step="1" value="'+st.qty+'">'+sizeGuideHtml(st)+(['khaki','burgundy'].includes(colors[st.c].key)?'<p class="dfm3-foot">This colour is a visual preview; exact shade and availability are subject to printer confirmation.</p>':'')+'<button class="dfm3-cta" type="button" data-action="enquiry">'+(ready?'Continue to order':'Request order quote')+'</button><button class="dfm3-cta dfm3-secondary" type="button" data-action="copy">Copy order details</button><p class="dfm3-foot dfm3-order-status" role="status"></p><p class="dfm3-foot">An enquiry is not a confirmed order. No payment is taken here. The email opens in your email app and is sent only by you. The partner must confirm price, size, availability, shipping and terms.</p><details class="dfm3-order-info"><summary>Production, delivery &amp; policies</summary><p class="dfm3-foot">Printing partner: <a href="'+config.partnerHome+'">SP Print</a>. <a href="'+config.shipping+'" target="_blank" rel="noopener">Shipping and returns</a> · <a href="'+config.terms+'" target="_blank" rel="noopener">Partner terms</a>. A dedicated Dave Ferry Motors checkout is not yet available.</p></details><p class="dfm3-foot">Garment preview is a digital illustration, not a production photograph.</p>'+(p.videoUrl?'<p><a href="'+esc(p.videoUrl)+'" target="_blank" rel="noopener">Watch the original motorcycle film</a></p>':'');
}
function zoomArt(p){let d=document.getElementById('dfm3-art-zoom');if(!d){d=document.createElement('dialog');d.id='dfm3-art-zoom';d.innerHTML='<div class="dfm3-zoom-bar"><strong>Motorcycle artwork</strong><button type="button" data-grow>Zoom +</button><button type="button" data-reset>Reset</button><button type="button" data-close aria-label="Close artwork">×</button></div><div class="dfm3-zoom-scroll"><img alt=""></div>';document.body.appendChild(d);const i=d.querySelector('img');let scale=1;d.querySelector('[data-grow]').onclick=()=>{scale=Math.min(3,scale+.5);i.style.width=scale*100+'%'};d.querySelector('[data-reset]').onclick=()=>{scale=1;i.style.width='100%'};d.querySelector('[data-close]').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d)d.close()});}
 const i=d.querySelector('img');d.querySelector('[data-reset]').click();i.src=p.art;i.alt=p.title;hydrateImages(d);d.showModal();metric('artwork_zoom',p);
}
function mount(gallery,detail,p){
 const pick=(arr,key)=>Math.max(0,arr.findIndex(x=>x.key===params.get(key)));const st={m:productPage?pick(models,'model'):0,c:productPage?pick(colors,'color'):0,g:productPage?pick(garments,'garment'):0,size:p.sizes.includes(params.get('size'))?params.get('size'):'',qty:bounded(Math.round(paramNumber('qty',1))||1,1,99),d:products.indexOf(p),ps:paramNumber('ps',1),px:posParam('nx','px',frame.w,298),py:posParam('ny','py',frame.h,304)};fitPrint(st);stateMap.set(gallery,{p,st,detail});
 const modal=detail.closest('dialog')!==null;
 function renderDetail(){
  fitPrint(st);
  document.getElementById('latest-design-title').textContent=p.title;
  if(productPage)document.title=p.title+' | Dave Ferry Motors apparel';
  detail.innerHTML=detailHtml(p,st);hydrateImages(detail);
  detail.querySelector('[data-zoom]').onclick=()=>zoomArt(p);
  const link=detail.querySelector('.dfm3-product-link');if(link){link.onclick=()=>metric('product_open',p);return}
  const size=detail.querySelector('select'),qty=detail.querySelector('#dfm3-qty'),msg=detail.querySelector('.dfm3-order-status');size.onchange=()=>st.size=size.value;qty.oninput=()=>st.qty=Number(qty.value);
  const reference=st.reference||(st.reference='DFM-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)).toUpperCase());
  function orderText(){if(!p.sizes.includes(st.size)){msg.textContent='Please choose a size.';size.focus();return null}if(!Number.isInteger(st.qty)||st.qty<1||st.qty>99){msg.textContent='Please enter a quantity from 1 to 99.';qty.focus();return null}
  return ['Dave Ferry Motors – order quote request','Reference: '+reference,'Product ID: '+p.id,'Design: '+p.title,'Garment: '+garments[st.g].label,'Colour: '+colors[st.c].label,'Size: '+st.size,'Quantity: '+st.qty,'Print scale: '+Math.round(st.ps*100)+'% of default','Preview model: '+models[st.m].label,'Print centre (normalized): '+(st.px/frame.w).toFixed(7)+', '+(st.py/frame.h).toFixed(7)+' (x, y)','Print box (reference 596 × 653): '+fitPrint(st).map(v=>v.toFixed(2)).join(', ')+' (left, top, width, height)','Print position and size are preview values; confirm production dimensions with printer.','Product: '+location.origin+urlFor(p,st),'Please confirm availability, total price and shipping before payment.'].join('\n')}
  detail.querySelector('[data-action="enquiry"]').onclick=()=>{const t=orderText();if(!t)return;const destination=(Math.abs(st.ps-1)<.001&&Math.abs(st.px-298)<.01&&Math.abs(st.py-304)<.01)?checkoutUrl(p,st):null;if(destination){metric('partner_checkout',p);location.href=destination;return}metric('order_enquiry',p);msg.textContent='Opening your email app. Review and send the request to SP Print. No order has been placed.';location.href='mailto:'+config.enquiryEmail+'?subject='+encodeURIComponent('Dave Ferry Motors quote – '+p.id)+'&body='+encodeURIComponent(t)};
  detail.querySelector('[data-action="copy"]').onclick=async()=>{const t=orderText();if(!t)return;try{await navigator.clipboard.writeText(t);msg.textContent='Order details copied.'}catch{msg.textContent=t;msg.style.whiteSpace='pre-wrap'}};
 }
 function applyPrint(){
  fitPrint(st);const print=gallery.querySelector('.dfm3-print');if(print){for(const pair of printStyle(st).split(';')){const [k,v]=pair.split(':');print.style.setProperty(k,v)}}
  const slider=gallery.querySelector('.dfm3-print-controls input'),out=gallery.querySelector('.dfm3-print-controls output');if(slider){slider.max=Math.round(maxScale(st)*100);slider.value=Math.round(st.ps*100)}if(out)out.textContent=Math.round(st.ps*100)+'%';
  const [x,y,w,h]=fitPrint(st);const outline=gallery.querySelector('.dfm3-edit-outline');if(outline){Object.assign(outline.style,{left:100*x/frame.w+'%',top:100*y/frame.h+'%',width:100*w/frame.w+'%',height:100*h/frame.h+'%'})}
  for(const link of [detail.querySelector('.dfm3-product-link'),gallery.querySelector('.dfm3-quick-product')])if(link)link.href=urlFor(p,st);
  const button=detail.querySelector('[data-action="enquiry"]');if(button)button.textContent=checkoutUrl(p,st)&&st.ps===1&&st.px===298&&st.py===304?'Continue to order':'Request order quote';
 }
 function movePrint(direction){const steps={left:[-4,0],right:[4,0],up:[0,-4],down:[0,4]};if(!steps[direction])return;st.px+=steps[direction][0];st.py+=steps[direction][1];applyPrint()}
 function openEditor(){
  if(gallery.querySelector('.dfm41-editor'))return;
  const photo=gallery.querySelector('.dfm3-photo-column'),controls=gallery.querySelector('.dfm3-print-controls');
  const snapshot={ps:st.ps,px:st.px,py:st.py},focus=document.activeElement,bodyOverflow=document.body.style.overflow;
  const photoSlot=document.createComment('photo'),controlSlot=document.createComment('controls');
  photo.before(photoSlot);controls.before(controlSlot);
  const d=document.createElement('dialog');d.className='dfm41-editor';d.setAttribute('aria-label','Edit motorcycle artwork');
  d.innerHTML='<header class="dfm41-editor-head"><h2>Edit Design</h2><button type="button" data-editor-cancel>Cancel</button></header><div class="dfm41-editor-actions"><button type="button" data-editor-apply>Apply Design</button></div>';
  const footer=d.querySelector('.dfm41-editor-actions');footer.before(photo,controls);gallery.appendChild(d);const fitPhoto=()=>{const available=photo.clientHeight-photo.querySelector('.dfm3-stage-counter').offsetHeight-6;const stage=photo.querySelector('.dfm3-stage');if(available>0)stage.style.width=Math.min(photo.clientWidth,available*frame.w/frame.h,520)+'px'};const observer=new ResizeObserver(fitPhoto);observer.observe(photo);
  let applied=false;
  d.addEventListener('close',()=>{observer.disconnect();photo.querySelector('.dfm3-stage').style.removeProperty('width');if(!applied)Object.assign(st,snapshot);photoSlot.replaceWith(photo);controlSlot.replaceWith(controls);d.remove();document.body.style.overflow=bodyOverflow;applyPrint();if(focus?.isConnected)focus.focus({preventScroll:true})},{once:true});
  d.querySelector('[data-editor-cancel]').onclick=()=>d.close();
  d.querySelector('[data-editor-apply]').onclick=()=>{applied=true;d.close()};
  document.body.style.overflow='hidden';d.showModal();fitPhoto();applyPrint();
 }
 function bindPrint(){
  const area=gallery.querySelector('.dfm3-print-touch'),portrait=gallery.querySelector('.dfm3-portrait'),slider=gallery.querySelector('.dfm3-print-controls input');
  if(!area||!portrait||!slider)return;
  slider.oninput=()=>{st.ps=Number(slider.value)/100;applyPrint()};
  const editor=gallery.querySelector('[data-editor-open]');if(editor)editor.onclick=openEditor;
  gallery.querySelectorAll('[data-scale]').forEach(b=>b.onclick=()=>{st.ps+=Number(b.dataset.scale)*.05;applyPrint()});
  const share=gallery.querySelector('[data-share-config]');if(share)share.onclick=async()=>{const url=location.origin+urlFor(p,st),note=gallery.querySelector('[data-share-status]');try{await navigator.clipboard.writeText(url);note.textContent='Configuration link copied.'}catch{note.textContent=url;note.style.overflowWrap='anywhere'}};
  gallery.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>movePrint(b.dataset.move));
  gallery.querySelector('[data-print-reset]').onclick=()=>{Object.assign(st,{ps:1,px:298,py:304});applyPrint()};
  area.onkeydown=e=>{const key={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[e.key];if(key){e.preventDefault();movePrint(key)}else if(e.key==='+'||e.key==='-'){e.preventDefault();st.ps+=e.key==='+'?.05:-.05;applyPrint()}};
  const pointers=new Map();let baseline=null;const handle=portrait.querySelector('.dfm3-resize-handle');
  function local(e){const rect=portrait.getBoundingClientRect();return {x:(e.clientX-rect.left)*frame.w/rect.width,y:(e.clientY-rect.top)*frame.h/rect.height}}
  function gesture(){const a=[...pointers.values()];if(!a.length)return null;const b=a[1]||a[0];return {x:(a[0].x+b.x)/2,y:(a[0].y+b.y)/2,d:a.length>1?Math.max(1,Math.hypot(a[0].x-b.x,a[0].y-b.y)):0}}
  function resetGesture(){const q=gesture();baseline=q&&{...q,px:st.px,py:st.py,ps:st.ps}}
  area.onpointerdown=e=>{if(e.pointerType==='mouse'&&e.button!==0||pointers.size>=2)return;e.preventDefault();portrait.classList.add('dfm3-editing');area.setPointerCapture(e.pointerId);pointers.set(e.pointerId,local(e));resetGesture()};
  area.onpointermove=e=>{if(!pointers.has(e.pointerId)||!baseline)return;e.preventDefault();pointers.set(e.pointerId,local(e));const q=gesture();st.ps=baseline.d?baseline.ps*q.d/baseline.d:baseline.ps;st.px=baseline.px+q.x-baseline.x;st.py=baseline.py+q.y-baseline.y;applyPrint()};
  function finish(e){if(pointers.delete(e.pointerId))resetGesture();if(!pointers.size)portrait.classList.remove('dfm3-editing')}
  area.onpointerup=finish;area.onpointercancel=finish;area.onlostpointercapture=finish;
  if(handle){let h=null;handle.onpointerdown=e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();e.stopPropagation();const q=local(e);h={id:e.pointerId,x:q.x,y:q.y,ps:st.ps};handle.setPointerCapture(e.pointerId);portrait.classList.add('dfm3-editing')};handle.onpointermove=e=>{if(!h||h.id!==e.pointerId)return;const q=local(e);st.ps=h.ps+((q.x-h.x)*printBase.w+(q.y-h.y)*printBase.h)*2/(printBase.w**2+printBase.h**2);applyPrint()};handle.onpointerup=handle.onpointercancel=handle.onlostpointercapture=()=>{h=null;portrait.classList.remove('dfm3-editing')}}
  applyPrint();
 }
 let redrawVersion=0,lastGood=null;
 function redraw(){
  fitPrint(st);const version=++redrawVersion,selected={...st},selectedProduct=p;
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
   hydrateImages(gallery);bindPrint();
  }).catch(()=>{
   if(version!==redrawVersion||!gallery.isConnected)return;
   gallery.removeAttribute('aria-busy');
   // Never fall back to a different coloured photograph with mismatched pose or outline.
   if(lastGood){const {p:previous,...previousState}=lastGood;Object.assign(st,{m:previousState.m,c:previousState.c,g:previousState.g,d:previousState.d,ps:previousState.ps,px:previousState.px,py:previousState.py});p=previous;stateMap.get(gallery).p=p;renderDetail();applyPrint();}
   else {gallery.replaceChildren(...pending.childNodes);gallery.querySelector('.dfm3-base').hidden=true;gallery.querySelector('.dfm3-print').hidden=true;hydrateImages(gallery);}
   const note=gallery.querySelector('.dfm3-stage-counter');if(note)note.textContent='Selected preview unavailable — please retry.';
  });
 }
 function changeDesign(i){if(productPage)return;st.d=(i+products.length)%products.length;p=products[st.d];stateMap.get(gallery).p=p;renderDetail();redraw()}
 gallery.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(gallery.querySelector('.dfm41-editor'))return;if(b.dataset.design!==undefined){changeDesign(+b.dataset.design);return}if(b.matches('.next')){changeDesign(st.d+1);return}if(b.matches('.prev')){changeDesign(st.d-1);return}if(b.dataset.model!==undefined)st.m=+b.dataset.model;else if(b.dataset.color!==undefined)st.c=+b.dataset.color;else if(b.dataset.garment!==undefined)st.g=+b.dataset.garment;else return;renderDetail();redraw()});
 let touch=null;gallery.addEventListener('touchstart',e=>{touch=null;if(!gallery.querySelector('.dfm41-editor')&&e.target.closest('.dfm3-stage')&&!e.target.closest('.dfm3-print-touch,.dfm3-resize-handle,button')&&e.touches.length===1)touch=[e.changedTouches[0].screenX,e.changedTouches[0].screenY]},{passive:true});
 gallery.addEventListener('touchend',e=>{if(!touch)return;if(e.target.closest('.dfm3-print-touch,.dfm3-resize-handle')){touch=null;return}const dx=e.changedTouches[0].screenX-touch[0],dy=e.changedTouches[0].screenY-touch[1];touch=null;if(!productPage&&Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.3)changeDesign(st.d+(dx<0?1:-1))},{passive:true});gallery.addEventListener('touchcancel',()=>{touch=null},{passive:true});
 renderDetail();redraw();
}
function card(p){const price=Object.values(p.prices).filter(v=>v!=null)[0];return '<article class="dfm3-card"><a class="dfm3-card-art" href="'+urlFor(p)+'"><img src="'+esc(p.art)+'" alt="'+esc(p.title)+'" loading="lazy"></a><h3>'+esc(p.title)+'</h3>'+(price?'<p>From '+esc(price)+'</p>':'')+'<a class="dfm3-cta" href="'+urlFor(p)+'">View Product</a></article>'}
const gallery=document.getElementById('dfm3-feature-gallery'),detail=document.getElementById('dfm3-feature-detail');
const f=productPage?products.find(p=>p.slug===productPage):products[0];
if(!f||!gallery||!detail)throw Error('Product catalogue unavailable');
document.getElementById('latest-design-title').textContent=f.title;mount(gallery,detail,f);
if(productPage){metric('product_view',f)}else{const list=document.getElementById('dfm3-archive'),more=document.getElementById('dfm3-show-all');let expanded=false;function renderCollection(){list.innerHTML=products.slice(0,expanded?products.length:6).map(card).join('');hydrateImages(list);more.hidden=products.length<=6;more.textContent=expanded?'Show fewer designs':'Show All Designs ('+products.length+')';more.setAttribute('aria-expanded',String(expanded))}more.onclick=()=>{expanded=!expanded;renderCollection()};renderCollection()}
})();
