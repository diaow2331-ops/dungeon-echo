'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const version = read('VERSION').trim();
const html = read('index.html');
const manifest = read('ops/release/static-files.txt').split(/\r?\n/).filter(Boolean);
const builder = read('ops/release/build-site-bundle.sh');
const deploy = read('ops/site-bundle/deploy.sh');

let pass = 0;
let fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}

console.log('[release] v1 static package');
ok(/^\d+\.\d+\.\d+$/.test(version), 'VERSION 使用 SemVer');
ok(html.includes(`v${version}`), '生产页显示当前正式版本');
ok(manifest.every(file => fs.existsSync(path.join(root, file))), '发布白名单资源全部存在');
ok(!manifest.some(file => /^(?:dev\.html|test\/|profiles\/classic-(?:10|20|30|40|50|60)\.profile\.js$)/.test(file)),
  '发布白名单不包含开发入口、测试与短档位');
ok(manifest.includes('art/title-backdrop.webp') && manifest.includes('art/class-roster.webp') && manifest.includes('art/loot-atlas.png'),
  '三组正式美术资源进入发布白名单');

const localRefs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(match => match[1])
  .filter(ref => !/^(?:data:|https?:|#)/.test(ref));
ok(localRefs.every(ref => fs.existsSync(path.join(root, ref))), '生产 HTML 的本地资源引用全部可解析');
ok(localRefs.every(ref => manifest.includes(ref)), '生产 HTML 的本地资源全部进入发布白名单');

ok(/public\/dungeon-echo/.test(builder) && /static-files\.txt/.test(builder),
  '上传包只从正式白名单生成 Dungeon Echo 子目录');
ok(/SHA256SUMS/.test(builder) && /git -C "\$repo_root" cat-file -e/.test(builder),
  '上传包校验 HEAD 跟踪文件并生成哈希清单');
ok(/SITE_ROOT=\/srv\/91hwl-play/.test(deploy) && /previous_release\/moyu\/index\.html/.test(deploy),
  '部署复用既有 91hwl-play 发布树并保护摸鱼游戏');
ok(/mv -Tf "\$next_link" "\$CURRENT_LINK"/.test(deploy) && /ROLLED_BACK/.test(deploy),
  '整站 current 指针原子切换且失败可回滚');

console.log(`\nRESULT  ${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
