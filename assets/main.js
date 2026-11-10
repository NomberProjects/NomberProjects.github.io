(() => {
  "use strict";
  const D = window.NOMBER_DATA || {};
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ICONS = {
    tg: '<path d="M21.9 4.3 18.6 20c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.2-8.3c.4-.4-.1-.6-.6-.2L6 13.6l-4.9-1.5c-1.1-.3-1.1-1 .2-1.6L20.5 3c.9-.3 1.7.2 1.4 1.3z"/>',
    bot: '<path d="M12 2a1.5 1.5 0 0 1 1 2.6V6h4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h4V4.6A1.5 1.5 0 0 1 12 2zM9 11a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM1 11h2v5H1zm20 0h2v5h-2z"/>',
    web: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-3a15 15 0 0 0-1.3-3.9A8 8 0 0 1 18.9 8zM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.8 1.9-4zM4.3 14a8 8 0 0 1 0-4h3.4a16 16 0 0 0 0 4zm.8 2h3a15 15 0 0 0 1.3 3.9A8 8 0 0 1 5.1 16zm3-8h-3a8 8 0 0 1 4.3-3.9A15 15 0 0 0 8.1 8zM12 20c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.8-1.9 4zm2.3-6H9.7a14 14 0 0 1 0-4h4.6a14 14 0 0 1 0 4zm.3 5.9c.6-1.2 1-2.5 1.3-3.9h3a8 8 0 0 1-4.3 3.9zm1.7-5.9a16 16 0 0 0 0-4h3.4a8 8 0 0 1 0 4z"/>',
    gh: '<path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.6 18.3 5 18.3 5c.7 1.7.3 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z"/>',
    mail: '<path d="M2 5h20v14H2zm2 2v.5l8 5 8-5V7l-8 5z"/>'
  };
  const icon = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k] || ICONS.web}</svg>`;
  const ext = u => /^https?:/.test(u) ? ' target="_blank" rel="noopener"' : "";

  let lang = window.detectLang ? window.detectLang() : "ru";
  const tr = v => (v && typeof v === "object") ? (v[lang] ?? v.ru ?? v.en ?? "") : (v ?? "");
  const T = k => (window.I18N?.[lang] || {})[k] ?? k;
  const links = arr => (arr || []).map(l => `<a class="btn" href="${esc(l.url)}"${ext(l.url)}>${icon(l.icon)}${esc(tr(l.label))}</a>`).join("");

  const card = (p, cls = "") => {
    const title = tr(p.title);
    const img = p.image ? `<a class="logo" href="${esc(p.url || p.links?.[0]?.url || "#")}"${ext(p.url || "")} aria-label="${esc(title)} — ${esc(T("card.site"))}"><img src="${esc(p.image)}" alt="" loading="lazy" width="64" height="64"></a>` : "";
    return `<article class="card reveal ${cls}" style="--acc:${esc(p.accent || "#3fd0ff")}" tabindex="-1">
      <div class="card-in">${p.status ? `<span class="status">${esc(tr(p.status))}</span>` : ""}
        <div class="card-top">${img}<div><h3>${esc(title)}</h3><p class="tag">${esc(tr(p.tagline))}</p></div></div>
        <div class="more"><div><p>${esc(tr(p.description))}</p></div></div>
        <div class="links">${links(p.links)}</div>
      </div></article>`;
  };

  const render = () => {
    const P = D.projects || [];
    $("#col-left").innerHTML = P[0] ? card(P[0], "featured") : "";
    $("#col-right").innerHTML = P[1] ? card(P[1], "featured") : "";
    $("#col-bottom").innerHTML = P.slice(2).map(p => card(p, "featured")).join("");

    $("#wip-grid").innerHTML = (D.wip || []).map((w, i) => w.redacted
      ? `<article class="card secret full reveal" tabindex="0" aria-label="${esc(T("secret.aria"))}">
          <div class="card-in"><span class="status">${esc(T("secret.grif"))}</span><h3>████████</h3>
          <span class="redact" style="width:92%"></span><span class="redact" style="width:74%"></span><span class="redact" style="width:85%"></span><span class="redact" style="width:40%"></span>
          <span class="stamp">${esc(T("secret.stamp"))}</span><div class="denied">${esc(T("secret.denied"))}</div></div></article>`
      : `<article class="card secret reveal" tabindex="0">
          <div class="card-in"><span class="status">${esc(tr(w.status))}</span><p class="tag">${esc(T("secret.obj"))}${String(i + 1).padStart(3, "0")}</p><h3>${esc(tr(w.title))}</h3>
          <p class="tag" style="margin-top:6px;color:#c4c9da">${esc(tr(w.tagline))}</p>
          <span class="redact" style="width:80%"></span><span class="redact" style="width:55%"></span>
          <span class="stamp">${esc(T("secret.stamp"))}</span></div></article>`).join("");

    $("#com-grid").innerHTML = (D.communities || []).map(c => `<article class="card community reveal" style="--acc:#66c0f4">
        <div class="card-in"><div class="c-logo">${c.image ? `<img src="${esc(c.image)}" alt="${esc(tr(c.title))}" loading="lazy" width="88" height="88">` : "🎮"}</div><div>
          <span class="status">${esc(tr(c.status))}</span>
          <h3 style="font-size:26px">${esc(tr(c.title))}</h3><p class="tag">${esc(tr(c.tagline))}</p>
          <span class="badge">${esc(tr(c.badge))}</span><span class="badge">${esc(T("com.tgbadge"))}</span>
          <div class="more"><div><p>${esc(tr(c.description))}</p></div></div>
          <div class="links">${links(c.links)}</div></div></div></article>`).join("");

    const A = D.archive || [];
    $("#arc-grid").innerHTML = A.length ? A.map(p => card(p)).join("") :
      `<div class="vault reveal"><div class="vault-icon" aria-hidden="true">🗄️</div><h3>${esc(T("vault.t"))}</h3><p>${esc(T("vault.p"))}</p></div>`;

    window.applyI18n && window.applyI18n(lang);
    document.querySelectorAll(".lang button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  };
  render();
  document.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", () => {
    lang = b.dataset.lang; try { localStorage.setItem("lang", lang); } catch (e) {}
    render(); bindTilt();
    document.querySelectorAll(".reveal").forEach(el => el.classList.add("in"));
  }));

  $("#y").textContent = new Date().getFullYear();

  // reveal
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll(".reveal").forEach(el => reduce ? el.classList.add("in") : io.observe(el));

  // nav state
  const nav = $("#nav"), navLinks = [...document.querySelectorAll(".nav nav a")];
  const secs = navLinks.map(a => $(a.getAttribute("href")));
  const onScroll = () => {
    nav.classList.toggle("scrolled", scrollY > 30);
    let cur = 0; secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .4) cur = i; });
    navLinks.forEach((a, i) => a.classList.toggle("on", i === cur));
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // tap to open on touch
  document.addEventListener("click", e => { const c = e.target.closest(".card"); if (c && !e.target.closest("a")) c.classList.toggle("open"); });

  if (reduce) return;

  // tilt + spotlight
  function bindTilt() {
    if (reduce || !fine) return;
    document.querySelectorAll(".card").forEach(c => {
      c.addEventListener("pointermove", e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.transform = `perspective(900px) rotateX(${(.5 - y) * 10}deg) rotateY(${(x - .5) * 12}deg) translateZ(0)`;
        c.style.setProperty("--mx", x * 100 + "%"); c.style.setProperty("--my", y * 100 + "%");
      });
      c.addEventListener("pointerleave", () => { c.style.transform = ""; });
    });
  }
  bindTilt();

  // parallax + cursor glow
  const glow = $(".cursor-glow"), par = [...document.querySelectorAll("[data-depth]")];
  let tx = 0, ty = 0, cx = 0, cy = 0, gx = innerWidth / 2, gy = innerHeight / 2;
  if (fine) addEventListener("pointermove", e => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; gx = e.clientX; gy = e.clientY; }, { passive: true });

  // particles
  const cv = $("#fx"), ctx = cv.getContext("2d");
  let W, H, dpr, parts = [];
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2); W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
    const n = Math.round(Math.min(90, innerWidth / 16));
    parts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.6 + .4) * dpr, v: (Math.random() * .25 + .05) * dpr, a: Math.random() * .6 + .15, h: Math.random() < .5 ? "63,208,255" : (Math.random() < .5 ? "255,46,136" : "220,225,255"), p: Math.random() * 6 }));
  };
  resize(); addEventListener("resize", resize);

  const tick = t => {
    cx += (tx - cx) * .06; cy += (ty - cy) * .06;
    par.forEach(el => { const d = +el.dataset.depth; el.style.transform = `translate3d(${cx * d}px,${cy * d}px,0)${el.classList.contains("bg-city") ? " scale(1.08)" : ""}`; });
    glow.style.transform = `translate(${gx - 260}px,${gy - 260}px)`;
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

/* copy email on click */
(() => {
  const toast = document.createElement("div"); toast.className = "copy-toast"; toast.setAttribute("role","status"); document.body.appendChild(toast);
  let t;
  const msg = () => (document.documentElement.lang || "ru").startsWith("ru") ? "Почта скопирована ✓" : "Email copied ✓";
  const fallback = (v) => { const ta = document.createElement("textarea"); ta.value = v; ta.style.position="fixed"; ta.style.opacity="0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove(); };
  document.addEventListener("click", async (e) => {
    const a = e.target.closest("[data-copy]"); if (!a) return;
    e.preventDefault(); const v = a.dataset.copy;
    try { await navigator.clipboard.writeText(v); } catch (err) { fallback(v); }
    toast.textContent = msg(); toast.classList.add("show"); clearTimeout(t); t = setTimeout(() => toast.classList.remove("show"), 1800);
  });
})();
