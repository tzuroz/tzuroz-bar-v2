#!/usr/bin/env python3
"""Download each cocktail photo into images/ and point the recipe data at the local copy.

For every cocktail whose "Image" is a web link, this saves the picture as
images/<cocktail-name>.<ext>, changes "Image" to that local path, and keeps the
original link in "Image Source" (shown as the photo credit on the site).
Photos that can't be downloaded keep their web link, so nothing breaks.

Run from the repository root:  python3 tools/download_images.py
Safe to run again: cocktails that already use a local image are skipped.
"""

import json
import pathlib
import re
import sys
import unicodedata
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "cocktail_list1.json"
IMAGE_DIR = ROOT / "images"
MAX_BYTES = 15 * 1024 * 1024

EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/avif": ".avif",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    "Accept": "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8",
}


def slugify(name):
    """Same rule as slugify() in script.js, so file names match the page links."""
    name = unicodedata.normalize("NFD", name)
    name = re.sub(r"[\u0300-\u036f]", "", name).lower()
    name = re.sub(r"['’]", "", name)
    return re.sub(r"[^a-z0-9]+", "-", name).strip("-")


def format_data(cocktails):
    """Write the JSON in the file's existing layout (CRLF, 1/3-space indent) so diffs stay small."""
    def pair(key, value):
        return "   " + json.dumps(key, ensure_ascii=False) + ": " + json.dumps(value, ensure_ascii=False)
    items = [" {\r\n" + ",\r\n".join(pair(k, v) for k, v in c.items()) + "\r\n }" for c in cocktails]
    return "[\r\n" + ",\r\n".join(items) + "\r\n]"


def download(url):
    request = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=60) as response:
        content_type = response.headers.get_content_type()
        if content_type not in EXTENSIONS:
            raise ValueError(f"not an image ({content_type})")
        data = response.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise ValueError("image is too large")
        return data, EXTENSIONS[content_type]


def main():
    raw = DATA_FILE.read_text(encoding="utf-8")
    cocktails = json.loads(raw)
    IMAGE_DIR.mkdir(exist_ok=True)

    saved, failed = 0, []
    for cocktail in cocktails:
        url = (cocktail.get("Image") or "").strip()
        if not url.lower().startswith(("http://", "https://")):
            continue
        name = cocktail["Cocktail Name"]
        try:
            data, ext = download(url)
        except Exception as error:  # keep the web link and carry on
            failed.append((name, str(error)))
            print(f"FAILED  {name}: {error}")
            continue

        file_name = slugify(name) + ext
        (IMAGE_DIR / file_name).write_bytes(data)
        cocktail["Image"] = f"images/{file_name}"
        cocktail["Image Source"] = url
        saved += 1
        print(f"saved   {name} -> images/{file_name} ({len(data) // 1024} KB)")

    DATA_FILE.write_bytes(format_data(cocktails).encode("utf-8"))

    print(f"\nSaved {saved} image(s); {len(failed)} kept their web link.")
    for name, error in failed:
        print(f"  - {name}: {error}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
