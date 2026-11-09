/* Offline support for "Капитан 40 БТ".
   On first visit the app itself is cached right away and the pictures follow in the background.
   Later visits open straight from the cache; a fresh copy is fetched in the background when online. */
const CACHE = 'kapitan40-v8';
const CORE = ["index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
const PICS = ["img/a567_0.webp", "img/a721_0.webp", "img/a721_1.webp", "img/a721_2.webp", "img/a721_3.webp", "img/q239.webp", "img/q240.webp", "img/q241.webp", "img/q242.webp", "img/q243.webp", "img/q244.webp", "img/q260.webp", "img/q261.webp", "img/q262.webp", "img/q268.webp", "img/q269.webp", "img/q270.webp", "img/q271.webp", "img/q274.webp", "img/q275.webp", "img/q276.webp", "img/q278.webp", "img/q279.webp", "img/q281.webp", "img/q282.webp", "img/q283.webp", "img/q285.webp", "img/q286.webp", "img/q287.webp", "img/q288.webp", "img/q289.webp", "img/q290.webp", "img/q291.webp", "img/q292.webp", "img/q293.webp", "img/q294.webp", "img/q295.webp", "img/q296.webp", "img/q297.webp", "img/q298.webp", "img/q299.webp", "img/q300.webp", "img/q301.webp", "img/q302.webp", "img/q303.webp", "img/q304.webp", "img/q305.webp", "img/q306.webp", "img/q307.webp", "img/q308.webp", "img/q309.webp", "img/q310.webp", "img/q311.webp", "img/q314.webp", "img/q317.webp", "img/q318.webp", "img/q319.webp", "img/q320.webp", "img/q324.webp", "img/q325.webp", "img/q326.webp", "img/q327.webp", "img/q328.webp", "img/q329.webp", "img/q330.webp", "img/q331.webp", "img/q332.webp", "img/q333.webp", "img/q334.webp", "img/q335.webp", "img/q336.webp", "img/q337.webp", "img/q338.webp", "img/q339.webp", "img/q340.webp", "img/q345.webp", "img/q346.webp", "img/q347.webp", "img/q348.webp", "img/q349.webp", "img/q350.webp", "img/q351.webp", "img/q352.webp", "img/q353.webp", "img/q354.webp", "img/q355.webp", "img/q356.webp", "img/q357.webp", "img/q358.webp", "img/q359.webp", "img/q360.webp", "img/q361.webp", "img/q362.webp", "img/q376.webp", "img/q377.webp", "img/q378.webp", "img/q379.webp", "img/q380.webp", "img/q381.webp", "img/q382.webp", "img/q383.webp", "img/q388.webp", "img/q389.webp", "img/q390.webp", "img/q391.webp", "img/q392.webp", "img/q393.webp", "img/q394.webp", "img/q395.webp", "img/q396.webp", "img/q406.webp", "img/q407.webp", "img/q408.webp", "img/q460.webp", "img/q461.webp", "img/q462.webp", "img/q463.webp", "img/q464.webp", "img/q465.webp", "img/q466.webp", "img/q469.webp", "img/q488.webp", "img/q491.webp", "img/q499.webp", "img/q500.webp", "img/q520.webp", "img/q521.webp", "img/q522.webp", "img/q523.webp", "img/q524.webp", "img/q525.webp", "img/q526.webp", "img/q527.webp", "img/q528.webp", "img/q529.webp", "img/q530.webp", "img/q531.webp", "img/q532.webp", "img/q533.webp", "img/q534.webp", "img/q535.webp", "img/q536.webp", "img/q537.webp", "img/q538.webp", "img/q539.webp", "img/q540.webp", "img/q541.webp", "img/q542.webp", "img/q544.webp", "img/q545.webp", "img/q546.webp", "img/q547.webp", "img/q548.webp", "img/q549.webp", "img/q550.webp", "img/q551.webp", "img/q552.webp", "img/q553.webp", "img/q554.webp", "img/q555.webp", "img/q556.webp", "img/q557.webp", "img/q558.webp", "img/q559.webp", "img/q560.webp", "img/q561.webp", "img/q562.webp", "img/q563.webp", "img/q564.webp", "img/q565.webp", "img/q566.webp", "img/q567.webp", "img/q568.webp", "img/q569.webp", "img/q570.webp", "img/q571.webp", "img/q572.webp", "img/q573.webp", "img/q581.webp", "img/q582.webp", "img/q583.webp", "img/q584.webp", "img/q586.webp", "img/q587.webp", "img/q588.webp", "img/q590.webp", "img/q674.webp", "img/q676.webp", "img/q679.webp", "img/q682.webp", "img/q705.webp", "img/q706.webp", "img/q707.webp", "img/q708.webp", "img/q709.webp", "img/q710.webp", "img/q711.webp", "img/q712.webp", "img/q713.webp", "img/q714.webp", "img/q715.webp", "img/q718.webp", "img/q720.webp", "img/q752.webp", "img/q753.webp", "img/q755.webp", "img/q756.webp", "img/q757.webp", "img/q758.webp", "img/q759.webp", "img/q760.webp", "img/q761.webp", "img/q762.webp", "img/q763.webp", "img/q764.webp", "img/q765.webp", "img/q766.webp", "img/q797.webp", "img/q798.webp", "img/q799.webp", "img/q800.webp", "img/q801.webp", "img/q802.webp", "img/q803.webp", "img/q804.webp", "img/q805.webp", "img/q806.webp", "img/q807.webp", "img/q808.webp", "img/q809.webp", "img/q810.webp", "img/q811.webp", "img/q812.webp", "img/q813.webp", "img/q814.webp", "img/q815.webp", "img/q816.webp", "img/q817.webp", "img/q818.webp", "img/q819.webp", "img/q820.webp", "img/q821.webp", "img/q822.webp", "img/q823.webp", "img/q824.webp", "img/q836.webp", "img/q837.webp", "img/q838.webp", "img/q839.webp", "img/q840.webp", "img/q841.webp", "img/q842.webp", "img/q843.webp", "img/q844.webp", "img/q845.webp", "img/q846.webp", "img/q847.webp", "img/q848.webp"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
    .then(() => caches.open(CACHE))
    .then(async c => {
      for (let i = 0; i < PICS.length; i += 12) {
        await Promise.all(PICS.slice(i, i + 12).map(async p => {
          if (await c.match(p)) return;
          try { const r = await fetch(p); if (r.ok) await c.put(p, r); } catch (err) {}
        }));
      }
    }));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const isPage = req.mode === 'navigate';
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(isPage ? 'index.html' : req, {ignoreSearch: true});
    const isPic = url.pathname.includes('/img/');
    if (hit && isPic) return hit;
    const fresh = fetch(req).then(r => {
      if (r && r.ok && (isPage || isPic || CORE.some(f => url.pathname.endsWith('/' + f)))) c.put(isPage ? 'index.html' : req, r.clone());
      return r;
    }).catch(() => null);
    if (hit) { e.waitUntil(fresh); return hit; }
    return (await fresh) || new Response('Offline', {status: 503, headers: {'Content-Type': 'text/plain'}});
  }));
});
