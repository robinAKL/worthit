from pathlib import Path
import json, re, sys
from urllib.parse import urlparse

sys.stdout.reconfigure(encoding='utf-8')

p = Path(__file__).resolve().parent / 'crawl-allowlist.md'
s = p.read_text(encoding='utf-8')
print('Report:',p,'bytes:',p.stat().st_size)
print('Conclusions:',re.findall(r'\*\*结论：([^。]+)。',s))
quotes=re.findall('“([^”]+)”',s)
counts=[(q,len(q.split())) for q in quotes if re.fullmatch(r'[A-Za-z ,.-]+',q)]
print('English quotes:',counts)
assert all(n<=15 for q,n in counts)
assert s.count('**结论：')==33
assert '上线前需请新西兰律师复核' in s
entries=json.loads((p.parent/'crawl-evidence/manifest.json').read_text(encoding='utf-8'))
assert all('/robots.txt' in x['url'] or any(t in x['url'].lower() for t in ('terms','conditions')) for x in entries)
print('Policy requests logged:',len(entries),'all explicit policy URLs')
batch=s.split('## 第二批：',1)[1].split('## 单站补充',1)[0]
assert len(re.findall(r'^### \d+\.',batch,re.M))==20
assert batch.count('**结论：允许。**')==2
assert batch.count('**结论：禁止。**')==17
assert batch.count('**结论：不明确。**')==1
candidates=json.loads((p.parent/'crawl-candidates-batch2.json').read_text(encoding='utf-8'))
assert candidates['activeCollector'] is False
assert {x['name'] for x in candidates['candidates']}=={'Ascent','Baby Factory NZ'}
assert all(not x['affirmativePermissionVerified'] and not x['productUrlsTested'] for x in candidates['candidates'])
batchlog=json.loads((p.parent/'crawl-evidence-batch2/manifest.json').read_text(encoding='utf-8'))
assert len(batchlog)==40 and len({x['key'].rsplit('-',1)[0] for x in batchlog})==20
first_domains={urlparse(x['url']).netloc for x in entries}
batch_domains={urlparse(x['url']).netloc for x in batchlog if x['key'].endswith('-robots')}
assert not first_domains & batch_domains
assert all(x.get('snapshotPublished')==x['key'].endswith('-robots') for x in batchlog)
assert all('file' not in x for x in batchlog if x['key'].endswith('-terms'))
for x in batchlog:
 if x.get('file'): assert (p.parent/'crawl-evidence-batch2'/x['file']).exists()
print('Batch 2: 20 new sites; allowed 2, prohibited 17, unclear 1; 40 policy-only request records; no published terms snapshots')
kogan=s.split('## 单站补充',1)[1]
assert '**结论：禁止。**' in kogan and '### 33. Kogan NZ' in kogan
assert 'https://www.kogan.com/robots.txt' in kogan
assert all(t in kogan for t in ('HK条款§13.1','TPS条款§10.1','API存在已核实','未核实'))
print('Kogan supplement: root robots, NZ terms and separate KA/HK/TPS scopes, publisher permission not assumed from seller API')
print('PASS: structure, quote length, required notice, request scope')
