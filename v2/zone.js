'use strict';
// ────────────────────────────────────────────────────────────
// 오브젯도 v2 — 칸·물건 관리 (B-Zone)   #/zone/사진/칸
//   물건 넣기(쓰기·쉼표·붙여 넣기·말로) · 자주 쓰는 물건 후보(자리 미정 먼저) · 물건 카드(재고·최소·유통기한·메모·즐겨찾기·빼기)
//   v1 칸 창과 같은 규칙: 고치면 그 칸 확인 날짜가 오늘로, 새로 쓴 물건은 자주 쓰는 물건 맨 앞에, 칸에 들어간 물건은 자리 미정에서 빠진다
//   v1과 다른 점: 닫을 때가 아니라 고칠 때마다 바로 저장 (넣기·빼기는 '되돌리기')
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
.zz-ask { margin-top: 18px; padding: 14px 16px; border: 1px solid var(--line); background: var(--sheet); }
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
.zz-card input[type=number], .zz-card input[type=date], .zz-card input[type=text] { border: 0; border-bottom: 1px solid var(--ink); background: transparent; font: inherit; font-size: 16px; color: var(--ink); padding: 6px 0; border-radius: 0; min-width: 0; }
.zz-card input[type=number] { width: 64px; text-align: center; }
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
`);

const MIC_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0"></path><line x1="12" y1="18" x2="12" y2="21"></line></svg>';
let zz = null; // { key, pid, zi, open, more, listening }
function zoneHash(pid, zi) { return `#/zone/${encodeURIComponent(pid)}/${zi}`; }
function openZone(pid, zi) { nav(zoneHash(pid, zi)); }
function zzCur() { const p = zz && photoById(zz.pid), z = p && p.zones[zz.zi]; return z ? { p, z } : null; }

function renderZone(r) {
    const p = photoById(r.a), zi = parseInt(r.b, 10), z = p && p.zones[zi];
    if (!z) { nav('#/', true); return false; }
    if (!zz || zz.key !== location.hash) zz = { key: location.hash, pid: String(p.id), zi, open: r.q.get('item') || null, more: false, listening: false };
    paintZone();
}
function paintZone() {
    const c = zzCur(); if (!c) return;
    const { p, z } = c, zi = zz.zi, el = screenEl('zone');
    const items = itemsSorted(z), S = stockOn();
    const inbox = inboxItems().map(x => x.name), base = loadBaseItems(), have = new Set(z.items.map(i => i.name));
    const cands = [...new Set([...inbox, ...base])].filter(n => !have.has(n));
    const shown = zz.more ? cands : cands.slice(0, 10);
    const exHere = exampleNames(3).filter(n => !have.has(n));
    const ex = (exHere.length ? exHere : (useMode() === 'home' ? ['건전지', '테이프', '가위'] : ['빨대', '컵홀더', '냅킨'])).slice(0, 2).join(', ');
    el.innerHTML = `
        <header class="top">${backBtn('지도', `#/map/${encodeURIComponent(p.id)}`)}<button type="button" class="tlink" data-act="zzDone">완료</button></header>
        <main class="wrap">
            <div class="zz-headrow"><input class="zz-title" id="zzName" value="${esc(z.name || '')}" placeholder="${zi + 1}번 구역" aria-label="칸 이름" enterkeyhint="done" autocomplete="off"><span class="meta">${z.checkedAt ? `${agoText(z.checkedAt)} 확인` : ''}</span></div>
            <p class="zz-sub">${esc(p.title || '사진')} · ${zi + 1}번 칸</p>
            <div class="zz-ph"><button type="button" class="zz-phbtn" data-act="go" data-to="#/edit/${encodeURIComponent(p.id)}?zone=${zi}" aria-label="칸 크기·위치 고치기">${photoHTML(p, { hit: zi })}</button></div>
            <div class="zz-add">
                <span class="kick">물건 넣기</span>
                <div class="field"><input id="zzIn" type="text" enterkeyhint="done" autocomplete="off" placeholder="쉼표로 여러 개 · 예: ${esc(ex)}"><button type="button" class="icon-btn${zz.listening ? ' on' : ''}" data-act="zzMic" aria-label="말로 넣기">${MIC_SVG}</button></div>
                <p class="hint" id="zzHint">엑셀·메모장 목록을 붙여 넣으면 줄마다 하나씩 들어가요</p>
                <div class="zz-sug rows" id="zzSug"></div>
            </div>
            ${needIndustryAsk() ? `<div class="zz-ask"><p>어떤 곳이에요? 자주 쓰는 물건 목록을 맞춰 드려요</p><div class="chips">${INDUSTRY_ASK_CHIPS.map(([k, l]) => `<button type="button" class="chip" data-act="zzIndustry" data-k="${k}">${esc(l)}</button>`).join('')}<button type="button" class="chip" data-act="zzIndustry" data-k="">건너뛰기</button></div></div>` : ''}
            <div class="sec-head"><span>물건 ${z.items.length}</span><span>${S ? '재고' : ''}</span></div>
            ${items.length ? items.map(it => zzItemHTML(it)).join('') : '<p class="empty">아직 비어 있어요 · 위에 쓰거나 아래에서 골라 넣어요</p>'}
            ${cands.length ? `<div class="sec-head" style="margin-top:30px"><span>자주 쓰는 물건 · 누르면 들어가요</span><span></span></div>
                <div class="chips">${shown.map(n => `<button type="button" class="chip" data-act="zzPut" data-n="${esc(n)}">${esc(n)}${inbox.includes(n) ? '<small>자리 미정</small>' : ''}</button>`).join('')}</div>
                ${cands.length > shown.length ? `<button type="button" class="zz-more" data-act="zzMore">${cands.length - shown.length}개 더 보기</button>` : ''}` : ''}
            <div class="zz-foot"><button type="button" data-act="go" data-to="#/edit/${encodeURIComponent(p.id)}?zone=${zi}">칸 크기·위치 고치기 →</button><button type="button" class="danger" data-act="zzDelete">이 칸 지우기</button></div>
        </main>`;
    const inp = $('#zzIn');
    inp.addEventListener('input', () => zzSuggest(inp.value.trim()));
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); const v = inp.value.trim(); if (v) { zzAdd(parseTypedItems(v)); } else inp.blur(); } });
    inp.addEventListener('paste', (e) => {
        const t = (e.clipboardData || window.clipboardData).getData('text') || '';
        if (!/[\r\n]/.test(t.trim())) return;
        e.preventDefault(); zzReview(parsePastedItems(t), '붙여 넣은 목록');
    });
    const nm = $('#zzName');
    nm.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) nm.blur(); });
    nm.addEventListener('change', () => { const c2 = zzCur(); if (!c2) return; const v = nm.value.trim(); if (v === (c2.z.name || '')) return; c2.z.name = v; markChecked(c2.z); saveAll(); });
}
function zzItemHTML(it) {
    const open = zz.open === it.name, S = stockOn(), E = feat('exp'), low = itemLow(it), st = expState(it);
    const head = `<button type="button" class="zz-it${open ? ' open' : ''}" data-act="zzOpen" data-n="${esc(it.name)}" aria-expanded="${open}"><span class="nm">${it.pin ? '<span class="pin">★</span>' : ''}${esc(it.name)}${it.comment ? `<small>${esc(it.comment)}</small>` : ''}</span><span>${itemMarks(it)}</span></button>`;
    if (!open) return head;
    return head + `<div class="zz-card" data-n="${esc(it.name)}">
        ${S ? `<div class="zz-f"><span>재고</span><span class="zz-step"><button type="button" data-act="zzQty" data-d="-1" aria-label="하나 빼기">−</button><input type="number" inputmode="numeric" min="0" data-f="qty" value="${isNum(it.qty) ? it.qty : ''}" aria-label="지금 수량"><button type="button" data-act="zzQty" data-d="1" aria-label="하나 더">+</button></span></div>
              <div class="zz-f"><span>최소 수량 <small class="zz-low">${low ? `· ${it.par - it.qty}개 모자라요` : ''}</small></span><span><input type="number" inputmode="numeric" min="0" data-f="par" value="${isNum(it.par) ? it.par : ''}" aria-label="최소 수량" placeholder="없음">개</span></div>` : ''}
        ${E ? `<div class="zz-f"><span>유통기한 ${st ? `<small class="zz-low">· ${esc(expLabel(it))}</small>` : ''}</span><input type="date" data-f="exp" value="${esc(it.exp || '')}" aria-label="유통기한"></div>` : ''}
        <label class="zz-memo"><span>메모 (어디쯤 있는지)</span><input type="text" data-f="comment" value="${esc(it.comment || '')}" placeholder="예: 맨 앞 줄, 라벨이 보이게" enterkeyhint="done"></label>
        <div class="zz-card-foot"><button type="button" data-act="zzPin" aria-pressed="${!!it.pin}">${it.pin ? '★ 즐겨찾기' : '☆ 즐겨찾기'}</button><button type="button" class="rm" data-act="zzRemove">이 구역에서 빼기</button></div>
    </div>`;
}
// 물건 카드 칸에 적으면 바로 저장 (다시 그리지 않고 → 쓰던 칸에서 손이 안 끊긴다)
document.addEventListener('change', (e) => {
    const f = e.target.closest && e.target.closest('#s-zone .zz-card [data-f]'); if (!f) return;
    const c = zzCur(), name = f.closest('.zz-card').dataset.n, it = c && c.z.items.find(x => x.name === name); if (!it) return;
    const k = f.dataset.f, v = f.value.trim();
    if (k === 'qty' || k === 'par') { const n = v === '' ? NaN : Math.max(0, Math.floor(Number(v))); if (isFinite(n)) it[k] = n; else delete it[k]; }
    else if (k === 'exp') { if (/^\d{4}-\d{2}-\d{2}$/.test(v)) it.exp = v; else delete it.exp; }
    else if (k === 'comment') it.comment = v;
    markChecked(c.z); saveAll();
    if (k !== 'comment') paintZoneKeepScroll(); else { const row = document.querySelector(`#s-zone .zz-it[data-n="${CSS.escape(name)}"] .nm small`); if (row) row.textContent = v; }
});
document.addEventListener('keydown', (e) => { const f = e.target.closest && e.target.closest('#s-zone .zz-card input[type=text]'); if (f && e.key === 'Enter' && !e.isComposing) f.blur(); });
function paintZoneKeepScroll() { const y = window.scrollY; paintZone(); window.scrollTo(0, y); }

function zzSuggest(q) { // 칠 때: 새로 넣기 + 다른 칸에 있는 같은 물건 + 자주 쓰는 물건 중 맞는 것 (v1 renderZmSuggest와 같다)
    const box = $('#zzSug'); if (!box) return;
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
function zzAdd(names, label) {
    const c = zzCur(); if (!c) return;
    names = [...new Set(names.map(n => String(n).trim()).filter(Boolean))];
    const added = names.filter(n => !c.z.items.some(i => i.name === n));
    if (!added.length) { toast(names.length === 1 ? `${josa(names[0], '은', '는')} 이미 이 칸에 있어요` : '모두 이미 이 칸에 있어요'); return; }
    const inboxBefore = kvGet('inboxItems'), checkedBefore = c.z.checkedAt;
    added.forEach(n => c.z.items.push({ name: n, comment: '' }));
    const newBase = addBaseItems(added); // 처음 쓴 물건은 자주 쓰는 물건 맨 앞에 (v1과 같다)
    markChecked(c.z); saveAll(); cleanInbox();
    const inp = $('#zzIn'); if (inp) inp.value = '';
    paintZoneKeepScroll();
    const first = added.length > 1 ? `${added[0]} 외 ${added.length - 1}개` : added[0];
    toast(`${josa(first, '을', '를')} 넣었어요`, () => {
        c.z.items = c.z.items.filter(i => !added.includes(i.name));
        if (newBase.length) { const used = new Set(vis().flatMap(d => d.zones.flatMap(z => z.items.map(i => i.name)))); saveBaseItems(loadBaseItems().filter(n => !newBase.includes(n) || used.has(n))); }
        if (inboxBefore != null) kvSet('inboxItems', inboxBefore);
        if (checkedBefore == null) delete c.z.checkedAt; else c.z.checkedAt = checkedBefore;
        saveAll(); if (cur === 'zone') paintZoneKeepScroll(); toast('되돌렸어요');
    });
    const h = $('#zzHint'); if (h) h.textContent = `✓ ${josa(first, '을', '를')} 넣었어요 · 다음 물건을 쓰세요`;
    setTimeout(() => { const i2 = $('#zzIn'); if (i2 && label !== 'chip') i2.focus(); }, 30);
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
    const inp = $('#zzIn'), hint = $('#zzHint');
    const ok = dictate({
        onState: (on) => { zz.listening = on; const b = document.querySelector('#s-zone [data-act=zzMic]'); if (b) b.classList.toggle('on', on); if (inp) inp.placeholder = on ? '듣고 있어요… 물건 이름을 말하세요' : '쉼표로 여러 개'; if (hint && on) hint.textContent = '여러 개도 한 번에 · “빨대, 컵홀더, 냅킨”'; },
        onText: (t) => { if (inp) inp.value = t; },
        onFinal: (t) => { if (inp) inp.value = ''; const names = parseVoiceItems(t); if (!names.length) { if (hint) hint.textContent = '알아들은 물건이 없어요 · 다시 말해 주세요'; return; } if (!SAMPLE) lsSet('voiceAddCount', String((parseInt(ls('voiceAddCount') || '0', 10) || 0) + 1)); zzReview(names, '알아들은 것'); },
        onError: (k) => { if (hint) hint.textContent = DICTATE_HELP[k] || ''; if (k === 'broken' && inp) inp.focus(); }
    });
    if (!ok) { if (hint) hint.textContent = DICTATE_HELP.broken; if (inp) inp.focus(); }
}
function zzRemove(name) {
    const c = zzCur(); if (!c) return;
    const idx = c.z.items.findIndex(i => i.name === name); if (idx < 0) return;
    const it = c.z.items.splice(idx, 1)[0];
    markChecked(c.z); saveAll(); zz.open = null; paintZoneKeepScroll();
    toast(`${josa(name, '을', '를')} 뺐어요`, () => { if (!c.z.items.some(i => i.name === name)) c.z.items.splice(Math.min(idx, c.z.items.length), 0, it); saveAll(); if (cur === 'zone') paintZoneKeepScroll(); toast('되돌렸어요'); });
}
function zzDelete() {
    const c = zzCur(); if (!c) return;
    openSheet(`<h2>${c.zi + 1}번 칸을 지울까요?</h2><p>${c.z.items.length ? `칸 안의 물건 ${c.z.items.length}개도 같이 지도에서 빠져요.` : '빈 칸이에요.'} 지운 뒤에도 잠깐은 되돌릴 수 있어요.</p>
        <div class="stack"><button type="button" class="btn btn-p" data-act="zzDeleteOk">칸 지우기</button><button type="button" class="btn btn-s" data-act="sheetClose">그대로 두기</button></div>`);
}
function zzDeleteOk() {
    const c = zzCur(); closeSheet(); if (!c) return;
    const idx = c.p.zones.indexOf(c.z); if (idx < 0) return;
    const z = c.p.zones.splice(idx, 1)[0];
    saveAll();
    nav(`#/map/${encodeURIComponent(c.p.id)}`, true);
    toast(`${idx + 1}번 칸을 지웠어요`, () => { c.p.zones.splice(Math.min(idx, c.p.zones.length), 0, z); saveAll(); route(true); toast('되돌렸어요'); });
}

SCREENS.zone = renderZone;
BEFORE_ROUTE.push((name) => { if (name !== 'zone' && activeDictation) activeDictation.stop(); });
Object.assign(ACT, {
    zzDone: () => { const c = zzCur(); if (c) { const nm = $('#zzName'); if (nm && nm.value.trim() !== (c.z.name || '')) c.z.name = nm.value.trim(); markChecked(c.z); saveAll(); } toast('오늘 확인으로 적었어요'); goBack(c ? `#/map/${encodeURIComponent(c.p.id)}` : '#/'); },
    zzOpen: (el) => { zz.open = zz.open === el.dataset.n ? null : el.dataset.n; paintZoneKeepScroll(); },
    zzQty: (el) => {
        const c = zzCur(), card = el.closest('.zz-card'), it = c && card && c.z.items.find(x => x.name === card.dataset.n); if (!it) return;
        it.qty = Math.max(0, (isNum(it.qty) ? it.qty : 0) + Number(el.dataset.d)); markChecked(c.z); saveAll(); paintZoneKeepScroll();
    },
    zzPin: (el) => { const c = zzCur(), card = el.closest('.zz-card'), it = c && card && c.z.items.find(x => x.name === card.dataset.n); if (!it) return; if (it.pin) delete it.pin; else it.pin = true; saveAll(); paintZoneKeepScroll(); },
    zzRemove: (el) => { const card = el.closest('.zz-card'); if (card) zzRemove(card.dataset.n); },
    zzPut: (el) => zzAdd([el.dataset.n], 'chip'),
    zzAddTyped: () => { const inp = $('#zzIn'); if (inp && inp.value.trim()) zzAdd(parseTypedItems(inp.value)); },
    zzMore: () => { zz.more = true; paintZoneKeepScroll(); },
    zzMic: () => zzMic(),
    zzReviewOk: () => { const picked = [...document.querySelectorAll('#sheet .check-list input:checked')].map(i => i.value); closeSheet(); if (picked.length) zzAdd(picked); },
    zzIndustry: (el) => { if (el.dataset.k) { setIndustry(el.dataset.k); toast('자주 쓰는 물건을 맞췄어요'); } else kvSet('industryAsked', '1'); paintZoneKeepScroll(); },
    zzDelete: () => zzDelete(),
    zzDeleteOk: () => zzDeleteOk()
});
