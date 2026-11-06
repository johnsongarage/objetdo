# 이어서 하기 (다음 대화방용) — 2026-11-02 기준

> 새 대화방에서 "docs/HANDOFF.md 읽고 이어서 하자"라고 하면 된다.
> 사업 쪽 상태는 hq `projects/udigo.md`가 기준이다 (이 파일은 작업 맥락·방법 정리).

## 지금 상태
- 앱 이름 **오브젯도 (Objetdo)**, 옛 이름 창고여지도. 앱 버전 **베타 2026.11.02.13**
- 저장소 `johnsongarage/udigo` (GitHub 도구에선 owner `trafficjourney`로 불러도 넘어감), 작업 브랜치 `claude/relaxed-archimedes-1zuo3k`
- 앱 https://johnsongarage.github.io/objetdo/ · 랜딩 https://johnsongarage.github.io/objetdo/start/
- 홈페이지 저장소 `johnsongarage/johnsongarage.github.io` (같은 브랜치 이름), 사업 본부 `kery27/hq`
- 미배포 커밋 없음 (마지막 배포 #254)

## 최근 배포 (11/1~11/2, #223~#254)
- 집·정리 모드 / 매장 모드(`?mode=home|store`, 적용 후 주소에서 지움), 매장 정돈 테마 기본, 효과(fx) 끔 기본
- 찾기만 화면(`simpleView`), 첫 화면: 타자 질문 `_` 커서 + 큰 동그라미 마이크 + 내 물건 말풍선 + 공간 카드, ☰ 메뉴(PC는 사이드바)
- 구역 창 정리(담긴 물건 위, 마이크 하나, 말로 넣으면 체크 목록에서 골라 넣기), 물건 전체 목록(공간별·가나다순)
- AI 칸 찾기 무료 기기당 10번 + 서버 기기당 하루 15번 (`server/ai-proxy.gs`, Apps Script 재배포 완료)
- 사용법 영상 4개(`guide/`), 이름 오브젯도로 변경, 아이콘·카톡 미리보기 정돈 톤
- 랜딩 오브젯도 톤 + 감자꽃 손글씨 포스트잇 + Noto Sans KR, 세팅 이벤트 **11/30 · 선착순 5팀**
- #253 랜딩 사진 모서리 정리
- #254 디자인 점검 반영: 검색 예시를 내 물건 이름으로, 말로 찾기 판 먹색(효과 끔일 때), 집 모드 '머리글 이름'·방문 세팅 이벤트 숨김, PC 지도 사진·목록 두 칸(1024px+), 폰 지도 버튼 아래 띠, 시작 화면 머리글 숨김, 구역 고치기 안내 한 줄씩, 아이콘 글꼴 3.50.0 고정

## 만들어 전달한 자료 (파일은 지난 세션 임시 폴더에만 있었음 → 사용자가 받아 둔 것 사용)
- 크몽 이미지 5장, 인스타 소개 카드 4장·하이라이트 표지 4장(밝은 톤)
- 릴스 `릴스_오브젯도_16초.mp4` (1080x1920, 소리 없음): 직원 질문 → AI 칸 나누기 → ㅇㅅㅈ로 '여깃도!' 답 카드 → 끝 카드
- 홈페이지 영상·전후 비교 사진 새 화면으로 (홈페이지 #63)

## 남은 일
- 지켜볼 것: 실제 폰에서 아이콘(지도 ⋯, 이벤트 띠 ×, 확대 ±)이 보이는지 확인 (작업 환경에선 CDN이 막혀 확인 못 함)
- PC 지도 첫 화면에서 오른쪽 아래 떠 있는 버튼이 목록 '더보기'에 살짝 걸침 (스크롤하면 숨음, 일단 둠)
- 사용자 몫: 카톡 공유 디버거 캐시, 카톡 채널 이름, 인스타 소개글·하이라이트·릴스 올리기, 크몽 제목·이미지, 구글 폼 제목·날짜(11/30·5팀), 상표 확인(kipris), 정리 전문가 DM
- **11/4 판단** (계속 / 줄여서 두기) — 기준은 `docs/ROADMAP.md`

## 일하는 방식 (사용자 약속)
- 화면을 바꾸면 스크린샷으로 보여 주고, 사용자가 **"배포"**라고 할 때만 PR 만들고 머지. 머지 뒤 `git pull origin main` 후 브랜치에 푸시
- 앱을 바꾸면 `APP_VERSION`(index.html)을 올린다
- 커밋·PR 끝에 attribution 줄, 모델 이름은 넣지 않는다
- AI로 만든 사진엔 "예시 사진 (AI로 만듦)", 사장님인 척하는 글·실사용 과장 금지, 남의 사진(인스타·inside.jfif 등) 공개 금지, '혼자 만들고 있어요' 문구 뺐음
- hq에는 고객 실데이터·개인정보·비밀번호 금지, 제안은 "제안"으로 표시, 커밋은 `[udigo] …`

## 화면 찍기·영상 방법 (지난 세션에서 쓴 것)
- 로컬 서버: `cd udigo && (python3 -m http.server 8765 >/dev/null 2>&1 &)`
- Playwright: `require('/opt/node-tools/node_modules/playwright')`
- 예시 데이터 넣기: `localStorage.setItem('savedSystemData', JSON.stringify(sampleSystemData())); localStorage.setItem('hasSavedPhotos','1'); localStorage.setItem('useMode','home'|'store')` 후 새로고침
- 자주 쓴 함수: `openHeroSpace(id)` 지도, `openModal(zone)` 구역 창, `openListView()`, `openSimpleMenu()`, `openSettingsModal()`, `toggleEditMode()`, `openStock()`, `openPrintPreview()`, `openVideoGuideModal()`
- 작업 환경은 jsdelivr이 막혀 아이콘 글꼴이 안 보인다 → 아이콘 자리가 빈 동그라미로 찍히는 건 환경 탓일 수 있음
- 영상: recordVideo는 deviceScaleFactor 1 + 크기 = 화면 크기, ffmpeg xfade 앞에 `settb=1/30,fps=30`
