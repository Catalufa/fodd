import sanitizeHtml from 'sanitize-html';
export const pages = ['home','about','events','maps','nature','heritage','accessibility','photos','contact'];
export const escape = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeURL(value,media=false){
  if(typeof value!=='string'||value.length>2048) return '';
  if(/^\/(?!\/)[a-zA-Z0-9_/.%?=& ()-]*$/.test(value)&&!value.includes('\\')) return value;
  if(media) return '';
  try {const u=new URL(value);return ['https:','mailto:','tel:'].includes(u.protocol)?u.href:'';}catch{return '';}
}
export function rich(value){return sanitizeHtml(String(value||''),{allowedTags:['p','br','strong','b','em','i','a','ul','ol','li','h2','h3','blockquote'],allowedAttributes:{a:['href'],li:['data-list']},allowedSchemes:['https','mailto','tel'],allowProtocolRelative:false,transformTags:{a:(_,a)=>({tagName:'a',attribs:{href:safeURL(a.href)}})}}).replace(/<li data-list="bullet">/g,'<li>');}
const text=(v,max=1000)=>String(v??'').slice(0,max);
const choice=(v,options,def)=>options.includes(v)?v:def;
export function validatePage(input){
  if(!input||!Array.isArray(input.sections)||input.sections.length>100)throw new Error('A page needs up to 100 sections.');
  return {title:text(input.title,120),description:text(input.description,300),sections:input.sections.map(b=>{
    if(!b||!['text','image','button','event','map'].includes(b.type))throw new Error('Unknown section type.');
    const s=b.style||{};
    const out={type:b.type,title:text(b.title,150),html:rich(text(b.html,30000)),image:safeURL(b.image,true),alt:text(b.alt,400),caption:text(b.caption,700),url:safeURL(b.url),label:text(b.label,100),date:text(b.date,10),start:text(b.start,5),end:text(b.end,5),location:text(b.location,300),notes:text(b.notes,1000),hidden:!!b.hidden,style:{align:choice(s.align,['left','center','right'],'left'),size:choice(s.size,['normal','large'],'normal'),theme:choice(s.theme,['light','white','green'],'light'),weight:choice(s.weight,['normal','bold'],'normal'),space:choice(s.space,['compact','normal','generous'],'normal'),width:choice(s.width,['normal','wide','narrow'],'normal'),radius:choice(s.radius,['soft','round','square'],'soft'),position:choice(s.position,['center','top','bottom','left','right'],'center'),fit:choice(s.fit,['contain','cover'],'contain'),imageSize:choice(s.imageSize,['small','medium','large'],'large'),button:choice(s.button,['solid','outline'],'solid')}};
    if(b.type==='event'&&(!/^\d{4}-\d{2}-\d{2}$/.test(out.date)||Number.isNaN(Date.parse(out.date))||['start','end'].some(k=>out[k]&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(out[k]))))throw new Error('Enter a valid event date and time.');
    return out;
  })};
}
export function block(b,index){
 const s=b.style||{};const classes=Object.entries(s).map(([k,v])=>`${k}-${v}`).join(' ');
 const img=b.image?`<figure><img src="${escape(b.image)}" alt="${escape(b.alt)}" loading="lazy" decoding="async">${b.caption?`<figcaption>${escape(b.caption)}</figcaption>`:''}</figure>`:'';
 const link=b.url?`<a class="button ${s.button==='outline'?'outline':''}" href="${escape(b.url)}">${escape(b.label||'Read more')}</a>`:'';
 const heading=b.title?`<h2>${escape(b.title)}</h2>`:'';
 let body=heading+b.html;
 if(b.type==='image')body=img+heading+b.html;
 if(b.type==='button')body=heading+b.html+link;
 if(b.type==='event')body=img+heading+`<p class="event-date"><time datetime="${escape(b.date)}">${new Date(b.date+'T12:00:00Z').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Europe/London'})}</time>${b.start?' · '+escape(b.start)+(b.end?'–'+escape(b.end):''):''}</p><p>${escape(b.location)}</p>`+b.html+(b.notes?`<p>${escape(b.notes)}</p>`:'')+link;
 if(b.type==='map')body=heading+b.html+`<iframe title="Denton Dene location on Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=Denton%20Dene%20Newcastle%20upon%20Tyne&amp;output=embed"></iframe>`+link;
 return `<section class="content-block block-${b.type} ${classes}" data-block="${index}">${body}</section>`;
}
export function renderPage(page,slug,staging=false){
 const data=validatePage({...page,...(typeof page.content==='string'?JSON.parse(page.content):{})});
 const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const visible=data.sections.map((b,i)=>({b,i})).filter(({b})=>!b.hidden);
 const past=visible.filter(({b})=>b.type==='event'&&b.date<date),current=visible.filter(({b})=>b.type!=='event'||b.date>=date);
 const hero=slug==='home'?current.find(({b})=>b.type==='image'):null;
 let body=current.filter(item=>item!==hero).map(({b,i})=>block(b,i)).join('');
 if(past.length)body+=`<h2 class="past-title">Past events</h2>${past.map(({b,i})=>block(b,i)).join('')}`;
 if(slug==='home')body=`<div class="home-cover"><div class="home-brand"><img src="/assets/logo.png" alt="Friends of Denton Dene" width="250" height="250"><h1>${escape(data.title)}</h1></div>${hero?`<div class="polaroid position-${hero.b.style.position}"><img src="${escape(hero.b.image)}" alt="${escape(hero.b.alt)}" width="450" height="540">${hero.b.caption?`<p>${escape(hero.b.caption)}</p>`:''}</div>`:''}<div class="home-copy">${body}</div></div>`;
 else body=`<header class="page-title"><img src="/assets/logo.png" alt="" width="110" height="110"><h1>${escape(data.title)}</h1></header><div class="page-content ${slug==='photos'?'gallery':''}">${body}</div>`;
 return shell(data.title,`<main id="main">${body}</main>`,slug,data.description,staging||data.sections.some(b=>/Lorem ipsum/i.test(b.html)));
}
export function shell(title,body,slug='',description='',noindex=false){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} | Friends of Denton Dene</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="https://friendsofdentondene.org${slug==='home'?'':'/'+slug}">${noindex?'<meta name="robots" content="noindex,follow">':''}<link rel="stylesheet" href="/style.css"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Pacifico&display=swap" rel="stylesheet"><script defer src="/site.js"></script></head><body><a class="skip" href="#main">Skip to content</a><header class="site-header"><a class="brand" href="/">Friends of Denton Dene</a><button class="menu" aria-expanded="false" aria-controls="navigation">Menu</button><nav id="navigation" aria-label="Main navigation">${pages.map(p=>`<a ${p===slug?'aria-current="page"':''} href="${p==='home'?'/':'/'+p}">${p[0].toUpperCase()+p.slice(1)}</a>`).join('')}</nav></header>${body}<footer><p class="tagline">Denton Dene... a piece of the countryside in the city.</p><a class="button" href="https://www.facebook.com/dentondene/">See latest news here</a><p><a href="mailto:contact@friendsofdentondene.org">contact@friendsofdentondene.org</a> · <a href="/admin">Volunteer login</a></p></footer></body></html>`;}
