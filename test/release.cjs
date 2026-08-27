'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const version = read('VERSION').trim();
const html = read('index.html');
const style = read('style.css');
const manifest = read('ops/release/static-files.txt').split(/\r?\n/).filter(Boolean);
const builder = read('ops/release/build-site-bundle.sh');
const deploy = read('ops/site-bundle/deploy.sh');
const bootstrap = read('runtime-bootstrap.js');
const releaseStampName = `release-stamp-v${version.replace(/\./g, '')}.js`;
const releaseStamp = fs.existsSync(path.join(root, releaseStampName)) ? read(releaseStampName) : '';
const assetVersion = version.replace(/\./g, '');
const cleanRef = ref => ref.split(/[?#]/, 1)[0];

let pass = 0;
let fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}

console.log('[release] v1 static package');
ok(/^\d+\.\d+\.\d+$/.test(version), 'VERSION 使用 SemVer');
ok(manifest.includes(releaseStampName) && bootstrap.includes(releaseStampName) && releaseStamp.includes(`const version = '${version}'`),
  '运行时发布戳与 VERSION 一致');
ok(manifest.every(file => fs.existsSync(path.join(root, file))), '发布白名单资源全部存在');
ok(!manifest.some(file => /^(?:dev\.html|test\/|profiles\/classic-(?:10|20|30|40|50|60)\.profile\.js$)/.test(file)),
  '发布白名单不包含开发入口、测试与短档位');
ok(manifest.includes('art/title-backdrop.webp') && manifest.includes('art/class-roster.webp') && manifest.includes('art/loot-atlas.png'),
  '三组正式美术资源进入发布白名单');

const localRefs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(match => match[1])
  .filter(ref => !/^(?:data:|https?:|#)/.test(ref));
const localFiles = localRefs.map(cleanRef);
ok(localFiles.every(ref => fs.existsSync(path.join(root, ref))), '生产 HTML 的本地资源引用全部可解析');
ok(localFiles.every(ref => manifest.includes(ref)), '生产 HTML 的本地资源全部进入发布白名单');

ok(/public\/dungeon-echo/.test(builder) && /static-files\.txt/.test(builder),
  '上传包只从正式白名单生成 Dungeon Echo 子目录');
ok(/SHA256SUMS/.test(builder) && /git -C "\$repo_root" cat-file -e/.test(builder),
  '上传包校验 HEAD 跟踪文件并生成哈希清单');
ok(/SITE_ROOT=\/srv\/91hwl-play/.test(deploy) && /previous_release\/moyu\/index\.html/.test(deploy),
  '部署复用既有 91hwl-play 发布树并保护摸鱼游戏');
ok(/mv -Tf "\$next_link" "\$CURRENT_LINK"/.test(deploy) && /ROLLED_BACK/.test(deploy),
  '整站 current 指针原子切换且失败可回滚');

if (['1.2.5','1.2.6','1.2.7','1.2.8'].includes(version)) {
  const releaseCriticalRefs = localRefs.filter(ref => /(?:\.css|\.js)(?:\?|$)/.test(ref));
  ok(releaseCriticalRefs.length > 0 && releaseCriticalRefs.every(ref => ref.endsWith(`?v=${assetVersion}`)),
    '生产入口的 CSS/JS 全部带当前发布缓存指纹');
  ok(bootstrap.includes(`const assetVersion = '${assetVersion}'`) && bootstrap.includes(`fresh('${releaseStampName}')`),
    '后加载运行时资源共享同一缓存指纹');
  ok(style.includes('#achv-screen, #help-screen {') && style.includes('position: fixed') && style.includes('#help-screen > .title-card { margin: auto; }'),
    '玩法说明与远征录仍由原生样式层拥有');
}

if (['1.2.6','1.2.7','1.2.8'].includes(version)) {
  const helpCopy = read('help-copy-v126.js');
  const record = read('expedition-record-v126.js');
  ok(manifest.includes('help-copy-v126.js') && manifest.includes('expedition-record-v126.js'),
    '共享双语说明与远征档案 owners 进入发布白名单');
  ok(bootstrap.includes("fresh('help-copy-v126.js')") && bootstrap.includes("fresh('expedition-record-v126.js')"),
    '运行时按 locale → mobile → help/record 顺序加载共享 UI owners');
  ok(helpCopy.includes('Desktop:') && helpCopy.includes('Mobile:') && helpCopy.includes('电脑：') && helpCopy.includes('手机：'),
    '玩法说明具有完整双语双端操作文案');
  ok(record.includes("CATALOG = Object.freeze([") && record.includes("catalogSize:CATALOG.length") && record.includes('No expedition profile yet'),
    '远征档案具有完整成就目录与无存档零状态');
  ok(record.includes("depth_100") && record.includes("kills_500") && record.includes("legend") && record.includes("win"),
    '远征档案保留核心深度/击杀/传说/通关成就');
  ok(record.includes("Achievements · ${gotCount}/${CATALOG.length}") && record.includes('已解锁 ${gotCount} / ${CATALOG.length}'),
    '远征档案明确显示解锁数与中英状态');
  ok(deploy.includes('expedition record zero-state copy missing') && deploy.includes('English device help copy missing'),
    '部署前验证远征档案零状态与英文说明');
}

if (['1.2.7','1.2.8'].includes(version)) {
  ok(manifest.includes('npc-stability-system.js') && manifest.includes('progression-guard-system.js') && manifest.includes('risk-reward-system.js'),
    '显式 gameplay owners 全部进入发布白名单');
  ok(html.includes(`npc-stability-system.js?v=${assetVersion}`) && html.includes(`progression-guard-system.js?v=${assetVersion}`) && html.includes(`risk-reward-system.js?v=${assetVersion}`),
    '生产入口按当前缓存代际装载 gameplay owners');
}

if (version === '1.2.8') {
  const localeCompletion = read('locale-completeness-v128.js');
  ok(manifest.includes('locale-completeness-v128.js') && bootstrap.includes("fresh('locale-completeness-v128.js')"),
    'v1.2.8 英文动态补全 owner 进入发布包并由 bootstrap 装载');
  ok(bootstrap.indexOf("fresh('locale-runtime-v122.js')") < bootstrap.indexOf("fresh('locale-completeness-v128.js')"),
    'locale completeness 在基础 locale owner 之后加载');
  ok(localeCompletion.includes('characterData:true') && ['#stats','#equipbar','#stage','#touch','#log','#title-screen','#pause-screen','#town-screen']
      .every(selector => localeCompletion.includes(`'${selector}'`)),
    'v1.2.8 覆盖状态、装备、战斗反馈、日志与主要运行时文本重写区');
  ok(localeCompletion.includes('You stepped on a trap') && localeCompletion.includes('This floor has') && localeCompletion.includes('Descent ${m[1]}'),
    'v1.2.8 覆盖实测混合日志句式');
  ok(localeCompletion.includes('Press J to attack in your facing direction') && localeCompletion.includes("return '> Enter Descend · J Attack · K Skill'"),
    'v1.2.8 将旧 C 技能/J 快速下潜提示归一为正式 J 攻击/K 技能语义');
  ok(localeCompletion.includes('Progress saved locally') && localeCompletion.includes('No mid-run save yet'),
    'v1.2.8 覆盖暂停与标题存档摘要的原位重写');
  ok(localeCompletion.includes('sub.hidden = true') && localeCompletion.includes("weapon:'Weapon'"),
    '英文模式移除标题中文副标并保持英文装备语义');
  ok(localeCompletion.includes('new WeakSet()') && !/setInterval\s*\(/.test(localeCompletion),
    '语言补全层避免重复 observer 且无轮询');
  ok(deploy.includes('locale completeness production-control translation missing') && deploy.includes('locale completeness runtime scopes missing'),
    '部署前强制验证 v1.2.8 动态范围与正式控制语义');
}

console.log(`\nRESULT  ${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
