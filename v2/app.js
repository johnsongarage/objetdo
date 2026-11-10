'use strict';
// ────────────────────────────────────────────────────────────
// 오브젯도 v2 — 공통 (저장소 · 검색 · 도구 · 화면 이동 · 사진 위 칸 · 누르기)
// 화면 파일(find.js·zone.js·…)은 SCREENS·ACT에 자기 것을 더한다. 화면은 #s-이름 섹션에 그린다 (screenEl)
// ────────────────────────────────────────────────────────────
const SCREENS = {};          // 이름 → (route) => 그리기. false를 돌려주면 다른 화면으로 넘긴 것
const ACT = {};              // data-act="이름" → (el, event)
const BEFORE_ROUTE = [];     // 화면을 바꾸기 직전에 부르는 것 (말로 찾기 멈추기 등)
const NODATA = new Set(['menu', 'intro']); // 지도가 없어도 열리는 화면
const AFTER_BOOT = [];       // 데이터를 다 불러온 뒤 한 번 (사용 통계 등)
function addCSS(css) { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }
// ────────────────────────────────────────────────────────────
// 저장소: v1과 같은 곳 (IndexedDB 'udigo' › 'kv' › 'savedSystemData', 옛 기기는 localStorage)
//   읽은 그대로 고쳐서 같은 모양으로 다시 쓴다 → v1과 v2를 오가도 데이터가 하나다
// ────────────────────────────────────────────────────────────
const PHOTO_DATA_KEY = 'savedSystemData';
const store = {
    db: null, cache: null, pending: Promise.resolve(), warned: false,
    tx(mode, fn) {
        return new Promise((resolve, reject) => {
            const t = this.db.transaction('kv', mode), req = fn(t.objectStore('kv'));
            t.oncomplete = () => resolve(req.result);
            t.onerror = t.onabort = () => reject(t.error);
        });
    },
    async init() { // v1 photoStore.init과 똑같이 (옛 localStorage 데이터가 있으면 IndexedDB로 옮긴다)
        try {
            this.db = await new Promise((resolve, reject) => {
                const r = indexedDB.open('udigo', 1);
                r.onupgradeneeded = () => r.result.createObjectStore('kv');
                r.onsuccess = () => resolve(r.result);
                r.onerror = () => reject(r.error);
            });
            let value = await this.tx('readonly', s => s.get(PHOTO_DATA_KEY));
            const legacy = ls(PHOTO_DATA_KEY);
            if (value == null && legacy != null) { await this.tx('readwrite', s => s.put(legacy, PHOTO_DATA_KEY)); value = legacy; }
            if (legacy != null) try { localStorage.removeItem(PHOTO_DATA_KEY); } catch (e) {}
            this.cache = value == null ? null : value;
        } catch (e) { this.db = null; }
    },
    write(value) {
        this.cache = value;
        lsSet('hasSavedPhotos', value && value !== '[]' ? '1' : '');
        this.pending = this.pending
            .then(() => this.tx('readwrite', s => s.put(value, PHOTO_DATA_KEY)))
            .catch(() => { if (this.warned) return; this.warned = true; alert('저장 공간이 부족해 마지막 변경을 저장하지 못했어요.\n이전 화면의 설정에서 백업 파일을 먼저 받아 두세요.'); });
    }
};
function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

// 예시: v1과 같은 표시(sessionStorage 'samplePreview' = '1' 매장 · 'organizer' 집)를 같이 쓴다. 예시를 보는 동안엔 아무것도 저장하지 않는다
let SAMPLE = null; try { SAMPLE = sessionStorage.getItem('samplePreview'); } catch (e) {}
//   설정 같은 '취향'(PREF_KEYS, feat_*)은 예시 중에도 진짜로 저장한다 (v1 safeStorage와 같은 규칙)
//   물건·기록 같은 '데이터'는 예시 중엔 메모리에만, 그중 MEM_ONLY는 진짜 값을 읽지도 않는다 (예시에 내 자리 미정이 섞이지 않게)
const PREF_KEYS = new Set(['zmSuggestOpen', 'voiceFallback', 'useMode', 'simpleView', 'stockMode', 'fontDelta', 'bubbleLevel', 'stockField', 'listViewMode', 'voiceUsed', 'tapAgainHint', 'foundWhySeen', 'stockIntroSeen', 'installBannerHiddenUntil', 'backupBannerHiddenUntil', 'iosRestoreHint', 'v2FontScale']);
const MEM_ONLY = new Set(['inboxItems', 'searchPickCounts', 'searchHistory', 'findLog', 'baseItems', 'isSampleData', 'usageStats', 'statsQueue', 'dataChangedAt', 'stockLog', 'stockCountedAt', 'starterDone']);
const isPref = (k) => PREF_KEYS.has(k) || String(k).startsWith('feat_');
const memKV = {};
function kvGet(k) { if (SAMPLE && !isPref(k)) return k in memKV ? memKV[k] : MEM_ONLY.has(k) ? null : ls(k); return ls(k); }
function kvSet(k, v) { if (SAMPLE && !isPref(k)) { memKV[k] = v == null ? null : String(v); return; } lsSet(k, v); }
function kvDel(k) { if (SAMPLE && !isPref(k)) { memKV[k] = null; return; } try { localStorage.removeItem(k); } catch (e) {} }
function readJSON(k, fb) { try { return JSON.parse(kvGet(k)) || fb; } catch (e) { return fb; } }

let photos = [], ready = false, storedSample = false;
const dims = new Map();
const vis = () => photos.filter(p => p && p.id !== 'dummy_root');
const photoById = (id) => vis().find(p => String(p.id) === String(id));
const isHome = () => SAMPLE ? SAMPLE === 'organizer' : document.documentElement.dataset.mode === 'home';

async function loadAll() {
    if (SAMPLE) {
        try {
            const r = await fetch(SAMPLE === 'organizer' ? 'sample-home.json' : 'sample-store.json');
            const j = await r.json();
            // 며칠 전 확인은 여는 순간 기준으로 (v1 sampleSystemData와 같다)
            photos = j.savedSystemData.map(p => ({ ...p, zones: p.zones.map(({ checkedDaysAgo, ...z }) => (checkedDaysAgo == null ? z : { ...z, checkedAt: Date.now() - checkedDaysAgo * 86400000 })) }));
            if (Array.isArray(j.baseItems)) memKV.baseItems = JSON.stringify(j.baseItems);
        } catch (e) {
            photos = []; SAMPLE = null; try { sessionStorage.removeItem('samplePreview'); } catch (x) {}
            setTimeout(() => toast('예시를 불러오지 못했어요 · 인터넷을 확인해 주세요'), 300);
        }
    }
    if (!SAMPLE) {
        await store.init();
        const raw = store.db ? store.cache : ls(PHOTO_DATA_KEY);
        try { photos = JSON.parse(raw) || []; } catch (e) { photos = []; }
        if (!Array.isArray(photos)) photos = [];
        storedSample = ls('isSampleData') === '1';
    }
    photos = photos.filter(p => p && Array.isArray(p.zones));
    photos.forEach(p => p.zones.forEach(z => { if (!Array.isArray(z.items)) z.items = []; }));
    // 칸 좌표는 가로 800 기준(v1 캔버스)이라 사진 원래 크기를 알아야 세로 비율을 맞출 수 있다
    await Promise.all(vis().map(measurePhoto));
}
function measurePhoto(p) { // 사진 원래 크기 (칸 좌표 세로 비율을 맞추려고)
    return new Promise(res => {
        const done = (w, h) => { dims.set(String(p.id), { w, h }); res(); };
        if (!p.imgData) return done(800, 450);
        const im = new Image(); im.onload = () => done(im.naturalWidth || 800, im.naturalHeight || 450); im.onerror = () => done(800, 450); im.src = p.imgData;
    });
}
// 자주 바뀌는 곳(재고 세기 등)은 잠깐 모았다가 한 번에 저장 — 사진까지 통째로 쓰니까. 화면을 바꾸거나 앱을 내리면 바로 저장
let saveTimer = 0;
function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(() => { saveTimer = 0; saveAll(); }, 700); }
function flushSave() { if (saveTimer) { clearTimeout(saveTimer); saveTimer = 0; saveAll(); } }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(); });
window.addEventListener('pagehide', flushSave);
function saveAll() {
    if (SAMPLE) return; // 예시는 메모리에서만
    const v = JSON.stringify(photos);
    if (store.db) store.write(v); else { try { localStorage.setItem(PHOTO_DATA_KEY, v); lsSet('hasSavedPhotos', '1'); } catch (e) { toast('저장 공간이 부족해 저장하지 못했어요'); } }
    lsSet('dataChangedAt', String(Date.now())); // v1 백업 안내 띠가 '바뀐 게 있다'를 알게
}

// ────────────────────────────────────────────────────────────
// 검색: v1과 같은 규칙 (부분·초성·같은 말·칸 이름·비슷한 종류·메모·사진 이름·오타)
// ────────────────────────────────────────────────────────────
function normalizeForSearch(str) { return (str || '').toLowerCase().replace(/\s+/g, ''); }
const CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
function isChosungChar(ch) { return ch >= 'ㄱ' && ch <= 'ㅎ'; }
function getChosung(ch) { const c = ch.charCodeAt(0) - 0xAC00; return (c >= 0 && c < 11172) ? CHOSUNG[Math.floor(c / 588)] : ch; }
function hasChosung(str) { return [...(str || '')].some(isChosungChar); }
function charMatches(qc, tc) { return qc === tc || (isChosungChar(qc) && getChosung(tc) === qc); }
function findMatchRange(text, query) {
    const q = normalizeForSearch(query);
    if (!q) return null;
    const src = String(text == null ? '' : text), chars = [];
    for (let i = 0; i < src.length; i++) { if (!/\s/.test(src[i])) chars.push({ ch: src[i].toLowerCase(), i }); }
    for (let s = 0; s + q.length <= chars.length; s++) {
        let ok = true;
        for (let k = 0; k < q.length; k++) { if (!charMatches(q[k], chars[s + k].ch)) { ok = false; break; } }
        if (ok) return [chars[s].i, chars[s + q.length - 1].i + 1];
    }
    return null;
}
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = [];
    for (let i = 0; i <= m; i++) dp.push(new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
}
function matchItemName(query, name) {
    const q = normalizeForSearch(query), n = normalizeForSearch(name);
    if (!q || !n) return null;
    if (findMatchRange(name, query)) return { type: hasChosung(q) ? 'chosung' : 'partial' };
    if (q.length <= 1 || hasChosung(q)) return null;
    const threshold = q.length <= 3 ? 1 : q.length <= 6 ? 2 : 3;
    const dist = levenshtein(q, n);
    if (dist <= threshold) return { type: 'fuzzy', distance: dist };
    return null;
}
function includesText(query, text) { return !!findMatchRange(text, query); }
function rankOf(field, type) {
    if (field === 'item' && type === 'partial') return 0;
    if (field === 'item' && type === 'chosung') return 0.3;
    if (field === 'item' && type === 'synonym') return 0.4;
    if (field === 'zone') return 0.5;
    if (field === 'kind') return 0.8;
    if (field === 'comment') return 1;
    if (field === 'title') return 2;
    return 3;
}
const SYNONYM_GROUPS = [
    ['휴지', '티슈', '화장지', '냅킨', '키친타올'], ['빨대', '스트로'], ['컵', '종이컵', '일회용컵', '테이크아웃컵', '플라스틱컵', '아이스컵', '핫컵'],
    ['뚜껑', '컵뚜껑', '리드'], ['컵홀더', '슬리브', '홀더'], ['캐리어', '컵캐리어', '테이크아웃캐리어'], ['봉투', '봉지', '비닐봉투', '비닐', '쇼핑백'],
    ['영수증', '영수증롤', '감열지', '포스용지', '롤지'], ['원두', '커피콩', '커피원두'], ['우유', '밀크'], ['설탕', '슈가', '스틱설탕'],
    ['물티슈', '웻티슈'], ['장갑', '고무장갑', '위생장갑', '니트릴장갑', '비닐장갑'], ['세제', '주방세제', '퐁퐁'], ['행주', '걸레', '타월'],
    ['테이프', '박스테이프', '스카치테이프'], ['건전지', '배터리'], ['랩', '비닐랩', '크린랩'], ['호일', '은박지', '쿠킹호일', '알루미늄호일'],
    ['수저', '숟가락', '스푼', '일회용수저'], ['젓가락', '나무젓가락'], ['포크', '일회용포크'], ['용기', '포장용기', '테이크아웃용기', '도시락용기'],
    ['쓰레기봉투', '종량제봉투'], ['시럽', '바닐라시럽']
];
function synonymsOf(query) {
    const q = normalizeForSearch(query); if (!q) return [];
    const out = new Set();
    SYNONYM_GROUPS.forEach(g => { if (g.some(t => normalizeForSearch(t) === q)) g.forEach(t => { if (normalizeForSearch(t) !== q) out.add(t); }); });
    return [...out];
}
const KIND_GROUPS = {
    '상비약': ['상비약', '구급', '구급함', '구급상자', '해열제', '감기약', '소화제', '진통제', '두통약', '타이레놀', '밴드', '반창고', '대일밴드', '연고', '후시딘', '소독약', '소독', '파스', '체온계', '붕대', '거즈', '멀미약', '영양제', '비타민', '알레르기약', '안약', '물파스'],
    '충전기·케이블': ['충전기', '충전선', '충전케이블', '케이블', 'usb', 'c타입', '라이트닝', '어댑터', '보조배터리', '이어폰', '에어팟', '충전'],
    '문구': ['문구', '볼펜', '펜', '연필', '샤프', '지우개', '가위', '풀', '메모지', '포스트잇', '스테이플러', '호치키스', '클립', '자', '칼', '커터칼', '네임펜', '사인펜', '형광펜'],
    '공구': ['공구', '드라이버', '망치', '줄자', '나사', '못', '펜치', '렌치', '스패너', '육각렌치', '전동드릴', '실리콘'],
    '전기·전구': ['건전지', '배터리', '전구', '형광등', '멀티탭', '콘센트', '연장선', '리모컨'],
    '침구': ['침구', '이불', '담요', '베개', '베개커버', '이불커버', '패드', '토퍼', '전기장판', '온수매트', '쿨매트', '여름이불', '겨울이불'],
    '여행': ['여행', '여권', '항공권', '캐리어', '여행용', '목베개', '여행파우치', '국제운전면허증', '돼지코', '멀티어댑터', '캐리어이름표'],
    '서류': ['서류', '보증서', '설명서', '계약서', '영수증', '등본', '통장', '증명서', '보험증권', '매뉴얼'],
    '청소·세탁': ['청소', '세제', '세탁세제', '섬유유연제', '락스', '수세미', '걸레', '청소포', '물걸레', '고무장갑', '얼룩제거제', '표백제', '청소솔'],
    '주방 소모품': ['랩', '호일', '쿠킹호일', '지퍼백', '위생장갑', '위생백', '키친타월', '종이컵', '일회용', '일회용수저', '빨대', '밀폐용기', '도시락통'],
    '계절 용품': ['선풍기', '서큘레이터', '히터', '가습기', '가습기필터', '제습기', '핫팩', '손난로', '공기청정기필터', '필터', '모기향', '모기약'],
    '욕실 용품': ['욕실', '칫솔', '치약', '샴푸', '린스', '컨디셔너', '바디워시', '비누', '면도기', '면도날', '수건', '샤워볼'],
    '옷 소품': ['양말', '속옷', '스타킹', '장갑', '목도리', '모자', '벨트', '넥타이', '스카프', '마스크'],
    '아이 용품': ['장난감', '크레파스', '색연필', '스케치북', '스티커', '물감', '클레이', '블록', '기저귀', '유아'],
    '미용': ['화장품', '빗', '드라이기', '고데기', '손톱깎이', '면봉', '귀이개', '헤어밴드', '머리끈', '선크림'],
    '수영·운동': ['수영복', '래시가드', '물안경', '수영모', '운동복', '요가매트', '아령', '줄넘기'],
    '캠핑·나들이': ['캠핑', '돗자리', '캠핑담요', '텐트', '랜턴', '아이스박스', '보냉백', '버너']
};
function kindsOf(query) {
    const q = normalizeForSearch(query); if (q.length < 2) return [];
    return Object.keys(KIND_GROUPS).filter(k => KIND_GROUPS[k].some(t => { const n = normalizeForSearch(t); return n.length >= 2 && (q.includes(n) || n.startsWith(q)); }));
}
function kindHit(kind, text) { const n = normalizeForSearch(text); return !!n && KIND_GROUPS[kind].some(t => { const m = normalizeForSearch(t); return m.length >= 2 && n.includes(m); }); }
function findSearchMatches(query) {
    const matches = [], syn = synonymsOf(query), kinds = kindsOf(query);
    vis().forEach(data => {
        data.zones.forEach((z, idx) => {
            let best = null;
            z.items.forEach(it => {
                const m = matchItemName(query, it.name);
                if (m && (!best || rankOf('item', m.type) < rankOf(best.field, best.type) || (m.type === best.type && (m.distance || 0) < (best.distance || 0)))) best = { field: 'item', type: m.type, distance: m.distance || 0, item: it };
                if ((!best || rankOf('comment') < rankOf(best.field, best.type)) && it.comment && includesText(query, it.comment)) best = { field: 'comment', type: 'partial', distance: 0, item: it };
            });
            if (syn.length && (!best || rankOf(best.field, best.type) > rankOf('item', 'synonym'))) {
                const hit = z.items.find(it => syn.some(t => includesText(t, it.name)));
                if (hit) best = { field: 'item', type: 'synonym', distance: 0, item: hit };
            }
            if ((!best || rankOf('zone') < rankOf(best.field, best.type)) && includesText(query, z.name)) best = { field: 'zone', type: 'partial', distance: 0, item: null };
            if (!best && includesText(query, data.title)) best = { field: 'title', type: 'partial', distance: 0, item: null };
            if (kinds.length && (!best || rankOf(best.field, best.type) > rankOf('kind'))) {
                for (const k of kinds) {
                    if (kindHit(k, z.name)) { best = { field: 'kind', type: 'kind', kind: k, distance: 0, item: null }; break; }
                    const hit = z.items.find(it => kindHit(k, it.name)); if (hit) { best = { field: 'kind', type: 'kind', kind: k, distance: 0, item: hit }; break; }
                }
            }
            if (best) matches.push({ data, zone: z, index: idx, ...best });
        });
    });
    matches.sort((a, b) => (rankOf(a.field, a.type) - rankOf(b.field, b.type)) || (a.distance - b.distance));
    return matches;
}
function whyOf(m, q) { // 정확히 이름으로 찾은 게 아니면 왜 이 칸인지 한 줄로
    if (!m) return '';
    if (m.type === 'synonym') return `‘${q}’와 같은 말로 찾았어요`;
    if (m.type === 'fuzzy') return `‘${q}’와 비슷한 이름이에요`;
    if (m.field === 'kind') return `비슷한 종류(${m.kind})가 있는 칸이에요`;
    if (m.field === 'comment') return `메모에 ‘${q}’가 있어요`;
    if (m.field === 'zone') return `칸 이름에 ‘${q}’가 있어요`;
    if (m.field === 'title') return `사진 이름에 ‘${q}’가 있어요`;
    return '';
}
const TAG = { synonym: '같은 말', fuzzy: '비슷한 이름', kind: '비슷한 종류', comment: '메모', zone: '칸 이름', title: '사진 이름' };
const tagOf = (m) => TAG[m.type] || TAG[m.field] || '';

// ────────────────────────────────────────────────────────────
// 작은 도구
// ────────────────────────────────────────────────────────────
const $ = (s, el = document) => el.querySelector(s);
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function highlight(text, query) {
    const t = String(text == null ? '' : text), r = query ? findMatchRange(t, query) : null;
    if (!r) return esc(t);
    return esc(t.slice(0, r[0])) + '<mark>' + esc(t.slice(r[0], r[1])) + '</mark>' + esc(t.slice(r[1]));
}
function josa(word, withBatchim, withoutBatchim) {
    const w = String(word || ''), code = w.charCodeAt(w.length - 1) - 0xAC00;
    if (code < 0 || code > 11171) return `${w}${withBatchim}(${withoutBatchim})`;
    const jong = code % 28;
    const useFirst = withBatchim === '으로' ? (jong !== 0 && jong !== 8) : jong !== 0;
    return w + (useFirst ? withBatchim : withoutBatchim);
}
const STALE_DAYS = 30;
const isStale = (z) => !!z.checkedAt && Date.now() - z.checkedAt > STALE_DAYS * 86400000; // v1 isZoneStale과 같다
function agoText(ts) {
    if (!ts) return '기록 없음';
    const d = Math.floor((Date.now() - ts) / 86400000);
    return d <= 0 ? '오늘' : d === 1 ? '어제' : `${d}일 전`;
}
const zoneName = (z, i) => (z && z.name) || `${i + 1}번 구역`;
const itemsSorted = (z) => [...z.items].sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0)); // 즐겨찾기(★)는 맨 앞 (v1과 같다)
function zoneSummary(z) { const n = itemsSorted(z); return n.length ? n[0].name + (n.length > 1 ? ` 외 ${n.length - 1}` : '') : '비어 있음'; }
function allItemNames() { return [...new Set(vis().flatMap(p => p.zones.flatMap(z => z.items.map(i => i.name))))].filter(Boolean); }
let exSeed = Math.floor(Math.random() * 1e9);
function exampleNames(n) { // 짧은 물건 이름 몇 개 (한 번 연 동안은 같게)
    const h = (s) => { let x = exSeed; for (const c of s) x = Math.imul(x ^ c.charCodeAt(0), 2654435761) >>> 0; return x; };
    return allItemNames().filter(x => x.length <= 6 && !/[()]/.test(x)).sort((a, b) => h(a) - h(b)).slice(0, n);
}
const chosungOf = (s) => [...String(s)].filter(c => c.trim()).slice(0, 3).map(getChosung).join('');

const ICON = {
    back: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 5 8 12 15 19"></polyline></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><line x1="16.5" y1="16.5" x2="21" y2="21"></line></svg>',
    mic: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0"></path><line x1="12" y1="18" x2="12" y2="21"></line></svg>'
};
const backBtn = (label, fb) => `<button type="button" class="back" data-act="back" data-fb="${esc(fb)}">${ICON.back}${esc(label)}</button>`;
const V1 = (go, extra) => '../' + (go ? `#go=${go}${extra ? '&' + extra : ''}` : ''); // 아직 v2에 없는 화면은 v1(이전 화면)에서 연다
const EXT = '<span class="ext" aria-hidden="true">↗</span><span class="sr">(이전 화면에서 열려요)</span>';

let toastTimer = 0, toastUndo = null;
function toast(msg, undo) {
    const t = $('#toast');
    t.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button type="button" data-act="undo">되돌리기</button>' : ''}`;
    t.hidden = false; toastUndo = undo || null;
    clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, undo ? 6500 : 2600);
}
function hideToast() { $('#toast').hidden = true; toastUndo = null; }

// 이 폰에서 찾은 기록 (v1과 같은 곳: 자주 찾는 물건·최근 검색어·날짜별 횟수). 예시를 보는 동안엔 메모리에만
function recordPick(query, name) {
    const q = (query || '').trim();
    if (q) { const h = readJSON('searchHistory', []).filter(x => x !== q); h.unshift(q); kvSet('searchHistory', JSON.stringify(h.slice(0, 5))); }
    if (name) {
        const p = readJSON('searchPickCounts', {}); p[name] = (p[name] || 0) + 1;
        kvSet('searchPickCounts', JSON.stringify(Object.fromEntries(Object.entries(p).sort((a, b) => b[1] - a[1]).slice(0, 50))));
    }
    if (typeof recordFind === 'function') recordFind(); // v1 사용 통계(찾은 횟수)와 같은 곳
    const t = new Date(), k = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    let log = readJSON('findLog', {}); log[k] = (log[k] || 0) + 1;
    log = Object.fromEntries(Object.keys(log).sort().slice(-14).map(d => [d, log[d]]));
    kvSet('findLog', JSON.stringify(log));
}
function frequentNames() {
    const have = new Set(allItemNames());
    const picks = Object.entries(readJSON('searchPickCounts', {})).filter(([n]) => have.has(n)).sort((a, b) => b[1] - a[1]).map(([n]) => n);
    const pinned = vis().flatMap(p => p.zones.flatMap(z => z.items.filter(i => i.pin).map(i => i.name)));
    return [...new Set([...picks, ...pinned])].slice(0, 4);
}
const inboxItems = () => readJSON('inboxItems', []).filter(x => x && x.name);

// ────────────────────────────────────────────────────────────
// 화면 이동: 주소 # 뒤에 화면을 적는다 (뒤로 가기가 그대로 된다)
//   #/  찾기 · #/voice · #/r/사진/칸?q=&item=&from= · #/map/사진 · #/list · #/move/사진/칸?item= · #/menu · #/intro
// ────────────────────────────────────────────────────────────
function parseRoute() {
    const h = location.hash.replace(/^#\/?/, ''), i = h.indexOf('?');
    const path = i < 0 ? h : h.slice(0, i), parts = path.split('/').filter(Boolean).map(s => { try { return decodeURIComponent(s); } catch (e) { return s; } });
    return { name: parts[0] || '', a: parts[1], b: parts[2], q: new URLSearchParams(i < 0 ? '' : h.slice(i + 1)) };
}
const depth = () => (history.state && history.state.v2) || 0;
function nav(hash, replace) {
    scrollMem.set(location.hash, window.scrollY);
    if (replace) history.replaceState({ v2: depth() }, '', hash); else history.pushState({ v2: depth() + 1 }, '', hash);
    route(true);
}
function goBack(fallback) { if (depth() > 0) history.back(); else nav(fallback || '#/', true); }
let wantHome = false, wantHash = null;
function backThen(hash) { // 한 칸 뒤로 간 다음 그 자리를 hash로 바꾼다 (옮긴 뒤 '뒤로'를 누르면 옛 결과가 또 나오지 않게)
    if (depth() > 0) { wantHash = hash; history.back(); } else nav(hash, true);
}
function goHome() { // 기록을 쌓지 않고 처음(찾기)으로
    const q = $('#q'); if (q) q.value = '';
    const d = depth(); if (d > 0) { wantHome = true; history.go(-d); } else nav('#/', true);
}
function resultHash(pid, zi, q, item, from) {
    const u = new URLSearchParams(); if (q) u.set('q', q); if (item) u.set('item', item); if (from) u.set('from', from);
    return `#/r/${encodeURIComponent(pid)}/${zi}${u.toString() ? '?' + u : ''}`;
}
const scrollMem = new Map();
let lastKey = null, popped = false, cur = null;
window.addEventListener('popstate', () => { popped = true; route(); });
window.addEventListener('hashchange', () => route());
function route(force) {
    if (!ready) return;
    const key = location.hash || '#/';
    if (!force && key === lastKey) return;
    if (lastKey && !force) scrollMem.set(lastKey, window.scrollY);
    lastKey = key;
    const r = parseRoute();
    if (wantHome) { wantHome = false; if (r.name && r.name !== 'home') { nav('#/', true); return; } }
    if (wantHash) { const h = wantHash; wantHash = null; nav(h, true); return; }
    let name = r.name || 'home';
    flushSave();
    BEFORE_ROUTE.forEach(f => f(name));
    if (!vis().length && !NODATA.has(name)) name = 'intro'; // 지도가 없으면 첫 소개 (만들기·설정 같은 화면은 그대로)
    if (!SCREENS[name]) name = 'home';
    if (SCREENS[name](r) === false) return; // 다른 화면으로 넘겼다
    show(name);
    const y = popped ? scrollMem.get(key) : 0; popped = false;
    window.scrollTo(0, y || 0);
}
function show(name) {
    $('#boot').hidden = true;
    screenEl(name);
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === 's-' + name));
    cur = name;
}
function screenEl(name) { // 화면마다 <section id="s-이름"> 하나 (없으면 만든다)
    let el = document.getElementById('s-' + name);
    if (!el) { el = document.createElement('section'); el.className = 'screen'; el.id = 's-' + name; document.querySelector('.app').appendChild(el); }
    return el;
}

// ────────────────────────────────────────────────────────────
// 사진 위 칸 (좌표는 가로 800 기준 — v1 캔버스와 같다)
// ────────────────────────────────────────────────────────────
function dimOf(p) { return dims.get(String(p.id)) || { w: 800, h: 450 }; }
function h800(p) { const d = dimOf(p); return d.h * 800 / d.w; }
function zoneBox(p, z) {
    const H = h800(p), cl = (v) => Math.max(0, Math.min(100, v));
    const l = cl(z.x / 8), t = cl(z.y / H * 100);
    return { l, t, w: Math.max(0, Math.min(100 - l, z.w / 8)), h: Math.max(0, Math.min(100 - t, z.h / H * 100)) };
}
function zoomFor(p, z) { // 칸이 작으면 그 칸을 화면 가운데로 크게 (사진 밖이 보이지 않게)
    const H = h800(p), s = Math.max(1, Math.min(3, Math.min(0.62 * 800 / Math.max(z.w, 1), 0.62 * H / Math.max(z.h, 1))));
    const cx = (z.x + z.w / 2) / 800, cy = (z.y + z.h / 2) / H;
    return { s, tx: Math.max(1 - s, Math.min(0, 0.5 - cx * s)) * 100, ty: Math.max(1 - s, Math.min(0, 0.5 - cy * s)) * 100 };
}
function photoHTML(p, o = {}) {
    const ar = 800 / h800(p);
    const order = p.zones.map((z, i) => i).sort((a, b) => p.zones[b].w * p.zones[b].h - p.zones[a].w * p.zones[a].h); // 큰 칸 먼저 그려 작은 칸이 위에 (눌리게)
    const zones = order.map(i => {
        const z = p.zones[i], b = zoneBox(p, z), cls = ['zn'];
        let tag = '';
        if (o.hit != null) cls.push(i === o.hit ? 'hit' : 'dim');
        if (o.from === i) { cls.push('from'); tag = '원래 기록'; }
        if (o.sel === i) { cls.push('sel'); tag = '여기로'; }
        if (o.stale && isStale(z) && !tag) tag = '점검';
        const lab = `${i + 1}번 구역 · ${zoneSummary(z)}`;
        const attrs = o.tap ? `type="button" data-act="${o.tap}" data-p="${esc(p.id)}" data-z="${i}" aria-label="${esc(lab)}"` : 'aria-hidden="true"';
        const el = o.tap ? 'button' : 'span';
        return `<${el} ${attrs} class="${cls.join(' ')}" style="left:${b.l}%;top:${b.t}%;width:${b.w}%;height:${b.h}%"><b>${i + 1}</b>${tag ? `<i>${tag}</i>` : ''}</${el}>`;
    }).join('');
    const zm = o.zoom;
    const st = zm ? `transform:translate(${zm.tx}%,${zm.ty}%) scale(${zm.s});--k:${1 / zm.s}` : '';
    return `<div class="ph" style="--ar:${ar}"><div class="ph-in" style="${st}">${p.imgData ? `<img src="${esc(p.imgData)}" alt="${esc(p.title || '사진')}">` : ''}${zones}</div></div>`;
}
// 칸 위치를 말로: 이름이 '3구역'·'A구역'처럼 자동으로 붙은 칸은 이름만으로는 어디인지 모르니 사진 속 위치로 (위 줄 왼쪽 …)
const autoZoneName = (n) => !n || /^([A-Z]|\d+)구역$|^수동구역_/.test(n);
function posWords(p, z) {
    const cx = (z.x + z.w / 2) / 800, cy = (z.y + z.h / 2) / h800(p);
    const col = cx < 0.36 ? '왼쪽' : cx > 0.64 ? '오른쪽' : '가운데', row = cy < 0.36 ? '위' : cy > 0.64 ? '아래' : '가운데';
    if (row === '가운데' && col === '가운데') return '사진 한가운데';
    return `${row} 줄 ${col}`;
}
// 손가락 두 개로 벌려 크게 · 크게 본 채로 한 손가락으로 옮기기 (사진 틀은 그대로, 안쪽만 움직인다). st = { s, tx, ty } (tx·ty는 %)
function attachPinch(ph, inn, st, onChange) {
    if (!ph || !inn) return null;
    const pts = new Map(); let g0 = null;
    const frac = (e) => { const r = ph.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; };
    const clampT = () => { st.tx = Math.max((1 - st.s) * 100, Math.min(0, st.tx)); st.ty = Math.max((1 - st.s) * 100, Math.min(0, st.ty)); };
    const apply = () => {
        inn.style.transform = st.s > 1.001 ? `translate(${st.tx}%,${st.ty}%) scale(${st.s})` : '';
        inn.style.setProperty('--k', String(1 / st.s));
        ph.style.touchAction = st.s > 1.001 ? 'none' : 'pan-y'; // 크게 볼 땐 한 손가락이 사진을 옮기고, 아니면 화면을 내린다
        if (onChange) onChange();
    };
    const begin = () => {
        const a = [...pts.values()];
        if (a.length === 2) g0 = { kind: 'pinch', d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 0.01, m: { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 }, s: st.s, tx: st.tx, ty: st.ty };
        else if (a.length === 1 && st.s > 1.001) g0 = { kind: 'pan', m: a[0], tx: st.tx, ty: st.ty };
        else g0 = null;
        inn.style.transition = g0 ? 'none' : '';
    };
    ph.style.touchAction = st.s > 1.001 ? 'none' : 'pan-y';
    ph.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; pts.set(e.pointerId, frac(e)); begin(); });
    ph.addEventListener('pointermove', (e) => {
        if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, frac(e)); if (!g0) return;
        const a = [...pts.values()];
        if (g0.kind === 'pinch' && a.length === 2) {
            const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), m = { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 };
            const s = Math.max(1, Math.min(4, g0.s * d / g0.d)), vx = (g0.m.x - g0.tx / 100) / g0.s, vy = (g0.m.y - g0.ty / 100) / g0.s;
            st.s = s; st.tx = (m.x - vx * s) * 100; st.ty = (m.y - vy * s) * 100; clampT(); apply();
        } else if (g0.kind === 'pan' && a.length === 1) { st.tx = g0.tx + (a[0].x - g0.m.x) * 100; st.ty = g0.ty + (a[0].y - g0.m.y) * 100; clampT(); apply(); }
    });
    const up = (e) => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); begin(); };
    ph.addEventListener('pointerup', up); ph.addEventListener('pointercancel', up);
    return { set(s, tx, ty) { st.s = s; st.tx = tx; st.ty = ty; clampT(); inn.style.transition = ''; apply(); } };
}
function photoTabs(curId, act) {
    if (vis().length < 2) return '';
    return `<div class="ptabs" role="tablist" aria-label="사진">${vis().map((p, i) => `<button type="button" role="tab" aria-selected="${String(p.id) === String(curId)}" data-act="${act}" data-p="${esc(p.id)}"><span>${i + 1}</span>${esc(p.title || '사진')}</button>`).join('')}</div>`;
}

// ────────────────────────────────────────────────────────────

// 🔑 입력칸에 키보드 '열쇠(비밀번호 자동 채우기)'가 뜨지 않게 — v1 noAutofill과 같은 표시 (v1은 11/6에 고침)
//   로그인 칸으로 오해하지 않도록 모든 글자 입력칸에 자동완성 끔 + 비밀번호 관리자(키체인·구글·1Password·LastPass·Bitwarden·Dashlane)가 읽는 '무시' 표시.
//   화면을 그릴 때마다 새로 생기는 칸(물건 메모·수량·이름 등)도 같이
const NO_FILL_TYPES = new Set(['', 'text', 'search', 'number', 'date', 'tel', 'url']);
function noAutofill(el) {
    if (!el || el.dataset.noFill || !NO_FILL_TYPES.has((el.getAttribute('type') || '').toLowerCase()) && el.tagName !== 'TEXTAREA') return;
    el.dataset.noFill = '1';
    el.setAttribute('autocomplete', 'off'); el.setAttribute('data-1p-ignore', ''); el.setAttribute('data-lpignore', 'true'); el.setAttribute('data-bwignore', ''); el.setAttribute('data-form-type', 'other');
    if (el.getAttribute('type') !== 'number' && el.getAttribute('type') !== 'date') { el.setAttribute('autocapitalize', 'off'); el.setAttribute('autocorrect', 'off'); }
}
function noAutofillAll(root) { (root || document).querySelectorAll('input, textarea').forEach(noAutofill); }
noAutofillAll();
try { new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType !== 1) return; if (n.matches && n.matches('input, textarea')) noAutofill(n); else if (n.querySelectorAll) noAutofillAll(n); }))).observe(document.body, { childList: true, subtree: true }); } catch (e) {}

// ────────────────────────────────────────────────────────────
// 아래에서 올라오는 창 (시트)
// ────────────────────────────────────────────────────────────
let sheetOnClose = null;
function openSheet(html, onClose) { // html = .sheet-card 안쪽
    const sh = $('#sheet');
    sh.innerHTML = `<div class="sheet-card" role="dialog" aria-modal="true">${html}</div>`;
    sh.hidden = false; sheetOnClose = onClose || null;
    setTimeout(() => { const b = sh.querySelector('input, .btn'); if (b) b.focus(); }, 30);
    return sh.firstElementChild;
}
function closeSheet() {
    const sh = $('#sheet'); if (sh.hidden) return;
    sh.hidden = true; sh.innerHTML = '';
    const f = sheetOnClose; sheetOnClose = null; if (f) f();
}

// ────────────────────────────────────────────────────────────
// 누르기: 버튼마다 data-act 하나로
// ────────────────────────────────────────────────────────────
Object.assign(ACT, {
    back: (el) => goBack(el.dataset.fb),
    go: (el) => nav(el.dataset.to),
    home: () => goHome(),
    sheetClose: () => closeSheet(),
    undo: () => { const f = toastUndo; hideToast(); if (f) f(); }
});
document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-v1]');
    if (a && !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey) { // 이전 화면으로 가기 전에 쓰던 저장을 끝낸다
        e.preventDefault(); const href = a.href;
        Promise.resolve(store.pending).catch(() => {}).then(() => { location.href = href; });
        return;
    }
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const f = ACT[el.dataset.act]; if (!f) return;
    e.preventDefault(); f(el, e);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });
$('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });

async function boot() {
    try { history.scrollRestoration = 'manual'; history.replaceState(history.state && history.state.v2 != null ? history.state : { v2: 0 }, '', location.hash || '#/'); } catch (e) {}
    try { await loadAll(); ready = true; route(true); AFTER_BOOT.forEach(f => { try { f(); } catch (e) { console.error(e); } }); }
    catch (e) { console.error(e); $('#boot').innerHTML = `불러오지 못했어요 · <a href="../">이전 화면으로</a>`; }
}
