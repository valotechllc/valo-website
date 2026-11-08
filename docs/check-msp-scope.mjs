/* Guard the owner's explicit scope. node docs/check-msp-scope.mjs BASE_COMMIT */
import fs from 'node:fs';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
const base=process.argv[2]||'48fc758';
const old=p=>execFileSync('git',['show',`${base}:${p}`]);
const protectedFiles=['stage/scene-migration.js','stage/scene-segmentation.js','stage/scene-assessment.js','stage/stage.js','stage/lib.js','home.css','home.js','styles.css','media/card-migration.webp','media/card-segmentation.webp','media/card-assessment.webp','media/migration-poster.webp','media/migration-poster-portrait.webp'];
for(const p of protectedFiles)assert(old(p).equals(fs.readFileSync(p)),`${p} must remain byte-identical`);
const removeMsp=s=>s.replace(/\/stage\/hero\.js\?v=msp[^"]*/,'/stage/hero.js').replace(/  <!-- 5\. MSP[\s\S]*?(?=  <!-- 6\.)/,'').replace(/<link rel="stylesheet" href="\/msp-studio\.css\?v=[^"]+" \/>\n/,'').replace(/<script type="module" src="\/stage\/msp-feature\.js\?v=[^"]+"><\/script>\n/,'');
assert.equal(removeMsp(fs.readFileSync('index.html','utf8')),removeMsp(old('index.html').toString()),'Only the MSP section and its two asset includes may change');
const maskMsp=s=>s.replace(/\.\/scene-msp\.js\?v=msp[^']*/,'./scene-msp.js').replace(/    title: 'MSP white-label'[\s\S]*?(?=\n  }\n\];)/,'MSP copy');
assert.equal(maskMsp(fs.readFileSync('stage/hero.js','utf8')),maskMsp(old('stage/hero.js').toString()),'Other hero services and controller logic must remain unchanged');
console.log('PASS: protected films, images, shared renderer/styles/scripts, and non-MSP markup are byte-identical.');
