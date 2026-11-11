'use strict';
// ────────────────────────────────────────────────────────────
// 오브젯도 v2 — 설정 · 백업·복구 · 데이터 안내 · 처음부터 다시 · 아이폰 안내 · 사용법 · 가격
//   #/settings · #/backup · #/data · #/reset · #/iphone · #/guide/1~4 · #/service
//   백업 파일 모양·지우는 키·설정 키는 v1과 똑같다 → v2에서 받은 백업은 v1에서, v1 백업은 v2에서 그대로 복구된다
//   다른 화면 파일과 이름이 겹치지 않게 전부 이 안에 두고, 다른 화면이 부를 것만 st…로 내보낸다 (맨 아래)
// ────────────────────────────────────────────────────────────
(() => {
addCSS(`
.st-main { flex: 1; display: flex; flex-direction: column; padding-bottom: 30px; }
.st-title { margin: 18px 0 0; }
.st-kick { margin-top: 20px; }
.st-kick + .st-title { margin-top: 6px; }
.st-red { color: var(--accent) !important; }
.st-sec { margin-top: 30px; }
.st-sec.st-first { margin-top: 22px; }
.st-lab { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 0; padding-bottom: 8px; border-bottom: 1px solid var(--ink); font-family: var(--sans); font-size: 13px; font-weight: 400; letter-spacing: .1em; color: var(--sub); }
.st-lab small { font-size: 12px; letter-spacing: 0; text-align: right; }
.st-lab.st-plain { border-bottom: 0; padding-bottom: 0; }
.st-modes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
.st-mode { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-height: 78px; padding: 12px; border: 1px solid var(--line); border-radius: 2px; background: transparent; text-align: left; cursor: pointer; }
.st-mode b { font-size: 15px; font-weight: 500; padding-right: 10px; }
.st-mode small { font-size: 13px; line-height: 1.45; color: var(--sub); }
.st-mode[aria-pressed="true"] { border-color: var(--ink); box-shadow: inset 0 0 0 .5px var(--ink); background: var(--sheet); }
.st-mode[aria-pressed="true"]::after { content: ''; position: absolute; top: 11px; right: 11px; width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
.st-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.st-chip { min-height: 42px; padding: 0 13px; border: 1px solid var(--line); border-radius: 2px; background: transparent; font-size: 14px; cursor: pointer; }
.st-chip[aria-pressed="true"] { background: var(--ink); border-color: var(--ink); color: var(--bg); }
.st-chk { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 52px; padding: 6px 0; border: 0; border-bottom: 1px solid var(--line2); background: none; text-align: left; font-size: 16px; cursor: pointer; }
.st-box { flex: none; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border: 1.5px solid var(--ink); color: var(--bg); }
.st-box svg { width: 13px; height: 13px; visibility: hidden; }
.st-chk[aria-checked="true"] .st-box { background: var(--ink); }
.st-chk[aria-checked="true"] .st-box svg { visibility: visible; }
.st-tx { flex: 1; min-width: 0; }
.st-tx small { margin-left: 6px; font-size: 13px; color: var(--sub); }
.st-val { flex: none; font-size: 13px; color: var(--sub); }
.st-seg { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin-top: 12px; }
.st-seg button { min-height: 50px; padding: 0 6px; border: 1px solid var(--line); border-radius: 2px; background: transparent; cursor: pointer; line-height: 1.2; }
.st-seg button[aria-pressed="true"] { background: var(--ink); border-color: var(--ink); color: var(--bg); }
.st-field { display: block; margin-top: 16px; }
.st-field > span { display: block; font-size: 16px; }
.st-field small { display: block; font-size: 13px; line-height: 1.5; color: var(--sub); }
.st-field input { display: block; width: 100%; margin-top: 2px; padding: 10px 0 9px; border: 0; border-bottom: 1.5px solid var(--ink); border-radius: 0; background: transparent; font: inherit; font-size: 17px; color: var(--ink); outline: 0; -webkit-appearance: none; appearance: none; }
.st-field input::placeholder { color: #A69C8E; }
.st-field input:focus-visible { border-bottom-color: var(--accent); }
.st-note { margin: 8px 0 0; font-size: 13px; line-height: 1.6; color: var(--sub); }
.st-due { color: var(--accent); }
.st-links { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 14px; }
.st-links button { display: inline-flex; align-items: center; min-height: 44px; padding: 0; border: 0; background: none; font-size: 15px; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; }
.st-foot { line-height: 1.8; }
.st-foot a { color: var(--accent); text-underline-offset: 3px; }
.st-lead { margin: 12px 0 0; font-size: 16px; line-height: 1.7; }
.st-lead b { color: var(--accent); font-weight: 500; }
.st-facts { margin: 22px 0 0; padding: 0; list-style: none; border-top: 1px solid var(--line); }
.st-facts li { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; min-height: 54px; padding: 13px 0; border-bottom: 1px solid var(--line); font-size: 15px; text-align: right; }
.st-k { flex: none; font-size: 13px; color: var(--sub); text-align: left; }
.st-facts b { font-family: var(--serif); font-size: 21px; font-weight: 700; line-height: 1.3; }
.st-facts small { display: block; font-size: 13px; color: var(--sub); }
.st-warn { margin-top: 22px; padding: 14px 16px; border-left: 3px solid var(--accent); background: var(--accent-soft); font-size: 15px; line-height: 1.65; }
.st-warn b { color: var(--accent); font-weight: 500; }
.st-warn button { display: inline-flex; align-items: center; min-height: 40px; margin-top: 2px; padding: 0; border: 0; background: none; color: var(--ink); font-size: 14px; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; }
.st-cta { margin-top: auto; padding-top: 30px; display: flex; flex-direction: column; gap: 10px; }
.st-cta .tlink { align-self: center; }
.st-fine { margin: 4px 0 0; font-size: 13px; line-height: 1.65; color: var(--sub); }
.st-fine a { color: var(--accent); text-underline-offset: 3px; }
.btn.st-danger { color: var(--accent); border-color: var(--accent); }
p.st-sum { margin: 4px 0 20px; padding: 10px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); font-size: 15px; color: var(--ink); }
.st-sum small { display: block; font-size: 13px; color: var(--sub); }
.st-tbl { margin-top: 22px; border-top: 1px solid var(--ink); }
.st-tr { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 14px; padding: 13px 0; border-bottom: 1px solid var(--line); font-size: 15px; line-height: 1.55; }
.st-tr small { display: block; margin-top: 2px; font-size: 13px; color: var(--sub); }
.st-p { margin: 18px 0 0; font-size: 15px; line-height: 1.8; }
.st-p b { font-weight: 600; }
.st-steps { margin: 16px 0 0; padding: 0; list-style: none; border-top: 1px solid var(--line); }
.st-steps li { display: flex; gap: 14px; padding: 13px 0; border-bottom: 1px solid var(--line); }
.st-n { flex: none; min-width: 18px; font-family: var(--serif); font-size: 17px; line-height: 1.45; color: var(--accent); }
.st-steps b { display: flex; align-items: center; gap: 6px; font-size: 16px; font-weight: 500; }
.st-steps b svg { flex: none; width: 18px; height: 18px; }
.st-steps small { display: block; margin-top: 2px; font-size: 14px; line-height: 1.6; color: var(--sub); }
.st-steps small em { font-style: normal; color: var(--ink); }
.st-h2 { margin: 30px 0 0; font-family: var(--serif); font-size: 20px; font-weight: 700; }
.st-price { margin-top: 26px; }
.st-ph { display: flex; justify-content: space-between; gap: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--ink); font-size: 13px; letter-spacing: .06em; color: var(--sub); }
.st-pr { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; min-height: 52px; padding: 11px 0; border-bottom: 1px solid var(--line); font-size: 16px; }
.st-pr small { margin-left: 4px; font-size: 13px; color: var(--sub); }
.st-pr b { flex: none; font-family: var(--serif); font-size: 20px; font-weight: 400; white-space: nowrap; }
.st-gtop { font-size: 14px; letter-spacing: .08em; color: var(--sub); }
.st-gtop b { font-weight: 500; color: var(--ink); }
.st-stage { display: flex; justify-content: center; margin-top: 6px; padding: 14px 0; border: 1px solid var(--ink); background: var(--sheet); }
.st-stage video { display: block; height: min(44dvh, 400px); max-width: 100%; aspect-ratio: 468 / 912; object-fit: contain; background: var(--hl); }
.st-gnote { margin: 8px 0 0; font-size: 13px; color: var(--sub); }
.st-gtext { margin: 10px 0 0; font-size: 16px; line-height: 1.75; }
.st-gtext b { font-weight: 600; }
.st-dots { display: flex; gap: 6px; margin-top: 16px; }
.st-dots button { position: relative; width: 36px; height: 28px; padding: 0; border: 0; background: none; cursor: pointer; }
.st-dots button::before { content: ''; position: absolute; left: 0; right: 0; top: 13px; height: 2px; background: var(--line); }
.st-dots button[aria-current="step"]::before { background: var(--ink); }
.st-gnav { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 10px; margin-top: auto; padding-top: 26px; }
`);

const APP_NAME = '오브젯도';
const APP_VERSION = '베타 2026.11.10.16'; // 11/10부터 기본 화면 (예전 화면 v1은 '… · 예전 화면') · 배포할 때 올린다
const SHARE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"></path><path d="M8 7l4-4 4 4"></path><path d="M5 11v9h14v-9"></path></svg>';
const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>';
const p2 = (n) => String(n).padStart(2, '0');
const lsDel = (k) => { try { localStorage.removeItem(k); } catch (e) {} };
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // v1과 같다
const isInstalled = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const canUseShareSheet = () => !!navigator.share && window.matchMedia('(pointer: coarse)').matches; // PC 공유 창엔 카톡이 없다 (v1과 같다)
function counts() {
    const ps = vis(), zones = ps.reduce((n, p) => n + p.zones.length, 0), items = ps.reduce((n, p) => n + p.zones.reduce((m, z) => m + z.items.length, 0), 0);
    return { photos: ps.length, zones, items };
}
function hasSaved() { // v1 hasSavedData (예시를 보는 중이면 지울·받을 내 데이터로 치지 않는다)
    if (SAMPLE) return false;
    try { const a = JSON.parse(store.db ? store.cache : ls(PHOTO_DATA_KEY)); return Array.isArray(a) && a.length > 0; } catch (e) { return false; }
}
function screen(name, label) { const el = screenEl(name); el.setAttribute('aria-label', label); return el; }

// '뒤로' 이름: 들어온 화면 이름으로 (뒤로 가기로 돌아올 땐 그대로). 처음 열면 기본값
const MINE = new Set(['settings', 'backup', 'data', 'reset', 'iphone', 'guide', 'service']);
const FROM = { home: ['검색', '#/'], menu: ['메뉴', '#/menu'], intro: ['처음', '#/'], list: ['목록', '#/list'], map: ['지도', '#/'], r: ['결과', '#/'], print: ['인쇄', '#/'], inbox: ['자리 미정', '#/'], check: ['점검', '#/'], settings: ['설정', '#/settings'], backup: ['백업', '#/backup'], data: ['데이터 안내', '#/data'], iphone: ['아이폰 안내', '#/iphone'], service: ['가격', '#/service'], reset: ['지우기', '#/reset'] };
const backFrom = {};
BEFORE_ROUTE.push((name) => { if (MINE.has(name) && !popped && cur !== name) backFrom[name] = FROM[cur] || null; });
const backOf = (name, def) => backFrom[name] || def;

// ────────────────────────────────────────────────────────────
// 글자 크기 (새 화면만 · v2FontScale '1' | '1.12' | '1.25'): body에 CSS zoom을 건다 → 글자·여백·버튼이 같이 커지고 줄은 다시 맞춘다
//   zoom 안에서는 100dvh도 같이 커져서 짧은 화면에 빈 스크롤이 생기므로, .app 최소 높이만 그만큼 나눠 둔다
// ────────────────────────────────────────────────────────────
const FONT_SCALES = [['1', '보통', 15], ['1.12', '크게', 17], ['1.25', '아주 크게', 19]];
function fontScale() { const v = ls('v2FontScale'); return FONT_SCALES.some(f => f[0] === v) ? v : '1'; }
function applyFontScale() {
    const v = fontScale(), app = document.querySelector('.app');
    document.body.style.zoom = v === '1' ? '' : v;
    if (app) app.style.minHeight = v === '1' ? '' : `calc(${window.CSS && CSS.supports && CSS.supports('height', '100dvh') ? '100dvh' : '100vh'} / ${v})`;
}
applyFontScale();

// ────────────────────────────────────────────────────────────
// 인쇄물 이름 (v1과 같은 키 · 길이): 매장(머리글) 이름은 인쇄물 머리글·백업 파일 이름에, 정리 업체 이름은 인쇄물·백업 PDF 아래에
// ────────────────────────────────────────────────────────────
function storeName() { return (ls('storeName') || '').trim().slice(0, 20); }
function organizerName() { return (ls('organizerName') || '').trim().slice(0, 30); }
function setOrganizerName(v) { lsSet('organizerName', String(v || '').slice(0, 30)); }
function storeFileName() { return storeName().replace(/[\\/:*?"<>|\s.]+/g, ''); } // 파일 이름에 못 쓰는 글자·띄어쓰기 빼고
document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'stStoreName') lsSet('storeName', String(t.value || '').slice(0, 20));
    else if (t.id === 'stOrgName') setOrganizerName(t.value);
});

// ────────────────────────────────────────────────────────────
// 홈 화면에 설치 (v1 installApp과 같은 순서): 설치 창을 띄울 수 있으면 그걸, 아이폰은 안내 화면, 나머지는 브라우저 메뉴 안내
// ────────────────────────────────────────────────────────────
let installEvt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; });
window.addEventListener('appinstalled', () => { installEvt = null; });
async function installApp() {
    if (isInstalled()) { toast('이미 홈 화면 앱으로 쓰고 계세요'); return; }
    if (installEvt) {
        const ev = installEvt; installEvt = null;
        try { ev.prompt(); const { outcome } = await ev.userChoice; if (outcome === 'accepted') toast('홈 화면에 추가했어요'); } catch (e) {}
        return;
    }
    if (isIOS()) { nav('#/iphone'); return; }
    openSheet(`<span class="kick">홈 화면에 설치</span>
        <h2>브라우저 메뉴에서 추가해 주세요</h2>
        <p>${isInAppUA() ? '카톡·인스타 안에서는 설치가 안 돼요. 오른쪽 위 메뉴에서 ‘다른 브라우저로 열기’를 누른 뒤 ' : ''}브라우저 메뉴(⋮)에서 ‘홈 화면에 추가’ 또는 ‘앱 설치’를 눌러 주세요.</p>
        <div class="stack"><button type="button" class="btn btn-p" data-act="sheetClose">알겠어요</button></div>`);
}

// ────────────────────────────────────────────────────────────
// 쓰는 곳 바꾸기 (v1 setUseMode와 같게): 기능 켜기를 그 쓰는 곳의 기본값으로 · v1 테마도 같이 · 예시면 그 쓰는 곳의 예시로
// ────────────────────────────────────────────────────────────
function changeMode(m) {
    if (m !== 'home' && m !== 'store') return;
    if (useMode() === m) return;
    setUseMode(m);
    ['exp', 'brief', 'chips', 'fx', 'notes'].forEach(k => lsDel('feat_' + k)); lsDel('stockMode');
    lsSet('uiTheme', m === 'home' ? 'calm' : 'shop'); // v1 화면 테마 (v1에서 쓰는 곳을 바꿀 때와 같게)
    toast(m === 'home' ? '집·정리 모드: 사진 지도 · 검색 · 말로 찾기만 보여요' : '매장 모드: 재고 점검 · 유통기한까지 보여요');
    if (SAMPLE) { // 예시는 쓰는 곳마다 다르다 (집 → 팬트리·옷장, 매장 → 카페 창고)
        try { sessionStorage.setItem('samplePreview', m === 'home' ? 'organizer' : '1'); } catch (e) {}
        setTimeout(() => location.reload(), 600); return;
    }
    if (ls('isSampleData') === '1') { swapStoredSample(m); return; } // v1처럼 저장해 둔 예시도 그 쓰는 곳의 예시로
    paintSettings('[data-act="stMode"][data-v="' + m + '"]');
}
async function swapStoredSample(m) {
    try {
        const r = await fetch(currentIndustry() === 'organizer' || m === 'home' ? 'sample-home.json' : 'sample-store.json'), j = await r.json();
        const data = j.savedSystemData.map(p => ({ ...p, zones: p.zones.map(({ checkedDaysAgo, ...z }) => (checkedDaysAgo == null ? z : { ...z, checkedAt: Date.now() - checkedDaysAgo * 86400000 })) }));
        writePhotoData(JSON.stringify(data)); lsSet('baseItems', JSON.stringify(j.baseItems || []));
        await Promise.resolve(store.pending).catch(() => {});
        setTimeout(() => location.reload(), 400);
    } catch (e) { paintSettings(); }
}
function pickIndustry(k) {
    if (!INDUSTRY_TEMPLATES[k]) return;
    setIndustry(k);
    toast(`${INDUSTRY_TEMPLATES[k].label} 물건으로 바꿨어요${SAMPLE ? ' · 예시에선 저장되지 않아요' : ''}`);
    paintSettings('[data-act="stInd"][data-v="' + k + '"]');
}
function toggleFeature(k) {
    if (k === 'stock') { const on = !stockOn(); setStockOn(on); toast(on ? '재고 세기를 켰어요' : '재고 세기를 껐어요. 적어 둔 수량은 그대로 있어요'); }
    else if (k === 'exp') { const on = !feat('exp'); setFeat('exp', on); toast(on ? '유통기한을 켰어요' : '유통기한을 껐어요. 적어 둔 날짜는 그대로 있어요'); }
    else if (k === 'stats') { const off = !statsOff(); setStatsOff(off); toast(off ? '사용 통계를 보내지 않아요' : '앱을 쓴 날짜만 보내요'); }
    paintSettings('[data-act="stFeat"][data-v="' + k + '"]');
}
function pickFont(v) {
    if (!FONT_SCALES.some(f => f[0] === v)) return;
    lsSet('v2FontScale', v); applyFontScale();
    paintSettings('[data-act="stFont"][data-v="' + v + '"]');
}

// ────────────────────────────────────────────────────────────
// B17 설정
// ────────────────────────────────────────────────────────────
function lastBackupAt() { return parseInt(ls('lastBackupAt') || '0', 10) || 0; }
function lastBackupText() { // v1 syncLastBackupText와 같은 말
    const last = lastBackupAt(); if (!last) return '아직 없음';
    const days = Math.floor((Date.now() - last) / 86400000);
    return '마지막: ' + (days < 1 ? '오늘' : days + '일 전');
}
const BACKUP_REMIND_MS = 14 * 24 * 60 * 60 * 1000;
function backupDue() { // v1 백업 안내 띠와 같은 조건: 물건까지 적었고, 백업이 없거나 14일이 지났고 그사이 바뀐 게 있을 때
    if (SAMPLE || storedSample || !vis().some(p => p.zones.some(z => z.items.length))) return false;
    const now = Date.now(), num = (k) => parseInt(ls(k) || '0', 10) || 0;
    if (now < num('backupBannerHiddenUntil')) return false;
    const last = num('lastBackupAt');
    return !(last && (now - last < BACKUP_REMIND_MS || num('dataChangedAt') <= last));
}
function summaryLine() { // v1 설정 맨 아래와 같은 말
    const n = counts();
    return n.photos ? `${SAMPLE || storedSample ? '예시 ' : ''}사진 ${n.photos}장 · 구역 ${n.zones}개 · 물건 ${n.items}개` : '아직 올린 사진이 없어요';
}
function fillUsage(id, prefix) { // 폰 저장 공간을 얼마나 쓰는지 (알 수 있는 브라우저만)
    try {
        if (SAMPLE || !navigator.storage || !navigator.storage.estimate || !vis().length) return; // 예시를 볼 땐 저장 공간이 예시 것이 아니라서 뺀다
        navigator.storage.estimate().then(est => { const el = document.getElementById(id); if (el && est && est.usage != null) el.textContent = `${prefix}저장 공간 ${(est.usage / 1048576).toFixed(1)}MB`; }).catch(() => {});
    } catch (e) {}
}
const chk = (k, label, sub, on, val) => `<button type="button" class="st-chk" role="checkbox" aria-checked="${on}" data-act="stFeat" data-v="${k}"><span class="st-box">${CHECK_SVG}</span><span class="st-tx">${label}${sub ? `<small>${sub}</small>` : ''}</span>${val ? `<span class="st-val">${val}</span>` : ''}</button>`;
function renderSettings() {
    const el = screen('settings', '설정'), [lab, fb] = backOf('settings', ['검색', '#/']);
    const home = useMode() === 'home', ind = currentIndustry(), font = fontScale(), off = statsOff(), due = backupDue();
    let statsId = '';
    if (!off) { const st = readStats(); statsId = st.id; if (!SAMPLE && !ls('statsQueue')) writeStats(st); } // 번호가 열 때마다 바뀌지 않게 (기록표에 적어 두는 번호)
    el.innerHTML = `
        <header class="top">${backBtn(lab, fb)}</header>
        <main class="wrap st-main">
            <h1 class="h1 st-title">설정</h1>
            <section class="st-sec st-first">
                <h2 class="st-lab st-plain">어디에 쓰세요?</h2>
                <div class="st-modes">
                    <button type="button" class="st-mode" aria-pressed="${home}" data-act="stMode" data-v="home"><b>집 · 정리수납</b><small>팬트리, 옷장, 다용도실</small></button>
                    <button type="button" class="st-mode" aria-pressed="${!home}" data-act="stMode" data-v="store"><b>매장 · 창고</b><small>재고 점검, 발주, 유통기한까지</small></button>
                </div>
            </section>
            ${home ? '' : `<section class="st-sec">
                <h2 class="st-lab"><span>업종</span><small>칸에 넣을 물건 후보가 바뀌어요</small></h2>
                <div class="st-chips" role="group" aria-label="업종">${INDUSTRY_ASK_CHIPS.map(([k, t]) => `<button type="button" class="st-chip" aria-pressed="${k === ind}" data-act="stInd" data-v="${k}">${t}</button>`).join('')}</div>
                <p class="st-note">${ind ? `지금: ${esc(INDUSTRY_TEMPLATES[ind].label)} · 직접 넣은 물건은 그대로 있어요` : '아직 안 골랐어요 · 고르면 그 업종에서 자주 쓰는 물건이 후보로 나와요'}</p>
            </section>`}
            <section class="st-sec">
                <h2 class="st-lab"><span>쓰는 기능</span><small>꺼도 적어 둔 내용은 그대로예요</small></h2>
                ${chk('stock', '재고 점검', '수량 · 발주 목록', stockOn())}
                ${chk('exp', '유통기한', '', feat('exp'))}
            </section>
            <section class="st-sec">
                <h2 class="st-lab"><span>글자 크기</span><small>새 화면 전체가 같이 커져요</small></h2>
                <div class="st-seg" role="group" aria-label="글자 크기">${FONT_SCALES.map(([v, t, px]) => `<button type="button" aria-pressed="${v === font}" data-act="stFont" data-v="${v}" style="font-size:${px}px">${t}</button>`).join('')}</div>
            </section>
            <section class="st-sec">
                <h2 class="st-lab">${home ? '인쇄·파일' : '매장'}</h2>
                <label class="st-field"><span>${home ? '머리글 이름' : '매장 이름'}</span><small>인쇄물 머리글·파일 이름에 들어가요</small>
                    <input type="search" id="stStoreName" enterkeyhint="done" maxlength="20" autocomplete="off" placeholder="${home ? '예: 우리 집' : '예: 다산점 창고'}" value="${esc(storeName())}"></label>
                <label class="st-field"><span>정리 업체 이름</span><small>정리해 드린 분이 넣으면 인쇄물·백업 PDF 아래에 ‘정리 · 이름’으로 들어가요</small>
                    <input type="search" id="stOrgName" enterkeyhint="done" maxlength="30" autocomplete="off" placeholder="예: 다산정리수납 010-1234-5678" value="${esc(organizerName())}"></label>
            </section>
            <section class="st-sec">
                <h2 class="st-lab"><span>백업</span><small class="${due ? 'st-due' : ''}">${due ? '백업할 때가 됐어요' : lastBackupText()}</small></h2>
                <nav class="rows">
                    <button type="button" class="row" data-act="go" data-to="#/backup">백업하기 · 백업 파일로 복구<span class="ar">→</span></button>
                </nav>
                <p class="st-note">사진·물건은 이 ${DEV}에만 있어요. ${DEV_OBJ} 바꾸기 전에 백업 파일을 받아 두세요.</p>
            </section>
            <section class="st-sec">
                <h2 class="st-lab">도움</h2>
                <nav class="rows">
                    ${isInstalled() ? '' : `<button type="button" class="row" data-act="stInstall">홈 화면에 앱으로 설치${isIOS() ? '<small>아이폰 방법</small>' : ''}<span class="ar">→</span></button>`}
                    <button type="button" class="row" data-act="go" data-to="#/guide">사용법 다시 보기<span class="ar">→</span></button>
                    <button type="button" class="row" data-act="go" data-to="#/service">가격 · 대신 만들기<span class="ar">→</span></button>
                    <a class="row" href="${FEEDBACK_FORM_URL}" target="_blank" rel="noopener">의견 보내기<span class="ar">↗</span></a>
                </nav>
            </section>
            <section class="st-sec">
                <h2 class="st-lab">정보 · 기타</h2>
                ${chk('stats', '사용 통계 보내기', '', !off, off ? '꺼짐' : `켜짐 · ${esc(statsId)}`)}
                <p class="st-note">앱을 쓴 날짜와 무작위 번호만 보내요. 사진·이름·메모는 보내지 않아요.</p>
                <div class="st-links">
                    <button type="button" data-act="go" data-to="#/data">내 데이터는 어디에?</button>
                    ${hasSaved() ? '<button type="button" class="st-red" data-act="go" data-to="#/reset">모든 데이터 지우기</button>' : ''}
                </div>
            </section>
        </main>
        <footer class="foot st-foot"><span id="stSum">${esc(summaryLine())}</span><br>${APP_NAME} ${APP_VERSION}<br><a href="${V1()}" data-v1>예전 화면으로 ${EXT}</a></footer>`;
    fillUsage('stSum', summaryLine() + ' · ');
}
function paintSettings(focusSel) { // 고친 줄만 다시 그리고 누른 버튼에 그대로 머문다 (스크롤도 그대로)
    if (cur !== 'settings') return;
    renderSettings();
    if (focusSel) { const b = screenEl('settings').querySelector(focusSel); if (b) b.focus(); }
}

// ────────────────────────────────────────────────────────────
// 백업 파일 (v1 그대로): PDF 한 개 = 1쪽 '복구하는 법' 그림 + 2쪽부터 물건 찾아보기·칸 번호 지도 + 페이지에 붙이지 않은 백업 내용(JSON) 스트림
//   PDF는 직접 쓴다 (jsPDF 없이 · v1 buildBackupPdf와 같다). 불러오기는 PDF 속 표시 사이의 JSON만 꺼내 쓴다 (json·예전 txt 백업도 그대로)
// ────────────────────────────────────────────────────────────
const BACKUP_VERSION = 1;
const BACKUP_PDF_BEGIN = '%%CHANGGOJIGI-BACKUP-BEGIN', BACKUP_PDF_END = '%%CHANGGOJIGI-BACKUP-END';
function fileDate() { const t = new Date(); return `${t.getFullYear()}-${p2(t.getMonth() + 1)}-${p2(t.getDate())}`; }
function fileDateTime() { const t = new Date(); return `${fileDate()}_${p2(t.getHours())}시${p2(t.getMinutes())}분`; } // 파일 이름엔 : 를 못 써서 시·분으로
function printDateStr() { const t = new Date(); return `${t.getFullYear()}.${p2(t.getMonth() + 1)}.${p2(t.getDate())} 기준`; }
const backupFileName = () => `${APP_NAME}_${storeFileName() ? storeFileName() + '_' : ''}백업_${fileDateTime()}.pdf`;
function readArr(k) { try { const a = JSON.parse(kvGet(k) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
const flushPending = () => { if (typeof flushSave === 'function') flushSave(); }; // 모아 두던 저장(재고 세기 등)을 먼저 끝낸다
function backupJson() { // v1 backupJson과 같은 모양·같은 순서 (app 이름 'changgojigi'는 옛 이름 그대로 둔다)
    flushPending();
    let saved = null; // 예시를 보는 중이면 v1처럼 예시 데이터 (저장소를 열지 않았다)
    if (!SAMPLE) try { saved = JSON.parse((store.db ? store.cache : ls(PHOTO_DATA_KEY)) || '[]'); } catch (e) {}
    if (!Array.isArray(saved)) saved = JSON.parse(JSON.stringify(photos)); // 저장본을 못 읽으면 지금 화면의 데이터로
    let baseItems; try { baseItems = JSON.parse(kvGet('baseItems') || '[]'); } catch (e) { baseItems = []; }
    return JSON.stringify({ app: 'changgojigi', version: BACKUP_VERSION, exportedAt: new Date().toISOString(), note: '백업', savedSystemData: saved, baseItems, stockLog: readArr('stockLog'), organizerName: organizerName(), inboxItems: readArr('inboxItems').filter(x => x && x.name) });
}
function markBackedUp() {
    if (!SAMPLE) lsSet('lastBackupAt', String(Date.now()));
    if (cur === 'backup') renderBackup();
}
function canShareBackup() {
    try { return canUseShareSheet() && !!(navigator.canShare && navigator.canShare({ files: [new File(['%PDF'], 'a.pdf', { type: 'application/pdf' })] })); } catch (e) { return false; }
}
function exportSystemData() { // 이 폰에 저장 (data: 주소는 사진이 많으면 잘릴 수 있어 Blob으로)
    const url = URL.createObjectURL(buildBackupPdf(backupJson()));
    const a = document.createElement('a'); a.href = url; a.download = backupFileName();
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    markBackedUp();
    toast('백업 파일을 저장했어요');
}
async function shareBackup() { // 카톡 등으로 보내기: 제목·글 없이 파일만 (일부 앱이 글만 보낸다)
    closeSheet();
    const file = new File([buildBackupPdf(backupJson())], backupFileName(), { type: 'application/pdf' });
    try {
        await navigator.share({ files: [file] });
        markBackedUp();
        toast(`보냈어요. 받은 파일은 ${DEV}에도 저장해 두세요`);
    } catch (err) {
        if (err && err.name === 'AbortError') return; // 공유 창을 닫음 → 백업한 걸로 치지 않는다
        exportSystemData();
        toast(`보내기가 안 돼서 이 ${DEV}에 저장했어요`);
    }
}
function startBackup() { // 보내기가 되는 폰이면 보내기/저장 중 고르게, 아니면 바로 저장
    if (SAMPLE) { toast('예시는 백업하지 않아요 · 예시를 닫고 받아 주세요'); return; }
    if (!vis().length) { toast('아직 백업할 사진이 없어요'); return; }
    preloadImages();
    if (!canShareBackup()) { exportSystemData(); return; }
    openSheet(`<span class="kick">백업</span>
        <h2>백업 파일을 어디에 둘까요?</h2>
        <p>카톡 ‘나와의 채팅’에 보내 두면 ${DEV_OBJ} 바꿀 때 편해요.</p>
        <div class="stack"><button type="button" class="btn btn-p" data-act="stShare">카톡 등으로 보내기</button><button type="button" class="btn btn-s" data-act="stSave">이 ${DEV}에 저장</button><button type="button" class="tlink" style="align-self:center" data-act="sheetClose">취소</button></div>`);
}
function extractBackupText(text) {
    const a = text.indexOf(BACKUP_PDF_BEGIN), b = text.lastIndexOf(BACKUP_PDF_END);
    return a >= 0 && b > a ? text.slice(a + BACKUP_PDF_BEGIN.length, b) : text;
}
function buildBackupPdf(json) {
    const extra = backupReadablePages();
    // 안내 그림 (PDF 기본 글꼴에는 한글이 없어서 글자를 그림으로 그려 넣는다)
    const W = 1240, H = extra.length ? 780 : 700, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#3b3577'; g.font = 'bold 64px sans-serif'; g.fillText(`${APP_NAME} 백업 파일`, 80, 150);
    g.fillStyle = '#1a1a18'; g.font = '38px sans-serif';
    g.fillText('이 파일 안에 사진·구역·물건이 모두 들어 있어요.', 80, 240);
    g.fillStyle = '#c44444'; g.font = '30px sans-serif'; g.fillText('PDF 편집 앱으로 고쳐서 다시 저장하면 백업이 지워질 수 있어요.', 80, 295);
    g.fillStyle = '#1a1a18';
    ['복구하는 법', '1. 이 파일을 저장해 둬요.', `2. ${APP_NAME} → 설정 → [백업 파일로 복구]`, '3. 이 파일을 골라요.'].forEach((t, i) => { g.font = i ? '38px sans-serif' : 'bold 40px sans-serif'; g.fillText(t, 80, 385 + i * 62); });
    if (extra.length) { g.fillStyle = '#3b3577'; g.font = 'bold 34px sans-serif'; g.fillText('2쪽부터: 물건 찾아보기와 칸 번호 지도 (앱 없이 이 PDF로도 보여요)', 80, 650, W - 160); }
    g.fillStyle = '#6b6960'; g.font = '30px sans-serif'; g.fillText(`만든 날: ${fileDateTime().replace('_', ' ')}`, 80, extra.length ? 740 : 660);
    const jpg = atob(cv.toDataURL('image/jpeg', 0.85).split(',')[1]);
    const ascii = (t) => Uint8Array.from(t, c => c.charCodeAt(0) & 0xff);
    const chunks = [], offsets = []; let len = 0;
    const put = (bytes) => { chunks.push(bytes); len += bytes.length; };
    const obj = (n, head, streamBytes) => {
        offsets[n] = len;
        if (!streamBytes) { put(ascii(`${n} 0 obj\n${head}\nendobj\n`)); return; }
        put(ascii(`${n} 0 obj\n${head.replace('LEN', streamBytes.length)}\nstream\n`)); put(streamBytes); put(ascii('\nendstream\nendobj\n'));
    };
    const pageW = 595, pageH = 842, imgW = 515, imgH = imgW * H / W;
    // 쪽마다 [페이지, 내용, 그림] 세 개씩: 1쪽은 안내 그림(위쪽), 2쪽부터는 A4 한 장 그대로
    const pages = [{ w: W, h: H, jpg, draw: `q ${imgW} 0 0 ${imgH.toFixed(1)} 40 ${(pageH - 40 - imgH).toFixed(1)} cm /Im1 Do Q` }]
        .concat(extra.map(p => ({ ...p, draw: `q ${pageW} 0 0 ${pageH} 0 0 cm /Im1 Do Q` })));
    const pageNo = (k) => 3 + k * 3, dataNo = 3 + pages.length * 3, size = dataNo + 1;
    put(ascii('%PDF-1.4\n'));
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, `<< /Type /Pages /Kids [${pages.map((_, k) => `${pageNo(k)} 0 R`).join(' ')}] /Count ${pages.length} >>`);
    pages.forEach((p, k) => {
        const n = pageNo(k);
        obj(n, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im1 ${n + 2} 0 R >> >> /Contents ${n + 1} 0 R >>`);
        obj(n + 1, '<< /Length LEN >>', ascii(p.draw));
        obj(n + 2, `<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length LEN >>`, ascii(p.jpg));
    });
    // 백업 내용: 페이지에 연결하지 않은 별도 스트림 (PDF 보기 앱은 무시하고, 이 앱의 불러오기만 찾아 쓴다)
    obj(dataNo, '<< /Length LEN >>', new TextEncoder().encode(`${BACKUP_PDF_BEGIN}\n${json}\n${BACKUP_PDF_END}`));
    const xref = len;
    put(ascii(`xref\n0 ${size}\n0000000000 65535 f \n${offsets.slice(1, size).map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
    return new Blob(chunks, { type: 'application/pdf' });
}

// ── 백업 PDF의 '사람이 읽는 쪽' (v1 backupReadablePages + 인쇄 [사진 지도 · 전체]와 같은 그림, 5px/mm · 잉크 절약 없이)
//    앱이 바뀌거나 없어져도 이 PDF만 열면 물건 자리가 보인다 (정리 인계물·서비스 종료 대비). 그리다 실패하면 안내 한 장만
//    사진은 화면을 열 때 미리 읽어 둔다 (보내기 창은 누른 직후에만 열려서, 누른 뒤엔 기다리지 않고 바로 그린다)
const imgs = new Map();
function preloadImages() { vis().forEach(p => { if (!p.imgData) return; const k = String(p.id), o = imgs.get(k); if (o && o.src === p.imgData) return; const im = new Image(); im.src = p.imgData; imgs.set(k, im); }); }
const readyImg = (p) => { const im = imgs.get(String(p.id)); return im && im.complete && im.naturalWidth ? im : null; };
const PRINT = { pageWmm: 210, pageHmm: 297, marginMm: 14, pxPerMm: 5, ink: '#1a1a18', sub: '#6b6960', line: '#e0dbd0' };
function printPx(mm) { return Math.round(mm * PRINT.pxPerMm); }
function printHeadDate(dateStr) { const n = storeName(); return n ? `${n} · ${dateStr}` : dateStr; }
function backupReadablePages() {
    const ps = vis().map(p => ({ title: p.title, zones: p.zones, img: readyImg(p), cw: 800, ch: Math.trunc(h800(p)) })); // v1 캔버스: 가로 800 · 세로는 사진 비율
    if (!ps.some(d => d.zones.some(z => z.items && z.items.length))) return [];
    try {
        const ds = printDateStr(), multi = ps.length > 1, urls = [];
        if (multi) urls.push(...buildMasterIndexPages(ps, ds));
        ps.forEach((d, i) => urls.push(...buildPrintPages(d, i, ds, multi ? photoLetter(i) : null)));
        const w = printPx(PRINT.pageWmm), h = printPx(PRINT.pageHmm);
        return urls.map(u => ({ w, h, jpg: atob(String(u).split(',')[1]) }));
    } catch (e) { return []; }
}
function wrapCanvasText(ctx, text, maxW) { // 폭에 맞춰 줄 나누기 (한글은 글자 단위로도)
    const words = text.split(/(\s+)/).filter(w => w !== '');
    const lines = []; let line = '';
    const pushHard = (chunk) => { let c = ''; for (const ch of chunk) { if (c && ctx.measureText(c + ch).width > maxW) { lines.push(c); c = ch; } else c += ch; } return c; };
    for (const word of words) {
        const attempt = line + word;
        if (ctx.measureText(attempt).width <= maxW) { line = attempt; continue; }
        if (line) lines.push(line);
        line = ctx.measureText(word).width > maxW ? pushHard(word) : word;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
}
function drawSafeRoundRect(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === 'function') { ctx.roundRect(x, y, w, h, r); } else {
        ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    }
}
function drawPrintBadge(ctx, cx, cy, r, text) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = PRINT.ink; ctx.fill(); ctx.lineWidth = printPx(0.35); ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(r * (text.length > 1 ? 1.0 : 1.2))}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, cx, cy + 1);
}
function layoutPrintNote(ctx, z, zw, zh, fsMm) { // 칸 높이에 다 들어가면 전부, 모자라면 앞에서부터 + "+N개 더"
    const fs = printPx(fsMm), lh = Math.round(fs * 1.3), padX = printPx(1.6), padY = printPx(1.1), inset = printPx(2.4);
    const maxW = zw - inset - printPx(1) - padX * 2, maxH = zh - inset - printPx(1) - padY * 2;
    ctx.font = `600 ${fs}px sans-serif`;
    const wrapName = (t) => wrapCanvasText(ctx, t, Math.max(fs, maxW));
    const names = z.items.map(it => it.name), n = names.length;
    const build = (k) => { const lines = []; names.slice(0, k).forEach(t => wrapName(t).forEach((l, i) => lines.push({ t: l, cont: i > 0 }))); if (k < n) lines.push({ t: `+${n - k}개 더`, more: true }); return lines; };
    for (let k = n; k >= 1; k--) { const lines = build(k); if (lines.length * lh <= maxH) return { fs, lh, padX, padY, inset, lines, fit: k === n }; }
    let t = names[0]; const tail = n > 1 ? ` +${n - 1}` : '';
    while (t.length > 1 && ctx.measureText(t + '…' + tail).width > maxW) t = t.slice(0, -1);
    if (t !== names[0]) t += '…';
    return { fs, lh, padX, padY, inset, lines: [{ t: t + tail }], fit: false };
}
function drawPrintPhoto(ctx, d, x, y, w) { // 사진 + 칸마다 노란 쪽지(물건 이름) + 구석에 칸 번호
    const scale = w / d.cw, h = d.ch * scale;
    ctx.save();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, h);
    if (d.img) { try { ctx.drawImage(d.img, x, y, w, h); } catch (e) {} }
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const badgeR = printPx(2.6);
    d.zones.forEach((z) => {
        const zx = x + z.x * scale, zy = y + z.y * scale, zw = z.w * scale, zh = z.h * scale;
        ctx.lineWidth = printPx(0.6); ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.strokeRect(zx, zy, zw, zh);
        ctx.lineWidth = printPx(0.25); ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.strokeRect(zx, zy, zw, zh);
    });
    d.zones.forEach((z, i) => {
        const zx = x + z.x * scale, zy = y + z.y * scale, zw = z.w * scale, zh = z.h * scale, num = String(i + 1);
        if (!z.items.length) { drawPrintBadge(ctx, zx + badgeR + printPx(1.2), zy + badgeR + printPx(1.2), badgeR, num); return; }
        let L = layoutPrintNote(ctx, z, zw, zh, 3.8);
        if (!L.fit) { const s2 = layoutPrintNote(ctx, z, zw, zh, 3.1); if (s2.fit || s2.lines.length > L.lines.length) L = s2; }
        ctx.font = `600 ${L.fs}px sans-serif`;
        const textW = Math.max(...L.lines.map(l => ctx.measureText(l.t).width + (l.cont ? L.fs * 0.6 : 0)));
        const nw = Math.min(zw - L.inset - printPx(1), textW + L.padX * 2), nh = L.lines.length * L.lh + L.padY * 2;
        const nx = zx + L.inset, ny = zy + L.inset + (L.lines.length === 1 && nh > zh - L.inset ? (zh - nh) / 2 - L.inset : 0);
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = printPx(1.2); ctx.shadowOffsetY = printPx(0.4);
        ctx.fillStyle = '#fff3a3'; ctx.beginPath(); drawSafeRoundRect(ctx, nx, ny, nw, nh, printPx(0.8)); ctx.fill();
        ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.rect(nx, ny, nw, nh); ctx.clip();
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        L.lines.forEach((l, li) => {
            ctx.font = `${l.more ? 500 : 600} ${L.fs}px sans-serif`; ctx.fillStyle = l.more ? '#7a6a1e' : '#2b2716';
            ctx.fillText(l.t, nx + L.padX + (l.cont ? L.fs * 0.6 : 0), ny + L.padY + L.lh * (li + 0.5) + 1);
        });
        ctx.restore();
        drawPrintBadge(ctx, Math.max(x + badgeR, nx - printPx(0.6)), Math.max(y + badgeR, ny - printPx(0.6)), badgeR, num);
    });
    ctx.restore();
    return h;
}
// 종이에는 검색이 없으니 책 뒤의 찾아보기처럼: 물건 가나다순, 오른쪽에 칸 번호
const CHO = ['ㄱ', 'ㄱ', 'ㄴ', 'ㄷ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅂ', 'ㅅ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
function indexInitial(name) {
    const c = name.trim().charCodeAt(0) - 0xAC00;
    if (c >= 0 && c < 11172) return CHO[Math.floor(c / 588)];
    const ch = name.trim().charAt(0).toUpperCase();
    return /[A-Z]/.test(ch) ? ch : /[0-9]/.test(ch) ? '0-9' : '기타';
}
function printIndexEntries(data) {
    const map = new Map();
    data.zones.forEach((z, zi) => z.items.forEach(it => {
        const key = it.name.trim(); if (!key) return;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push({ num: zi + 1, comment: (it.comment || '').trim() });
    }));
    return [...map.entries()].map(([name, at]) => ({ name, at: at.sort((a, b) => a.num - b.num) })).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}
function photoLetter(i) { return i < 26 ? String.fromCharCode(65 + i) : `P${i + 1}`; }
function buildPrintPages(data, index, dateStr, letter) { // 한 사진: 첫 쪽에 제목·쪽지 사진, 아래(넘치면 다음 쪽)에 2단 '물건 찾아보기'
    const pageW = printPx(PRINT.pageWmm), pageH = printPx(PRINT.pageHmm), margin = printPx(PRINT.marginMm);
    const contentW = pageW - margin * 2, colGap = printPx(8), colW = (contentW - colGap) / 2;
    const meas = document.createElement('canvas').getContext('2d');
    const titleFont = `bold ${printPx(7)}px sans-serif`, dateFont = `${printPx(3.6)}px sans-serif`;
    const secFont = `bold ${printPx(4.4)}px sans-serif`, initFont = `bold ${printPx(3.4)}px sans-serif`;
    const nameFont = `600 ${printPx(4.2)}px sans-serif`, memoFont = `${printPx(3.2)}px sans-serif`;
    const nameLineH = printPx(5.6), memoLineH = printPx(4.2), rowGap = printPx(1.2), badgeR = printPx(2.5);
    const headH = printPx(12) + printPx(7), footH = printPx(10), secH = printPx(9);
    // 세로 사진은 왼쪽(폭 60%) + 목록 오른쪽 한 단, 정사각에 가까우면 사진 높이를 60%로 줄여 가운데
    const usableH = pageH - margin * 2 - headH - footH, ratio = data.ch / data.cw;
    let layout = 'stack', photoW = contentW, photoH = contentW * ratio, photoX = margin;
    if (photoH > usableH * 0.6) {
        if (ratio >= 1.15) { layout = 'side'; photoW = contentW * 0.6; photoH = photoW * ratio; if (photoH > usableH) { photoH = usableH; photoW = photoH / ratio; } }
        else { photoH = usableH * 0.6; photoW = photoH / ratio; photoX = margin + (contentW - photoW) / 2; }
    }
    const sideX = margin + photoW + colGap, sideW = contentW - photoW - colGap;
    const rowW = layout === 'side' ? Math.min(sideW, colW) : colW;
    const gutter = printPx(6), groupGap = printPx(2.2);
    const entries = printIndexEntries(data), rows = [];
    let lastInit = null;
    entries.forEach(e => {
        const init = indexInitial(e.name), first = init !== lastInit; lastInit = init;
        const badgesW = e.at.length > 0 ? [...new Set(e.at.map(a => a.num))].length * (badgeR * 2 + printPx(1)) : 0;
        meas.font = nameFont; const nameLines = wrapCanvasText(meas, e.name, rowW - gutter - badgesW - printPx(6));
        meas.font = memoFont;
        const memos = e.at.filter(a => a.comment).flatMap(a => wrapCanvasText(meas, (e.at.length > 1 ? `${a.num}번: ` : '') + a.comment, rowW - gutter - printPx(4)));
        rows.push({ type: 'item', e, init: first ? init : null, nameLines, memos, nums: [...new Set(e.at.map(a => a.num))], h: (first && rows.length ? groupGap : 0) + nameLines.length * nameLineH + memos.length * memoLineH + rowGap });
    });
    if (!rows.length) rows.push({ type: 'empty', h: nameLineH });
    const pages = [];
    let page = { photo: true, cols: [[], []] }, col = 0;
    const sideNow = () => page.photo && layout === 'side';
    const top0 = () => margin + headH + (page.photo && !sideNow() ? photoH + printPx(8) : 0) + secH;
    let y = top0();
    const limitY = pageH - margin - footH;
    rows.forEach((row) => {
        if (y + row.h > limitY) {
            if (col === 0 && !sideNow()) { col = 1; y = top0(); }
            else { pages.push(page); page = { photo: false, cols: [[], []] }; col = 0; y = top0(); }
        }
        page.cols[col].push(row); y += row.h;
    });
    pages.push(page);
    return pages.map((pg, pgi) => {
        const canvas = document.createElement('canvas'); canvas.width = pageW; canvas.height = pageH;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, pageW, pageH);
        let cy = margin;
        ctx.textBaseline = 'alphabetic';
        ctx.font = titleFont; ctx.fillStyle = PRINT.ink; ctx.textAlign = 'left';
        ctx.fillText((letter ? `${letter} · ` : '') + (data.title || `#${index + 1}`) + (pages.length > 1 ? ` (${pgi + 1}/${pages.length})` : ''), margin, cy + printPx(7));
        ctx.font = dateFont; ctx.fillStyle = PRINT.sub; ctx.textAlign = 'right';
        ctx.fillText(printHeadDate(dateStr), pageW - margin, cy + printPx(7));
        cy += printPx(12);
        ctx.strokeStyle = PRINT.ink; ctx.lineWidth = printPx(0.6); ctx.beginPath(); ctx.moveTo(margin, cy); ctx.lineTo(pageW - margin, cy); ctx.stroke();
        cy += printPx(7);
        const side = pg.photo && layout === 'side';
        if (pg.photo) { drawPrintPhoto(ctx, data, photoX, cy, photoW); if (!side) cy += photoH + printPx(8); }
        const listX = side ? sideX : margin;
        ctx.font = secFont; ctx.fillStyle = PRINT.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('물건 찾아보기', listX, cy + printPx(5));
        const secW = ctx.measureText('물건 찾아보기').width;
        ctx.font = dateFont; ctx.fillStyle = PRINT.sub;
        ctx.fillText(side ? '숫자 = 사진 속 번호' : '가나다순 · 오른쪽 숫자 = 사진 속 구역 번호', listX + secW + printPx(3), cy + printPx(5));
        cy += secH;
        const cw = side ? sideW : colW;
        pg.cols.forEach((list, ci) => {
            const x0 = listX + ci * (colW + colGap);
            let ry = cy;
            list.forEach(row => {
                if (row.type === 'empty') {
                    ctx.font = nameFont; ctx.fillStyle = PRINT.sub; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
                    ctx.fillText('아직 적은 물건이 없어요', x0, ry + nameLineH - printPx(1.4)); ry += row.h; return;
                }
                const rowTop = ry;
                const ini = row.init || (ry === cy ? indexInitial(row.e.name) : null); // 단이 바뀌면 단 맨 위에 첫소리를 한 번 더
                if (ini) {
                    if (row.init && ry > cy) { ry += groupGap; ctx.strokeStyle = PRINT.line; ctx.lineWidth = printPx(0.25); ctx.beginPath(); ctx.moveTo(x0, ry - groupGap / 2); ctx.lineTo(x0 + cw, ry - groupGap / 2); ctx.stroke(); }
                    ctx.font = initFont; ctx.fillStyle = '#a08a2a'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
                    ctx.fillText(ini, x0, ry + nameLineH - printPx(1.6));
                }
                const nx0 = x0 + gutter;
                ctx.font = nameFont; ctx.fillStyle = PRINT.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
                row.nameLines.forEach((line, li) => ctx.fillText(line, nx0, ry + nameLineH * (li + 1) - printPx(1.4)));
                const lastW = ctx.measureText(row.nameLines[row.nameLines.length - 1]).width;
                const by = ry + nameLineH * (row.nameLines.length - 0.5);
                let bx = x0 + cw - badgeR;
                [...row.nums].reverse().forEach(nm => { drawPrintBadge(ctx, bx, by, badgeR, String(nm)); bx -= badgeR * 2 + printPx(1); });
                const dotFrom = nx0 + lastW + printPx(2), dotTo = bx + badgeR - printPx(1);
                if (dotTo - dotFrom > printPx(3)) {
                    ctx.save(); ctx.strokeStyle = '#b9b4aa'; ctx.lineWidth = printPx(0.35); ctx.setLineDash([printPx(0.4), printPx(1.2)]); ctx.lineCap = 'round';
                    ctx.beginPath(); ctx.moveTo(dotFrom, by + printPx(0.8)); ctx.lineTo(dotTo, by + printPx(0.8)); ctx.stroke(); ctx.restore();
                }
                const my = ry + row.nameLines.length * nameLineH;
                ctx.font = memoFont; ctx.fillStyle = PRINT.sub; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
                row.memos.forEach((m, mi) => ctx.fillText(m, nx0 + printPx(3), my + memoLineH * (mi + 1) - printPx(1.1)));
                ry = rowTop + row.h - (row.init && rowTop === cy && rows.indexOf(row) > 0 ? groupGap : 0);
            });
        });
        drawPrintFoot(ctx, `${dateStr} · 위치가 바뀌면 앱에서 고치고 다시 뽑아 붙이세요`);
        return canvas.toDataURL('image/jpeg', 0.92);
    });
}
function drawPrintTag(ctx, xRight, cy, text) { // 오른쪽 끝을 xRight에 맞춘 어두운 꼬리표 (A-2), 왼쪽 끝 x를 돌려준다
    ctx.font = `bold ${printPx(3.2)}px sans-serif`;
    const w = ctx.measureText(text).width + printPx(3.2), h = printPx(5.2), x = xRight - w;
    ctx.fillStyle = PRINT.ink; ctx.beginPath(); drawSafeRoundRect(ctx, x, cy - h / 2, w, h, h / 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + w / 2, cy + 1);
    return x;
}
function buildMasterIndexPages(photos, dateStr) { // 사진 여러 장의 물건을 한데 모아 가나다순 (A-2 = A 사진의 2번 칸)
    const pageW = printPx(PRINT.pageWmm), pageH = printPx(PRINT.pageHmm), margin = printPx(PRINT.marginMm);
    const contentW = pageW - margin * 2, colGap = printPx(8), colW = (contentW - colGap) / 2;
    const meas = document.createElement('canvas').getContext('2d');
    const titleFont = `bold ${printPx(7)}px sans-serif`, dateFont = `${printPx(3.6)}px sans-serif`;
    const legendFont = `${printPx(3.6)}px sans-serif`, initFont = `bold ${printPx(3.4)}px sans-serif`;
    const nameFont = `600 ${printPx(4.2)}px sans-serif`, memoFont = `${printPx(3.2)}px sans-serif`;
    const nameLineH = printPx(5.6), memoLineH = printPx(4.2), rowGap = printPx(1.2), gutter = printPx(6), groupGap = printPx(2.2);
    const headH = printPx(12) + printPx(6), footH = printPx(10);
    meas.font = legendFont;
    const legendItems = photos.map((d, i) => `${photoLetter(i)}  ${d.title || `#${i + 1}`}`);
    const legendLines = []; let line = [], lw = 0;
    legendItems.forEach(t => { const w = meas.measureText(t).width + printPx(9); if (line.length && lw + w > contentW) { legendLines.push(line); line = []; lw = 0; } line.push(t); lw += w; });
    if (line.length) legendLines.push(line);
    const legendH = legendLines.length * printPx(6.4) + printPx(5);
    const map = new Map();
    photos.forEach((d, pi) => d.zones.forEach((z, zi) => z.items.forEach(it => {
        const key = it.name.trim(); if (!key) return;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push({ tag: `${photoLetter(pi)}-${zi + 1}`, comment: (it.comment || '').trim() });
    })));
    const entries = [...map.entries()].map(([name, at]) => ({ name, at })).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    meas.font = `bold ${printPx(3.2)}px sans-serif`;
    const tagW = (t) => meas.measureText(t).width + printPx(3.2);
    const rows = []; let lastInit = null;
    entries.forEach(e => {
        const init = indexInitial(e.name), first = init !== lastInit; lastInit = init;
        const tags = [...new Set(e.at.map(a => a.tag))];
        const tagsW = tags.reduce((w, t) => w + tagW(t) + printPx(1.2), 0);
        meas.font = nameFont; const nameLines = wrapCanvasText(meas, e.name, Math.max(printPx(20), colW - gutter - tagsW - printPx(6)));
        meas.font = memoFont;
        const memos = e.at.filter(a => a.comment).flatMap(a => wrapCanvasText(meas, (tags.length > 1 ? `${a.tag}: ` : '') + a.comment, colW - gutter - printPx(4)));
        meas.font = `bold ${printPx(3.2)}px sans-serif`;
        rows.push({ e, init: first ? init : null, tags, nameLines, memos, h: (first && rows.length ? groupGap : 0) + nameLines.length * nameLineH + memos.length * memoLineH + rowGap });
    });
    if (!rows.length) rows.push({ empty: true, h: nameLineH });
    const pages = []; let page = { first: true, cols: [[], []] }, col = 0;
    const top0 = () => margin + headH + (page.first ? legendH : 0);
    let y = top0(); const limitY = pageH - margin - footH;
    rows.forEach(row => {
        if (y + row.h > limitY) {
            if (col === 0) { col = 1; y = top0(); }
            else { pages.push(page); page = { first: false, cols: [[], []] }; col = 0; y = top0(); }
        }
        page.cols[col].push(row); y += row.h;
    });
    pages.push(page);
    return pages.map((pg, pgi) => {
        const canvas = document.createElement('canvas'); canvas.width = pageW; canvas.height = pageH;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, pageW, pageH);
        let cy = margin;
        ctx.textBaseline = 'alphabetic'; ctx.font = titleFont; ctx.fillStyle = PRINT.ink; ctx.textAlign = 'left';
        ctx.fillText('전체 물건 찾아보기' + (pages.length > 1 ? ` (${pgi + 1}/${pages.length})` : ''), margin, cy + printPx(7));
        ctx.font = dateFont; ctx.fillStyle = PRINT.sub; ctx.textAlign = 'right'; ctx.fillText(printHeadDate(dateStr), pageW - margin, cy + printPx(7));
        cy += printPx(12);
        ctx.strokeStyle = PRINT.ink; ctx.lineWidth = printPx(0.6); ctx.beginPath(); ctx.moveTo(margin, cy); ctx.lineTo(pageW - margin, cy); ctx.stroke();
        cy += printPx(6);
        if (pg.first) { // 사진 기호 목록: [A] 창고 박스 선반   [B] 의류 백룸 선반 …
            ctx.textBaseline = 'middle';
            legendLines.forEach((ln, li) => {
                let x = margin; const ly = cy + printPx(3.2) + li * printPx(6.4);
                ln.forEach(t => {
                    const [letter, ...rest] = t.split('  '), name = rest.join('  ');
                    ctx.font = `bold ${printPx(3.4)}px sans-serif`;
                    const bw = Math.max(printPx(5.4), ctx.measureText(letter).width + printPx(2.4));
                    ctx.fillStyle = PRINT.ink; ctx.beginPath(); drawSafeRoundRect(ctx, x, ly - printPx(2.7), bw, printPx(5.4), printPx(1)); ctx.fill();
                    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(letter, x + bw / 2, ly + 1);
                    ctx.font = legendFont; ctx.fillStyle = PRINT.ink; ctx.textAlign = 'left'; ctx.fillText(name, x + bw + printPx(1.6), ly + 1);
                    x += bw + printPx(1.6) + ctx.measureText(name).width + printPx(6);
                });
            });
            cy += legendH;
            ctx.font = dateFont; ctx.fillStyle = PRINT.sub; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
            ctx.fillText('가나다순 · 오른쪽 A-2 = A 사진의 2번 구역', margin, cy - printPx(1.6));
        }
        pg.cols.forEach((list, ci) => {
            const x0 = margin + ci * (colW + colGap); let ry = cy;
            list.forEach(row => {
                if (row.empty) { ctx.font = nameFont; ctx.fillStyle = PRINT.sub; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText('아직 적은 물건이 없어요', x0, ry + nameLineH - printPx(1.4)); ry += row.h; return; }
                const rowTop = ry, ini = row.init || (ry === cy ? indexInitial(row.e.name) : null);
                if (ini) {
                    if (row.init && ry > cy) { ry += groupGap; ctx.strokeStyle = PRINT.line; ctx.lineWidth = printPx(0.25); ctx.beginPath(); ctx.moveTo(x0, ry - groupGap / 2); ctx.lineTo(x0 + colW, ry - groupGap / 2); ctx.stroke(); }
                    ctx.font = initFont; ctx.fillStyle = '#a08a2a'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(ini, x0, ry + nameLineH - printPx(1.6));
                }
                const nx0 = x0 + gutter;
                ctx.font = nameFont; ctx.fillStyle = PRINT.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
                row.nameLines.forEach((l, li) => ctx.fillText(l, nx0, ry + nameLineH * (li + 1) - printPx(1.4)));
                const lastW = ctx.measureText(row.nameLines[row.nameLines.length - 1]).width, by = ry + nameLineH * (row.nameLines.length - 0.5);
                let xr = x0 + colW;
                [...row.tags].reverse().forEach(t => { xr = drawPrintTag(ctx, xr, by, t) - printPx(1.2); });
                const dotFrom = nx0 + lastW + printPx(2), dotTo = xr - printPx(0.8);
                if (dotTo - dotFrom > printPx(3)) {
                    ctx.save(); ctx.strokeStyle = '#b9b4aa'; ctx.lineWidth = printPx(0.35); ctx.setLineDash([printPx(0.4), printPx(1.2)]); ctx.lineCap = 'round';
                    ctx.beginPath(); ctx.moveTo(dotFrom, by + printPx(0.8)); ctx.lineTo(dotTo, by + printPx(0.8)); ctx.stroke(); ctx.restore();
                }
                const my = ry + row.nameLines.length * nameLineH;
                ctx.font = memoFont; ctx.fillStyle = PRINT.sub; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
                row.memos.forEach((m, mi) => ctx.fillText(m, nx0 + printPx(3), my + memoLineH * (mi + 1) - printPx(1.1)));
                ry = rowTop + row.h - (row.init && rowTop === cy && rows.indexOf(row) > 0 ? groupGap : 0);
            });
        });
        drawPrintFoot(ctx, `${dateStr} · ${useMode() === 'home' ? '방 입구' : '창고 입구'}에 붙여 두세요 · 위치가 바뀌면 앱에서 고치고 다시 뽑기`);
        return canvas.toDataURL('image/jpeg', 0.92);
    });
}
// 아래 안내 줄 + 오른쪽 아래 작은 QR('이 종이를 만든 앱'). 무늬는 v1과 같다 (인터넷 없이도 그려지게 미리 만든 것 · objetdo/qr/ 주소)
const PRINT_QR = ['1fc39e27f', '1046e9441', '175f9d35d', '175651d5d', '1752ac15d', '105239541', '1fd55557f', '001064d00', '17c4e847c', '16a507a6d', '017f259d6', '0c9843edf', '147524b3b', '172071547', '02c7ca4e2', '130993acc', '14480a7b1', '10b79f26d', '14dcf95f6', '0d3afc1ff', '0c6eb1fbb', '19ac2cbc1', '147a75562', '12be20f4f', '11f8385f1', '001b13915', '1fcc24b54', '105422f1f', '1750849fb', '1755b1e9d', '175ec2a6c', '104057e1c', '1fdc4b7aa'];
let printQrBits = null;
function drawPrintQr(ctx) { // 오른쪽 아래 구석에 그리고 QR 왼쪽 끝 x를 돌려준다
    if (!printQrBits) printQrBits = PRINT_QR.map(h => h.split('').map(c => parseInt(c, 16).toString(2).padStart(4, '0')).join('').slice(-PRINT_QR.length));
    const n = printQrBits.length, cell = Math.max(1, Math.round(0.6 * PRINT.pxPerMm)), size = n * cell;
    const x0 = printPx(PRINT.pageWmm) - printPx(PRINT.marginMm) - size, y0 = printPx(PRINT.pageHmm) - printPx(4.5) - size;
    ctx.fillStyle = '#000000';
    printQrBits.forEach((row, r) => { for (let c = 0; c < n; c++) if (row[c] === '1') ctx.fillRect(x0 + c * cell, y0 + r * cell, cell, cell); });
    return x0;
}
function drawPrintFoot(ctx, text) {
    const pageH = printPx(PRINT.pageHmm), m = printPx(PRINT.marginMm), base = pageH - m - printPx(1);
    const right = drawPrintQr(ctx) - printPx(3);
    ctx.strokeStyle = PRINT.line; ctx.lineWidth = printPx(0.3); ctx.beginPath(); ctx.moveTo(m, pageH - m - printPx(7)); ctx.lineTo(right, pageH - m - printPx(7)); ctx.stroke();
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'right';
    ctx.font = `bold ${printPx(3.2)}px sans-serif`; ctx.fillStyle = PRINT.ink; ctx.fillText(APP_NAME, right, base); const brandW = ctx.measureText(APP_NAME).width;
    ctx.font = `${printPx(2.6)}px sans-serif`; ctx.fillStyle = PRINT.sub; ctx.fillText('이 종이를 만든 앱 · QR로 열기', right, base + printPx(4.5));
    const leftW = Math.max(printPx(40), right - m - brandW - printPx(4));
    const org = organizerName(); ctx.textAlign = 'left';
    if (org) { // 정리 업체가 있으면 위 "정리 · 업체", 아래 작은 안내
        ctx.font = `bold ${printPx(3.2)}px sans-serif`; ctx.fillStyle = PRINT.ink; ctx.fillText(`정리 · ${org}`, m, base, leftW);
        ctx.font = `${printPx(2.6)}px sans-serif`; ctx.fillStyle = PRINT.sub; ctx.fillText(text, m, base + printPx(4.5), leftW);
        return;
    }
    ctx.font = `${printPx(3.2)}px sans-serif`; ctx.fillStyle = PRINT.sub;
    ctx.fillText(text, m, base, leftW);
}

// ────────────────────────────────────────────────────────────
// 백업 파일로 복구 (v1 importSystemData와 같은 검사·같은 키). 확인은 알림창 대신 아래 창으로, 끝나면 저장을 기다렸다가 처음 화면으로 다시 연다
// ────────────────────────────────────────────────────────────
const fileIn = document.createElement('input');
fileIn.type = 'file'; fileIn.id = 'stRestoreFile'; fileIn.hidden = true; fileIn.tabIndex = -1; fileIn.setAttribute('aria-hidden', 'true');
document.body.appendChild(fileIn);
fileIn.addEventListener('change', () => readRestoreFile(fileIn));
let pendingRestore = null;
function pickRestore() { closeSheet(); fileIn.click(); }
function readRestoreFile(input) {
    const file = input.files[0]; if (!file) return;
    input.value = ''; // 같은 파일을 다시 골라도 되게
    const reader = new FileReader();
    reader.onload = (e) => {
        let imported = null; try { imported = JSON.parse(extractBackupText(String(e.target.result))); } catch (err) {}
        if (!imported || !Array.isArray(imported.savedSystemData) || !imported.baseItems) { restoreFail(`${APP_NAME} 백업 파일이 아니거나 파일이 손상됐어요. ‘${APP_NAME}_백업_…pdf’ 파일을 골라 주세요.`); return; }
        askRestore(imported);
    };
    reader.onerror = () => restoreFail('파일을 읽지 못했어요. 다시 골라 주세요.');
    reader.readAsText(file);
}
function restoreFail(msg) {
    openSheet(`<span class="kick st-red">복구하지 못했어요</span><h2>이 파일로는 복구할 수 없어요</h2><p>${esc(msg)}</p>
        <div class="stack"><button type="button" class="btn btn-p" data-act="stRestore">다른 파일 고르기</button><button type="button" class="btn btn-s" data-act="sheetClose">닫기</button></div>`);
}
function askRestore(imported) {
    pendingRestore = imported;
    const ps = imported.savedSystemData.filter(p => p && p.id !== 'dummy_root' && Array.isArray(p.zones));
    const items = ps.reduce((n, p) => n + p.zones.reduce((m, z) => m + (Array.isArray(z && z.items) ? z.items.length : 0), 0), 0);
    const t = imported.exportedAt ? new Date(imported.exportedAt) : null;
    const when = t && !isNaN(t) ? ` · ${t.getFullYear()}.${p2(t.getMonth() + 1)}.${p2(t.getDate())} ${p2(t.getHours())}:${p2(t.getMinutes())} 백업` : '';
    openSheet(`<span class="kick">백업 파일로 복구</span>
        <h2>백업 파일로 복구할까요?</h2>
        <p>지금 이 ${DEV}에 있는 사진·구역·물건이 모두 백업 파일 내용으로 바뀌어요.</p>
        <p class="st-sum">백업 파일: 사진 ${ps.length}장 · 물건 ${items}개${when}${ps.length ? '' : '<small class="st-red">사진이 없는 백업이에요 · 복구하면 지도가 비어요</small>'}${vis().length && !SAMPLE ? `<small>지금 이 ${DEV}: 사진 ${vis().length}장 · 물건 ${counts().items}개</small>` : ''}</p>
        <div class="stack"><button type="button" class="btn btn-p" data-act="stRestoreGo">복구하기</button><button type="button" class="btn btn-s" data-act="sheetClose">취소</button></div>`, () => { if (!restoring) pendingRestore = null; });
}
function writePhotoData(json) { // v1 safeStorage.setItem('savedSystemData', …)와 같은 곳 (IndexedDB, 없으면 localStorage)
    if (store.db) { store.write(json); return true; }
    try { localStorage.setItem(PHOTO_DATA_KEY, json); lsSet('hasSavedPhotos', json && json !== '[]' ? '1' : ''); return true; } catch (e) { return false; }
}
function reloadHome() { // 쓰던 저장을 끝낸 뒤 처음(찾기) 화면으로 다시 연다
    Promise.resolve(store.pending).catch(() => {}).then(() => { history.replaceState(null, '', location.pathname + '#/'); location.reload(); });
}
let restoring = false;
async function doRestore(btn) {
    const imported = pendingRestore; if (!imported || restoring) return;
    restoring = true; if (btn) { btn.disabled = true; btn.textContent = '복구하는 중…'; }
    flushPending(); // 늦게 도는 저장이 복구한 데이터를 덮어쓰지 않게
    if (SAMPLE) { try { sessionStorage.removeItem('samplePreview'); } catch (e) {} SAMPLE = null; } // 예시를 보다가 복구해도 진짜 데이터로
    if (!store.db) await store.init(); // 예시를 보는 동안엔 저장소를 안 열었다
    if (!writePhotoData(JSON.stringify(imported.savedSystemData))) { restoring = false; closeSheet(); toast('저장 공간이 부족해 복구하지 못했어요'); return; }
    lsSet('baseItems', JSON.stringify(imported.baseItems));
    if (Array.isArray(imported.stockLog)) lsSet('stockLog', JSON.stringify(imported.stockLog)); else lsDel('stockLog'); // 예전 백업엔 없음
    if (typeof imported.organizerName === 'string' && imported.organizerName.trim()) setOrganizerName(imported.organizerName); // 업체가 넘겨준 백업이면 업체 이름도 남게
    if (useMode() === 'home' && ls('simpleView') === null) lsSet('simpleView', '1'); // v1: 집 모드에서 받은 지도는 찾기만 화면으로 (직접 바꾼 적이 있으면 그대로)
    if (Array.isArray(imported.inboxItems)) lsSet('inboxItems', JSON.stringify(imported.inboxItems)); else lsDel('inboxItems');
    lsDel('isSampleData'); // 예시를 불러온 적 있는 폰에서 복구한 데이터가 예시로 취급되지 않게
    lsSet('lastBackupAt', String(Date.now())); lsSet('dataChangedAt', '0');
    reloadHome();
}

// ────────────────────────────────────────────────────────────
// 모든 데이터 지우기 (v1 resetAll·wipeAllData): 사진·구역·물건과 딸린 기록만 지운다 (쓰는 곳·기능·글자 크기·업체 이름 같은 설정은 남김)
// ────────────────────────────────────────────────────────────
const WIPE_KEYS = ['savedSystemData', 'baseItems', 'isSampleData', 'industry', 'industryAsked', 'lastBackupAt', 'dataChangedAt', 'backupBannerHiddenUntil', 'usageStats', 'searchHistory', 'searchPickCounts', 'findLog', 'inboxItems'];
function resetAll(withBackup) {
    if (SAMPLE || !hasSaved()) return;
    if (withBackup) {
        exportSystemData();
        // 파일이 실제로 저장됐는지 본 뒤에 지운다 (내려받기가 막히면 데이터만 사라지는 일이 없게)
        setTimeout(() => openSheet(`<span class="kick st-red">되돌릴 수 없어요</span><h2>백업 파일이 저장됐는지 확인해 주세요</h2><p>확인을 누르면 이 ${DEV}의 데이터를 모두 지워요.</p>
            <div class="stack"><button type="button" class="btn btn-p" data-act="stWipe">확인, 지우기</button><button type="button" class="btn btn-s" data-act="sheetClose">취소</button></div>`), 800);
        return;
    }
    openSheet(`<span class="kick st-red">되돌릴 수 없어요</span><h2>정말 지울까요?</h2><p>백업이 없으면 되살릴 수 없어요.</p>
        <div class="stack"><button type="button" class="btn btn-s st-danger" data-act="stWipe">지우기</button><button type="button" class="btn btn-p" data-act="sheetClose">취소</button></div>`);
}
function wipeAllData(btn) {
    if (SAMPLE) return;
    if (btn) { btn.disabled = true; btn.textContent = '지우는 중…'; }
    flushPending(); // 늦게 도는 저장이 지운 뒤에 다시 쓰지 않게
    WIPE_KEYS.forEach(k => lsDel(k)); // savedSystemData는 옛 기기(localStorage)용
    if (store.db) { // v1 photoStore.write(null)와 같게: 키를 지우고 '데이터 있음' 표시도 끈다
        store.cache = null; lsSet('hasSavedPhotos', '');
        store.pending = Promise.resolve(store.pending).catch(() => {}).then(() => store.tx('readwrite', s => s.delete(PHOTO_DATA_KEY))).catch(() => {});
    } else lsSet('hasSavedPhotos', '');
    reloadHome();
}

// ────────────────────────────────────────────────────────────
// #/backup 백업·복구
// ────────────────────────────────────────────────────────────
function agoDays(ts) { const d = Math.floor((Date.now() - ts) / 86400000); return d < 1 ? '오늘' : `${d}일 전`; }
function iphoneWarn() { // 아이폰 사파리는 한동안 안 열면 사이트가 저장한 걸 지울 수 있다 (홈 화면 앱은 예외)
    if (isInstalled()) return '';
    return `<div class="st-warn" role="note"><b>아이폰 사파리는 오래 안 열면 지도가 지워질 수 있어요.</b> 백업 → 홈 화면에 추가 → 앱에서 복구<br><button type="button" data-act="go" data-to="#/iphone">아이폰 안내 보기 →</button></div>`;
}
function renderBackup() {
    const el = screen('backup', '백업·복구'), [lab, fb] = backOf('backup', ['설정', '#/settings']);
    preloadImages();
    const n = counts(), last = lastBackupAt(), due = backupDue();
    const t = last ? new Date(last) : null;
    el.innerHTML = `
        <header class="top">${backBtn(lab, fb)}</header>
        <main class="wrap st-main">
            <span class="kick st-kick">백업</span>
            <h1 class="h1 st-title">백업·복구</h1>
            <p class="st-lead">사진·구역·물건은 ${DEV_HERE}에만 있어요. 백업 파일을 받아 두면 ${DEV_OBJ} 바꾸거나 지워져도 되살릴 수 있어요.</p>
            <ul class="st-facts">
                <li><span class="st-k">마지막 백업</span><span><b class="${!last || due ? 'st-red' : ''}">${last ? agoDays(last) : '아직 없음'}</b>${t ? `<small>${t.getMonth() + 1}월 ${t.getDate()}일 ${p2(t.getHours())}:${p2(t.getMinutes())}${due ? ' · 그 뒤로 바뀐 게 있어요' : ''}</small>` : ''}</span></li>
                <li><span class="st-k">${SAMPLE ? '지금 보는 예시' : `이 ${DEV}에 있는 것`}</span><span>${n.photos ? `사진 ${n.photos}장 · 구역 ${n.zones}개 · 물건 ${n.items}개` : '아직 사진이 없어요'}</span></li>
            </ul>
            ${iphoneWarn()}
            <div class="st-cta">
                ${SAMPLE ? `<p class="st-fine">지금은 예시를 보고 있어요. 예시는 백업하지 않아요 · 예시를 닫으면 내 지도를 백업할 수 있어요.</p>` : ''}
                <p class="st-fine">백업 파일은 PDF예요. 열면 복구하는 법과 물건 찾아보기가 보여요. 카톡 ‘나와의 채팅’에 보내 두면 ${DEV_OBJ} 바꿀 때 편해요.<br>복구하면 지금 이 ${DEV}의 사진·구역·물건이 백업 내용으로 바뀌어요.</p>
            </div>
            <div class="dock">${SAMPLE ? `<button type="button" class="btn btn-p" data-act="sampleExit">예시 닫기</button>` : `<button type="button" class="btn btn-p" data-act="stBackup"${n.photos ? '' : ' disabled'}>백업 파일 받기</button>`}<button type="button" class="btn btn-s" data-act="stRestore">파일로 복구</button></div>
        </main>`;
}

// ────────────────────────────────────────────────────────────
// #/data 내 데이터는 어디에 (v1 openDataInfo 표 그대로 + 지금 이 폰에 있는 양)
// ────────────────────────────────────────────────────────────
function renderData() {
    const el = screen('data', '내 데이터는 어디에'), [lab, fb] = backOf('data', ['설정', '#/settings']);
    el.innerHTML = `
        <header class="top">${backBtn(lab, fb)}</header>
        <main class="wrap st-main">
            <h1 class="h1 st-title">내 데이터는<br>어디에 있나요?</h1>
            <p class="st-note">지금 이 ${DEV}: <span id="stDataSum">${esc(summaryLine())}</span></p>
            <div class="st-tbl">
                <div class="st-tr"><span>이 ${DEV}</span><span>사진, 구역, 물건, 메모 전부<small>항상</small></span></div>
                <div class="st-tr"><span>Roboflow<small>미국</small></span><span>사진 1장 (저장하지 않도록 설정)<small>[AI로 구역 찾기]를 누를 때만 · Google 중계 서버를 거쳐 전달</small></span></div>
                <div class="st-tr"><span>Google 폼</span><span>직접 적은 의견<small>[의견 보내기]를 쓸 때만</small></span></div>
                <div class="st-tr"><span>Google 시트<small>사용 통계</small></span><span>앱을 쓴 날짜와 무작위 번호만<small>하루 한 번 · 사진·이름·메모·개수는 보내지 않음 · 설정에서 끌 수 있음</small></span></div>
                <div class="st-tr"><span>Cloudflare<small>방문 통계</small></span><span>이 페이지를 연 기록 (쿠키 없음)<small>몇 명이 들어왔는지 세는 용도</small></span></div>
            </div>
            <p class="st-p">사진·물건 같은 내용은 <b>기본으로 ${DEV_HERE}에만</b> 저장돼요. 같이 보기 같은 기능이 생겨도 <b>직접 켤 때만</b> 서버에 올라가요. ${DEV_OBJ} 바꾸기 전에는 설정에서 백업 파일을 받아 두세요.</p>
            <p class="st-fine">사파리·크롬·카톡 안 브라우저는 저장하는 곳이 따로라, 넣은 곳에서만 보여요. 옮길 땐 <a href="#/backup" data-act="go" data-to="#/backup">백업 파일</a>로 옮겨요.</p>
            <div class="st-cta"><button type="button" class="btn btn-s" data-act="back" data-fb="${esc(fb)}">닫기</button></div>
        </main>`;
    fillUsage('stDataSum', summaryLine() + ' · ');
}

// ────────────────────────────────────────────────────────────
// #/reset 처음부터 다시 (모든 데이터 지우기)
// ────────────────────────────────────────────────────────────
function renderReset() {
    const el = screen('reset', '모든 데이터 지우기'), [lab, fb] = backOf('reset', ['설정', '#/settings']);
    preloadImages();
    const n = counts(), can = hasSaved();
    el.innerHTML = `
        <header class="top">${backBtn(lab, fb)}</header>
        <main class="wrap st-main">
            <span class="kick st-kick st-red">되돌릴 수 없어요</span>
            <h1 class="h1 st-title">${can || SAMPLE ? '모든 데이터를 지울까요?' : '지울 데이터가 없어요'}</h1>
            <p class="st-lead">사진·구역·물건·메모가 이 ${DEV}에서 모두 지워지고 <b>되돌릴 수 없어요.</b> 지우기 전에 백업을 받아 두는 걸 권해요.</p>
            <ul class="st-facts"${can ? '' : ' hidden'}>
                <li><span class="st-k">지워지는 것</span><span>${n.photos && can ? `사진 ${n.photos}장 · 물건 ${n.items}개<small>자리 미정 · 찾은 기록 · 업종</small>` : '—'}</span></li>
                <li><span class="st-k">남는 것</span><span>쓰는 곳 · 기능 켜기 · 글자 크기<small>매장·업체 이름 · 사용 통계 설정</small></span></li>
            </ul>
            <div class="st-cta">
                ${SAMPLE ? `<p class="st-fine">지금은 예시를 보고 있어요. 예시를 닫은 뒤에 지울 수 있어요.</p><button type="button" class="btn btn-p" data-act="sampleExit">예시 닫기</button>`
                    : can ? `<button type="button" class="btn btn-p" data-act="stResetBk">백업 받고 지우기</button><button type="button" class="btn btn-s st-danger" data-act="stResetNo">백업 없이 지우기</button>`
                    : `<p class="st-fine">이 ${DEV}엔 지울 사진이 없어요.</p>`}
                <button type="button" class="tlink" data-act="back" data-fb="${esc(fb)}">취소</button>
            </div>
        </main>`;
}

// ────────────────────────────────────────────────────────────
// #/iphone 아이폰은 먼저 홈 화면에 추가 (v1 openIosInstall · 설치 띠의 말 그대로)
// ────────────────────────────────────────────────────────────
function renderIphone() {
    const el = screen('iphone', '아이폰 홈 화면에 추가'), [lab, fb] = backOf('iphone', ['설정', '#/settings']);
    const inst = isInstalled(), has = vis().length > 0 && !SAMPLE;
    el.innerHTML = `
        <header class="top">${backBtn(lab, fb)}</header>
        <main class="wrap st-main">
            <span class="kick st-kick">${inst ? '홈 화면 앱' : '처음 한 번만'}</span>
            <h1 class="h1 st-title">${inst ? '홈 화면 앱으로 쓰고 계세요' : '아이폰은 먼저 홈 화면에 추가하세요'}</h1>
            ${inst ? `<p class="st-lead">사파리에서 쓰던 게 있으면: 사파리에서 백업 → 여기 설정 &gt; 백업 파일로 복구</p>
            <ol class="st-steps">
                <li><span class="st-n">1</span><div><b>사파리에서 오브젯도 열기</b><small>설정 → 백업하기 · 카톡 ‘나와의 채팅’이나 ‘파일’에 받아 둬요.</small></div></li>
                <li><span class="st-n">2</span><div><b>여기(홈 화면 앱)에서 백업 파일로 복구</b><small>아래 버튼을 누르고 받아 둔 파일을 골라요.</small></div></li>
                <li><span class="st-n">3</span><div><b>이제 홈 화면 앱으로만 쓰기</b><small>홈 화면 앱은 오래 안 열었다고 지워지지 않아요. 폰을 바꿀 땐 백업 파일이 필요해요.</small></div></li>
            </ol>` : `
            <ol class="st-steps">
                <li><span class="st-n">1</span><div><b>사파리 아래쪽 공유 버튼${SHARE_SVG}</b><small>네모에 화살표가 있는 버튼이에요.</small></div></li>
                <li><span class="st-n">2</span><div><b>‘홈 화면에 추가’ → [추가]</b><small>안 보이면 메뉴를 위로 밀어 보세요.</small></div></li>
                <li><span class="st-n">3</span><div><b>홈 화면 아이콘으로 열어서 시작</b><small>사파리에서 넣은 사진·물건은 홈 화면 앱으로 <em>넘어가지 않아요.</em> 사파리로만 쓰면 오래(7일쯤) 안 열 때 아이폰이 지울 수도 있어요.</small></div></li>
            </ol>
            <h2 class="st-h2">이미 사파리에 지도가 있다면</h2>
            <ol class="st-steps">
                <li><span class="st-n">1</span><div><b>여기(사파리)에서 백업 파일 받기</b><small>카톡 ‘나와의 채팅’에 보내 두거나 ‘파일’에 저장해요.</small></div></li>
                <li><span class="st-n">2</span><div><b>홈 화면에 추가하고 아이콘으로 열기</b></div></li>
                <li><span class="st-n">3</span><div><b>설정 → 백업 파일로 복구</b><small>받아 둔 백업 파일을 고르면 그대로 옮겨져요.</small></div></li>
            </ol>`}
            <div class="st-cta">
                ${inst ? `<button type="button" class="btn btn-p" data-act="stRestore">백업 파일로 복구</button>`
                    : `${has ? `<button type="button" class="btn btn-s" data-act="go" data-to="#/backup">먼저 백업 파일 받기</button>` : ''}
                       <button type="button" class="btn btn-p" data-act="back" data-fb="${esc(fb)}">알겠어요, 추가하러 갈게요</button>
                       <button type="button" class="tlink" data-act="stIosSkip">그냥 사파리에서 쓰기</button>`}
            </div>
        </main>`;
}

// ────────────────────────────────────────────────────────────
// #/guide/1~4 사용법 — 11/10 새 화면으로 다시 찍은 짧은 영상 (매장 guide/v2-* · 집 guide/v2-home-* · tools/make_guide_videos.js)
// ────────────────────────────────────────────────────────────
const guideSteps = () => [ // 글은 영상과 같은 순서 · 물건 예시는 매장/집에 맞게
    { k: 'ai', title: '사진 한 장 → 칸 나누기', text: '선반·수납장을 정면에서 한 장 찍어 넣고 <b>[✧ AI로 구역 찾기]</b>를 누르면 칸이 생겨요. 사진 위를 끌어서 직접 그려도 돼요.' },
    { k: 'put', title: '칸을 누르고 물건 넣기', text: `칸을 누르면 <b>물건 창</b>이 열려요. <b>"${isHome() ? '가위, 테이프, 줄자' : '종이컵, 컵 뚜껑, 빨대'}"</b>처럼 쉼표로 한 번에 쓰거나 마이크로 말하고, 자주 쓰는 물건은 누르면 바로 들어가요. 다 넣었으면 <b>[완료]</b>.` },
    { k: 'find', title: '치거나 말하면 그 칸이 보여요', text: '첫 화면에 <b>"건전지"</b>처럼 치면 사진 속 그 칸이 빨갛게 보여요. 앞 글자만 쳐도 되고(ㄱㅈㅈ), 마이크를 눌러 말해도 돼요.' },
    { k: 'list', title: '수납 지도 · 인쇄해 붙이기', text: '<b>수납 지도</b>에서 사진마다 칸과 물건을 한눈에 보고, <b>인쇄</b>로 A4 지도·칸 라벨을 뽑아 붙여 두면 앱을 안 열어도 찾아요.' }
];
function renderGuide(r) {
    const S = guideSteps(), i = Math.max(0, Math.min(S.length - 1, (parseInt(r.a, 10) || 1) - 1)), st = S[i], last = i === S.length - 1, vb = `../guide/${isHome() ? 'v2-home-' : 'v2-'}${st.k}`;
    const el = screen('guide', '사용법'), [, fb] = backOf('guide', ['메뉴', '#/menu']);
    el.innerHTML = `
        <header class="top"><span class="st-gtop">사용법 <b>${i + 1}</b> / ${S.length}</span><button type="button" class="tlink" data-act="back" data-fb="${esc(fb)}">닫기</button></header>
        <main class="wrap st-main">
            <div class="st-stage"><video muted playsinline loop autoplay preload="metadata" poster="${vb}.jpg" aria-label="${esc(st.title)} 영상"><source src="${vb}.mp4" type="video/mp4"><source src="${vb}.webm" type="video/webm"></video></div>
            <p class="st-gnote">영상 속 사진은 예시예요</p>
            <h1 class="h1 st-title">${st.title}</h1>
            <p class="st-gtext">${st.text}</p>
            <div class="st-dots" role="group" aria-label="단계">${S.map((x, n) => `<button type="button" data-act="stGuide" data-i="${n}" aria-label="${n + 1}단계 · ${esc(x.title)}"${n === i ? ' aria-current="step"' : ''}></button>`).join('')}</div>
            <div class="st-gnav dock">
                <button type="button" class="btn btn-s" data-act="stGuide" data-i="${i - 1}"${i === 0 ? ' disabled' : ''}>이전</button>
                ${last ? `<button type="button" class="btn btn-p" data-act="stGuideEnd">시작하기</button>` : `<button type="button" class="btn btn-p" data-act="stGuide" data-i="${i + 1}">다음</button>`}
            </div>
        </main>`;
    const v = el.querySelector('video'); if (v) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
}

// ────────────────────────────────────────────────────────────
// #/service 가격 · 대신 만들기 (가격은 ../price/ 와 똑같이)
// ────────────────────────────────────────────────────────────
const DM_URL = 'https://ig.me/m/johnsongarage_';
function renderService() {
    const el = screen('service', '가격 · 대신 만들기'), [lab, fb] = backOf('service', ['메뉴', '#/menu']);
    el.innerHTML = `
        <header class="top">${backBtn(lab, fb)}</header>
        <main class="wrap st-main">
            <span class="kick st-kick">가격 · 대신 만들기</span>
            <h1 class="h1 st-title">직접 하기 번거로우면,<br>대신 만들어 드려요</h1>
            <p class="st-lead">사진만 보내 주시면 칸을 나누고 물건 이름까지 넣어 지도로 만들어 드려요. 구리·남양주는 직접 가서 찍고 폰에 넣어 드려요.</p>
            <ol class="st-steps">
                <li><span class="st-n">01</span><div><b>수납장 사진을 DM으로 보내기</b><small>방문이면 날짜 잡기</small></div></li>
                <li><span class="st-n">02</span><div><b>칸 나누고 물건 이름 입력</b><small>제가 해요</small></div></li>
                <li><span class="st-n">03</span><div><b>지도 파일과 A4 인쇄용 PDF 받기</b></div></li>
            </ol>
            <div class="st-price">
                <div class="st-ph"><span>베타 가격</span><span>12월 31일까지 · 부가세 포함</span></div>
                <div class="st-pr"><span>원격 3곳</span><b>₩19,000</b></div>
                <div class="st-pr"><span>1곳 더할 때마다</span><b>+₩7,000</b></div>
                <div class="st-pr"><span>방문 3곳<small>구리·남양주</small></span><b>₩50,000</b></div>
                <div class="st-pr"><span>집 전체</span><b>견적</b></div>
                <div class="st-pr"><span>업체용 샘플 1곳<small>정리수납 업체 · 선착순 10곳</small></span><b>무료</b></div>
            </div>
            <p class="st-fine">앱은 무료예요. 1곳은 정면 사진 한 장(칸 12개까지)이에요. 집 전체는 사진을 보고 견적을 드려요.</p>
            <div class="st-cta">
                <a class="btn btn-p" href="${DM_URL}" target="_blank" rel="noopener">DM으로 신청하기</a>
                <a class="btn btn-s" href="../price/">가격 자세히 보기</a>
            </div>
        </main>`;
}

// ────────────────────────────────────────────────────────────
Object.assign(SCREENS, { settings: renderSettings, backup: renderBackup, data: renderData, reset: renderReset, iphone: renderIphone, guide: renderGuide, service: renderService });
['settings', 'backup', 'data', 'reset', 'iphone', 'guide', 'service'].forEach(n => NODATA.add(n));
Object.assign(ACT, {
    stMode: (el) => changeMode(el.dataset.v),
    stInd: (el) => pickIndustry(el.dataset.v),
    stFeat: (el) => toggleFeature(el.dataset.v),
    stFont: (el) => pickFont(el.dataset.v),
    stInstall: () => installApp(),
    stBackup: () => startBackup(),
    stShare: () => shareBackup(),
    stSave: () => { closeSheet(); exportSystemData(); },
    stRestore: () => pickRestore(),
    stRestoreGo: (el) => doRestore(el),
    stResetBk: () => resetAll(true),
    stResetNo: () => resetAll(false),
    stWipe: (el) => wipeAllData(el),
    stGuide: (el) => nav(`#/guide/${Math.max(0, +el.dataset.i) + 1}`, true),
    stGuideEnd: () => goHome(),
    stIosSkip: () => { lsSet('iosInstallSkip', '1'); goBack('#/'); }
});
// v1 photoStore.init처럼: 지도가 있으면 브라우저에 '지우지 말아 달라'고 한 번 부탁한다 (조용히 거절될 수도 있다)
AFTER_BOOT.push(() => { try { if (!SAMPLE && store.db && store.cache && store.cache !== '[]' && navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {} });

// 다른 화면에서 부르는 것 (이름이 겹치지 않게 st…)
Object.assign(window, {
    stStartBackup: startBackup,       // 백업 받기 (보내기/저장 고르기 또는 바로 저장) — 누른 순간에 불러야 보내기 창이 열린다
    stPickRestore: pickRestore,       // 백업 파일 고르기 → 확인 → 복구
    stBackupJson: backupJson,         // v1과 같은 백업 내용(JSON 문자열)
    stBackupDue: backupDue,           // 백업 안내를 띄울 때인지 (v1 백업 띠와 같은 조건)
    stLastBackupText: lastBackupText, // '아직 없음' · '마지막: 3일 전'
    stApplyFontScale: applyFontScale, // 글자 크기 다시 적용 (v2FontScale)
    stInstallApp: installApp          // 홈 화면에 설치
});
})();
