#!/usr/bin/env python3
"""Refresh the latest uploads using the official public YouTube channel feed."""
from datetime import datetime, timezone
import json
from pathlib import Path
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

CHANNEL_ID = "UCFkG0R18Sh66VgZMfCcndfA"
URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
ATOM = "{http://www.w3.org/2005/Atom}"
YT = "{http://www.youtube.com/xml/schemas/2015}"

request = Request(URL, headers={"User-Agent": "DaveFerryMotorsWebsite/1.0"})
with urlopen(request, timeout=30) as response:
    xml = response.read()
root = ET.fromstring(xml)
entries = []
for e in root.findall(f"{ATOM}entry"):
    video_id = (e.findtext(f"{YT}videoId") or "").strip()
    title = (e.findtext(f"{ATOM}title") or "").strip()
    published = (e.findtext(f"{ATOM}published") or "").strip()
    if video_id and title and published:
        entries.append({"id": video_id, "title": title, "published": published,
                        "url": f"https://www.youtube.com/watch?v={video_id}"})
entries.sort(key=lambda x: x["published"], reverse=True)
if not entries:
    raise RuntimeError("The YouTube feed returned no entries; leaving current list unchanged")
data = {"source": "Dave Ferry Motors YouTube channel", "updated_at": datetime.now(timezone.utc).isoformat(),
        "videos": entries[:3]}
path = Path("data/latest-videos.json")
path.parent.mkdir(parents=True, exist_ok=True)
# Do not create a commit solely because the timestamp changed.
if path.exists():
    try:
        old = json.loads(path.read_text(encoding="utf-8"))
        if old.get("videos") == data["videos"]:
            raise SystemExit(0)
    except json.JSONDecodeError:
        pass
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
