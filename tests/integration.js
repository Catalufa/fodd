import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';
const base=process.argv[2]||'http://127.0.0.1:8787';let password='';for await(const c of process.stdin)password+=c;password=password.trim();let cookie='',csrf='';let checks=0;
async function req(path,method='GET',data,extra={}){const r=await fetch(base+path,{method,headers:{Origin:base,Cookie:cookie,'X-CSRF-Token':csrf,...(data&&typeof data==='object'&&!ArrayBuffer.isView(data)?{'Content-Type':'application/json'}:{}),...extra},body:data?ArrayBuffer.isView(data)?data:JSON.stringify(data):undefined,redirect:'manual'});return r;}
async function ok(r,status=200){assert.equal(r.status,status,await r.clone().text());checks++;return r;}
async function login(p=password){const r=await ok(await req('/api/login','POST',{username:'admin',password:p}));assert.match(r.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Strict/);cookie=r.headers.get('set-cookie').split(';')[0];csrf=(await r.json()).csrf;}
for(const route of ['/','/about','/events','/maps','/nature','/heritage','/accessibility','/photos','/contact','/qr','/admin','/sitemap.xml','/robots.txt'])await ok(await req(route));
await ok(await req('/api/pages'),401);await ok(await req('/api/login','POST',{username:'admin',password:'incorrect'}),401);await login();await ok(await req('/api/session'));
let original=await (await ok(await req('/api/pages/heritage'))).json();let version=original.version;
try{
 await ok(await req('/api/pages/heritage','POST',original,{'X-CSRF-Token':'bad'}),403);
 await ok(await req('/api/pages/heritage','POST',original,{Origin:'https://evil.example'}),403);
 const edited={...original,sections:[{type:'text',title:'Integration check',html:'<p><strong>Temporary verification</strong><script>alert(1)</script><a href="javascript:alert(1)">bad link</a></p>',style:{theme:'green',align:'center'}}]};
 await ok(await req('/api/pages/heritage/draft','POST',edited));assert(!(await (await req('/heritage')).text()).includes('Temporary verification'));checks++;
 await ok(await req('/api/pages/heritage/preview','POST',edited));
 let saved=await (await ok(await req('/api/pages/heritage','POST',edited))).json();version=saved.version;
 let html=await(await req('/heritage')).text();assert(html.includes('<strong>Temporary verification</strong>'));assert(!html.includes('alert(1)'));assert(html.includes('theme-green'));checks+=3;
 await ok(await req('/api/pages/heritage','POST',edited),409);
 const revisions=await(await req('/api/pages/heritage/revisions')).json();assert(revisions.length>0);
 const restored=await(await ok(await req('/api/pages/heritage/restore','POST',{id:revisions[0].id,version}))).json();version=restored.version;
 assert(!(await(await req('/heritage')).text()).includes('Temporary verification'));checks++;
 await ok(await req('/api/media','POST',new TextEncoder().encode('<svg onload="alert(1)">'),{'Content-Type':'image/png','X-Filename':'fake.png'}),400);
 await ok(await req('/api/media','POST',new Uint8Array(10485761),{'Content-Type':'image/png','X-Filename':'huge.png'}),413);
 const pdf=new Uint8Array(await readFile('public/assets/constitution-april-2026.pdf'));
 const media=await(await ok(await req('/api/media','POST',pdf,{'Content-Type':'application/pdf','X-Filename':'verification-constitution.pdf'}),201)).json();
 const downloaded=await ok(await req(media.url));assert.equal((await downloaded.arrayBuffer()).byteLength,pdf.length);checks++;
 await ok(await req('/api/media','POST',pdf,{'Content-Type':'application/pdf','X-Filename':'verification-constitution-replaced.pdf','X-Replace-Id':media.id}),201);
 await ok(await req(media.url));await ok(await req('/api/export'));
 // Verify event creation, modification, hiding/removal and gallery content via the same validated persistence route.
 for(const slug of ['events','photos']){const p=await(await req('/api/pages/'+slug)).json();let v=p.version;try{const test=slug==='events'?{type:'event',title:'Verification event',date:'2030-10-31',start:'11:00',end:'12:00',location:'Test',html:'<p>Temporary test</p>'}:{type:'image',image:'/assets/bg.jpg',alt:'Test alt',caption:'Verification photo'};const a={...p,sections:[...p.sections,test]};let r=await(await ok(await req('/api/pages/'+slug,'POST',a))).json();v=r.version;assert((await(await req('/'+slug)).text()).includes(test.title||test.caption));checks++;a.version=v;a.sections[a.sections.length-1].hidden=true;r=await(await ok(await req('/api/pages/'+slug,'POST',a))).json();v=r.version;assert(!(await(await req('/'+slug)).text()).includes(test.title||test.caption));checks++;}finally{await ok(await req('/api/pages/'+slug,'POST',{...p,version:v}));}}
 const next='Temporary-test-'+crypto.randomUUID();await ok(await req('/api/password','POST',{current:password,password:next}));await ok(await req('/api/session'),401);await login(next);await ok(await req('/api/password','POST',{current:next,password}));await login();
 await ok(await req('/api/logout','POST'));await ok(await req('/api/session'),401);
 await writeFile('../research/persistence-'+(base.includes('127.0.0.1')?'local':'remote')+'.json',JSON.stringify({base,media:media.url,checks}));
 console.log(`${checks} integration assertions passed; original content and password restored. Upload persistence URL: ${media.url}`);
}catch(e){try{await req('/api/pages/heritage','POST',{...original,version});}catch{}throw e;}
