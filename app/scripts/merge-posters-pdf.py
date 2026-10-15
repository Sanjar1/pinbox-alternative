"""Join the per-poster PDFs from generate-a5-pdf-from-printed-posters.mjs into one
print file, then prove it: render every page, decode its QR code with zbarimg and
compare against posters.json. Exit 1 on any mismatch.

Usage: python3 scripts/merge-posters-pdf.py <out-dir> <final-pdf-name>
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from pypdf import PdfReader, PdfWriter


def log(step: str, msg: str) -> None:
    print(f"[merge] {step} {msg}", flush=True)


def main() -> int:
    out_dir = Path(sys.argv[1]).resolve()
    final = out_dir / sys.argv[2]
    manifest = json.loads((out_dir / "posters.json").read_text(encoding="utf-8"))
    posters = manifest["posters"]
    log("START", f"posters={len(posters)} out={final}")

    writer = PdfWriter()
    for p in posters:
        reader = PdfReader(out_dir / p["pdf"])
        if len(reader.pages) != 1:
            log("FAIL", f"{p['store']} has {len(reader.pages)} pages, expected 1")
            return 1
        writer.add_page(reader.pages[0])
    with final.open("wb") as fh:
        writer.write(fh)
    pages = len(PdfReader(final).pages)
    box = PdfReader(final).pages[0].mediabox
    log("MERGE", f"pages={pages} size_mm={float(box.width) / 72 * 25.4:.0f}x{float(box.height) / 72 * 25.4:.0f} bytes={final.stat().st_size}")

    ok, bad = 0, []
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["pdftoppm", "-r", "150", "-png", str(final), f"{tmp}/p"], check=True)
        images = sorted(Path(tmp).glob("p-*.png"))
        if len(images) != len(posters):
            log("FAIL", f"rendered {len(images)} pages, expected {len(posters)}")
            return 1
        for img, p in zip(images, posters):
            res = subprocess.run(["zbarimg", "--quiet", "--raw", "-Sdisable", "-Sqrcode.enable", str(img)], capture_output=True, text=True)
            codes = [c for c in res.stdout.splitlines() if c.strip()]
            if codes == [p["url"]]:
                ok += 1
            else:
                bad.append(f"page {p['n']} {p['store']}: decoded={codes} expected={p['url']}")
    for b in bad:
        log("MISMATCH", b)
    log("END" if not bad else "FAIL", f"in={len(posters)} decoded_ok={ok} mismatched={len(bad)}")
    return 0 if not bad else 1


if __name__ == "__main__":
    sys.exit(main())
