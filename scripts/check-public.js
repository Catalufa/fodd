import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const origin=process.argv[2]||'http://127.0.0.1:8787';const links=new Set();let count=0;
for(const slug of ['','about','events','maps','nature','heritage','accessibility','photos','contact','qr','admin']){
 const r=await fetch(origin+'/'+slug);assert.equal(r.status,200,slug);const html=await r.text();assert(!html.includes('github_pat_'));assert(!html.includes('api.github.com'));for(const m of html.matchAll(/(?:href|src)="(\/[^"#]*)"/g))links.add(m[1].replaceAll('&amp;','&'));
 if(slug==='events')assert(html.includes('/assets/Halloween%20(1).jpg'),'Halloween poster missing');
 if(slug==='')assert(!html.includes('View constitution'));
 if(slug==='about')assert(html.includes('/media/'),'Constitution should be replaceable media');count++;
}
for(const link of links){if(link==='/api/export')continue;const r=await fetch(origin+link);assert.equal(r.status,200,link);count++;}
const saved=JSON.parse(await readFile('../research/persistence-'+(origin.includes('127.0.0.1')?'local':'remote')+'.json','utf8'));
assert.equal((await fetch(origin+saved.media)).status,200,'Uploaded media lost across restart/deploy');
console.log(`${count} public page/asset checks passed; uploaded media survived restart/redeployment.`);
