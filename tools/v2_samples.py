# v2(새 화면)용 예시 데이터를 만든다:  python3 tools/v2_samples.py
#   v1(예전 화면 v1.html)의 SAMPLE_DEMO_DATA·SAMPLE_ORGANIZER_DATA에서 사진을 골라 오고, 맨 앞에 '공간 사진'(배치도)을 붙인다 (11/10).
#   - 매장 예시: 업종 7개를 섞던 것 → '카페 한 곳' 4장, 입구에서 걸어 들어가는 순서 (카운터 하부장 → 바 상부장 → 창고 선반 → 창고 냉동고)
#   - 집 예시: 거실 수납장 → 거실 서랍 → 안방 붙박이장 맨 위
#   - 배치도 그림: tools/sample-plans/*.svg → 가로 1600 JPEG(*.jpg)로 그려 둔 것을 넣는다 (SVG를 고치면 JPEG도 다시 그릴 것)
#   v1 예시는 그대로 둔다 (v1은 공간 사진을 모른다)
#   - 11/10: 매장 예시의 카운터 하부장·창고 냉동고는 그림 → 실제 같은 사진 (가르시아가 AI로 만들어 옴, tools/sample-photos/*.jpg:
#     냉동고는 왼쪽 벗겨진 벽·바닥과 아래 Gemini 표시를, 하부장은 아래 표시 띠를 잘라내고 상품권 묶음 위 엉터리 글자를 흐리게, 가로 1200).
#     칸 이름·물건은 그대로, 칸 위치만 새 사진에 맞춘다 (가로 800 기준 좌표)
import base64, json, pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'v1.html').read_text(encoding='utf-8')  # 11/10부터 v1은 v1.html (index.html은 새 화면으로 넘기는 얇은 페이지)
found = {}
for line in src.split('\n'):
    m = re.match(r'\s*const (SAMPLE_DEMO_DATA|SAMPLE_ORGANIZER_DATA) = (.*);\s*$', line)
    if m:
        found[m.group(1)] = json.loads(m.group(2))

def plan(name):
    return 'data:image/jpeg;base64,' + base64.b64encode((root / 'tools' / 'sample-plans' / f'{name}.jpg').read_bytes()).decode()

def jpg(name):
    return 'data:image/jpeg;base64,' + base64.b64encode((root / 'tools' / 'sample-photos' / f'{name}.jpg').read_bytes()).decode()

def pick(data, order):  # [(사진 id, 새 이름 또는 None)] 순서대로
    by_id = {str(p['id']): p for p in data['savedSystemData']}
    out = []
    for pid, title in order:
        p = dict(by_id[pid])
        if title:
            p['title'] = title
        out.append(p)
    return out

def space(pid, title, img, zones, photos):  # zones: [(x, y, w, h, 가구 사진 id)] — 좌표는 가로 800 기준 (그림과 같은 칸)
    names = {str(p['id']): p['title'] for p in photos}
    return {'id': pid, 'title': title, 'space': True, 'imgData': img,
            'zones': [{'x': x, 'y': y, 'w': w, 'h': h, 'name': names[link], 'items': [], 'link': link} for x, y, w, h, link in zones]}

# 매장(카페) — 배치도 네모 위치는 tools/sample-plans/store-plan.svg의 가구와 같다
store_photos = pick(found['SAMPLE_DEMO_DATA'], [
    ('1790000000204', None),           # 카운터 하부장
    ('1790000000001', '바 상부장'),      # 카페 상부장
    ('1790000000201', '창고 선반'),      # 카페 창고 선반
    ('1790000000203', '창고 냉동고'),    # 냉동고
])
# 그림이던 두 장을 사진으로: 사진 id → (사진 파일, 칸 위치 [(x, y, w, h)] — 지금 칸 순서와 같게)
NEW_STORE_PHOTOS = {
    '1790000000204': ('store-counter', [(10, 114, 384, 137), (406, 114, 384, 137), (82, 252, 312, 225), (406, 252, 274, 225)]),  # 왼쪽 서랍 · 오른쪽 서랍 · 왼쪽 칸 · 오른쪽 칸
    '1790000000203': ('store-freezer', [(76, 157, 167, 190), (243, 157, 152, 190), (395, 157, 170, 190), (71, 361, 172, 196), (243, 361, 152, 196), (395, 361, 171, 196)]),  # 위 1~3번 통 · 아래 1~3번 통
}
for p in store_photos:
    if p['id'] in NEW_STORE_PHOTOS:
        img, boxes = NEW_STORE_PHOTOS[p['id']]
        assert len(boxes) == len(p['zones']), p['title']
        p['imgData'] = jpg(img)
        p['zones'] = [dict(z, x=x, y=y, w=w, h=h) for z, (x, y, w, h) in zip(p['zones'], boxes)]
STORE_PLAN_ZONES = [
    (466, 296, 64, 208, '1790000000204'),
    (714, 266, 64, 218, '1790000000001'),
    (552, 26, 218, 60, '1790000000201'),
    (672, 114, 98, 92, '1790000000203'),
]
store = [space('1790000000200', '매장 배치도', plan('store-plan'), STORE_PLAN_ZONES, store_photos)] + store_photos
# 자주 쓰는 물건: 카페 목록 (v2/domain.js INDUSTRY_TEMPLATES.cafe와 같다)
CAFE_ITEMS = ['원두', '우유', '바닐라 시럽', '헤이즐넛 시럽', '카라멜 소스', '초코 소스', '휘핑크림', '테이크아웃 컵(HOT)', '테이크아웃 컵(ICE)', '컵 뚜껑',
              '빨대', '컵홀더', '캐리어', '냅킨', '스틱 설탕', '머들러', '일회용 스푼', '영수증 용지', '행주', '세척제']

# 집 — 배치도 네모 위치는 tools/sample-plans/home-plan.svg의 가구와 같다
home_photos = pick(found['SAMPLE_ORGANIZER_DATA'], [
    ('1790000000300', None),                  # 거실 수납장
    ('1790000000320', None),                  # 거실 서랍
    ('1790000000310', '안방 붙박이장 맨 위'),    # 붙박이장 맨 위
])
HOME_PLAN_ZONES = [
    (36, 296, 68, 178, '1790000000300'),
    (296, 484, 168, 48, '1790000000320'),
    (36, 26, 268, 58, '1790000000310'),
]
home = [space('1790000000299', '우리 집 배치도', plan('home-plan'), HOME_PLAN_ZONES, home_photos)] + home_photos

for name, photos, base in (('sample-store.json', store, CAFE_ITEMS), ('sample-home.json', home, found['SAMPLE_ORGANIZER_DATA'].get('baseItems', []))):
    out = root / 'v2' / name
    out.write_text(json.dumps({'savedSystemData': photos, 'baseItems': base}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(out.relative_to(root), out.stat().st_size, 'bytes', '·', ' / '.join(p['title'] for p in photos))
