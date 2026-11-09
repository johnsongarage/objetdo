'use strict';
// ────────────────────────────────────────────────────────────
// 오브젯도 v2 — 같이 쓰는 살림 (v1과 같은 키·같은 규칙)
//   업종별 자주 쓰는 물건 · 쓰는 곳·기능 켜기 · 재고·유통기한 · 사용 통계 · 말로 넣기 · 칸 이름 · 칸 추천 · 사진 줄이기
// ────────────────────────────────────────────────────────────

// 업종별 자주 쓰는 물건 (v1 INDUSTRY_TEMPLATES 그대로 — 칸 창 후보·자리 미정 '한 번에 넣기'가 같은 목록)
const INDUSTRY_TEMPLATES = {
    cafe:       { label: '카페 / 디저트',        items: ['원두', '우유', '바닐라 시럽', '헤이즐넛 시럽', '카라멜 소스', '초코 소스', '휘핑크림', '테이크아웃 컵(HOT)', '테이크아웃 컵(ICE)', '컵 뚜껑', '빨대', '컵홀더', '캐리어', '냅킨', '스틱 설탕', '머들러', '일회용 스푼', '영수증 용지', '행주', '세척제'] },
    restaurant: { label: '식당 / 주점',          items: ['물티슈', '냅킨', '일회용 앞치마', '이쑤시개', '수저 포장지', '부탄가스', '호일', '랩', '위생장갑', '포장 용기', '비닐봉투', '고무줄', '나무젓가락', '소스 컵', '영수증 용지', '세제', '수세미', '행주', '음식물 봉투', '주방 타월'] },
    hardware:   { label: '철물점 / 공구상',      items: ["볼트/너트", "피스(나사)", "앵커", "실리콘", "케이블타이", "절연테이프", "배관 부품", "드릴 비트"] },
    beauty:     { label: '화장품 / 드럭스토어',  items: ["스킨케어", "마스크팩", "선크림", "색조", "헤어·바디", "테스터", "쇼핑백", "가격택"] },
    clothing:   { label: '의류 / 잡화',          items: ["옷걸이", "마네킹", "스팀다리미", "테이프클리너", "쇼핑백", "가격택", "도난방지택", "페이스커버"] },
    mart:       { label: '편의점 / 마트 / PC방', items: ['영수증 용지', '비닐봉투', '종이봉투', '나무젓가락', '빨대', '일회용 스푼', '물티슈', '가격표', '라벨기 테이프', '건전지', '박스 테이프', '커터칼', '고무줄', '포장 비닐', '진열 POP', '청소 도구', '쓰레기봉투', '장갑', '손소독제', '예비 동전'] },
    pharmacy:   { label: '약국 / 조제실',        items: ["전문약(처방)", "일반약(비급여)", "영양제/건기식", "투약병/시럽병", "조제봉투", "연고류", "의약외품", "파스류"] },
    hospital:   { label: '병원 창고',            items: ["주사기/바늘", "거즈/붕대", "수액세트", "알코올솜", "반창고", "소독액", "위생장갑", "트레이"] },
    organizer:  { label: '정리수납 (가정 정리)', items: ['건전지', '상비약', '해열제', '밴드', '체온계', '충전기', '보조배터리', '멀티탭', '공구함', '드라이버', '줄자', '테이프', '가위', '여권', '보증서·설명서', '예비 전구', '마스크', '핫팩', '선물 포장지', '쇼핑백'] },
    general:    { label: '창고 / 백룸 / 기타',   items: ['박스 테이프', '커터칼', '완충재(뽁뽁이)', '택배 상자(소)', '택배 상자(중)', '택배 상자(대)', '송장 용지', '라벨지', '마커', '장갑', '케이블타이', '랩', '비닐 봉투', '줄자', '드라이버', '건전지', '멀티탭', '청소 도구', '예비 부품', '사무용품'] },
};
const INDUSTRY_ASK_CHIPS = [['cafe', '카페'], ['restaurant', '식당'], ['mart', '편의점·마트'], ['hardware', '철물·공구'], ['pharmacy', '약국'], ['clothing', '의류'], ['beauty', '화장품'], ['hospital', '병원'], ['organizer', '정리수납'], ['general', '창고·기타']];

function useMode() { return document.documentElement.dataset.mode === 'home' ? 'home' : 'store'; }
function setUseMode(m) { lsSet('useMode', m); document.documentElement.dataset.mode = m === 'home' ? 'home' : 'store'; }
function currentIndustry() { const k = kvGet('industry'); return INDUSTRY_TEMPLATES[k] ? k : null; }
function defaultIndustry() { return currentIndustry() || (useMode() === 'home' ? 'organizer' : 'general'); }
function loadBaseItems() { // 자주 쓰는 물건 (직접 넣은 물건이 앞에)
    try { const a = JSON.parse(kvGet('baseItems')); if (Array.isArray(a)) return a.filter(x => typeof x === 'string' && x.trim()); } catch (e) {}
    return [...INDUSTRY_TEMPLATES[defaultIndustry()].items];
}
function saveBaseItems(a) { kvSet('baseItems', JSON.stringify(a)); }
function addBaseItems(names) { const a = loadBaseItems(), add = names.filter(n => n && !a.includes(n)); if (add.length) saveBaseItems([...add, ...a]); return add; }
function setIndustry(key) { // 직접 넣은 물건은 남겨 앞에, 그 뒤에 고른 업종 목록 (v1 pickIndustryAsk와 같게)
    const oldDefaults = INDUSTRY_TEMPLATES[defaultIndustry()].items, custom = loadBaseItems().filter(n => !oldDefaults.includes(n));
    kvSet('industry', key); kvSet('industryAsked', '1');
    saveBaseItems([...new Set([...custom, ...INDUSTRY_TEMPLATES[key].items])]);
}
function needIndustryAsk() { return useMode() !== 'home' && !SAMPLE && ls('isSampleData') !== '1' && !currentIndustry() && kvGet('industryAsked') !== '1'; }

// 기능 켜기: 쓰는 곳마다 기본값, 직접 바꾼 값('1'/'0')이 있으면 그걸 (v1 feat·stockOn과 같다)
const FEAT_DEFAULTS = { home: { exp: false, brief: false, chips: false, fx: true, notes: false }, store: { exp: true, brief: true, chips: true, fx: false, notes: true } };
function feat(k) { const v = ls('feat_' + k); if (v === '1') return true; if (v === '0') return false; return FEAT_DEFAULTS[useMode()][k]; }
function setFeat(k, on) { lsSet('feat_' + k, on ? '1' : '0'); }
function stockOn() { const v = ls('stockMode'); return v === '1' ? true : v === '0' ? false : useMode() !== 'home'; }
function setStockOn(on) { lsSet('stockMode', on ? '1' : '0'); }

// 재고(qty 지금 수량 · par 이만큼은 있어야 함)와 유통기한(exp 'YYYY-MM-DD') — v1과 같은 계산
const isNum = (v) => typeof v === 'number' && isFinite(v);
function itemLow(it) { return stockOn() && isNum(it.qty) && isNum(it.par) && it.qty < it.par; }
function zoneLow(z) { return z.items.some(itemLow); }
const EXP_SOON_DAYS = 3;
function expDays(it) {
    if (!it || !it.exp) return null;
    const d = new Date(it.exp + 'T00:00:00'); if (isNaN(d)) return null;
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.round((d - t) / 86400000);
}
function expState(it) { if (!feat('exp')) return null; const d = expDays(it); return d === null ? null : d < 0 ? 'over' : d <= EXP_SOON_DAYS ? 'soon' : null; }
function expLabel(it) { const d = expDays(it); return d === null ? '' : d < 0 ? '기한 지남' : d === 0 ? '오늘까지' : `D-${d}`; }
function zoneExp(z) { let st = null; z.items.forEach(it => { const e = expState(it); if (e === 'over') st = 'over'; else if (e === 'soon' && !st) st = 'soon'; }); return st; }
function itemMarks(it) { // 물건 이름 옆 작은 표시: 재고 · 유통기한
    const out = [];
    if (stockOn() && isNum(it.qty)) out.push(`<span class="mk${itemLow(it) ? ' warn' : ''}">${it.qty}개${isNum(it.par) ? ` / 최소 ${it.par}` : ''}</span>`);
    else if (stockOn() && isNum(it.par)) out.push(`<span class="mk">최소 ${it.par}개</span>`);
    if (feat('exp') && it.exp) { const st = expState(it); out.push(`<span class="mk${st ? ' warn' : ''}">${st ? expLabel(it) : it.exp.replace(/-/g, '. ')}</span>`); }
    return out.join('');
}

// 사용 통계: '쓴 날짜'만 익명으로 (v1과 같은 키·같은 곳). 예시만 볼 때는 세지 않는다. 설정에서 끄면 아무것도 안 보낸다
const AI_PROXY_URL = 'https://script.google.com/macros/s/AKfycbw7W1pUIvnPWDEosL6ZmIhfEbS8rgUVvaU_hfECUB2faBLR5Hte96f_-fDTE_fo-Rhv/exec';
const USAGE_KEY = 'usageStats', STATS_KEY = 'statsQueue', STATS_OFF_KEY = 'statsOff';
function isRealUse() { return !SAMPLE && ls('isSampleData') !== '1' && vis().length > 0; }
function readUsage() { try { return JSON.parse(ls(USAGE_KEY)) || { days: [], finds: 0 }; } catch (e) { return { days: [], finds: 0 }; } }
function writeUsage(u) { lsSet(USAGE_KEY, JSON.stringify(u)); }
function recordUsageDay() {
    if (!isRealUse()) return;
    const u = readUsage(), t = new Date(), today = `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`;
    if (!u.days.includes(today)) { u.days = [...u.days, today].slice(-10); writeUsage(u); }
}
function recordFind() { if (!isRealUse()) return; const u = readUsage(); u.finds = (u.finds || 0) + 1; writeUsage(u); }
function statsOff() { return ls(STATS_OFF_KEY) === '1'; }
function readStats() {
    let s = null; try { s = JSON.parse(ls(STATS_KEY)); } catch (e) {}
    if (!s || !/^[A-Z0-9]{6}$/.test(s.id || '')) {
        const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        s = { id: Array.from({ length: 6 }, () => abc[Math.floor(Math.random() * abc.length)]).join('') };
    }
    return { id: s.id, days: Array.isArray(s.days) ? s.days : [] };
}
function writeStats(s) { lsSet(STATS_KEY, JSON.stringify(s)); }
function statsDay() { const t = new Date(), p = n => String(n).padStart(2, '0'); return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`; }
function markUsedToday() {
    if (statsOff() || !isRealUse()) return;
    const s = readStats(), day = statsDay(), sent = ls('statsSentDay');
    if (sent === day || s.days.includes(day)) return;
    s.days = [...s.days, day].slice(-31); writeStats(s);
}
let statsSending = false;
function sendDailyStats() {
    if (statsSending || statsOff() || !navigator.onLine) return;
    const s = readStats(); if (!s.days.length) return;
    const days = s.days.slice(), q = new URLSearchParams({ t: 'stats', id: s.id, days: days.join(',') });
    statsSending = true;
    fetch(`${AI_PROXY_URL}?${q}`, { mode: 'no-cors', keepalive: true }).then(() => {
        const now = readStats(); now.days = now.days.filter(d => !days.includes(d)); writeStats(now);
        lsSet('statsSentDay', days[days.length - 1]);
    }).catch(() => {}).finally(() => { statsSending = false; });
}
function setStatsOff(off) {
    if (off) { lsSet(STATS_OFF_KEY, '1'); const st = readStats(); st.days = []; writeStats(st); }
    else { try { localStorage.removeItem(STATS_OFF_KEY); } catch (e) {} markUsedToday(); sendDailyStats(); }
}
AFTER_BOOT.push(() => { recordUsageDay(); markUsedToday(); setTimeout(sendDailyStats, 3000); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && ready) { markUsedToday(); sendDailyStats(); } });
window.addEventListener('online', () => { if (ready) sendDailyStats(); });

// 받아쓰기 한 번 (물건 넣기용 — 찾기 화면의 voice와 따로). 지원 안 되면 false
//   o = { onState(on), onText(text), onFinal(text), onError(kind: 'denied'|'broken'|'nospeech') }
let activeDictation = null;
function dictate(o) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || isInAppUA()) return false;
    if (activeDictation) { activeDictation.stop(); return true; } // 듣는 중에 다시 누르면 멈춤
    const rec = new SR(); rec.lang = 'ko-KR'; rec.interimResults = true; rec.maxAlternatives = 1;
    let fin = '', mid = '', started = false, err = null, manual = false, t1 = 0, t2 = 0;
    const session = { stop() { manual = true; try { rec.stop(); } catch (e) {} } };
    activeDictation = session;
    const fail = () => { if (started || activeDictation !== session) return; activeDictation = null; try { rec.abort(); } catch (e) {} if (o.onState) o.onState(false); if (o.onError) o.onError('broken'); };
    rec.onstart = () => { started = true; clearTimeout(t1); if (o.onState) o.onState(true); t2 = setTimeout(() => { if (!fin && !mid) try { rec.stop(); } catch (e) {} }, 8000); };
    rec.onresult = (e) => { fin = ''; mid = ''; for (let i = 0; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) fin += r[0].transcript; else mid += r[0].transcript; } if (o.onText) o.onText((fin + mid).trim()); };
    rec.onerror = (e) => { err = e.error; };
    rec.onend = () => {
        clearTimeout(t1); clearTimeout(t2); if (activeDictation === session) activeDictation = null;
        if (o.onState) o.onState(false);
        const text = (fin || mid).trim();
        if (text) { o.onFinal(text); return; }
        if (manual) return;
        if (o.onError) o.onError(err === 'not-allowed' ? 'denied' : (!started || ['service-not-allowed', 'audio-capture', 'network', 'language-not-supported'].includes(err)) ? 'broken' : 'nospeech');
    };
    t1 = setTimeout(fail, 15000);
    try { navigator.permissions && navigator.permissions.query({ name: 'microphone' }).then(p => { if (p.state === 'granted' && !started && activeDictation === session) { clearTimeout(t1); t1 = setTimeout(fail, 5000); } }).catch(() => {}); } catch (e) {}
    try { rec.start(); } catch (e) { activeDictation = null; if (o.onError) o.onError('broken'); return true; }
    lsSet('voiceUsed', '1');
    return true;
}
function isInAppUA() { return /KAKAOTALK|Instagram|FBAN|FBAV|NAVER\(|Line\/|DaumApps|everytimeApp/i.test(navigator.userAgent); }
const DICTATE_HELP = { denied: '마이크가 막혀 있어요 · 주소창 자물쇠(또는 설정) → 마이크 허용', broken: '이 기기에선 말로 넣기가 안 돼요 · 키보드의 🎤 받아쓰기로 말해 보세요', nospeech: '못 들었어요 · 다시 눌러 말해 주세요' };
// 말로 여러 개: 쉼표·띄어쓰기로 나누고 '그리고·하고·랑' 같은 말은 뺀다 (v1 parseVoiceItemList와 같다)
const VOICE_LIST_CONNECTORS = new Set(['그리고', '하고', '이랑', '랑', '이나', '나', '와', '과']);
function parseVoiceItems(text) { return [...new Set(String(text).split(/[,，、]+/).flatMap(c => c.trim().split(/\s+/)).map(t => t.trim()).filter(t => t && !VOICE_LIST_CONNECTORS.has(t)))]; }
// 손으로 쓴 건 쉼표로만 나눈다 ('바닐라 시럽'이 둘로 쪼개지지 않게). 붙여 넣은 목록은 줄마다, 엑셀 행이면 첫 칸만
function parseTypedItems(text) { return [...new Set(String(text).split(/[,，、]+/).map(t => t.trim()).filter(Boolean))]; }
function parsePastedItems(text) { return [...new Set(String(text).split(/\r?\n/).map(l => l.split('\t')[0].trim()).filter(Boolean))]; }

// 새 칸 이름: 아직 안 쓴 A구역~Z구역 (v1과 같다). AI로 찾은 칸은 1구역·2구역…
function newZoneName() {
    for (let c = 65; c <= 90; c++) { const n = String.fromCharCode(c) + '구역'; if (!vis().some(d => d.zones.some(z => z.name === n))) return n; }
    return '수동구역_' + Math.floor(Math.random() * 1000);
}
function placedNames() { const s = new Set(); vis().forEach(d => d.zones.forEach(z => z.items.forEach(it => s.add(normalizeForSearch(it.name))))); return s; }
// 칸 추천: 같은 이름이 이미 있는 칸 > 칸 이름이 그 종류 > 같은 종류 물건이 많은 칸 (v1 suggestZone과 같다)
function suggestZone(name) {
    let best = null; const nn = normalizeForSearch(name);
    vis().forEach(d => { if (best) return; d.zones.forEach((z, i) => { if (!best && z.items.some(it => normalizeForSearch(it.name) === nn)) best = { sc: 9, data: d, index: i, kind: '같은 물건이 있는 칸' }; }); });
    if (best) return best;
    kindsOf(name).forEach(k => vis().forEach(d => d.zones.forEach((z, i) => {
        const n = z.items.filter(it => kindHit(k, it.name)).length, sc = kindHit(k, z.name) ? 3 : n ? 1 + Math.min(1, n / 5) : 0;
        if (sc && (!best || sc > best.sc)) best = { sc, data: d, index: i, kind: k };
    })));
    return best;
}
// 자리 미정 (v1과 같은 키·모양: [{ name, at }])
function saveInbox(a) { kvSet('inboxItems', JSON.stringify(a)); }
function addToInbox(names) { // 이미 자리가 있는 물건은 건너뛴다. 돌려주는 값: { added, skipped }
    const a = inboxItems(), have = new Set(a.map(x => x.name)), placed = placedNames(), add = []; let skipped = 0;
    names.map(x => String(x).trim()).filter(Boolean).forEach(x => { if (placed.has(normalizeForSearch(x))) { skipped++; return; } if (!have.has(x)) { add.push({ name: x, at: Date.now() }); have.add(x); } });
    if (add.length) saveInbox([...add, ...a]);
    return { added: add.map(x => x.name), skipped };
}
function cleanInbox() { const a = inboxItems(); if (!a.length) return; const placed = placedNames(), b = a.filter(x => !placed.has(normalizeForSearch(x.name))); if (b.length !== a.length) saveInbox(b); } // 칸에 들어간 물건은 자리 미정에서 빠진다 (v1 saveData와 같다)

// 사진 고르기 → 줄이기 (v1 addImage와 같게: 가로 1600까지 · JPEG 0.8). 칸 좌표는 그대로 가로 800 기준
function readPhotoFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) return reject(new Error('no file'));
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('사진을 읽지 못했어요'));
            img.onload = () => {
                const MAX = 1600; let w = img.width, h = img.height;
                if (w > MAX) { h *= MAX / w; w = MAX; }
                const c = document.createElement('canvas'); c.width = Math.round(w); c.height = Math.round(h);
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                resolve({ dataUrl: c.toDataURL('image/jpeg', 0.8), w: c.width, h: c.height });
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}
function zoneOf(z) { for (const p of vis()) { const i = p.zones.indexOf(z); if (i >= 0) return { p, i }; } return null; }
function markChecked(z) { if (z) z.checkedAt = Date.now(); }
