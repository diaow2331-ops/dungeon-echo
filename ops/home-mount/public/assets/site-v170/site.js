(()=>{'use strict';
const LK='91hwl_site_lang',TK='91hwl_site_theme';
const root=document.documentElement,qs=new URLSearchParams(location.search);
const readCookie=n=>{const row=document.cookie.split('; ').find(v=>v.startsWith(n+'='));return row?decodeURIComponent(row.slice(n.length+1)):''};
const writeCookie=(n,v)=>{if(location.hostname.endsWith('91hwl.cn'))document.cookie=`${n}=${encodeURIComponent(v)}; Path=/; Domain=.91hwl.cn; Max-Age=31536000; SameSite=Lax`};
let lang=qs.get('lang')||window.__91HWL_PREFS?.lang||readCookie('91hwl_lang')||localStorage.getItem(LK)||'zh';
let theme=qs.get('theme')||window.__91HWL_PREFS?.theme||readCookie('91hwl_theme')||localStorage.getItem(TK)||'dark';
lang=lang==='en'?'en':'zh';theme=theme==='light'?'light':'dark';
const carry=()=>document.querySelectorAll('a[data-carry]').forEach(a=>{if(!a.dataset.baseHref)a.dataset.baseHref=a.getAttribute('href');try{const u=new URL(a.dataset.baseHref,location.href);u.searchParams.set('lang',lang);u.searchParams.set('theme',theme);a.href=u.href}catch(_){}});
const label=()=>{const b=document.getElementById('themeToggle');if(b)b.textContent=lang==='zh'?(theme==='dark'?'日':'夜'):(theme==='dark'?'Light':'Dark')};
const state=()=>{const out=document.querySelector('[data-pref-state]');if(out)out.textContent=lang==='zh'?`语言：${lang==='zh'?'中文':'English'} · 主题：${theme==='dark'?'深色':'浅色'} · 保存在此浏览器`:`Language: ${lang} · Theme: ${theme} · stored in this browser`};
const apply=()=>{root.dataset.lang=lang;root.lang=lang==='en'?'en':'zh-CN';root.dataset.theme=theme;document.querySelectorAll('[data-lang-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.langChoice===lang)));document.querySelector('meta[name=theme-color]')?.setAttribute('content',theme==='light'?'#efe7d7':'#161814');label();carry();state()};
const setLang=v=>{lang=v==='en'?'en':'zh';localStorage.setItem(LK,lang);writeCookie('91hwl_lang',lang);apply();const key=document.querySelector('[data-game-choice][aria-pressed="true"]')?.dataset.gameChoice;if(key&&key!=='random')choose(key)};
const setTheme=v=>{theme=v==='light'?'light':'dark';localStorage.setItem(TK,theme);writeCookie('91hwl_theme',theme);apply()};
const chooser={
dungeon:{seal:'壹',zh:'这一签，宜入地牢。',en:'Build slowly, descend deeply.',href:'/toys/dungeon-echo/'},
moyu:{seal:'贰',zh:'这一签，宜准点下班。',en:'Four minutes. Make it to 18:00.',href:'/toys/moyu/'}
};
const choose=key=>{const data=chooser[key];if(!data)return;document.querySelectorAll('[data-game-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gameChoice===key)));const box=document.querySelector('[data-draw-result]');if(!box)return;box.querySelector('[data-draw-seal]').textContent=data.seal;box.querySelector('[data-draw-title]').textContent=lang==='zh'?data.zh:data.en;const a=box.querySelector('a');a.href=data.href;a.dataset.baseHref=data.href;carry()};
const randomChoice=()=>choose(Math.random()<.5?'dungeon':'moyu');
const resetPrefs=()=>{const ok=confirm(lang==='zh'?'重置主站的语言与主题偏好？游戏存档不会被删除。':'Reset site language and theme preferences? Game saves will not be deleted.');if(!ok)return;localStorage.removeItem(LK);localStorage.removeItem(TK);document.cookie='91hwl_lang=; Path=/; Domain=.91hwl.cn; Max-Age=0; SameSite=Lax';document.cookie='91hwl_theme=; Path=/; Domain=.91hwl.cn; Max-Age=0; SameSite=Lax';lang=(navigator.language||'').toLowerCase().startsWith('zh')?'zh':'en';theme=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';apply();const out=document.querySelector('[data-pref-state]');if(out)out.classList.add('copy-ok')};
const copyEmail=async b=>{const value=b.dataset.copyEmail;try{await navigator.clipboard.writeText(value);b.classList.add('copy-ok');b.textContent=lang==='zh'?'已复制邮箱':'Email copied';setTimeout(()=>{b.classList.remove('copy-ok');b.textContent=lang==='zh'?'复制邮箱':'Copy email'},1800)}catch(_){location.href=`mailto:${value}`}};
document.addEventListener('click',e=>{const l=e.target.closest('[data-lang-choice]');if(l){setLang(l.dataset.langChoice);return}if(e.target.closest('#themeToggle')){setTheme(theme==='dark'?'light':'dark');return}const c=e.target.closest('[data-game-choice]');if(c){c.dataset.gameChoice==='random'?randomChoice():choose(c.dataset.gameChoice);return}if(e.target.closest('[data-reset-prefs]')){resetPrefs();return}const copy=e.target.closest('[data-copy-email]');if(copy){copyEmail(copy);return}if(e.target.closest('[data-backtop]'))scrollTo({top:0,behavior:'smooth'})});
const progress=document.querySelector('[data-scroll-progress]'),back=document.querySelector('[data-backtop]');
const onScroll=()=>{const max=document.documentElement.scrollHeight-innerHeight,p=max>0?scrollY/max:0;if(progress)progress.style.transform=`scaleX(${Math.min(1,Math.max(0,p))})`;if(back)back.classList.toggle('show',scrollY>520)};
addEventListener('scroll',onScroll,{passive:true});
apply();onScroll();
const first=document.querySelector('[data-game-choice][aria-pressed="true"]')?.dataset.gameChoice;
if(first&&first!=='random')choose(first);
})();