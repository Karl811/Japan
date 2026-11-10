/* Increment VERSION when publishing a new app-shell release. Never clear learner storage. */
'use strict';
const VERSION='20261110-pwa-1';
const BASE=new URL(self.registration.scope);
const PREFIX='hp05-pwa-'+encodeURIComponent(BASE.pathname)+'-';
const CACHE=PREFIX+VERSION;
const RUNTIME_CACHE=PREFIX+'runtime';
const CORE=[
  'index.html','offline.html','pwa.js','pwa.css','manifest.webmanifest',
  'icons/app-192.png','icons/app-512.png','icons/maskable-512.png','icons/apple-touch-icon.png'
];
const GAME=['navigation.js','street-game.js','street-game.css','assets/street.webp'];
const absolute=file=>new URL(file,BASE).href;
self.addEventListener('install',event=>{
  // Game assets stay lazy: they are cached only after the learner chooses Game mode.
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE.map(file=>new Request(absolute(file),{cache:'reload'})))));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE&&key!==RUNTIME_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('message',event=>{
  if(event.data&&event.data.type==='ACTIVATE_UPDATE')event.waitUntil(self.skipWaiting());
  if(event.data&&event.data.type==='CACHE_OPENED_GAME'&&Array.isArray(event.data.urls)){
    const urls=event.data.urls.slice(0,4).filter(value=>{
      try{const url=new URL(value);return url.origin===BASE.origin&&url.pathname.startsWith(BASE.pathname)&&GAME.includes(url.pathname.slice(BASE.pathname.length));}catch(error){return false;}
    });
    event.waitUntil(caches.open(RUNTIME_CACHE).then(cache=>Promise.all(urls.map(async url=>{
      try{const response=await fetch(new Request(url,{cache:'force-cache'}));if(response.ok)await cache.put(url,response);}catch(error){}
    }))));
  }
});
function missing(isNavigation){
  if(isNavigation)return caches.open(CACHE).then(cache=>cache.match(absolute('offline.html'))).catch(()=>null).then(async response=>{
    if(response){const html=(await response.text()).replace('<head>','<head><base href="'+BASE.href+'">');return new Response(html,{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});}
    return new Response('Bạn đang mất mạng. Hãy kết nối lại để mở khóa học lần đầu.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  });
  return new Response('',{status:503,statusText:'Offline'});
}
function networkFirst(event,key,isNavigation){
  const update=fetch(event.request).then(async response=>{
    if(response.ok){try{const cache=await caches.open(CACHE);await cache.put(key,response.clone());}catch(error){}}
    return response;
  });
  event.waitUntil(update.then(()=>undefined).catch(()=>undefined));
  return (async()=>{
    const cached=await caches.open(CACHE).then(cache=>cache.match(key)).catch(()=>null);
    if(!cached)return update.catch(()=>missing(isNavigation));
    let timer;
    const quick=update.then(response=>response.ok?response:cached).catch(()=>cached);
    const fallback=new Promise(resolve=>{timer=setTimeout(()=>resolve(cached),2500);});
    return Promise.race([quick,fallback]).finally(()=>clearTimeout(timer));
  })();
}
function cachedAsset(event,key){
  const update=fetch(event.request).then(async response=>{
    if(response.ok){try{const cache=await caches.open(RUNTIME_CACHE);await cache.put(key,response.clone());const keys=await cache.keys();if(keys.length>32)await Promise.all(keys.slice(0,keys.length-32).map(old=>cache.delete(old)));}catch(error){}}
    return response;
  });
  event.waitUntil(update.then(()=>undefined).catch(()=>undefined));
  return caches.open(RUNTIME_CACHE).then(cache=>cache.match(key)).catch(()=>null).then(async cached=>{
    return cached||update.catch(()=>missing(false));
  });
}
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||request.headers.has('range'))return;
  const url=new URL(request.url);
  if(url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
  const relative=url.pathname.slice(BASE.pathname.length);
  if(relative==='sw.js')return;
  if(request.mode==='navigate'){
    const key=relative===''||relative==='index.html'?absolute('index.html'):url.href;
    event.respondWith(networkFirst(event,key,true));return;
  }
  if(CORE.includes(relative)){
    event.respondWith(networkFirst(event,absolute(relative),false));return;
  }
  if(GAME.includes(relative))event.respondWith(cachedAsset(event,url.href));
});
