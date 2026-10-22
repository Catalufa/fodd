import {pages,validatePage,renderPage,shell,escape} from './content.js';
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers}});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
export async function hashPassword(password,salt){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256));}
const digest=async s=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const equal=(a,b)=>{if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0;};
async function limitedBody(req,max){let size=0;const chunks=[];const reader=req.body?.getReader();if(!reader)fail('Empty request.');while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();fail('File or request too large.',413);}chunks.push(value);}const out=new Uint8Array(size);let offset=0;for(const c of chunks){out.set(c,offset);offset+=c.length;}return out;}
async function body(req){try{return JSON.parse(new TextDecoder().decode(await limitedBody(req,350000)));}catch(e){if(e.status)throw e;fail('Invalid request.');}}
function sameOrigin(req){if(req.headers.get('Origin')!==new URL(req.url).origin)fail('This request must come from this website.',403);}
async function session(req,env){const token=(req.headers.get('Cookie')||'').match(/(?:^|;\s*)fodd_session=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)fail('Please log in.',401);const s=await env.DB.prepare('SELECT * FROM sessions WHERE id=? AND expires>?').bind(await digest(token),Date.now()).first();if(!s)fail('Please log in again.',401);return s;}
async function throttle(env,key,max,window){const now=Date.now();const r=await env.DB.prepare('INSERT INTO attempts(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<? THEN 1 ELSE count+1 END, expires=CASE WHEN expires<? THEN ? ELSE expires END RETURNING count,expires').bind(key,now+window,now,now,now+window).first();if(r.count>max)fail('Too many attempts. Please try again in 15 minutes.',429);}
const cookie=(value,age=28800)=>`fodd_session=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
export function uploadType(b){if(b.length<12)return '';if(b[0]===255&&b[1]===216&&b[2]===255&&b[b.length-2]===255&&b[b.length-1]===217)return 'image/jpeg';if([137,80,78,71,13,10,26,10].every((x,i)=>b[i]===x))return 'image/png';const s=new TextDecoder('latin1').decode(b.slice(0,12));if(s.startsWith('RIFF')&&s.slice(8)==='WEBP')return 'image/webp';if(s.startsWith('%PDF-')&&new TextDecoder('latin1').decode(b.slice(-1024)).includes('%%EOF'))return 'application/pdf';return '';}
async function api(req,env,path){
 if(path==='/api/login'&&req.method==='POST'){
  sameOrigin(req);await throttle(env,'ip:'+await digest(req.headers.get('CF-Connecting-IP')||'local'),15,900000);
  const data=await body(req);await throttle(env,'account:'+String(data.username).slice(0,100),30,900000);
  const user=await env.DB.prepare('SELECT * FROM users WHERE username=?').bind(String(data.username)).first();
  const hash=await hashPassword(String(data.password).slice(0,200),user?.salt||'constant-timing-dummy-salt');
  if(!user||!equal(hash,user.password_hash))fail('Username or password is incorrect.',401);
  const token=random(),csrf=random();await env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE expires<?').bind(Date.now()),env.DB.prepare('DELETE FROM attempts WHERE expires<?').bind(Date.now()),env.DB.prepare('INSERT INTO sessions VALUES(?,?,?,?)').bind(await digest(token),user.username,csrf,Date.now()+28800000)]);
  return json({csrf,username:user.username},200,{'Set-Cookie':cookie(token)});
 }
 const s=await session(req,env);
 if(!['GET','HEAD'].includes(req.method)){sameOrigin(req);if(!equal(req.headers.get('X-CSRF-Token')||'',s.csrf))fail('Please reload before saving.',403);}
 if(path==='/api/session')return json({username:s.username,csrf:s.csrf});
 if(path==='/api/logout'&&req.method==='POST'){await env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(s.id).run();return json({ok:true},200,{'Set-Cookie':cookie('',0)});}
 if(path==='/api/password'&&req.method==='POST'){
  await throttle(env,'password:'+s.username,10,900000);const d=await body(req);const user=await env.DB.prepare('SELECT * FROM users WHERE username=?').bind(s.username).first();
  if(!equal(await hashPassword(String(d.current),user.salt),user.password_hash))fail('Current password is incorrect.');
  if(typeof d.password!=='string'||d.password.length<8||d.password.length>128)fail('Use 8 to 128 characters.');
  const salt=random(),hash=await hashPassword(d.password,salt);await env.DB.batch([env.DB.prepare('UPDATE users SET salt=?,password_hash=? WHERE username=?').bind(salt,hash,s.username),env.DB.prepare('DELETE FROM sessions WHERE username=?').bind(s.username)]);return json({ok:true},200,{'Set-Cookie':cookie('',0)});
 }
 if(path==='/api/pages'&&req.method==='GET')return json((await env.DB.prepare('SELECT slug,title,version,updated_at FROM pages').all()).results);
 if(path==='/api/export'&&req.method==='GET')return json({exportedAt:new Date().toISOString(),pages:(await env.DB.prepare('SELECT * FROM pages').all()).results,revisions:(await env.DB.prepare('SELECT * FROM revisions').all()).results,media:(await env.DB.prepare('SELECT * FROM media').all()).results,mediaVersions:(await env.DB.prepare('SELECT * FROM media_versions').all()).results},200,{'Content-Disposition':'attachment; filename="fodd-content-backup.json"'});
 if(path==='/api/media'&&req.method==='GET')return json((await env.DB.prepare('SELECT * FROM media ORDER BY updated_at DESC').all()).results);
 if(path==='/api/media'&&req.method==='POST'){
  const bytes=await limitedBody(req,10*1024*1024),type=uploadType(bytes);if(!type||type!==req.headers.get('Content-Type'))fail('Upload a genuine JPG, PNG, WebP or PDF file (up to 10 MB).');
  const name=decodeURIComponent(req.headers.get('X-Filename')||'upload').replace(/[\r\n\x00-\x1f]/g,'').slice(0,180);
  const replace=req.headers.get('X-Replace-Id');if(replace&&!/^[a-f0-9-]{36}$/.test(replace))fail('Invalid media reference.');
  const old=replace?await env.DB.prepare('SELECT * FROM media WHERE id=?').bind(replace).first():null;if(replace&&!old)fail('File no longer exists.',404);
  const id=replace||crypto.randomUUID(),key=id+'/'+crypto.randomUUID();await env.MEDIA.put(key,bytes,{httpMetadata:{contentType:type}});
  const statements=[];if(old)statements.push(env.DB.prepare('INSERT INTO media_versions(media_id,object_key,name,type,size) VALUES(?,?,?,?,?)').bind(id,old.object_key,old.name,old.type,old.size));
  statements.push(env.DB.prepare('INSERT INTO media(id,object_key,name,type,size) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET object_key=excluded.object_key,name=excluded.name,type=excluded.type,size=excluded.size,updated_at=CURRENT_TIMESTAMP').bind(id,key,name,type,bytes.length));
  await env.DB.batch(statements);return json({id,url:'/media/'+id,name,type},201);
 }
 const match=path.match(/^\/api\/pages\/([a-z]+)(?:\/(draft|revisions|restore|preview))?$/);
 if(match&&pages.includes(match[1])){
  const slug=match[1],action=match[2];const page=await env.DB.prepare('SELECT * FROM pages WHERE slug=?').bind(slug).first();if(!page)fail('Page not found.',404);
  if(!action&&req.method==='GET')return json({...page,...JSON.parse(page.content),draft:await env.DB.prepare('SELECT * FROM drafts WHERE slug=?').bind(slug).first()});
  if(action==='revisions'&&req.method==='GET')return json((await env.DB.prepare('SELECT id,title,created_at FROM revisions WHERE slug=? ORDER BY id DESC LIMIT 50').bind(slug).all()).results);
  if(req.method==='POST'){
   const input=await body(req);
   if(action==='restore'){const rev=await env.DB.prepare('SELECT * FROM revisions WHERE slug=? AND id=?').bind(slug,input.id).first();if(!rev)fail('Revision not found.',404);Object.assign(input,JSON.parse(rev.content),{title:rev.title,description:rev.description});}
   const clean=validatePage(input);
   if(action==='preview')return new Response(renderPage(clean,slug,true),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
   if(action==='draft'){await env.DB.prepare('INSERT INTO drafts(slug,content) VALUES(?,?) ON CONFLICT(slug) DO UPDATE SET content=excluded.content,updated_at=CURRENT_TIMESTAMP').bind(slug,JSON.stringify({...clean,version:input.version})).run();return json({ok:true});}
   if(Number(input.version)!==page.version)fail('Someone else changed this page. Reload it before publishing.',409);
   const result=await env.DB.batch([
    env.DB.prepare('INSERT INTO revisions(slug,content,title,description) SELECT slug,content,title,description FROM pages WHERE slug=? AND version=?').bind(slug,input.version),
    env.DB.prepare('UPDATE pages SET title=?,description=?,content=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE slug=? AND version=?').bind(clean.title,clean.description,JSON.stringify(clean),slug,input.version)
   ]);
   if(!result[1].meta.changes)fail('Someone else changed this page. Reload it before publishing.',409);
   await env.DB.prepare('DELETE FROM drafts WHERE slug=?').bind(slug).run();return json({ok:true,version:page.version+1});
  }
 }
 fail('Not found.',404);
}
async function route(req,env){const url=new URL(req.url),path=url.pathname;
 if(path.startsWith('/api/'))return api(req,env,path);
 if(!['GET','HEAD'].includes(req.method))return json({error:'Method not allowed'},405);
 if(path.startsWith('/media/')){const id=path.slice(7);const m=await env.DB.prepare('SELECT * FROM media WHERE id=?').bind(id).first();if(!m)return new Response('File not found',{status:404});const obj=await env.MEDIA.get(m.object_key);if(!obj)return new Response('File not found',{status:404});return new Response(req.method==='HEAD'?null:obj.body,{headers:{'Content-Type':m.type,'Cache-Control':'no-cache','ETag':obj.httpEtag,'Content-Disposition':`${m.type==='application/pdf'?'attachment':'inline'}; filename*=UTF-8''${encodeURIComponent(m.name)}`}});}
 if(path==='/admin'||path==='/admin/')return env.ASSETS.fetch(new Request(new URL('/admin/index.html',url),req));
 if(path==='/qr'||path==='/qr/')return new Response(shell('QR generator',`<main id="main" class="page-content"><h1>QR generator</h1><label for="qr-page">Choose a page</label><select id="qr-page">${pages.map(p=>`<option value="${p==='home'?'/':'/'+p}">${escape(p)}</option>`).join('')}</select><canvas aria-label="QR code"></canvas><p id="qr-url"></p><a class="button" id="download" download="denton-dene-qr.png">Download QR code</a><p>Scan to test before printing.</p></main><script defer src="/qr.js"></script>`,'qr','Generate a QR code for a Denton Dene page.',true),{headers:{'Content-Type':'text/html; charset=utf-8'}});
 if(path==='/robots.txt')return new Response(`User-agent: *\nDisallow: /admin\nDisallow: /api/\n${env.STAGING==='true'?'Disallow: /':'Sitemap: https://friendsofdentondene.org/sitemap.xml'}\n`);
 if(path==='/sitemap.xml'){const rows=(await env.DB.prepare('SELECT slug,content FROM pages').all()).results.filter(p=>!/Lorem ipsum/i.test(p.content));return new Response(`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows.map(p=>`<url><loc>https://friendsofdentondene.org${p.slug==='home'?'':'/'+p.slug}</loc></url>`).join('')}</urlset>`,{headers:{'Content-Type':'application/xml'}});}
 const redirects={'/index.html':'/','/home':'/','/wildlife':'/nature','/flora-fauna':'/nature','/your-visits':'/photos'};
 if(redirects[path])return Response.redirect(new URL(redirects[path],url),301);
 if(path.endsWith('/')&&path!=='/')return Response.redirect(new URL(path.slice(0,-1),url),301);
 const slug=path==='/'?'home':path.slice(1);if(pages.includes(slug)){const p=await env.DB.prepare('SELECT * FROM pages WHERE slug=?').bind(slug).first();if(!p)return new Response('Content is being prepared.',{status:503});return new Response(renderPage(p,slug,env.STAGING==='true'),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'}});}
 return env.ASSETS.fetch(req);
}
export default {async fetch(req,env){let res;try{res=await route(req,env);}catch(e){res=json({error:e.status?e.message:'Something went wrong. Please try again.'},e.status||500);if(!e.status)console.error('Request failed',e.name);}
 const headers=new Headers(res.headers);headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','strict-origin-when-cross-origin');headers.set('X-Frame-Options','SAMEORIGIN');headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');headers.set('Strict-Transport-Security','max-age=31536000');headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; frame-src 'self' blob: https://maps.google.com https://www.google.com; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self'");if(new URL(req.url).pathname.startsWith('/admin'))headers.set('Cache-Control','no-store');if(env.STAGING==='true')headers.set('X-Robots-Tag','noindex');return new Response(req.method==='HEAD'?null:res.body,{status:res.status,headers});}};
