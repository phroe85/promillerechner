// Bei jedem Release BUILD und die Versionsparameter aller Assets gemeinsam erhöhen.
const BUILD=25;
const CACHE='promille01-v25-1';
const SHELL='./index.html';
const ASSETS=['./model.js?v=25','./app.js?v=25','./worker.js?v=25','./manifest.webmanifest?v=25','./icon-192.png','./icon-512.png'];
const assetURLs=new Set(ASSETS.map(p=>new URL(p,self.registration.scope).href));
async function htmlBuild(response){
  const html=await response.clone().text();
  const match=html.match(/<meta name="promille-build" content="(\d+)">/);
  return match ? Number(match[1]) : 0;
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  const response=await fetch(new Request(new URL(SHELL,self.registration.scope),{cache:'reload'}));
  if(!response.ok || await htmlBuild(response)!==BUILD) throw new Error('Release noch nicht vollständig verfügbar');
  for(const p of ASSETS){
    const req=new Request(new URL(p,self.registration.scope),{cache:'reload'}),res=await fetch(req);
    if(!res.ok)throw new Error('Asset nicht verfügbar');
    if(p.includes('.js?')){const code=await res.clone().text();let token=p.includes('model.js')?'BUILD=25':p.includes('app.js')?'PROMILLE_APP_BUILD=25':'PROMILLE_WORKER_BUILD=25';if(!code.includes(token))throw new Error('Asset-Version nicht vollständig verfügbar');}
    if(p.includes('manifest.') && !(await res.clone().json()).name.includes('2.5'))throw new Error('Manifest-Version nicht vollständig verfügbar');
    await cache.put(req,res);
  }
  await cache.put(SHELL,response);
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const k of await caches.keys()) if(k.startsWith('promille01-') && k!==CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET' || !req.url.startsWith(self.registration.scope)) return;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const fresh=await fetch(req,{cache:'no-store'});
        if(fresh.ok && await htmlBuild(fresh)>=BUILD) return fresh;
        // Kein Downgrade durch einen alten CDN-Stand; nutze den vollständig installierten Release.
      }catch{}
      return (await cache.match(SHELL)) || Response.error();
    })());
  }else if(assetURLs.has(req.url)){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      return (await cache.match(req)) || fetch(req,{cache:'no-store'});
    })());
  }else{
    // Neue Release-Assets niemals aus einem alten Cache laden.
    event.respondWith(fetch(req,{cache:'no-store'}));
  }
});
