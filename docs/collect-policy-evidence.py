"""T-08 read-only policy evidence; explicit URL allowlist, no product requests."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
import hashlib, json, re
import requests

ROOT = Path(__file__).resolve().parent / 'crawl-evidence'
ROOT.mkdir(exist_ok=True)
SITES = {
    'woolworths': ('www.woolworths.co.nz', '/help/terms-conditions/online-shopping-website-app'),
    'paknsave': ('www.paknsave.co.nz', '/terms-and-conditions'),
    'newworld': ('www.newworld.co.nz', '/terms-and-conditions'),
    'warehouse': ('www.thewarehouse.co.nz', None),
    'stationery': ('www.warehousestationery.co.nz', '/c/terms-and-conditions'),
    'noelleeming': ('www.noelleeming.co.nz', None),
    'pbtech': ('www.pbtech.co.nz', '/help/article/87/terms-and-conditions'),
    'mightyape': ('www.mightyape.co.nz', None),
    'jbhifi': ('www.jbhifi.co.nz', '/pages/help-and-support/terms-of-use'),
    'kmart': ('www.kmart.co.nz', '/terms-and-conditions/'),
    'bunnings': ('www.bunnings.co.nz', '/terms-conditions/website-terms-of-use'),
    'harveynorman': ('www.harveynorman.co.nz', '/corporate-information/terms-of-use.html'),
}
class Text(HTMLParser):
    def __init__(self):
        super().__init__(); self.out=[]; self.skip=0
    def handle_starttag(self, tag, attrs):
        if tag in ('script','style'): self.skip+=1
        if tag in ('p','li','div','h1','h2','h3','h4','br'): self.out.append('\n')
    def handle_endtag(self, tag):
        if tag in ('script','style') and self.skip: self.skip-=1
    def handle_data(self, data):
        if not self.skip: self.out.append(data)
def fetch(item):
    key,url=item
    entry={'key':key,'url':url,'checkedAt':datetime.now(timezone.utc).isoformat()}
    try:
        r=requests.get(url,timeout=25)
        entry.update(status=r.status_code,finalUrl=r.url,contentType=r.headers.get('Content-Type',''),sha256=hashlib.sha256(r.content).hexdigest())
        if 'text/plain' in entry['contentType'] or (url.endswith('/robots.txt') and not r.text.lstrip().startswith('<')):
            content=r.text
        else:
            p=Text(); p.feed(r.text); content=''.join(p.out)
            content=re.sub(r'[ \t]+',' ',content); content=re.sub(r'\n\s*\n+','\n\n',content)
        (ROOT/(key+'.txt')).write_text(content,encoding='utf-8')
        entry['file']=key+'.txt'; entry['chars']=len(content)
    except requests.RequestException as e: entry['error']=str(e)
    return entry
urls=[]
for key,(domain,path) in SITES.items():
    urls.append((key+'-robots','https://'+domain+'/robots.txt'))
    if path: urls.append((key+'-terms','https://'+domain+path))
urls += [
    ('warehouse-terms','https://help.thewarehouse.co.nz/Help/s/article/Terms-and-conditions'),
    ('mightyape-terms','https://help.mightyape.co.nz/hc/en-nz/articles/115012110928-Terms-Conditions'),
]
with ThreadPoolExecutor(max_workers=6) as pool: entries=list(pool.map(fetch,urls))
(ROOT/'manifest.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2),encoding='utf-8')
for e in entries: print(e['key'],e.get('status'),e.get('chars'),e.get('error',''))
