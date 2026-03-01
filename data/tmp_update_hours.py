import json, urllib.request
TOKEN='9ef36758fb840f45fd63ff5ca9ddf5c53feb4564'
ORG='70000001036827089'
headers={'Authorization':f'Bearer {TOKEN}','Content-Type':'application/json'}

updates={
  '70000001052419488': ('07:00','19:00'), # улица Сакичмон, 1
  '70000001091424245': ('08:00','19:00'), # G'azalkent
  '70000001045909625': ('08:00','20:00'), # жилмассив Госпитальный, 1/1
  '70000001053010087': ('08:00','21:00'), # Гульсанам, 7а
  '70000001090902037': ('08:00','22:00'), # Катта Хирмонтепа, 65/4
  '70000001059879340': ('07:00','19:00'), # Фархадская улица, 6а/6
  '70000001075700194': ('08:00','19:00'), # улица Ш.Рашидова, 35/6
}


def put_branch(branch_id, fr, to):
    body={
      'schedule':{
        'days':{d:{'from':fr,'to':to} for d in ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']},
        'comment': None
      }
    }
    req=urllib.request.Request(
      f'https://api.account.2gis.com/api/1.0/branches/{branch_id}',
      data=json.dumps(body, ensure_ascii=False).encode('utf-8'),
      headers=headers,
      method='PUT'
    )
    with urllib.request.urlopen(req, timeout=30) as r:
      return r.status, json.loads(r.read().decode('utf-8'))

results=[]
for bid,(fr,to) in updates.items():
    try:
      status,res=put_branch(bid,fr,to)
      results.append({'branch_id':bid,'status':status,'meta':res.get('meta',{}).get('code')})
    except Exception as e:
      results.append({'branch_id':bid,'status':'error','error':str(e)})

print(json.dumps(results, ensure_ascii=False, indent=2))
