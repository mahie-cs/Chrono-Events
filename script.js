:root{--bg:#f5f5f7;--card:#fff;--fg:#1d1d1f;--mut:#6e6e73;--line:rgba(0,0,0,.08);--glass:rgba(255,255,255,.62);--glass-edge:rgba(255,255,255,.7);--sel:rgba(0,0,0,.07);--up:#0071e3;--on:#248a3d;--past:#8e8e93;--shadow:0 8px 30px rgba(0,0,0,.12);
box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
:root[data-theme=dark]{color-scheme:dark;--bg:#000;--card:#1c1c1e;--fg:#f5f5f7;--mut:#98989d;--line:rgba(255,255,255,.1);--glass:rgba(40,40,44,.62);--glass-edge:rgba(255,255,255,.14);--sel:rgba(255,255,255,.14);--up:#2997ff;--on:#30d158;--shadow:0 8px 30px rgba(0,0,0,.6)}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html{overflow-x:hidden}body{overflow-x:clip}
html,body{margin:0;background:var(--bg);color:var(--fg);font:100%/1.5 system-ui,-apple-system,"SF Pro Text",sans-serif;-webkit-font-smoothing:antialiased}
html{scroll-padding-top:env(safe-area-inset-top,0px)}
main,header,footer{max-width:1100px;margin:0 auto;padding-inline:1.25rem}
header{padding-top:3rem;padding-bottom:.5rem}
h1{font-size:clamp(2.4rem,7vw,3.6rem);line-height:1.05;letter-spacing:-.03em;font-weight:700;margin:0;font-optical-sizing:auto}
.top{display:flex;align-items:center;justify-content:space-between;gap:1rem}
#theme{flex:none;width:44px;height:44px;border-radius:50%;border:1px solid var(--glass-edge);background:var(--glass);color:var(--fg);display:grid;place-items:center;cursor:pointer;padding:0;-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%);box-shadow:0 2px 12px rgba(0,0,0,.1);transition:transform 100ms ease-out}
#theme:active{transform:scale(.92)}
#theme svg{width:22px;height:22px;will-change:transform}
.tt,.tt *{transition:background-color .35s ease,color .35s ease,border-color .35s ease!important}
.sub{color:var(--mut);margin:.4rem 0 0;font-size:1.05rem}
main{padding-bottom:8rem;min-height:100vh;min-height:100dvh;overflow-x:clip;transform-origin:50% 0;will-change:transform}
#pages{position:relative;touch-action:pan-y pinch-zoom;overflow-x:clip;margin-inline:-1.25rem;padding-inline:1.25rem}
.page[hidden]{display:none}
section.st{margin-top:2.25rem}
h2{display:flex;align-items:center;gap:.55rem;font-size:1.45rem;line-height:1.2;letter-spacing:-.02em;font-weight:650;margin:0 0 .9rem}
h2 i{width:.6rem;height:.6rem;border-radius:50%;background:var(--c)}
h2 small{font-size:.85rem;font-weight:600;color:var(--mut);letter-spacing:0;margin-left:auto}
[data-s=upcoming]{--c:var(--up)}[data-s=ongoing]{--c:var(--on)}[data-s=past]{--c:var(--past)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem}
.empty{color:var(--mut);margin:0;padding:1rem 0}
.card{perspective:900px;height:200px;cursor:pointer;transition:transform 100ms ease-out;touch-action:manipulation;outline-offset:3px;user-select:none;-webkit-user-select:none}
.card:active{transform:scale(.97)}
.in{position:relative;width:100%;height:100%;transform-style:preserve-3d;will-change:transform}
.f,.b{position:absolute;inset:0;background:var(--card);border-radius:22px;padding:1.2rem;backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:0 1px 2px var(--line),0 6px 20px rgba(0,0,0,.05);border:1px solid var(--line);display:flex;flex-direction:column;overflow:hidden}
.b{transform:rotateY(180deg)}
.f h3{font-size:1.3rem;line-height:1.2;letter-spacing:-.015em;font-weight:650;margin:0}
.pill{margin-top:auto;align-self:flex-start;font-size:.82rem;font-weight:600;color:var(--c);background:color-mix(in srgb,var(--c) 13%,transparent);padding:.25rem .65rem;border-radius:99px;letter-spacing:.01em}
.b h4{margin:0 0 .4rem;font-size:1rem;line-height:1.25;letter-spacing:-.01em;font-weight:650}
.b p{margin:0;font-size:.92rem;line-height:1.45;color:var(--mut);flex:1;overflow:hidden;-webkit-mask-image:linear-gradient(#000 70%,transparent);mask-image:linear-gradient(#000 70%,transparent)}
.b p.full{-webkit-mask-image:none;mask-image:none}
.more{align-self:flex-start;border:0;background:var(--sel);color:var(--fg);font:inherit;font-size:.85rem;font-weight:600;padding:.35rem .85rem;border-radius:99px;cursor:pointer;margin-top:.5rem;transition:transform 100ms ease-out}
.more:active,.done:active{transform:scale(.95)}
nav{position:fixed;left:0;right:0;transform:translateZ(0);bottom:calc(1rem + env(safe-area-inset-bottom,0px));display:flex;justify-content:center;z-index:10;pointer-events:none}
.tabs{position:relative;display:flex;padding:5px;border-radius:99px;pointer-events:auto;background:var(--glass);-webkit-backdrop-filter:blur(24px) saturate(180%);backdrop-filter:blur(24px) saturate(180%);border:1px solid var(--glass-edge);box-shadow:var(--shadow);width:min(92vw,420px)}
.tabs a{position:relative;z-index:1;flex:1;text-align:center;padding:.6rem .25rem;font-size:.95rem;font-weight:600;letter-spacing:.005em;color:var(--mut);text-decoration:none;border-radius:99px;transition:color 150ms}
.tabs a.on{color:var(--fg)}
.ind{position:absolute;top:5px;bottom:5px;left:5px;border-radius:99px;background:var(--sel);will-change:transform}
a:focus-visible,button:focus-visible,.card:focus-visible{outline:2px solid var(--up)}
footer{color:var(--mut);font-size:.85rem;padding-bottom:7rem;border-top:1px solid var(--line);padding-top:1.5rem}
footer p{margin:.15rem 0}footer a{color:var(--up)}
#scrim{position:fixed;inset:0;background:rgba(0,0,0,.4);opacity:0;pointer-events:none;z-index:20}
#sheet{position:fixed;left:50%;bottom:0;width:min(100%,560px);margin-left:calc(min(100%,560px)/-2);z-index:21;visibility:hidden;touch-action:none;padding:.6rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom,0px));border-radius:28px 28px 0 0;background:var(--glass);-webkit-backdrop-filter:blur(40px) saturate(180%);backdrop-filter:blur(40px) saturate(180%);border:1px solid var(--glass-edge);border-bottom:0;box-shadow:0 -12px 50px rgba(0,0,0,.25);will-change:transform}
#sheet .grab{width:38px;height:5px;border-radius:3px;background:var(--mut);opacity:.5;margin:0 auto 1rem}
#sheet h3{font-size:1.6rem;line-height:1.15;letter-spacing:-.02em;font-weight:700;margin:0}
#sd{color:var(--up);font-weight:600;margin:.4rem 0 1rem;letter-spacing:.01em}
#st{margin:0;color:var(--fg);font-size:1.02rem;line-height:1.55;font-weight:450;letter-spacing:.005em;user-select:text;max-height:45vh;overflow:auto;touch-action:pan-y}
.done{margin-top:1.4rem;width:100%;border:0;border-radius:99px;background:var(--up);color:#fff;font:inherit;font-weight:600;padding:.8rem;cursor:pointer;transition:transform 100ms ease-out}
@media(prefers-reduced-transparency:reduce){.tabs,#sheet{background:var(--card);-webkit-backdrop-filter:none;backdrop-filter:none}}
@media(prefers-contrast:more){.tabs,#sheet,.f,.b{background:var(--card);border-color:var(--fg);-webkit-backdrop-filter:none;backdrop-filter:none}.ind{background:var(--line)}}
@media(prefers-reduced-motion:reduce){.card,.more,.done{transition:none}}
 ---- */
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
