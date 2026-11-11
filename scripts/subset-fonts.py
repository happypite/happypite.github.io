"""Regenerate first-screen fonts; full original fonts remain the fallback.

Requires fonttools[woff]==4.68.0 (build output is committed, not generated in CI).
"""
from pathlib import Path
import hashlib, json, re, sys

root = Path(__file__).resolve().parents[1]
local_runtime = root / '.local/font-runtime'
if local_runtime.exists():
    sys.path.insert(0, str(local_runtime))
from fontTools import subset
from fontTools.ttLib import TTFont

fonts = root / 'web/assets/fonts'
home = (root / 'web/index.html').read_text(encoding='utf-8')
display_text = re.search(r'<section id="home".*?</section>', home, re.S).group()
display_text += '공부 기록 공간 탐색 포트폴리오 회고와 보완 계획 나에 대하여 모든 노트'
ui_text = ''.join(p.read_text(encoding='utf-8') for p in (root / 'web').rglob('*')
                  if p.suffix in ('.html', '.js') and 'vendor' not in p.parts)
ascii_points = set(range(0x20, 0x7f))
def characters(text):
    return ascii_points | {ord(c) for c in text if 0xAC00 <= ord(c) <= 0xD7A3 or c in '·←→↗×⌕＋–…'}

faces = [('GowunBatang-Regular', 'Gowun Batang', '400', characters(display_text)),
         ('GowunBatang-Bold', 'Gowun Batang', '700', characters(display_text)),
         ('PretendardVariable', 'Pretendard Variable', '45 920', characters(ui_text))]
rules, manifest = [], []
for stem, family, weight, requested in faces:
    font = TTFont(fonts / (stem + '.woff2'))
    points = requested & set(font.getBestCmap())
    options = subset.Options()
    options.flavor = 'woff2'
    worker = subset.Subsetter(options=options)
    worker.populate(unicodes=points)
    worker.subset(font)
    temporary = root / '.local' / (stem + '-critical.woff2')
    temporary.parent.mkdir(exist_ok=True)
    font.save(temporary)
    data = temporary.read_bytes()
    digest = hashlib.sha256(data).hexdigest()[:10]
    name = stem + '-critical-' + digest + '.woff2'
    (fonts / name).write_bytes(data)
    actual = set(TTFont(fonts / name).getBestCmap())
    assert points <= actual, 'Subset lost a required first-screen glyph'
    ranges = ','.join('U+' + format(p, 'X') for p in sorted(points))
    rules.append("@font-face{font-family:'" + family + "';src:url('./fonts/" + name + "') format('woff2');font-style:normal;font-weight:" + weight + ";font-display:swap;unicode-range:" + ranges + "}")
    manifest.append(dict(file=name, family=family, weight=weight, bytes=len(data), codepoints=sorted(points)))
    print(stem, len(points), 'glyphs:', len(data), 'bytes')
(root / 'web/assets/font-subsets.css').write_text('\n'.join(rules) + '\n', encoding='utf-8')
(root / 'web/assets/font-subsets.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
