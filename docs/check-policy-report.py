from pathlib import Path
import json, re

p = Path(__file__).resolve().parent / 'crawl-allowlist.md'
s = p.read_text(encoding='utf-8')
print('Report:',p,'bytes:',p.stat().st_size)
print('Conclusions:',re.findall(r'\*\*结论：([^。]+)。',s))
quotes=re.findall('“([^”]+)”',s)
counts=[(q,len(q.split())) for q in quotes if re.fullmatch(r'[A-Za-z ,.-]+',q)]
print('English quotes:',counts)
assert all(n<=15 for q,n in counts)
assert s.count('**结论：')==12
assert '上线前需请新西兰律师复核' in s
entries=json.loads((p.parent/'crawl-evidence/manifest.json').read_text(encoding='utf-8'))
assert all('/robots.txt' in x['url'] or any(t in x['url'].lower() for t in ('terms','conditions')) for x in entries)
print('Policy requests logged:',len(entries),'all explicit policy URLs')
print('PASS: structure, quote length, required notice, request scope')
