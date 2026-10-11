(() => {
  'use strict';
  const form = document.querySelector('#milkfrog-code-form');
  if (!form) return;
  const field = document.querySelector('#milkfrog-code');
  const status = document.querySelector('#milkfrog-status');
  const panel = document.querySelector('#milkfrog-downloads');
  const links = document.querySelector('#milkfrog-file-links');
  const paste = document.querySelector('#milkfrog-paste');
  let busy = false, message = '', error = false;
  const zh = () => document.documentElement.dataset.lang !== 'en';
  const texts = {
    ready: ['', ''],
    checking: ['正在验证卡密…', 'Verifying your code…'],
    invalid_code: ['卡密无效或暂不可领取，请核对卖家的交付消息。', 'Code invalid or not ready. Check the seller’s delivery message.'],
    too_many_attempts: ['尝试次数较多，请一分钟后再试。', 'Too many attempts. Try again in a minute.'],
    offline: ['暂时无法连接下载服务，请稍后重试。', 'Download service unavailable. Please try again.'],
    authorized: ['领取成功，推荐下载“安装版”。', 'Verified. The installer is recommended.'],
    refreshing: ['正在获取最新版本…', 'Getting the latest version…'],
    signedout: ['已退出领取，再次输入卡密即可下载。', 'Signed out. Enter your code to download again.'],
    paste_manually: ['浏览器未允许读取剪贴板，请在输入框中直接粘贴。', 'Clipboard access unavailable. Paste directly into the input.'],
    pasted: ['已粘贴，请点击验证卡密。', 'Pasted. Verify your code to continue.']
  };
  function renderStatus() {
    status.textContent = (texts[message] || texts.offline)[zh() ? 0 : 1];
    status.dataset.error = String(error);
    field.setAttribute('aria-invalid', String(error && message === 'invalid_code'));
  }
  function say(key, bad = false) { message = key; error = bad; renderStatus(); }
  function bilingual(a, b) {
    return [['zh', a], ['en', b]].map(([className, value]) => {
      const span = document.createElement('span'); span.className = className; span.textContent = value; return span;
    });
  }
  function render(data, focus = false) {
    links.replaceChildren();
    panel.hidden = !data.authorized; form.hidden = !!data.authorized;
    if (!data.authorized) return;
    for (const kind of ['installer', 'portable']) {
      const item = data.files[kind];
      if (!item || typeof item.url !== 'string' || !item.url.startsWith('/api/milkfrog/download/')) throw new Error('invalid response');
      const a = document.createElement('a');
      a.className = 'download-link'; a.href = item.url;
      a.setAttribute('download', item.name); a.setAttribute('referrerpolicy', 'no-referrer');
      const title = document.createElement('strong');
      title.append(...bilingual(kind === 'installer' ? '下载安装版 · 推荐' : '下载便携版', kind === 'installer' ? 'Installer · Recommended' : 'Portable version'));
      const arrow = document.createElement('span'); arrow.textContent = '↓'; arrow.setAttribute('aria-hidden', 'true'); title.append(arrow);
      const description = document.createElement('small'); description.className = 'file-description';
      description.append(...bilingual(kind === 'installer' ? '安装后使用，适合日常整理' : '解压后运行，自行管理文件夹', kind === 'installer' ? 'Install for everyday use' : 'Extract and run from your own folder'));
      const size = document.createElement('small'); size.textContent = `v${data.version} · ${(item.bytes / 1048576).toFixed(1)} MB · Windows x64`;
      a.append(title, description, size); links.append(a);
    }
    field.value = ''; say('authorized');
    if (focus) links.querySelector('a').focus({preventScroll: true});
  }
  async function request(path, data) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('/api/milkfrog/' + path, {
        method: data ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', signal: controller.signal,
        headers: data ? {'Content-Type': 'application/json'} : undefined, body: data ? JSON.stringify(data) : undefined
      });
      const value = await response.json();
      if (!response.ok) throw Object.assign(new Error(), {key: value.error});
      return value;
    } finally { clearTimeout(timeout); }
  }
  async function action(fn) {
    if (busy) return;
    busy = true; form.setAttribute('aria-busy', 'true');
    document.querySelectorAll('.download-panel button').forEach(b => b.disabled = true);
    try { await fn(); } catch (e) { say(texts[e.key] ? e.key : 'offline', true); }
    finally {
      busy = false; form.setAttribute('aria-busy', 'false');
      document.querySelectorAll('.download-panel button').forEach(b => b.disabled = false);
    }
  }
  form.addEventListener('submit', e => {
    e.preventDefault(); action(async () => { say('checking'); render(await request('verify', {code: field.value.trim()}), true); });
  });
  field.addEventListener('input', () => { if (!busy) say('ready'); });
  paste?.addEventListener('click', () => action(async () => {
    try { field.value = (await navigator.clipboard.readText()).trim().slice(0, field.maxLength); say(field.value ? 'pasted' : 'paste_manually'); }
    catch { say('paste_manually'); }
    field.focus();
  }));
  document.querySelector('#milkfrog-refresh').addEventListener('click', () => action(async () => {
    say('refreshing'); const data = await request('session'); render(data); say(data.authorized ? 'authorized' : 'ready');
    if (!data.authorized) field.focus();
  }));
  document.querySelector('#milkfrog-logout').addEventListener('click', () => action(async () => {
    render(await request('logout', {})); say('signedout'); field.focus();
  }));
  new MutationObserver(renderStatus).observe(document.documentElement, {attributes: true, attributeFilter: ['data-lang']});
  say('ready');
  action(async () => { const data = await request('session'); render(data); if (!data.authorized) say('ready'); });
  // Public version metadata contains no download URLs or delivery credentials.
  request('release').then(data => {
    if (/^\d+\.\d+\.\d+$/.test(data.version)) document.querySelector('#milkfrog-release').textContent = 'v' + data.version;
  }).catch(() => {});
})();
