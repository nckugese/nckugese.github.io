const PAGES = [
  { id: "home", label: "Home", href: "index.html", icon: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { id: "members", label: "Members", href: "members.html", icon: "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 19v-1a4 4 0 0 0-3-3.87M15.5 3.13a3.5 3.5 0 0 1 0 6.75" },
  { id: "research", label: "Research", href: "research.html", icon: "M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7.5 15h9" },
  { id: "publication", label: "Publication", href: "publication.html", icon: "M5 4h10a4 4 0 0 1 4 4v12H8a3 3 0 0 1-3-3zM9 9h6M9 13h4" },
  { id: "gallery", label: "Events & Gallery", short: "Gallery", href: "gallery.html", icon: "M4 5h16v14H4zM4 16.5l4.5-4.5 3.5 3.5 3-3 5 5M9 9.6a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2" },
  { id: "contact", label: "Contact", href: "contact.html", icon: "M3 6h18v12H3zM3 7l9 6 9-6" },
];

const current = document.body.dataset.page;

const links = PAGES.map(
  (p) => `
    <li>
      <a href="${p.href}"${p.id === current ? ' aria-current="page"' : ""}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${p.icon}"/></svg>
        ${p.short ? `<span class="wide">${p.label}</span><span class="narrow">${p.short}</span>` : `<span>${p.label}</span>`}
      </a>
    </li>`
).join("");

document.querySelector(".sidebar").innerHTML = `
  <a class="brand" href="index.html">
    <span class="brand-name">GESE</span>
    <span class="brand-sub">Green Energy &amp; System Engineering</span>
  </a>
  <nav aria-label="Main">
    <ul class="nav">${links}</ul>
  </nav>
  <div class="sidebar-foot">Department of Chemical Engineering<br>National Cheng Kung University</div>`;

const nav = document.querySelector(".nav");
const tabs = [...nav.querySelectorAll("a")];
const pill = document.createElement("li");
pill.className = "nav-pill";
pill.setAttribute("aria-hidden", "true");
pill.dataset.glass = "bright";
nav.prepend(pill);

const isBar = () => getComputedStyle(nav).position === "fixed";

const slot = (a) => {
  const outer = nav.getBoundingClientRect();
  const box = a.parentElement.getBoundingClientRect();
  return {
    x: box.left - outer.left - nav.clientLeft,
    y: box.top - outer.top - nav.clientTop,
    w: box.width,
    h: box.height,
  };
};

const slide = window.createGlide(pill, {
  horizontal: isBar,
  ready: () => pill.classList.contains("is-ready"),
  frame: () => window.glass?.mark(pill),
});
const { shape, paint, halt, to: glide } = slide;

const seat = (a) => {
  const s = slot(a);
  if (!isBar()) return s;
  const h = Math.min(s.h, s.w * 0.8);
  return { ...s, y: s.y + (s.h - h) / 2, h };
};

const settle = () => {
  const a = tabs.find((tab) => tab.hasAttribute("aria-current"));
  pill.hidden = !a;
  if (a) glide(seat(a));
};

const setCurrent = (url) => {
  const path = new URL(url, location.href).pathname.replace(/\/$/, "/index.html");
  tabs.forEach((a) => {
    if (new URL(a.href).pathname.replace(/\/$/, "/index.html") === path) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  settle();
};

settle();
requestAnimationFrame(() => requestAnimationFrame(() => pill.classList.add("is-ready")));

let attachLens = () => {};
let pillLens = () => {};
let pruneLenses = () => {};
let refreshLenses = () => {};

const enhanced = new WeakSet();

const enhance = (root) => root.querySelectorAll(".lg, .icon-btn, .avatar-empty, .seg-thumb, .nav-pill").forEach((el) => {
  if (enhanced.has(el)) return;
  enhanced.add(el);
  if (window.glass && !el.closest(".post-media, .viewer")) window.glass.attach(el);
  else attachLens(el);
  const track = (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  el.addEventListener("pointermove", track);
  el.addEventListener("pointerdown", (e) => {
    track(e);
    el.classList.remove("is-pressed");
    void el.offsetWidth;
    el.classList.add("is-pressed");
  });
  el.addEventListener("animationend", () => el.classList.remove("is-pressed"));
});

if (CSS.supports("backdrop-filter", "url(#a)") && /Chrome\//.test(navigator.userAgent)) {
  const SVG = "http://www.w3.org/2000/svg";
  const REFRACTIVE_INDEX = 1.5;
  const LIGHT = { x: -0.6, y: -0.8 };

  const defs = document.body.appendChild(document.createElementNS(SVG, "svg"));
  defs.setAttribute("width", "0");
  defs.setAttribute("height", "0");
  defs.setAttribute("aria-hidden", "true");
  defs.style.position = "absolute";

  const toDataURL = (w, h, pixels) => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").putImageData(new ImageData(pixels, w, h), 0, 0);
    return canvas.toDataURL();
  };

  const buildLens = (el, id) => {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (!w || !h) return;

    const radius = Math.min(w, h) / 2;
    const bezel = Math.min(radius * 0.9, 20);
    const dome = bezel * 0.9;
    const slab = dome * 0.5;

    const shiftX = new Float32Array(w * h);
    const shiftY = new Float32Array(w * h);
    const light = new Uint8ClampedArray(w * h * 4);
    let maxShift = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x + 0.5 - w / 2;
        const py = y + 0.5 - h / 2;
        const qx = Math.abs(px) - (w / 2 - radius);
        const qy = Math.abs(py) - (h / 2 - radius);
        const depth = radius - Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - Math.min(Math.max(qx, qy), 0);
        if (depth <= 0) continue;

        let nx, ny;
        if (qx > 0 && qy > 0) {
          const len = Math.hypot(qx, qy);
          nx = (Math.sign(px) * qx) / len;
          ny = (Math.sign(py) * qy) / len;
        } else if (qx > qy) {
          nx = Math.sign(px);
          ny = 0;
        } else {
          nx = 0;
          ny = Math.sign(py);
        }

        const i = y * w + x;

        if (depth < bezel) {
          const u = 1 - depth / bezel;
          const body = Math.max(1 - u ** 4, 1e-6);
          const height = body ** 0.25;
          const slope = (dome * u ** 3) / (body ** 0.75 * bezel);

          const incidence = Math.atan(slope);
          const refracted = Math.asin(Math.sin(incidence) / REFRACTIVE_INDEX);
          const shift = (slab + dome * height) * Math.tan(incidence - refracted);
          shiftX[i] = -nx * shift;
          shiftY[i] = -ny * shift;
          maxShift = Math.max(maxShift, shift);
        }

        const band = Math.max(0, 1 - depth / 1.6);
        if (band > 0) {
          const facing = nx * LIGHT.x + ny * LIGHT.y;
          const glint = facing > 0 ? facing ** 1.5 : (-facing) ** 1.5 * 0.55;
          light[i * 4] = light[i * 4 + 1] = light[i * 4 + 2] = 255;
          light[i * 4 + 3] = 255 * band * (0.14 + 0.86 * glint);
        }
      }
    }

    const map = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      map[i * 4] = 128 + (shiftX[i] / maxShift) * 127;
      map[i * 4 + 1] = 128 + (shiftY[i] / maxShift) * 127;
      map[i * 4 + 2] = 128;
      map[i * 4 + 3] = 255;
    }

    let filter = document.getElementById(id);
    if (!filter) {
      filter = defs.appendChild(document.createElementNS(SVG, "filter"));
      filter.id = id;
      filter.setAttribute("color-interpolation-filters", "sRGB");
      filter.setAttribute("filterUnits", "userSpaceOnUse");
      filter.setAttribute("x", "0");
      filter.setAttribute("y", "0");
    }
    filter.setAttribute("width", w);
    filter.setAttribute("height", h);
    const box = `x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none"`;
    filter.innerHTML = `
      <feImage href="${toDataURL(w, h, map)}" ${box} result="map"/>
      <feDisplacementMap in="SourceGraphic" in2="map" scale="${maxShift * 2}" xChannelSelector="R" yChannelSelector="G" result="refracted"/>
      <feImage href="${toDataURL(w, h, light)}" ${box} result="light"/>
      <feBlend in="light" in2="refracted" mode="screen"/>`;
    el.style.backdropFilter = `url(#${id})`;
    el.classList.add("has-lens");
  };

  pillLens = (on) => {
    if (on) return buildLens(pill, "nav-pill-lens");
    pill.style.backdropFilter = "";
    pill.classList.remove("has-lens");
  };

  const lenses = new Map();
  let count = 0;

  attachLens = (el) => {
    const id = `lg-lens-${count++}`;
    const observer = new ResizeObserver(() => buildLens(el, id));
    observer.observe(el);
    lenses.set(el, { id, observer });
  };

  refreshLenses = () => {
    for (const [el, { id }] of lenses) {
      el.style.backdropFilter = "none";
      void el.offsetWidth;
      el.style.backdropFilter = `url(#${id})`;
    }
  };

  pruneLenses = () => {
    for (const [el, { id, observer }] of lenses) {
      if (el.isConnected) continue;
      observer.disconnect();
      document.getElementById(id)?.remove();
      lenses.delete(el);
    }
  };
}

window.glass?.frost(document.querySelector(".shell"));
enhance(document);

const runViews = () =>
  Promise.all(
    [...document.querySelectorAll("[data-view]")].map((el) => window.views?.[el.dataset.view]?.(el))
  ).then(() => enhance(document));

document.addEventListener("views:updated", () => {
  pruneLenses();
  window.glass?.prune();
  enhance(document);
});

const scrollToAnchor = (url, behavior) => {
  const id = new URL(url, location.href).hash.slice(1);
  if (id) document.getElementById(id)?.scrollIntoView({ behavior });
};

runViews().then(() => scrollToAnchor(location.href, "auto"));

const main = document.querySelector(".main");
const pages = new Map();

const pathOf = (url) => new URL(url, location.href).pathname.replace(/\/$/, "/index.html");

const load = (url) => {
  const key = pathOf(url);
  if (!pages.has(key)) {
    pages.set(
      key,
      fetch(key)
        .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
        .then((html) => new DOMParser().parseFromString(html, "text/html"))
    );
  }
  return pages.get(key);
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let visit = 0;

const show = async (url, push) => {
  const turn = ++visit;
  setCurrent(url);
  try {
    main.classList.add("is-leaving");
    const [doc] = await Promise.all([load(url), wait(160)]);
    if (turn !== visit) return;
    const next = doc.querySelector(".main");
    if (!next) throw new Error("no main");

    main.innerHTML = next.innerHTML;
    document.title = doc.title;
    document.body.dataset.page = doc.body.dataset.page;
    if (push) history.pushState(null, "", url);
    window.scrollTo(0, 0);
    document.body.classList.remove("reading");
    await runViews();
    if (turn !== visit) return;
    pruneLenses();
    window.glass?.prune();

    void main.offsetWidth;
    main.classList.remove("is-leaving");
    scrollToAnchor(url, "smooth");
    const settle = () => {
      refreshLenses();
      window.glass?.refresh();
    };
    [120, 350, 750].forEach((ms) => setTimeout(settle, ms));
  } catch {
    location.href = url;
  }
};

document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a || a.target || a.hasAttribute("download")) return;
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const url = new URL(a.href);
  if (url.origin !== location.origin || !/(\/|\.html)$/.test(url.pathname)) return;
  e.preventDefault();
  a.blur();
  const samePage = pathOf(url) === pathOf(location.href) && url.search === location.search;
  if (!samePage) show(url.href, true);
  else scrollToAnchor(url.href, "smooth");
});

window.addEventListener("popstate", () => show(location.href, false));

document.addEventListener("pointerover", (e) => {
  const a = e.target.closest?.(".nav a, .brand, .main a[href$='.html']");
  if (a && new URL(a.href).origin === location.origin) load(a.href).catch(() => {});
});

let drag = null;
let quietUntil = 0;

const nearest = (x) =>
  tabs.reduce(
    (best, a) => {
      const box = a.getBoundingClientRect();
      const distance = Math.abs(box.left + box.width / 2 - x);
      return distance < best.distance ? { a, distance } : best;
    },
    { a: null, distance: Infinity }
  ).a;

const follow = (x) => {
  const width = shape.w;
  const left = x - nav.getBoundingClientRect().left - nav.clientLeft - width / 2;
  const edge = slot(tabs[0]).x;
  shape.x = Math.max(edge, Math.min(nav.clientWidth - width - edge, left));
  paint();
  const a = nearest(x);
  if (a === drag.near) return;
  drag.near?.classList.remove("is-near");
  a.classList.add("is-near");
  drag.near = a;
};

const lift = () => {
  clearTimeout(drag.timer);
  halt();
  drag.active = true;
  pill.hidden = false;
  pill.classList.add("is-held");
  if (pill.classList.contains("has-glass")) {
    const rest = seat(tabs[0]);
    shape.w = rest.w * 1.4;
    shape.h = rest.h * 1.3;
    shape.y = rest.y - rest.h * 0.15;
  } else {
    pillLens(true);
  }
  nav.classList.add("is-dragging");
  follow(drag.x);
};

const drop = (go) => {
  if (!drag) return;
  clearTimeout(drag.timer);
  const { active, near } = drag;
  drag = null;
  if (!active) return;
  pill.classList.remove("is-held");
  pillLens(false);
  nav.classList.remove("is-dragging");
  near?.classList.remove("is-near");
  quietUntil = performance.now() + 450;
  if (go && near && !near.hasAttribute("aria-current")) show(near.href, true);
  else settle();
};

nav.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse" || !e.isPrimary || !isBar()) return;
  drop(false);
  drag = { id: e.pointerId, x: e.clientX, startX: e.clientX, active: false, near: null };
  drag.timer = setTimeout(() => drag && !drag.active && lift(), 260);
});

nav.addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  drag.x = e.clientX;
  if (drag.active) follow(e.clientX);
  else if (Math.abs(e.clientX - drag.startX) > 10) lift();
});

let previewing = false;

nav.addEventListener("pointerdown", (e) => {
  const a = e.target.closest?.("a");
  if (e.pointerType !== "mouse" || e.button !== 0 || !a) return;
  previewing = true;
  pill.hidden = false;
  glide(seat(a));
});

window.addEventListener("pointerup", () => {
  if (!previewing) return;
  previewing = false;
  setTimeout(settle, 0);
});

nav.addEventListener("pointerup", (e) => drag && e.pointerId === drag.id && drop(true));
nav.addEventListener("pointercancel", (e) => drag && e.pointerId === drag.id && drop(false));
nav.addEventListener("contextmenu", (e) => isBar() && e.preventDefault());
nav.addEventListener(
  "click",
  (e) => {
    if (performance.now() > quietUntil) return;
    e.preventDefault();
    e.stopPropagation();
  },
  true
);

new ResizeObserver(() => !drag?.active && settle()).observe(nav);
window.addEventListener("resize", () => !drag?.active && settle());
