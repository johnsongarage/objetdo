// 사용법 영상 다시 찍기 (11/10 — 새 화면 v2로)
//   매장: guide/v2-{ai,put,find,list}.{mp4,webm,jpg} · 집(정리수납): guide/v2-home-{…}  (settings.js 사용법 화면이 모드에 맞춰 고른다)
//   1) 저장소 루트에서 서버:  python3 -m http.server 8765 --bind 127.0.0.1
//   2) node tools/make_guide_videos.js [store|home]     (없으면 둘 다 · playwright · ffmpeg 필요, 글꼴은 Google Fonts)
//   폰 화면(390×760)을 1.2배(468×912)로 1초에 25장쯤 찍어 이어 붙인다 — 녹화(recordVideo)는 화면 배율을 무시해 흐려서
//   AI 칸 찾기는 서버 대신 예시 사진의 칸을 돌려준다 (영상 속 사진은 예시)
const path = require('path'), fs = require('fs'), os = require('os');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), BASE = process.env.BASE || 'http://127.0.0.1:8765/', OUT = path.join(ROOT, 'guide');
const SETS = {
    store: { prefix: 'v2-', json: 'v2/sample-store.json', photo: '1790000000201', q: '', sample: 'store', put: '종이컵, 컵 뚜껑, 빨대', industry: 'cafe', map: '1790000000200' }, // 창고 선반 3×3
    home: { prefix: 'v2-home-', json: 'v2/sample-home.json', photo: '1790000000300', q: '?mode=home', sample: 'home', put: '가위, 테이프, 줄자', industry: null, map: '1790000000299' }, // 거실 수납장 3×3
};

function jpegSize(buf) { // 사진 폭·높이 (AI 답을 사진 픽셀로)
    for (let i = 2; i + 9 < buf.length;) {
        if (buf[i] !== 0xFF) { i++; continue; }
        const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
        if (m >= 0xC0 && m <= 0xCF && ![0xC4, 0xC8, 0xCC].includes(m)) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
        i += 2 + len;
    }
    throw new Error('JPEG가 아니에요');
}
function prepare(set, tmp) { // 예시 사진 한 장을 파일로 (사진 넣기 장면) + 그 칸을 AI 답처럼 (칸 좌표는 폭 800 기준)
    const ph = JSON.parse(fs.readFileSync(path.join(ROOT, set.json), 'utf8')).savedSystemData.find(p => String(p.id) === set.photo);
    const buf = Buffer.from(ph.imgData.split(',')[1], 'base64'), { w } = jpegSize(buf), k = 800 / Math.min(w, 1600); // 앱은 1600px까지 그대로 둔다
    const file = path.join(tmp, 'photo.jpg'); fs.writeFileSync(file, buf); // 파일 이름에 한글이 있으면 사진 넣기가 안 된다 (11/10)
    return { file, pred: ph.zones.map(z => ({ x: (z.x + z.w / 2) / k, y: (z.y + z.h / 2) / k, width: z.w / k, height: z.h / k, confidence: 0.93, class: 'zone' })) };
}

// 페이지마다: 제목 카드 · 누른 자리 동그라미
const INIT = () => {
    const css = `.__t{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#F5F1EA;transition:opacity .35s;font-family:-apple-system,'Noto Sans KR',sans-serif;color:#3A3530}
.__t .p{padding:5px 14px;border-radius:999px;background:#3A3530;color:#FBF8F3;font-size:14px;font-weight:700;letter-spacing:.04em}
.__t .h{display:flex;align-items:center;gap:12px;margin-top:6px}
.__t .n{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border:2.5px solid #9E3B2A;border-radius:50%;color:#9E3B2A;font:700 24px 'Gowun Batang',serif}
.__t h1{margin:0;font:700 34px 'Gowun Batang',serif;letter-spacing:-.01em}
.__t .s{margin:0;font-size:16px;color:#6E665C}
.__tap{position:fixed;z-index:99998;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;background:rgba(158,59,42,.25);border:2px solid rgba(158,59,42,.8);pointer-events:none;animation:__tap .65s ease-out forwards}
@keyframes __tap{from{transform:scale(.35);opacity:1}to{transform:scale(1.2);opacity:0}}`;
    const put = () => { if (document.getElementById('__css')) return; const s = document.createElement('style'); s.id = '__css'; s.textContent = css; document.head.appendChild(s); };
    window.__title = (n, h, s) => { put(); const d = document.createElement('div'); d.className = '__t'; d.innerHTML = `<span class="p">사용법</span><div class="h"><span class="n">${n}</span><h1>${h}</h1></div><p class="s">${s}</p>`; document.body.appendChild(d); };
    window.__untitle = () => { const d = document.querySelector('.__t'); if (!d) return; d.style.opacity = '0'; setTimeout(() => d.remove(), 400); };
    window.__tap = (x, y) => { put(); const d = document.createElement('div'); d.className = '__tap'; d.style.left = x + 'px'; d.style.top = y + 'px'; document.body.appendChild(d); setTimeout(() => d.remove(), 700); };
};

const wait = (ms) => new Promise(r => setTimeout(r, ms));
async function tapAt(p, loc) { // 동그라미 보여 주고 손가락으로
    await loc.scrollIntoViewIfNeeded();
    const b = await loc.boundingBox(); const x = b.x + b.width / 2, y = b.y + b.height / 2;
    await p.evaluate(([x, y]) => window.__tap(x, y), [x, y]); await wait(260);
    await p.touchscreen.tap(x, y);
}
async function titleCard(p, start, n, h, s) { await p.evaluate(([n, h, s]) => window.__title(n, h, s), [n, h, s]); await wait(60); start(); await wait(1700); await p.evaluate(() => window.__untitle()); await wait(450); } // 제목 카드가 뜬 뒤부터 찍는다

async function context(b, pred) {
    const c = await b.newContext({ viewport: { width: 390, height: 760 }, deviceScaleFactor: 1.2, isMobile: true, hasTouch: true, serviceWorkers: 'block', locale: 'ko-KR' });
    await c.addInitScript(INIT);
    await c.route(/cloudflareinsights/, r => r.abort());
    await c.route(/script\.google\.com\/macros/, async (r) => { // AI 칸 찾기 · 통계 대신
        if (r.request().method() === 'POST') { await wait(1300); return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'success', predictions: pred }) }); }
        return r.fulfill({ contentType: 'application/json', body: '{"status":"ok"}' });
    });
    return c;
}
async function shoot(c, tmp, out, fn) { // 한 장면 = 한 페이지 = 영상 하나. fn(p, start): 준비가 끝나면 start()를 불러 찍기 시작
    const p = await c.newPage(), errs = [], frames = [];
    p.on('pageerror', e => errs.push(e.message));
    let on = false, loop = null, t0 = 0;
    const start = () => { on = true; t0 = Date.now(); loop = (async () => { while (on) { const t = Date.now() - t0; frames.push({ t, buf: await p.screenshot({ type: 'jpeg', quality: 90, caret: 'initial' }) }); } })(); };
    await fn(p, start);
    await wait(900); on = false; await loop; await p.close();
    // 찍은 장면 → 시간대로 이어 붙이기 (ffmpeg concat: 장면마다 머문 시간)
    const dir = path.join(tmp, out); fs.mkdirSync(dir);
    let list = '';
    frames.forEach((f, i) => { const fn = `f${String(i).padStart(4, '0')}.jpg`; fs.writeFileSync(path.join(dir, fn), f.buf); list += `file '${fn}'\nduration ${(((frames[i + 1] ? frames[i + 1].t : f.t + 60) - f.t) / 1000).toFixed(3)}\n`; });
    list += `file 'f${String(frames.length - 1).padStart(4, '0')}.jpg'\n`;
    fs.writeFileSync(path.join(dir, 'list.txt'), list);
    const src = ['-f', 'concat', '-safe', '0', '-i', path.join(dir, 'list.txt')], vf = 'fps=30,scale=468:912:flags=lanczos,format=yuv420p';
    execFileSync('ffmpeg', ['-v', 'error', '-y', ...src, '-vf', vf, '-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-movflags', '+faststart', '-an', path.join(OUT, `${out}.mp4`)]);
    execFileSync('ffmpeg', ['-v', 'error', '-y', ...src, '-vf', vf, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '35', '-row-mt', '1', '-an', path.join(OUT, `${out}.webm`)]);
    const poster = frames.find(f => f.t >= 700) || frames[0]; fs.writeFileSync(path.join(OUT, `${out}.jpg`), poster.buf); // 제목 카드
    const sec = frames[frames.length - 1].t / 1000;
    console.log(out, 'ok', `${frames.length}장 ${sec.toFixed(1)}초 (초당 ${(frames.length / sec).toFixed(1)}장)`, errs.length ? 'ERRS ' + JSON.stringify(errs) : '');
}

async function record(b, name) {
    const set = SETS[name], tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'guide-')), { file, pred } = prepare(set, tmp), o = (k) => set.prefix + k;
    // ①②: 빈 데이터에서 시작 (진짜 처음 쓰는 사람처럼) — 사진 찍는 법 안내는 건너뜀
    const c1 = await context(b, pred);
    let newId = null;
    await shoot(c1, tmp, o('ai'), async (p, start) => {
        await p.goto(BASE + 'v2/' + set.q + '#/'); await p.evaluate(() => { localStorage.setItem('photoTipSeen', '1'); }); await p.reload(); await p.waitForSelector('#s-intro [data-act=addPhoto]'); await p.evaluate(() => document.fonts.ready); await wait(500);
        await titleCard(p, start, '1', '공간 만들기', '사진 한 장으로 칸 나누기');
        const [fc] = await Promise.all([p.waitForEvent('filechooser'), tapAt(p, p.locator('#s-intro [data-act=addPhoto]'))]);
        await fc.setFiles(file);
        await p.waitForSelector('#s-edit [data-act=edAI]', { timeout: 10000 }); await wait(1300);
        await tapAt(p, p.locator('#s-edit [data-act=edAI]'));
        await p.waitForSelector('#edPh .ed-z'); await wait(2600);
        newId = await p.evaluate(() => parseRoute().a);
    });
    await shoot(c1, tmp, o('put'), async (p, start) => {
        await p.goto(BASE + 'v2/#/map/' + encodeURIComponent(newId)); await p.waitForSelector('#s-map .ph .zn');
        if (set.industry) { await p.evaluate((k) => setIndustry(k), set.industry); await p.reload(); await p.waitForSelector('#s-map .ph .zn'); }
        await p.evaluate(() => document.fonts.ready); await wait(700);
        await titleCard(p, start, '2', '넣기', '칸을 누르고 물건 넣기');
        await tapAt(p, p.locator('#s-map .ph .zn[data-z="1"]')); await wait(1000);
        await tapAt(p, p.locator('#zzIn')); await wait(300);
        await p.keyboard.type(set.put, { delay: 120 }); await wait(700);
        await tapAt(p, p.locator('#zzSug [data-act=zzAddTyped]')); await wait(1500);
        const chip = p.locator('#zzChips [data-act=zzPut]').first(); if (await chip.count()) { await tapAt(p, chip); await wait(1300); }
        await tapAt(p, p.locator('#zsheet [data-act=zsDone]')); await wait(1600);
    });
    await c1.close();
    // ③④: 예시 데이터로
    const c2 = await context(b, pred), sq = (set.q ? set.q + '&' : '?') + 'sample=' + set.sample;
    await shoot(c2, tmp, o('find'), async (p, start) => {
        await p.goto(BASE + 'v2/' + sq + '#/'); await p.waitForSelector('#q'); await p.evaluate(() => document.fonts.ready); await wait(2200); // 첫 줄 타이핑이 끝나게
        await titleCard(p, start, '3', '찾기', '치거나 말하면 그 칸이 보여요');
        await tapAt(p, p.locator('#q')); await wait(300);
        await p.keyboard.type('ㄱㅈㅈ', { delay: 260 }); await wait(1100);
        await tapAt(p, p.locator('#s-home [data-act]').filter({ hasText: '건전지' }).first()); await wait(2600);
        await p.evaluate(() => window.scrollBy({ top: 330, behavior: 'smooth' })); await wait(2200);
    });
    await shoot(c2, tmp, o('list'), async (p, start) => {
        await p.goto(BASE + 'v2/' + sq + '#/map/' + set.map); await p.waitForSelector('#s-map .mf-sec'); await p.evaluate(() => document.fonts.ready); await wait(900);
        await titleCard(p, start, '4', '지도·인쇄', '뭐가 어디 있는지 한눈에');
        for (let k = 0; k < 3; k++) { await p.evaluate(() => window.scrollBy({ top: 430, behavior: 'smooth' })); await wait(900); }
        await p.evaluate(() => { location.hash = '#/print'; }); await p.waitForSelector('#s-print'); await wait(2200);
        const lab = p.locator('#s-print [data-act]').filter({ hasText: '칸 라벨' }).first(); if (await lab.count()) { await tapAt(p, lab); await wait(2200); }
    });
    await c2.close();
    fs.rmSync(tmp, { recursive: true, force: true });
}

(async () => {
    const pick = process.argv[2], b = await chromium.launch();
    for (const name of pick ? [pick] : Object.keys(SETS)) await record(b, name);
    await b.close();
})();
