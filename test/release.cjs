'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const version = read('VERSION').trim();
const html = read('index.html');
const manifest = read('ops/release/static-files.txt').split(/\r?\n/).filter(Boolean);
const nginx = read('ops/nginx/dungeon-echo.locations.conf');
const stage = read('ops/release/stage-static-release.sh');

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

ok(/location \/dungeon-echo\//.test(nginx) && /__DUNGEON_ECHO_RELEASE_DIR__/.test(nginx),
  'Nginx 模板固定公开路径并绑定不可变发布目录');
ok(/autoindex off/.test(nginx) && /Cache-Control "no-store"/.test(nginx),
  'Nginx 禁止目录索引并防止跨版本缓存混用');
ok(/Content-Security-Policy/.test(nginx) && /frame-ancestors 'self'/.test(nginx),
  'Nginx 提供同源安全策略');

ok(/branch --show-current\)" = main/.test(stage) && /worktree must be clean/.test(stage),
  '发布脚本只接受干净 main');
ok(/cat-file -e "HEAD:\$file"/.test(stage) && /SHA256SUMS/.test(stage),
  '发布脚本只复制 HEAD 已跟踪文件并生成哈希清单');
ok(/mv -Tf "\$next_link" "\$current_link"/.test(stage), 'current 指针原子切换');

console.log(`\nRESULT  ${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
