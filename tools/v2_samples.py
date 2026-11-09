# v2(새 화면)용 예시 데이터: v1 index.html의 SAMPLE_DEMO_DATA·SAMPLE_ORGANIZER_DATA를 그대로 꺼내 JSON으로 둔다.
# v1 예시를 고쳤으면 이걸 다시 돌린다:  python3 tools/v2_samples.py
import json, re, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'index.html').read_text(encoding='utf-8')
found = {}
for line in src.split('\n'):
    m = re.match(r'\s*const (SAMPLE_DEMO_DATA|SAMPLE_ORGANIZER_DATA) = (.*);\s*$', line)
    if m:
        found[m.group(1)] = json.loads(m.group(2))
for key, name in (('SAMPLE_DEMO_DATA', 'sample-store.json'), ('SAMPLE_ORGANIZER_DATA', 'sample-home.json')):
    out = root / 'v2' / name
    out.write_text(json.dumps({'savedSystemData': found[key]['savedSystemData'], 'baseItems': found[key].get('baseItems', [])}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(out.relative_to(root), out.stat().st_size, 'bytes')
