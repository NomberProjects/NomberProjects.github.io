(() => {
  "use strict";
  const PAGE_SIZE = 8;
  const ALLOW = new Set(["A", "B", "STRONG", "I", "EM", "U", "S", "DEL", "INS", "CODE", "PRE", "BR", "BLOCKQUOTE", "SPAN"]);
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;

  let lang = window.detectLang ? window.detectLang() : "ru";
  const T = (k) => (window.I18N?.[lang] || window.I18N?.en || {})[k] ?? k;

  const applyChrome = () => {
    window.applyI18n && window.applyI18n(lang);
    document.querySelectorAll(".lang button").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang))
    );
  };

  const sanitize = (raw) => {
    const tpl = document.createElement("template");
    tpl.innerHTML = String(raw || "");
    const walk = (parent) => {
      [...parent.childNodes].forEach((n) => {
        if (n.nodeType === 8) { n.remove(); return; }
        if (n.nodeType !== 1) return;
        if (!ALLOW.has(n.tagName)) {
          walk(n);
          while (n.firstChild) parent.insertBefore(n.firstChild, n);
          n.remove();
          return;
        }
        [...n.attributes].forEach((a) => {
          const nm = a.name.toLowerCase();
          if (nm.startsWith("on") || nm === "style") { n.removeAttribute(a.name); return; }
          if (n.tagName === "A" && nm === "href") {
            if (!/^(https?:|tg:|mailto:|\/)/i.test(a.value)) n.removeAttribute("href");
            return;
          }
          if (!(n.tagName === "A" && (nm === "href" || nm === "target" || nm === "rel")) && nm !== "dir") {
            n.removeAttribute(a.name);
          }
        });
        if (n.tagName === "A") {
          n.setAttribute("target", "_blank");
          n.setAttribute("rel", "noopener noreferrer");
        }
        walk(n);
      });
    };
    walk(tpl.content);
    return tpl.innerHTML;
  };

  const fmtDate = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(+d)) return "";
    return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-GB", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }).format(d);
  };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));

  let data = null;
  let shown = 0;

  const hero = (ch) => {
    if (!ch) return;
    if (ch.avatar) {
      const img = $("#blog-avatar");
      img.src = ch.avatar;
      img.alt = ch.name || "";
    }
    if (ch.name) $("#blog-title").textContent = ch.name;
    const handle = $("#blog-handle");
    const subs = ch.subscribers
      ? ` · ${esc(ch.subscribers)} ${esc(T("blog.subs"))}`
      : "";
    handle.innerHTML = `<a href="${esc(ch.url || "https://t.me/NomberDev")}" target="_blank" rel="noopener">@${esc(ch.username || "NomberDev")}</a>${subs}`;
    const desc = $("#blog-desc");
    desc.innerHTML = sanitize(ch.description_html || "");
  };

  const postCard = (p) => {
    const photos = (p.photos || []).filter(Boolean);
    const videos = (p.videos || []).filter((v) => v && (v.thumb || v.url));
    let media = "";
    if (photos.length) {
      const cls = photos.length > 1 ? "post-photos album" : "post-photos";
      media += `<div class="${cls}">` + photos.map((src, i) =>
        `<a class="post-media" href="${esc(p.url)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="" loading="lazy"${i ? "" : ""}></a>`
      ).join("") + `</div>`;
    }
    for (const v of videos) {
      const dur = v.duration ? `<span class="post-dur">${esc(v.duration)}</span>` : "";
      const thumb = v.thumb
        ? `<img src="${esc(v.thumb)}" alt="${esc(T("blog.video"))}" loading="lazy">`
        : "";
      media += `<a class="post-video" href="${esc(v.url || p.url)}" target="_blank" rel="noopener" aria-label="${esc(T("blog.video"))}">${thumb}<span class="post-play"><i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></i></span>${dur}</a>`;
    }
    const text = p.text_html ? `<div class="post-text">${sanitize(p.text_html)}</div>` : "";
    const doc = p.document
      ? `<div class="post-doc">📄 <span>${esc(T("blog.doc"))}: ${esc(p.document)}</span></div>`
      : "";
    const views = p.views
      ? `<span class="post-views" title="${esc(p.views)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-3.2A1.8 1.8 0 1 0 12 8.2a1.8 1.8 0 0 0 0 5.6z"/></svg>${esc(p.views)}</span>`
      : "";
    return `<article class="post reveal" id="post-${esc(p.id)}">
      ${media}
      <div class="post-body">${text}${doc}
        <div class="post-meta">
          <time datetime="${esc(p.date || "")}">${esc(fmtDate(p.date))}</time>
          ${views}
          <a class="post-open" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(T("blog.openpost"))}</a>
        </div>
      </div>
    </article>`;
  };

  const reveal = (root) => {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: .12 });
    root.querySelectorAll(".reveal").forEach((el) => reduce ? el.classList.add("in") : io.observe(el));
  };

  const paintFeed = (append) => {
    const posts = data?.posts || [];
    const feed = $("#feed");
    const more = $("#feed-more");
    const end = $("#feed-end");
    const empty = $("#feed-empty");
    $("#feed-error").hidden = true;
    if (!posts.length) {
      feed.innerHTML = "";
      more.hidden = true;
      end.hidden = true;
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    if (!append) {
      shown = 0;
      feed.innerHTML = "";
    }
    const next = posts.slice(shown, shown + PAGE_SIZE);
    shown += next.length;
    feed.insertAdjacentHTML("beforeend", next.map(postCard).join(""));
    more.hidden = shown >= posts.length;
    end.hidden = shown < posts.length;
    if (!reduce) reveal(feed);
    else feed.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
  };

  const paintUpdated = () => {
    const el = $("#feed-updated");
    if (!el) return;
    if (data?.updated) el.textContent = `${T("blog.updated")} ${fmtDate(data.updated)}`;
    else el.textContent = "";
  };

  const renderAll = () => {
    applyChrome();
    if (data) {
      hero(data.channel);
      const keep = shown || PAGE_SIZE;
      shown = 0;
      const posts = data.posts || [];
      const feed = $("#feed");
      feed.innerHTML = "";
      const next = posts.slice(0, Math.max(keep, 0));
      shown = next.length;
      feed.insertAdjacentHTML("beforeend", next.map(postCard).join(""));
      $("#feed-more").hidden = shown >= posts.length;
      $("#feed-end").hidden = !posts.length || shown < posts.length;
      $("#feed-empty").hidden = !!posts.length;
      feed.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
      paintUpdated();
    }
  };

  const load = async () => {
    $("#feed-error").hidden = true;
    try {
      const r = await fetch("data/telegram.json", { cache: "no-cache" });
      if (!r.ok) throw new Error("http " + r.status);
      data = await r.json();
      shown = 0;
      hero(data.channel);
      paintUpdated();
      paintFeed(false);
    } catch (err) {
      console.error(err);
      $("#feed-error").hidden = false;
      $("#feed-more").hidden = true;
      $("#feed-end").hidden = true;
    }
  };

  applyChrome();
  const y = $("#y"); if (y) y.textContent = new Date().getFullYear();
  document.querySelectorAll(".lang button").forEach((b) => b.addEventListener("click", () => {
    lang = b.dataset.lang;
    try { localStorage.setItem("lang", lang); } catch (e) {}
    renderAll();
    document.querySelectorAll(".blog-hero-card.reveal, .feed-wrap .sec-head.reveal").forEach((el) => el.classList.add("in"));
  }));
  $("#feed-more")?.addEventListener("click", () => paintFeed(true));
  $("#feed-retry")?.addEventListener("click", () => load());
  load();

  const nav = $("#nav");
  addEventListener("scroll", () => nav && nav.classList.toggle("scrolled", scrollY > 30), { passive: true });
  document.querySelectorAll(".blog-hero-card, .feed-wrap .sec-head").forEach((el) => {
    el.classList.add("reveal");
  });
  reveal(document);

  /* copy email */
  const toast = document.createElement("div");
  toast.className = "copy-toast";
  toast.setAttribute("role", "status");
  document.body.appendChild(toast);
  let tt;
  document.addEventListener("click", async (e) => {
    const a = e.target.closest("[data-copy]"); if (!a) return;
    e.preventDefault();
    const v = a.dataset.copy;
    try { await navigator.clipboard.writeText(v); } catch (err) {
      const ta = document.createElement("textarea"); ta.value = v; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e2) {} ta.remove();
    }
    toast.textContent = T("contact.copied");
    toast.classList.add("show");
    clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("show"), 1800);
  });

  if (reduce) return;

  const glow = $(".cursor-glow"), par = [...document.querySelectorAll("[data-depth]")];
  let tx = 0, ty = 0, cx = 0, cy = 0, gx = innerWidth / 2, gy = innerHeight / 2;
  if (fine) addEventListener("pointermove", (e) => {
    tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; gx = e.clientX; gy = e.clientY;
  }, { passive: true });

  const cv = $("#fx"); if (!cv) return;
  const ctx = cv.getContext("2d");
  let W, H, dpr, parts = [];
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
    const n = Math.round(Math.min(80, innerWidth / 16));
    parts = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: (Math.random() * 1.6 + .4) * dpr, v: (Math.random() * .25 + .05) * dpr,
      a: Math.random() * .6 + .15,
      h: Math.random() < .5 ? "63,208,255" : (Math.random() < .5 ? "255,46,136" : "220,225,255"),
      p: Math.random() * 6
    }));
  };
  resize(); addEventListener("resize", resize);
  const tick = (t) => {
    cx += (tx - cx) * .06; cy += (ty - cy) * .06;
    par.forEach((el) => {
      const d = +el.dataset.depth;
      el.style.transform = `translate3d(${cx * d}px,${cy * d}px,0)${el.classList.contains("bg-city") ? " scale(1.08)" : ""}`;
    });
    if (glow) glow.style.transform = `translate(${gx - 260}px,${gy - 260}px)`;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.y -= p.v; p.x += Math.sin(t / 2000 + p.p) * .2 * dpr;
      if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
      ctx.fillStyle = `rgba(${p.h},${p.a * (.6 + .4 * Math.sin(t / 700 + p.p))})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
