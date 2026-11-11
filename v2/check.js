'use strict';
// ────────────────────────────────────────────────────────────
// 오브젯도 v2 — 점검 (B-Check · B-Order)   #/check?tab=count|order|exp|stale
//   세기: 지금 수량(qty)·최소 수량(par)을 적는다 → 최소보다 적으면 발주 목록 (v1 재고 세기와 같은 키·같은 계산)
//   발주 목록: 이름이 같으면 여러 칸 것을 합친다 · [목록 복사]는 v1과 같은 글 (카톡에 붙여 넣기)
//   유통기한: 가까운 순서 · 오래된 칸: 30일 넘게 확인 안 한 칸을 모아 하나씩 '확인했어요'
// ────────────────────────────────────────────────────────────
addCSS(`
.ck-intro { margin: 14px 0 0; font-size: 14px; line-height: 1.6; color: var(--sub); }
@media (max-width: 1023px) { .ck-intro { min-height: 3.2em; } }   /* 폰: 탭마다 안내가 한 줄·두 줄이라 목록 시작선이 달라지던 것 → 두 줄 높이로 (11/10) */
.ck-head { display: grid; grid-template-columns: 1fr 150px 46px; align-items: end; margin-top: 18px; padding-bottom: 8px; border-bottom: 1px solid var(--ink); font-size: 13px; color: var(--sub); }
.ck-head span:nth-child(2) { text-align: center; } .ck-head span:nth-child(3) { text-align: right; }
.ck-head.two { grid-template-columns: 1fr auto; } .ck-head.two span:nth-child(2) { text-align: right; }   /* 발주·유통기한·오래된 칸도 세기처럼 머리줄 — 목록이 같은 높이에서 시작 */
.ck-row { display: grid; grid-template-columns: 1fr 150px 46px; align-items: center; gap: 4px; min-height: 60px; padding: 6px 0; border-bottom: 1px solid var(--line); }
.ck-row .nm { min-width: 0; font-size: 16px; }
.ck-row .nm small { display: block; font-size: 12px; color: var(--sub); }
.ck-row .nm small em { font-style: normal; color: var(--accent); }
.ck-step { display: flex; align-items: center; justify-content: center; gap: 4px; }
.ck-step button { width: 42px; height: 42px; border: 1px solid var(--line); border-radius: 2px; background: none; font-size: 19px; cursor: pointer; color: var(--ink); }
.ck-step input { width: 56px; height: 42px; border: 0; background: transparent; text-align: center; font-family: var(--serif); font-size: 19px; color: var(--ink); }
.ck-step input.low { color: var(--accent); }
.ck-step input { transition: color .35s ease; }   /* 모자라게 되면 숫자가 빨강으로 스르륵 (11/11) */
@media (prefers-reduced-motion: reduce) { .ck-step input { transition: none; } }
.ck-par { width: 46px; height: 42px; border: 0; border-bottom: 1px solid var(--line); background: transparent; text-align: right; font-size: 15px; color: var(--sub); border-radius: 0; }
.ck-zone { margin: 18px 0 0; font-size: 13px; color: var(--sub); }
.ck-line { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--line); }
.ck-line b { font-size: 16px; font-weight: 500; }
.ck-line small { display: block; font-size: 13px; color: var(--sub); }
.ck-line .need { flex: none; color: var(--accent); font-size: 14px; }
.ck-line .need b { font-family: var(--serif); font-size: 21px; font-weight: 400; margin-left: 4px; }
.ck-line .ok { flex: none; min-height: 40px; padding: 0 12px; border: 1px solid var(--ink); border-radius: 2px; background: none; font-size: 14px; cursor: pointer; }
.ck-foot { margin-top: auto; }
.ck-foot p { margin: 0 0 10px; font-size: 13px; color: var(--sub); }
.tabs button b { margin-left: 4px; color: var(--accent); font-weight: 500; }
`);

function ckPhotos() { return itemPhotos(); } // 공간 사진(가구 칸)은 점검·세기에서 뺀다
function ckCode(pi, zi, multi) { return multi ? `${pi < 26 ? String.fromCharCode(65 + pi) : `P${pi + 1}`}-${zi + 1}` : String(zi + 1); } // v1 stockCode와 같다
function ckOrderLines() { // v1 stockOrderLines와 같다
    const photos = ckPhotos(), multi = photos.length > 1, map = new Map(); let uncounted = 0;
    photos.forEach((d, pi) => d.zones.forEach((z, zi) => z.items.forEach(it => {
        if (!isNum(it.par)) return;
        if (!isNum(it.qty)) { uncounted++; return; }
        const need = it.par - it.qty; if (need <= 0) return;
        const o = map.get(it.name) || { name: it.name, need: 0, qty: 0, par: 0, where: [] };
        o.need += need; o.qty += it.qty; o.par += it.par; o.where.push(ckCode(pi, zi, multi) + (z.name ? ` ${z.name}` : ''));
        map.set(it.name, o);
    })));
    return { lines: [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko')), uncounted };
}
function ckFileDate() { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; }
function ckOrderText() { // v1 stockOrderText와 같은 글
    const { lines } = ckOrderLines(), name = (ls('storeName') || '').trim().slice(0, 20);
    return [`${name ? `[${name}] ` : ''}발주 목록 · ${ckFileDate()}`, ...lines.map(o => `- ${o.name}: ${o.need}개 (지금 ${o.qty} / 최소 ${o.par})`)].join('\n');
}
function ckRecordCount() { // v1 recordStockCount: 이름별 합계를 날짜별로 (반년 치)
    if (SAMPLE) return;
    const q = {}; ckPhotos().forEach(d => d.zones.forEach(z => z.items.forEach(it => { if (isNum(it.qty)) q[it.name] = (q[it.name] || 0) + it.qty; })));
    if (!Object.keys(q).length) return;
    let log = []; try { log = JSON.parse(kvGet('stockLog') || '[]'); if (!Array.isArray(log)) log = []; } catch (e) {}
    const now = new Date(), d = ckFileDate();
    log = log.filter(e => e && e.d !== d); log.push({ d, at: now.getTime(), q });
    kvSet('stockLog', JSON.stringify(log.slice(-180)));
    kvSet('stockCountedAt', String(Date.now()));
}
function staleZones() { const out = []; ckPhotos().forEach((p, pi) => p.zones.forEach((z, zi) => { if (isStale(z)) out.push({ p, pi, z, zi }); })); return out.sort((a, b) => (a.z.checkedAt || 0) - (b.z.checkedAt || 0)); }
function expItems() { const out = []; ckPhotos().forEach((p, pi) => p.zones.forEach((z, zi) => z.items.forEach(it => { if (it.exp && expDays(it) !== null) out.push({ p, pi, z, zi, it }); }))); return out.sort((a, b) => expDays(a.it) - expDays(b.it)); }

let ck = { tab: 'count', counted: false };
function renderCheck(r) {
    const tabs = ['count', 'order', 'exp', 'stale'];
    let tab = r.q.get('tab'); if (!tabs.includes(tab)) tab = stockOn() ? 'count' : staleZones().length ? 'stale' : feat('exp') ? 'exp' : 'count';
    if (tab === 'exp' && !feat('exp')) tab = 'count';
    if (ck.tab === 'count' && tab !== 'count' && ck.counted) { ckRecordCount(); ck.counted = false; } // 세다가 다른 탭으로 가면 오늘 센 것으로 기록 (v1 finishStockCount)
    ck.tab = tab;
    paintCheck();
}
function paintCheck() {
    const el = screenEl('check'), tab = ck.tab, { lines, uncounted } = ckOrderLines(), stale = staleZones(), photos = ckPhotos(), multi = photos.length > 1;
    const tabBtn = (k, label, n) => `<button type="button" role="tab" aria-selected="${tab === k}" data-act="ckTab" data-t="${k}">${label}${n ? `<b>${n}</b>` : ''}</button>`;
    // 위 오른쪽은 탭마다 늘 '도움말' (11/10 — 세기에만 있어 탭을 바꾸면 보였다 사라졌다). 탭마다 하는 일(목록 복사·인쇄)은 아래 줄에
    let body = '', foot = '';
    const right = '<button type="button" class="tlink" data-act="ckHelp">도움말</button>';
    if (tab === 'count') {
        if (!stockOn()) body = `<p class="ck-intro">재고 세기가 꺼져 있어요. 켜면 물건마다 지금 수량과 최소 수량을 적고, 모자란 것을 발주 목록으로 모아요.</p><div class="cta" style="margin-top:18px"><button type="button" class="btn btn-p" data-act="ckStockOn">재고 세기 켜기</button></div>`;
        else {
            const rows = []; photos.forEach((d, pi) => d.zones.forEach((z, zi) => { if (!z.items.length) return;
                rows.push(`<p class="ck-zone">${esc(multi ? `${d.title || '사진'} · ` : '')}${zi + 1}번 · ${esc(z.name || '')}</p>`);
                z.items.forEach((it, ii) => { const low = itemLow(it); rows.push(`<div class="ck-row" data-at="${pi}.${zi}.${ii}"><span class="nm">${esc(it.name)}<small>${ckCode(pi, zi, multi)}번 구역${low ? ' · <em>부족</em>' : ''}</small></span>
                    <span class="ck-step"><button type="button" data-act="ckQty" data-d="-1" aria-label="${esc(it.name)} 하나 빼기">−</button><input ${NUM_IN} data-f="qty" class="${low ? 'low' : ''}" value="${isNum(it.qty) ? it.qty : ''}" placeholder="–" aria-label="${esc(it.name)} 지금 수량"><button type="button" data-act="ckQty" data-d="1" aria-label="${esc(it.name)} 하나 더">+</button></span>
                    <input ${NUM_IN} class="ck-par" data-f="par" value="${isNum(it.par) ? it.par : ''}" placeholder="–" aria-label="${esc(it.name)} 최소 수량"></div>`); });
            }));
            body = `<p class="ck-intro">지금 개수를 세어 넣어 주세요. 최소 수량보다 적으면 발주 목록에 들어가요.</p><div class="ck-head"><span>물건</span><span>지금</span><span>최소</span></div>${rows.join('') || '<p class="empty">칸에 넣은 물건이 아직 없어요.</p>'}`;
            if (stale.length) body += `<p class="hint" style="margin-top:16px">30일 넘게 확인 안 한 구역 ${stale.length}곳 · ${stale.slice(0, 4).map(x => ckCode(x.pi, x.zi, multi) + '번').join(', ')}${stale.length > 4 ? ' …' : ''} · <button type="button" class="tlink" style="padding:0;min-height:0;font-size:13px;color:var(--accent)" data-act="ckTab" data-t="stale">모아 보기</button></p>`;
            foot = `<button type="button" class="btn btn-p" data-act="ckTab" data-t="order">발주 목록 보기 (${lines.length})</button>`;
        }
    } else if (tab === 'order') {
        body = `<p class="ck-intro">최소 수량보다 적은 물건이에요.</p><div class="ck-head two"><span>물건 · 있는 곳</span><span>부족</span></div>`
            + (lines.length ? lines.map(o => `<div class="ck-line"><span><b>${esc(o.name)}</b><small>${esc(o.where.join(', '))} · 지금 ${o.qty} · 최소 ${o.par}</small></span><span class="need">부족<b>${o.need}</b></span></div>`).join('') : '<p class="empty">모자란 물건이 없어요.</p>')
            + `<p class="hint">채워 넣은 뒤 [세기]에서 개수를 고치면 목록에서 빠져요.${uncounted ? ` 최소 수량은 있는데 아직 안 센 물건이 ${uncounted}개 있어요.` : ''}</p>`;
        foot = `${lines.length ? '<button type="button" class="btn btn-s" data-act="ckShare">목록 복사</button>' : ''}<button type="button" class="btn btn-p" data-act="go" data-to="#/print?form=check">점검표로 인쇄</button>`;
    } else if (tab === 'exp') {
        const list = expItems();
        body = `<p class="ck-intro">유통기한이 가까운 순서예요. ${EXP_SOON_DAYS}일 안이면 '임박', 지났으면 '기한 지남'으로 보여요.</p><div class="ck-head two"><span>물건 · 칸</span><span>기한</span></div>`
            + (list.length ? list.map(x => { const st = expState(x.it); return `<button type="button" class="ck-line" style="width:100%;background:none;border-left:0;border-right:0;border-top:0;text-align:left;cursor:pointer" data-act="go" data-to="${esc(resultHash(x.p.id, x.zi, '', x.it.name, 'list'))}"><span><b>${esc(x.it.name)}</b><small>${ckCode(x.pi, x.zi, multi)}번 구역 · ${esc(x.it.exp.replace(/-/g, '. '))}</small></span><span class="need" style="${st ? '' : 'color:var(--sub)'}">${esc(st ? expLabel(x.it) : expLabel(x.it))}</span></button>`; }).join('')
                : '<p class="empty">유통기한을 적은 물건이 없어요 · 칸에서 물건을 눌러 적을 수 있어요</p>');
    } else {
        body = `<p class="ck-intro">${STALE_DAYS}일 넘게 확인 안 한 칸이에요. 열어 보고 맞으면 [확인]을 눌러 주세요 — 지도가 계속 정확해져요.</p><div class="ck-head two"><span>칸 · 든 물건</span><span>보기 · 확인</span></div>`
            + (stale.length ? stale.map(x => `<div class="ck-line"><span><b>${esc(x.p.title || '사진')} ${x.zi + 1}번 · ${esc(x.z.name || '')}</b><small>${esc(zoneSummary(x.z))} · ${agoText(x.z.checkedAt)} 확인</small></span><span style="display:flex;gap:6px;flex:none"><button type="button" class="ok" data-act="go" data-to="${esc(resultHash(x.p.id, x.zi, '', '', 'map'))}">보기</button><button type="button" class="ok" data-act="ckStaleOk" data-p="${esc(x.p.id)}" data-z="${x.zi}">확인</button></span></div>`).join('')
                : '<p class="empty">오래된 칸이 없어요 · 다 최근에 확인했어요</p>');
    }
    el.innerHTML = `
        <header class="top">${backBtn('지도', vis()[0] ? `#/map/${encodeURIComponent(vis()[0].id)}` : '#/')}${right}</header>
        <main class="wrap" style="flex:1;display:flex;flex-direction:column;padding-bottom:${foot ? 0 : 22}px">
            <h1 class="h1" style="margin-top:20px">점검</h1>
            <div class="tabs" role="tablist" style="margin-top:14px">${tabBtn('count', '세기')}${tabBtn('order', '발주 목록', lines.length)}${feat('exp') ? tabBtn('exp', '유통기한', expItems().filter(x => expState(x.it)).length) : ''}${tabBtn('stale', '오래된 칸', stale.length)}</div>
            ${body}
            ${foot ? `<div class="dock ck-foot">${foot}</div>` : ''}
        </main>`;
}
function ckItemAt(row) { const [pi, zi, ii] = row.dataset.at.split('.').map(Number), p = ckPhotos()[pi], z = p && p.zones[zi]; return z ? { p, z, it: z.items[ii] } : null; }
document.addEventListener('change', (e) => {
    const f = e.target.closest && e.target.closest('#s-check .ck-row [data-f]'); if (!f) return;
    const x = ckItemAt(f.closest('.ck-row')); if (!x || !x.it) return;
    const v = f.value.trim(), n = v === '' ? NaN : Math.max(0, Math.floor(Number(v)));
    if (isFinite(n)) x.it[f.dataset.f] = n; else delete x.it[f.dataset.f];
    if (f.dataset.f === 'qty') { markChecked(x.z); ck.counted = true; }
    saveSoon(); ckRepaintRow(f.closest('.ck-row'));
});
function ckRepaintRow(row) { // 다시 그리지 않고 그 줄만 (쓰던 칸에서 손이 안 끊기게)
    const x = ckItemAt(row); if (!x) return;
    const low = itemLow(x.it), q = row.querySelector('[data-f=qty]'), sm = row.querySelector('.nm small'), wasLow = !!(q && q.classList.contains('low'));
    if (q && document.activeElement !== q) q.value = isNum(x.it.qty) ? x.it.qty : '';
    if (q) q.classList.toggle('low', low);
    if (sm) sm.innerHTML = `${esc(sm.textContent.replace(/ · 부족$/, ''))}${low ? ' · <em>부족</em>' : ''}`;
    if (sm && low && !wasLow) replay(sm.querySelector('em'), 'low-in'); // '부족'은 스르륵 (11/11)
    const { lines } = ckOrderLines(), ob = document.querySelector('#s-check .tabs [data-act=ckTab][data-t=order]');
    if (ob) { const n0 = ob.querySelector('b') ? +ob.querySelector('b').textContent : 0; ob.innerHTML = `발주 목록${lines.length ? `<b>${lines.length}</b>` : ''}`; if (lines.length && lines.length !== n0) replay(ob.querySelector('b'), 'qty-bump'); } // 발주 목록 숫자도 톡
    const fb = document.querySelector('#s-check .ck-foot[data-act=ckTab][data-t=order], #s-check .ck-foot [data-act=ckTab][data-t=order]'); if (fb) fb.textContent = `발주 목록 보기 (${lines.length})`;
}
async function ckShare() {
    const text = ckOrderText();
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) { try { await navigator.share({ text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(text); toast('발주 목록을 복사했어요 · 카톡 대화방에 붙여 넣으세요 (PC는 Ctrl+V)'); }
    catch (e) { openSheet(`<h2>아래 글을 복사해 보내세요</h2><textarea style="width:100%;min-height:180px;font:inherit;font-size:15px;padding:10px;border:1px solid var(--line);background:var(--sheet)" readonly>${esc(text)}</textarea><div class="stack" style="margin-top:12px"><button type="button" class="btn btn-s" data-act="sheetClose">닫기</button></div>`); }
}

SCREENS.check = renderCheck;
BEFORE_ROUTE.push((name) => { if (name !== 'check' && ck.counted) { ckRecordCount(); ck.counted = false; } });
Object.assign(ACT, {
    ckTab: (el) => nav(`#/check?tab=${el.dataset.t}`, true),
    ckQty: (el) => {
        const row = el.closest('.ck-row'), x = row && ckItemAt(row); if (!x || !x.it) return;
        x.it.qty = Math.max(0, (isNum(x.it.qty) ? x.it.qty : 0) + Number(el.dataset.d)); markChecked(x.z); ck.counted = true; saveSoon(); ckRepaintRow(row);
        replay(row.querySelector('[data-f=qty]'), 'qty-bump'); // 숫자가 톡 (11/11)
    },
    ckStockOn: () => { setStockOn(true); paintCheck(); toast('재고 세기를 켰어요'); },
    ckShare: () => ckShare(),
    ckStaleOk: (el) => { // 확인한 칸은 목록에서 접히며 빠지고, 되돌리면 그 줄이 빛난다 (11/11)
        const p = photoById(el.dataset.p), z = p && p.zones[+el.dataset.z]; if (!z) return; const before = z.checkedAt, pid = el.dataset.p, zi = el.dataset.z, gone = goneSnap(el.closest('.ck-line'));
        markChecked(z); saveAll(); paintCheck(); goneOut(gone);
        toast('확인했어요', () => { z.checkedAt = before; saveAll(); if (cur === 'check') { paintCheck(); const b = [...document.querySelectorAll('#s-check [data-act=ckStaleOk]')].find(x => x.dataset.p === pid && x.dataset.z === zi); glowBack(b && b.closest('.ck-line')); } });
    },
    ckHelp: () => { // 탭 네 개를 다 (11/10 — 도움말이 모든 탭에 있게 되어서)
        const steps = ['[세기]에서 지금 개수를 −·+로 맞춰요', "[최소]에 '이만큼은 있어야 한다'는 수를 적어요", '모자란 물건은 [발주 목록]에 모여요 · [목록 복사]로 카톡에 보내요'];
        if (feat('exp')) steps.push(`[유통기한]은 날짜가 가까운 순서예요 · ${EXP_SOON_DAYS}일 안이면 임박`);
        steps.push(`[오래된 칸]은 ${STALE_DAYS}일 넘게 안 본 칸이에요 · 열어 보고 맞으면 [확인]`);
        openSheet(`<h2>점검, 이렇게 해요</h2><ol class="nums" style="margin:12px 0 18px">${steps.map((t, k) => `<li><span>${String(k + 1).padStart(2, '0')}</span>${esc(t)}</li>`).join('')}</ol><div class="stack"><button type="button" class="btn btn-p" data-act="sheetClose">알겠어요</button></div>`);
    }
});
