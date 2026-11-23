/* Dave Ferry Motors motorcycle shirt gallery — reused for every design; no checkout claims */
(()=>{'use strict';
const root=document.getElementById('latest-design');
const dialog=document.getElementById('df-bike-modal');
if(!root||!dialog)return;
const B='assets/approved/';
const products=[
 {id:'henderson',name:'Henderson De Luxe “Phenix” – 1928',about:'Our approved vintage Henderson print, based on the scarlet-and-gold four-cylinder motorcycle filmed at the show.',art:B+'henderson-approved.webp',print:B+'henderson-approved-transparent.webp'},
 {id:'bmw-r18',name:'BMW R18 First Edition with sidecar – 2021',about:'Modern 1,800 cc boxer with a distinctive black sidecar, as seen in our video.',art:B+'bmw-r18-sidecar-approved.webp',print:B+'bmw-r18-sidecar-approved-transparent.webp'},
 {id:'guzzi-california',name:'Moto Guzzi California 1100i Custom',about:'Burgundy and gold custom café racer; original base-model year has not been verified.',art:B+'moto-guzzi-california-approved.webp',print:B+'moto-guzzi-california-approved-transparent.webp'},
 {id:'harley-green',name:'Harley-Davidson FXSTC Softail Custom – 2010 · Green',about:'Bold neon-green custom with an extraordinary oversized rear tyre.',art:B+'harley-green-2010-approved.webp',print:B+'harley-green-2010-approved-transparent.webp'},
 {id:'harley-chrome',name:'Harley-Davidson FXSTC Softail Custom – 2010 · Chrome',about:'Highly polished custom Harley-Davidson with chrome engine and tall handlebars.',art:B+'harley-chrome-2010-approved.webp',print:B+'harley-chrome-2010-approved-transparent.webp'},
 {id:'nsu',name:'NSU 500 1T – 1930',about:'German heritage: a restrained and detailed vintage motorcycle graphic.',art:B+'nsu-1930-approved.webp',print:B+'nsu-1930-approved-transparent.webp'},
 {id:'guzzi-arancia',name:'Moto Guzzi Arancia Meccanica – 2018',about:'The original custom Moto Guzzi design from our video.',art:'assets/guzzi-art-final.webp',print:null}
];
const models=[
 {id:'senior-man',name:'Bearded, fuller man',short:'Older man',left:'31%',top:'39%',width:'38%'},
 {id:'curvy-woman',name:'Fuller woman',short:'Fuller woman',left:'47%',top:'43%',width:'36%'},
 {id:'blonde-woman',name:'Slim blonde woman',short:'Blonde woman',left:'42%',top:'43%',width:'33%'},
 {id:'athletic-man',name:'Athletic, bearded man',short:'Athletic man',left:'30%',top:'39%',width:'41%'}
];
const colors=[{id:'black',name:'Black',hex:'#171717'},{id:'white',name:'White',hex:'#fff'},{id:'gray',name:'Heather grey',hex:'#9fa1a1'}];
let current=products[0],modelIndex=0,color='black',size='';
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const cards=document.getElementById('dfm-catalog');
products.slice(1).forEach(p=>{
 const el=document.createElement('article');el.className='dfm-catalog-card';
 el.innerHTML=`<button type="button" data-dfm-pick="${p.id}" aria-label="See ${escapeHtml(p.name)} shirt"><img src="${p.art}" loading="lazy" alt="${escapeHtml(p.name)} approved print" /></button><div class="dfm-card-body"><h4>${escapeHtml(p.name)}</h4><button type="button" data-dfm-pick="${p.id}">View T-shirt</button></div>`;
 cards.append(el);
});
function setProduct(id,open){const p=products.find(x=>x.id===id);if(!p)return;current=p;modelIndex=0;color='black';size='';render();if(open&&typeof dialog.showModal==='function'){if(!dialog.open)dialog.showModal();}}
function setModel(index){modelIndex=(index+models.length)%models.length;render();}
function setColor(next){if(!colors.some(x=>x.id===next))return;color=next;render();}
function renderStage(stage){
 const model=models[modelIndex],person=stage.querySelector('[data-dfm-person]'),print=stage.querySelector('[data-dfm-print]');
 person.src=`assets/approved/${model.id}-${color}-studio.webp`;
 person.alt=`${model.name} in a ${color} T-shirt; digital preview`;
 if(current.print){print.src=current.print;print.hidden=false;print.style.left=model.left;print.style.top=model.top;print.style.width=model.width;print.alt=`${current.name} print simulated on the shirt`;}
 else{print.hidden=true;print.removeAttribute('src');}
 const label=stage.closest('.dfm-showroom')?.querySelector('[data-dfm-count]');if(label)label.textContent=`${modelIndex+1} / ${models.length}`;
}
function render(){
 document.querySelectorAll('[data-dfm-stage]').forEach(renderStage);
 document.querySelectorAll('[data-dfm-title]').forEach(n=>n.textContent=current.name);
 document.querySelectorAll('[data-dfm-about]').forEach(n=>n.textContent=current.about);
 document.querySelectorAll('[data-dfm-art]').forEach(n=>{n.src=current.art;n.alt=`${current.name} approved artwork`;});
 document.getElementById('dfm-modal-title').textContent=current.name;
 document.querySelectorAll('[data-dfm-size]').forEach(n=>n.value=size);
 document.querySelectorAll('[data-dfm-model-options]').forEach(el=>{
  el.replaceChildren();models.forEach((m,j)=>{const btn=document.createElement('button');btn.type='button';btn.textContent=m.short;btn.setAttribute('aria-pressed',String(j===modelIndex));btn.setAttribute('aria-label',m.name);btn.addEventListener('click',()=>setModel(j));el.append(btn);});
 });
 document.querySelectorAll('[data-dfm-colors]').forEach(el=>{
  el.replaceChildren();colors.forEach(c=>{const btn=document.createElement('button');btn.type='button';btn.setAttribute('aria-pressed',String(c.id===color));btn.setAttribute('aria-label',`${c.name} T-shirt`);const dot=document.createElement('span');dot.className='dfm-swatch';dot.style.background=c.hex;btn.append(dot,document.createTextNode(c.name));btn.addEventListener('click',()=>setColor(c.id));el.append(btn);});
 });
 if(!current.print){document.querySelectorAll('.dfm-preview-note').forEach(n=>n.textContent='Fit reference only · exact digital print placement is being prepared');}else{document.querySelectorAll('.dfm-preview-note').forEach(n=>n.textContent='Digital fit preview · actual motorcycle print simulated on shirt');}
}
document.querySelectorAll('[data-dfm-prev]').forEach(btn=>btn.addEventListener('click',()=>setModel(modelIndex-1)));
document.querySelectorAll('[data-dfm-next]').forEach(btn=>btn.addEventListener('click',()=>setModel(modelIndex+1)));
document.querySelectorAll('[data-dfm-size]').forEach(sel=>sel.addEventListener('change',()=>{size=sel.value;document.querySelectorAll('[data-dfm-size]').forEach(x=>{if(x!==sel)x.value=size;});}));
document.querySelectorAll('[data-dfm-details]').forEach(b=>b.addEventListener('click',()=>{if(!dialog.open)dialog.showModal();}));
document.querySelectorAll('[data-dfm-close]').forEach(b=>b.addEventListener('click',()=>dialog.close()));
cards.addEventListener('click',e=>{const b=e.target.closest('[data-dfm-pick]');if(b)setProduct(b.dataset.dfmPick,true);});
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
dialog.addEventListener('close',()=>{setProduct(products[0].id,false);});
function registerSwipe(stage){let x=null;stage.addEventListener('touchstart',e=>{x=e.changedTouches[0].clientX;},{passive:true});stage.addEventListener('touchend',e=>{if(x===null)return;const diff=e.changedTouches[0].clientX-x;x=null;if(Math.abs(diff)>38)setModel(modelIndex+(diff<0?1:-1));},{passive:true});}
document.querySelectorAll('[data-dfm-stage]').forEach(registerSwipe);
document.addEventListener('keydown',e=>{if(!dialog.open)return;if(e.key==='ArrowLeft')setModel(modelIndex-1);if(e.key==='ArrowRight')setModel(modelIndex+1);});
render();
})();