import json, urllib.request
TOKEN='9ef36758fb840f45fd63ff5ca9ddf5c53feb4564'
ORG='70000001036827089'
req=urllib.request.Request(f'https://api.account.2gis.com/api/1.0/branches?orgId={ORG}&fields=schedule&pageSize=60&page=1', headers={'Authorization':f'Bearer {TOKEN}'})
data=json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
for b in data['result']['items']:
    d=b.get('schedule',{}).get('days',{})
    vals={(v.get('from'),v.get('to')) for v in d.values() if isinstance(v,dict)}
    hrs=''
    if len(vals)==1:
        fr,to=list(vals)[0]
        hrs=f'{fr}-{to}'
    print(f"{b['id']}\t{b.get('address','')}\t{hrs}")
