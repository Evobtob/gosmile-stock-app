const CACHE='gosmile-stock-v8-neodent-brand';
const ASSETS=['./','./index.html','./styles.css?v=neodent-brand','./app.js?v=neodent-brand','./manifest.json','./assets/icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))]))});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request)))});
