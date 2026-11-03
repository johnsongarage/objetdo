// 항상 네트워크를 먼저 쓰고(배포 직후에도 옛 화면이 남지 않게), 끊겼을 때만 저장해 둔 사본으로 연다.
const CACHE = 'udigo-v1';
const CACHE_HOSTS = [self.location.host, 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', 'manifest.webmanifest', 'icon-192.png'])).catch(() => {}));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (!CACHE_HOSTS.includes(url.host) || /\.(gif|mp4|webm)$/.test(url.pathname)) return; // 움짤·영상은 브라우저에 맡긴다 (영상은 조각 요청이라 캐시에 넣으면 깨진다)
    event.respondWith(
        fetch(req)
            .then((res) => {
                if (res.ok || res.type === 'opaque') {
                    const copy = res.clone();
                    caches.open(CACHE).then((c) => c.put(req, copy));
                    return res;
                }
                // 404·서버 오류(사이트 주소가 바뀌거나 내려간 경우)여도 이미 받아 둔 앱은 열리게: 저장본이 있으면 그걸, 없으면 받은 응답 그대로
                return caches.match(req, { ignoreSearch: true })
                    .then((hit) => hit || (req.mode === 'navigate' ? caches.match('./') : null))
                    .then((hit) => hit || res);
            })
            .catch(() => caches.match(req, { ignoreSearch: true })
                .then((hit) => hit || (req.mode === 'navigate' ? caches.match('./') : Response.error())))
    );
});
