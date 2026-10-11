'use strict';
const assert=require('assert'),fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'..'),temporary=fs.mkdtempSync(path.join(os.tmpdir(),'milkfrog-home-health-'));
function run(command,args){const result=cp.spawnSync(command,args,{cwd:root,encoding:'utf8'});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);}
try{
  const archive=path.join(temporary,'home.zip'),bundle=path.join(temporary,'bundle');
  run('bash',['ops/release/build-home-mount-bundle.sh',archive]);
  run('unzip',['-q',archive,'-d',bundle]);
  const health=fs.readFileSync(path.join(bundle,'ops/healthcheck.sh'),'utf8');
  const boundary=health.indexOf('\ncheck_main_origin || fail');
  assert(boundary>0,'health contract definitions must precede network probes');
  const script=health.slice(0,boundary)+`
check_home "$BUNDLE_ROOT/public/index.html"
check_de_detail "$BUNDLE_ROOT/public/toys/dungeon-echo/index.html"
check_moyu_detail "$BUNDLE_ROOT/public/toys/moyu/index.html"
check_board_detail "$BUNDLE_ROOT/public/toys/board-games/index.html"
check_trust_page "$BUNDLE_ROOT/public/about/index.html" '这是一个独立浏览器游戏站。' "$ABOUT_URL" 'About'
check_trust_page "$BUNDLE_ROOT/public/privacy/index.html" '隐私说明' "$PRIVACY_URL" 'Privacy'
check_trust_page "$BUNDLE_ROOT/public/contact/index.html" '如何提交有效反馈' "$CONTACT_URL" 'Contact'
sed 's/id="milkfrog-code-form"/id="missing-code-form"/' "$BUNDLE_ROOT/public/index.html" > "$work_dir/missing-code.html"
if check_home "$work_dir/missing-code.html" 2>/dev/null; then echo 'missing homepage code form was accepted' >&2; exit 1; fi
`;
  const check=path.join(bundle,'ops/check-page-contract.sh');fs.writeFileSync(check,script);
  run('bash',[check]);
  console.log('site_download_health_scope=PASS real bundle: homepage code gate required, game/trust pages retain their own contracts');
}finally{fs.rmSync(temporary,{recursive:true,force:true});}
