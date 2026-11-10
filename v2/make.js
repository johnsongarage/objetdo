'use strict';
// ────────────────────────────────────────────────────────────
// 오브젯도 v2 — 공간 만들기
//   #/tips 사진 찍는 법 + 사진 고르기 (B-PhotoTips, 처음 한 번만 — 그 뒤 '사진 더 넣기'는 바로 사진 고르기) → #/edit/사진 칸 나누기·고치기 (B-NewMap·B-EditZones)
//   칸을 누르거나 새로 그리면 그 자리에서 물건 창이 열린다 (zone.js). AI가 찾은 칸은 고르는 화면 없이 바로 사진 위에 — 확신이 낮은 칸은 점선 '확인'
//   v1과 같은 규칙: 사진은 가로 1600·JPEG 0.8로 줄여 저장, 칸 좌표는 가로 800 기준, 손으로 그린 칸은 A구역…, AI 칸은 1구역…
//   AI 칸 찾기: 무료 10번(기기마다), 제작자 모드(?maker=1 → 서버가 정함), 예시에선 세지 않음 — v1과 같은 서버·같은 키
// ────────────────────────────────────────────────────────────
addCSS(`
.tp-cmp { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 22px; }
.tp-cmp figure { margin: 0; }
.tp-cmp .pic { aspect-ratio: 1.45; border: 1px solid var(--ink); background: var(--sheet); position: relative; }
.tp-cmp figcaption { margin-top: 8px; font-size: 15px; }
.tp-cmp figcaption small { display: block; font-size: 13px; color: var(--sub); }
.tp-cmp .bad figcaption b { color: var(--accent); font-weight: 500; }
.tp-grid { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); }
.tp-grid i { border-right: 1px solid var(--ink); border-bottom: 1px solid var(--ink); }
.tp-grid i:nth-child(3n) { border-right: 0; } .tp-grid i:nth-child(n+7) { border-bottom: 0; }
.tp-far { position: absolute; left: 10%; bottom: 26%; width: 26%; height: 34%; }
.tp-far2 { position: absolute; right: 12%; bottom: 26%; width: 22%; height: 26%; border: 1px solid var(--ink); }
.tp-floor { position: absolute; left: 0; right: 0; bottom: 24%; border-top: 1px solid var(--line); }
.ed-bar { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: calc(10px + env(safe-area-inset-top)) 12px 10px var(--gut); background: var(--ink); color: #FBF8F3; }
.ed-bar b { display: block; font-size: 16px; font-weight: 500; }
.ed-bar small { display: block; font-size: 13px; color: rgba(251, 248, 243, .72); }
.ed-bar button { flex: none; min-height: 44px; padding: 0 16px; border: 1px solid rgba(251, 248, 243, .8); border-radius: 2px; background: none; color: #FBF8F3; font-size: 15px; cursor: pointer; }
.ed-name { display: flex; justify-content: space-between; align-items: baseline; margin-top: 20px; }
.ed-name .meta { padding-right: 0; }
.ed-title { display: block; width: 100%; margin: 4px 0 16px; padding: 6px 0 8px; border: 0; border-bottom: 1.5px solid var(--ink); background: transparent; font-family: var(--serif); font-size: 22px; font-weight: 700; color: var(--ink); border-radius: 0; }
.ed-title:focus { outline: 0; }
.ed-title::placeholder { color: #A69C8E; font-weight: 400; font-family: var(--sans); font-size: 18px; }
.ed-wrap { position: relative; overflow: auto; margin: 0 calc(-1 * var(--gut)); padding: 0 var(--gut); -webkit-overflow-scrolling: touch; }
.ed-wrap.zoomed { max-height: 72vh; }
.ed-ph { position: relative; width: 100%; aspect-ratio: var(--ar); background: var(--hl); border: 1px solid var(--ink); touch-action: pan-x pan-y; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
.ed-wrap.zoomed .ed-ph { width: 220%; }
.ed-ph.drawing { touch-action: none; cursor: crosshair; outline: 2px solid var(--accent); outline-offset: 2px; }
.ed-ph img { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.ed-z { position: absolute; border: 2px solid rgba(251, 248, 243, .95); box-shadow: 0 0 0 1px rgba(58, 53, 48, .7); background: rgba(251, 248, 243, .06); touch-action: pan-x pan-y; }
.ed-z b { position: absolute; left: 0; top: 0; min-width: 24px; height: 24px; padding: 0 5px; display: flex; align-items: center; justify-content: center; background: var(--sheet); color: var(--ink); font-family: var(--serif); font-size: 15px; font-weight: 700; }
.ed-z span { position: absolute; left: 4px; right: 4px; bottom: 3px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 12px; color: #fff; text-shadow: 0 1px 2px rgba(0, 0, 0, .8); }
.ed-z.sel { border: 3px solid var(--accent); background: rgba(158, 59, 42, .14); z-index: 5; touch-action: none; cursor: move; }
.ed-z.sel b { background: var(--accent); color: #fff; }
.ed-h { position: absolute; width: 26px; height: 26px; margin: -13px 0 0 -13px; background: #fff; border: 2px solid var(--accent); touch-action: none; z-index: 6; }
.ed-h::after { content: ''; position: absolute; inset: -10px; }
.ed-draft { position: absolute; border: 2px dashed var(--accent); background: rgba(158, 59, 42, .12); pointer-events: none; z-index: 7; }
.ed-start { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(82%, 300px); padding: 18px; background: var(--sheet); border: 1px solid var(--ink); text-align: center; z-index: 8; }
.ed-start .btn { min-height: 50px; }
.ed-start p { margin: 8px 0; font-size: 13px; color: var(--sub); }
.ed-start a, .ed-start .lk { color: var(--accent); background: none; border: 0; padding: 0; font-size: 13px; text-decoration: underline; cursor: pointer; }
.ed-busy { position: absolute; inset: 0; z-index: 9; background: rgba(36, 30, 26, .55); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; overflow: hidden; }
.ed-busy::before { content: ''; position: absolute; left: 0; right: 0; height: 3px; background: #F0C9B9; box-shadow: 0 0 14px 4px rgba(240, 201, 185, .7); animation: edscan 1.6s ease-in-out infinite alternate; }
@keyframes edscan { from { top: 4%; } to { top: 94%; } }
.ed-tools { position: sticky; bottom: 0; z-index: 20; display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 24px; padding: 6px 4px calc(6px + env(safe-area-inset-bottom)); background: var(--bg); border-top: 1px solid var(--line); }
.ed-tools button { display: flex; flex-direction: column; align-items: center; gap: 2px; min-height: 56px; border: 0; background: none; font-size: 13px; color: var(--ink); cursor: pointer; border-radius: 2px; }
.ed-tools button svg { width: 20px; height: 20px; }
.ed-tools button.on { background: var(--ink); color: #fff; }
.ed-tools button.danger { color: var(--accent); }
.ed-tools button:disabled { opacity: .35; }
.ed-help { margin-top: 18px; padding: 14px 16px; border: 1px solid var(--line); background: var(--sheet); font-size: 14px; }
.ed-help b { display: block; font-weight: 500; margin-bottom: 6px; }
.ed-help ol { margin: 0; padding: 0; list-style: none; counter-reset: h; }
.ed-help li { counter-increment: h; display: flex; gap: 10px; padding: 3px 0; color: var(--sub); }
.ed-help li::before { content: counter(h); flex: none; width: 14px; font-family: var(--serif); color: var(--accent); }
.ed-z.low { border-style: dashed; border-color: #FBF8F3; box-shadow: 0 0 0 1px rgba(158, 59, 42, .9); }
.ed-z i { position: absolute; right: 3px; top: 3px; padding: 1px 5px; font-style: normal; font-size: 11px; line-height: 1.4; background: var(--accent); color: #fff; white-space: nowrap; pointer-events: none; }
`);

// ── AI 칸 찾기 (v1과 같은 서버·같은 규칙) ──
const AI_FREE = 10, AI_USES_KEY = 'aiUses';
try { if (new URLSearchParams(location.search).get('maker') === '1') localStorage.setItem('aiMakerAsk', '1'); } catch (e) {}
const aiMaker = () => ls('aiMaker') === '1';
const aiMakerAsk = () => ls('aiMakerAsk') === '1';
function aiUsesLeft() { if (aiMaker()) return 999; const n = parseInt(ls(AI_USES_KEY) || '0', 10) || 0; return Math.max(0, AI_FREE - n); }
function countAiUse() { if (SAMPLE || ls('isSampleData') === '1') return; lsSet(AI_USES_KEY, String(AI_FREE - aiUsesLeft() + 1)); }
function aiLeftText() { return aiMaker() ? '제작자 모드 · 횟수 제한 없음' : aiUsesLeft() > 0 ? `무료 ${aiUsesLeft()}번 남음` : '무료 횟수를 다 썼어요'; }
class AiLimitError extends Error {}
async function detectZones(base64Data) {
    if (aiUsesLeft() <= 0 && !aiMakerAsk() && !SAMPLE && ls('isSampleData') !== '1') throw new AiLimitError('free');
    const id = readStats().id || ''; // text/plain: Apps Script가 사전 확인(CORS preflight)에 답하지 못해서
    const res = await fetch(`${AI_PROXY_URL}?id=${encodeURIComponent(id)}&left=${aiUsesLeft()}`, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: base64Data });
    if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
    const result = await res.json();
    if (result.maker) { lsSet('aiMaker', '1'); try { localStorage.removeItem('aiMakerAsk'); } catch (e) {} }
    if (result.status === 'limit') { if (result.free) { try { localStorage.removeItem('aiMakerAsk'); } catch (e) {} } throw new AiLimitError(result.message || 'server'); }
    if (result.status !== 'success') throw new Error(result.message || 'AI 서버 오류');
    countAiUse();
    return result.predictions || [];
}
function calcIoU(a, b) {
    const ax2 = a.x + a.w, ay2 = a.y + a.h;
    const bx2 = b.x + b.w, by2 = b.y + b.h;
    const ix = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x));
    const iy = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y));
    const inter = ix * iy;
    if (inter === 0) return 0;
    // 작은 박스가 큰 박스 안에 완전히 들어가는 경우도 잡기 위해
    // 일반 IoU 대신 "작은 박스 기준 포함률" 도 함께 계산
    const areaA = a.w * a.h, areaB = b.w * b.h;
    const smallArea = Math.min(areaA, areaB);
    const containRatio = inter / smallArea;           // 작은 쪽이 얼마나 덮이는지
    const iou = inter / (areaA + areaB - inter);
    return Math.max(iou, containRatio);               // 둘 중 큰 값 사용
}
function applyNMS(boxes, iouThreshold = 0.45) {
    // confidence 내림차순 정렬
    const sorted = [...boxes].sort((a, b) => b.confidence - a.confidence);
    const kept = [];
    const suppressed = new Set();
    for (let i = 0; i < sorted.length; i++) {
        if (suppressed.has(i)) continue;
        kept.push(sorted[i]);
        for (let j = i + 1; j < sorted.length; j++) {
            if (suppressed.has(j)) continue;
            if (calcIoU(sorted[i], sorted[j]) > iouThreshold) suppressed.add(j);
        }
    }
    return kept;
}
const ZONE_REFINE = { minSide: 30, minAreaRatio: 0.01, medianRatio: 0.15, edgeMargin: 8, edgeMedianRatio: 0.25, containRatio: 0.8, overlapPx: 3, gap: 2 };
function refineZones(boxes, W, H) {
    const R = ZONE_REFINE, area = b => b.w * b.h;
    const ov = (a, b) => [Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)];
    const tooSmall = b => Math.min(b.w, b.h) < R.minSide || area(b) < W * H * R.minAreaRatio;
    const smallCut = (list) => {
        list = list.filter(b => !tooSmall(b)); // ①
        if (list.length >= 3) {
            const med = [...list].map(area).sort((a, b) => a - b)[list.length >> 1];
            const edge = b => b.x <= R.edgeMargin || b.y <= R.edgeMargin || b.x + b.w >= W - R.edgeMargin || b.y + b.h >= H - R.edgeMargin;
            list = list.filter(b => area(b) >= med * R.medianRatio && !(edge(b) && area(b) < med * R.edgeMedianRatio)); // ② ③
        }
        return list;
    };
    const clip = b => { const x = Math.max(0, b.x), y = Math.max(0, b.y); return { ...b, x, y, w: Math.min(W, b.x + b.w) - x, h: Math.min(H, b.y + b.h) - y }; }; // 사진 밖으로 나간 부분은 자른다
    let list = smallCut(boxes.map(clip));
    list = list.filter(b => !list.some(o => o !== b && area(o) > area(b) && (([w, h]) => w > 0 && h > 0 && w * h >= area(b) * R.containRatio)(ov(o, b)))); // ④
    for (let pass = 0; pass < 2; pass++) { // ⑤ (한 번 줄이면 옆 칸과의 겹침이 바뀔 수 있어 두 번)
        for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
            const a = list[i], b = list[j], [ow, oh] = ov(a, b);
            if (ow <= R.overlapPx || oh <= R.overlapPx) continue;
            const horiz = ow / Math.min(a.w, b.w) <= oh / Math.min(a.h, b.h); // 좌우로 덜 겹쳤으면 좌우로 가른다
            const [p, q] = horiz ? (a.x <= b.x ? [a, b] : [b, a]) : (a.y <= b.y ? [a, b] : [b, a]);
            if (horiz) { const m = (Math.max(p.x, q.x) + Math.min(p.x + p.w, q.x + q.w)) / 2; p.w = m - R.gap / 2 - p.x; const r = q.x + q.w; q.x = m + R.gap / 2; q.w = r - q.x; }
            else { const m = (Math.max(p.y, q.y) + Math.min(p.y + p.h, q.y + q.h)) / 2; p.h = m - R.gap / 2 - p.y; const btm = q.y + q.h; q.y = m + R.gap / 2; q.h = btm - q.y; }
        }
    }
    list = list.filter(b => !tooSmall(b)); // 줄이다 너무 작아진 칸 (②③은 줄이기 전 크기로 이미 봤다)
    return list;
}
function readingOrder(boxes) {
    const rows = [];
    [...boxes].sort((a, b) => a.y - b.y).forEach(b => {
        const row = rows.find(r => Math.min(r.bottom, b.y + b.h) - Math.max(r.top, b.y) >= 0.5 * Math.min(b.h, r.minH));
        if (row) { row.items.push(b); row.top = Math.min(row.top, b.y); row.bottom = Math.max(row.bottom, b.y + b.h); row.minH = Math.min(row.minH, b.h); }
        else rows.push({ items: [b], top: b.y, bottom: b.y + b.h, minH: b.h });
    });
    rows.sort((a, b) => a.top - b.top);
    return rows.flatMap(r => r.items.sort((a, b) => a.x - b.x));
}

const AI_FREE_DONE = `무료 베타의 AI 칸 찾기 ${AI_FREE}번을 다 쓰셨어요. 칸은 [구역 그리기]로 손가락으로 쓱 그리면 돼요.`;

// ── 사진 더 넣기: 찍는 법은 처음 한 번만, 그 뒤엔 바로 사진 고르기 (v1 pickPhoto와 같은 키) ──
const tipsSeen = () => !!ls('photoTipSeen') || vis().length > 0;
let pickKind = null; // 'space' = 공간 사진으로 넣는다
// opts.space: 공간 사진 · opts.link: { pid, zi } 고른 사진을 그 공간 사진 네모(가구)에 잇는다
function pickPhoto(opts) {
    opts = opts || {};
    pickKind = opts.space ? 'space' : null; pendingSpaceLink = opts.link || null;
    if (!opts.space && !opts.link && !tipsSeen()) { nav('#/tips'); return; }
    let f = $('#pickFile');
    if (!f) { f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*'; f.id = 'pickFile'; f.hidden = true; document.body.appendChild(f); f.addEventListener('change', (e) => onPhotoPicked(e, false)); }
    f.click(); // 누른 그 순간에 열어야 한다 (사파리)
}
// ── #/tips 사진 찍는 법 + 사진 고르기 ──
function renderTips() {
    const el = screenEl('tips');
    el.innerHTML = `
        <header class="top">${backBtn(vis().length ? '지도' : '처음', vis().length ? `#/map/${encodeURIComponent(vis()[0].id)}` : '#/')}<span class="meta">새 사진 넣기</span></header>
        <main class="wrap" style="flex:1;display:flex;flex-direction:column">
            <h1 class="h1" style="margin-top:22px">사진은 이렇게 찍어 주세요</h1>
            <div class="tp-cmp">
                <figure><div class="pic"><div class="tp-grid">${'<i></i>'.repeat(9)}</div></div><figcaption>○ 좋아요<small>${isHome() ? '수납장 한 면, 가까이 정면' : '랙 한 면, 가까이 정면'}</small></figcaption></figure>
                <figure class="bad"><div class="pic"><div class="tp-far tp-grid">${'<i></i>'.repeat(9)}</div><div class="tp-far2"></div><div class="tp-floor"></div></div><figcaption><b>× 어려워요</b><small>멀리서 전체 한 장</small></figcaption></figure>
            </div>
            <ol class="nums" style="margin-top:26px">
                <li style="align-items:flex-start;padding:14px 0"><span style="padding-top:3px">01</span><div><b style="font-weight:500">${isHome() ? '수납장·선반 한 면씩, 가까이서' : '랙·선반 한 면씩, 가까이서'}</b><br><small style="color:var(--sub);font-size:14px">칸이 하나씩 구분돼 보이는 거리에서 정면으로 찍어요. 멀리서 한 장에 담으면 칸이 너무 작아져요.</small></div></li>
                <li style="align-items:flex-start;padding:14px 0"><span style="padding-top:3px">02</span><div><b style="font-weight:500">${isHome() ? '큰 붙박이장은 여러 장으로' : '큰 창고는 여러 장으로'}</b><br><small style="color:var(--sub);font-size:14px">한 면에 한 장씩 올리면 돼요. 사진은 계속 더할 수 있어요.</small></div></li>
                <li style="align-items:flex-start;padding:14px 0"><span style="padding-top:3px">03</span><div><b style="font-weight:500">사진 이름을 붙여 두세요</b><br><small style="color:var(--sub);font-size:14px">${isHome() ? '“거실 수납장”, “붙박이장 맨 위”' : '“1번 랙”, “냉동 창고”'}처럼 적어 두면 어느 사진인지 바로 알아봐요.</small></div></li>
            </ol>
            <div class="cta">
                <input type="file" accept="image/*" id="tpFile" hidden>
                <p class="hint" style="text-align:center">사람 얼굴, 택배 송장, 서류는 찍히지 않게 해 주세요${SAMPLE ? ' · 예시를 보는 중이라 넣은 사진은 저장되지 않아요' : ''}</p>
            </div>
            <div class="dock"><button type="button" class="btn btn-p" data-act="tpPick">사진 고르기</button></div>
        </main>`;
    $('#tpFile').addEventListener('change', (e) => onPhotoPicked(e, true));
}
async function onPhotoPicked(e, fromTips) {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    const btn = document.querySelector('#s-tips [data-act=tpPick]'); if (btn) { btn.disabled = true; btn.textContent = '사진 줄이는 중…'; }
    if (!fromTips) toast('사진 줄이는 중…');
    try {
        const { dataUrl } = await readPhotoFile(f);
        photos = photos.filter(p => p.id !== 'dummy_root');
        const kind = fromTips ? null : pickKind, link = fromTips ? null : pendingSpaceLink; pickKind = null; pendingSpaceLink = null;
        const p = { imgData: dataUrl, zones: [], id: Date.now(), title: kind === 'space' ? (isHome() ? '우리 집 전체' : '매장 전체') : '#' + (itemPhotos().length + 1) };
        if (kind === 'space') { p.space = true; photos.unshift(p); } else photos.push(p); // 공간 사진은 맨 앞 (v1에서도 먼저 보이게)
        if (link) { const sp = photoById(link.pid), z = sp && sp.zones[link.zi]; if (z) { z.link = String(p.id); z.name = p.title; sp.space = true; } } // 그 가구 네모에 바로 잇기
        await measurePhoto(p);
        saveAll(); hideToast();
        nav(`#/edit/${encodeURIComponent(p.id)}?new=1`, fromTips); // 찍는 법 화면에서 왔으면 그 자리를, 지도에서 왔으면 새로 (뒤로 → 지도)
    } catch (err) {
        toast('사진을 읽지 못했어요 · 다른 사진으로 해 주세요');
        if (btn) { btn.disabled = false; btn.textContent = '사진 고르기'; }
    }
}

// ── #/edit/사진 칸 나누기·고치기 ──
let ed = null; // { key, pid, sel, draw, zoom, undo:[], busy }
const ED_ICON = {
    draw: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"></path><path d="M14 6l4 4"></path></svg>',
    del: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"></path></svg>',
    undo: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"></path><path d="M4 9h10a6 6 0 0 1 0 12h-3"></path></svg>',
    zoom: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><line x1="16.5" y1="16.5" x2="21" y2="21"></line><line x1="8" y1="11" x2="14" y2="11"></line><line x1="11" y1="8" x2="11" y2="14"></line></svg>'
};
function edPhoto() { return ed && photoById(ed.pid); }
function renderEdit(r) {
    const p = photoById(r.a);
    if (!p) { nav('#/', true); return false; }
    if (!ed || ed.key !== zsFree(location.hash)) {
        const z = parseInt(r.q.get('zone'), 10);
        ed = { key: zsFree(location.hash), pid: String(p.id), sel: isFinite(z) && p.zones[z] ? z : null, draw: r.q.get('draw') === '1', zoom: 1, undo: [], busy: false };
    }
    paintEdit();
}
function paintEdit(keepScroll) {
    const p = edPhoto(); if (!p) return;
    const y = window.scrollY, wrapX = $('#edWrap') ? $('#edWrap').scrollLeft : 0;
    const el = screenEl('edit'), empty = !p.zones.length, defTitle = /^#\d+$/.test(p.title || ''), sp = isSpace(p), Z = sp ? '가구' : '구역';
    const sub = ed.draw ? (sp ? '가구 하나를 끌어서 네모로 그려요' : '사진 위를 끌어서 칸을 그려요') : empty ? (sp ? '가구마다 네모를 그려요' : 'AI로 찾거나 직접 그려요') : (sp ? '네모를 누르면 어느 가구인지 골라요' : '칸을 누르면 물건 창 · 고른 칸은 끌어서 옮기기');
    const L = sp ? '' : (itemPhotos().length > 1 ? letterOf(p) : '');
    el.innerHTML = `
        <div class="ed-bar"><div><b>${sp ? (empty ? '공간 사진 · 가구 그리기' : '가구 고치는 중') : empty ? '칸 나누기' : '구역 고치는 중'}</b><small>${sub}</small></div><button type="button" data-act="edDone">완료</button></div>
        <main class="wrap" style="flex:1">
            <div class="ed-name"><span class="kick">${sp ? '공간 사진' : L ? `${L} 사진` : `사진 #${vis().indexOf(p) + 1}`} 이름</span><span class="meta">${Z} ${p.zones.length}</span></div>
            <input class="ed-title" id="edTitle" type="search" value="${defTitle ? '' : esc(p.title)}" placeholder="예: ${sp ? (isHome() ? '우리 집 전체, 거실' : '매장 전체, 1층 창고') : isHome() ? '거실 수납장, 붙박이장 위' : '창고 A, 냉장고 안'}" aria-label="사진 이름" enterkeyhint="done" autocomplete="off">
            <div class="ed-wrap${ed.zoom > 1 ? ' zoomed' : ''}" id="edWrap">
                <div class="ed-ph${ed.draw ? ' drawing' : ''}" id="edPh" style="--ar:${800 / h800(p)}">
                    ${p.imgData ? `<img src="${esc(p.imgData)}" alt="">` : ''}
                    ${p.zones.map((z, i) => edZoneHTML(p, z, i)).join('')}
                    ${empty && !ed.draw && !ed.busy && sp ? `<div class="ed-start"><b style="display:block;margin-bottom:4px">가구를 네모로 그려요</b><p>선반·냉장고·서랍장처럼 물건을 넣어 둔 가구마다 하나씩</p><button type="button" class="btn btn-p" data-act="edDraw">가구 그리기</button></div>` : ''}
                    ${empty && !ed.draw && !ed.busy && !sp ? `<div class="ed-start"><button type="button" class="btn btn-p" data-act="edAI">✧ AI로 구역 찾기</button><p>${esc(aiLeftText())} · 사진은 분석 서버로 보내져요 · <button type="button" class="lk" data-act="edAIInfo">자세히</button></p><p>또는</p><button type="button" class="btn btn-s" data-act="edDraw">직접 그리기</button></div>` : ''}
                    ${ed.busy ? '<div class="ed-busy">칸 찾는 중…</div>' : ''}
                </div>
            </div>
            ${ed.draw ? `<p class="hint">${sp ? '가구 모서리에서 반대 모서리까지 끌어요 · 다 그리면 어느 가구인지 고르는 창이 열려요' : '손가락으로 칸 모서리에서 반대 모서리까지 끌어요 · 다 그리면 바로 물건 창이 열려요'}</p>` : ''}
            ${!empty && sp ? `<div class="ed-help"><b>공간 사진, 이렇게 해요</b><ol><li>가구 그리기 · [가구 그리기]를 누르고 가구 위를 끌어요</li><li>잇기 · 네모를 누르고 어느 가구 사진인지 골라요 (없으면 바로 찍어 넣기)</li><li>찾을 때 · 찾은 결과의 ‘가는 길’에 이 사진이 나와 그 가구가 빛나요</li></ol></div>` : ''}
            ${!empty && !sp ? `<div class="ed-help"><b>구역 고치기, 이렇게 해요</b><ol><li>구역 만들기 · [구역 그리기]를 누르고 사진 위를 끌어요</li><li>물건 넣기 · 구역을 누르면 물건 창이 열려요</li><li>옮기기·크기 · 고른 구역을 끌거나, 모서리를 당겨요</li>${p.zones.some(z => AI_LOW.has(z)) ? '<li>점선 ‘확인’ · AI가 덜 확실한 칸이에요. 맞으면 그대로, 아니면 지우세요</li>' : ''}</ol></div>` : ''}
            <div class="sec-head"><span>${Z} 목록</span><span>${p.zones.length}</span></div>
            ${p.zones.length ? p.zones.map((z, i) => { if (sp) { const q = linkedPhoto(z);
                    return `<button type="button" class="zrow" data-act="edPickRow" data-i="${i}"><span class="n">${esc(q ? letterOf(q) || '·' : '?')}</span><span class="t">${q ? esc(q.title || '사진') : '어느 가구인지 고르기'}<small>${q ? '이어짐 · 눌러서 바꾸기' : `${i + 1}번 네모 · 눌러서 고르기`}</small></span><span class="d">${ed.sel === i ? '고름' : ''}</span></button>`; }
                    return `<button type="button" class="zrow" data-act="edPickRow" data-i="${i}"><span class="n">${i + 1}</span><span class="t">${esc(z.name || `${i + 1}번 구역`)}<small>${z.items.length ? esc(zoneSummary(z)) : '비어 있음 · 눌러서 물건 넣기'}</small></span><span class="d">${AI_LOW.has(z) ? '<span style="color:var(--accent)">확인</span>' : ed.sel === i ? '고름' : ''}</span></button>`; }).join('')
                : `<p class="empty">아직 ${Z}${sp ? '를' : '이'} 안 그렸어요 · 아래 [${Z} 그리기]를 누르고 사진 위를 끌어요</p>`}
            <div class="links" style="margin-top:22px">${!empty && !sp ? '<button type="button" data-act="edAI">AI로 다시 찾기</button>' : ''}<button type="button" data-act="addPhoto">사진 더 넣기</button>${sp ? '<button type="button" data-act="edToItem">보통 사진으로 되돌리기</button>' : p.zones.some(z => z.items.length) ? '' : '<button type="button" data-act="edToSpace">공간 사진으로 쓰기</button>'}<button type="button" data-act="edDelPhoto" style="color:var(--accent)">이 사진 지우기</button></div>
        </main>
        <nav class="ed-tools" aria-label="구역 도구">
            <button type="button" data-act="edDraw" class="${ed.draw ? 'on' : ''}" aria-pressed="${ed.draw}">${ED_ICON.draw}${Z} 그리기</button>
            <button type="button" data-act="edDel" class="danger" ${ed.sel == null ? 'disabled' : ''}>${ED_ICON.del}${Z} 지우기</button>
            <button type="button" data-act="edUndo" ${ed.undo.length ? '' : 'disabled'}>${ED_ICON.undo}되돌리기</button>
            <button type="button" data-act="edZoom" aria-pressed="${ed.zoom > 1}">${ED_ICON.zoom}${ed.zoom > 1 ? '원래 크기' : '크게 보기'}</button>
        </nav>`;
    const t = $('#edTitle');
    t.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) t.blur(); });
    const tPid = String(p.id); // 이 칸이 가리키는 사진 (늦게 오는 change도 이 사진에만)
    t.addEventListener('change', () => { const pp = photoById(tPid); if (!pp) return; const v = t.value.trim(); pp.title = v || pp.title || '#' + (vis().indexOf(pp) + 1); syncSpaceNames(); saveAll(); });
    bindEditPointer();
    if (keepScroll) { window.scrollTo(0, y); const w = $('#edWrap'); if (w) w.scrollLeft = wrapX; }
}
// AI가 덜 확실하게 찾은 칸 (점선 '확인'): 저장하지 않고 이 화면에서만. 옮기거나 크기를 맞추거나 물건 창을 열면 없어진다
const AI_LOW = new WeakSet();
function edZoneHTML(p, z, i) {
    const b = zoneBox(p, z), sel = ed.sel === i, low = AI_LOW.has(z), sp = isSpace(p), q = sp ? linkedPhoto(z) : null;
    const hs = sel ? [['tl', 0, 0], ['tr', 100, 0], ['bl', 0, 100], ['br', 100, 100]].map(([h, x, y]) => `<i class="ed-h" data-h="${h}" style="left:${x}%;top:${y}%"></i>`).join('') : '';
    const num = sp ? (q ? letterOf(q) || '·' : '?') : String(i + 1), cap = sp ? (q ? q.title || '사진' : '가구 고르기') : `${z.name || ''}${z.items.length ? ` · ${z.items.length}` : ''}`;
    return `<div class="ed-z${sel ? ' sel' : ''}${low ? ' low' : ''}${sp ? ' sp' : ''}" data-i="${i}" style="left:${b.l}%;top:${b.t}%;width:${b.w}%;height:${b.h}%"><b>${esc(num)}</b>${low && !sel ? '<i>확인</i>' : ''}<span>${esc(cap)}</span>${hs}</div>`;
}
function edPush() { const p = edPhoto(); if (!p) return; ed.undo.push(JSON.stringify(p.zones)); if (ed.undo.length > 30) ed.undo.shift(); }
// 사진 위 손가락: 그리기 모드면 끌어서 새 칸(→ 바로 물건 창) · 칸 누르기는 그 칸 물건 창 · 고른 칸은 끌어서 옮기기 · 모서리는 크기 · 빈 곳 누르기는 닫기
function bindEditPointer() {
    const ph = $('#edPh'); if (!ph) return;
    const toCanvas = (e) => { const r = ph.getBoundingClientRect(), p = edPhoto(); return { x: (e.clientX - r.left) / r.width * 800, y: (e.clientY - r.top) / r.height * h800(p) }; };
    let g = null; // 지금 하는 동작
    ph.addEventListener('pointerdown', (e) => {
        if (ed.busy || e.button > 0) return;
        const p = edPhoto(), pt = toCanvas(e), H = h800(p), handle = e.target.closest('.ed-h'), zEl = e.target.closest('.ed-z');
        if (e.target.closest('.ed-start')) return;
        if (ed.draw) { g = { kind: 'draw', start: pt, now: pt }; try { ph.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); return; }
        if (handle && ed.sel != null) { g = { kind: 'resize', h: handle.dataset.h, z: p.zones[ed.sel], before: JSON.stringify(p.zones) }; try { ph.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); return; }
        if (zEl) {
            const i = +zEl.dataset.i;
            if (i === ed.sel) { g = { kind: 'move', z: p.zones[i], off: { x: pt.x - p.zones[i].x, y: pt.y - p.zones[i].y }, sx: e.clientX, sy: e.clientY, moved: false, before: JSON.stringify(p.zones), i }; try { ph.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); return; }
            g = { kind: 'tap', i, sx: e.clientX, sy: e.clientY }; return;
        }
        g = { kind: 'tap', i: null, sx: e.clientX, sy: e.clientY };
        void H;
    });
    ph.addEventListener('pointermove', (e) => {
        if (!g) return;
        const p = edPhoto(), pt = toCanvas(e), H = h800(p);
        if (g.kind === 'tap') { if (Math.hypot(e.clientX - g.sx, e.clientY - g.sy) > 8) g = null; return; }
        if (g.kind === 'draw') { g.now = pt; edDraft(g.start, pt); return; }
        if (g.kind === 'move') {
            if (!g.moved && Math.hypot(e.clientX - g.sx, e.clientY - g.sy) < 6) return;
            g.moved = true; const z = g.z;
            z.x = Math.max(0, Math.min(800 - z.w, pt.x - g.off.x)); z.y = Math.max(0, Math.min(H - z.h, pt.y - g.off.y));
            edSyncZoneEl(p, ed.sel); return;
        }
        if (g.kind === 'resize') {
            const z = g.z, x = Math.max(0, Math.min(800, pt.x)), y = Math.max(0, Math.min(H, pt.y)), MIN = 40;
            if (g.h.includes('r')) z.w = Math.max(MIN, x - z.x); else { const right = z.x + z.w; z.x = Math.min(x, right - MIN); z.w = right - z.x; }
            if (g.h.includes('b')) z.h = Math.max(MIN, y - z.y); else { const bottom = z.y + z.h; z.y = Math.min(y, bottom - MIN); z.h = bottom - z.y; }
            edSyncZoneEl(p, ed.sel);
        }
    });
    const end = (e, cancel) => {
        if (!g) return;
        const p = edPhoto(), cur0 = g; g = null;
        if (cur0.kind === 'draw') {
            const d = $('#edDraft'); if (d) d.remove();
            if (cancel) return;
            const a = cur0.start, b = cur0.now, x = Math.max(0, Math.min(a.x, b.x)), y = Math.max(0, Math.min(a.y, b.y)), w = Math.min(800, Math.max(a.x, b.x)) - x, h = Math.min(h800(p), Math.max(a.y, b.y)) - y;
            if (w > 25 && h > 25) { // v1과 같은 최소 크기
                edPush();
                p.zones.push({ x, y, w, h, name: isSpace(p) ? '' : newZoneName(), items: [], checkedAt: Date.now() }); // 공간 사진의 네모는 이름 대신 가구 사진을 잇는다
                ed.sel = p.zones.length - 1; ed.draw = false; saveAll(); paintEdit(true);
                zsGo(p.id, p.zones.length - 1); // 그린 칸에 바로 물건 넣기 (11/10)
            } else toast('조금 더 크게 끌어 주세요');
            return;
        }
        if (cur0.kind === 'move' || cur0.kind === 'resize') {
            if (cur0.kind === 'move' && !cur0.moved) { if (!cancel) zsGo(p.id, cur0.i); return; } // 고른 칸을 누름 → 물건 창
            ed.undo.push(cur0.before); if (ed.undo.length > 30) ed.undo.shift();
            AI_LOW.delete(cur0.z); // 손으로 맞춘 칸은 '확인' 끝
            saveAll(); paintEdit(true); if (zsOpen()) requestAnimationFrame(zsReveal); return;
        }
        if (cur0.kind === 'tap' && !cancel) {
            if (cur0.i != null) { zsGo(p.id, cur0.i); return; } // 칸 누름 → 그 칸 물건 창 (고르기도 같이)
            ed.sel = null; paintEdit(true); if (zsOpen()) zsClose(); // 빈 곳 → 닫기
        }
    };
    ph.addEventListener('pointerup', (e) => end(e, false));
    ph.addEventListener('pointercancel', (e) => end(e, true));
}
function edDraft(a, b) {
    const p = edPhoto(), ph = $('#edPh'); let d = $('#edDraft');
    if (!d) { d = document.createElement('div'); d.className = 'ed-draft'; d.id = 'edDraft'; ph.appendChild(d); }
    const box = zoneBox(p, { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) });
    Object.assign(d.style, { left: box.l + '%', top: box.t + '%', width: box.w + '%', height: box.h + '%' });
}
function edSyncZoneEl(p, i) { const el = document.querySelector(`#edPh .ed-z[data-i="${i}"]`), b = zoneBox(p, p.zones[i]); if (el) Object.assign(el.style, { left: b.l + '%', top: b.t + '%', width: b.w + '%', height: b.h + '%' }); }
function edDeleteZone() {
    const p = edPhoto(); if (!p || ed.sel == null) return;
    const i = ed.sel, z = p.zones[i]; if (!z) return;
    const doIt = () => { edPush(); p.zones.splice(i, 1); ed.sel = null; saveAll(); paintEdit(true); toast(`${i + 1}번 구역을 지웠어요`, () => { ACT.edUndo(); }); };
    if (!z.items.length) { doIt(); return; }
    openSheet(`<h2>${i + 1}번 구역을 지울까요?</h2><p>칸 안의 물건 ${z.items.length}개(${esc(zoneSummary(z))})도 지도에서 빠져요. [되돌리기]로 살릴 수 있어요.</p>
        <div class="stack"><button type="button" class="btn btn-p" data-act="edDelOk">구역 지우기</button><button type="button" class="btn btn-s" data-act="sheetClose">그대로 두기</button></div>`);
    ed.pendingDel = doIt;
}
// AI로 찾기: 이미 칸이 있으면 바꿀지 먼저 묻는다 (물건도 같이 지워져서 — v1과 같다)
function edAI() {
    const p = edPhoto(); if (!p || ed.busy) return;
    if (aiUsesLeft() <= 0 && !aiMakerAsk() && !SAMPLE && ls('isSampleData') !== '1') { openSheet(`<h2>AI 무료 횟수를 다 썼어요</h2><p>${esc(AI_FREE_DONE)} 더 필요하시면 메뉴 > 의견 보내기로 알려 주세요.</p><div class="stack"><button type="button" class="btn btn-p" data-act="edAIDraw">직접 그리기</button></div>`); return; }
    if (p.zones.length) { openSheet(`<h2>AI가 찾은 칸으로 바꿀까요?</h2><p>지금 있는 구역 ${p.zones.length}개를 AI가 찾은 구역으로 바꿔요. 구역에 넣어 둔 물건도 같이 지워져요. (바꾼 뒤 [되돌리기]로 살릴 수 있어요)</p><div class="stack"><button type="button" class="btn btn-p" data-act="edAIGo">바꾸기</button><button type="button" class="btn btn-s" data-act="sheetClose">그대로 두기</button></div>`); return; }
    edAIGo();
}
async function edAIGo() {
    closeSheet();
    const p = edPhoto(); if (!p || !p.imgData) return;
    if (zsOpen()) zsHide(false);
    ed.busy = true; paintEdit(true);
    try {
        const t0 = Date.now();
        const preds = await detectZones(p.imgData.split(',')[1]);
        await new Promise(r => setTimeout(r, Math.max(0, 900 - (Date.now() - t0)))); // 너무 빨리 끝나도 잠깐은 보여 준다
        const k = 800 / (dimOf(p).w || 800);
        const raw = preds.map(pr => { const w = pr.width * k, h = pr.height * k; return { x: pr.x * k - w / 2, y: pr.y * k - h / 2, w, h, confidence: pr.confidence }; }).filter(b => b.w > 0 && b.h > 0);
        const boxes = readingOrder(refineZones(applyNMS(raw, 0.45), 800, h800(p)));
        ed.busy = false;
        if (!boxes.length) { ed.draw = true; paintEdit(true); toast('구역을 찾지 못했어요 · 사진 위를 끌어서 직접 그려 주세요'); return; }
        // 찾은 칸을 바로 사진 위에 (11/10 — 예전엔 고르는 화면을 한 번 거쳤다). 이름은 v1과 같게 1구역·2구역…
        edPush();
        p.zones = boxes.map((b, i) => ({ x: b.x, y: b.y, w: b.w, h: b.h, name: `${i + 1}구역`, items: [], checkedAt: Date.now() }));
        const low = p.zones.filter((z, i) => (boxes[i].confidence || 0) < 0.6);
        low.forEach(z => AI_LOW.add(z));
        ed.sel = null; saveAll(); paintEdit(true);
        toast(`구역 ${boxes.length}개를 넣었어요${low.length ? ` · 점선 ${low.length}곳은 맞는지 봐 주세요` : ' · 칸을 눌러 물건을 넣어요'}`, () => ACT.edUndo());
    } catch (err) {
        ed.busy = false; paintEdit(true);
        if (err instanceof AiLimitError) openSheet(`<h2>AI 칸 찾기를 쓸 수 없어요</h2><p>${esc(err.message === 'free' ? AI_FREE_DONE : err.message + ' 칸은 [구역 그리기]로 그려 주세요.')}</p><div class="stack"><button type="button" class="btn btn-p" data-act="edAIDraw">직접 그리기</button></div>`);
        else toast('AI 칸 찾기에 실패했어요 · 인터넷을 확인하거나 직접 그려 주세요');
    }
}
// 물건 창에서 부르는 것: 그 칸 고르기 · '+ 새 칸 그리기'
function edSheetSel(zi) {
    if (!ed) return; const p = edPhoto(), z = p && p.zones[zi];
    if (z && AI_LOW.has(z)) AI_LOW.delete(z); // 열어 봤으면 '확인' 끝
    if (ed.sel !== zi || ed.draw) { ed.sel = zi; ed.draw = false; paintEdit(true); } else if (z) paintEdit(true);
}
function edArmDraw() {
    if (!ed) return;
    ed.draw = true; ed.sel = null; zsClose();
    toast('사진 위를 끌어서 다음 칸을 그려요');
    setTimeout(() => { const ph = $('#edPh'), bar = document.querySelector('#s-edit .ed-bar'); if (!ph) return; const top = (bar ? bar.getBoundingClientRect().bottom : 0) + 10, r = ph.getBoundingClientRect(); if (r.top < top || r.bottom > innerHeight) window.scrollBy({ top: r.top - top, behavior: 'smooth' }); }, 80);
}

SCREENS.tips = renderTips; SCREENS.edit = renderEdit;
NODATA.add('tips');
Object.assign(ACT, {
    tpPick: () => { lsSet('photoTipSeen', '1'); pickKind = null; pendingSpaceLink = null; const f = $('#tpFile'); if (f) f.click(); },
    addPhoto: () => pickPhoto(),
    // 공간 사진 (11/10): 넓게 한 장 → 가구 네모 → 가구 사진과 잇기
    addSpace: () => openSheet(`<h2>공간 사진 넣기</h2><p>방·창고·매장이 한눈에 들어오게 <b>넓게 한 장</b> 찍어요 (문 쪽에서). 종이에 대충 그린 배치도를 찍어도 돼요.<br>그다음 사진 위에 가구(선반·냉장고·서랍장)를 네모로 그리고, 네모마다 어느 가구 사진인지 고르면 끝이에요. 찾을 때 ‘어느 가구 → 어느 칸’으로 알려 줘요.</p><div class="stack"><button type="button" class="btn btn-p" data-act="addSpaceGo">사진 고르기</button><button type="button" class="btn btn-s" data-act="sheetClose">나중에</button></div>`),
    addSpaceGo: () => { closeSheet(); pickPhoto({ space: true }); },
    edToSpace: () => { const p = edPhoto(); if (!p || p.zones.some(z => z.items.length)) return; const before = JSON.stringify(p.zones);
        p.space = true; p.zones.forEach(z => { z.name = ''; }); ed.sel = null; saveAll(); paintEdit(true);
        toast('공간 사진으로 바꿨어요 · 네모를 눌러 가구를 골라요', () => { delete p.space; p.zones = JSON.parse(before); saveAll(); if (cur === 'edit') paintEdit(true); toast('되돌렸어요'); }); },
    edToItem: () => { const p = edPhoto(); if (!p) return; const before = JSON.stringify(p.zones), was = !!p.space;
        if (zsOpen()) zsHide(false);
        delete p.space; p.zones.forEach(z => { delete z.link; }); ed.sel = null; saveAll(); paintEdit(true);
        toast('보통 사진으로 바꿨어요', () => { if (was) p.space = true; p.zones = JSON.parse(before); saveAll(); if (cur === 'edit') paintEdit(true); toast('되돌렸어요'); }); },
    edDone: () => { const p = edPhoto(); const t = $('#edTitle'); if (p && t && t.value.trim() && t.value.trim() !== p.title) { p.title = t.value.trim(); saveAll(); } goBack(p ? `#/map/${encodeURIComponent(p.id)}` : '#/'); },
    edDraw: () => { ed.draw = !ed.draw; if (ed.draw) ed.sel = null; paintEdit(true); if (ed.draw) toast('사진 위를 끌어서 칸을 그려요'); },
    edDel: () => edDeleteZone(),
    edDelOk: () => { const f = ed && ed.pendingDel; closeSheet(); if (f) { ed.pendingDel = null; f(); } },
    edUndo: () => { const p = edPhoto(); if (!p || !ed.undo.length) return; if (zsOpen()) zsHide(false); p.zones = JSON.parse(ed.undo.pop()); ed.sel = null; saveAll(); if (cur === 'edit') { if (parseRoute().q.has('sz')) zsClose(); paintEdit(true); } toast('되돌렸어요'); },
    edZoom: () => { ed.zoom = ed.zoom > 1 ? 1 : 2; paintEdit(true); },
    edPickRow: (el) => zsGo(ed.pid, +el.dataset.i), // 목록에서 눌러도 그 칸 물건 창 (사진은 그 칸이 보이게)
    edAI: () => edAI(),
    edAIGo: () => edAIGo(),
    edAIDraw: () => { closeSheet(); ed.draw = true; paintEdit(true); },
    edAIInfo: () => openSheet(`<h2>AI 구역 찾기</h2><p>사진을 칸 찾는 분석 서버로 보내 선반·칸 모양만 찾아요. 찾은 결과(칸 위치)만 돌아오고, 사진은 저장하지 않아요. 무료 베타는 기기마다 ${AI_FREE}번이에요. 사람 얼굴·송장·서류가 찍힌 사진은 보내지 마세요.</p><div class="stack"><button type="button" class="btn btn-p" data-act="sheetClose">알겠어요</button></div>`),
    edDelPhoto: () => { const p = edPhoto(); if (!p) return; const n = p.zones.reduce((a, z) => a + z.items.length, 0);
        openSheet(`<h2>이 사진을 지울까요?</h2><p>구역 ${p.zones.length}개${n ? `와 물건 ${n}개` : ''}도 같이 지워져요. 지운 뒤에도 잠깐은 되돌릴 수 있어요.</p><div class="stack"><button type="button" class="btn btn-p" data-act="edDelPhotoOk">사진 지우기</button><button type="button" class="btn btn-s" data-act="sheetClose">그대로 두기</button></div>`); },
    edDelPhotoOk: () => { closeSheet(); const p = edPhoto(); if (!p) return; const idx = photos.indexOf(p); photos.splice(idx, 1); saveAll(); goHome();
        toast('사진을 지웠어요', () => { photos.splice(Math.min(idx, photos.length), 0, p); saveAll(); route(true); toast('되돌렸어요'); }); }
});
