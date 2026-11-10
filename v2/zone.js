'use strict';
// ────────────────────────────────────────────────────────────
// 오브젯도 v2 — 칸·물건 관리
//   ① 물건 창: 지도·구역 고치기에서 칸을 누르면 사진 위로 올라오는 창 (11/10). 사진은 그대로 보이고, 다른 칸을 누르면 그 칸으로 바뀐다
//      주소 끝에 ?sp=사진&sz=칸 이 붙는다 → 폰의 '뒤로'를 누르면 창만 닫힌다
//   ② 칸 화면 #/zone/사진/칸: 물건 창의 '자세히' · 찾은 결과의 '물건 넣기·고치기'
//   둘 다 같은 것: 물건 넣기(쓰기·쉼표·붙여 넣기·말로) · 자주 쓰는 물건 후보(자리 미정 먼저, 입력칸 바로 아래) · 물건 카드(재고·최소·유통기한·메모·즐겨찾기·빼기)
//   v1 칸 창과 같은 규칙: 고치면 그 칸 확인 날짜가 오늘로, 새로 쓴 물건은 자주 쓰는 물건 맨 앞에, 칸에 들어간 물건은 자리 미정에서 빠진다
//   v1과 다른 점: 닫을 때가 아니라 고칠 때마다 바로 저장 (넣기·빼기는 '되돌리기')
//   넣은 뒤엔 입력칸은 그대로 두고 목록만 다시 그린다 → 키보드가 내려가지 않아 여러 개를 이어서 쓸 수 있다
// ────────────────────────────────────────────────────────────
addCSS(`
.zz-title { display: block; width: 100%; margin: 0; padding: 0 0 2px; border: 0; border-bottom: 1px solid transparent; background: transparent; font-family: var(--serif); font-size: 28px; font-weight: 700; line-height: 1.3; color: var(--ink); border-radius: 0; }
.zz-title:focus { outline: 0; border-bottom-color: var(--ink); }
.zz-headrow { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-top: 22px; }
.zz-headrow .meta { padding: 8px 0 0; flex: none; }
.zz-sub { margin: 2px 0 0; font-size: 14px; color: var(--sub); }
.zz-ph { margin-top: 16px; }
.zz-ph .ph { width: min(100%, calc(24vh * var(--ar))); margin: 0; }
.zz-phbtn { display: block; width: 100%; padding: 0; border: 0; background: none; cursor: pointer; }
.zz-add { margin-top: 22px; }
.zz-sug { margin-top: 4px; }
.zz-sug .row { min-height: 50px; font-size: 15px; }
.zz-sug .row span small { display: block; font-size: 12px; color: var(--sub); }
.zz-sug .row b { font-weight: 500; }
.zz-sug .row em { flex: none; font-style: normal; font-size: 14px; color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
.zz-ask { margin-top: 14px; padding: 14px 16px; border: 1px solid var(--line); background: var(--sheet); }
.zz-ask p { margin: 0 0 10px; font-size: 14px; }
.zz-ask .chips { margin-top: 0; }
.zz-ask .chip { min-height: 38px; font-size: 14px; }
.zz-it { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 54px; padding: 8px 0; border: 0; border-bottom: 1px solid var(--line); background: none; text-align: left; font-size: 17px; cursor: pointer; }
.zz-it .nm { flex: 1; min-width: 0; }
.zz-it .nm small { display: block; font-size: 13px; color: var(--sub); }
.zz-it .pin { color: var(--accent); margin-right: 4px; }
.zz-it.open { border-bottom-color: transparent; }
.zz-card { margin: 0 0 12px; padding: 16px; border: 1px solid var(--line); background: var(--sheet); }
.zz-f { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 52px; font-size: 15px; color: var(--sub); }
.zz-f + .zz-f { border-top: 1px solid var(--line2); }
.zz-step { display: flex; align-items: center; gap: 8px; color: var(--ink); }
.zz-step button { width: 44px; height: 44px; border: 1px solid var(--ink); border-radius: 2px; background: none; font-size: 20px; cursor: pointer; }
.zz-step input { width: 52px; text-align: center; font-family: var(--serif); font-size: 20px; }
.zz-card input[type=date], .zz-card input[type=search] { border: 0; border-bottom: 1px solid var(--ink); background: transparent; font: inherit; font-size: 16px; color: var(--ink); padding: 6px 0; border-radius: 0; min-width: 0; }
.zz-card input[data-num] { width: 64px; text-align: center; }
.zz-card .zz-memo { display: block; padding: 10px 0 4px; border-top: 1px solid var(--line2); }
.zz-card .zz-memo span { display: block; font-size: 13px; color: var(--sub); }
.zz-card .zz-memo input { width: 100%; }
.zz-card-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 6px; border-top: 1px solid var(--line2); }
.zz-card-foot button { min-height: 44px; border: 0; background: none; font-size: 15px; cursor: pointer; padding: 0; }
.zz-card-foot .rm { color: var(--accent); }
.zz-low { color: var(--accent); font-size: 13px; }
.zz-more { min-height: 44px; border: 0; background: none; padding: 0; color: var(--accent); font-size: 14px; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.zz-foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px 18px; margin-top: 30px; padding-bottom: 26px; }
.zz-foot button, .zz-foot a { min-height: 44px; border: 0; background: none; padding: 0; font-size: 15px; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; color: var(--ink); }
.zz-foot .danger { color: var(--accent); }
.hint:empty { display: none; }
.zz-chips-lab { margin: 12px 0 0; font-size: 12px; letter-spacing: .04em; color: var(--sub); }

/* 물건 창 — 아래에서 올라오지만 뒤를 가리지 않는다 (사진을 보면서 넣고, 다른 칸을 눌러 바꾼다) */
.zs { position: fixed; left: 0; right: 0; bottom: var(--kb, 0px); z-index: 35; width: 100%; max-width: 480px; margin: 0 auto; display: flex; flex-direction: column; max-height: min(52vh, calc(var(--vvh, 100vh) - 72px)); background: var(--bg); border-top: 1.5px solid var(--ink); box-shadow: 0 -10px 30px rgba(36, 30, 26, .16); padding-bottom: env(safe-area-inset-bottom); }
.zs.up { animation: zsUp .2s ease-out; }
@keyframes zsUp { from { transform: translateY(26px); opacity: .5; } }
.zs-head { flex: none; display: flex; align-items: center; gap: 12px; padding: 10px 4px 4px var(--gut); }
.zs-n { flex: none; min-width: 34px; height: 34px; padding: 0 7px; display: flex; align-items: center; justify-content: center; background: var(--accent); color: #fff; font-family: var(--serif); font-size: 19px; font-weight: 700; }
.zs-tt { flex: 1; min-width: 0; }
.zs-name { display: block; width: 100%; margin: 0; padding: 0; border: 0; border-bottom: 1px solid transparent; background: transparent; font-family: var(--serif); font-size: 20px; font-weight: 700; line-height: 1.35; color: var(--ink); border-radius: 0; }
.zs-name:focus { outline: 0; border-bottom-color: var(--ink); }
.zs-name::placeholder { color: var(--ink); }
.zs-tt small { display: block; font-size: 12px; color: var(--sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.zs-x { flex: none; width: 48px; height: 48px; border: 0; background: none; font-size: 28px; line-height: 1; color: var(--sub); cursor: pointer; }
.zs-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; padding: 0 var(--gut) 12px; }
.zs-body .field input { padding: 10px 0; }
.zs-chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 6px calc(-1 * var(--gut)) 0; padding: 0 var(--gut) 2px; }
.zs-chips::-webkit-scrollbar { display: none; }
.zs-chips .chip { flex: none; min-height: 42px; padding: 0 14px; font-size: 15px; white-space: nowrap; }
.zs-body .sec-head { margin-top: 16px; }
.zs-body .empty { margin: 14px 0 4px; }
.zs-more { display: flex; flex-wrap: wrap; gap: 0 20px; margin-top: 16px; padding-top: 4px; border-top: 1px solid var(--line2); }
.zs-more button { min-height: 44px; border: 0; background: none; padding: 0; font-size: 14px; text-decoration: underline; text-underline-offset: 4px; color: var(--sub); cursor: pointer; }
.zs-more .danger { color: var(--accent); }
.zs-foot { flex: none; display: grid; grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr) minmax(0, 1.15fr); gap: 8px; padding: 8px var(--gut) 10px; border-top: 1px solid var(--line); }
.zs-foot .btn { min-height: 50px; padding: 0 6px; font-size: 15px; white-space: nowrap; }
/* 창 안을 세 덩어리로 (11/10): 위 '넣기'(옅은 바탕) · 가운데 '이 칸의 물건' · 아래 링크 */
.zs-add { margin: 0 calc(-1 * var(--gut)); padding: 2px var(--gut) 14px; background: var(--sheet); border-top: 1px solid var(--line2); border-bottom: 1px solid var(--line); }
.zs-list-h { display: flex; justify-content: space-between; align-items: baseline; margin-top: 14px; padding-bottom: 8px; border-bottom: 1.5px solid var(--ink); }
.zs-list-h b { font-family: var(--serif); font-size: 17px; font-weight: 700; }
.zs-list-h span { font-size: 12px; color: var(--sub); }
.zs-body .zz-it { min-height: 50px; font-size: 16px; }
/* 손잡이: 끌어서 창 높이 맞추기 (폰·좁은 화면) — 맞춘 높이는 기억, 두 번 누르면 처음 크기 */
.zs-grab { flex: none; display: flex; justify-content: center; align-items: center; height: 20px; margin-bottom: -8px; cursor: ns-resize; touch-action: none; }
.zs-grab i { width: 44px; height: 4px; border-radius: 2px; background: var(--line); }
.zs.sized { height: min(calc(var(--vvh, 100vh) * var(--zsfrac, .52)), calc(var(--vvh, 100vh) - 72px)); max-height: none; }
body.zs-on .app { padding-bottom: calc(var(--zsh, 50vh) + 8px); }
body.zs-on .toast { bottom: calc(var(--zsh, 50vh) + var(--kb, 0px) + 10px); }
.zn.cur { border: calc(3px * var(--k)) solid var(--accent); box-shadow: 0 0 0 calc(2px * var(--k)) #fff; z-index: 4; }
.zn.cur b { background: var(--accent); color: #fff; }
.zrow.cur { background: var(--hl); box-shadow: -10px 0 0 var(--hl), 10px 0 0 var(--hl); }
/* 넓은 화면(PC): 창을 사진 오른쪽 옆에 세로로 길게 — 사진을 가리지 않고, 위아래를 다 써서 안쪽 스크롤도 줄어든다 */
@media (min-width: 1000px) {
    .zs, .zs.sized { top: 12px; bottom: 12px; left: calc(50% + 42px); right: auto; width: 420px; max-width: 420px; height: auto; max-height: none; margin: 0; border: 1px solid var(--ink); box-shadow: 0 12px 40px rgba(36, 30, 26, .18); }
    .zs.up { animation-name: zsSide; }
    .zs-grab { display: none; }
    .app { transition: margin-left .2s ease; }
    body.zs-on .app { margin-left: calc(50% - 462px); padding-bottom: 0; }
    body.zs-on .toast { bottom: calc(18px + env(safe-area-inset-bottom)); left: calc(50% - 222px); }
}
@keyframes zsSide { from { transform: translateX(24px); opacity: .5; } }
@media (prefers-reduced-motion: reduce) { .zs.up { animation: none; } .app { transition: none; } }
`);

const MIC_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0"></path><line x1="12" y1="18" x2="12" y2="21"></line></svg>';
let zz = null; // { key, pid, zi, open, more, listening, mode: 'screen' | 'sheet' }
function zoneHash(pid, zi) { return `#/zone/${encodeURIComponent(pid)}/${zi}`; }
function openZone(pid, zi) { nav(zoneHash(pid, zi)); }
function zzCur() { const p = zz && photoById(zz.pid), z = p && p.zones[zz.zi]; return z ? { p, z, zi: zz.zi } : null; }
const zzRoot = () => (zz && zz.mode === 'sheet' ? $('#zsheet') : $('#s-zone'));
const zzQ = (sel) => { const r = zzRoot(); return r ? r.querySelector(sel) : null; };
const zzShown = () => !!zz && (zz.mode === 'sheet' ? zsOpen() : cur === 'zone');

// ── 두 모양이 같이 쓰는 조각 ──
function zzCands(z) { // 자주 쓰는 물건 후보: 자리 미정 먼저, 이 칸에 이미 있는 건 빼고
    const inbox = inboxItems().map(x => x.name), have = new Set(z.items.map(i => i.name));
    return { inbox, list: [...new Set([...inbox, ...loadBaseItems()])].filter(n => !have.has(n)) };
}
function zzExample(z) {
    const have = new Set(z.items.map(i => i.name)), exHere = exampleNames(3).filter(n => !have.has(n));
    return (exHere.length ? exHere : (useMode() === 'home' ? ['건전지', '테이프', '가위'] : ['빨대', '컵홀더', '냅킨'])).slice(0, 2).join(', ');
}
function zzFieldHTML(z, hint) {
    const ph = zz.mode === 'sheet' ? '물건 이름 · 쉼표로 여러 개' : `쉼표로 여러 개 · 예: ${zzExample(z)}`; // 창은 좁아서 짧게 (예시는 바로 아래 자주 쓰는 물건이 대신)
    return `<div class="field"><input id="zzIn" type="search" enterkeyhint="done" autocomplete="off" placeholder="${esc(ph)}" aria-label="넣을 물건 이름"><button type="button" class="icon-btn${zz.listening ? ' on' : ''}" data-act="zzMic" aria-label="말로 넣기">${MIC_SVG}</button></div>
        <p class="hint" id="zzHint">${hint || ''}</p>
        <div class="zz-sug rows" id="zzSug"></div>`;
}
const zzChip = (n, inbox) => `<button type="button" class="chip" data-act="zzPut" data-n="${esc(n)}">${esc(n)}${inbox.includes(n) ? '<small>자리 미정</small>' : ''}</button>`;
function zzChipsHTML(z) {
    const { inbox, list } = zzCands(z); if (!list.length) return '';
    if (zz.mode === 'sheet') return `<p class="zz-chips-lab">자주 쓰는 물건 · 누르면 바로 들어가요</p><div class="zs-chips" id="zzChipRow">${list.slice(0, 40).map(n => zzChip(n, inbox)).join('')}</div>`;
    const shown = zz.more ? list : list.slice(0, 10);
    return `<p class="zz-chips-lab">자주 쓰는 물건 · 누르면 바로 들어가요</p><div class="chips" style="margin-top:8px">${shown.map(n => zzChip(n, inbox)).join('')}</div>`
        + (list.length > shown.length ? `<button type="button" class="zz-more" data-act="zzMore">${list.length - shown.length}개 더 보기</button>` : '');
}
function zzAskHTML() {
    if (needIndustryAsk() && zz.mode === 'sheet') // 창에선 한 줄로 (옆으로 밀어 고르기)
        return `<p class="zz-chips-lab">어떤 곳이에요? 고르면 자주 쓰는 물건을 맞춰 드려요</p><div class="zs-chips">${INDUSTRY_ASK_CHIPS.map(([k, l]) => `<button type="button" class="chip" data-act="zzIndustry" data-k="${k}">${esc(l)}</button>`).join('')}<button type="button" class="chip" data-act="zzIndustry" data-k="">건너뛰기</button></div>`;
    return needIndustryAsk() ? `<div class="zz-ask"><p>어떤 곳이에요? 자주 쓰는 물건 목록을 맞춰 드려요</p><div class="chips">${INDUSTRY_ASK_CHIPS.map(([k, l]) => `<button type="button" class="chip" data-act="zzIndustry" data-k="${k}">${esc(l)}</button>`).join('')}<button type="button" class="chip" data-act="zzIndustry" data-k="">건너뛰기</button></div></div>` : '';
}
function zzItemsHTML(z) {
    const items = itemsSorted(z);
    return items.length ? items.map(it => zzItemHTML(it)).join('') : `<p class="empty">아직 비어 있어요 · 위에 쓰거나 자주 쓰는 물건을 눌러 넣어요</p>`;
}
function zzItemHTML(it) {
    const open = zz.open === it.name, S = stockOn(), E = feat('exp'), low = itemLow(it), st = expState(it);
    const head = `<button type="button" class="zz-it${open ? ' open' : ''}" data-act="zzOpen" data-n="${esc(it.name)}" aria-expanded="${open}"><span class="nm">${it.pin ? '<span class="pin">★</span>' : ''}${esc(it.name)}${it.comment ? `<small>${esc(it.comment)}</small>` : ''}</span><span>${itemMarks(it)}</span></button>`;
    if (!open) return head;
    return head + `<div class="zz-card" data-n="${esc(it.name)}" data-pz="${esc(zz.pid)}:${zz.zi}">
        ${S ? `<div class="zz-f"><span>재고</span><span class="zz-step"><button type="button" data-act="zzQty" data-d="-1" aria-label="하나 빼기">−</button><input ${NUM_IN} data-f="qty" value="${isNum(it.qty) ? it.qty : ''}" aria-label="지금 수량"><button type="button" data-act="zzQty" data-d="1" aria-label="하나 더">+</button></span></div>
              <div class="zz-f"><span>최소 수량 <small class="zz-low">${low ? `· ${it.par - it.qty}개 모자라요` : ''}</small></span><span><input ${NUM_IN} data-f="par" value="${isNum(it.par) ? it.par : ''}" aria-label="최소 수량" placeholder="없음">개</span></div>` : ''}
        ${E ? `<div class="zz-f"><span>유통기한 ${st ? `<small class="zz-low">· ${esc(expLabel(it))}</small>` : ''}</span><input type="date" data-f="exp" value="${esc(it.exp || '')}" aria-label="유통기한"></div>` : ''}
        <label class="zz-memo"><span>메모 (어디쯤 있는지)</span><input type="search" data-f="comment" value="${esc(it.comment || '')}" placeholder="예: 맨 앞 줄, 라벨이 보이게" enterkeyhint="done"></label>
        <div class="zz-card-foot"><button type="button" data-act="zzPin" aria-pressed="${!!it.pin}">${it.pin ? '★ 즐겨찾기' : '☆ 즐겨찾기'}</button><button type="button" class="rm" data-act="zzRemove">이 구역에서 빼기</button></div>
    </div>`;
}
// 입력칸·이름 칸 (처음 그릴 때 한 번)
function zzBind() {
    const inp = zzQ('#zzIn');
    if (inp) {
        inp.addEventListener('input', () => zzSuggest(inp.value.trim()));
        inp.addEventListener('focus', () => { if (zz && zz.open) { zz.open = null; zzRepaint(); } }); // 넣으러 오면 고치던 카드는 닫는다
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); const v = inp.value.trim(); if (v) zzAdd(parseTypedItems(v)); else inp.blur(); } });
        inp.addEventListener('paste', (e) => {
            const t = (e.clipboardData || window.clipboardData).getData('text') || '';
            if (!/[\r\n]/.test(t.trim())) return;
            e.preventDefault(); zzReview(parsePastedItems(t), '붙여 넣은 목록');
        });
    }
    const nm = zzQ('#zzName');
    if (nm) {
        nm.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) nm.blur(); });
        nm.addEventListener('change', () => zzSaveName());
    }
}
function zzSaveName() {
    const c = zzCur(), nm = zzQ('#zzName'); if (!c || !nm) return;
    const v = nm.value.trim(); if (v === (c.z.name || '')) return;
    c.z.name = v; markChecked(c.z); saveAll();
}
// 물건 목록 · 후보 · 숫자만 다시 그린다 (입력칸은 그대로 → 쓰던 손이 안 끊기고 키보드도 그대로)
function zzParts() {
    const c = zzCur(); if (!c) return;
    const { p, z, zi } = c, Q = zzQ;
    const meta = Q('#zzMeta');
    if (meta) meta.textContent = zz.mode === 'sheet' ? `${p.title || '사진'} · ${zi + 1}번 칸 · ${z.checkedAt ? `${agoText(z.checkedAt)} 확인` : '확인 기록 없음'}` : (z.checkedAt ? `${agoText(z.checkedAt)} 확인` : '');
    const cnt = Q('#zzCount'); if (cnt) cnt.textContent = zz.mode === 'sheet' ? `이 칸의 물건 ${z.items.length}` : `물건 ${z.items.length}`;
    const ask = Q('#zzAsk'); if (ask) ask.innerHTML = zzAskHTML();
    const ch = Q('#zzChips');
    if (ch) { const row = Q('#zzChipRow'), x = row ? row.scrollLeft : 0; ch.innerHTML = zzChipsHTML(z); const r2 = Q('#zzChipRow'); if (r2) r2.scrollLeft = x; }
    const items = Q('#zzItems'); if (items) items.innerHTML = zzItemsHTML(z);
}
function zzRepaint() { if (!zzShown()) return; const y = window.scrollY; zzParts(); if (zz.mode !== 'sheet') window.scrollTo(0, y); }

// ── ② 칸 화면 #/zone/사진/칸 ──
function renderZone(r) {
    const p = photoById(r.a), zi = parseInt(r.b, 10), z = p && p.zones[zi];
    if (!z) { nav('#/', true); return false; }
    if (!zz || zz.mode !== 'screen' || zz.key !== location.hash) zz = { key: location.hash, pid: String(p.id), zi, open: r.q.get('item') || null, more: false, listening: false, mode: 'screen' };
    paintZone();
}
function paintZone() {
    const c = zzCur(); if (!c) return;
    const { p, z, zi } = c, el = screenEl('zone');
    el.innerHTML = `
        <header class="top">${backBtn('지도', `#/map/${encodeURIComponent(p.id)}`)}<button type="button" class="tlink" data-act="zzDone">완료</button></header>
        <main class="wrap">
            <div class="zz-headrow"><input class="zz-title" id="zzName" type="search" value="${esc(z.name || '')}" placeholder="${zi + 1}번 구역" aria-label="칸 이름" enterkeyhint="done" autocomplete="off"><span class="meta" id="zzMeta"></span></div>
            <p class="zz-sub">${esc(p.title || '사진')} · ${zi + 1}번 칸</p>
            <div class="zz-ph"><button type="button" class="zz-phbtn" data-act="go" data-to="#/edit/${encodeURIComponent(p.id)}?zone=${zi}" aria-label="칸 크기·위치 고치기">${photoHTML(p, { hit: zi })}</button></div>
            <div class="zz-add">
                <span class="kick">물건 넣기</span>
                ${zzFieldHTML(z, '엑셀·메모장 목록을 붙여 넣으면 줄마다 하나씩 들어가요')}
            </div>
            <div id="zzAsk"></div>
            <div id="zzChips"></div>
            <div class="sec-head"><span id="zzCount"></span><span>${stockOn() ? '재고' : ''}</span></div>
            <div id="zzItems"></div>
            <div class="zz-foot"><button type="button" data-act="go" data-to="#/edit/${encodeURIComponent(p.id)}?zone=${zi}">칸 크기·위치 고치기 →</button><button type="button" class="danger" data-act="zzDelete">이 칸 지우기</button></div>
        </main>`;
    zzBind(); zzParts();
}

// ── ① 물건 창 ──
const ZS_SCREENS = new Set(['map', 'edit']);
function zsEl() {
    let el = $('#zsheet');
    if (!el) {
        el = document.createElement('div'); el.id = 'zsheet'; el.className = 'zs'; el.hidden = true;
        el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', '물건 창');
        document.body.appendChild(el);
        try { new ResizeObserver(syncZsH).observe(el); } catch (e) {}
        zsBindGrab(el); zsApplySize();
    }
    return el;
}
// 창 높이: 손잡이로 맞춘 높이를 화면 높이에 대한 비율로 기억 (폰·좁은 화면. 넓은 화면은 오른쪽 옆에 세로로 길게라 상관없음)
const ZS_H_KEY = 'v2SheetH';
function zsApplySize() {
    const el = $('#zsheet'); if (!el) return; const f = parseFloat(ls(ZS_H_KEY));
    if (f >= 0.3 && f <= 0.95) { el.classList.add('sized'); el.style.setProperty('--zsfrac', String(f)); }
    else { el.classList.remove('sized'); el.style.removeProperty('--zsfrac'); }
}
function zsBindGrab(el) {
    let g = null;
    el.addEventListener('pointerdown', (e) => {
        const h = e.target.closest && e.target.closest('.zs-grab'); if (!h || e.button > 0) return;
        g = { y: e.clientY, h: el.offsetHeight, id: e.pointerId }; try { el.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault();
    });
    el.addEventListener('pointermove', (e) => {
        if (!g || e.pointerId !== g.id) return;
        const vh = window.visualViewport ? visualViewport.height : innerHeight, nh = Math.max(vh * 0.3, Math.min(vh - 72, g.h + (g.y - e.clientY)));
        el.classList.add('sized'); el.style.setProperty('--zsfrac', (nh / vh).toFixed(3)); syncZsH();
    });
    let lastTap = 0; // 손잡이를 끌지 않고 두 번 톡톡 → 처음 크기 (끄는 동안엔 누른 곳이 창 전체로 잡혀 dblclick이 손잡이에 오지 않는다)
    const end = (e) => {
        if (!g || e.pointerId !== g.id) return;
        const moved = Math.abs(e.clientY - g.y) > 4; g = null;
        if (!moved) {
            const now = Date.now();
            if (now - lastTap < 400) { lastTap = 0; try { localStorage.removeItem(ZS_H_KEY); } catch (x) {} zsApplySize(); syncZsH(); requestAnimationFrame(zsReveal); }
            else lastTap = now;
            return;
        }
        const f = parseFloat(el.style.getPropertyValue('--zsfrac')); if (f) lsSet(ZS_H_KEY, f.toFixed(3)); requestAnimationFrame(zsReveal);
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}
const zsOpen = () => { const el = $('#zsheet'); return !!el && !el.hidden; };
function syncZsH() { const el = $('#zsheet'); document.documentElement.style.setProperty('--zsh', (el && !el.hidden ? el.offsetHeight : 0) + 'px'); }
function zsHash(pid, zi) {
    const h = zsFree(location.hash || '#/'), i = h.indexOf('?'), u = new URLSearchParams(i < 0 ? '' : h.slice(i + 1));
    u.set('sp', String(pid)); u.set('sz', String(zi));
    return (i < 0 ? h : h.slice(0, i)) + '?' + u;
}
// 칸 누름 → 그 칸 물건 창 (이미 열려 있으면 그 칸으로 바꿈 — 기록은 한 칸만)
function zsGo(pid, zi) {
    const h = zsHash(pid, zi);
    if (h === location.hash) { if (zsOpen()) zsReveal(); else zsSync(parseRoute()); return; }
    if (parseRoute().q.has('sz')) nav(h, true, history.state && history.state.zs ? { zs: 1 } : null);
    else nav(h, false, { zs: 1 });
}
// ×·완료: 창을 연 기록을 걷어 낸다 (폰의 '뒤로'와 같다)
function zsClose() {
    if (!parseRoute().q.has('sz')) { zsHide(true); return; }
    if (history.state && history.state.zs && depth() > 0) history.back();
    else nav(zsFree(location.hash), true);
}
// 주소대로 열고 닫기 (화면을 그린 뒤 · 창 부분만 바뀌었을 때)
function zsSync(r) {
    const sp = r.q.get('sp'), sz = r.q.get('sz');
    if (sp == null || sz == null || !ZS_SCREENS.has(cur)) { zsHide(true); return; }
    const p = photoById(sp), zi = parseInt(sz, 10);
    if (!p || !p.zones[zi]) { zsHide(true); nav(zsFree(location.hash), true); return; } // 그 사이 칸이 없어졌다
    zsShow(p, zi);
}
function zsShow(p, zi) {
    const el = zsEl(), wasOpen = !el.hidden;
    if (wasOpen && zz && zz.mode === 'sheet' && zz.pid === String(p.id) && zz.zi === zi) { zsReveal(); return; }
    if (activeDictation) activeDictation.stop();
    if (wasOpen) zzSaveName();
    zz = { key: 'sheet', pid: String(p.id), zi, open: null, more: false, listening: false, mode: 'sheet' };
    if (!toastUndo) hideToast(); // 안내만 하던 알림은 치운다 (되돌리기 알림은 그대로)
    const zsc = $('#s-zone'); if (zsc && zsc.firstChild) zsc.innerHTML = ''; // 같은 id가 두 곳에 생기지 않게 (칸 화면은 다시 열 때 새로 그린다)
    paintZoneSheet();
    el.hidden = false; document.body.classList.add('zs-on'); zsApplySize();
    if (!wasOpen) { el.classList.remove('up'); void el.offsetWidth; el.classList.add('up'); }
    syncZsH(); zsMark();
    if (cur === 'edit' && typeof edSheetSel === 'function') edSheetSel(zi);
    requestAnimationFrame(() => zsReveal());
}
function zsHide(refresh) {
    const el = $('#zsheet'); if (!el || el.hidden) { if (zz && zz.mode === 'sheet') zz = null; return; }
    if (activeDictation) activeDictation.stop();
    zzSaveName();
    el.hidden = true; el.innerHTML = ''; document.body.classList.remove('zs-on'); syncZsH();
    document.querySelectorAll('.zn.cur, .zrow.cur').forEach(e => e.classList.remove('cur'));
    if (zz && zz.mode === 'sheet') zz = null;
    if (refresh) zsRefreshUnder();
}
function zsRefreshUnder() { // 창에서 고친 게 아래 화면(칸 요약·물건 수)에도 보이게
    const y = window.scrollY;
    if (cur === 'map') { SCREENS.map(parseRoute()); window.scrollTo(0, y); }
    else if (cur === 'edit' && typeof paintEdit === 'function') paintEdit(true);
}
function zsMark() { // 사진 위·목록에서 지금 칸 표시
    document.querySelectorAll('.zn.cur, .zrow.cur').forEach(e => e.classList.remove('cur'));
    if (!zz || cur !== 'map') return;
    document.querySelectorAll('#s-map .zn[data-p], #s-map .zrow[data-p]').forEach(e => { if (e.dataset.p === zz.pid && +e.dataset.z === zz.zi) e.classList.add('cur'); });
}
function zsTarget() {
    if (!zz) return null;
    if (cur === 'edit') return document.querySelector(`#edPh .ed-z[data-i="${zz.zi}"]`);
    return [...document.querySelectorAll('#s-map .zn[data-p]')].find(e => e.dataset.p === zz.pid && +e.dataset.z === zz.zi) || null;
}
function zsReveal() { // 그 칸이 창에 가리지 않게 화면을 살짝 올리거나 내린다
    const t = zsTarget(), sh = $('#zsheet'); if (!t || !sh || sh.hidden) return;
    const bar = document.querySelector('.screen.on > .top, .screen.on > .ed-bar'), strip = document.querySelector('.screen.on .mf-strip');
    const top = Math.max(bar ? bar.getBoundingClientRect().bottom : 0, strip ? strip.getBoundingClientRect().bottom : 0) + 8;
    const app = $('.app'), side = !!app && sh.getBoundingClientRect().left >= app.getBoundingClientRect().right - 2; // 창이 사진 옆에 (넓은 화면)
    const bottom = (side ? innerHeight : sh.getBoundingClientRect().top) - 8, r = t.getBoundingClientRect(), room = bottom - top;
    if (room <= 40 || (r.top >= top && r.bottom <= bottom)) return;
    const dy = r.height > room ? r.top - top : (r.top + r.height / 2) - (top + room / 2);
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollBy({ top: dy, behavior: reduce ? 'auto' : 'smooth' });
}
// 아래 줄 (이전 · 완료 · 다음 또는 새 칸 그리기) — 물건 창·가구 고르기 같이
function zsFootHTML(zi, n, inEdit) {
    const last = zi >= n - 1;
    return `<div class="zs-foot">
            <button type="button" class="btn btn-s" data-act="zsStep" data-d="-1"${zi > 0 ? '' : ' disabled'} aria-label="이전 칸">‹ 이전</button>
            <button type="button" class="btn btn-p" data-act="zsDone">완료</button>
            ${inEdit && last ? `<button type="button" class="btn btn-s" data-act="zsDrawNext">새 칸 그리기</button>` : `<button type="button" class="btn btn-s" data-act="zsStep" data-d="1"${last ? ' disabled' : ''} aria-label="다음 칸">다음 ›</button>`}
        </div>`;
}
// 공간 사진의 네모 = 가구: 물건 넣기 대신 '어느 가구 사진인지' 고른다 (한 가구는 한 네모에만). 없으면 바로 찍어 넣기
let pendingSpaceLink = null; // { pid, zi } — '새로 넣기'로 고른 사진을 이 네모에 잇는다 (make.js onPhotoPicked)
function paintSpaceSheet() {
    const c = zzCur(); if (!c) return;
    const { p, z, zi } = c, el = zsEl(), q = linkedPhoto(z), items = itemPhotos();
    const taken = new Map(); p.zones.forEach((oz, oi) => { if (oi !== zi && oz.link != null) taken.set(String(oz.link), oi); });
    el.innerHTML = `
        <div class="zs-grab" title="끌어서 창 높이 맞추기 · 두 번 누르면 처음 크기"><i></i></div>
        <div class="zs-head">
            <span class="zs-n" aria-hidden="true">${esc(q ? letterOf(q) || '·' : '?')}</span>
            <div class="zs-tt"><b class="zs-static">${q ? esc(q.title || '사진') : '어느 가구예요?'}</b><small>${esc(p.title || '공간 사진')} · ${zi + 1}번 네모</small></div>
            <button type="button" class="zs-x" data-act="zsX" aria-label="창 닫기">×</button>
        </div>
        <div class="zs-body">
            <p class="zz-chips-lab">${q ? '다른 가구로 바꾸려면 눌러요' : '이 네모가 어느 가구(사진)인지 골라요'}</p>
            ${items.length ? `<div class="sp-pick">${items.map(ph => { const on = q === ph, at = taken.get(String(ph.id)); return `<button type="button" class="sp-opt${on ? ' on' : ''}" data-act="spLink" data-p="${esc(ph.id)}" aria-pressed="${on}"><span class="th">${thumbImg(ph)}<em>${esc(letterOf(ph))}</em></span><span class="tt">${esc(ph.title || '사진')}${at != null ? `<small>${at + 1}번 네모에 있음</small>` : ''}</span></button>`; }).join('')}</div>` : '<p class="empty">아직 가구 사진이 없어요 · 아래에서 찍어 넣어요</p>'}
            <button type="button" class="sp-new" data-act="spNew">+ 이 가구 사진 새로 넣기</button>
            <div class="zs-more">${q ? `<button type="button" data-act="spOpen">${esc(q.title || '사진')} 보기 →</button>` : ''}<button type="button" class="danger" data-act="zzDelete">이 네모 지우기</button></div>
        </div>
        ${zsFootHTML(zi, p.zones.length, cur === 'edit')}`;
}
function paintZoneSheet() {
    const c = zzCur(); if (!c) return;
    if (isSpace(c.p)) { paintSpaceSheet(); return; }
    const { p, z, zi } = c, el = zsEl(), n = p.zones.length, inEdit = cur === 'edit';
    el.innerHTML = `
        <div class="zs-grab" title="끌어서 창 높이 맞추기 · 두 번 누르면 처음 크기"><i></i></div>
        <div class="zs-head">
            <span class="zs-n" aria-hidden="true">${zi + 1}</span>
            <div class="zs-tt"><input class="zs-name" id="zzName" type="search" value="${esc(z.name || '')}" placeholder="${zi + 1}번 구역" aria-label="칸 이름 (눌러서 바꾸기)" enterkeyhint="done" autocomplete="off"><small id="zzMeta"></small></div>
            <button type="button" class="zs-x" data-act="zsX" aria-label="물건 창 닫기">×</button>
        </div>
        <div class="zs-body" id="zsBody">
            <div class="zs-add">
                ${zzFieldHTML(z, '')}
                <div id="zzAsk"></div>
                <div id="zzChips"></div>
            </div>
            <div class="zs-list-h"><b id="zzCount"></b><span>${stockOn() ? '재고' : ''}</span></div>
            <div id="zzItems"></div>
            <div class="zs-more"><button type="button" data-act="zsFull">크게 보기 · 자세히</button>${inEdit ? '' : `<button type="button" data-act="zsEdit">칸 크기·위치</button>`}<button type="button" class="danger" data-act="zzDelete">이 칸 지우기</button></div>
        </div>
        ${zsFootHTML(zi, n, inEdit)}`;
    zzBind(); zzParts();
}

// ── 고치기 (두 모양 같이) ──
// 물건 카드 칸에 적으면 바로 저장 (메모는 다시 그리지 않고 → 쓰던 칸에서 손이 안 끊긴다)
document.addEventListener('change', (e) => {
    const f = e.target.closest && e.target.closest('.zz-card [data-f]'); if (!f || !f.closest('#s-zone, #zsheet')) return;
    const card = f.closest('.zz-card'), name = card.dataset.n, [cp, cz] = String(card.dataset.pz || '').split(':'), cph = photoById(cp), cZone = cph && cph.zones[+cz];
    const it = cZone && cZone.items.find(x => x.name === name); if (!it) return; // 카드가 그려진 그 칸의 물건에만 (창이 다른 칸으로 바뀐 뒤 늦게 와도)
    const c = { z: cZone }, k = f.dataset.f, v = f.value.trim();
    if (k === 'qty' || k === 'par') { const n = v === '' ? NaN : Math.max(0, Math.floor(Number(v))); if (isFinite(n)) it[k] = n; else delete it[k]; }
    else if (k === 'exp') { if (/^\d{4}-\d{2}-\d{2}$/.test(v)) it.exp = v; else delete it.exp; }
    else if (k === 'comment') it.comment = v;
    markChecked(c.z); saveAll();
    if (k !== 'comment') { zzRepaint(); return; }
    if (!zz || zz.pid !== cp || zz.zi !== +cz) return; // 지금 보이는 칸이 아니면 목록 글자는 그대로 (다시 열 때 새로 그린다)
    const row = zzQ(`.zz-it[data-n="${CSS.escape(name)}"] .nm`); if (!row) return;
    let sm = row.querySelector('small'); if (!v) { if (sm) sm.remove(); return; }
    if (!sm) { sm = document.createElement('small'); row.appendChild(sm); } sm.textContent = v;
});
document.addEventListener('keydown', (e) => { const f = e.target.closest && e.target.closest('.zz-card input[type=search]'); if (f && f.closest('#s-zone, #zsheet') && e.key === 'Enter' && !e.isComposing) f.blur(); });

function zzSuggest(q) { // 칠 때: 새로 넣기 + 다른 칸에 있는 같은 물건 + 자주 쓰는 물건 중 맞는 것 (v1 renderZmSuggest와 같다)
    const box = zzQ('#zzSug'); if (!box) return;
    if (!q) { box.innerHTML = ''; return; }
    const c = zzCur(); if (!c) return;
    const names = parseTypedItems(q);
    if (names.length > 1) { box.innerHTML = `<button type="button" class="row" data-act="zzAddTyped"><span><b>${names.length}개 넣기</b><small>${esc(names.join(', '))}</small></span><em>넣기</em></button>`; return; }
    const here = new Set(c.z.items.map(i => i.name)), seen = new Set(here), rows = [];
    const hl = (n) => highlight(n, q);
    if (!here.has(q)) rows.push(`<button type="button" class="row" data-act="zzAddTyped"><span><b>‘${esc(q)}’ 넣기</b><small>새 물건 · 엔터를 눌러도 들어가요</small></span><em>넣기</em></button>`);
    else rows.push(`<div class="row" style="cursor:default"><span><b>${esc(q)}</b><small>이미 이 칸에 있어요</small></span></div>`);
    seen.add(q);
    vis().forEach(d => d.zones.forEach((oz, i) => { if (oz === c.z) return; oz.items.forEach(it => {
        if (rows.length >= 4 || seen.has(it.name) || !findMatchRange(it.name, q)) return; seen.add(it.name);
        rows.push(`<button type="button" class="row" data-act="zzPut" data-n="${esc(it.name)}"><span><b>${hl(it.name)}</b><small>${esc(d.title || '사진')} ${i + 1}번에 있어요</small></span><em>이 칸에도</em></button>`);
    }); }));
    [...inboxItems().map(x => x.name), ...loadBaseItems()].forEach(n => { if (rows.length >= 5 || seen.has(n) || !findMatchRange(n, q)) return; seen.add(n);
        rows.push(`<button type="button" class="row" data-act="zzPut" data-n="${esc(n)}"><span><b>${hl(n)}</b><small>${inboxItems().some(x => x.name === n) ? '자리 미정' : '자주 쓰는 물건'}</small></span><em>넣기</em></button>`); });
    box.innerHTML = rows.join('');
}
// 넣기 (여러 개 한 번에). 이미 있는 이름은 건너뛴다. 되돌리기는 넣은 것·새로 만든 자주 쓰는 물건·자리 미정까지 원래대로
// 고치던 카드 칸(수량·메모…)이 아직 눌린 채면 먼저 저장 (blur → change)
function zzCommitCard() { const a = document.activeElement; if (a && a.closest && a.closest('.zz-card [data-f]')) a.blur(); }
function zzAdd(names, label) {
    const c = zzCur(); if (!c) return;
    zzCommitCard();
    names = [...new Set(names.map(n => String(n).trim()).filter(Boolean))];
    const added = names.filter(n => !c.z.items.some(i => i.name === n));
    if (!added.length) { toast(names.length === 1 ? `${josa(names[0], '은', '는')} 이미 이 칸에 있어요` : '모두 이미 이 칸에 있어요'); return; }
    const inboxBefore = kvGet('inboxItems'), checkedBefore = c.z.checkedAt;
    added.forEach(n => c.z.items.push({ name: n, comment: '' }));
    const newBase = addBaseItems(added); // 처음 쓴 물건은 자주 쓰는 물건 맨 앞에 (v1과 같다)
    markChecked(c.z); saveAll(); cleanInbox();
    zz.open = null; // 물건을 넣으면 고치던 카드는 닫는다 (11/10)
    const inp = zzQ('#zzIn'); if (inp && label !== 'chip') inp.value = '';
    const sug = zzQ('#zzSug'); if (sug && label !== 'chip') sug.innerHTML = '';
    zzRepaint();
    const first = added.length > 1 ? `${added[0]} 외 ${added.length - 1}개` : added[0];
    toast(`${josa(first, '을', '를')} 넣었어요`, () => {
        c.z.items = c.z.items.filter(i => !added.includes(i.name));
        if (newBase.length) { const used = new Set(vis().flatMap(d => d.zones.flatMap(z => z.items.map(i => i.name)))); saveBaseItems(loadBaseItems().filter(n => !newBase.includes(n) || used.has(n))); }
        if (inboxBefore != null) kvSet('inboxItems', inboxBefore);
        if (checkedBefore == null) delete c.z.checkedAt; else c.z.checkedAt = checkedBefore;
        saveAll(); zzRepaint(); toast('되돌렸어요');
    });
    const h = zzQ('#zzHint'); if (h) h.textContent = `✓ ${josa(first, '을', '를')} 넣었어요${label === 'chip' ? '' : ' · 다음 물건을 쓰세요'}`;
}
// 여러 개 확인 (붙여 넣기·말로): 넣을 것만 체크 (v1 가져오기 확인 목록과 같다)
function zzReview(names, title) {
    const c = zzCur(); if (!c || !names.length) return;
    const have = new Set(c.z.items.map(i => i.name));
    openSheet(`<h2>${esc(title)} ${names.length}개</h2><p>넣을 것만 체크해 주세요</p>
        <ul class="check-list">${names.map(n => `<li><label><input type="checkbox" value="${esc(n)}" ${have.has(n) ? 'disabled' : 'checked'}><span>${esc(n)}</span>${have.has(n) ? '<small>이미 있음</small>' : ''}</label></li>`).join('')}</ul>
        <div class="stack"><button type="button" class="btn btn-p" data-act="zzReviewOk">넣기</button><button type="button" class="btn btn-s" data-act="sheetClose">그만두기</button></div>`);
}
function zzMic() {
    const inp = zzQ('#zzIn'), hint = zzQ('#zzHint');
    const ok = dictate({
        onState: (on) => { if (!zz) return; zz.listening = on; const b = zzQ('[data-act=zzMic]'); if (b) b.classList.toggle('on', on); if (inp) inp.placeholder = on ? '듣고 있어요… 물건 이름을 말하세요' : '물건 이름 · 쉼표로 여러 개'; if (hint && on) hint.textContent = '여러 개도 한 번에 · “빨대, 컵홀더, 냅킨”'; },
        onText: (t) => { if (inp) inp.value = t; },
        onFinal: (t) => { if (!zz) return; if (inp) inp.value = ''; const names = parseVoiceItems(t); if (!names.length) { if (hint) hint.textContent = '알아들은 물건이 없어요 · 다시 말해 주세요'; return; } if (!SAMPLE) lsSet('voiceAddCount', String((parseInt(ls('voiceAddCount') || '0', 10) || 0) + 1)); zzReview(names, '알아들은 것'); },
        onError: (k) => { if (hint) hint.textContent = DICTATE_HELP[k] || ''; if (k === 'broken' && inp) inp.focus(); }
    });
    if (!ok) { if (hint) hint.textContent = DICTATE_HELP.broken; if (inp) inp.focus(); }
}
function zzRemove(name) {
    const c = zzCur(); if (!c) return;
    const idx = c.z.items.findIndex(i => i.name === name); if (idx < 0) return;
    const it = c.z.items.splice(idx, 1)[0];
    markChecked(c.z); saveAll(); zz.open = null; zzRepaint();
    toast(`${josa(name, '을', '를')} 뺐어요`, () => { if (!c.z.items.some(i => i.name === name)) c.z.items.splice(Math.min(idx, c.z.items.length), 0, it); saveAll(); zzRepaint(); toast('되돌렸어요'); });
}
function zzDelete() {
    const c = zzCur(); if (!c) return;
    if (!c.z.items.length && zz.mode === 'sheet') { zzDeleteOk(); return; } // 빈 칸은 묻지 않고 (되돌리기로 살린다)
    openSheet(`<h2>${c.zi + 1}번 칸을 지울까요?</h2><p>${c.z.items.length ? `칸 안의 물건 ${c.z.items.length}개도 같이 지도에서 빠져요.` : '빈 칸이에요.'} 지운 뒤에도 잠깐은 되돌릴 수 있어요.</p>
        <div class="stack"><button type="button" class="btn btn-p" data-act="zzDeleteOk">칸 지우기</button><button type="button" class="btn btn-s" data-act="sheetClose">그대로 두기</button></div>`);
}
function zzDeleteOk() {
    const c = zzCur(); closeSheet(); if (!c) return;
    const idx = c.p.zones.indexOf(c.z); if (idx < 0) return;
    const inSheet = zz.mode === 'sheet';
    if (inSheet) { // 창을 먼저 닫는다 (칸 번호가 당겨져 옆 칸 이름을 덮어쓰지 않게)
        zsHide(false);
        if (cur === 'edit' && typeof edPush === 'function') { edPush(); if (ed) ed.sel = null; }
    }
    const z = c.p.zones.splice(idx, 1)[0];
    saveAll();
    if (inSheet) { zsRefreshUnder(); zsClose(); } else nav(`#/map/${encodeURIComponent(c.p.id)}`, true);
    toast(`${idx + 1}번 칸을 지웠어요`, () => { c.p.zones.splice(Math.min(idx, c.p.zones.length), 0, z); saveAll(); route(true); toast('되돌렸어요'); });
}

SCREENS.zone = renderZone;
SHEET_ONLY = (r) => zsSync(r);
AFTER_ROUTE.push((name, r) => zsSync(r));
BEFORE_ROUTE.push((name) => { zsHide(false); if (name !== 'zone' && activeDictation) activeDictation.stop(); });
window.addEventListener('resize', () => { syncZsH(); });
Object.assign(ACT, {
    zzDone: () => { const c = zzCur(); if (c) { zzSaveName(); markChecked(c.z); saveAll(); } toast('오늘 확인으로 적었어요'); goBack(c ? `#/map/${encodeURIComponent(c.p.id)}` : '#/'); },
    zzOpen: (el) => {
        zz.open = zz.open === el.dataset.n ? null : el.dataset.n; zzRepaint();
        if (zz.open && zz.mode === 'sheet') { const card = zzQ('.zz-card'); if (card) card.scrollIntoView({ block: 'nearest' }); }
    },
    zzQty: (el) => {
        const c = zzCur(), card = el.closest('.zz-card'), it = c && card && c.z.items.find(x => x.name === card.dataset.n); if (!it) return;
        it.qty = Math.max(0, (isNum(it.qty) ? it.qty : 0) + Number(el.dataset.d)); markChecked(c.z); saveAll(); zzRepaint();
    },
    zzPin: (el) => { const c = zzCur(), card = el.closest('.zz-card'), it = c && card && c.z.items.find(x => x.name === card.dataset.n); if (!it) return; if (it.pin) delete it.pin; else it.pin = true; saveAll(); zzRepaint(); },
    zzRemove: (el) => { const card = el.closest('.zz-card'); if (card) zzRemove(card.dataset.n); },
    zzPut: (el) => zzAdd([el.dataset.n], el.closest('#zzSug') ? 'typed' : 'chip'),
    zzAddTyped: () => { const inp = zzQ('#zzIn'); if (inp && inp.value.trim()) zzAdd(parseTypedItems(inp.value)); },
    zzMore: () => { zz.more = true; zzRepaint(); },
    zzMic: () => zzMic(),
    zzReviewOk: () => { const picked = [...document.querySelectorAll('#sheet .check-list input:checked')].map(i => i.value); closeSheet(); if (picked.length) zzAdd(picked); },
    zzIndustry: (el) => { if (el.dataset.k) { setIndustry(el.dataset.k); toast('자주 쓰는 물건을 맞췄어요'); } else kvSet('industryAsked', '1'); zzRepaint(); },
    zzDelete: () => zzDelete(),
    zzDeleteOk: () => zzDeleteOk(),
    // 물건 창
    zsX: () => zsClose(),
    zsDone: () => { const c = zzCur(), inMap = cur === 'map', sp = c && isSpace(c.p); if (c && !sp) { zzSaveName(); markChecked(c.z); saveAll(); } zsClose(); if (c && inMap && !sp) toast(`${c.zi + 1}번 칸 · 오늘 확인으로 적었어요`); },
    spLink: (el) => { // 이 네모 = 이 가구 사진 (다른 네모에 있던 거면 옮겨 온다)
        const c = zzCur(), q = photoById(el.dataset.p); if (!c || !q) return;
        const was = c.p.zones.find((oz, oi) => oi !== c.zi && oz.link != null && String(oz.link) === String(q.id));
        if (was) { delete was.link; was.name = ''; }
        if (!c.p.space) c.p.space = true;
        c.z.link = String(q.id); c.z.name = q.title || ''; saveAll();
        paintSpaceSheet(); syncZsH(); if (cur === 'edit' && typeof paintEdit === 'function') paintEdit(true);
        toast(was ? `${q.title || '사진'} · 다른 네모에서 옮겨 왔어요` : `${letterOf(q)} ${q.title || '사진'}${josa(q.title || '사진', '과', '와').slice((q.title || '사진').length)} 이었어요`);
    },
    spNew: () => { const c = zzCur(); if (c && typeof pickPhoto === 'function') pickPhoto({ link: { pid: String(c.p.id), zi: c.zi } }); },
    spOpen: () => { const c = zzCur(), q = c && linkedPhoto(c.z); if (q) nav(`#/map/${encodeURIComponent(q.id)}?v=flow`); },
    zsStep: (el) => { const c = zzCur(); if (!c) return; const ni = c.zi + Number(el.dataset.d); if (c.p.zones[ni]) zsGo(c.p.id, ni); },
    zsDrawNext: () => { if (typeof edArmDraw === 'function') edArmDraw(); },
    zsFull: () => { const c = zzCur(); if (c) { zzSaveName(); nav(zoneHash(c.p.id, c.zi)); } },
    zsEdit: () => { const c = zzCur(); if (c) { zzSaveName(); nav(`#/edit/${encodeURIComponent(c.p.id)}?zone=${c.zi}`); } }
});
