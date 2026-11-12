// 항상 네트워크를 먼저 쓰고(배포 직후에도 옛 화면이 남지 않게), 끊겼을 때만 저장해 둔 사본으로 연다.
// 11/10: 기본 주소(./)는 새 화면(v2/)으로 넘기는 얇은 페이지가 됐다 → 새 화면 파일을 처음부터 받아 두고(끊긴 채 열어도 새 화면이 열리게),
//        끊겼을 때 사본이 없으면 '인터넷 연결' 안내를 보여 준다 (기본 주소 ↔ 새 화면이 서로 넘기다 빙빙 돌지 않게). 예전 화면은 v1.html
const CACHE = 'objetdo-v2';
const CACHE_HOSTS = [self.location.host, 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'];
const CORE = ['./', 'v2/', 'v2/app.css', 'v2/app.js', 'v2/domain.js', 'v2/find.js', 'v2/zone.js', 'v2/make.js', 'v2/inbox.js', 'v2/check.js', 'v2/print.js', 'v2/settings.js', 'manifest.webmanifest', 'icon-192.png'];

self.addEventListener('install', (event) => {
    // 하나가 실패해도 나머지는 받아 둔다 (addAll은 하나만 실패해도 전부 버린다)
    event.waitUntil(caches.open(CACHE).then((c) => Promise.all(CORE.map((u) => c.add(u).catch(() => {})))));
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            // 지우는 건 오브젯도 자기 옛 캐시만 (11/12 보안 점검: 같은 주소의 다른 앱 — 공정 트래커 등 — 캐시까지 지워 그 앱의 오프라인이 깨졌다)
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && /^(objetdo|udigo)-/.test(k)).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// 화면(주소창) 요청의 대신할 사본: 새 화면 안이면 새 화면, 그 밖(기본 주소·예전 화면 등)은 기본 주소(→ 새 화면으로 넘긴다)
const navKey = (req) => (new URL(req.url).pathname.includes('/v2/') ? 'v2/' : './');
const offlinePage = () => new Response('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>오브젯도</title>'
    + '<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F5F1EA;color:#2B2723;font-family:-apple-system,sans-serif;text-align:center">'
    + '<p style="line-height:1.8">인터넷에 연결되면 열려요<br><a href="" style="color:inherit">다시 열기</a></p></body></html>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

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
                    .then((hit) => hit || (req.mode === 'navigate' ? caches.match(navKey(req), { ignoreSearch: true }) : null))
                    .then((hit) => hit || res);
            })
            .catch(() => caches.match(req, { ignoreSearch: true })
                .then((hit) => hit || (req.mode === 'navigate'
                    ? caches.match(navKey(req), { ignoreSearch: true }).then((h) => h || offlinePage())
                    : Response.error())))
    );
});
