import {readFile} from 'node:fs/promises';
const origin=process.argv[2];if(!origin)throw new Error('Pass the Worker origin.');
let password='';for await(const c of process.stdin)password+=c;
let r=await fetch(origin+'/api/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:password.trim()})});if(!r.ok)throw new Error('Login failed.');
const cookie=r.headers.get('set-cookie').split(';')[0],{csrf}=await r.json();
const headers={Origin:origin,Cookie:cookie,'X-CSRF-Token':csrf};
const p=await(await fetch(origin+'/api/pages/about',{headers})).json();
const b=p.sections.find(b=>b.label?.includes('constitution'));
if(!b.url.startsWith('/media/')){
 r=await fetch(origin+'/api/media',{method:'POST',headers:{...headers,'Content-Type':'application/pdf','X-Filename':'constitution-april-2026.pdf'},body:await readFile('public/assets/constitution-april-2026.pdf')});if(!r.ok)throw new Error('Upload failed.');const media=await r.json();b.url=media.url;
 r=await fetch(origin+'/api/pages/about',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(p)});if(!r.ok)throw new Error('Publish failed.');console.log('Constitution imported into replaceable R2 media:',media.url);
}else console.log('Constitution already uses R2.');
await fetch(origin+'/api/logout',{method:'POST',headers});
