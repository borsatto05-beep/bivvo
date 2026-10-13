import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
let failed=0,passed=0;
for (const file of readdirSync('tests').filter(x=>/\.(mjs|js)$/.test(x)).sort()) {
 const run=spawnSync(process.execPath,['tests/'+file],{encoding:'utf8',timeout:60000});
 if(run.status!==0) {failed++;console.error(file+' FAIL\n'+run.stdout+run.stderr);}
 else {passed++;console.log(file+' PASS');}
}
console.log(`${passed} suites passed; ${failed} failed.`);
process.exitCode=failed?1:0;
