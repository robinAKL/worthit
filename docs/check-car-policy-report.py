"""Check report/evidence consistency without making network requests."""
from pathlib import Path
from collections import Counter
from urllib.parse import urlparse
import hashlib,json,re,sys

sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).resolve().parent
s=(root/'crawl-allowlist-cars.md').read_text(encoding='utf-8')
evidence=root/'crawl-evidence-cars'
d=json.loads((evidence/'manifest.json').read_text(encoding='utf-8'))
sites=d['sites']
assert len(sites)==43 and len({x['key'] for x in sites})==43
assert len(re.findall(r'^### \d+\.',s,re.M))==43
counts=Counter(x['conclusion'] for x in sites)
assert dict(counts)==d['counts']=={'不确定':27,'禁止':15,'可采集':1}
assert [x['key'] for x in sites if x['conclusion']=='可采集']==['budget']
assert {x['type'] for x in sites}=={'聚合平台','经销商集团','拍卖与进口商及独立车行'}
for x in sites:
 assert x['reviewedPageCount']==len(set(x['openedUrls']))<=5,x['key']
 assert len(x['requests'])<=5
 assert not x['fullPolicyPublished']
 if x.get('quote'):assert len(x['quote'].split())<=15,(x['key'],x['quote'])
 if x.get('robotsFile'):
  p=evidence/x['robotsFile']
  normalized='\n'.join(t.rstrip() for t in p.read_text(encoding='utf-8').splitlines()).rstrip()+'\n'
  assert hashlib.sha256(normalized.encode()).hexdigest()==x['publishedRobotsSha256'],x['key']
 assert not any(re.search(r'/used-car-for-sale/|/api/marketplace/.*/products|/vehicle/\d+',u) for u in x['openedUrls'])
for q in re.findall('“([^”]+)”',s):
 if q.isascii():assert len(q.split())<=15,q
for link in re.findall(r'\]\(([^)]+)\)',s):
 if not urlparse(link).scheme:assert (root/link).exists(),link
assert '上线前需请新西兰律师复核' in s
assert '图片热链也是展示' in s
assert not any(p.name.endswith('-terms.txt') or '-policy' in p.name for p in evidence.iterdir())
print('PASS: 43 unique sites; 1 factual candidate, 15 restricted, 27 uncertain; three categories')
print('PASS: every site <=5 opened URLs / HTTP attempts; quotes <=15 words; local links and robots hashes')
print('PASS: only robots snapshots published; no vehicle detail requests or image permission assumed')
