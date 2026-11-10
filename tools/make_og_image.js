// 카톡·SNS 미리보기 그림 다시 뽑기: tools/og-image.html → og-image.png (1200×630)
//   node tools/make_og_image.js      (playwright 필요 · 글꼴은 Google Fonts에서 받는다)
//   다 뽑은 뒤 각 페이지의 og-image.png?v= 숫자를 올린다
const path = require('path');
const { chromium } = require('playwright');
(async () => {
    const root = path.join(__dirname, '..');
    const b = await chromium.launch();
    const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await p.goto('file://' + path.join(__dirname, 'og-image.html'));
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(500);
    const ok = await p.evaluate(() => document.fonts.check('700 40px "Gowun Batang"', '오브젯도') && document.fonts.check('700 40px "Noto Sans KR"', '사진'));
    if (!ok) { console.error('글꼴을 못 받았어요 (인터넷 확인) — 그림을 만들지 않았어요'); await b.close(); process.exit(1); }
    await p.screenshot({ path: path.join(root, 'og-image.png') });
    await b.close();
    console.log('og-image.png 만들었어요');
})();
