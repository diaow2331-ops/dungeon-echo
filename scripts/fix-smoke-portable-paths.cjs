const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', 'test', 'smoke.cjs');
let source = fs.readFileSync(file, 'utf8');
const oldDir = "  const pdir = __dirname + '\\\\..\\\\profiles';";
const newDir = "  const pdir = path.resolve(__dirname, '..', 'profiles');";
const oldRead = "    const txt = fs.readFileSync(pdir + '\\\\' + f, 'utf8');";
const newRead = "    const txt = fs.readFileSync(path.join(pdir, f), 'utf8');";
if (!source.includes(oldDir)) throw new Error('portable-path patch: pdir source not found');
if (!source.includes(oldRead)) throw new Error('portable-path patch: profile read source not found');
source = source.replace(oldDir, newDir).replace(oldRead, newRead);
fs.writeFileSync(file, source);
console.log('smoke_portable_paths=APPLIED');
