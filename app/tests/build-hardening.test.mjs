import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
const run=spawnSync(process.execPath,['scripts/build.mjs'],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
assert(!fs.existsSync('dist/tests'));assert(!fs.existsSync('dist/netlify'));assert(!fs.existsSync('dist/supabase-hardening-11-43.sql'));assert(!fs.existsSync('dist/js/package.json'));assert(!fs.existsSync('dist/requirements-test.txt'));
for(const file of ['index.html','js/privacy.js','privacy.css','js/vendor/supabase-2.49.8.js','js/sync-merge.js','sw.js'])assert(fs.existsSync('dist/'+file),file);
const sw=fs.readFileSync('dist/sw.js','utf8');assert(sw.includes('/js/sync-merge.js'));assert(!sw.includes('BUILD_PRECACHE'));assert(!sw.includes('skipWaiting'));assert(sw.includes('crypto.subtle.digest')); assert(sw.includes('throw error'));
console.log('Build: public-only deployment, local SDK, release identity and complete precache passed.');
