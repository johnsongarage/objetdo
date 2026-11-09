'use strict';
// ────────────────────────────────────────────────────────────
// 오브젯도 v2 — 인쇄 (#/print 사진 전체 · #/print?photo=ID 사진 한 장)
//   주소: &form=map|list|check|label 이면 그 양식으로 열고(기억) 주소에선 뺀다 · &view=1&pg=쪽 은 크게 보기 (뒤로 가기로 닫힌다)
//   종이는 v1 인쇄 엔진을 그대로 옮겨 그린다 → 같은 사진·같은 옵션이면 v1과 픽셀까지 같은 종이가 나온다
//   옵션·이름은 v1과 같은 곳(localStorage 'printOpts' · 'storeName' · 'organizerName')에 두어 v1과 v2가 같은 값을 쓴다
//   다른 화면에서 열 때: openPrint(사진 id, 양식) — 둘 다 빼도 된다 (전체 · 지난번 양식)
//   양식: 사진 지도 · 큰 글씨 목록 · 점검표 (v1과 같다) + 칸 라벨 (v1엔 만들어 두고 메뉴에 없던 것)
//   받기: PDF(v1과 같은 jsPDF) · 단톡방에 보내기(v1과 같다) · 그림(JPG) · 바로 인쇄(브라우저 인쇄 창)
// ────────────────────────────────────────────────────────────
addCSS(`
.pr-main { flex: 1; display: flex; flex-direction: column; padding-bottom: 24px; }
#s-print .title-row { margin-bottom: 18px; }
/* 미리보기: 왼쪽 쪽 그림(옆으로 밀면 다음 쪽) · 오른쪽 장수·크기·크게 보기. 키우면 쪽 그림이 한 줄을 다 쓰고 옆 칸은 아래로 */
.pr-pv { --pw: 128px; --pn: 1; display: flex; flex-wrap: wrap; align-items: flex-end; gap: 14px 18px; }
.pr-strip { flex: 1 1 0; min-width: min(100%, var(--pw)); max-width: min(100%, calc(var(--pn) * (var(--pw) + 10px) - 10px)); display: flex; align-items: flex-start; gap: 10px; overflow-x: auto; overscroll-behavior-x: contain; scroll-snap-type: x mandatory; scrollbar-width: none; }
.pr-strip::-webkit-scrollbar { display: none; }
.pr-pg { position: relative; flex: none; display: block; width: var(--pw); max-width: 100%; padding: 0; border: 1px solid var(--ink); border-radius: 0; background: #fff; cursor: zoom-in; scroll-snap-align: start; }
.pr-pg canvas { display: block; width: 100%; height: auto; }
.pr-pg.pr-wait { display: flex; align-items: center; justify-content: center; aspect-ratio: 210 / 297; min-height: calc(var(--pw) * 1.41); overflow: hidden; border-color: var(--line); color: var(--sub); font-size: 12px; cursor: progress; scroll-snap-align: none; } /* 만드는 중 자리에 붙어 있으면 쪽이 늘 때마다 줄이 끝으로 밀린다 */
.pr-wait::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: var(--accent); transform-origin: 0 0; animation: prLoad 1.3s ease-in-out infinite; }
@keyframes prLoad { 0% { transform: scaleX(0); opacity: 1; } 70% { transform: scaleX(1); opacity: 1; } 100% { transform: scaleX(1); opacity: 0; } }
.pr-side { flex: none; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.pr-wide .pr-side { flex: 1 1 100%; flex-direction: row; flex-wrap: wrap; align-items: center; gap: 4px 16px; } /* 쪽 그림이 한 줄을 다 쓰면 아래에 한 줄로 */
.pr-wide .pr-info { flex: 1 0 auto; }
.pr-info { font-size: 13px; color: var(--sub); }
.pr-zoom { display: flex; align-items: center; }
.pr-zoom button { width: 40px; height: 40px; padding: 0; border: 1px solid var(--line); border-radius: 0; background: transparent; color: var(--ink); font-size: 18px; line-height: 1; cursor: pointer; }
.pr-zoom button:disabled { opacity: .35; cursor: default; }
.pr-zoom .pr-zv { width: 56px; border: 0; font-size: 14px; font-variant-numeric: tabular-nums; }
.pr-big { min-height: 44px; padding: 0; border: 0; background: none; color: var(--ink); font-size: 14px; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; }
/* 옵션 줄 (B안: 왼쪽 이름 · 오른쪽 고르기) */
.pr-opts { margin-top: 22px; border-bottom: 1px solid var(--line); }
.pr-row { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 6px 0; border-top: 1px solid var(--line); }
.pr-row > span { flex: none; width: 52px; font-size: 13px; color: var(--sub); }
.pr-segs { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.pr-segs.pr-scroll { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin-right: calc(-1 * var(--gut)); padding-right: var(--gut); }
.pr-segs.pr-scroll::-webkit-scrollbar { display: none; }
.pr-seg { flex: none; display: inline-flex; align-items: center; gap: 6px; min-height: 40px; max-width: 15em; padding: 0 10px; border: 1px solid var(--ink); border-radius: 2px; background: transparent; color: var(--ink); font-size: 13px; white-space: nowrap; cursor: pointer; }
.pr-seg span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.pr-seg b { font-family: var(--serif); font-weight: 400; color: var(--accent); }
.pr-seg[aria-pressed="true"] { background: var(--ink); color: var(--bg); }
.pr-seg[aria-pressed="true"] b { color: inherit; }
.pr-sub { margin: -4px 0 0 64px; padding: 0 0 10px; font-size: 13px; color: var(--sub); }
.pr-name { min-width: 0; min-height: 40px; padding: 0; border: 0; background: none; color: var(--ink); font-size: 14px; text-align: left; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pr-name.pr-none { color: var(--accent); }
/* 받기·보내기 */
.pr-acts { margin-top: auto; padding-top: 28px; display: flex; flex-direction: column; gap: 10px; }
.pr-acts .btn-s { min-height: 54px; font-size: 15px; }
.pr-more { display: flex; justify-content: center; flex-wrap: wrap; gap: 0 22px; }
.pr-more .tlink { padding: 0 4px; font-size: 14px; }
.pr-more .tlink:disabled, .pr-acts .btn[aria-busy="true"] { cursor: progress; }
.pr-more .tlink:disabled { opacity: .4; }
/* 이름 고치기 (아래 창) */
.pr-field { display: block; margin: 0 0 18px; }
.pr-field > span { display: block; font-size: 15px; font-weight: 500; }
.pr-field small { display: block; margin-top: 2px; font-size: 13px; font-weight: 400; color: var(--sub); }
.pr-field input { display: block; width: 100%; min-height: 50px; margin-top: 8px; padding: 0 12px; border: 1px solid var(--line); border-radius: 2px; background: var(--sheet); color: var(--ink); font: inherit; font-size: 17px; -webkit-appearance: none; appearance: none; }
.pr-field input:focus { outline: none; border-color: var(--ink); }
/* 크게 보기: 화면 가득 (두 손가락으로 키우기 · 두 번 톡) */
.pr-viewer { position: fixed; inset: 0; z-index: 45; display: flex; flex-direction: column; background: #2B2723; color: var(--sheet); }
.pr-vbar { flex: none; display: flex; align-items: center; gap: 8px; padding: calc(8px + env(safe-area-inset-top)) 12px 8px 20px; font-size: 14px; touch-action: none; }
.pr-vbar span { flex: 1; font-variant-numeric: tabular-nums; }
.pr-vbar button { min-height: 44px; padding: 0 14px; border: 1px solid rgba(251, 248, 243, .35); border-radius: 2px; background: none; color: inherit; font-size: 14px; cursor: pointer; }
.pr-vbody { --z: 1; flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; padding: 0 10px calc(24px + env(safe-area-inset-bottom)); touch-action: pan-x pan-y; }
.pr-vbody canvas { display: block; width: calc(var(--z) * min(100%, 820px)); max-width: none; height: auto; margin: 0 auto calc(var(--z) * 14px); background: #fff; }
/* 바로 인쇄: 인쇄하는 동안만 종이 그림만 남긴다 */
.pr-print { display: none; }
@media print {
    body.pr-printing { background: #fff; }
    body.pr-printing > :not(.pr-print) { display: none !important; }
    body.pr-printing > .pr-print { display: block; }
    .pr-print img { display: block; width: 210mm; height: 297mm; break-after: page; page-break-after: always; }
    .pr-print img:last-child { break-after: auto; page-break-after: auto; }
}
@media (prefers-reduced-motion: reduce) { .pr-wait::after { animation: none; transform: none; } }
`);

// ────────────────────────────────────────────────────────────
// 🖨 인쇄 엔진 (v1 그대로): 화면 캡처 대신 쪽을 캔버스에 직접 그려 그림으로 넣는다
//    jsPDF 기본 글꼴엔 한글이 없어서 제목·범례까지 전부 캔버스 글씨로 그린다
//    사진 위엔 노란 쪽지, 아래엔 가나다순 "물건 찾아보기"(물건 → 칸 번호)
// ────────────────────────────────────────────────────────────
const PRINT_APP_NAME = '오브젯도';
function prRoundRect(ctx, x, y, w, h, r) { // v1 drawSafeRoundRect와 같다 (roundRect가 없는 옛 브라우저는 직접)
    if (typeof ctx.roundRect === 'function') { ctx.roundRect(x, y, w, h, r); } else {
        ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    }
}
const PRINT = { pageWmm: 210, pageHmm: 297, marginMm: 14, pxPerMm: 8, ink: '#1a1a18', sub: '#6b6960', line: '#e0dbd0' };
function printPx(mm) { return Math.round(mm * PRINT.pxPerMm); }
// 매장 이름 (선택): 인쇄물 머리글 날짜 옆·아래 오른쪽, PDF·백업 파일 이름에 들어간다. 지점이 여러 곳이면 종이·파일을 구분하기 쉽게
function storeName() { try { return (localStorage.getItem('storeName') || '').trim().slice(0, 20); } catch (e) { return ''; } }
function setStoreName(v) {
    try { localStorage.setItem('storeName', String(v || '').slice(0, 20)); } catch (e) {}
}
// 정리 업체 이름 (선택): 정리수납 전문가가 고객 집을 정리하고 지도를 넘겨줄 때, 종이·백업 PDF 아래에 "정리 · 이름"으로 남는다
//   백업 파일에도 넣어서, 고객 폰에서 불러와 다시 뽑아도 그대로 남는다 (모든 데이터 지우기로는 지우지 않는다 — 업체 폰의 설정)
function organizerName() { try { return (localStorage.getItem('organizerName') || '').trim().slice(0, 30); } catch (e) { return ''; } }
function setOrganizerName(v) { try { localStorage.setItem('organizerName', String(v || '').slice(0, 30)); } catch (e) {} }
function printHeadDate(dateStr) { const n = storeName(); return n ? `${n} · ${dateStr}` : dateStr; }
function storeFileName() { return storeName().replace(/[\\/:*?"<>|\s.]+/g, ''); } // 파일 이름에 못 쓰는 글자·띄어쓰기 빼고
// 쪽 하나를 다 그린 캔버스 → PDF용 JPEG. 미리보기는 PRINT.raw로 캔버스를 그대로 받아 작게 줄여 쓴다 (큰 JPEG 만들기가 가장 느렸다)
function printOut(canvas) { return PRINT.raw ? canvas : canvas.toDataURL('image/jpeg', 0.92); }

// 캔버스 텍스트 줄바꿈: ctx.measureText로 폭을 재서 maxW 안에 들어오게 나눈다 (한글은 글자 단위로도 자를 수 있게)
function wrapCanvasText(ctx, text, maxW) {
    const words = text.split(/(\s+)/).filter(w => w !== ''); // 공백을 유지한 채 분리
    const lines = []; let line = '';
    const pushHard = (chunk) => { // 단어 하나가 그 자체로 maxW보다 길면 글자 단위로 강제 개행
        let cur = '';
        for (const ch of chunk) {
            if (cur && ctx.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch; } else cur += ch;
        }
        return cur;
    };
    for (const word of words) {
        const attempt = line + word;
        if (ctx.measureText(attempt).width <= maxW) { line = attempt; continue; }
        if (line) lines.push(line);
        line = ctx.measureText(word).width > maxW ? pushHard(word) : word;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [''];
}

// 인쇄 사진: 화면처럼 칸마다 노란 쪽지에 물건 이름 + 쪽지 구석에 작은 칸 번호 (장 앞에서 "여기 뭐 있지?"에 바로 답)
// 칸 높이에 다 들어가면 전부, 모자라면 글자를 조금 줄여 보고, 그래도 넘치면 앞에서부터 + "+N개 더" (빠진 물건은 아래 찾아보기에 다 있다)
function drawPrintBadge(ctx, cx, cy, r, text) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = PRINT.ink; ctx.fill(); ctx.lineWidth = printPx(0.35); ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.round(r * (text.length > 1 ? 1.0 : 1.2))}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, cx, cy + 1);
}
function layoutPrintNote(ctx, z, zw, zh, fsMm) {
    const fs = printPx(fsMm), lh = Math.round(fs * 1.3), padX = printPx(1.6), padY = printPx(1.1), inset = printPx(2.4);
    const maxW = zw - inset - printPx(1) - padX * 2, maxH = zh - inset - printPx(1) - padY * 2;
    ctx.font = `600 ${fs}px sans-serif`;
    const wrapName = (t) => wrapCanvasText(ctx, t, Math.max(fs, maxW));
    const names = z.items.map(it => it.name), n = names.length;
    const build = (k) => { // 앞에서 k개 + 나머지 개수
        const lines = []; names.slice(0, k).forEach(t => wrapName(t).forEach((l, i) => lines.push({ t: l, cont: i > 0 })));
        if (k < n) lines.push({ t: `+${n - k}개 더`, more: true });
        return lines;
    };
    for (let k = n; k >= 1; k--) { const lines = build(k); if (lines.length * lh <= maxH) return { fs, lh, padX, padY, inset, lines, fit: k === n }; }
    // 한 줄도 안 들어가는 낮은 칸: "첫 물건 +N" 한 줄을 말줄임
    let t = names[0]; const tail = n > 1 ? ` +${n - 1}` : '';
    while (t.length > 1 && ctx.measureText(t + '…' + tail).width > maxW) t = t.slice(0, -1);
    if (t !== names[0]) t += '…';
    return { fs, lh, padX, padY, inset, lines: [{ t: t + tail }], fit: false };
}
function drawPrintPhoto(ctx, data, x, y, w) {
    const scale = w / data.canvas.width, h = data.canvas.height * scale;
    ctx.save();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, h);
    if (data.img && data.img.src) { try { ctx.drawImage(data.img, x, y, w, h); } catch (e) {} }
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const ink = printOpts.ink; // 잉크 절약: 사진은 흑백으로 연하게, 쪽지·번호만 진하게 (흑백 프린터에서도 칸 번호가 또렷하게)
    if (ink) {
        ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.fillRect(x, y, w, h);
        ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(255,255,255,0.68)'; ctx.fillRect(x, y, w, h);
    }
    const badgeR = printPx(2.6);
    data.zones.forEach((z) => {
        const zx = x + z.x * scale, zy = y + z.y * scale, zw = z.w * scale, zh = z.h * scale;
        ctx.lineWidth = printPx(0.6); ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.strokeRect(zx, zy, zw, zh);
        ctx.lineWidth = printPx(0.25); ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.strokeRect(zx, zy, zw, zh);
    });
    data.zones.forEach((z, i) => {
        const zx = x + z.x * scale, zy = y + z.y * scale, zw = z.w * scale, zh = z.h * scale;
        const num = String(i + 1);
        if (!z.items.length) { drawPrintBadge(ctx, zx + badgeR + printPx(1.2), zy + badgeR + printPx(1.2), badgeR, num); return; } // 빈 칸: 번호만
        let L = layoutPrintNote(ctx, z, zw, zh, 3.8);
        if (!L.fit) { const s2 = layoutPrintNote(ctx, z, zw, zh, 3.1); if (s2.fit || s2.lines.length > L.lines.length) L = s2; }
        ctx.font = `600 ${L.fs}px sans-serif`;
        const textW = Math.max(...L.lines.map(l => ctx.measureText(l.t).width + (l.cont ? L.fs * 0.6 : 0)));
        const nw = Math.min(zw - L.inset - printPx(1), textW + L.padX * 2), nh = L.lines.length * L.lh + L.padY * 2;
        const nx = zx + L.inset, ny = zy + L.inset + (L.lines.length === 1 && nh > zh - L.inset ? (zh - nh) / 2 - L.inset : 0);
        ctx.save();
        if (ink) { // 잉크 절약: 흰 쪽지 + 검은 테두리 (그림자·노란 바탕 없이)
            ctx.fillStyle = '#fff'; ctx.beginPath(); prRoundRect(ctx, nx, ny, nw, nh, printPx(0.8)); ctx.fill();
            ctx.lineWidth = printPx(0.35); ctx.strokeStyle = PRINT.ink; ctx.stroke();
        } else {
            ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = printPx(1.2); ctx.shadowOffsetY = printPx(0.4);
            ctx.fillStyle = '#fff3a3'; ctx.beginPath(); prRoundRect(ctx, nx, ny, nw, nh, printPx(0.8)); ctx.fill();
        }
        ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.rect(nx, ny, nw, nh); ctx.clip();
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        L.lines.forEach((l, li) => {
            ctx.font = `${l.more ? 500 : 600} ${L.fs}px sans-serif`; ctx.fillStyle = l.more ? (ink ? PRINT.sub : '#7a6a1e') : (ink ? PRINT.ink : '#2b2716');
            ctx.fillText(l.t, nx + L.padX + (l.cont ? L.fs * 0.6 : 0), ny + L.padY + L.lh * (li + 0.5) + 1);
        });
        ctx.restore();
        drawPrintBadge(ctx, Math.max(x + badgeR, nx - printPx(0.6)), Math.max(y + badgeR, ny - printPx(0.6)), badgeR, num);
    });
    ctx.restore();
    return h;
}

// 종이에는 검색이 없으니 책 뒤의 찾아보기처럼: 모든 물건을 가나다순으로, 오른쪽에 칸 번호 (세부 위치 메모는 아래 작게)
const PRINT_CHO = ['ㄱ', 'ㄱ', 'ㄴ', 'ㄷ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅂ', 'ㅅ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
function indexInitial(name) {
    const c = name.trim().charCodeAt(0) - 0xAC00;
    if (c >= 0 && c < 11172) return PRINT_CHO[Math.floor(c / 588)];
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
    return [...map.entries()].map(([name, at]) => ({ name, at: at.sort((a, b) => a.num - b.num) }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

// 한 사진의 인쇄 페이지들: 첫 쪽에 제목·쪽지 사진, 그 아래(넘치면 다음 쪽)에 2단 "물건 찾아보기"
// 실제로 그리기 전에 각 줄의 높이를 먼저 재야 하므로, 측정 전용 캔버스를 하나 만들어 폰트를 맞춰 잰다.
// 사진 기호: 사진이 여러 장이면 A·B·C…로 불러 전체 찾아보기에서 "A-2"(A 사진의 2번 칸)로 가리킨다
function photoLetter(i) { return i < 26 ? String.fromCharCode(65 + i) : `P${i + 1}`; }
function buildPrintPages(data, index, dateStr, letter) {
    const pageW = printPx(PRINT.pageWmm), pageH = printPx(PRINT.pageHmm), margin = printPx(PRINT.marginMm);
    const contentW = pageW - margin * 2, colGap = printPx(8), colW = (contentW - colGap) / 2;
    const meas = document.createElement('canvas').getContext('2d');

    const titleFont = `bold ${printPx(7)}px sans-serif`, dateFont = `${printPx(3.6)}px sans-serif`, footFont = `${printPx(3.2)}px sans-serif`;
    const secFont = `bold ${printPx(4.4)}px sans-serif`, initFont = `bold ${printPx(3.4)}px sans-serif`;
    const nameFont = `600 ${printPx(4.2)}px sans-serif`, memoFont = `${printPx(3.2)}px sans-serif`;
    const nameLineH = printPx(5.6), memoLineH = printPx(4.2), rowGap = printPx(1.2), badgeR = printPx(2.5);
    const headH = printPx(12) + printPx(7), footH = printPx(10), secH = printPx(9);

    // 사진 배치: 종이 폭에 맞춘 사진이 쓸 수 있는 높이의 60%를 넘으면 (세로·정사각 사진) 목록이 2쪽으로 밀려나므로
    //  · 세로 사진: 사진 왼쪽(폭 60%) + 목록 오른쪽 한 단 → 한 장에 들어가게
    //  · 정사각에 가까운 사진: 사진 높이를 60%로 줄여 가운데, 아래에 2단 목록
    const usableH = pageH - margin * 2 - headH - footH;
    const ratio = data.canvas ? data.canvas.height / data.canvas.width : 0;
    let layout = 'stack', photoW = contentW, photoH = contentW * ratio, photoX = margin;
    if (data.canvas && photoH > usableH * 0.6) {
        if (ratio >= 1.15) { layout = 'side'; photoW = contentW * 0.6; photoH = photoW * ratio; if (photoH > usableH) { photoH = usableH; photoW = photoH / ratio; } }
        else { photoH = usableH * 0.6; photoW = photoH / ratio; photoX = margin + (contentW - photoW) / 2; }
    }
    const sideX = margin + photoW + colGap, sideW = contentW - photoW - colGap;
    const rowW = layout === 'side' ? Math.min(sideW, colW) : colW; // 줄 바꿈은 가장 좁은 단 기준으로 (다음 쪽 2단에서도 그대로 쓴다)
    // 찾아보기 줄: 왼쪽 여백에 첫소리(ㄱ·ㄴ…, 바뀔 때만), 물건 이름 ······ 칸 번호들, 메모가 있으면 아래 줄
    // (첫소리를 따로 한 줄씩 두면 자리를 많이 먹어 한두 줄만 다음 쪽으로 넘어갔다)
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

    // 쪽 나누기: 첫 쪽은 사진 아래부터, 왼쪽 단을 채운 뒤 오른쪽 단, 그래도 넘치면 다음 쪽 (머리글이 단 맨 끝에 혼자 남지 않게)
    const pages = [];
    let page = { photo: true, cols: [[], []] }, col = 0;
    const sideNow = () => page.photo && layout === 'side'; // 사진 옆 한 단만 쓰는 쪽
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
        ctx.strokeStyle = PRINT.ink; ctx.lineWidth = printPx(0.6); ctx.beginPath();
        ctx.moveTo(margin, cy); ctx.lineTo(pageW - margin, cy); ctx.stroke();
        cy += printPx(7);

        const side = pg.photo && layout === 'side' && data.canvas;
        if (pg.photo && data.canvas) { drawPrintPhoto(ctx, data, photoX, cy, photoW); if (!side) cy += photoH + printPx(8); }
        const listX = side ? sideX : margin;

        // 찾아보기 제목 (사진 옆 좁은 단이면 설명을 짧게)
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
                // 단이 바뀌어 같은 첫소리가 이어지면 단 맨 위에 첫소리를 한 번 더 적는다
                const ini = row.init || (ry === cy ? indexInitial(row.e.name) : null);
                if (ini) {
                    if (row.init && ry > cy) { ry += groupGap; ctx.strokeStyle = PRINT.line; ctx.lineWidth = printPx(0.25); ctx.beginPath(); ctx.moveTo(x0, ry - groupGap / 2); ctx.lineTo(x0 + cw, ry - groupGap / 2); ctx.stroke(); }
                    ctx.font = initFont; ctx.fillStyle = '#a08a2a'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
                    ctx.fillText(ini, x0, ry + nameLineH - printPx(1.6));
                }
                const nx0 = x0 + gutter;
                // 물건 이름 ······ ② ⑤
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
                let my = ry + row.nameLines.length * nameLineH;
                ctx.font = memoFont; ctx.fillStyle = PRINT.sub; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
                row.memos.forEach((m, mi) => ctx.fillText(m, nx0 + printPx(3), my + memoLineH * (mi + 1) - printPx(1.1)));
                ry = rowTop + row.h - (row.init && rowTop === cy && rows.indexOf(row) > 0 ? groupGap : 0);
            });
        });

        // 아래 안내: 종이는 바뀌면 낡으니, 고치고 다시 뽑는 습관을 알려준다
        drawPrintFoot(ctx, `${dateStr} · 위치가 바뀌면 앱에서 고치고 다시 뽑아 붙이세요`);

        return printOut(canvas);
    });
}

// 전체 찾아보기: 사진 여러 장(선반·창고 여러 곳)의 물건을 한데 모아 가나다순으로. 창고 입구에 이 한 장만 붙여도 된다.
// 오른쪽 "A-2" = A 사진의 2번 칸. 위쪽에 사진 기호 목록(A = 창고 박스 선반 …)
function drawPrintTag(ctx, xRight, cy, text) { // 오른쪽 끝을 xRight에 맞춘 어두운 꼬리표, 왼쪽 끝 x를 돌려준다
    ctx.font = `bold ${printPx(3.2)}px sans-serif`;
    const w = ctx.measureText(text).width + printPx(3.2), h = printPx(5.2), x = xRight - w;
    ctx.fillStyle = PRINT.ink; ctx.beginPath(); prRoundRect(ctx, x, cy - h / 2, w, h, h / 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + w / 2, cy + 1);
    return x;
}
function buildMasterIndexPages(photos, dateStr) {
    const pageW = printPx(PRINT.pageWmm), pageH = printPx(PRINT.pageHmm), margin = printPx(PRINT.marginMm);
    const contentW = pageW - margin * 2, colGap = printPx(8), colW = (contentW - colGap) / 2;
    const meas = document.createElement('canvas').getContext('2d');
    const titleFont = `bold ${printPx(7)}px sans-serif`, dateFont = `${printPx(3.6)}px sans-serif`, footFont = `${printPx(3.2)}px sans-serif`;
    const legendFont = `${printPx(3.6)}px sans-serif`, initFont = `bold ${printPx(3.4)}px sans-serif`;
    const nameFont = `600 ${printPx(4.2)}px sans-serif`, memoFont = `${printPx(3.2)}px sans-serif`;
    const nameLineH = printPx(5.6), memoLineH = printPx(4.2), rowGap = printPx(1.2), gutter = printPx(6), groupGap = printPx(2.2);
    const headH = printPx(12) + printPx(6), footH = printPx(10);

    // 사진 기호 목록 줄 나누기
    meas.font = legendFont;
    const legendItems = photos.map((d, i) => `${photoLetter(i)}  ${d.title || `#${i + 1}`}`);
    const legendLines = []; let line = [], lw = 0;
    legendItems.forEach(t => { const w = meas.measureText(t).width + printPx(9); if (line.length && lw + w > contentW) { legendLines.push(line); line = []; lw = 0; } line.push(t); lw += w; });
    if (line.length) legendLines.push(line);
    const legendH = legendLines.length * printPx(6.4) + printPx(5);

    // 물건 → 자리들
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
                    ctx.fillStyle = PRINT.ink; ctx.beginPath(); prRoundRect(ctx, x, ly - printPx(2.7), bw, printPx(5.4), printPx(1)); ctx.fill();
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
        drawPrintFoot(ctx, `${dateStr} · ${isHome() ? '방 입구' : '창고 입구'}에 붙여 두세요 · 위치가 바뀌면 앱에서 고치고 다시 뽑기`);
        return printOut(canvas);
    });
}

// ────────────────────────────────────────────────────────────
// 🖨 인쇄 양식 (지도형 말고): 칸 라벨 · 큰 글씨 목록 · 점검표. 모두 흑백 프린터에서도 읽히게 검정/회색만 쓴다.
// photos: 인쇄할 사진들(한 장이면 칸 번호만, 여러 장이면 "A-3"처럼 사진 기호를 붙인다)
// ────────────────────────────────────────────────────────────
function printPageCanvas() {
    const c = document.createElement('canvas'); c.width = printPx(PRINT.pageWmm); c.height = printPx(PRINT.pageHmm);
    const ctx = c.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
    return { c, ctx };
}
// 머리글(제목 · 오른쪽 날짜 · 굵은 선)을 그리고 본문이 시작할 y를 돌려준다
function drawPrintHead(ctx, title, dateStr, sub) {
    const pageW = printPx(PRINT.pageWmm), m = printPx(PRINT.marginMm);
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.fillStyle = PRINT.ink; ctx.font = `bold ${printPx(7)}px sans-serif`;
    ctx.fillText(title, m, m + printPx(7));
    ctx.textAlign = 'right'; ctx.fillStyle = PRINT.sub; ctx.font = `${printPx(3.6)}px sans-serif`; ctx.fillText(printHeadDate(dateStr), pageW - m, m + printPx(7));
    let y = m + printPx(12);
    ctx.strokeStyle = PRINT.ink; ctx.lineWidth = printPx(0.6); ctx.beginPath(); ctx.moveTo(m, y); ctx.lineTo(pageW - m, y); ctx.stroke();
    y += printPx(5);
    if (sub) { ctx.textAlign = 'left'; ctx.fillStyle = PRINT.sub; ctx.font = `${printPx(3.6)}px sans-serif`; ctx.fillText(sub, m, y + printPx(3.6)); y += printPx(7); }
    return y;
}
// 아래 안내 줄: 왼쪽 안내 글 + 오른쪽 아래 구석에 작은 QR과 "이 종이를 만든 앱" (늘 넣는다 — 빼 달라는 매장이 생기면 그때 옵션을 둔다)
//   매장 이름은 맨 위 날짜 옆에 있으니, 여기에는 앱 이름을 둔다
function drawPrintFoot(ctx, text) {
    const pageW = printPx(PRINT.pageWmm), pageH = printPx(PRINT.pageHmm), m = printPx(PRINT.marginMm), base = pageH - m - printPx(1);
    const right = drawPrintQr(ctx) - printPx(3);
    ctx.strokeStyle = PRINT.line; ctx.lineWidth = printPx(0.3); ctx.beginPath(); ctx.moveTo(m, pageH - m - printPx(7)); ctx.lineTo(right, pageH - m - printPx(7)); ctx.stroke();
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'right';
    ctx.font = `bold ${printPx(3.2)}px sans-serif`; ctx.fillStyle = PRINT.ink; ctx.fillText(PRINT_APP_NAME, right, base); const brandW = ctx.measureText(PRINT_APP_NAME).width;
    ctx.font = `${printPx(2.6)}px sans-serif`; ctx.fillStyle = PRINT.sub; ctx.fillText('이 종이를 만든 앱 · QR로 열기', right, base + printPx(4.5));
    const leftW = Math.max(printPx(40), right - m - brandW - printPx(4)); // 길면 살짝 좁혀서 겹치지 않게
    const org = organizerName(); ctx.textAlign = 'left';
    if (org) { // 정리 업체가 있으면 오른쪽(앱 이름 + 작은 안내)과 같은 두 줄 모양: 위 "정리 · 업체", 아래 작은 안내
        ctx.font = `bold ${printPx(3.2)}px sans-serif`; ctx.fillStyle = PRINT.ink; ctx.fillText(`정리 · ${org}`, m, base, leftW);
        ctx.font = `${printPx(2.6)}px sans-serif`; ctx.fillStyle = PRINT.sub; ctx.fillText(text, m, base + printPx(4.5), leftW);
        return;
    }
    ctx.font = `${printPx(3.2)}px sans-serif`; ctx.fillStyle = PRINT.sub;
    ctx.fillText(text, m, base, leftW);
}
// 📱 인쇄물 QR: 찍으면 qr/ 페이지 → 바로 앱 첫 화면 (방문자 통계에서 /objetdo/qr/ 방문 수 = 인쇄물로 들어온 사람)
//   이 매장 지도가 열리는 게 아니라 "이 종이를 만든 앱"이 열린다 (지도는 사장님 폰에만 있음)
//   무늬는 미리 만들어 넣었다(인터넷 없이도 인쇄되게): 주소를 바꾸면 python3 tools/make_print_qr.py 새주소 → 아래 두 줄 교체
//   주소가 짧을수록 칸 수가 줄어 같은 크기에서 더 잘 찍힌다 (지금 33×33칸 · objetdo 주소)
const PRINT_QR_URL = 'https://johnsongarage.github.io/objetdo/qr/';
const PRINT_QR = ["1fc39e27f", "1046e9441", "175f9d35d", "175651d5d", "1752ac15d", "105239541", "1fd55557f", "001064d00", "17c4e847c", "16a507a6d", "017f259d6", "0c9843edf", "147524b3b", "172071547", "02c7ca4e2", "130993acc", "14480a7b1", "10b79f26d", "14dcf95f6", "0d3afc1ff", "0c6eb1fbb", "19ac2cbc1", "147a75562", "12be20f4f", "11f8385f1", "001b13915", "1fcc24b54", "105422f1f", "1750849fb", "1755b1e9d", "175ec2a6c", "104057e1c", "1fdc4b7aa"];
let printQrBits = null;
function drawPrintQr(ctx) { // 오른쪽 아래 구석에 그리고 QR 왼쪽 끝 x를 돌려준다
    if (!printQrBits) printQrBits = PRINT_QR.map(h => h.split('').map(c => parseInt(c, 16).toString(2).padStart(4, '0')).join('').slice(-PRINT_QR.length));
    const n = printQrBits.length, cell = Math.max(1, Math.round(0.6 * PRINT.pxPerMm)), size = n * cell; // 한 칸 약 0.6mm → 약 18mm
    // 본문은 바닥에서 23mm 위(pageH - 여백 - 9mm)에서 끝나므로, 바닥에서 4.5mm 띄우면 본문과 겹치지 않는다
    const x0 = printPx(PRINT.pageWmm) - printPx(PRINT.marginMm) - size, y0 = printPx(PRINT.pageHmm) - printPx(4.5) - size;
    ctx.fillStyle = '#000000'; // 잉크 절약일 때도 QR은 진하게
    printQrBits.forEach((row, r) => { for (let c = 0; c < n; c++) if (row[c] === '1') ctx.fillRect(x0 + c * cell, y0 + r * cell, cell, cell); });
    return x0;
}
// 사진 순서대로 모든 칸: { code: "3" 또는 "A-3", photo, zone, num }
function printZoneList(photos) {
    const multi = photos.length > 1, out = [];
    photos.forEach((d, pi) => d.zones.forEach((z, zi) => out.push({ code: multi ? `${photoLetter(pi)}-${zi + 1}` : String(zi + 1), photo: d, zone: z, num: zi + 1 })));
    return out;
}
// 둥근 꼬리표 모양의 칸 번호 (A-3처럼 길어도 들어가게)
function drawPrintCode(ctx, x, cy, h, text) {
    ctx.font = `bold ${Math.round(h * 0.62)}px sans-serif`;
    const w = Math.max(h, ctx.measureText(text).width + h * 0.6);
    ctx.fillStyle = PRINT.ink; ctx.beginPath(); prRoundRect(ctx, x, cy - h / 2, w, h, h / 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + w / 2, cy + 1);
    return w;
}

// ② 칸 라벨: 칸마다 잘라 붙이는 라벨. size: S(3×4=12개) · M(2×3=6개) · L(2×2=4개)
function buildLabelPages(photos, dateStr, size = 'M') {
    const pageW = printPx(PRINT.pageWmm), pageH = printPx(PRINT.pageHmm), m = printPx(PRINT.marginMm);
    const grid = { S: [3, 4], M: [2, 3], L: [2, 2] }[size] || [2, 3], [cols, rows] = grid, per = cols * rows;
    const k = { S: 0.75, M: 1, L: 1.25 }[size] || 1;
    const labels = printZoneList(photos), pages = [];
    const top0 = m + printPx(12) + printPx(5) + printPx(7), bottom = pageH - m - printPx(14); // v2: 맨 아래 라벨 줄이 오른쪽 아래 QR에 닿지 않게 (v1은 9mm라 자르는 점선이 QR 위를 지났다)
    const cw = (pageW - m * 2) / cols, ch = (bottom - top0) / rows, pad = printPx(4 * k);
    for (let start = 0; start < Math.max(labels.length, 1); start += per) {
        const { c, ctx } = printPageCanvas();
        drawPrintHead(ctx, '칸 라벨' + (labels.length > per ? ` (${start / per + 1}/${Math.ceil(labels.length / per)})` : ''), dateStr, '점선을 따라 잘라 칸이나 상자 앞에 붙이세요 · 번호는 지도·찾아보기와 같아요');
        // 자르는 선 (점선)
        ctx.save(); ctx.strokeStyle = '#b9b4aa'; ctx.lineWidth = printPx(0.3); ctx.setLineDash([printPx(1.2), printPx(1.2)]);
        for (let i = 0; i <= cols; i++) { const x = m + i * cw; ctx.beginPath(); ctx.moveTo(x, top0); ctx.lineTo(x, bottom); ctx.stroke(); }
        for (let j = 0; j <= rows; j++) { const y = top0 + j * ch; ctx.beginPath(); ctx.moveTo(m, y); ctx.lineTo(pageW - m, y); ctx.stroke(); }
        ctx.restore();
        labels.slice(start, start + per).forEach((L, i) => {
            const x = m + (i % cols) * cw + pad, y = top0 + Math.floor(i / cols) * ch + pad, w = cw - pad * 2, h = ch - pad * 2;
            // 위: 칸 번호 + 구역 이름
            const codeH = printPx(11 * k);
            const codeW = drawPrintCode(ctx, x, y + codeH / 2, codeH, L.code);
            ctx.font = `bold ${printPx(6 * k)}px sans-serif`; ctx.fillStyle = PRINT.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            const nameLines = wrapCanvasText(ctx, L.zone.name || '이름 없는 구역', w - codeW - printPx(3)).slice(0, 2);
            nameLines.forEach((t, li) => ctx.fillText(t, x + codeW + printPx(3), y + codeH / 2 + (li - (nameLines.length - 1) / 2) * printPx(6.6 * k)));
            let iy = y + codeH + printPx(4 * k);
            ctx.strokeStyle = PRINT.ink; ctx.lineWidth = printPx(0.4); ctx.beginPath(); ctx.moveTo(x, iy - printPx(2 * k)); ctx.lineTo(x + w, iy - printPx(2 * k)); ctx.stroke();
            // 물건: 들어갈 때까지 글자를 줄여 보고, 그래도 넘치면 "+N개 더"
            const footH = printPx(5 * k), avail = y + h - footH - iy, names = L.zone.items.map(it => it.name);
            let fs = printPx(9.5 * k), lines = []; // 멀리서도 읽히게 크게 시작해서, 넘치면 줄인다
            const layout = () => { ctx.font = `600 ${fs}px sans-serif`; lines = names.flatMap(n => wrapCanvasText(ctx, '· ' + n, w).map((t, ti) => ti ? '  ' + t : t)); };
            layout();
            while (lines.length * fs * 1.35 > avail && fs > printPx(3.6 * k)) { fs -= printPx(0.4); layout(); }
            const maxLines = Math.max(1, Math.floor(avail / (fs * 1.35)));
            if (lines.length > maxLines) { const more = names.length - lines.slice(0, maxLines - 1).filter(t => t.startsWith('·')).length; lines = lines.slice(0, maxLines - 1).concat(`+ ${more}개 더 (찾아보기 참고)`); }
            ctx.textBaseline = 'top'; ctx.fillStyle = PRINT.ink;
            if (!names.length) { ctx.font = `${printPx(4.4 * k)}px sans-serif`; ctx.fillStyle = PRINT.sub; ctx.fillText('(비어 있음)', x, iy); }
            lines.forEach((t, li) => { ctx.font = `${t.startsWith('+') ? 500 : 600} ${fs}px sans-serif`; ctx.fillStyle = t.startsWith('+') ? PRINT.sub : PRINT.ink; ctx.fillText(t, x, iy + li * fs * 1.35); });
            // 아래: 사진 이름 · 날짜
            ctx.font = `${printPx(3.2 * Math.max(0.9, k))}px sans-serif`; ctx.fillStyle = PRINT.sub; ctx.textBaseline = 'alphabetic';
            ctx.fillText(`${L.photo.title || ''} · ${dateStr.replace(' 기준', '')}`, x, y + h);
        });
        if (!labels.length) { ctx.font = `${printPx(5)}px sans-serif`; ctx.fillStyle = PRINT.sub; ctx.textAlign = 'left'; ctx.fillText('아직 만든 구역이 없어요', m, top0 + printPx(10)); }
        drawPrintFoot(ctx, `${dateStr} · 칸이 바뀌면 앱에서 고치고 다시 뽑아 붙이세요`);
        pages.push(printOut(c));
    }
    return pages;
}

// ③ 큰 글씨 목록: 사진 없이 "물건 | 위치 | 메모" 표. 먼 거리·흑백 프린터·어르신용. sort: 'name'(가나다) · 'zone'(칸 순서)
function buildBigListPages(photos, dateStr, { sort = 'name', scale = 1, memo = true } = {}) {
    const pageW = printPx(PRINT.pageWmm), pageH = printPx(PRINT.pageHmm), m = printPx(PRINT.marginMm), multi = photos.length > 1;
    const rows = [];
    printZoneList(photos).forEach(L => L.zone.items.forEach(it => rows.push({ name: it.name.trim(), memo: (it.comment || '').trim(), L })));
    if (sort === 'name') rows.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    const nameFs = printPx(6 * scale), locFs = printPx(4.6 * scale), memoFs = printPx(3.8 * scale);
    const gutter = sort === 'name' ? printPx(7 * scale) : 0; // 첫소리 자리
    const colName = (pageW - m * 2) * 0.46, colLoc = (pageW - m * 2) * (memo ? 0.30 : 0.54), colMemo = (pageW - m * 2) - colName - colLoc;
    const meas = document.createElement('canvas').getContext('2d');
    rows.forEach(r => {
        meas.font = `bold ${nameFs}px sans-serif`; r.nameLines = wrapCanvasText(meas, r.name, colName - printPx(4) - gutter);
        meas.font = `${locFs}px sans-serif`; r.locLines = wrapCanvasText(meas, r.L.zone.name || '', colLoc - printPx(4) - locFs * 3); // 사진 이름은 맨 위 기호 안내(A = …)로
        meas.font = `${memoFs}px sans-serif`; r.memoLines = memo && r.memo ? wrapCanvasText(meas, r.memo, colMemo - printPx(3)) : [];
        r.h = Math.max(r.nameLines.length * nameFs * 1.3, r.locLines.length * locFs * 1.35, r.memoLines.length * memoFs * 1.35) + printPx(4.5);
    });
    const pages = [], headH = printPx(9 * Math.max(1, scale * 0.9)), limit = pageH - m - printPx(9);
    let i = 0, lastInit = null;
    do {
        const { c, ctx } = printPageCanvas();
        let y = drawPrintHead(ctx, '물건 위치 목록 (큰 글씨)' + (pages.length ? ` · ${pages.length + 1}쪽` : ''), dateStr, sort === 'name' ? '가나다순 · 번호는 사진 지도의 칸 번호' : '칸 순서대로 · 번호는 사진 지도의 칸 번호');
        if (multi && !pages.length) { // 첫 쪽에만: 사진 기호 안내 (A = 창고 박스 선반 · B = …)
            ctx.font = `${printPx(3.6)}px sans-serif`; ctx.fillStyle = PRINT.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
            const legend = []; // 항목(A = …) 중간에서 줄이 끊기지 않게 항목 단위로 채운다
            photos.map((d, pi) => `${photoLetter(pi)} = ${d.title || `#${pi + 1}`}`).forEach(t => { const last = legend.length - 1; if (last >= 0 && ctx.measureText(legend[last] + '   ' + t).width <= pageW - m * 2) legend[last] += '   ' + t; else legend.push(t); });
            legend.forEach((t, li) => ctx.fillText(t, m, y + printPx(1) + li * printPx(5)));
            y += legend.length * printPx(5) + printPx(2);
        }
        // 표 머리
        ctx.fillStyle = '#efece6'; ctx.fillRect(m, y, pageW - m * 2, headH);
        ctx.fillStyle = PRINT.ink; ctx.font = `bold ${printPx(4 * Math.max(1, scale * 0.9))}px sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('물건', m + printPx(2) + gutter, y + headH / 2); ctx.fillText('위치', m + colName + printPx(2), y + headH / 2); if (memo) ctx.fillText('메모', m + colName + colLoc + printPx(2), y + headH / 2);
        y += headH;
        let lastCode = null;
        // 가나다순이면 물건 이름 왼쪽 여백에 첫소리(ㄱ·ㄴ…)를 바뀔 때마다 적는다 (띠를 따로 두면 줄이 늘어 쪽이 넘어갔다)
        let pageStart = true;
        while (i < rows.length) {
            const r = rows[i];
            if (y + r.h > limit && !pageStart) break; // 쪽 맨 위 줄은 넘쳐도 그린다 (아주 긴 줄 하나로 멈추지 않게)
            if (sort === 'name') {
                const ini = indexInitial(r.name), changed = ini !== lastInit;
                if (changed || pageStart) {
                    if (changed && !pageStart) { ctx.strokeStyle = PRINT.ink; ctx.lineWidth = printPx(0.4); ctx.beginPath(); ctx.moveTo(m, y); ctx.lineTo(pageW - m, y); ctx.stroke(); }
                    ctx.font = `bold ${Math.round(nameFs * 0.72)}px sans-serif`; ctx.fillStyle = '#a08a2a'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
                    ctx.fillText(ini, m + printPx(1), y + printPx(2.2) + nameFs * 0.12);
                    lastInit = ini;
                }
            }
            pageStart = false;
            const ry = y + printPx(2.2);
            if (sort === 'zone' && lastCode !== null && lastCode !== r.L.code) { ctx.strokeStyle = PRINT.ink; ctx.lineWidth = printPx(0.4); ctx.beginPath(); ctx.moveTo(m, y); ctx.lineTo(pageW - m, y); ctx.stroke(); }
            lastCode = r.L.code;
            ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = PRINT.ink;
            ctx.font = `bold ${nameFs}px sans-serif`; r.nameLines.forEach((t, li) => ctx.fillText(t, m + printPx(2) + gutter, ry + li * nameFs * 1.3));
            const codeH = locFs * 1.5, codeW = drawPrintCode(ctx, m + colName + printPx(2), ry + codeH / 2, codeH, r.L.code);
            ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = PRINT.ink; ctx.font = `${locFs}px sans-serif`;
            r.locLines.forEach((t, li) => ctx.fillText(t, m + colName + printPx(2) + codeW + printPx(2), ry + (codeH - locFs) / 2 + li * locFs * 1.35));
            ctx.fillStyle = PRINT.sub; ctx.font = `${memoFs}px sans-serif`;
            r.memoLines.forEach((t, li) => ctx.fillText(t, m + colName + colLoc + printPx(2), ry + li * memoFs * 1.35 + printPx(0.6)));
            y += r.h;
            ctx.strokeStyle = PRINT.line; ctx.lineWidth = printPx(0.3); ctx.beginPath(); ctx.moveTo(m, y); ctx.lineTo(pageW - m, y); ctx.stroke();
            i++;
        }
        if (!rows.length) { ctx.font = `${printPx(5)}px sans-serif`; ctx.fillStyle = PRINT.sub; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('아직 적은 물건이 없어요', m, y + printPx(4)); }
        drawPrintFoot(ctx, `${dateStr} · 위치가 바뀌면 앱에서 고치고 다시 뽑아 붙이세요`);
        pages.push(printOut(c));
    } while (i < rows.length);
    return pages.length > 1 ? pages : pages;
}

// ④ 점검표: 칸 순서대로 걸으며 있음/없음에 체크. 점검일·점검자를 적는 칸, 메모는 빈 줄
function buildCheckPages(photos, dateStr) {
    const pageW = printPx(PRINT.pageWmm), pageH = printPx(PRINT.pageHmm), m = printPx(PRINT.marginMm), multi = photos.length > 1;
    const rows = [];
    printZoneList(photos).forEach(L => L.zone.items.forEach((it, ii) => rows.push({ name: it.name.trim(), L, first: ii === 0 })));
    const W = pageW - m * 2, cLoc = W * 0.30, cName = W * 0.34, cBox = W * 0.09, cMemo = W - cLoc - cName - cBox * 2;
    const rowH = printPx(9), headH = printPx(8), limit = pageH - m - printPx(9), pages = [];
    const box = (ctx, cx, cy) => { const s = printPx(4.2); ctx.strokeStyle = PRINT.ink; ctx.lineWidth = printPx(0.4); ctx.strokeRect(cx - s / 2, cy - s / 2, s, s); };
    let i = 0, pg = 0;
    do {
        const { c, ctx } = printPageCanvas(); pg++;
        let y = drawPrintHead(ctx, '위치 점검표', dateStr, null);
        // 점검일 · 점검자
        ctx.font = `${printPx(4.2)}px sans-serif`; ctx.fillStyle = PRINT.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('점검일', m, y + printPx(5)); ctx.fillText('점검자', m + W / 2, y + printPx(5));
        ctx.strokeStyle = PRINT.ink; ctx.lineWidth = printPx(0.3);
        [[m + printPx(14), m + W / 2 - printPx(6)], [m + W / 2 + printPx(14), m + W]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(a, y + printPx(6)); ctx.lineTo(b, y + printPx(6)); ctx.stroke(); });
        y += printPx(11);
        ctx.fillStyle = '#efece6'; ctx.fillRect(m, y, W, headH);
        ctx.fillStyle = PRINT.ink; ctx.font = `bold ${printPx(3.8)}px sans-serif`; ctx.textBaseline = 'middle';
        const xs = [m, m + cLoc, m + cLoc + cName, m + cLoc + cName + cBox, m + cLoc + cName + cBox * 2];
        ['위치', '물건'].forEach((t, k) => { ctx.textAlign = 'left'; ctx.fillText(t, xs[k] + printPx(2), y + headH / 2); });
        ['있음', '없음'].forEach((t, k) => { ctx.textAlign = 'center'; ctx.fillText(t, xs[2 + k] + cBox / 2, y + headH / 2); });
        ctx.textAlign = 'left'; ctx.fillText('메모 (옮긴 곳 등)', xs[4] + printPx(2), y + headH / 2);
        y += headH;
        let pageFirst = true;
        while (i < rows.length && y + rowH <= limit) {
            const r = rows[i], cy = y + rowH / 2;
            if (r.first || pageFirst) {
                if (!pageFirst) { ctx.strokeStyle = PRINT.ink; ctx.lineWidth = printPx(0.45); ctx.beginPath(); ctx.moveTo(m, y); ctx.lineTo(m + W, y); ctx.stroke(); }
                const codeH = printPx(5.6), codeW = drawPrintCode(ctx, m + printPx(2), cy, codeH, r.L.code);
                ctx.font = `600 ${printPx(3.8)}px sans-serif`; ctx.fillStyle = PRINT.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                const t = wrapCanvasText(ctx, (r.L.zone.name || '') + (multi ? ` · ${r.L.photo.title || ''}` : ''), cLoc - codeW - printPx(6))[0];
                ctx.fillText(t, m + printPx(2) + codeW + printPx(2), cy);
            }
            pageFirst = false;
            ctx.font = `600 ${printPx(4.4)}px sans-serif`; ctx.fillStyle = PRINT.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText(wrapCanvasText(ctx, r.name, cName - printPx(4))[0], xs[1] + printPx(2), cy);
            box(ctx, xs[2] + cBox / 2, cy); box(ctx, xs[3] + cBox / 2, cy);
            y += rowH;
            ctx.strokeStyle = PRINT.line; ctx.lineWidth = printPx(0.3); ctx.beginPath(); ctx.moveTo(m + cLoc, y); ctx.lineTo(m + W, y); ctx.stroke();
            i++;
        }
        if (!rows.length) { ctx.font = `${printPx(5)}px sans-serif`; ctx.fillStyle = PRINT.sub; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('아직 적은 물건이 없어요', m, y + printPx(4)); }
        drawPrintFoot(ctx, `${dateStr} · 점검 후 앱에서 "찾으셨나요?"로 확인하거나 옮긴 곳을 고쳐 주세요`);
        pages.push(printOut(c));
    } while (i < rows.length);
    return pages;
}

// ────────────────────────────────────────────────────────────
// v1 imageList 대신 쓰는 사진 묶음: { id, title, zones, img(불러 둔 사진), canvas: { width: 800, height } }
//   칸 좌표가 가로 800 기준이라 v1은 사진을 가로 800 캔버스에 그렸다 → 그 캔버스 높이(정수로 잘림)까지 똑같이 맞춰야 같은 종이가 나온다
//   사진은 imgData에서 한 번만 불러 두고 쓴다 (사진이 바뀌면 다시)
// ────────────────────────────────────────────────────────────
const printImgs = new Map(); // 사진 id → { src, img, done, p }
function printLoadImg(p) {
    const k = String(p.id), have = printImgs.get(k);
    if (have && have.src === p.imgData) return have.p;
    const e = { src: p.imgData, img: null, done: false };
    e.p = new Promise(res => {
        const end = (img) => { e.img = img; e.done = true; res(img); };
        if (!p.imgData) { end(null); return; }
        const im = new Image(); im.onload = () => end(im); im.onerror = () => end(null); im.src = p.imgData;
    });
    printImgs.set(k, e);
    return e.p;
}
function printReady() { return Promise.all(vis().map(printLoadImg)); }
function printImgsReady() { return vis().every(p => { const e = printImgs.get(String(p.id)); return !!e && e.done && e.src === p.imgData; }); }
function printPhotos() {
    return vis().map(p => {
        const e = printImgs.get(String(p.id)), img = e && e.src === p.imgData ? e.img : null;
        return { id: p.id, title: p.title, zones: p.zones, img, canvas: { width: 800, height: img && img.width ? Math.trunc(img.height * (800 / img.width)) : 450 } };
    });
}

// ────────────────────────────────────────────────────────────
// 인쇄 양식·옵션 (v1과 같은 키 'printOpts' — 다음에 열어도, v1에서 열어도 같은 값)
//   label(칸 라벨 크기)만 v2에서 더했다. v1은 모르는 값이라 그냥 두고, 양식이 'label'이면 v1은 사진 지도로 연다
// ────────────────────────────────────────────────────────────
let printOpts = { form: 'map', sort: 'name', memo: true, size: 1, ink: false, label: 'M' }, printScope = 'photo', printPreviewId = null;
try { Object.assign(printOpts, JSON.parse(localStorage.getItem('printOpts') || '{}')); } catch (e) {}
if (![1, 1.35].includes(printOpts.size)) printOpts.size = 1;
if (!['S', 'M', 'L'].includes(printOpts.label)) printOpts.label = 'M';
const PRINT_FORMS = {
    map: { title: '사진 지도', btn: '사진 지도', sub: '칸 번호 붙은 사진 + 찾아보기 · 선반 옆에', file: '지도' },
    list: { title: '큰 글씨 목록', btn: '큰 글씨 목록', sub: '사진 없이 큰 표 · 흑백 프린터도 OK', file: '위치목록' },
    check: { title: '위치 점검표', btn: '점검표', sub: '칸 순서대로 있음·없음 체크', file: '점검표' },
    label: { title: '칸 라벨', btn: '칸 라벨', sub: '잘라서 칸·상자 앞에 붙이는 번호표', file: '칸라벨' }
};
function setPrintOpt(key, val) {
    printOpts[key] = val;
    try { localStorage.setItem('printOpts', JSON.stringify(printOpts)); } catch (e) {}
    renderPrintPreview();
}
// 지금 고른 양식·범위의 쪽들을 덩어리(사진 한 장 몫 등)로 나눠 만드는 함수 목록 (미리보기·PDF·그림·인쇄가 같은 것을 쓴다)
function printChunks() {
    const photos = printPhotos();
    const data = photos.find(d => String(d.id) === String(printPreviewId)) || photos[0], multi = photos.length > 1, i = photos.indexOf(data);
    const all = printScope === 'all' && multi, scope = all ? photos : [data], ds = printDateStr();
    if (printOpts.form === 'list') return [() => buildBigListPages(scope, ds, { sort: printOpts.sort, memo: printOpts.memo, scale: printOpts.size })];
    if (printOpts.form === 'check') return [() => buildCheckPages(scope, ds)];
    if (printOpts.form === 'label') return [() => buildLabelPages(scope, ds, printOpts.label)];
    if (!all) return [() => buildPrintPages(data, i, ds, multi ? photoLetter(i) : null)];
    // 전체: 맨 앞에 입구에 붙일 전체 찾아보기, 이어서 사진마다 지도
    return [() => buildMasterIndexPages(photos, ds), ...photos.map((d, pi) => () => buildPrintPages(d, pi, ds, photoLetter(pi)))];
}
function printYield() { return new Promise(r => setTimeout(r, 0)); }

// 내려받는 파일 이름용 날짜 (기기 시간 기준). 백업 파일 이름용: 2026-10-09_14시08분 (파일 이름엔 : 를 못 써서 시·분으로)
function fileDateTime() { const t = new Date(); return `${fileDate()}_${String(t.getHours()).padStart(2, '0')}시${String(t.getMinutes()).padStart(2, '0')}분`; }
function fileDate() { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; }
function printDateStr() {
    const t = new Date();
    return `${t.getFullYear()}.${String(t.getMonth() + 1).padStart(2, '0')}.${String(t.getDate()).padStart(2, '0')} 기준`;
}
// PDF 도구(jsPDF, 약 350KB)는 [PDF 받기]를 누를 때만 불러온다 (v1과 같은 주소·같은 판)
let printJsPdfLoading = null;
function loadJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
    if (!printJsPdfLoading) printJsPdfLoading = new Promise((resolve, reject) => {
        const sc = document.createElement('script');
        sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        sc.onload = resolve; sc.onerror = () => { printJsPdfLoading = null; sc.remove(); reject(); };
        document.head.appendChild(sc);
    });
    return printJsPdfLoading;
}
function dataUrlToFile(url, name) {
    const [head, b64] = url.split(','), bin = atob(b64), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new File([u8], name, { type: (head.match(/:(.*?);/) || [])[1] || 'image/jpeg' });
}
// 공유 창은 폰(터치)에서만: PC 크롬·엣지도 navigator.share가 있지만 윈도우·맥 공유 창엔 카톡이 없다 (v1 canUseShareSheet와 같다)
function printCanShare() { return !!navigator.share && window.matchMedia('(pointer: coarse)').matches; }
// 파일 이름: 매장이름(없으면 앱 이름)_양식[_사진이름]_날짜
function printFileBase() {
    const photos = vis(), F = PRINT_FORMS[printOpts.form] || PRINT_FORMS.map, one = photos.length > 1 && printScope !== 'all' ? photoById(printPreviewId) : null;
    const part = one ? '_' + (one.title || '').replace(/[\\/:*?"<>|\s]+/g, '').slice(0, 20) : '';
    return `${storeFileName() || PRINT_APP_NAME}_${F.file}${part}_${fileDate()}`;
}

// ────────────────────────────────────────────────────────────
// 화면: #/print · #/print?photo=ID (+ &view=1&pg=쪽 → 크게 보기. 뒤로 가기로 닫힌다)
// ────────────────────────────────────────────────────────────
const printUI = {
    job: 0, key: '', done: false, pages: [], count: 0, cache: new Map(), // 미리보기 (열려 있는 동안 고른 조합은 기억 — 최근 4개)
    px: 4, zoom: 1, view: -1, vz: 1, sharp: [], sharpTimer: 0,           // 미리보기 해상도 · 크기 · 크게 보기
    busy: '', printKey: '', urls: []                                     // 받기·인쇄 중 · 인쇄용 그림
};
// 다른 화면에서 인쇄 열기: openPrint() 전체 · openPrint(사진 id) 그 사진 · openPrint(id 또는 null, 'check') 양식까지 (map·list·check·label)
function openPrint(photoId, form) {
    const u = new URLSearchParams();
    if (photoId != null && photoId !== '') u.set('photo', String(photoId));
    if (form) u.set('form', form);
    nav('#/print' + (u.toString() ? '?' + u : ''));
}
function openPrintPreview(dataId) { openPrint(dataId); } // v1 이름으로 불러도 되게
function printHash(o = {}) {
    const u = new URLSearchParams();
    if (printScope === 'photo' && vis().length > 1 && printPreviewId) u.set('photo', printPreviewId);
    if (o.view) { u.set('view', '1'); if (o.pg) u.set('pg', String(o.pg)); }
    const s = u.toString();
    return '#/print' + (s ? '?' + s : '');
}
// 미리보기 해상도: 크게 보기에서 화면 폭에 맞춘 한 쪽이 또렷하게 (× 기기 배율). 그보다 키우면 보는 쪽만 종이 해상도로 다시 그린다
function syncPrintPreviewPx() {
    const w = Math.min(820, Math.max(320, window.innerWidth - 20));
    printUI.px = Math.min(8, Math.max(4, Math.round(w * (window.devicePixelRatio || 1) / PRINT.pageWmm)));
}
function printPreviewChunk(fn) {
    const px = PRINT.pxPerMm; PRINT.pxPerMm = printUI.px; PRINT.raw = true;
    try { return fn(); } finally { PRINT.pxPerMm = px; PRINT.raw = false; }
}

function renderPrint(r) {
    const photos = vis(), want = r.q.get('photo'), form = r.q.get('form');
    if (form != null) { // 양식을 정해 열었다 (#/print?form=check): 고른 양식으로 기억하고(v1처럼 다음에도) 주소에선 뺀다
        if (PRINT_FORMS[form]) { printOpts.form = form; try { localStorage.setItem('printOpts', JSON.stringify(printOpts)); } catch (e) {} }
        const q = new URLSearchParams(r.q); q.delete('form');
        nav('#/print' + (q.toString() ? '?' + q : ''), true); return false;
    }
    const pick = want ? photos.find(p => String(p.id) === String(want)) : null;
    if (want && !pick) { nav('#/print', true); return false; } // 그 사이 지운 사진이면 전체로
    if (cur !== 'print') { // 들어올 때마다 새로 (그 사이 물건이 바뀌었을 수 있다)
        printUnsharpAll(); printUI.cache.clear(); printUI.key = ''; printUI.printKey = ''; syncPrintPreviewPx();
    }
    printScope = pick || photos.length < 2 ? 'photo' : 'all';
    printPreviewId = String((pick || photos[0]).id);
    printUI.view = r.q.get('view') === '1' ? Math.max(0, parseInt(r.q.get('pg'), 10) || 0) : -1;
    buildPrintShell();
    if (printUI.view < 0) closePrintViewer();
    renderPrintPreview();
}
function buildPrintShell() {
    const el = screenEl('print');
    if (el.dataset.built) return el;
    el.dataset.built = '1'; el.setAttribute('aria-label', '인쇄');
    el.innerHTML = `
        <header class="top">${backBtn('검색', '#/')}<span class="meta" id="prMeta"></span></header>
        <main class="wrap pr-main">
            <div class="title-row"><h1 class="h1">인쇄</h1></div>
            <div class="pr-pv" id="prPv">
                <div class="pr-strip" id="prStrip" role="group" aria-label="인쇄물 미리보기"></div>
                <div class="pr-side">
                    <span class="pr-info" id="prInfo" aria-live="polite"></span>
                    <div class="pr-zoom" role="group" aria-label="미리보기 크기"><button type="button" data-act="prZoom" data-d="-1" id="prZOut" aria-label="작게">−</button><button type="button" class="pr-zv" data-act="prZoom" data-d="0" id="prZv">100%</button><button type="button" data-act="prZoom" data-d="1" id="prZIn" aria-label="크게">+</button></div>
                    <button type="button" class="pr-big" data-act="prView" data-i="-1">크게 보기</button>
                </div>
            </div>
            <div class="pr-opts" id="prOpts"></div>
            <div class="pr-acts">
                <button type="button" class="btn btn-p" data-act="prPdf" id="prPdf">PDF 받기</button>
                <button type="button" class="btn btn-s" data-act="prShare" id="prShare">단톡방에 보내기</button>
                <div class="pr-more"><button type="button" class="tlink" data-act="prImg" id="prImg">그림으로 받기</button><button type="button" class="tlink" data-act="prPrint" id="prPrint">바로 인쇄</button></div>
            </div>
        </main>
        <div class="pr-viewer" id="prViewer" role="dialog" aria-modal="true" aria-label="인쇄물 크게 보기" hidden>
            <div class="pr-vbar"><span id="prVPage"></span><button type="button" data-act="prVZoom" id="prVZoom">더 크게</button><button type="button" data-act="prVClose" id="prVClose">닫기</button></div>
            <div class="pr-vbody" id="prVBody"></div>
        </div>`;
    bindPrintViewer($('#prVBody'));
    setPrintZoom(printUI.zoom);
    return el;
}
function renderPrintPreview(tab) {
    if (tab) printScope = tab;
    buildPrintShell();
    const photos = vis(), multi = photos.length > 1;
    const form = PRINT_FORMS[printOpts.form] ? printOpts.form : 'map', F = PRINT_FORMS[form];
    printOpts.form = form;
    const data = photoById(printPreviewId) || photos[0], i = photos.indexOf(data), all = printScope === 'all' && multi;
    $('#prMeta').textContent = all ? `사진 ${photos.length}장 전체` : (data.title || `#${i + 1}`);
    renderPrintOpts(printOptsHTML(form, photos, all, i));
    // 미리보기·PDF·그림은 양식·범위 모두 보이는 그대로
    const label = form === 'map' ? (all ? '사진 전체' : (data.title || '')) : F.title;
    const key = JSON.stringify([form, all, printPreviewId, printOpts.sort, printOpts.memo, printOpts.size, printOpts.ink, printOpts.label, storeName(), organizerName(), printDateStr()]);
    fillPrintPreview(key, label);
    requestAnimationFrame(() => setPrintZoom(printUI.zoom)); // 화면이 보인 뒤 폭에 맞춰 (+ 끝 계산)
}
function printOptsHTML(form, photos, all, idx) {
    const seg = (act, attrs, on, inner) => `<button type="button" class="pr-seg" data-act="${act}" ${attrs} aria-pressed="${on}">${inner}</button>`;
    const row = (label, inner, scroll) => `<div class="pr-row"><span>${label}</span><div class="pr-segs${scroll ? ' pr-scroll' : ''}" role="group" aria-label="${label}">${inner}</div></div>`;
    const opt = (k, v, on, text) => seg('prOpt', `data-k="${k}" data-v="${v}"`, on, text);
    let h = row('양식', Object.keys(PRINT_FORMS).map(f => seg('prForm', `data-v="${f}"`, f === form, PRINT_FORMS[f].btn)).join(''))
        + `<p class="pr-sub">${esc(PRINT_FORMS[form].sub)}</p>`;
    if (photos.length > 1) h += row('사진', seg('prScope', 'data-p=""', all, `전체 ${photos.length}장`)
        + photos.map((p, pi) => seg('prScope', `data-p="${esc(p.id)}"`, !all && pi === idx, `<b>${photoLetter(pi)}</b><span>${esc(p.title || `#${pi + 1}`)}</span>`)).join(''), true);
    if (form === 'map') h += row('색', opt('ink', '0', !printOpts.ink, '사진 그대로') + opt('ink', '1', !!printOpts.ink, '잉크 절약'));
    if (form === 'list') h += row('정렬', opt('sort', 'name', printOpts.sort === 'name', '가나다순') + opt('sort', 'zone', printOpts.sort === 'zone', '칸 순서'))
        + row('메모', opt('memo', '1', !!printOpts.memo, '보이기') + opt('memo', '0', !printOpts.memo, '숨기기'))
        + row('글씨', opt('size', '1', printOpts.size === 1, '크게') + opt('size', '1.35', printOpts.size === 1.35, '아주 크게'));
    if (form === 'label') h += row('크기', opt('label', 'S', printOpts.label === 'S', '작게 · 12개') + opt('label', 'M', printOpts.label === 'M', '보통 · 6개') + opt('label', 'L', printOpts.label === 'L', '크게 · 4개'));
    // 이름: 매장 이름(종이 위·파일 이름) · 정리 업체(종이 아래) — v1 인쇄 창의 매장 이름 + 설정의 정리 업체 이름
    const n = storeName(), org = organizerName(), what = isHome() ? '머리글 이름' : '매장 이름';
    const text = [n, org ? `정리 ${org}` : ''].filter(Boolean).join(' · ');
    h += `<div class="pr-row"><span>이름</span><button type="button" class="pr-name${text ? '' : ' pr-none'}" data-act="prName" aria-label="${esc(text ? `종이에 넣을 이름 고치기 · ${text}` : `${what} 넣기 · 종이 위·파일 이름에 들어가요`)}">${text ? esc(text) : `+ ${what} 넣기`}</button></div>`;
    return h;
}
function renderPrintOpts(html) { // 다시 그려도 누르던 단추·사진 줄 스크롤은 그대로
    const box = $('#prOpts'), a = document.activeElement, sc = box.querySelector('.pr-scroll'), left = sc ? sc.scrollLeft : null;
    let sel = null;
    if (a && box.contains(a) && a.dataset && a.dataset.act) sel = `[data-act="${a.dataset.act}"]` + ['k', 'v', 'p'].filter(k => a.dataset[k] != null).map(k => `[data-${k}="${CSS.escape(a.dataset[k])}"]`).join('');
    box.innerHTML = html;
    const sc2 = box.querySelector('.pr-scroll');
    if (sc2) {
        if (left != null) sc2.scrollLeft = left;
        const on = sc2.querySelector('[aria-pressed="true"]');
        if (on) requestAnimationFrame(() => { // 고른 사진이 줄 밖이면 보이게
            const r = on.getBoundingClientRect(), b = sc2.getBoundingClientRect();
            if (r.right > b.right - 8 || r.left < b.left) sc2.scrollLeft += r.left - b.left - 8;
        });
    }
    if (sel) { const b = box.querySelector(sel); if (b) b.focus({ preventScroll: true }); }
}

// 미리보기 채우기: 덩어리마다 숨 돌릴 틈을 줘서 사진이 많아도 첫 쪽부터 바로 보이고 화면이 멈추지 않는다 (v1과 같다)
async function fillPrintPreview(key, label) {
    if (key === printUI.key) { // 같은 종이: 만드는 중이면 그대로 두고, 다 됐으면 크게 보기만
        if (printUI.done) { syncPrintCount(); if (printUI.view >= 0) openPrintViewerNow(printUI.view); }
        return;
    }
    const job = ++printUI.job, strip = $('#prStrip');
    closePrintViewer(); printUnsharpAll(); printCleanup();
    Object.assign(printUI, { key, done: false, pages: [], count: 0, printKey: '' });
    strip.innerHTML = ''; strip.scrollLeft = 0;
    const wait = document.createElement('div'); wait.className = 'pr-pg pr-wait'; wait.textContent = '만드는 중…';
    strip.appendChild(wait);
    syncPrintCount();
    const add = (cv) => {
        const n = printUI.pages.length, b = document.createElement('button');
        b.type = 'button'; b.className = 'pr-pg'; b.dataset.act = 'prView'; b.dataset.i = String(n);
        b.setAttribute('aria-label', `${label} 인쇄물 ${n + 1}쪽 · 크게 보기`);
        cv.setAttribute('aria-hidden', 'true');
        b.appendChild(cv); strip.insertBefore(b, wait);
        printUI.pages.push(cv); printUI.count = printUI.pages.length; syncPrintCount();
    };
    let pages = printUI.cache.get(key);
    if (!pages) {
        await printReady();
        if (job !== printUI.job) return;
        pages = [];
        const chunks = printChunks();
        for (let ci = 0; ci < chunks.length; ci++) {
            await printYield(); // 화면이 먼저 그려지게
            if (job !== printUI.job) return; // 그 사이 다른 양식·범위를 골랐다
            let got = [];
            try { got = printPreviewChunk(chunks[ci]); } catch (e) { console.error(e); }
            got.forEach((cv, j) => { cv.dataset.chunk = ci; cv.dataset.sub = j; add(cv); });
            pages.push(...got);
        }
        printUI.cache.set(key, pages);
        // 기억은 최근 4가지·모두 40쪽까지 (폰 메모리 — 사진이 많으면 한 조합만으로도 수십 쪽)
        const total = () => [...printUI.cache.values()].reduce((n, a) => n + a.length, 0);
        while (printUI.cache.size > 1 && (printUI.cache.size > 4 || total() > 40)) printUI.cache.delete(printUI.cache.keys().next().value);
    } else { printUI.cache.delete(key); printUI.cache.set(key, pages); pages.forEach(add); } // 다시 고른 조합은 맨 뒤로 (가장 최근)
    wait.remove();
    printUI.done = true; syncPrintCount();
    if (printUI.view >= 0) openPrintViewerNow(printUI.view);
}
function syncPrintCount() {
    const n = printUI.count, done = printUI.done, pv = $('#prPv'); if (!pv) return;
    const info = $('#prInfo');
    info.textContent = done ? `A4 ${n}장 · 세로` : n ? `만드는 중… ${n}쪽` : '만드는 중…';
    info.setAttribute('aria-busy', String(!done)); // 화면 읽기는 다 만든 뒤 장수만
    pv.style.setProperty('--pn', String(Math.max(1, n + (done ? 0 : 1))));
    if (!printUI.busy) $('#prPdf').textContent = `PDF 받기${done && n ? ` (${n}쪽)` : ''}`;
}
// 미리보기 크기 [−] 100% [+]: 25%씩. 100% = 쪽 폭 128px, 가장 크게 = 화면 폭에 맞춤 (가운데 숫자를 누르면 처음 크기)
function setPrintZoom(z) {
    const pv = $('#prPv'); if (!pv) return;
    const max = Math.min(3, Math.max(1, (pv.clientWidth || 342) / 128));
    z = Math.min(max, Math.max(0.5, Math.round(z * 100) / 100));
    printUI.zoom = z;
    pv.style.setProperty('--pw', `${Math.round(128 * z)}px`);
    pv.classList.toggle('pr-wide', Math.round(128 * z) + 18 + 136 > (pv.clientWidth || 342)); // 옆 칸(크기 단추 136px)이 못 들어가면 아래 한 줄로
    const pct = `${Math.round(z * 100)}%`, zv = $('#prZv');
    zv.textContent = pct; zv.setAttribute('aria-label', `미리보기 ${pct} · 누르면 처음 크기로`);
    $('#prZOut').disabled = z <= 0.5; $('#prZIn').disabled = z >= max - 0.001;
}
function stripPage() { // 미리보기 줄에서 지금 보이는 쪽
    const s = $('#prStrip'), first = s && s.querySelector('button.pr-pg');
    if (!first) return 0;
    return Math.max(0, Math.min(printUI.count - 1, Math.round(s.scrollLeft / (first.offsetWidth + 10))));
}

// ────────────────────────────────────────────────────────────
// 크게 보기: 미리보기 쪽들을 화면 가득한 창으로 옮겨 보여 주고, 닫으면 제자리로 (v1과 같다)
// ────────────────────────────────────────────────────────────
function openPrintViewer(i) {
    if (!printUI.done || !printUI.pages.length) { toast('인쇄물을 만드는 중이에요 · 잠시만요'); return; }
    nav(printHash({ view: 1, pg: i >= 0 ? i : stripPage() }));
}
function openPrintViewerNow(at) {
    const v = $('#prViewer'), body = $('#prVBody'), cs = printUI.pages;
    if (!v || !cs.length || !v.hidden) return; // 이미 열려 있으면 그대로
    setViewerZoom(1); body.append(...cs); v.hidden = false;
    const k = Math.min(at, cs.length - 1);
    body.scrollTop = k > 0 ? cs[k].offsetTop - body.offsetTop : 0; // 누른 쪽부터
    syncViewerPage();
    const c = $('#prVClose'); if (c) c.focus({ preventScroll: true });
}
function closePrintViewer() {
    const v = $('#prViewer'); if (!v || v.hidden) return false;
    const btns = $('#prStrip').querySelectorAll('button.pr-pg'), had = v.contains(document.activeElement);
    const at = $('#prVPage').textContent ? Math.max(0, parseInt($('#prVPage').textContent, 10) - 1) : 0;
    printUI.pages.forEach((cv, k) => { if (btns[k]) btns[k].appendChild(cv); });
    v.hidden = true;
    if (had && btns[at]) btns[at].focus({ preventScroll: true }); // 보던 쪽 단추로 돌아온다
    return true;
}
function closePrintViewerNav() { if (parseRoute().q.get('view') === '1') goBack(printHash()); else closePrintViewer(); }
// 확대 배율 (1 = 화면 폭에 맞춤 ~ 4배). 손가락(또는 화면 가운데) 아래 자리가 그대로 있게 스크롤을 맞춘다
const PRINT_VZMAX = 4;
function setViewerZoom(z, fx, fy) {
    const body = $('#prVBody'), pad = 10;
    z = Math.min(PRINT_VZMAX, Math.max(1, z));
    const r = body.getBoundingClientRect();
    if (fx === undefined) { fx = r.left + body.clientWidth / 2; fy = r.top + body.clientHeight / 2; }
    const mx = fx - r.left, my = fy - r.top, z0 = printUI.vz;
    const cx = (body.scrollLeft + mx - pad) / z0, cy = (body.scrollTop + my) / z0; // 배율 1 기준 내용 좌표
    printUI.vz = z; body.style.setProperty('--z', z);
    body.scrollLeft = cx * z + pad - mx; body.scrollTop = cy * z - my;
    $('#prVZoom').textContent = z > 1.05 ? '맞추기' : '더 크게';
    syncViewerPage();
}
function togglePrintViewerZoom() { setViewerZoom(printUI.vz > 1.05 ? 1 : 2.5); sharpenViewerPage(); }
function bindPrintViewer(body) { // 두 손가락 벌리기·오므리기 + 두 번 톡 (확대 ↔ 맞추기) + 컴퓨터는 Ctrl(⌘) + 휠
    let pinch = null, lastTap = 0;
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const mid = (t) => [(t[0].clientX + t[1].clientX) / 2, (t[0].clientY + t[1].clientY) / 2];
    body.addEventListener('touchstart', (e) => { if (e.touches.length === 2) { pinch = { d: dist(e.touches), z: printUI.vz }; e.preventDefault(); } }, { passive: false });
    body.addEventListener('touchmove', (e) => {
        if (!pinch || e.touches.length !== 2) return;
        e.preventDefault(); // 브라우저가 화면 전체를 확대하지 않게
        const [x, y] = mid(e.touches);
        setViewerZoom(pinch.z * dist(e.touches) / pinch.d, x, y);
    }, { passive: false });
    body.addEventListener('touchend', (e) => {
        if (pinch) { if (e.touches.length < 2) { pinch = null; sharpenViewerPage(); } return; }
        if (e.changedTouches.length !== 1 || e.touches.length) return;
        const now = Date.now(), t = e.changedTouches[0];
        if (now - lastTap < 300) { lastTap = 0; setViewerZoom(printUI.vz > 1.05 ? 1 : 2.5, t.clientX, t.clientY); sharpenViewerPage(); e.preventDefault(); }
        else lastTap = now;
    });
    body.addEventListener('wheel', (e) => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault(); setViewerZoom(printUI.vz * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY);
        clearTimeout(printUI.sharpTimer); printUI.sharpTimer = setTimeout(sharpenViewerPage, 300);
    }, { passive: false });
    body.addEventListener('scroll', () => { syncViewerPage(); clearTimeout(printUI.sharpTimer); printUI.sharpTimer = setTimeout(sharpenViewerPage, 400); }, { passive: true });
}
// 많이 키우면 미리보기 해상도로는 흐려서, 보고 있는 쪽만 종이 해상도로 다시 그린다 (메모리 때문에 최근 3쪽까지만)
function sharpenViewerPage() {
    const v = $('#prViewer'); if (!v || v.hidden || printUI.vz < 1.6) return;
    const body = $('#prVBody'), cs = [...body.querySelectorAll('canvas')], mid = body.getBoundingClientRect().top + body.clientHeight / 2;
    const cv = cs.find(c => { const r = c.getBoundingClientRect(); return r.top <= mid && r.bottom >= mid; }) || cs[0];
    if (!cv || cv.dataset.sharp || cv.dataset.chunk === undefined) return;
    const fn = printChunks()[+cv.dataset.chunk]; if (!fn) return;
    let hi = null;
    PRINT.raw = true; try { hi = fn()[+cv.dataset.sub]; } catch (e) {} finally { PRINT.raw = false; }
    if (!hi) return;
    const low = { w: cv.width, h: cv.height };
    cv.width = hi.width; cv.height = hi.height; cv.getContext('2d').drawImage(hi, 0, 0);
    cv.dataset.sharp = '1'; printUI.sharp.push({ cv, low });
    while (printUI.sharp.length > 3) printUnsharp(printUI.sharp.shift()); // 오래된 쪽은 다시 미리보기 해상도로
}
function printUnsharp({ cv, low }) {
    const tmp = document.createElement('canvas'); tmp.width = low.w; tmp.height = low.h; tmp.getContext('2d').drawImage(cv, 0, 0, low.w, low.h);
    cv.width = low.w; cv.height = low.h; cv.getContext('2d').drawImage(tmp, 0, 0); delete cv.dataset.sharp;
}
function printUnsharpAll() { while (printUI.sharp.length) printUnsharp(printUI.sharp.shift()); }
function syncViewerPage() { // 지금 보고 있는 쪽 "3 / 9쪽"
    const body = $('#prVBody'), el = $('#prVPage'); if (!body || !el) return;
    const cs = [...body.querySelectorAll('canvas')];
    if (!cs.length) { el.textContent = ''; return; }
    const top = body.getBoundingClientRect().top + body.clientHeight * 0.35;
    let k = cs.findIndex(c => c.getBoundingClientRect().bottom > top); if (k < 0) k = cs.length - 1;
    el.textContent = `${k + 1} / ${cs.length}쪽`;
}

// ────────────────────────────────────────────────────────────
// 종이에 넣을 이름 (아래 창): 매장 이름 = 종이 위 날짜 옆·파일 이름 · 정리 업체 = 종이 아래 '정리 · 이름'
//   v1과 같은 키에 쓰는 대로 바로 저장하고, 닫으면 미리보기를 다시 (같으면 기억해 둔 것을 그대로)
// ────────────────────────────────────────────────────────────
function openPrintNameSheet() {
    const home = isHome();
    const card = openSheet(`<h2>종이에 넣을 이름</h2>
        <p>비워 두면 넣지 않아요 · 이 폰에 저장돼요</p>
        <label class="pr-field"><span>${home ? '머리글 이름' : '매장 이름'}<small>인쇄물 머리글·파일 이름에 들어가요</small></span><input type="text" id="prStoreIn" maxlength="20" autocomplete="off" enterkeyhint="next" placeholder="${home ? '예: 우리 집' : '예: 다산점 창고'}"></label>
        <label class="pr-field"><span>정리 업체 이름<small>정리해 드린 분이 넣으면 인쇄물·백업 PDF 아래에 ‘정리 · 이름’으로 들어가요</small></span><input type="text" id="prOrgIn" maxlength="30" autocomplete="off" enterkeyhint="done" placeholder="예: 다산정리수납 010-1234-5678"></label>
        <div class="stack"><button type="button" class="btn btn-p" data-act="sheetClose">다 했어요</button></div>`, () => { if (parseRoute().name === 'print') renderPrintPreview(); });
    card.setAttribute('aria-label', '종이에 넣을 이름');
    const s = $('#prStoreIn'), o = $('#prOrgIn');
    s.value = storeName(); o.value = organizerName();
    s.addEventListener('input', () => setStoreName(s.value));
    o.addEventListener('input', () => setOrganizerName(o.value));
    s.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); o.focus(); } });
    o.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); closeSheet(); } });
}

// ────────────────────────────────────────────────────────────
// 받기·보내기·인쇄 (모두 미리보기에 보이는 그대로 — 양식·범위·옵션)
// ────────────────────────────────────────────────────────────
function printBusy(which) { // 하나를 하는 동안 다른 단추는 잠깐 쉰다
    printUI.busy = which || '';
    [['prPdf', 'pdf'], ['prShare', 'share'], ['prImg', 'img'], ['prPrint', 'print']].forEach(([id, w]) => {
        const b = $('#' + id); if (!b) return;
        b.disabled = !!which && w !== which;
        if (which && w === which) b.setAttribute('aria-busy', 'true'); else b.removeAttribute('aria-busy');
    });
    if (!which) { $('#prImg').textContent = '그림으로 받기'; $('#prPrint').textContent = '바로 인쇄'; syncPrintCount(); }
}
const printBusyText = (id, t) => { const b = $('#' + id); if (b) b.textContent = t; };
function printBlob(cv) { return new Promise((res, rej) => cv.toBlob(b => (b ? res(b) : rej(new Error('그림을 만들지 못했어요'))), 'image/jpeg', 0.92)); }
function printDownload(blob, name) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}
// 종이 해상도 그림(캔버스)들을 덩어리마다 숨 돌리며 만든다. each(캔버스, 몇 번째) — PRINT.raw는 그리는 순간에만 켠다 (그 사이 미리보기가 같은 값을 쓴다)
async function printEachPage(chunks, each) {
    let k = 0;
    for (const fn of chunks) {
        await printYield();
        let cvs = [];
        PRINT.raw = true; try { cvs = fn(); } finally { PRINT.raw = false; }
        for (const cv of cvs) await each(cv, k++);
    }
    return k;
}

// PDF 받기 (v1 downloadReportAsPDF): 종이 해상도 JPEG를 A4 한 쪽씩
async function downloadReportAsPDF() {
    if (printUI.busy || !vis().length) return;
    printBusy('pdf'); printBusyText('prPdf', 'PDF 만드는 중…');
    try {
        await printReady();
        const chunks = printChunks(), name = printFileBase() + '.pdf', total = printUI.done ? printUI.count : 0; // 누른 순간 보이던 그대로 (도구를 받는 사이 옵션을 바꿔도)
        try { await loadJsPdf(); } catch (e) {}
        if (!window.jspdf || !window.jspdf.jsPDF) { alert('PDF 만드는 도구를 불러오지 못했어요. 인터넷 연결을 확인하고 잠시 뒤 다시 눌러주세요.'); return; }
        const doc = new window.jspdf.jsPDF('p', 'mm', 'a4');
        let k = 0;
        for (const fn of chunks) {
            printBusyText('prPdf', `PDF 만드는 중…${k ? ` ${k}${total ? `/${total}` : ''}쪽` : ''}`);
            await printYield();
            for (const imgData of fn()) { if (k) doc.addPage(); doc.addImage(imgData, 'JPEG', 0, 0, PRINT.pageWmm, PRINT.pageHmm); k++; }
        }
        doc.save(name);
    } catch (error) {
        console.error('PDF 생성 중 오류 발생:', error);
        alert('PDF 생성 중 문제가 발생했습니다.');
    } finally { printBusy(''); }
}

// 💬 단톡방에 보내기 (v1 shareToChat): 쪽들을 사진(JPG)으로 만들어 휴대폰 공유 창으로 (카톡 단톡방에 바로 사진으로 붙는다)
//   공유 창은 누른 직후에만 열 수 있어서, 그림은 기다리지 않고 바로(동기로) 만든다. 공유 창이 없으면 PDF로
function shareToChat() {
    if (printUI.busy || !vis().length) return;
    if (!printImgsReady()) { printReady(); toast('사진을 불러오는 중이에요 · 잠시 뒤 다시 눌러 주세요'); return; }
    const base = `${storeFileName() || PRINT_APP_NAME}_${(PRINT_FORMS[printOpts.form] || PRINT_FORMS.map).file}_${fileDate()}`, files = [];
    const px = PRINT.pxPerMm; PRINT.pxPerMm = 6; PRINT.raw = true; // 카톡에서 보기 좋은 크기 (A4 한 장 1260×1782)
    try { printChunks().forEach(fn => fn().forEach(cv => files.push(dataUrlToFile(cv.toDataURL('image/jpeg', 0.86), `${base}_${files.length + 1}.jpg`)))); }
    catch (e) { console.error(e); } finally { PRINT.pxPerMm = px; PRINT.raw = false; }
    if (!files.length) return;
    const count = () => kvSet('chatShares', String((parseInt(kvGet('chatShares') || '0', 10) || 0) + 1)); // 폰에만 남는 횟수 (v1과 같은 키)
    if (printCanShare() && navigator.canShare && navigator.canShare({ files })) {
        navigator.share({ files }).then(count).catch(e => { if (e && e.name !== 'AbortError') toast('보내기 창을 열지 못했어요. 한 번 더 눌러 주세요'); });
    } else {
        downloadReportAsPDF(); count();
        toast(printCanShare() ? '이 기기에선 바로 보내기가 안 돼서 PDF로 받았어요. 카톡에서 파일로 보내 주세요' : 'PDF로 받았어요. PC 카톡 대화방에 파일을 끌어다 놓으면 보내져요');
    }
}

// 그림으로 받기: 쪽마다 종이 해상도 JPG 한 장 (여러 쪽이면 조금씩 띄워 차례로)
async function savePrintImages() {
    if (printUI.busy || !vis().length) return;
    printBusy('img'); printBusyText('prImg', '그림 만드는 중…');
    try {
        await printReady();
        const blobs = [], base = printFileBase();
        await printEachPage(printChunks(), async (cv) => { blobs.push(await printBlob(cv)); printBusyText('prImg', `그림 만드는 중… ${blobs.length}쪽`); });
        blobs.forEach((b, k) => setTimeout(() => printDownload(b, blobs.length > 1 ? `${base}_${k + 1}.jpg` : `${base}.jpg`), k * 400));
        toast(blobs.length > 1 ? `그림 ${blobs.length}장을 받았어요` : '그림으로 받았어요');
    } catch (e) { console.error(e); toast('그림을 만들지 못했어요 · 한 번 더 눌러 주세요'); }
    finally { printBusy(''); }
}

// 바로 인쇄: 종이 해상도 그림을 A4 한 쪽씩 숨겨 두고 브라우저 인쇄 창을 연다 (인쇄할 때만 그 그림만 보이게)
//   한 번 만들어 두면 같은 종이는 다시 누를 때 바로 연다 (아이폰은 누른 순간이어야 인쇄 창이 열릴 때가 있다)
async function printNow() {
    if (printUI.busy || !vis().length) return;
    if (isInAppUA() || typeof window.print !== 'function') { toast('카톡·인스타 안에선 바로 인쇄가 안 돼요 · PDF로 받아 인쇄해 주세요'); return; }
    if (printUI.printKey !== printUI.key || !document.querySelector('.pr-print')) {
        printBusy('print'); printBusyText('prPrint', '인쇄 준비 중…');
        try {
            printCleanup();
            await printReady();
            const key = printUI.key, urls = [];
            await printEachPage(printChunks(), async (cv) => { urls.push(URL.createObjectURL(await printBlob(cv))); printBusyText('prPrint', `인쇄 준비 중… ${urls.length}쪽`); });
            const root = document.createElement('div'); root.className = 'pr-print'; root.setAttribute('aria-hidden', 'true');
            root.innerHTML = urls.map(u => `<img src="${u}" alt="">`).join('');
            document.body.appendChild(root);
            const page = document.createElement('style'); page.id = 'prPageCss'; page.textContent = '@page { size: A4 portrait; margin: 0; }'; // 그림에 여백이 이미 있다
            document.head.appendChild(page);
            await Promise.all([...root.querySelectorAll('img')].map(im => (im.decode ? im.decode() : Promise.resolve()).catch(() => {})));
            printUI.urls = urls; printUI.printKey = key;
        } catch (e) { console.error(e); printCleanup(); toast('인쇄 준비를 못 했어요 · PDF로 받아 인쇄해 주세요'); return; }
        finally { printBusy(''); }
        if (cur !== 'print' || printUI.printKey !== printUI.key) return; // 그 사이 다른 종이를 골랐다
    }
    document.body.classList.add('pr-printing');
    try { window.print(); } catch (e) { document.body.classList.remove('pr-printing'); toast('인쇄 창을 열지 못했어요 · PDF로 받아 인쇄해 주세요'); }
}
function printCleanup() {
    document.body.classList.remove('pr-printing');
    document.querySelectorAll('.pr-print, #prPageCss').forEach(n => n.remove());
    printUI.urls.forEach(u => URL.revokeObjectURL(u)); printUI.urls = []; printUI.printKey = '';
}
window.addEventListener('afterprint', () => document.body.classList.remove('pr-printing'));

// ────────────────────────────────────────────────────────────
BEFORE_ROUTE.push((name) => { // 다른 화면으로 가면: 크게 보기·이름 창을 닫고, 만들던 미리보기는 멈추고, 쪽 그림·인쇄용 그림은 비운다 (다시 오면 새로 만든다)
    if (name === 'print' || !$('#prStrip')) return;
    closePrintViewer(); printCleanup();
    Object.assign(printUI, { job: printUI.job + 1, key: '', done: false, pages: [], count: 0, sharp: [] });
    printUI.cache.clear(); $('#prStrip').innerHTML = '';
    if ($('#prStoreIn')) closeSheet();
});
SCREENS.print = renderPrint;
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || cur !== 'print') return;
    const v = $('#prViewer'); if (v && !v.hidden) { e.preventDefault(); closePrintViewerNav(); }
});
window.addEventListener('resize', () => { if (cur === 'print') setPrintZoom(printUI.zoom); });
Object.assign(ACT, {
    prForm: (el) => setPrintOpt('form', el.dataset.v),
    prOpt: (el) => { const k = el.dataset.k, v = el.dataset.v; setPrintOpt(k, k === 'size' ? Number(v) : (k === 'ink' || k === 'memo') ? v === '1' : v); },
    prScope: (el) => { const y = window.scrollY; nav(el.dataset.p ? '#/print?photo=' + encodeURIComponent(el.dataset.p) : '#/print', true); window.scrollTo(0, y); },
    prZoom: (el) => { const d = Number(el.dataset.d); setPrintZoom(d ? printUI.zoom + d * 0.25 : 1); },
    prView: (el) => openPrintViewer(Number(el.dataset.i)),
    prVZoom: () => togglePrintViewerZoom(),
    prVClose: () => closePrintViewerNav(),
    prName: () => openPrintNameSheet(),
    prPdf: () => downloadReportAsPDF(),
    prShare: () => shareToChat(),
    prImg: () => savePrintImages(),
    prPrint: () => printNow()
});
