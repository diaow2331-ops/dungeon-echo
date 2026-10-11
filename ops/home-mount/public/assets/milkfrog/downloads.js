(()=>{'use strict';
const form=document.querySelector('#milkfrog-code-form');if(!form)return;
const field=document.querySelector('#milkfrog-code'),status=document.querySelector('#milkfrog-status'),panel=document.querySelector('#milkfrog-downloads'),links=document.querySelector('#milkfrog-file-links');
let busy=false,message='',error=false;
const zh=()=>document.documentElement.dataset.lang!=='en';
const say=(key,bad=false)=>{message=key;error=bad;renderStatus();};
const texts={ready:['输入卡密后领取安装版、便携版与更新。','Enter your code for installer, portable and updates.'],checking:['正在验证卡密…','Verifying your code…'],invalid_code:['卡密无效或暂不可领取，请核对卖家交付信息。','Code invalid or not ready. Check your delivery details.'],too_many_attempts:['尝试次数较多，请一分钟后再试。','Too many attempts. Try again in a minute.'],offline:['暂时无法连接下载服务，请稍后重试。','Download service unavailable. Please try again.'],authorized:['验证成功，可以下载最新版本。','Verified. Download the latest version.'],refreshing:['正在获取最新版本…','Getting the latest version…'],signedout:['已退出领取；再次输入卡密可重新获取。','Signed out. Enter your code to get downloads again.']};
function renderStatus(){status.textContent=(texts[message]||texts.offline)[zh()?0:1];status.dataset.error=String(error);}
function text(zhText,enText){const a=document.createElement('span');a.className='zh';a.textContent=zhText;const b=document.createElement('span');b.className='en';b.textContent=enText;return [a,b];}
function render(data){
 links.replaceChildren();panel.hidden=!data.authorized;form.hidden=!!data.authorized;
 if(!data.authorized)return;
 for(const kind of ['installer','portable']){
  const item=data.files[kind];if(!item||!item.url.startsWith('/api/milkfrog/download/'))throw new Error('invalid response');
  const a=document.createElement('a');a.className='download-link';a.href=item.url;a.setAttribute('download',item.name);a.setAttribute('referrerpolicy','no-referrer');
  a.append(...text(kind==='installer'?'下载安装版':'下载便携版',kind==='installer'?'Download installer':'Download portable'));
  const small=document.createElement('small');small.textContent=`v${data.version} · ${(item.bytes/1048576).toFixed(1)} MB · Windows x64`;a.append(small);links.append(a);
 }
 field.value='';say('authorized');
}
async function request(path,data){const response=await fetch('/api/milkfrog/'+path,{method:data?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:data?{'Content-Type':'application/json'}:undefined,body:data?JSON.stringify(data):undefined});const value=await response.json();if(!response.ok)throw Object.assign(new Error(),{key:value.error});return value;}
async function action(fn){if(busy)return;busy=true;document.querySelectorAll('.download-panel button').forEach(b=>b.disabled=true);try{await fn();}catch(e){say(texts[e.key]?e.key:'offline',true);}finally{busy=false;document.querySelectorAll('.download-panel button').forEach(b=>b.disabled=false);}}
form.addEventListener('submit',e=>{e.preventDefault();action(async()=>{say('checking');render(await request('verify',{code:field.value.trim()}));});});
document.querySelector('#milkfrog-refresh').addEventListener('click',()=>action(async()=>{say('refreshing');const data=await request('session');render(data);say(data.authorized?'authorized':'ready');}));
document.querySelector('#milkfrog-logout').addEventListener('click',()=>action(async()=>{render(await request('logout',{}));say('signedout');field.focus();}));
new MutationObserver(renderStatus).observe(document.documentElement,{attributes:true,attributeFilter:['data-lang']});
say('ready');action(async()=>{const data=await request('session');render(data);if(!data.authorized)say('ready');});
})();
