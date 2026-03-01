import json
import re
from difflib import SequenceMatcher

rows = json.load(open("data/excel_rows_latest.json", encoding="utf-8"))
branches = json.load(open("data/2gis_branches_ascii.json", encoding="utf-16"))

rows = [r for r in rows if r["address"] not in ("", "-") and r["brand"] != "RUBA"]


def norm(text: str) -> str:
    s = (text or "").lower().replace("ё", "е").replace("ʼ", "'").replace("ʻ", "'")
    repl = {
        "улица": "",
        "ул.": "",
        "проспект": "",
        "массив": "",
        "район": "",
        "ташкент,": "",
        "ташкентская область,": "",
        "toshkent": "",
        "sh.": "",
        "квартал": "кв",
        "мсг": "",
        " ": "",
        "-": "",
    }
    for a, b in repl.items():
        s = s.replace(a, b)
    s = re.sub(r"[^a-zа-я0-9]+", "", s)
    return s


candidates = []
for r in rows:
    rn = norm(r["address"])
    for b in branches:
        bn = norm(b["address"])
        score = SequenceMatcher(None, rn, bn).ratio()
        if rn and (rn in bn or bn in rn):
            score += 0.2
        candidates.append((score, r, b))

candidates.sort(key=lambda x: x[0], reverse=True)

used_rows = set()
used_branches = set()
matches = []

for score, r, b in candidates:
    if r["row"] in used_rows or b["id"] in used_branches:
        continue
    if score < 0.42:
        continue
    used_rows.add(r["row"])
    used_branches.add(b["id"])
    matches.append(
        {
            "score": round(score, 3),
            "row": r["row"],
            "internal_id": r["internal_id"],
            "excel_address": r["address"],
            "excel_hours": r["hours"],
            "branch_id": b["id"],
            "branch_address": b["address"],
            "branch_hours": b["hours"],
        }
    )

unmatched_rows = [r for r in rows if r["row"] not in used_rows]
unmatched_branches = [b for b in branches if b["id"] not in used_branches]

print(json.dumps({"matches": len(matches), "unmatched_rows": len(unmatched_rows), "unmatched_branches": len(unmatched_branches)}, ensure_ascii=False))
for m in matches:
    print(
        f"{m['score']} row {m['row']} {m['internal_id']} -> {m['branch_id']} | {m['branch_address']} | "
        f"excel:{m['excel_hours']} branch:{m['branch_hours']}"
    )
print("unmatched_row_ids", [r["row"] for r in unmatched_rows])
print("unmatched_branch_ids", [b["id"] for b in unmatched_branches])
