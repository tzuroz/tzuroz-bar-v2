#!/usr/bin/env python3
"""Store cocktail photos in images/ and point the recipe data at the local copies.

For every cocktail whose "Image" is a web link, this saves the picture as
images/<cocktail-name>.<ext>, changes "Image" to that local path, and keeps the
original link in "Image Source" (shown as the photo credit on the site).
Photos that can't be downloaded keep their web link, so nothing breaks.

images/sources.json remembers which link each photo came from. So when
cocktail_list1.json is exported again from the spreadsheet (which keeps web
links), photos already downloaded are reused instead of fetched again, and a
changed link downloads the new photo.

Run from the repository root:  python3 tools/download_images.py
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
SOURCES_FILE = IMAGE_DIR / "sources.json"
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


def load_sources():
    """{file name in images/: the web link it was downloaded from}"""
    try:
        return json.loads(SOURCES_FILE.read_text(encoding="utf-8"))
    except (FileNotFoundError, ValueError):
        return {}


def main():
    cocktails = json.loads(DATA_FILE.read_bytes().decode("utf-8-sig"))
    IMAGE_DIR.mkdir(exist_ok=True)
    sources = load_sources()
    file_for_link = {url: name for name, url in sources.items() if (IMAGE_DIR / name).exists()}

    saved, reused, failed = 0, 0, []
    for cocktail in cocktails:
        url = (cocktail.get("Image") or "").strip()
        if not url.lower().startswith(("http://", "https://")):
            continue  # already a local photo (or none)
        name = cocktail["Cocktail Name"]
        slug = slugify(name)

        existing = file_for_link.get(url)
        if existing and existing.rsplit(".", 1)[0] == slug:
            cocktail["Image"] = f"images/{existing}"
            cocktail["Image Source"] = url
            reused += 1
            continue

        try:
            data, ext = download(url)
        except Exception as error:  # keep the web link and carry on
            failed.append((name, str(error)))
            print(f"FAILED  {name}: {error}")
            continue

        # Replace any older photo of this cocktail (it may have another extension).
        for old in IMAGE_DIR.glob(slug + ".*"):
            if old.name in sources:
                old.unlink()
                del sources[old.name]

        file_name = slug + ext
        (IMAGE_DIR / file_name).write_bytes(data)
        sources[file_name] = url
        cocktail["Image"] = f"images/{file_name}"
        cocktail["Image Source"] = url
        saved += 1
        print(f"saved   {name} -> images/{file_name} ({len(data) // 1024} KB)")

    # Remove downloaded photos no cocktail uses any more (e.g. a renamed or deleted cocktail).
    in_use = {c.get("Image", "").removeprefix("images/") for c in cocktails}
    for file_name in list(sources):
        if file_name not in in_use:
            (IMAGE_DIR / file_name).unlink(missing_ok=True)
            del sources[file_name]
            print(f"removed images/{file_name} (no longer used)")

    SOURCES_FILE.write_text(json.dumps(dict(sorted(sources.items())), indent=1) + "\n", encoding="utf-8")
    DATA_FILE.write_bytes(format_data(cocktails).encode("utf-8"))

    print(f"\nDownloaded {saved}, reused {reused}; {len(failed)} kept their web link.")
    for name, error in failed:
        print(f"  - {name}: {error}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
