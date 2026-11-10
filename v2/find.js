'use strict';
// ────────────────────────────────────────────────────────────
// 오브젯도 v2 — 1단계 찾기 화면 (첫 소개 · 검색 홈 · 말로 찾기 · 찾은 결과 · 수납 지도 · 목록 · 옮기기 · 메뉴)
// ────────────────────────────────────────────────────────────
// B2 검색 홈
// ────────────────────────────────────────────────────────────
function renderHome() {
    const el = $('#s-home');
    if (!el.dataset.built) {
        el.dataset.built = '1';
        el.innerHTML = `
            <header class="top"><span class="brand">오브젯도</span><a class="tlink" href="#/menu" data-act="go" data-to="#/menu">메뉴</a></header>
            <div class="strip" id="homeStrip"></div>
            <div id="homeNudge"></div>
            <main class="home wrap">
                <div>
                    <label for="q" class="ask" id="ask"><span id="askText">뭘 찾아 드릴까요?</span><span class="ha-caret" aria-hidden="true">_</span></label>
                    <div class="sbox">${ICON.search}<input id="q" type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="뭘 찾아 드릴까요?"><button type="button" class="sclear" data-act="clear" aria-label="지우기" hidden>×</button></div>
                    <div class="live" id="live" hidden></div>
                    <div class="voice-row" id="voiceRow"><button type="button" class="mic" data-act="voice" aria-label="눌러서 말하기">${ICON.mic}</button><div><b>눌러서 말하기</b><span id="micHint"></span></div></div>
                </div>
                <div id="homeRest" style="display:flex;flex-direction:column;gap:30px">
                    <div class="stats" id="stats"></div>
                    <div id="chipsBox"><span class="kick" id="chipsLabel"></span><div class="chips" id="chips"></div></div>
                    <nav class="rows" id="homeNav" aria-label="바로 가기"></nav>
                </div>
            </main>
            <footer class="foot" id="homeFoot"></footer>`;
        const q = $('#q');
        q.addEventListener('input', renderLive);
        q.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); const m = findSearchMatches(q.value.trim())[0]; if (m) openMatch(m, q.value.trim(), 'search'); else q.blur(); }
            else if (e.key === 'Escape') { q.value = ''; renderLive(); }
        });
    }
    const ex = exampleNames(3);
    $('#q').placeholder = ex.length ? `이름이나 첫 글자 (${chosungOf(ex[0])})` : '물건 이름';
    const hasReal = ls('hasSavedPhotos') === '1';
    $('#homeStrip').innerHTML = SAMPLE
        ? `<span>예시 · ${SAMPLE === 'organizer' ? '정리수납 예시 집' : '매장 예시'}</span><button type="button" data-act="sampleExit">${hasReal ? '내 지도로' : '예시 닫기'}</button>`
        : `<span>${storedSample ? '예시 데이터를 보고 있어요' : '새 화면 미리보기 · 베타'}</span><a href="${V1()}" data-v1>이전 화면으로 ${EXT}</a>`;
    const zs = vis().flatMap(p => p.zones.map((z, i) => ({ p, z, i }))), nItems = zs.reduce((n, x) => n + x.z.items.length, 0), stale = zs.filter(x => isStale(x.z));
    const first = vis()[0], staleP = stale[0] ? stale[0].p : first;
    $('#stats').innerHTML = `<button type="button" class="stat" data-act="go" data-to="#/map/${encodeURIComponent(first.id)}"><span>구역</span><b>${zs.length}</b></button>`
        + `<button type="button" class="stat" data-act="go" data-to="#/list"><span>물건</span><b>${nItems}</b></button>`
        + `<button type="button" class="stat${stale.length ? ' warn' : ''}" data-act="go" data-to="${stale.length ? '#/check?tab=stale' : `#/map/${encodeURIComponent(staleP.id)}`}" aria-label="점검할 구역 ${stale.length}곳 (${STALE_DAYS}일 넘게 확인 안 함)"><span>점검</span><b>${stale.length}</b></button>`;
    const fr = frequentNames(), chips = fr.length ? fr : ex;
    $('#chipsBox').hidden = !chips.length;
    $('#chipsLabel').textContent = fr.length ? '자주 찾는 물건' : '이렇게 찾아 보세요';
    $('#chips').innerHTML = chips.map(n => `<button type="button" class="chip" data-act="chip" data-q="${esc(n)}">${esc(n)}</button>`).join('');
    const ib = inboxItems().length;
    $('#homeNav').innerHTML = `<button type="button" class="row" data-act="go" data-to="#/inbox?focus=1">새로 산 물건 넣기${ib ? `<small>자리 미정 ${ib}</small>` : ''}<span class="ar">→</span></button>`
        + `<button type="button" class="row" data-act="go" data-to="#/map/${encodeURIComponent(first.id)}">수납 지도 보기<span class="ar">→</span></button>`
        + `<button type="button" class="row" data-act="go" data-to="#/list">물건 전체 목록<span class="ar">→</span></button>`
        + `<button type="button" class="row" data-act="go" data-to="#/print">인쇄물 보기<span class="ar">→</span></button>`;
    $('#homeFoot').innerHTML = SAMPLE ? '예시는 저장되지 않아요 · 마음껏 눌러 보세요' : `이 폰에만 저장돼요 · <a href="#/backup" data-act="go" data-to="#/backup">백업 받기</a>`;
    $('#homeNudge').innerHTML = homeNudge();
    syncMicHint();
    renderLive();
    typeAsk();
}
// 첫 화면 질문: 다정한 말 몇 가지를 한 글자씩(자모 단위로) 쳤다 지웠다 하며 돌린다 — 뒤에 _ 가 깜박이며 기다리는 느낌 (v1 typeHeroAsk와 같다)
//   찾기 칸을 누르고 있거나 글자가 있거나, 다른 화면이거나, 폰을 내려놨으면 멈춘다. '움직임 줄이기'면 첫 문장 그대로
function hangulTypingFrames(text) { // ㅁ → 무 → 뭐 → 뭘
    const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ', BASE = { 9: 8, 10: 8, 11: 8, 14: 13, 15: 13, 16: 13, 19: 18 };
    const frames = []; let done = '';
    for (const ch of text) {
        const c = ch.charCodeAt(0) - 0xAC00;
        if (c < 0 || c > 11171) { done += ch; frames.push(done); continue; }
        const cho = Math.floor(c / 588), jung = Math.floor((c % 588) / 28), jong = c % 28, syl = (j, f) => String.fromCharCode(0xAC00 + (cho * 21 + j) * 28 + f);
        const steps = [CHO[cho]]; if (BASE[jung] !== undefined) steps.push(syl(BASE[jung], 0)); steps.push(syl(jung, 0)); if (jong) steps.push(ch);
        steps.forEach(x => frames.push(done + x)); done += ch;
    }
    return frames;
}
const HERO_ASKS = ['뭘 찾아 드릴까요?', '어떤 걸 찾으세요?', '오늘은 뭘 찾을까요?', '무엇이 필요하세요?'];
let askTyped = false;
function typeAsk() {
    const el = $('#askText'); if (!el || askTyped) return;
    askTyped = true;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const h = el.parentElement, wait = (ms) => new Promise(r => setTimeout(r, ms)), show = (t) => { el.textContent = t; };
    const resting = () => { const q = $('#q'); return document.hidden || cur !== 'home' || (q && (document.activeElement === q || q.value)); };
    (async () => {
        show(''); await wait(350);
        for (let n = 0; ; n++) {
            const frames = hangulTypingFrames(HERO_ASKS[n % HERO_ASKS.length]);
            h.classList.add('is-typing');
            for (const f of frames) { show(f); await wait(f.endsWith(' ') ? 140 : 75); }
            h.classList.remove('is-typing');
            await wait(4500); // 다 친 뒤엔 _ 만 깜박이며 기다린다
            while (resting()) await wait(1000);
            h.classList.add('is-typing');
            for (const f of frames.slice(0, -1).reverse()) { show(f); await wait(35); } // 지울 때도 자모 단위로
            show(''); h.classList.remove('is-typing'); await wait(400);
        }
    })();
}
// 위쪽 안내 띠 하나 (v1과 같은 키·같은 때): 아이폰 사파리 → 홈 화면에 추가(3일 뒤 다시) · 바뀐 게 있는데 백업 2주 넘음 → 백업(2주 뒤 다시)
function isIOSDevice() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
function isStandalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
const BACKUP_REMIND_MS = 14 * 86400000;
function homeNudge() {
    if (SAMPLE || !isRealUse()) return '';
    const now = Date.now(), num = (k) => parseInt(ls(k) || '0', 10) || 0;
    if (isIOSDevice() && !isStandalone() && now >= num('installBannerHiddenUntil'))
        return `<div class="nudge"><span>아이폰 사파리는 한동안 안 열면 데이터가 지워질 수 있어요 · <button type="button" data-act="go" data-to="#/iphone">홈 화면에 추가</button></span><button type="button" class="x" data-act="nudgeX" data-k="installBannerHiddenUntil" data-d="3" aria-label="닫기">×</button></div>`;
    if (vis().some(d => d.zones.some(z => z.items.length)) && now >= num('backupBannerHiddenUntil')) {
        const last = num('lastBackupAt');
        if (!last || (now - last >= BACKUP_REMIND_MS && num('dataChangedAt') > last))
            return `<div class="nudge"><span>${last ? '마지막 백업 뒤에 바뀐 게 있어요' : '아직 백업이 없어요'} · 폰을 바꾸거나 잃어버려도 살리려면 <button type="button" data-act="go" data-to="#/backup">백업 받기</button></span><button type="button" class="x" data-act="nudgeX" data-k="backupBannerHiddenUntil" data-d="14" aria-label="닫기">×</button></div>`;
    }
    return '';
}
function renderLive() {
    const qEl = $('#q'); if (!qEl) return;
    const q = qEl.value.trim(), live = $('#live');
    $('#homeRest').hidden = !!q; $('#voiceRow').hidden = !!q; $('.sclear').hidden = !q;
    if (!q) { live.hidden = true; live.innerHTML = ''; return; }
    live.hidden = false;
    const ms = findSearchMatches(q);
    if (!ms.length) {
        const ib = inboxItems().find(x => includesText(q, x.name));
        live.innerHTML = ib
            ? `<p class="none">‘${esc(ib.name)}’${esc(josa(ib.name, '은', '는').slice(ib.name.length))} 아직 <b>자리 미정</b>에 있어요.</p><button type="button" class="row" data-act="go" data-to="#/inbox">자리 미정에서 자리 정하기<span class="ar">→</span></button>`
            : `<p class="none">‘${esc(q)}’${esc(josa(q, '은', '는').slice(q.length))} 지도에 없어요.</p><button type="button" class="row" data-act="go" data-to="#/inbox?add=${esc(encodeURIComponent(q))}">자리 미정에 적어 두기<span class="ar">→</span></button>`;
        return;
    }
    live.innerHTML = ms.slice(0, 8).map((m, i) => hitHTML(m, q, i)).join('') + (ms.length > 8 ? `<p class="more-note">${ms.length - 8}곳 더 있어요 · 조금 더 길게 써 보세요</p>` : '');
}
function hitHTML(m, q, i) {
    const label = m.item ? highlight(m.item.name, q) : m.field === 'zone' ? highlight(zoneName(m.zone, m.index), q) : esc(zoneName(m.zone, m.index));
    const sub = `${esc(m.data.title || '사진')} · ${m.index + 1}번${m.zone.name && !autoZoneName(m.zone.name) && (m.item || m.field !== 'zone') ? ' · ' + esc(m.zone.name) : ''}`;
    const tag = tagOf(m);
    return `<button type="button" class="hit" data-act="open" data-i="${i}" data-p="${esc(m.data.id)}" data-z="${m.index}" data-item="${esc(m.item ? m.item.name : '')}" data-q="${esc(q)}">`
        + `<span class="hn">${m.index + 1}</span><span class="hb"><b>${label}</b><small>${sub}</small></span>${tag ? `<span class="ht">${tag}</span>` : ''}</button>`;
}
function openMatch(m, q, from, replace) {
    recordPick(q, m.item ? m.item.name : '');
    nav(resultHash(m.data.id, m.index, q, m.item ? m.item.name : '', from), replace);
}
function openQuery(q, from) {
    const m = findSearchMatches(q)[0];
    if (m) { openMatch(m, q, from || 'search'); return; }
    $('#q').value = q; renderLive();
}
function isInApp() { return /KAKAOTALK|Instagram|FBAN|FBAV|NAVER\(|Line\/|DaumApps|everytimeApp/i.test(navigator.userAgent); }
function isDesktop() { return !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) && !(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
function syncMicHint() {
    const h = $('#micHint'); if (!h) return;
    h.textContent = isInApp() ? '카톡·인스타 안에선 안 돼요 · 브라우저로 열어 주세요'
        : !voice.ok() ? (isDesktop() ? '이 브라우저에선 안 돼요 · 크롬·엣지에서 열어 주세요' : '키보드의 🎤 받아쓰기로 말해도 돼요')
        : ls('voiceUsed') === '1' ? '물건 이름을 말하면 그 칸을 보여 드려요' : '처음 한 번만 마이크를 허용해 주세요';
}

// ────────────────────────────────────────────────────────────
// B5 말로 찾기
// ────────────────────────────────────────────────────────────
const voice = {
    st: 'idle', heard: '', final: '', err: '', q: '', rec: null, t1: 0, t2: 0, manual: false,
    ok() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); },
    start() {
        if (!this.ok()) return false;
        this.stop(true);
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = new SR();
        rec.lang = 'ko-KR'; rec.interimResults = true; rec.maxAlternatives = 1;
        Object.assign(this, { rec, st: 'starting', heard: '', final: '', err: '', q: '', manual: false });
        let started = false, gotAny = false;
        const fail = () => { if (this.rec !== rec || started) return; this.rec = null; try { rec.abort(); } catch (e) {} this.st = 'broken'; paintVoice(); };
        rec.onstart = () => {
            started = true; clearTimeout(this.t1); if (this.rec !== rec) return;
            this.st = 'listening'; paintVoice();
            if (navigator.vibrate) try { navigator.vibrate(20); } catch (e) {}
            this.t2 = setTimeout(() => { if (!gotAny && this.rec === rec) try { rec.stop(); } catch (e) {} }, 8000); // 아무 말도 없으면 8초 뒤 멈춤
        };
        rec.onresult = (e) => {
            if (this.rec !== rec) return;
            gotAny = true; let fin = '', mid = '';
            for (let i = 0; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) fin += r[0].transcript; else mid += r[0].transcript; }
            this.final = fin.trim(); this.heard = (fin + mid).trim(); paintVoice();
        };
        rec.onerror = (e) => { if (this.rec === rec) this.err = e.error; };
        rec.onend = () => {
            clearTimeout(this.t1); clearTimeout(this.t2);
            if (this.rec !== rec) return;
            this.rec = null;
            const text = (this.final || this.heard).trim();
            if (text) { voiceDone(text); return; }
            if (this.err === 'not-allowed') this.st = 'denied'; // 허용 창에서 '차단'을 눌렀다 — 기기 문제가 아니라 권한 안내
            else if (!started || ['service-not-allowed', 'audio-capture', 'network', 'language-not-supported'].includes(this.err)) this.st = 'broken';
            else this.st = this.manual ? 'idle' : 'nospeech';
            paintVoice();
        };
        // 듣기를 시작하지 못하면 포기 — 마이크 허용 창이 떠 있을 수 있으니 넉넉히 (이미 허용됐으면 짧게). v1과 같다
        this.t1 = setTimeout(fail, 15000);
        try { navigator.permissions && navigator.permissions.query({ name: 'microphone' }).then(p => { if (p.state === 'granted' && !started && this.rec === rec) { clearTimeout(this.t1); this.t1 = setTimeout(fail, 5000); } }).catch(() => {}); } catch (e) {}
        try { rec.start(); } catch (e) { this.rec = null; this.st = 'broken'; }
        lsSet('voiceUsed', '1');
        return true;
    },
    stop(silent) {
        const r = this.rec;
        if (silent) { clearTimeout(this.t1); clearTimeout(this.t2); this.rec = null; if (r) try { r.abort(); } catch (e) {} if (this.st !== 'nomatch') this.st = 'idle'; return; }
        if (!r) return; this.manual = true; try { r.stop(); } catch (e) {}
    }
};
function voiceDone(text) {
    const q = text.replace(/[.?!。]+$/, '').replace(/\s*(어디\s*있어|어딨어|어디\s*있지|찾아\s*줘|보여\s*줘|검색해\s*줘)[?요]*$/, '').trim() || text;
    voice.q = q;
    const ms = findSearchMatches(q), m = ms[0];
    if (!SAMPLE) lsSet('voiceSearchCount', String((parseInt(ls('voiceSearchCount') || '0', 10) || 0) + 1));
    const box = $('#q'); if (box && m) box.value = q;
    if (m) {
        const same = ms.filter(x => rankOf(x.field, x.type) === rankOf(m.field, m.type) && (x.distance || 0) === (m.distance || 0));
        if (same.length >= 2) { voice.st = 'pick'; voice.cands = same.slice(0, 6); paintVoice(); return; } // "시럽" → 바닐라 시럽·시럽 펌프… 고르게
        voice.st = 'done'; openMatch(m, q, 'voice', true); return;
    }
    voice.st = 'nomatch'; paintVoice();
}
function startVoiceFromHome() {
    if (isInApp() || !voice.ok()) {
        const q = $('#q'); if (q) q.focus();
        toast(isInApp() ? '카톡·인스타 안 브라우저에선 말로 찾기가 안 돼요 · 오른쪽 위 메뉴에서 “다른 브라우저로 열기”' : isDesktop() ? '이 브라우저에선 말로 찾기가 안 돼요 · 크롬·엣지에서 열어 주세요' : '키보드의 🎤(받아쓰기)를 누르고 말해 보세요');
        return;
    }
    voice.start(); // 사파리는 누른 순간에 시작해야 한다 (화면을 바꾼 뒤엔 막힌다)
    nav('#/voice');
}
function renderVoice() {
    const el = $('#s-voice');
    if (!el.dataset.built) {
        el.dataset.built = '1';
        el.innerHTML = `
            <header class="top">${backBtn('검색', '#/')}<span class="meta" id="vCtx"></span></header>
            <main class="voice" id="vMain">
                <button type="button" class="vc" data-act="vtoggle" id="vBtn"><span class="ring"></span><span class="ring r2"></span><span class="core">${ICON.mic}</span></button>
                <h1 id="vTitle"></h1>
                <p class="vsub" id="vSub"></p>
                <div class="vheard" id="vHeard" hidden><span class="kick">들리는 말</span><b id="vText"></b><small id="vNote"></small></div>
                <div class="vacts" id="vActs"></div>
            </main>
            <footer class="foot center" id="vFoot"></footer>`;
    }
    $('#vCtx').textContent = vis().length > 1 ? `${vis()[0].title} 외 ${vis().length - 1}곳` : (vis()[0] ? vis()[0].title : '');
    const ex = exampleNames(1)[0];
    $('#vFoot').innerHTML = `가운데 동그라미를 누르면 멈춰요${ex ? `<br>이렇게 말해 보세요 · “${esc(ex)} 어디 있어?”` : ''}`;
    paintVoice(true);
}
function paintVoice(force) {
    if (cur !== 'voice' && !force) return;
    const s = voice.st, listening = s === 'listening' || s === 'starting';
    $('#vMain').classList.toggle('is-listening', s === 'listening');
    $('#vBtn').setAttribute('aria-label', listening ? '듣기 멈추기' : '눌러서 말하기');
    const T = {
        idle: ['눌러서 말하기', '가운데 동그라미를 누르고 찾을 물건을 말하세요'],
        starting: ['마이크를 여는 중…', '허용 창이 뜨면 ‘허용’을 눌러 주세요'],
        listening: ['듣고 있어요…', '찾을 물건을 말씀하세요'],
        done: ['찾는 중…', ''],
        nospeech: ['못 들었어요', '동그라미를 다시 누르고 말해 주세요'],
        nomatch: ['지도에 없는 말이에요', '다른 이름으로 말하거나 글자로 찾아 보세요'],
        denied: ['마이크가 막혀 있어요', '주소창 왼쪽 자물쇠(또는 설정) → 마이크 → ‘허용’으로 바꾼 뒤 다시 눌러 주세요'],
        broken: ['이 기기에선 말로 찾기가 안 돼요', '글자로 찾거나, 키보드의 🎤 받아쓰기로 말해 보세요'],
        pick: ['어느 것을 찾으세요?', `${(voice.cands || []).length}곳에서 찾았어요 · 눌러서 고르세요`]
    }[s] || ['', ''];
    $('#vTitle').textContent = T[0]; $('#vSub').textContent = T[1];
    const text = s === 'nomatch' || s === 'pick' ? voice.q : voice.heard;
    $('#vHeard').hidden = !text;
    if (text) { $('#vText').textContent = `“${text}”`; $('#vNote').textContent = s === 'nomatch' ? '이 말로는 찾지 못했어요' : s === 'pick' ? '' : s === 'done' ? '찾는 중…' : '말이 끝나면 바로 찾아 드려요'; }
    $('#vActs').innerHTML = s === 'pick' ? `<div class="rows" style="text-align:left">${(voice.cands || []).map((m, i) => hitHTML(m, voice.q, i)).join('')}</div><button type="button" class="btn btn-s" data-act="vtoggle">다시 말하기</button>`
        : ['nomatch', 'nospeech', 'denied', 'broken'].includes(s)
        ? (s !== 'broken' ? `<button type="button" class="btn btn-p" data-act="vtoggle">다시 말하기</button>` : '') + `<button type="button" class="btn btn-s" data-act="vtext">글자로 찾기</button>`
        : '';
}

// ────────────────────────────────────────────────────────────
// B3 찾은 결과 (from: search·voice·list·map·move)
// ────────────────────────────────────────────────────────────
let rc = null; // 지금 보고 있는 결과
function renderResult(r) {
    const p = photoById(r.a), zi = parseInt(r.b, 10), z = p && p.zones[zi];
    if (!z) { nav('#/', true); return false; }
    const q = r.q.get('q') || '', itemName = r.q.get('item') || '', from = r.q.get('from') || (q ? 'search' : 'map');
    const it = itemName ? z.items.find(x => x.name === itemName) : null;
    if (itemName && !it) { // 그 사이 옮겨졌으면 새 자리로, 어디에도 없으면 칸 보기로
        for (const p2 of vis()) for (let j = 0; j < p2.zones.length; j++) if (p2.zones[j].items.some(x => x.name === itemName)) { nav(resultHash(p2.id, j, q, itemName, from), true); return false; }
        nav(resultHash(p.id, zi, '', '', 'map'), true); return false;
    }
    let match = null, others = [];
    if (q) { const ms = findSearchMatches(q); match = ms.find(m => m.data === p && m.index === zi) || null; others = ms.filter(m => m !== match).slice(0, 4); }
    const zm = zoomFor(p, z), zoomOn = zm.s > 1.25;
    rc = { p, zi, z, it, q, from, zm, zoomOn };
    const back = { map: ['지도', `#/map/${encodeURIComponent(p.id)}`], list: ['목록', '#/list'] }[from] || ['다시 찾기', '#/'];
    const right = q ? `${from === 'voice' ? '들은 말' : '찾은 말'} · ${q}` : from === 'move' ? '옮긴 자리' : from === 'map' ? '구역 보기' : (p.title || '');
    const n = zi + 1, why = whyOf(match, q), zoneOnly = !it;
    const facts = [];
    if (it && (it.name !== q || from === 'list' || from === 'move')) facts.push(['물건', esc(it.name)]);
    if (why) facts.push(['', `<span class="why">${esc(why)}</span>`]);
    if (it && it.comment) facts.push(['메모', esc(it.comment)]);
    if (it && stockOn() && (isNum(it.qty) || isNum(it.par))) facts.push(['재고', `${isNum(it.qty) ? `${it.qty}개` : '안 셈'}${isNum(it.par) ? ` · 최소 ${it.par}개` : ''}${itemLow(it) ? ` · <span class="why">${it.par - it.qty}개 모자라요</span>` : ''}`]);
    if (it && feat('exp') && it.exp) { const st = expState(it); facts.push(['유통기한', `${esc(it.exp.replace(/-/g, '. '))}${st ? ` · <span class="why">${esc(expLabel(it))}</span>` : ''}`]); }
    facts.push(['확인', `${agoText(z.checkedAt)}${isStale(z) ? ' · <span class="why">점검할 때가 됐어요</span>' : ''}`]);
    const rest = itemsSorted(z).filter(x => x !== it);
    let body = '';
    if (zoneOnly) {
        body = `<div class="with" style="display:block"><span class="k">이 칸의 물건 ${z.items.length}</span></div>`
            + (z.items.length ? `<ul class="zitems">${itemsSorted(z).map(x => `<li><span>${x.pin ? '★ ' : ''}${esc(x.name)}${itemMarks(x)}</span>${x.comment ? `<small>${esc(x.comment)}</small>` : ''}</li>`).join('')}</ul>` : `<p class="empty">아직 넣은 물건이 없어요.</p>`);
    } else if (rest.length) {
        body = `<div class="with"><span class="k">함께 있는 것</span><span>${rest.slice(0, 8).map(x => esc(x.name)).join(' · ')}${rest.length > 8 ? ` 외 ${rest.length - 8}` : ''}</span></div>`;
    }
    // 답 버튼은 아래에 붙여 늘 보이게 (11/10), 나머지 링크는 본문에
    let dock, links = '';
    if (from === 'move') dock = `<p class="dk">새 자리로 옮겼어요 · 다음부턴 여기로 찾아 드려요</p><button type="button" class="btn btn-p" data-act="home">처음으로</button>`;
    else if (zoneOnly) dock = `<p class="dk">칸을 열어 봤다면 알려 주세요 · 점검 날짜가 바뀌어요</p><button type="button" class="btn btn-p" data-act="yes">오늘 확인했어요</button><button type="button" class="btn btn-s" data-act="go" data-to="#/zone/${encodeURIComponent(p.id)}/${zi}">물건 넣기·고치기</button>`;
    else {
        dock = `<p class="dk">답해 주시면 지도가 계속 정확해져요</p><button type="button" class="btn btn-p" data-act="yes">네, 여기 있어요</button><button type="button" class="btn btn-s" data-act="moveStart">여기 없었어요</button>`;
        links = `<button type="button" class="tlink" data-act="go" data-to="#/zone/${encodeURIComponent(p.id)}/${zi}?item=${esc(encodeURIComponent(it.name))}">이 물건 재고·메모 고치기 →</button>`;
    }
    if (from !== 'map') links += `<button type="button" class="tlink" data-act="go" data-to="#/map/${encodeURIComponent(p.id)}">수납 지도에서 보기 →</button>`;
    $('#s-r').innerHTML = `
        <header class="top">${backBtn(back[0], back[1])}<span class="meta">${esc(right)}</span></header>
        <main class="wrap" style="flex:1;display:flex;flex-direction:column">
            <div class="ans"><span class="ans-n">${n}</span><div class="ans-t"><small>${from === 'move' ? '이제 여기예요' : '여기 있어요'}</small><b>${esc(autoZoneName(z.name) ? `${n}번 구역` : z.name)}</b></div></div>
            <p class="where"><b>${esc(p.title || '사진')}</b>${autoZoneName(z.name) ? `, ${esc(posWords(p, z))}` : ''} ${n}번 칸이에요.</p>
            <ul class="facts">${facts.map(([k, v]) => `<li><span class="k">${k}</span><span>${v}</span></li>`).join('')}</ul>
            <div id="rPhoto">${photoHTML(p, { hit: zi, zoom: zoomOn ? zm : null })}</div>
            <div class="ph-tools"><span class="hint" style="margin:0;flex:1">두 손가락으로 벌리면 더 크게</span>${zm.s > 1.25 ? `<button type="button" class="tlink" data-act="zoom" id="zoomBtn">사진 전체 보기</button>` : ''}</div>
            ${body}
            ${links ? `<div class="cta">${links}</div>` : ''}
            ${others.length ? `<div class="others"><span class="kick">다른 곳도 있어요</span>${others.map((m, i) => hitHTML(m, q, i)).join('')}</div>` : ''}
            <div class="dock">${dock}</div>
        </main>`;
    rc.zs = zoomOn ? { s: zm.s, tx: zm.tx, ty: zm.ty } : { s: 1, tx: 0, ty: 0 };
    rc.pz = attachPinch($('#rPhoto .ph'), $('#rPhoto .ph-in'), rc.zs, () => { const b = $('#zoomBtn'); if (b) b.textContent = rc.zs.s > 1.05 ? '사진 전체 보기' : '이 칸 크게 보기'; });
}
function toggleZoom() {
    if (!rc || !rc.pz) return;
    if (rc.zs.s > 1.05) rc.pz.set(1, 0, 0); else rc.pz.set(rc.zm.s, rc.zm.tx, rc.zm.ty);
}
function actYes() {
    if (!rc) return;
    const { z, from, it } = rc;
    z.checkedAt = Date.now(); saveAll();
    if (!it) { toast('오늘 확인으로 적었어요'); route(true); return; }
    toast('고마워요 · 오늘 확인으로 적었어요');
    if (from === 'search' || from === 'voice') { const q = $('#q'); if (q) q.value = ''; }
    goBack('#/');
}

// ────────────────────────────────────────────────────────────
// B4 수납 지도 — 보는 방식 (11/10 써 보고 고름: 이어 보기가 기본, 한 장씩은 뺌) · 이어 보기(사진을 아래로 이어서, v1처럼) · 모아 보기(사진 바둑판) · 목록(사진 + 안에 든 것)
//   #/map/사진 = 고른 방식으로 (이어 보기면 그 사진까지 내려가 있다)
//   #/map/사진?v=flow = 모아 보기·목록에서 사진을 눌러 들어온 이어 보기 (고른 방식은 그대로, 뒤로 → 모아 보기·목록). 옛 주소 ?v=one도 같게
//   칸을 누르면 그 자리에서 물건 창 (zone.js)
// ────────────────────────────────────────────────────────────
const MAP_VIEWS = [['flow', '이어 보기'], ['grid', '모아 보기'], ['list', '목록']];
const mapView = () => { const v = ls('v2MapView'); return MAP_VIEWS.some(([k]) => k === v) ? v : 'flow'; };
const mapOpen = new Set();
let mapNow = 'flow', mapFlowGo = null, mfLast = null;
function mapCounts(p) { return { items: p.zones.reduce((n, z) => n + z.items.length, 0), stale: p.zones.filter(isStale).length }; }
function mapMetaHTML(p) { const c = mapCounts(p); return `구역 ${p.zones.length} · 물건 ${c.items}${c.stale ? ` · <span class="warn">점검 ${c.stale}</span>` : ''}`; }
function mapRowsHTML(p) {
    const rows = p.zones.map((z, i) => ({ z, i })), shown = mapOpen.has(String(p.id)) ? rows : rows.slice(0, 5);
    if (!rows.length) return `<p class="empty">아직 칸이 없어요 · <button type="button" class="tlink" style="padding:0;min-height:0;color:var(--accent)" data-act="go" data-to="#/edit/${encodeURIComponent(p.id)}">구역 그리기</button>에서 칸을 나눠 주세요.</p>`;
    return `<div class="zt-head"><span>구역 · 물건</span><span>마지막 확인</span></div>`
        + shown.map(({ z, i }) => `<button type="button" class="zrow" data-act="zone" data-p="${esc(p.id)}" data-z="${i}"><span class="n">${i + 1}</span><span class="t">${esc(zoneSummary(z))}${z.name ? `<small>${esc(z.name)}</small>` : ''}</span><span class="d${isStale(z) ? ' warn' : ''}">${isStale(z) ? `${agoText(z.checkedAt)} · 점검` : agoText(z.checkedAt)}</span></button>`).join('')
        + (rows.length > shown.length ? `<button type="button" class="morebtn" data-act="mapMore" data-p="${esc(p.id)}">${rows.length - shown.length}개 더 보기</button>` : '');
}
function mapSwitchHTML(v) {
    return `<div class="vsw" role="tablist" aria-label="지도 보는 방식"><span class="vsw-l">보기</span>${MAP_VIEWS.map(([k, l]) => `<button type="button" role="tab" aria-selected="${k === v}" data-act="mapView" data-v="${k}">${l}</button>`).join('')}</div>`;
}
const mapLinks = () => `<div class="links"><button type="button" data-act="go" data-to="#/print">인쇄</button><button type="button" data-act="go" data-to="#/check">점검</button><button type="button" data-act="addPhoto">사진 더 넣기</button></div>`;
function renderMap(r) {
    const p = photoById(r.a) || vis()[0], qv = r.q.get('v'), into = qv === 'flow' || qv === 'one'; // into: 모아 보기·목록에서 사진을 눌러 들어옴
    if (!r.a || String(p.id) !== String(r.a)) { nav(`#/map/${encodeURIComponent(p.id)}${into ? '?v=flow' : ''}`, true); return false; }
    const all = vis(), multi = all.length > 1, pref = mapView(), v = into || !multi ? 'flow' : pref, fromList = into && pref !== 'flow';
    mapNow = v; mapFlowGo = v === 'flow' && p !== all[0] ? String(p.id) : null;
    const total = all.reduce((a, q) => { const c = mapCounts(q); return { z: a.z + q.zones.length, i: a.i + c.items }; }, { z: 0, i: 0 });
    const head = `${multi && !fromList ? mapSwitchHTML(v) : ''}<div class="title-row"><h1 class="h1">수납 지도</h1><span class="meta">사진 ${all.length} · 구역 ${total.z} · 물건 ${total.i}</span></div>`;
    const back = fromList ? backBtn(MAP_VIEWS.find(([k]) => k === pref)[1], `#/map/${encodeURIComponent(p.id)}`) : backBtn('검색', '#/');
    let body;
    if (v === 'flow') { // 사진을 아래로 이어서 (사진이 여러 장이면 위에 작은 사진 줄이 붙어 따라오고, 지금 보는 사진을 표시)
        body = `${head}
            ${multi ? `<div class="mf-strip" id="mfStrip" role="tablist" aria-label="사진으로 바로 가기">${all.map((q, i) => `<button type="button" role="tab" data-act="mfJump" data-p="${esc(q.id)}" aria-selected="${q === p}"><span class="th">${thumbImg(q)}</span><span class="tx"><b>${i + 1}</b>${esc(q.title || '사진')}</span></button>`).join('')}</div>` : ''}
            ${all.map((q, i) => `<section class="mf-sec" data-p="${esc(q.id)}" aria-label="${esc(q.title || '사진')}">
                <div class="mf-h"><span class="n">${i + 1}</span><h2>${esc(q.title || '사진')}</h2><button type="button" class="tlink" data-act="go" data-to="#/edit/${encodeURIComponent(q.id)}">구역 고치기</button></div>
                <p class="mf-meta">${mapMetaHTML(q)}</p>
                ${photoHTML(q, { tap: 'zone', stale: true })}
                ${mapRowsHTML(q)}
            </section>`).join('')}
            ${mapLinks()}`;
    } else if (v === 'grid') { // 사진 바둑판 (칸 테두리만 얇게) → 누르면 이어 보기로 그 사진
        body = `${head}
            <div class="mg">${all.map((q, i) => { const ar = 800 / h800(q); return `<button type="button" class="mg-c" data-act="mapOne" data-p="${esc(q.id)}">
                <span class="mg-ph"><span class="mg-in" style="--ar:${ar};${ar >= 4 / 3 ? 'width:100%' : 'height:100%'}">${thumbImg(q)}${q.zones.map(z => { const b = zoneBox(q, z); return `<i class="${isStale(z) ? 'st' : ''}" style="left:${b.l}%;top:${b.t}%;width:${b.w}%;height:${b.h}%"></i>`; }).join('')}</span><em class="mg-n">${i + 1}</em></span>
                <b>${esc(q.title || '사진')}</b><small>${mapMetaHTML(q)}</small></button>`; }).join('')}
                <button type="button" class="mg-c mg-add" data-act="addPhoto"><span class="mg-ph"><span aria-hidden="true">+</span></span><b>사진 더 넣기</b><small>한 면에 한 장씩</small></button>
            </div>
            <div class="links"><button type="button" data-act="go" data-to="#/print">인쇄</button><button type="button" data-act="go" data-to="#/check">점검</button></div>`;
    } else { // 목록: 사진 + 안에 든 것 (칸마다 첫 물건) → 누르면 이어 보기로 그 사진
        body = `${head}
            <div class="ml">${all.map((q, i) => `<button type="button" class="ml-r" data-act="mapOne" data-p="${esc(q.id)}">
                <span class="ml-th">${thumbImg(q)}<em>${i + 1}</em></span>
                <span class="ml-tx"><b>${esc(q.title || '사진')}</b><small>${mapMetaHTML(q)}</small>
                    <span class="ml-zs">${q.zones.length ? q.zones.slice(0, 4).map((z, zi) => `<span><i>${zi + 1}</i>${esc(zoneSummary(z))}</span>`).join('') + (q.zones.length > 4 ? `<span class="more">외 ${q.zones.length - 4}칸</span>` : '') : '<span>아직 칸이 없어요</span>'}</span>
                </span></button>`).join('')}</div>
            ${mapLinks()}`;
    }
    $('#s-map').innerHTML = `
        <header class="top">${back}<button type="button" class="tlink" data-act="addPhoto">사진 더 넣기</button></header>
        <main class="wrap" style="flex:1;display:flex;flex-direction:column;padding-bottom:28px">${body}</main>`;
    if (v === 'flow') requestAnimationFrame(mfTrack);
}
// 이어 보기: 화면 위쪽 35% 선을 넘은 마지막 사진을 위 사진 줄에 표시 (v1과 같은 선). 맨 아래까지 내리면 마지막 사진
function mfTrack() {
    if (cur !== 'map' || mapNow !== 'flow') return;
    const secs = [...document.querySelectorAll('#s-map .mf-sec')], strip = $('#mfStrip'); if (!secs.length || !strip) return;
    let on = secs[0];
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) on = secs[secs.length - 1];
    else secs.forEach(sec => { if (sec.getBoundingClientRect().top <= innerHeight * 0.35) on = sec; });
    let btn = null;
    strip.querySelectorAll('button').forEach(b => { const sel = b.dataset.p === on.dataset.p; if (sel) btn = b; if ((b.getAttribute('aria-selected') === 'true') !== sel) b.setAttribute('aria-selected', String(sel)); });
    if (btn && mfLast !== on.dataset.p) { mfLast = on.dataset.p; strip.scrollTo({ left: btn.offsetLeft - (strip.clientWidth - btn.offsetWidth) / 2, behavior: 'smooth' }); }
}
let mfRaf = 0;
window.addEventListener('scroll', () => { if (mfRaf || mapNow !== 'flow') return; mfRaf = requestAnimationFrame(() => { mfRaf = 0; mfTrack(); }); }, { passive: true });
function mfJump(pid, instant) {
    const sec = [...document.querySelectorAll('#s-map .mf-sec')].find(x => x.dataset.p === String(pid)), strip = $('#mfStrip'); if (!sec) return;
    const toph = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--toph')) || 60;
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.max(0, window.scrollY + sec.getBoundingClientRect().top - toph - (strip ? strip.offsetHeight : 0) - 4), behavior: instant || reduce ? 'auto' : 'smooth' });
}
AFTER_ROUTE.push((name) => { const go = mapFlowGo; mapFlowGo = null; if (name === 'map' && go && window.scrollY < 4) mfJump(go, true); });
// 물건 창이 열린 채 다른 사진·보는 방식으로 → 창을 연 기록부터 걷고 바꾼다 (뒤로 가기가 엉키지 않게)
function mapSwap(hash) { if (parseRoute().q.has('sz') && history.state && history.state.zs && depth() > 0) backThen(hash); else nav(hash, true); }

// ────────────────────────────────────────────────────────────
// B7 물건 전체 목록 (가나다순 · 공간별)
// ────────────────────────────────────────────────────────────
const JAMO_BASE = { 'ㄲ': 'ㄱ', 'ㄸ': 'ㄷ', 'ㅃ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅉ': 'ㅈ' };
function groupOf(name) {
    const ch = String(name || '').trim()[0] || '#', c = ch.charCodeAt(0) - 0xAC00;
    if (c >= 0 && c < 11172) { const j = CHOSUNG[Math.floor(c / 588)]; return JAMO_BASE[j] || j; }
    if (/[a-z]/i.test(ch)) return ch.toUpperCase();
    return '#';
}
function renderList(r) {
    const by = r.q.get('by') === 'zone' ? 'zone' : 'abc', multi = vis().length > 1;
    const rows = []; vis().forEach(p => p.zones.forEach((z, zi) => z.items.forEach(it => rows.push({ p, zi, it }))));
    const li = (x, left, right) => `<button type="button" class="li" data-act="item" data-p="${esc(x.p.id)}" data-z="${x.zi}" data-item="${esc(x.it.name)}"><span class="lg">${left}</span><span class="ln">${x.it.pin ? '★ ' : ''}${esc(x.it.name)}</span><span class="lz">${right}</span></button>`;
    let body = '';
    if (!rows.length) body = `<p class="empty">아직 넣은 물건이 없어요.</p>`;
    else if (by === 'abc') {
        rows.sort((a, b) => a.it.name.localeCompare(b.it.name, 'ko') || (vis().indexOf(a.p) - vis().indexOf(b.p)) || (a.zi - b.zi));
        let last = null;
        body = rows.map(x => { const g = groupOf(x.it.name), lead = g !== last ? esc(g) : ''; last = g; return li(x, lead, `${multi ? `<small>${esc(x.p.title)}</small> ` : ''}${x.zi + 1}번`); }).join('');
    } else {
        body = vis().map(p => (multi ? `<h2 class="lh">${esc(p.title || '사진')}</h2>` : '') + p.zones.map((z, zi) => z.items.length
            ? `<div class="lzh"><b>${zi + 1}</b>${esc(zoneName(z, zi))}</div>` + itemsSorted(z).map(it => li({ p, zi, it }, '', it.comment ? `<small>${esc(it.comment)}</small>` : '')).join('')
            : '').join('')).join('');
    }
    $('#s-list').innerHTML = `
        <header class="top">${backBtn('검색', '#/')}<button type="button" class="tlink" data-act="go" data-to="#/print">인쇄</button></header>
        <main class="wrap" style="padding-bottom:30px">
            <div class="title-row"><h1 class="h1">물건 전체 목록</h1><span class="meta">${rows.length}개 · ${multi ? `사진 ${vis().length}장` : esc(vis()[0].title || '')}</span></div>
            <div class="tabs" role="tablist"><button type="button" role="tab" aria-selected="${by === 'abc'}" data-act="listTab" data-by="abc">가나다순</button><button type="button" role="tab" aria-selected="${by === 'zone'}" data-act="listTab" data-by="zone">공간별</button></div>
            ${body}
        </main>`;
}

// ────────────────────────────────────────────────────────────
// B6 실제 자리로 옮기기
// ────────────────────────────────────────────────────────────
let mv = null;
function renderMove(r) {
    const p = photoById(r.a), zi = parseInt(r.b, 10), z = p && p.zones[zi], name = r.q.get('item') || '';
    if (!z || !z.items.some(x => x.name === name)) { nav('#/', true); return false; }
    if (!mv || mv.key !== location.hash) mv = { key: location.hash, pid: String(p.id), zi, name, q: r.q.get('q') || '', view: String(p.id), to: null, list: false };
    paintMove();
}
function paintMove() {
    const from = photoById(mv.pid), view = photoById(mv.view) || from, to = mv.to ? photoById(mv.to.pid) : null;
    const sameView = String(view.id) === mv.pid, toHere = mv.to && String(mv.to.pid) === String(view.id);
    const label = (p, i) => (vis().length > 1 && String(p.id) !== mv.pid ? `${p.title} ` : '') + `${i + 1}번 구역`;
    const zlist = mv.list ? `<div class="mv-list rows">${vis().map(p => p.zones.map((z, i) => (String(p.id) === mv.pid && i === mv.zi) ? '' :
        `<button type="button" class="zrow" data-act="mvPick" data-p="${esc(p.id)}" data-z="${i}"><span class="n">${i + 1}</span><span class="t">${esc(zoneSummary(z))}<small>${esc(p.title || '사진')}${z.name ? ' · ' + esc(z.name) : ''}</small></span><span class="d">${mv.to && String(mv.to.pid) === String(p.id) && mv.to.zi === i ? '고름' : ''}</span></button>`).join('')).join('')}</div>` : '';
    $('#s-move').innerHTML = `
        <header class="top">${backBtn('결과', resultHash(mv.pid, mv.zi, mv.q, mv.name, 'search'))}<button type="button" class="tlink" data-act="back" data-fb="${esc(resultHash(mv.pid, mv.zi, mv.q, mv.name, 'search'))}">취소</button></header>
        <main class="wrap" style="flex:1;display:flex;flex-direction:column;padding-bottom:20px">
            <span class="kick" style="margin-top:20px">${esc(mv.name)} · 자리 옮기기</span>
            <h1 class="h1" style="margin:6px 0 4px">어느 칸이에요?</h1>
            <p style="margin:0 0 18px;font-size:15px;color:var(--sub)">사진에서 실제로 있던 칸을 눌러 주세요.</p>
            ${photoTabs(view.id, 'mvView')}
            ${photoHTML(view, { tap: 'mvPick', from: sameView ? mv.zi : null, sel: toHere ? mv.to.zi : null })}
            <div class="mv-from"><span>${esc(label(from, mv.zi))}</span><span aria-hidden="true">→</span>${to ? `<b>${esc(label(to, mv.to.zi))}</b>` : '<span>?</span>'}</div>
            <div class="cta" style="padding-top:20px">
                <button type="button" class="btn btn-s" data-act="mvList" aria-expanded="${mv.list}">${mv.list ? '목록 닫기' : '목록에서 고르기'}</button>
                ${zlist}
                <div class="mv-foot"><button type="button" class="tlink" data-act="mvLost">찾을 수 없어요</button><span>잘못 옮기면 되돌릴 수 있어요</span></div>
            </div>
            <div class="dock"><button type="button" class="btn btn-p" data-act="mvGo"${to ? '' : ' disabled'}>${to ? `${esc(label(to, mv.to.zi))}${esc(josa(label(to, mv.to.zi), '으로', '로').slice(label(to, mv.to.zi).length))} 옮기기` : '칸을 먼저 눌러 주세요'}</button></div>
        </main>`;
}
function moveTo(pid, zi) {
    if (String(pid) === mv.pid && zi === mv.zi) { toast('원래 기록된 칸이에요 · 다른 칸을 눌러 주세요'); return; }
    mv.to = { pid: String(pid), zi }; mv.view = String(pid); paintMove();
}
function doMove() {
    if (!mv || !mv.to) return;
    const fromP = photoById(mv.pid), fz = fromP.zones[mv.zi], toP = photoById(mv.to.pid), tz = toP && toP.zones[mv.to.zi], name = mv.name;
    const it = fz && fz.items.find(x => x.name === name); if (!it || !tz) return;
    const idx = fz.items.indexOf(it), dup = tz.items.find(x => x.name === name), copy = { ...it }, prevChecked = tz.checkedAt;
    fz.items.splice(idx, 1);
    if (!dup) tz.items.push(copy); // 옮긴 칸에 같은 이름이 이미 있으면 하나로 (v1과 같다)
    tz.checkedAt = Date.now();
    saveAll();
    const back = { pid: mv.pid, zi: mv.zi, q: mv.q }, toZi = mv.to.zi;
    backThen(resultHash(toP.id, toZi, '', name, 'move'));
    toast(`옮겼어요 · ${toP.title || '사진'} ${toZi + 1}번`, () => {
        if (!dup) tz.items = tz.items.filter(x => x !== copy);
        if (!fz.items.some(x => x.name === name)) fz.items.splice(Math.min(idx, fz.items.length), 0, it);
        if (prevChecked == null) delete tz.checkedAt; else tz.checkedAt = prevChecked;
        saveAll(); nav(resultHash(back.pid, back.zi, back.q, name, 'search'), true); toast('되돌렸어요');
    });
}
function openLostSheet() {
    const sh = $('#sheet');
    sh.innerHTML = `<div class="sheet-card" role="dialog" aria-modal="true" aria-labelledby="shT">
        <h2 id="shT">${esc(josa(mv.name, '을', '를'))} 못 찾으셨어요?</h2>
        <p>지도에서 빼서 ‘자리 미정’에 넣어 둘까요? 나중에 찾으면 그때 자리를 정하면 돼요.</p>
        <div class="stack"><button type="button" class="btn btn-p" data-act="lostYes">자리 미정으로 빼기</button><button type="button" class="btn btn-s" data-act="sheetClose">그대로 두기</button></div></div>`;
    sh.hidden = false; setTimeout(() => { const b = sh.querySelector('.btn'); if (b) b.focus(); }, 30);
}
function doLost() {
    const p = photoById(mv.pid), z = p.zones[mv.zi], idx = z.items.findIndex(x => x.name === mv.name); if (idx < 0) return;
    const it = z.items.splice(idx, 1)[0], had = inboxItems().some(x => x.name === it.name);
    if (!had) kvSet('inboxItems', JSON.stringify([{ name: it.name, at: Date.now() }, ...readJSON('inboxItems', [])])); // v1 자리 미정과 같은 모양
    saveAll(); closeSheet();
    goHome();
    toast(`‘${it.name}’ → 자리 미정`, () => {
        z.items.splice(Math.min(idx, z.items.length), 0, it);
        if (!had) kvSet('inboxItems', JSON.stringify(readJSON('inboxItems', []).filter(x => x && x.name !== it.name)));
        saveAll(); route(true); toast('되돌렸어요');
    });
}

// ────────────────────────────────────────────────────────────
// B8 메뉴 · B1 첫 소개
// ────────────────────────────────────────────────────────────
const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeasXUyRCQNDvlBqHDo4SbQMsNkBpBaHqFqL6aWU091yDmpLw/viewform';
function renderMenu() {
    const has = vis().length > 0;
    const M = [
        has && ['수납 지도', '공간 보기 · 구역 고치기', `#/map/${encodeURIComponent(vis()[0].id)}`, 0],
        ['새 공간 만들기', '사진 넣고 칸 나누기 · AI로 찾기', null, 0, 'addPhoto'],
        has && ['물건 전체 목록', '한눈에 훑어보기', '#/list', 0],
        has && ['자리 미정', '새로 산 물건 넣어 두고 자리 추천받기', '#/inbox', 0],
        has && ['점검 · 발주', '재고 세기 · 모자란 것 · 오래된 칸', '#/check', 0],
        has && ['번호 스티커 · 지도 인쇄', '사진 지도 · 큰 글씨 목록 · 점검표', '#/print', 0],
        SAMPLE ? ['예시 닫기', ls('hasSavedPhotos') === '1' ? '내 지도로 돌아가요' : '처음 화면으로', null, 0, 'sampleExit'] : ['예시 보기', '내 지도는 그대로 있어요', null, 0, 'sample'],
        ['가격 · 대신 만들기', '앱은 무료 · 원격·방문 · 업체 샘플 무료', '#/service', 0],
        ['사용법', '처음 쓰는 분을 위한 네 단계', '#/guide', 0],
        ['설정', '백업 · 쓰는 곳 · 기능 켜기', '#/settings', 0]
    ].filter(Boolean);
    $('#s-menu').innerHTML = `
        <header class="top"><span class="brand">오브젯도</span><button type="button" class="tlink" data-act="back" data-fb="#/">닫기</button></header>
        <main class="wrap" style="flex:1">
            <ul class="menu">${M.map(([t, s, href, ext, act], i) => {
                const inner = `<span class="no">${String(i + 1).padStart(2, '0')}</span><span class="tx"><b>${t}</b><small>${s}</small></span><span class="ar">${ext === 1 ? EXT : '→'}</span>`;
                return `<li>${act ? `<button type="button" class="mi" data-act="${act}">${inner}</button>`
                    : ext === 1 ? `<a class="mi" href="${href}" data-v1>${inner}</a>`
                    : ext === 2 ? `<a class="mi" href="${href}">${inner}</a>`
                    : `<button type="button" class="mi" data-act="go" data-to="${href}">${inner}</button>`}</li>`;
            }).join('')}</ul>
        </main>
        <footer class="foot"><a href="${FEEDBACK_FORM_URL}" target="_blank" rel="noopener">써 보니 어떠세요? 의견 보내기 (1분)</a><br><span style="display:block;margin-top:10px">무료 베타 · 가입 없이 이 폰에만 저장돼요 · <a href="${V1()}" data-v1>이전 화면(v1)으로 ${EXT}</a></span></footer>`;
}
function renderIntro() {
    const home = isHome();
    const pts = home ? ['사진 위에 물건 위치 기록', '말로 물으면 그 칸이 보여요', '가족 누구나 같은 지도로', '지도 출력해 수납장에 부착'] : ['사진 위에 물건 위치 기록', '말·검색으로 보관 칸 찾기', '수량·유통기한 점검', '지도 출력해 현장에 부착'];
    $('#s-intro').innerHTML = `
        <header class="top"><span class="brand">오브젯도 <small>OBJETDO</small></span><button type="button" class="tlink" data-act="go" data-to="#/guide">사용법</button></header>
        <main class="intro wrap">
            <span class="kick">무료 베타</span>
            <div class="intro-hero"><h1>물건은 제자리에,<br>찾는 시간은<br>줄이세요</h1><span class="vert" aria-hidden="true">제자리 지도</span></div>
            <p class="lead">사진으로 기록하는<br>${home ? '우리 집 수납 지도' : '매장 창고·수납 관리'}</p>
            <ol class="nums">${pts.map((t, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span>${t}</li>`).join('')}</ol>
            <div class="cta">
                <button type="button" class="btn btn-p split" data-act="sample">예시로 먼저 둘러보기<span aria-hidden="true">→</span></button>
                <button type="button" class="btn btn-s split" data-act="addPhoto">${home ? '내 수납장 사진으로 시작' : '내 창고 사진으로 시작'}<span aria-hidden="true">→</span></button>
                <p class="fine">가입 없이 이 폰에만 저장돼요.<br>지도 대신 만들기 · 원격 3곳 ₩19,000부터 · <a href="#/service" data-act="go" data-to="#/service">문의</a></p>
            </div>
        </main>`;
}
function enterSample() {
    try { sessionStorage.setItem('samplePreview', isHome() ? 'organizer' : '1'); } catch (e) { toast('이 브라우저에선 예시를 열 수 없어요'); return; }
    history.replaceState(null, '', location.pathname + '#/'); location.reload();
}
function exitSample() {
    try { sessionStorage.removeItem('samplePreview'); } catch (e) {}
    history.replaceState(null, '', location.pathname + '#/'); location.reload();
}

// ────────────────────────────────────────────────────────────

BEFORE_ROUTE.push((name) => { if (name !== 'voice') voice.stop(true); });
Object.assign(SCREENS, { home: renderHome, intro: renderIntro, voice: renderVoice, r: renderResult, map: renderMap, list: renderList, move: renderMove, menu: renderMenu });
Object.assign(ACT, {
    clear: () => { const q = $('#q'); q.value = ''; renderLive(); q.focus(); },
    voice: () => startVoiceFromHome(),
    vtoggle: () => { if (voice.rec) voice.stop(); else if (voice.start()) paintVoice(); else { voice.st = 'broken'; paintVoice(); } },
    vtext: () => { nav('#/', true); setTimeout(() => { const q = $('#q'); if (q) q.focus(); }, 60); },
    open: (el) => { const q = el.dataset.q || ''; recordPick(q, el.dataset.item); nav(resultHash(el.dataset.p, +el.dataset.z, q, el.dataset.item, cur === 'r' && rc ? rc.from : cur === 'voice' ? 'voice' : 'search'), cur === 'r' || cur === 'voice'); },
    nudgeX: (el) => { lsSet(el.dataset.k, String(Date.now() + Number(el.dataset.d) * 86400000)); $('#homeNudge').innerHTML = ''; },
    chip: (el) => openQuery(el.dataset.q, 'search'),
    yes: () => actYes(),
    moveStart: () => { if (rc && rc.it) nav(`#/move/${encodeURIComponent(rc.p.id)}/${rc.zi}?` + new URLSearchParams({ item: rc.it.name, ...(rc.q ? { q: rc.q } : {}) })); },
    zoom: () => toggleZoom(),
    zone: (el) => zsGo(el.dataset.p, +el.dataset.z), // 칸 → 그 자리에서 물건 창 (11/10)
    mapMore: (el) => { mapOpen.add(el.dataset.p); const y = window.scrollY; renderMap(parseRoute()); window.scrollTo(0, y); if (typeof zsMark === 'function') zsMark(); },
    mapView: (el) => { const v = el.dataset.v; if (v === mapNow) return; lsSet('v2MapView', v); const pid = (mapNow === 'flow' && mfLast) || parseRoute().a; mfLast = null; mapSwap(`#/map/${encodeURIComponent(pid)}`); },
    mapOne: (el) => nav(`#/map/${encodeURIComponent(el.dataset.p)}?v=flow`), // 모아 보기·목록 → 이어 보기로 그 사진
    mfJump: (el) => mfJump(el.dataset.p),
    item: (el) => nav(resultHash(el.dataset.p, +el.dataset.z, '', el.dataset.item, 'list')),
    listTab: (el) => nav('#/list' + (el.dataset.by === 'zone' ? '?by=zone' : ''), true),
    mvPick: (el) => moveTo(el.dataset.p, +el.dataset.z),
    mvView: (el) => { mv.view = el.dataset.p; paintMove(); },
    mvList: () => { mv.list = !mv.list; paintMove(); },
    mvGo: () => doMove(),
    mvLost: () => openLostSheet(),
    lostYes: () => doLost(),
    sample: () => enterSample(),
    sampleExit: () => exitSample()
});
