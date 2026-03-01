import json, re, urllib.request
from difflib import SequenceMatcher

TOKEN = '9ef36758fb840f45fd63ff5ca9ddf5c53feb4564'
ORG_ID = '70000001036827089'

def get_json(url):
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {TOKEN}'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode('utf-8'))

rows = json.load(open('data/stores_audit_clean.json', encoding='utf-8'))
branches = get_json(f'https://api.account.2gis.com/api/1.0/branches?orgId={ORG_ID}&fields=schedule&pageSize=60&page=1')['result']['items']

stop = set(['ташкент','район','улица','проспект','массив','область','город','квартал','махаллинский','сход','граждан','sh','toshkent'])

def tokenize(s):
    if not s: return []
    s = s.lower().replace('ё','е').replace('ʼ',"'").replace('ʻ',"'")
    s = re.sub(r'[^a-zа-я0-9]+',' ',s)
    toks=[t for t in s.split() if t and t not in stop and len(t)>1]
    return toks

def score(a,b):
    sa=set(tokenize(a)); sb=set(tokenize(b))
    j = (len(sa&sb)/len(sa|sb)) if sa and sb else 0.0
    seq = SequenceMatcher(None, ''.join(tokenize(a)), ''.join(tokenize(b))).ratio()
    num_a=set(re.findall(r'\d+[а-яa-z]?', a.lower()))
    num_b=set(re.findall(r'\d+[а-яa-z]?', b.lower()))
    num = (len(num_a&num_b)/len(num_a|num_b)) if num_a and num_b else 0.0
    return 0.45*j + 0.35*seq + 0.2*num

out=[]
out.append('=== Branch -> top Excel matches ===')
for b in branches:
    cand=[]
    for r in rows:
        if not isinstance(r.get('#'), int):
            continue
        a=r.get('Адрес (Яндекс)') or ''
        if a=='-':
            continue
        cand.append((score(b.get('address',''), a), r))
    cand.sort(key=lambda x:x[0], reverse=True)
    out.append(f"\nBRANCH {b['id']} :: {b.get('address','')}")
    for s,r in cand[:5]:
        out.append(f"  {s:.3f} | row {r['#']} | {r.get('Название в Яндекс')} | {r.get('Внутренний ID\\n(заполнить)')} | {r.get('Адрес (Яндекс)')} | {r.get('Время работы')}")

out.append('\n=== Excel -> top Branch matches ===')
for r in rows:
    if not isinstance(r.get('#'), int):
        continue
    a=r.get('Адрес (Яндекс)') or ''
    if a=='-':
        continue
    cand=[]
    for b in branches:
        cand.append((score(a, b.get('address','')), b))
    cand.sort(key=lambda x:x[0], reverse=True)
    out.append(f"\nROW {r['#']} :: {r.get('Название в Яндекс')} :: {r.get('Внутренний ID\\n(заполнить)')} :: {a} :: {r.get('Время работы')}")
    for s,b in cand[:4]:
        out.append(f"  {s:.3f} | branch {b['id']} | {b.get('address','')}")

open('data/2gis_match_candidates.txt','w',encoding='utf-8').write('\n'.join(out))
print('saved data/2gis_match_candidates.txt')
