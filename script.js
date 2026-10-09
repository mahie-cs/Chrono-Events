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

/* ---- navigation: sliding indicator + direction-aware page entry ---- */
const tabs=[...document.querySelectorAll('.tabs a')],ind=$('.ind'),tabsEl=$('.tabs');
let cur=-1,indX=0,indH;
function placeInd(instant){
  const i=Math.max(cur,0),w=(tabsEl.clientWidth-10)/3;ind.style.width=w+'px';
  indH&&indH.stop();
  if(instant){indX=i*w;ind.style.transform='translateX('+indX+'px)';return}
  indH=spring(indX,i*w,indH?indH.v||0:0,{damping:.85,response:.4},x=>{indX=x;ind.style.transform='translateX('+x+'px)'});
}
let pgH;
function show(name){
  const i=Math.max(PAGES.indexOf(name),0),dir=cur<0?0:Math.sign(i-cur)||0,first=cur<0;
  PAGES.forEach((p,j)=>$('#page-'+p).hidden=j!==i);
  tabs.forEach((t,j)=>{t.classList.toggle('on',j===i);t.setAttribute('aria-current',j===i?'page':'false')});
  cur=i;placeInd(first);
  const pg=$('#page-'+PAGES[i]);pgH&&pgH.stop();
  if(!first)pgH=spring(0,1,0,{damping:1,response:.35},p=>{pg.style.opacity=p;pg.style.transform=RM.matches?'':'translateX('+(1-p)*dir*28+'px)'},()=>{pg.style.opacity='';pg.style.transform=''});
  if(!first&&scrollY>0)scrollTo(0,0);
}
addEventListener('hashchange',()=>show(location.hash.slice(1)));
addEventListener('resize',()=>placeInd(true));
show(location.hash.slice(1)||'exams');

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
