import json, re, urllib.request
from difflib import SequenceMatcher

TOKEN = '9ef36758fb840f45fd63ff5ca9ddf5c53feb4564'
ORG_ID = '70000001036827089'

def get_json(url):
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {TOKEN}'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode('utf-8'))

branches = get_json(f'https://api.account.2gis.com/api/1.0/branches?orgId={ORG_ID}&fields=schedule&pageSize=60&page=1')['result']['items']
rows = json.load(open('data/stores_audit_clean.json', encoding='utf-8'))

REPL = {
    'улица ': '', 'ул. ': '', 'проспект ': '', 'массив ': '', 'район': '',
    'ташкент,': '', 'ташкентская область,': '', 'toshkent,': '',
    'г.': '', 'ш.': '', ' ': ''
}

def norm(s):
    if not s:
        return ''
    s = s.lower().replace('ё','е')
    s = s.replace('ʼ', "'").replace('ʻ', "'")
    s = re.sub(r'[^a-zа-я0-9/]+', ' ', s)
    for a,b in REPL.items():
        s = s.replace(a,b)
    return ''.join(s.split())

bdata = []
for b in branches:
    s = b.get('schedule',{}).get('days',{})
    daily = None
    if s:
        vals = {(v.get('from'), v.get('to')) for v in s.values() if isinstance(v, dict)}
        if len(vals)==1:
            fr,to = list(vals)[0]
            if fr and to:
                daily = f'{fr}-{to}'
    bdata.append({
        'id': b['id'],
        'address': b.get('address') or '',
        'norm': norm(b.get('address') or ''),
        'name': b.get('name') or '',
        'daily_hours': daily,
        'raw_schedule': b.get('schedule')
    })

for r in rows:
    r['brand'] = (r.get('Название в Яндекс') or '').strip()
    r['hours'] = (r.get('Время работы') or '').strip()
    r['address'] = (r.get('Адрес (Яндекс)') or '').strip()
    r['norm'] = norm(r['address'])

matches=[]
unmatched=[]
used=set()
for r in rows:
    if not r['address'] or r['address']=='-':
        unmatched.append({'row': r['#'], 'reason':'no_address', 'brand':r['brand'], 'internal':r.get('Внутренний ID\n(заполнить)'), 'hours':r['hours']})
        continue
    best=None
    for b in bdata:
        score = SequenceMatcher(None, r['norm'], b['norm']).ratio()
        if r['norm'] and (r['norm'] in b['norm'] or b['norm'] in r['norm']):
            score += 0.25
        if not best or score>best[0]:
            best=(score,b)
    if best and best[0] >= 0.62:
        b=best[1]
        if b['id'] in used:
            unmatched.append({'row': r['#'], 'reason':'duplicate_best_match', 'brand':r['brand'], 'internal':r.get('Внутренний ID\n(заполнить)'), 'address':r['address'], 'best_branch':b['id'], 'best_address':b['address'], 'best_score':round(best[0],3)})
            continue
        used.add(b['id'])
        hour_mismatch = bool(r['hours'] and r['hours']!='—' and b['daily_hours'] and r['hours']!=b['daily_hours'])
        matches.append({
            'row': r['#'],
            'internal': r.get('Внутренний ID\n(заполнить)'),
            'brand_excel': r['brand'],
            'hours_excel': r['hours'],
            'address_excel': r['address'],
            'branch_id': b['id'],
            'branch_address': b['address'],
            'branch_name': b['name'],
            'branch_daily_hours': b['daily_hours'],
            'score': round(best[0],3),
            'hour_mismatch': hour_mismatch,
            'brand_mismatch': (r['brand'].upper()=='RUBA' and 'сырная' in b['name'].lower())
        })
    else:
        unmatched.append({'row': r['#'], 'reason':'no_match', 'brand':r['brand'], 'internal':r.get('Внутренний ID\n(заполнить)'), 'address':r['address'], 'hours':r['hours'], 'best_score': round(best[0],3) if best else None, 'best_address': best[1]['address'] if best else None})

report={
    'excel_rows': len(rows),
    'branches_2gis': len(bdata),
    'matched': len(matches),
    'unmatched': len(unmatched),
    'hour_mismatches': [m for m in matches if m['hour_mismatch']],
    'brand_mismatches': [m for m in matches if m['brand_mismatch']],
    'unmatched_rows': unmatched,
    'matches': matches
}
open('data/2gis_sync_diff.json','w',encoding='utf-8').write(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'excel_rows':report['excel_rows'],'branches_2gis':report['branches_2gis'],'matched':report['matched'],'unmatched':report['unmatched'],'hour_mismatches':len(report['hour_mismatches']),'brand_mismatches':len(report['brand_mismatches'])},ensure_ascii=False))
