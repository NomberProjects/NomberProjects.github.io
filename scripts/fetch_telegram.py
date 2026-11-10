#!/usr/bin/env python3
"""Fetch public posts from t.me/s/NomberDev into data/telegram.json.

Uses only the Python standard library plus optional Pillow for image
compression. Telegram CDN URLs expire, so media is downloaded into
data/media/ and referenced locally. Existing posts/media are kept.
"""
from __future__ import annotations

import hashlib
import html
import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

CHANNEL = "NomberDev"
PREVIEW_URL = f"https://t.me/s/{CHANNEL}"
CHANNEL_URL = f"https://t.me/{CHANNEL}"
MAX_POSTS = 300
MAX_PAGES = 40
SLEEP = 0.7
USER_AGENT = (
    "NomberProjectsBot/1.0 (+https://nomberprojects.github.io/; "
    "feed mirror of a public Telegram channel)"
)
TIMEOUT = 30
MAX_EDGE = 1280
AVATAR_EDGE = 320
JPEG_QUALITY = 82
MAX_BYTES = 1_800_000

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
MEDIA_DIR = DATA_DIR / "media"
JSON_PATH = DATA_DIR / "telegram.json"

ALLOWED_TAGS = {
    "a", "b", "strong", "i", "em", "u", "s", "del", "ins",
    "code", "pre", "br", "blockquote", "span",
}
ALLOWED_ATTRS = {
    "a": {"href", "target", "rel"},
    "span": {"dir"},
    "blockquote": set(),
    "code": set(),
    "pre": set(),
}
SAFE_HREF = re.compile(r"^(https?:|tg:|mailto:|/)", re.I)
BG_URL = re.compile(r"background-image:\s*url\(['\"]?(.*?)['\"]?\)", re.I)
STYLE_ATTR = re.compile(r"\s+style=(['\"])(.*?)\1", re.I | re.S)
ONATTR = re.compile(r"\s+on[a-z]+=(['\"]).*?\1", re.I | re.S)


def log(msg: str) -> None:
    print(msg, flush=True)


def fetch(url: str, referer: str | None = None, binary: bool = False):
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "*/*" if binary else "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.8,ru;q=0.5",
    }
    if referer:
        headers["Referer"] = referer
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            data = resp.read()
            ctype = resp.headers.get("Content-Type", "")
            final = resp.geturl()
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code} for {url}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"Network error for {url}: {e.reason}") from e
    if binary:
        return data, ctype, final
    return data.decode("utf-8", "replace")


def absolutize(url: str) -> str:
    if not url:
        return url
    if url.startswith("//"):
        return "https:" + url
    return url


class ChannelParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.username = f"@{CHANNEL}"
        self.description_html = ""
        self.avatar = ""
        self.subscribers = ""
        self._in_title = False
        self._in_desc = False
        self._in_counter = False
        self._counter_type = ""
        self._counter_value = ""
        self._desc_parts: list[str] = []
        self._title_parts: list[str] = []
        self._capture_avatar = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = a.get("class", "")
        if "tgme_channel_info_header_title" in cls and "wrap" not in cls:
            self._in_title = True
        elif "tgme_channel_info_description" in cls:
            self._in_desc = True
        elif "tgme_page_photo_image" in cls:
            self._capture_avatar = True
        elif self._capture_avatar and tag == "img" and a.get("src"):
            self.avatar = absolutize(a["src"])
            self._capture_avatar = False
        elif "tgme_channel_info_counter" in cls and "counters" not in cls:
            self._in_counter = True
            self._counter_type = ""
            self._counter_value = ""
        if self._in_desc:
            if tag == "br":
                self._desc_parts.append("<br>")
            elif tag == "a" and a.get("href"):
                href = html.escape(a["href"], quote=True)
                self._desc_parts.append(f'<a href="{href}" target="_blank" rel="noopener">')
            elif tag in ("b", "strong", "i", "em"):
                self._desc_parts.append(f"<{tag}>")
        if "counter_value" in cls:
            self._counter_value = "__VALUE__"
        if "counter_type" in cls:
            self._counter_type = "__TYPE__"

    def handle_endtag(self, tag):
        if self._in_title and tag == "div":
            self._in_title = False
            self.title = "".join(self._title_parts).strip()
        if self._in_desc:
            if tag == "div":
                self._in_desc = False
                self.description_html = "".join(self._desc_parts).strip()
            elif tag == "a":
                self._desc_parts.append("</a>")
            elif tag in ("b", "strong", "i", "em"):
                self._desc_parts.append(f"</{tag}>")
        if self._in_counter and tag == "div":
            self._in_counter = False

    def handle_data(self, data):
        if self._in_title:
            self._title_parts.append(data)
        if self._in_desc:
            self._desc_parts.append(html.escape(data))
        if self._in_counter:
            text = data.strip()
            if not text:
                return
            # last seen spans: value then type
            if self.subscribers == "" and text and text not in {
                "subscribers", "subscriber", "photos", "photo",
                "videos", "video", "files", "file", "links", "link",
            }:
                # value might come first
                self._pending_value = text
            typ = text.lower()
            if typ in ("subscribers", "subscriber"):
                self.subscribers = getattr(self, "_pending_value", text)


def parse_channel(page: str) -> dict:
    p = ChannelParser()
    p.feed(page)
    # fallback regex in case the parser missed something
    if not p.title:
        m = re.search(
            r'class="tgme_channel_info_header_title"[^>]*>\s*<span[^>]*>([^<]+)',
            page,
        )
        p.title = html.unescape(m.group(1)).strip() if m else CHANNEL
    if not p.avatar:
        m = re.search(
            r'class="tgme_page_photo_image[^"]*"[^>]*>\s*<img[^>]+src="([^"]+)"',
            page,
        )
        if m:
            p.avatar = absolutize(m.group(1))
    if not p.subscribers:
        m = re.search(
            r'class="counter_value">([^<]+)</span>\s*<span class="counter_type">subscribers?',
            page,
            re.I,
        )
        p.subscribers = m.group(1).strip() if m else ""
    if not p.description_html:
        m = re.search(
            r'class="tgme_channel_info_description">(.*?)</div>',
            page,
            re.S,
        )
        if m:
            p.description_html = sanitize_html(m.group(1))
    else:
        p.description_html = sanitize_html(p.description_html)
    return {
        "name": p.title or "NOMBER Devlog",
        "username": CHANNEL,
        "url": CHANNEL_URL,
        "description_html": p.description_html,
        "avatar_src": p.avatar,
        "subscribers": p.subscribers,
    }


def split_messages(page: str) -> list[str]:
    parts = re.split(r'<div class="tgme_widget_message_wrap[^"]*">', page)
    return [p for p in parts[1:] if "data-post=" in p]


def parse_post_block(block: str) -> dict | None:
    m = re.search(r'data-post="([^"]+)"', block)
    if not m:
        return None
    post_ref = m.group(1)
    try:
        pid = int(post_ref.split("/")[-1])
    except ValueError:
        return None
    classes = ""
    cm = re.search(r'class="(tgme_widget_message[^"]*)"', block)
    if cm:
        classes = cm.group(1)
    if "service_message" in classes:
        return {"id": pid, "service": True}

    url_m = re.search(
        r'class="tgme_widget_message_date"[^>]*href="([^"]+)"',
        block,
    )
    if not url_m:
        url_m = re.search(r'href="(https://t\.me/[^"]+)"', block)
    url = url_m.group(1) if url_m else f"{CHANNEL_URL}/{pid}"

    date = ""
    dm = re.search(r'<time datetime="([^"]+)"', block)
    if dm:
        date = dm.group(1)

    views = ""
    vm = re.search(r'class="tgme_widget_message_views"[^>]*>([^<]+)', block)
    if vm:
        views = vm.group(1).strip()

    text_html = ""
    # Prefer the supported-media text; skip media_not_supported copies
    text_chunks = []
    for tm in re.finditer(
        r'class="tgme_widget_message_text js-message_text"[^>]*>(.*?)</div>',
        block,
        re.S,
    ):
        # ignore the duplicate inside media_not_supported if any — they are
        # the same text usually; take the first good one
        text_chunks.append(tm.group(1))
        break
    if text_chunks:
        text_html = sanitize_html(text_chunks[0])

    photos: list[str] = []
    # photo wraps use background-image; skip service photos
    for pm in re.finditer(
        r'class="tgme_widget_message_photo_wrap[^"]*"[^>]*style="([^"]*)"',
        block,
    ):
        bu = BG_URL.search(pm.group(1) or "")
        if bu:
            photos.append(absolutize(bu.group(1)))
    # some photos are plain <img> inside photo wrap without background
    if not photos:
        for im in re.finditer(
            r'class="tgme_widget_message_photo_wrap[^"]*"[^>]*>.*?<img[^>]+src="([^"]+)"',
            block,
            re.S,
        ):
            photos.append(absolutize(im.group(1)))

    videos: list[dict] = []
    # video thumb as background on .tgme_widget_message_video_thumb
    for vm_ in re.finditer(
        r'class="[^"]*tgme_widget_message_video_thumb[^"]*"[^>]*style="([^"]*)"',
        block,
    ):
        bu = BG_URL.search(vm_.group(1) or "")
        if bu:
            videos.append({"thumb_src": absolutize(bu.group(1)), "url": url})
    # fallback: player wrap style
    if not videos:
        for vm_ in re.finditer(
            r'class="[^"]*tgme_widget_message_video_player[^"]*"[^>]*style="([^"]*)"',
            block,
        ):
            bu = BG_URL.search(vm_.group(1) or "")
            if bu:
                videos.append({"thumb_src": absolutize(bu.group(1)), "url": url})
    duration = ""
    dur = re.search(
        r'class="(?:message_video_duration|tgme_widget_message_video_duration)"[^>]*>([^<]+)',
        block,
    )
    if dur and videos:
        duration = dur.group(1).strip()
        videos[0]["duration"] = duration

    doc_title = ""
    dt = re.search(
        r'class="tgme_widget_message_document_title"[^>]*>([^<]+)',
        block,
    )
    if dt:
        doc_title = html.unescape(dt.group(1).strip())

    if not text_html and not photos and not videos and not doc_title:
        # empty / unsupported — still keep a stub so it can link out
        pass

    ptype = "text"
    if videos and photos:
        ptype = "media"
    elif videos:
        ptype = "video"
    elif len(photos) > 1:
        ptype = "album"
    elif photos:
        ptype = "photo"
    elif doc_title:
        ptype = "document"

    return {
        "id": pid,
        "service": False,
        "url": url,
        "date": date,
        "views": views,
        "text_html": text_html,
        "photo_srcs": photos,
        "video_srcs": videos,
        "document": doc_title,
        "type": ptype,
    }


def sanitize_html(raw: str) -> str:
    if not raw:
        return ""
    # unwrap telegram emoji, keep the character
    raw = re.sub(
        r"<tg-emoji[^>]*>.*?<b>([^<]*)</b>.*?</tg-emoji>",
        r"\1",
        raw,
        flags=re.S | re.I,
    )
    raw = re.sub(r"<tg-emoji[^>]*>(.*?)</tg-emoji>", r"\1", raw, flags=re.S | re.I)
    # drop scripts/styles entirely
    raw = re.sub(r"<script[^>]*>.*?</script>", "", raw, flags=re.S | re.I)
    raw = re.sub(r"<style[^>]*>.*?</style>", "", raw, flags=re.S | re.I)
    raw = ONATTR.sub("", raw)
    return _Sanitize().clean(raw)


class _Sanitize(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.out: list[str] = []

    def clean(self, raw: str) -> str:
        self.out = []
        self.feed(raw)
        self.close()
        return "".join(self.out).strip()

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag == "br":
            self.out.append("<br>")
            return
        if tag not in ALLOWED_TAGS:
            return
        ad = {k.lower(): v for k, v in attrs if k}
        allowed = ALLOWED_ATTRS.get(tag, set())
        parts = []
        if tag == "a":
            href = (ad.get("href") or "").strip()
            if not href or not SAFE_HREF.match(href):
                self.out.append("")  # still allow the text, no tag start? keep text only
                self._skip_a = True
                return
            href = html.escape(href, quote=True)
            parts.append(f'href="{href}"')
            parts.append('target="_blank"')
            parts.append('rel="noopener noreferrer"')
        else:
            for k, v in ad.items():
                if k in allowed and v is not None:
                    parts.append(f'{k}="{html.escape(v, quote=True)}"')
        attr = (" " + " ".join(parts)) if parts else ""
        self.out.append(f"<{tag}{attr}>")

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == "br":
            return
        if getattr(self, "_skip_a", False) and tag == "a":
            self._skip_a = False
            return
        if tag in ALLOWED_TAGS and tag != "br":
            self.out.append(f"</{tag}>")

    def handle_data(self, data):
        self.out.append(html.escape(data, quote=False))

    def handle_entityref(self, name):
        self.out.append(f"&{name};")

    def handle_charref(self, name):
        self.out.append(f"&#{name};")


def collect_posts() -> tuple[dict, list[dict]]:
    before = None
    seen: dict[int, dict] = {}
    channel = None
    pages = 0
    while pages < MAX_PAGES and len(seen) < MAX_POSTS:
        url = PREVIEW_URL if not before else f"{PREVIEW_URL}?before={before}"
        log(f"Fetching {url}")
        page = fetch(url)
        if channel is None:
            channel = parse_channel(page)
        blocks = split_messages(page)
        ids_this_page = []
        new = 0
        for block in blocks:
            post = parse_post_block(block)
            if not post:
                continue
            ids_this_page.append(post["id"])
            if post["id"] not in seen:
                seen[post["id"]] = post
                new += 1
        pages += 1
        if not ids_this_page:
            log("No messages on page, stopping.")
            break
        lowest = min(ids_this_page)
        log(f"  page {pages}: {len(ids_this_page)} messages, {new} new, min id={lowest}")
        if new == 0:
            break
        if lowest <= 1:
            break
        if before is not None and lowest >= before:
            break
        before = lowest
        time.sleep(SLEEP)
    posts = [p for p in seen.values() if not p.get("service")]
    posts.sort(key=lambda p: p["id"], reverse=True)
    posts = posts[:MAX_POSTS]
    if channel is None:
        raise RuntimeError(
            f"Could not load public preview {PREVIEW_URL}. "
            "The channel may be private or unreachable."
        )
    return channel, posts


def try_pillow():
    try:
        from PIL import Image  # type: ignore

        return Image
    except Exception:
        return None


def save_image(src: str, dest: Path, edge: int = MAX_EDGE) -> bool:
    if dest.exists() and dest.stat().st_size > 0:
        return True
    try:
        data, ctype, _ = fetch(src, referer=PREVIEW_URL, binary=True)
    except Exception as e:
        log(f"  ! download failed {src[:80]}… ({e})")
        return False
    if not data or len(data) < 32:
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    Image = try_pillow()
    if Image is not None:
        try:
            from io import BytesIO

            im = Image.open(BytesIO(data))
            im.load()
            if im.mode in ("P", "RGBA", "LA"):
                bg = Image.new("RGB", im.size, (8, 9, 16))
                if im.mode == "P":
                    im = im.convert("RGBA")
                bg.paste(im, mask=im.split()[-1] if im.mode in ("RGBA", "LA") else None)
                im = bg
            elif im.mode != "RGB":
                im = im.convert("RGB")
            im.thumbnail((edge, edge), Image.Resampling.LANCZOS)
            tmp = dest.with_suffix(".tmp.jpg")
            im.save(tmp, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
            tmp.replace(dest)
            return True
        except Exception as e:
            log(f"  ! compress failed, saving raw ({e})")
    if len(data) > MAX_BYTES:
        log(f"  ! skip large raw image ({len(data)} bytes)")
        return False
    dest.write_bytes(data)
    return True


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def localize_media(channel: dict, posts: list[dict], previous: dict) -> tuple[dict, list[dict]]:
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    old_posts = {p["id"]: p for p in previous.get("posts", []) if "id" in p}

    avatar_path = MEDIA_DIR / "avatar.jpg"
    avatar_rel = None
    if channel.get("avatar_src"):
        if save_image(channel["avatar_src"], avatar_path, edge=AVATAR_EDGE):
            avatar_rel = rel(avatar_path)
        elif (MEDIA_DIR / "avatar.jpg").exists():
            avatar_rel = rel(avatar_path)
    elif (MEDIA_DIR / "avatar.jpg").exists():
        avatar_rel = rel(avatar_path)

    out_posts = []
    used_files = {"avatar.jpg"} if avatar_rel else set()

    for post in posts:
        old = old_posts.get(post["id"], {})
        photos = []
        for i, src in enumerate(post.get("photo_srcs") or []):
            dest = MEDIA_DIR / f"{post['id']}-p{i}.jpg"
            # reuse existing local file if present
            if dest.exists() or save_image(src, dest):
                photos.append(rel(dest))
                used_files.add(dest.name)
            elif old.get("photos") and i < len(old["photos"]):
                photos.append(old["photos"][i])
                used_files.add(Path(old["photos"][i]).name)

        videos = []
        old_vids = old.get("videos") or []
        for i, v in enumerate(post.get("video_srcs") or []):
            dest = MEDIA_DIR / f"{post['id']}-v{i}.jpg"
            thumb = None
            if dest.exists() or (v.get("thumb_src") and save_image(v["thumb_src"], dest)):
                thumb = rel(dest)
                used_files.add(dest.name)
            elif i < len(old_vids) and old_vids[i].get("thumb"):
                thumb = old_vids[i]["thumb"]
                used_files.add(Path(thumb).name)
            videos.append({
                "thumb": thumb,
                "url": v.get("url") or post["url"],
                **({"duration": v["duration"]} if v.get("duration") else {}),
            })

        item = {
            "id": post["id"],
            "url": post["url"],
            "date": post["date"],
            "views": post.get("views") or old.get("views") or "",
            "text_html": post.get("text_html") or "",
            "photos": photos,
            "videos": videos,
            "document": post.get("document") or "",
            "type": post.get("type") or "text",
        }
        out_posts.append(item)

    # keep older posts that the preview no longer lists (history beyond cap
    # of a single crawl should already be in previous if we paginated)
    have = {p["id"] for p in out_posts}
    for pid, old in old_posts.items():
        if pid not in have:
            out_posts.append(old)
            for p in old.get("photos") or []:
                used_files.add(Path(p).name)
            for v in old.get("videos") or []:
                if v.get("thumb"):
                    used_files.add(Path(v["thumb"]).name)
    out_posts.sort(key=lambda p: p["id"], reverse=True)
    out_posts = out_posts[:MAX_POSTS]

    channel_out = {
        "name": channel.get("name") or previous.get("channel", {}).get("name") or "NOMBER Devlog",
        "username": CHANNEL,
        "url": CHANNEL_URL,
        "description_html": channel.get("description_html")
        or previous.get("channel", {}).get("description_html")
        or "",
        "avatar": avatar_rel or previous.get("channel", {}).get("avatar") or "",
        "subscribers": channel.get("subscribers")
        or previous.get("channel", {}).get("subscribers")
        or "",
    }
    return channel_out, out_posts


def comparable(payload: dict) -> dict:
    c = json.loads(json.dumps(payload))
    c.pop("updated", None)
    return c


def main() -> int:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    previous = {}
    if JSON_PATH.exists():
        try:
            previous = json.loads(JSON_PATH.read_text(encoding="utf-8"))
        except Exception:
            previous = {}

    try:
        channel, posts = collect_posts()
    except Exception as e:
        log(f"ERROR: {e}")
        return 1

    log(f"Parsed {len(posts)} posts, channel={channel.get('name')!r}, "
        f"subs={channel.get('subscribers')!r}")

    channel, posts = localize_media(channel, posts, previous)

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    payload = {
        "updated": now,
        "channel": channel,
        "posts": posts,
    }

    old_cmp = comparable(previous)
    new_cmp = comparable(payload)
    if old_cmp == new_cmp:
        log("No content changes; leaving data/telegram.json untouched.")
        return 0

    JSON_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    log(f"Wrote {JSON_PATH.relative_to(ROOT)} ({len(posts)} posts)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
