'use strict';
// ────────────────────────────────────────────────────────────
// 오브젯도 v2 — 자리 미정 (B-Unplaced)   #/inbox (?add=이름 · ?focus=1)
//   새로 산 물건을 일단 적어 두고, 추천 칸에 한 번에 넣는다. v1과 같은 키·모양 (inboxItems: [{ name, at }])
//   추천: 같은 물건이 있는 칸 > 같은 종류(상비약 등) 칸 (v1 suggestZone) > 같은 낱말이 든 물건의 칸 (헤이즐넛 시럽 → 바닐라 시럽 칸) > 같은 말(휴지 → 냅킨)
// ────────────────────────────────────────────────────────────
addCSS(`
.ib-lead { margin: 6px 0 0; font-size: 15px; color: var(--sub); }
.ib-add { margin-top: 24px; }
.ib-row { padding: 16px 0; border-bottom: 1px solid var(--line); }
.ib-row:first-of-type { border-top: 1px solid var(--line); margin-top: 20px; }
.ib-top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.ib-top b { font-size: 17px; font-weight: 500; }
.ib-top small { flex: none; font-size: 13px; color: var(--sub); }
.ib-why { margin: 4px 0 10px; font-size: 14px; color: var(--sub); }
.ib-why em { font-style: normal; color: var(--accent); }
.ib-acts { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.ib-acts .btn { width: auto; min-height: 44px; padding: 0 16px; font-size: 15px; }
.ib-acts .x { margin-left: auto; min-height: 44px; border: 0; background: none; padding: 0 4px; font-size: 14px; color: var(--sub); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.ib-preset { margin-top: 26px; }
.pk-list { max-height: 56vh; overflow: auto; margin: 6px 0 16px; }
.pk-list .zrow { min-height: 52px; }
.pk-list h3 { margin: 16px 0 0; padding-bottom: 6px; border-bottom: 1px solid var(--ink); font-family: var(--serif); font-size: 17px; }
`);

let ib = { key: null, listening: false };
function inboxAgo(at) { if (!at) return ''; const t = agoText(at); return t === '오늘' ? '오늘 넣음' : t === '어제' ? '어제 넣음' : t; }
function zoneLabelShort(p, i) { return (vis().length > 1 ? `${p.title || '사진'} ` : '') + `${i + 1}번 구역`; }
function suggestPlace(name) {
    const s = suggestZone(name);
    if (s) return { data: s.data, index: s.index, why: s.sc === 9 ? '같은 물건이 있는 칸' : `${s.kind} 종류가 있는 칸` };
    const words = String(name).split(/\s+/).filter(w => w.length >= 2).reverse(); // 끝 낱말이 보통 물건 종류 (헤이즐넛 '시럽')
    for (const w of words) for (const d of vis()) for (let i = 0; i < d.zones.length; i++) {
        const hit = d.zones[i].items.find(it => it.name !== name && String(it.name).split(/\s+/).some(t => normalizeForSearch(t) === normalizeForSearch(w)));
        if (hit) return { data: d, index: i, why: `${josa(w, '이', '가')} 있는 칸` };
    }
    const syn = synonymsOf(name);
    if (syn.length) for (const d of vis()) for (let i = 0; i < d.zones.length; i++) {
        const hit = d.zones[i].items.find(it => syn.some(t => includesText(t, it.name)));
        if (hit) return { data: d, index: i, why: `${josa(hit.name, '이', '가')} 있는 칸 (같은 말)` };
    }
    return null;
}
function renderInbox(r) {
    if (ib.key !== location.hash) ib = { key: location.hash, listening: false, prefill: r.q.get('add') || '', focus: r.q.get('focus') === '1' || !!r.q.get('add') };
    paintInbox();
}
function paintInbox() {
    const el = screenEl('inbox'), a = inboxItems();
    el.innerHTML = `
        <header class="top">${backBtn('검색', '#/')}<span class="meta">${a.length ? `${a.length}개` : ''}</span></header>
        <main class="wrap" style="flex:1;padding-bottom:30px">
            <h1 class="h1" style="margin-top:20px">자리 미정</h1>
            <p class="ib-lead">새로 산 물건을 일단 넣어 두고, 한가할 때 자리를 정해요.</p>
            <div class="ib-add">
                <span class="kick">새로 산 물건</span>
                <div class="field"><input id="ibIn" type="text" enterkeyhint="done" autocomplete="off" placeholder="예: ${esc(exampleNames(1)[0] || '헤이즐넛 시럽')} · 여러 개는 쉼표로"><button type="button" class="icon-btn${ib.listening ? ' on' : ''}" data-act="ibMic" aria-label="말로 넣기">${MIC_SVG}</button></div>
                <p class="hint" id="ibHint">엑셀·메모장 목록을 붙여 넣으면 줄마다 하나씩 들어가요</p>
            </div>
            ${a.length ? a.map(x => ibRowHTML(x)).join('') : '<p class="empty" style="margin-top:24px">비어 있어요 · 새로 산 물건 이름을 써 두면 넣을 칸을 추천해 드려요</p>'}
            <button type="button" class="row ib-preset" data-act="ibPresets">자주 쓰는 물건 한 번에 넣기<span class="ar" style="font-size:14px">업종별 목록 →</span></button>
            <p class="hint">칸을 열면 자리 미정 물건이 후보 맨 앞에 떠요.</p>
        </main>`;
    const inp = $('#ibIn');
    if (ib.prefill) { inp.value = ib.prefill; ib.prefill = ''; }
    if (ib.focus) { ib.focus = false; setTimeout(() => inp.focus(), 60); }
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); const v = inp.value.trim(); if (v) ibAdd(parseTypedItems(v)); else inp.blur(); } });
    inp.addEventListener('paste', (e) => { const t = (e.clipboardData || window.clipboardData).getData('text') || ''; if (!/[\r\n]/.test(t.trim())) return; e.preventDefault(); ibAdd(parsePastedItems(t)); });
}
function ibRowHTML(x) {
    const s = suggestPlace(x.name);
    return `<div class="ib-row" data-n="${esc(x.name)}">
        <div class="ib-top"><b>${esc(x.name)}</b><small>${esc(inboxAgo(x.at))}</small></div>
        <p class="ib-why">${s ? `<em>추천</em> · ${esc(zoneLabelShort(s.data, s.index))} · ${esc(s.why)}` : '비슷한 물건이 있는 칸이 아직 없어요'}</p>
        <div class="ib-acts">${s ? `<button type="button" class="btn btn-p" data-act="ibPlace" data-p="${esc(s.data.id)}" data-z="${s.index}">${esc(zoneLabelShort(s.data, s.index))}에 넣기</button><button type="button" class="btn btn-s" data-act="ibPick">다른 칸</button>`
            : `<button type="button" class="btn btn-s" data-act="ibPick">칸 고르기</button>`}<button type="button" class="x" data-act="ibRemove" aria-label="${esc(x.name)} 빼기">빼기</button></div>
    </div>`;
}
function ibAdd(names) {
    if (!names.length) return;
    const before = kvGet('inboxItems'), res = addToInbox(names);
    const inp = $('#ibIn'); if (inp) inp.value = '';
    paintInboxKeep();
    if (res.added.length) {
        const first = res.added.length > 1 ? `${res.added[0]} 외 ${res.added.length - 1}개` : res.added[0];
        toast(`${josa(first, '을', '를')} 자리 미정에 넣었어요${res.skipped ? ` · ${res.skipped}개는 이미 자리가 있어요` : ''}`, () => { kvSet('inboxItems', before == null ? '[]' : before); if (cur === 'inbox') paintInboxKeep(); toast('되돌렸어요'); });
    } else toast(res.skipped ? '이미 자리가 있는 물건이에요 · 검색해 보세요' : '이미 자리 미정에 있어요');
    setTimeout(() => { const i2 = $('#ibIn'); if (i2) i2.focus(); }, 30);
}
function paintInboxKeep() { const y = window.scrollY; paintInbox(); window.scrollTo(0, y); }
// 칸에 넣기 → 자리 미정에서 빠진다. 되돌리기는 둘 다 원래대로
function ibPlace(name, pid, zi) {
    const p = photoById(pid), z = p && p.zones[zi]; if (!z) return;
    const before = kvGet('inboxItems'), had = z.items.some(i => i.name === name), checkedBefore = z.checkedAt;
    if (!had) z.items.push({ name, comment: '' });
    addBaseItems([name]); markChecked(z); saveAll(); cleanInbox();
    if (inboxItems().some(x => x.name === name)) saveInbox(inboxItems().filter(x => x.name !== name)); // 이름이 조금 달라 cleanInbox가 못 뺀 경우
    if (cur === 'inbox') paintInboxKeep();
    toast(`${josa(name, '을', '를')} ${zoneLabelShort(p, zi)}에 넣었어요`, () => {
        if (!had) z.items = z.items.filter(i => i.name !== name);
        if (checkedBefore == null) delete z.checkedAt; else z.checkedAt = checkedBefore;
        kvSet('inboxItems', before == null ? '[]' : before); saveAll(); if (cur === 'inbox') paintInboxKeep(); toast('되돌렸어요');
    });
}
function ibOpenPicker(name) { // 칸 고르기: 사진마다 칸 목록
    openSheet(`<h2>${esc(josa(name, '은', '는'))} 어디에 둘까요?</h2><p>넣을 칸을 눌러 주세요</p>
        <div class="pk-list">${vis().map(p => `${vis().length > 1 ? `<h3>${esc(p.title || '사진')}</h3>` : ''}${p.zones.map((z, i) => `<button type="button" class="zrow" data-act="ibPickZone" data-p="${esc(p.id)}" data-z="${i}" data-n="${esc(name)}"><span class="n">${i + 1}</span><span class="t">${esc(z.name || `${i + 1}번 구역`)}<small>${esc(zoneSummary(z))}</small></span></button>`).join('') || '<p class="empty">칸이 없어요</p>'}`).join('')}</div>
        <div class="stack"><button type="button" class="btn btn-s" data-act="sheetClose">닫기</button></div>`);
}
function ibPresets() { // 업종별 자주 쓰는 물건 (v1 STARTER_PRESETS와 같은 목록)
    const order = [useMode() === 'home' ? 'organizer' : (currentIndustry() || 'general'), 'organizer', 'cafe', 'restaurant', 'mart', 'pharmacy', 'hardware', 'clothing', 'beauty', 'hospital', 'general'];
    const keys = [...new Set(order)].filter(k => INDUSTRY_TEMPLATES[k]);
    const label = (k) => k === 'organizer' ? '우리 집' : INDUSTRY_TEMPLATES[k].label.split(' /')[0];
    openSheet(`<h2>자주 쓰는 물건 한 번에 넣기</h2><p>목록을 고르면 넣을 것만 체크할 수 있어요</p>
        <div class="pk-list">${keys.map(k => `<button type="button" class="zrow" data-act="ibPreset" data-k="${k}"><span class="t">${esc(label(k))}<small>${esc(INDUSTRY_TEMPLATES[k].items.slice(0, 5).join(', '))} …</small></span><span class="d">${INDUSTRY_TEMPLATES[k].items.length}개</span></button>`).join('')}</div>
        <div class="stack"><button type="button" class="btn btn-s" data-act="sheetClose">닫기</button></div>`);
}
function ibPresetPick(k) {
    const placed = placedNames(), inIb = new Set(inboxItems().map(x => x.name));
    const items = INDUSTRY_TEMPLATES[k].items;
    openSheet(`<h2>${esc(k === 'organizer' ? '우리 집' : INDUSTRY_TEMPLATES[k].label.split(' /')[0])} · ${items.length}개</h2><p>넣을 것만 체크해 주세요 · 이미 자리가 있는 물건은 빼 뒀어요</p>
        <ul class="check-list">${items.map(n => { const dis = placed.has(normalizeForSearch(n)) || inIb.has(n); return `<li><label><input type="checkbox" value="${esc(n)}" ${dis ? 'disabled' : 'checked'}><span>${esc(n)}</span>${dis ? `<small>${inIb.has(n) ? '자리 미정에 있음' : '자리 있음'}</small>` : ''}</label></li>`; }).join('')}</ul>
        <div class="stack"><button type="button" class="btn btn-p" data-act="ibPresetOk">자리 미정에 넣기</button><button type="button" class="btn btn-s" data-act="ibPresets">다른 목록</button></div>`);
}
function ibMic() {
    const inp = $('#ibIn'), hint = $('#ibHint');
    const ok = dictate({
        onState: (on) => { ib.listening = on; const b = document.querySelector('#s-inbox [data-act=ibMic]'); if (b) b.classList.toggle('on', on); if (inp) inp.placeholder = on ? '듣고 있어요… 물건 이름을 말하세요' : '여러 개는 쉼표로'; },
        onText: (t) => { if (inp) inp.value = t; },
        onFinal: (t) => { if (inp) inp.value = ''; const names = parseVoiceItems(t); if (!names.length) { if (hint) hint.textContent = '알아들은 물건이 없어요 · 다시 말해 주세요'; return; } ibAdd(names); },
        onError: (k) => { if (hint) hint.textContent = DICTATE_HELP[k] || ''; }
    });
    if (!ok) { if (hint) hint.textContent = DICTATE_HELP.broken; if (inp) inp.focus(); }
}

SCREENS.inbox = renderInbox;
BEFORE_ROUTE.push((name) => { if (name !== 'inbox' && name !== 'zone' && activeDictation) activeDictation.stop(); });
Object.assign(ACT, {
    ibPlace: (el) => { const row = el.closest('.ib-row'); if (row) ibPlace(row.dataset.n, el.dataset.p, +el.dataset.z); },
    ibPick: (el) => { const row = el.closest('.ib-row'); if (row) ibOpenPicker(row.dataset.n); },
    ibPickZone: (el) => { closeSheet(); ibPlace(el.dataset.n, el.dataset.p, +el.dataset.z); },
    ibRemove: (el) => { const row = el.closest('.ib-row'); if (!row) return; const n = row.dataset.n, before = kvGet('inboxItems'); saveInbox(inboxItems().filter(x => x.name !== n)); paintInboxKeep(); toast(`${josa(n, '을', '를')} 뺐어요`, () => { kvSet('inboxItems', before == null ? '[]' : before); if (cur === 'inbox') paintInboxKeep(); toast('되돌렸어요'); }); },
    ibMic: () => ibMic(),
    ibPresets: () => ibPresets(),
    ibPreset: (el) => ibPresetPick(el.dataset.k),
    ibPresetOk: () => { const picked = [...document.querySelectorAll('#sheet .check-list input:checked')].map(i => i.value); closeSheet(); if (picked.length) ibAdd(picked); }
});
