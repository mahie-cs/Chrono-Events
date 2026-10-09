fetch('events.json')
  .then(r=>r.json())
  .then(EVENTS=>{
const TZ='Asia/Dhaka',T2P={exam:'exams',assignment:'assignments',event:'events'},PAGES=['exams','assignments','events'],LIM=110;
const RM=matchMedia('(prefers-reduced-motion: reduce)');
const $=s=>document.querySelector(s);

/* ---- spring: damping ratio + response (s). Starts from the live value and inherits velocity. ---- */
function spring(from,to,vel,{damping=1,response=.4},tick,done){
  const w=2*Math.PI/response,k=w*w,c=2*damping*w;
  let x=from,v=vel,last=performance.now(),id;
  if(RM.matches){tick(to);done&&done();return{stop(){},get x(){return to}}}
  const h={stop(){cancelAnimationFrame(id)},get x(){return x},get v(){return v}};
  (function f(t){
    let dt=Math.min((t-last)/1000,.032);last=t;
    for(let n=Math.ceil(dt/.004);n>0;n--){const d=dt/Math.ceil(dt/.004);v+=(-k*(x-to)-c*v)*d;x+=v*d}
    tick(x);
    if(Math.abs(x-to)<.1&&Math.abs(v)<1){tick(to);x=to;done&&done()}else id=requestAnimationFrame(f);
  })(last);
  return h;
}
const project=(v,d=.998)=>(v/1000)*d/(1-d);
const rubber=(o,dim,c=.55)=>(o*dim*c)/(dim+c*Math.abs(o));

/* ---- dates (Bangladesh time) ---- */
const today=new Intl.DateTimeFormat('en-CA',{timeZone:TZ}).format(new Date());
const status=e=>today<e.date?'upcoming':today>(e.endDate||e.date)?'past':'ongoing';
const fmt=(a,b)=>{const o={day:'numeric',month:'short',year:'numeric'},f=i=>new Date(i+'T00:00:00').toLocaleDateString('en-GB',o);return b&&b!==a?f(a)+' – '+f(b):f(a)};
const cmp=(a,b)=>a<b?-1:a>b?1:0;
const B={};PAGES.forEach(p=>B[p]={upcoming:[],ongoing:[],past:[]});
EVENTS.forEach(e=>B[T2P[e.type]||'events'][status(e)].push(e));
PAGES.forEach(p=>{const g=B[p];g.upcoming.sort((a,b)=>cmp(a.date,b.date));g.ongoing.sort((a,b)=>cmp(b.date,a.date));g.past.sort((a,b)=>cmp(b.endDate||b.date,a.endDate||a.date))});

/* ---- render ---- */
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const LABEL={exams:'Exams',assignments:'Assignments',events:'Events'};
const pagesEl=$('#pages');let flipped=null;
PAGES.forEach(p=>{
  const pg=el('section','page');pg.id='page-'+p;pg.hidden=true;
  ['upcoming','ongoing','past'].forEach(s=>{
    const sec=el('section','st');sec.dataset.s=s;
    const h=el('h2');h.append(el('i'),(s[0].toUpperCase()+s.slice(1)+' '+LABEL[p]));h.append(el('small',0,B[p][s].length||''));
    const grid=el('div','grid');
    if(!B[p][s].length)grid.append(el('p','empty','No '+s+' '+LABEL[p].toLowerCase()+'.'));
    B[p][s].forEach(e=>grid.append(card(e)));
    sec.append(h,grid);pg.append(sec);
  });
  pagesEl.append(pg);
});
function card(e){
  const c=el('div','card');c.tabIndex=0;c.setAttribute('role','button');c.dataset.a=0;
  const date=fmt(e.date,e.endDate),long=e.details.length>LIM,inn=el('div','in');
  const f=el('div','f'),b=el('div','b');
  f.append(el('h3',0,e.name),el('span','pill',date));
  const p=el('p',0,long?e.details.slice(0,LIM)+'…':e.details);
  b.append(el('h4',0,e.name),p);
  if(long){const m=el('button','more','Show more');m.type='button';m.onclick=ev=>{ev.stopPropagation();openSheet(e.name,date,e.details,m)};b.append(m)}
  inn.append(f,b);c.append(inn);
  return c;
}

/* ---- card flip: spring on rotation, interruptible (animates from live angle) ---- */
function flip(c,to){
  const inn=c.firstChild;c._h&&c._h.stop();
  const set=a=>{c.dataset.a=a;if(RM.matches){inn.style.transform='';inn.children[0].style.opacity=a>90?0:1;inn.children[1].style.opacity=a>90?1:0;inn.children[1].style.transform='none';inn.children[0].style.transform='none'}else inn.style.transform='rotateY('+a+'deg)'};
  c._h=spring(+c.dataset.a,to,c._h?c._h.v||0:0,{damping:1,response:.5},set);
  c.setAttribute('aria-pressed',to===180);
}
function toggle(c){
  const to=+c.dataset.a>=90&&c._to!==0?0:180;
  if(flipped&&flipped!==c){flipped._to=0;flip(flipped,0)}
  c._to=to;flip(c,to);flipped=to===180?c:null;
}
pagesEl.addEventListener('click',e=>{const c=e.target.closest('.card');if(c)toggle(c)});
pagesEl.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('card')){e.preventDefault();toggle(e.target)}});

/* ---- navigation + swipe: one position value drives the pages AND the tab indicator ---- */
const tabs=[...document.querySelectorAll('.tabs a')],ind=$('.ind'),tabsEl=$('.tabs');
const pgs=PAGES.map(p=>$('#page-'+p)),LAST=PAGES.length-1;
let cur=0,P=0,W=1,ph,moving=false,justDragged=false,dr=null;
function layout(p){                       // p = position in page units (0..2), fractional while moving
  P=p;W=pagesEl.clientWidth||1;
  const iw=(tabsEl.clientWidth-10)/PAGES.length;ind.style.width=iw+'px';ind.style.transform='translateX('+p*iw+'px)';
  pgs.forEach((pg,i)=>{
    const d=i-p;
    if(i===cur){pg.hidden=false;pg.style.position='';pg.style.transform=d?'translateX('+d*W+'px)':''}
    else if(Math.abs(d)<1){pg.hidden=false;pg.style.cssText='position:absolute;top:0;left:1.25rem;width:calc(100% - 2.5rem);transform:translateX('+d*W+'px)'}
    else{pg.hidden=true;pg.style.cssText=''}
  });
}
function markTab(n){tabs.forEach((t,j)=>{t.classList.toggle('on',j===n);t.setAttribute('aria-current',j===n?'page':'false')})}
function settle(n){cur=n;moving=false;layout(n)}
function goTo(n,v=0,damping=1){
  n=Math.max(0,Math.min(LAST,n));ph&&ph.stop();markTab(n);
  if(scrollY>0)scrollTo(0,0);
  try{if(location.hash.slice(1)!==PAGES[n])history.replaceState(null,'','#'+PAGES[n])}catch(e){}
  moving=true;
  ph=spring(P*W,n*W,v,{damping,response:.4},x=>layout(x/W),()=>settle(n));
}
addEventListener('hashchange',()=>{const i=PAGES.indexOf(location.hash.slice(1));if(i>=0&&(i!==cur||moving))goTo(i)});
addEventListener('resize',()=>layout(P));
cur=Math.max(0,PAGES.indexOf(location.hash.slice(1)));markTab(cur);layout(cur);

/* swipe: vertical scroll stays native (touch-action: pan-y); horizontal intent is tracked 1:1 */
pagesEl.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse')return;
  dr={id:e.pointerId,x0:e.clientX,y0:e.clientY,lock:false,base:0,start:cur,hist:[]};
  if(moving){                              // grab mid-flight: continue from the live position
    ph.stop();dr.lock=true;dr.base=P*W;dr.hist=[[e.clientX,e.timeStamp]];pagesEl.setPointerCapture(e.pointerId);
  }
});
pagesEl.addEventListener('pointermove',e=>{
  if(!dr||e.pointerId!==dr.id)return;
  if(!dr.lock){
    const dx=e.clientX-dr.x0,dy=e.clientY-dr.y0;
    if(Math.abs(dx)<10&&Math.abs(dy)<10)return;
    if(Math.abs(dy)>=Math.abs(dx)){dr=null;return}
    dr.lock=true;dr.base=P*W;dr.x0=e.clientX;dr.hist=[[e.clientX,e.timeStamp]];
    if(scrollY>0)scrollTo(0,0);
    pagesEl.setPointerCapture(e.pointerId);
  }
  dr.hist.push([e.clientX,e.timeStamp]);if(dr.hist.length>6)dr.hist.shift();
  const raw=dr.base-(e.clientX-dr.x0),max=LAST*W;
  layout((raw<0?-rubber(-raw,W):raw>max?max+rubber(raw-max,W):raw)/W);
});
function release(e){
  if(!dr||e.pointerId!==dr.id)return;
  const d=dr;dr=null;if(!d.lock)return;
  justDragged=true;setTimeout(()=>justDragged=false,60);
  const a=d.hist[0],b=d.hist[d.hist.length-1],fv=b[1]>a[1]?(b[0]-a[0])/(b[1]-a[1])*1000:0,v=-fv;
  const to=Math.round((P*W+project(v,.99))/W);               // where the flick is heading
  const n=Math.max(d.start-1,Math.min(d.start+1,to));        // one page at a time
  goTo(n,v,Math.abs(v)>300?.85:1);                           // a little bounce only if flicked
}
pagesEl.addEventListener('pointerup',release);pagesEl.addEventListener('pointercancel',release);
pagesEl.addEventListener('click',e=>{if(justDragged){e.stopPropagation();e.preventDefault()}},true);

/* ---- bottom sheet: 1:1 drag, rubber-band, momentum projection, velocity handoff ---- */
const sheet=$('#sheet'),scrim=$('#scrim'),mainEl=$('main');
let y=0,H=0,sh,opener,isOpen=false;
function paint(v){
  y=v;sheet.style.transform='translateY('+v+'px)';
  const p=Math.max(0,Math.min(1,1-v/H));scrim.style.opacity=p;
  mainEl.style.transform=RM.matches?'':'scale('+(1-.04*p)+')';
}
function openSheet(n,d,t,btn){
  $('#sn').textContent=n;$('#sd').textContent=d;$('#st').textContent=t;opener=btn;
  sheet.style.visibility='visible';scrim.style.pointerEvents='auto';isOpen=true;
  H=sheet.offsetHeight+40;if(!sh)paint(H);
  sh&&sh.stop();sh=spring(y,0,0,{damping:.8,response:.4},paint);
  $('.done').focus({preventScroll:true});
}
function closeSheet(v=0){
  isOpen=false;sh&&sh.stop();scrim.style.pointerEvents='none';
  sh=spring(y,H,v,{damping:1,response:.35},paint,()=>{sheet.style.visibility='hidden';sh=null;opener&&opener.focus({preventScroll:true})});
}
$('.done').onclick=()=>closeSheet();
scrim.addEventListener('pointerdown',()=>closeSheet());
addEventListener('keydown',e=>{if(e.key==='Escape'&&isOpen)closeSheet()});
let drag=null;
sheet.addEventListener('pointerdown',e=>{
  if(e.target.closest('.done')||(e.target.closest('#st')&&$('#st').scrollTop>0))return;
  sh&&sh.stop();                                   // grab mid-flight: continue from the live value
  drag={id:e.pointerId,off:e.clientY-y,hist:[[e.clientY,e.timeStamp]],moved:false,sy:e.clientY};
  sheet.setPointerCapture(e.pointerId);
});
sheet.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(!drag.moved&&Math.abs(e.clientY-drag.sy)<10)return;drag.moved=true;
  drag.hist.push([e.clientY,e.timeStamp]);if(drag.hist.length>6)drag.hist.shift();
  const raw=e.clientY-drag.off;paint(raw<0?-rubber(-raw,H):raw);
});
function end(e){
  if(!drag||e.pointerId!==drag.id)return;
  const h=drag.hist,a=h[0],b=h[h.length-1],v=b[1]>a[1]?(b[0]-a[0])/(b[1]-a[1])*1000:0;
  const moved=drag.moved;drag=null;if(!moved){if(isOpen)sh=spring(y,0,0,{damping:1,response:.3},paint);return}
  const end=y+project(v);                          // where the flick is heading
  if(end>H/2)closeSheet(v);else{isOpen=true;sh=spring(y,0,v,{damping:.8,response:.4},paint)}
}
sheet.addEventListener('pointerup',end);sheet.addEventListener('pointercancel',end);

/* ---- theme: light by default, manual toggle, remembered ---- */
const root=document.documentElement,tb=$('#theme'),ic=tb.firstChild;let rot=0,th;
function icons(dark){$('#sun').style.display=dark?'none':'';$('#moon').style.display=dark?'':'none';tb.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode')}
icons(root.dataset.theme==='dark');
tb.addEventListener('click',()=>{
  const dark=root.dataset.theme!=='dark';
  if(!RM.matches){root.classList.add('tt');setTimeout(()=>root.classList.remove('tt'),400)}
  root.dataset.theme=dark?'dark':'light';icons(dark);
  try{localStorage.setItem('theme',dark?'dark':'light')}catch(e){}
  th&&th.stop();th=spring(rot,rot+90,0,{damping:.8,response:.4},r=>{rot=r;ic.style.transform='rotate('+r+'deg)'});
});
})
.catch(err=>console.error('Failed to load events.json:',err));
al toggle, remembered ---- */
const root=document.documentElement,tb=$('#theme'),ic=tb.firstChild;let rot=0,th;
function icons(dark){$('#sun').style.display=dark?'none':'';$('#moon').style.display=dark?'':'none';tb.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode')}
icons(root.dataset.theme==='dark');
tb.addEventListener('click',()=>{
  const dark=root.dataset.theme!=='dark';
  if(!RM.matches){root.classList.add('tt');setTimeout(()=>root.classList.remove('tt'),400)}
  root.dataset.theme=dark?'dark':'light';icons(dark);
  try{localStorage.setItem('theme',dark?'dark':'light')}catch(e){}
  th&&th.stop();th=spring(rot,rot+90,0,{damping:.8,response:.4},r=>{rot=r;ic.style.transform='rotate('+r+'deg)'});
});
})
.catch(err=>console.error('Failed to load events.json:',err));
