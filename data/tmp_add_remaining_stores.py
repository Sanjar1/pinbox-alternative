import json
import urllib.request

TOKEN = "9ef36758fb840f45fd63ff5ca9ddf5c53feb4564"
ORG_ID = "70000001036827089"
NAME = "Сырная лавка, магазин, ООО Cheese Day"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

# High-confidence building-level matches from current Excel base.
CANDIDATES = [
    {"row": 7, "internal_id": "Лавка Буз бозор", "building_id": "70030076172821387", "address": "Сайрам, 37Б"},
    {"row": 10, "internal_id": "Лавка Госпитальный", "building_id": "70030076395188270", "address": "Мирабад 1-ая, 43"},
    {"row": 15, "internal_id": "Лавка Аския", "building_id": "70030076172613976", "address": "улица Шота Руставели, 48"},
    {"row": 23, "internal_id": "Лавка Чилонзор 21", "building_id": "70030076171957934", "address": "Катта Хирмонтепа, 1"},
    {"row": 26, "internal_id": "Лавка Чирчик", "building_id": "70030076411814630", "address": "улица Ш.Рашидова, 14"},
]


def get_json(url, headers=None, method="GET", body=None):
    req = urllib.request.Request(url, data=body, headers=headers or {}, method=method)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def get_city_for_building(building_id: str):
    url = (
        "https://catalog.api.2gis.com/3.0/items/byid"
        f"?id={building_id}&fields=items.adm_div,items.address_name&key=rupycp2722"
    )
    data = get_json(url)
    items = data.get("result", {}).get("items", [])
    if not items:
        return None
    adm = items[0].get("adm_div") or []
    city = None
    for part in adm:
        if part.get("type") in ("city", "settlement"):
            city = part
            break
    if not city:
        return None
    return {
        "id": str(city.get("id")),
        "name": city.get("name"),
        "type": "byGeometryId",
        "originalName": None,
    }


def main():
    existing_buildings = set()
    page = 1
    while True:
        branches = get_json(
            f"https://api.account.2gis.com/api/1.0/branches?orgId={ORG_ID}&pageSize=60&page={page}",
            headers={"Authorization": f"Bearer {TOKEN}"},
        )
        items = branches.get("result", {}).get("items", [])
        if not items:
            break
        for x in items:
            existing_buildings.add(str(x.get("buildingId")))
        if len(items) < 60:
            break
        page += 1

    results = []
    for c in CANDIDATES:
        bid = c["building_id"]
        if bid in existing_buildings:
            results.append(
                {
                    "row": c["row"],
                    "internal_id": c["internal_id"],
                    "building_id": bid,
                    "status": "skipped_existing_building",
                }
            )
            continue
        city = get_city_for_building(bid)
        if not city:
            results.append(
                {
                    "row": c["row"],
                    "internal_id": c["internal_id"],
                    "building_id": bid,
                    "status": "error_no_city",
                }
            )
            continue
        body = {
            "orgId": ORG_ID,
            "name": NAME,
            "address": c["address"],
            "buildingId": bid,
            "contacts": [],
            "city": city,
        }
        payload = json.dumps(body, ensure_ascii=False).encode("utf-8")
        try:
            resp = get_json("https://api.account.2gis.com/api/1.0/branches", headers=HEADERS, method="POST", body=payload)
            results.append(
                {
                    "row": c["row"],
                    "internal_id": c["internal_id"],
                    "building_id": bid,
                    "status": "created",
                    "tmp_id": resp.get("result", {}).get("tmpId"),
                    "city": city,
                }
            )
        except Exception as exc:
            results.append(
                {
                    "row": c["row"],
                    "internal_id": c["internal_id"],
                    "building_id": bid,
                    "status": "error_create",
                    "error": str(exc),
                }
            )

    with open("data/2gis_added_stores_safe_batch.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
