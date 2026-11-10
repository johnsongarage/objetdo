#!/usr/bin/env python3
"""서비스 이름 한 번에 바꾸기: python3 tools/rename_app.py 새이름

앱 안의 글자·파일 이름·인쇄물은 예전 화면 v1.html 맨 위 APP_NAME 하나를 쓴다 (새 화면 v2/는 v2/settings.js의 APP_NAME · v2/print.js의 PRINT_APP_NAME).
검색·카톡 미리보기와 홈 화면 설치 이름은 스크립트 없이 읽히는 글자라 따로 적혀 있어서, 이 스크립트가 같이 바꾼다.
  - v1.html: APP_NAME, <title>, 공유 미리보기(og) 글, 아이폰 홈 화면 이름, 본문 기본 글자
  - index.html(기본 주소 → 새 화면으로 넘기는 페이지) · v2/index.html · v2/*.js: 제목·공유 미리보기 글·APP_NAME·화면 글자
  - manifest.webmanifest: 설치 이름(name, short_name)
  - server/ai-proxy.gs: 맨 위 설명 주석
손으로 해야 하는 것 (끝나면 다시 알려 준다): og-image.png 그림 속 글자(tools/og-image.html 고치고 node tools/make_og_image.js), 카톡 채널 이름
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

def main():
    if len(sys.argv) != 2 or not sys.argv[1].strip():
        sys.exit('사용법: python3 tools/rename_app.py 새이름')
    new = sys.argv[1].strip()
    html_p = ROOT / 'v1.html'
    html = html_p.read_text(encoding='utf-8')
    m = re.search(r"const APP_NAME = '([^']*)';", html)
    if not m:
        sys.exit('v1.html에서 APP_NAME을 찾지 못했어요')
    old = m.group(1)
    if old == new:
        sys.exit(f'이미 이름이 "{new}"예요')
    if "'" in new or '"' in new or '<' in new or '>' in new or '`' in new:
        sys.exit('이름에 따옴표·꺾쇠는 쓸 수 없어요')

    n_html = html.count(old)
    html_p.write_text(html.replace(old, new), encoding='utf-8')
    for extra in [ROOT / 'index.html', ROOT / 'v2' / 'index.html'] + sorted((ROOT / 'v2').glob('*.js')):
        if extra.exists():
            t = extra.read_text(encoding='utf-8'); n_html += t.count(old); extra.write_text(t.replace(old, new), encoding='utf-8')

    man_p = ROOT / 'manifest.webmanifest'
    man = json.loads(man_p.read_text(encoding='utf-8'))
    man['name'] = man['name'].replace(old, new)
    man['short_name'] = man['short_name'].replace(old, new)
    man_p.write_text(json.dumps(man, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    gs_p = ROOT / 'server' / 'ai-proxy.gs'
    if gs_p.exists():
        gs_p.write_text(gs_p.read_text(encoding='utf-8').replace(old, new), encoding='utf-8')

    print(f'"{old}" → "{new}" (v1.html·index.html·v2 {n_html}곳, manifest, ai-proxy.gs 주석)')
    print('남은 일: og-image.png 그림 속 글자 새로 만들기(tools/og-image.html → node tools/make_og_image.js) · v1.html·index.html·v2/index.html의 og-image.png?v= 숫자 올리기 · 카톡 채널 이름')

if __name__ == '__main__':
    main()
