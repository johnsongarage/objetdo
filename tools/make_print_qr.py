#!/usr/bin/env python3
"""인쇄물 오른쪽 아래 QR 무늬를 만든다 (v1.html · v2/print.js의 PRINT_QR_URL · PRINT_QR 두 줄에 붙여 넣기)

    pip install segno
    python3 tools/make_print_qr.py https://johnsongarage.co.kr/objetdo/qr/

앱은 이 무늬를 그대로 그리기만 해서, 인터넷 없이도·라이브러리 없이도 인쇄된다.
"""
import json
import sys

import segno

url = sys.argv[1] if len(sys.argv) > 1 else 'https://johnsongarage.co.kr/objetdo/qr/'
qr = segno.make(url, error='m', micro=False, boost_error=False)
rows = [''.join('1' if c else '0' for c in r) for r in qr.matrix]
hexrows = [format(int(r, 2), 'x').zfill((len(r) + 3) // 4) for r in rows]
print(f"    const PRINT_QR_URL = '{url}';")
print(f"    const PRINT_QR = {json.dumps(hexrows)};")
print(f"// 버전 {qr.version}, 오류 복구 {qr.error}, {len(rows)}×{len(rows)}칸", file=sys.stderr)
