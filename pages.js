window.createGlide = (el, { horizontal, ready, frame }) => {
  const HEAD = { pull: 1700, drag: 56 };
  const TAIL = { pull: 800, drag: 28 };
  const OVERSHOOT = 8;
  const STEP = 1 / 240;
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  const shape = { x: 0, y: 0, w: 0, h: 0 };
  let run = null;

  const paint = () => {
    for (const key of ["x", "y", "w", "h"]) el.style.setProperty(`--${key}`, `${shape[key]}px`);
    frame?.();
  };

  const halt = () => {
    if (run) cancelAnimationFrame(run.frame);
    run = null;
  };

  const to = (target) => {
    const [at, span, across, girth] = horizontal() ? ["x", "w", "y", "h"] : ["y", "h", "x", "w"];
    const moving = Number.isFinite(shape.w + shape.h) && shape.w > 0 && ready() && !calm.matches;
    const travel = target[at] - shape[at];
    if (!moving || (Math.abs(travel) < 1 && Math.abs(target[span] - shape[span]) < 1)) {
      halt();
      Object.assign(shape, target);
      paint();
      return;
    }

    const forward = travel >= 0;
    const state = {
      head: forward ? shape[at] + shape[span] : shape[at],
      tail: forward ? shape[at] : shape[at] + shape[span],
      headSpeed: run?.state.headSpeed ?? 0,
      tailSpeed: run?.state.tailSpeed ?? 0,
    };
    const goal = {
      head: forward ? target[at] + target[span] : target[at],
      tail: forward ? target[at] : target[at] + target[span],
    };
    const longest = target[span] * 1.45;
    const shortest = target[span] * 0.72;
    halt();
    run = { state, last: performance.now(), frame: 0 };
    const mine = run;

    const tick = (now) => {
      if (run !== mine) return;
      let left = Math.min(0.05, (now - mine.last) / 1000);
      mine.last = now;
      while (left > 0) {
        const dt = Math.min(STEP, left);
        left -= dt;
        state.headSpeed += (-HEAD.pull * (state.head - goal.head) - HEAD.drag * state.headSpeed) * dt;
        state.tailSpeed += (-TAIL.pull * (state.tail - goal.tail) - TAIL.drag * state.tailSpeed) * dt;
        state.head += state.headSpeed * dt;
        state.tail += state.tailSpeed * dt;
        const past = (state.head - goal.head) * (forward ? 1 : -1);
        if (past > OVERSHOOT) {
          state.head = goal.head + (forward ? OVERSHOOT : -OVERSHOOT);
          state.headSpeed = 0;
        }
        const length = forward ? state.head - state.tail : state.tail - state.head;
        if (length > longest) {
          state.tail = forward ? state.head - longest : state.head + longest;
          state.tailSpeed = state.headSpeed * 0.6;
        } else if (length < shortest) {
          state.tail = forward ? state.head - shortest : state.head + shortest;
          state.tailSpeed = state.headSpeed;
        }
      }

      const length = Math.abs(state.head - state.tail);
      const thick = target[girth] * Math.max(0.84, Math.min(1.14, Math.sqrt(target[span] / length)));
      shape[at] = Math.min(state.head, state.tail);
      shape[span] = length;
      shape[across] = target[across] + (target[girth] - thick) / 2;
      shape[girth] = thick;

      const still =
        Math.abs(state.head - goal.head) < 0.3 &&
        Math.abs(state.tail - goal.tail) < 0.3 &&
        Math.abs(state.headSpeed) < 8 &&
        Math.abs(state.tailSpeed) < 8;
      if (still) {
        Object.assign(shape, target);
        run = null;
      } else {
        mine.frame = requestAnimationFrame(tick);
      }
      paint();
    };
    mine.frame = requestAnimationFrame(tick);
  };

  return { shape, paint, halt, to };
};

(() => {
  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const list = (value) => (Array.isArray(value) ? value : value ? [value] : []);

  const loaded = {};
  const load = (file) =>
    (loaded[file] ??= fetch(file, { cache: "no-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`${file}: could not be loaded (HTTP ${response.status})`);
        return response.text();
      })
      .then((text) => window.parseData(file, text))
      .catch((error) => {
        delete loaded[file];
        throw error;
      }));

  const fail = (el, error) => {
    el.innerHTML = `<p class="notice"><strong>This page could not be shown.</strong><br>${escapeHtml(error.message)}</p>`;
  };

  const group = (title, body, id) =>
    `<section class="group"${id ? ` id="${escapeHtml(id)}"` : ""}><h2 class="group-title">${escapeHtml(title)}</h2>${body}</section>`;

  const shownPublications = (data) => {
    const kinds = list(data.show_kinds);
    return list(data.publications).filter(
      (p) => (!data.show_only_corresponding || p.corresponding !== false) && (!kinds.length || !p.kind || kinds.includes(p.kind))
    );
  };

  const byYear = (items) => {
    const years = [...new Set(items.map((item) => item.year ?? ""))].sort((a, b) => Number(b) - Number(a));
    return years.map((year) => [year, items.filter((item) => (item.year ?? "") === year)]);
  };

  const research = async (el) => {
    try {
      const data = await load("data/research.json");

      const papers = await load("data/publications.json").then(shownPublications, () => []);
      const intro = list(data.intro).map((p) => `<p>${escapeHtml(p)}</p>`).join("");
      const areas = list(data.areas)
        .map((a) => {
          const count = papers.filter((p) => p.field === a.id).length;
          return `
            <article class="area" id="${escapeHtml(a.id)}">
              <h3>${escapeHtml(a.title)}</h3>
              <p>${escapeHtml(a.text)}</p>
              ${
                count
                  ? `<a class="area-link" href="publication.html#${encodeURIComponent(a.id)}">
                       ${count} publication${count === 1 ? "" : "s"}
                       <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                     </a>`
                  : ""
              }
            </article>`;
        })
        .join("");
      const tools = list(data.tools).map(escapeHtml).join(" · ");
      const projectItem = (p) => `
        <li>
          <span class="when">${escapeHtml(p.period || p.year)}</span>
          <span>${escapeHtml(p.title)}${p.title_zh ? `<span class="sub">${escapeHtml(p.title_zh)}</span>` : ""}</span>
        </li>`;
      const timeline = (items) => `<ol class="timeline">${byYear(items).flatMap(([, group]) => group.map(projectItem)).join("")}</ol>`;

      const all = list(data.projects);
      const cut = Number(data.projects_fold_before) || 0;
      const recent = all.filter((p) => Number(p.year) >= cut);
      const earlier = all.filter((p) => Number(p.year) < cut);
      const projects =
        (recent.length ? timeline(recent) : "") +
        (earlier.length
          ? `<details class="fold earlier">
               <summary>
                 <span class="fold-label">Earlier projects</span>
                 <span class="count">${earlier.length}</span>
                 <svg class="icon chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
               </summary>
               ${timeline(earlier)}
             </details>`
          : "");
      const team = list(data.team_projects);

      el.innerHTML = [
        intro ? `<div class="prose">${intro}</div>` : "",
        areas ? group("Research areas", `<div class="areas">${areas}</div>`) : "",
        tools ? group(data.tools_title || "Tools", `<p class="prose">${tools}</p>`) : "",
        projects ? group(data.projects_title || "Projects", projects) : "",
        team.length ? group(data.team_projects_title || "Collaborative projects", timeline(team)) : "",
      ].join("");
      document.body.classList.add("reading");
    } catch (error) {
      fail(el, error);
    }
  };

  let pubView = "year";

  const publications = async (el) => {
    try {
      const data = await load("data/publications.json");
      const fields = list(data.fields);
      const items = shownPublications(data);

      if (fields.some((f) => f.id === decodeURIComponent(location.hash.slice(1)))) pubView = "field";

      const entry = (p, withYear) => `
        <li>
          <div class="pub-text">
            <span class="pub-title">${escapeHtml(p.title)}</span>
            ${p.authors ? `<span class="pub-authors">${escapeHtml(p.authors)}</span>` : ""}
            ${p.venue || (withYear && p.year) ? `<span class="pub-venue">${escapeHtml([p.venue, withYear ? p.year : ""].filter(Boolean).join(", "))}</span>` : ""}
          </div>
          ${
            p.link && /^https?:\/\//i.test(p.link)
              ? `<a class="icon-btn" href="${escapeHtml(p.link)}" target="_blank" rel="noopener" title="Open the paper" aria-label="Open the paper: ${escapeHtml(p.title)}">
                   <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/></svg>
                 </a>`
              : ""
          }
        </li>`;

      const byField = () => {
        const known = new Set(fields.map((f) => f.id));
        const newestFirst = (a, b) => Number(b.year ?? 0) - Number(a.year ?? 0);
        const sections = fields.map((f) => [f.title, items.filter((p) => p.field === f.id).sort(newestFirst), f.id]);
        sections.push(["Other", items.filter((p) => !known.has(p.field)).sort(newestFirst)]);
        return sections.filter(([, papers]) => papers.length);
      };

      const tab = (id, label) =>
        `<button type="button" class="seg" data-pub-view="${id}" aria-pressed="${pubView === id}">${label}</button>`;

      if (!items.length) {
        el.innerHTML = `<p class="notice">No publications listed yet.</p>`;
        return;
      }

      el.innerHTML = `
        <div class="segmented" role="group" aria-label="Group publications">
          <span class="seg-thumb" data-glass="bright" aria-hidden="true"></span>
          ${tab("year", "By year")}${tab("field", "By field")}
        </div>
        <div class="pub-list"></div>`;
      const track = el.querySelector(".segmented");
      const thumb = el.querySelector(".seg-thumb");
      const buttons = [...el.querySelectorAll("[data-pub-view]")];
      const papersBox = el.querySelector(".pub-list");
      let placed = false;
      const slide = window.createGlide(thumb, {
        horizontal: () => true,
        ready: () => placed,
        frame: () => window.glass?.refresh(),
      });
      const place = () => {
        const on = buttons.find((button) => button.dataset.pubView === pubView);
        if (!on.offsetWidth) return;
        slide.to({ x: on.offsetLeft, y: on.offsetTop, w: on.offsetWidth, h: on.offsetHeight });
        placed = true;
      };

      const draw = () => {
        const sections =
          pubView === "field"
            ? byField().map(([title, papers, id]) => group(title, `<ol class="pubs">${papers.map((p) => entry(p, true)).join("")}</ol>`, id))
            : byYear(items).map(([year, papers]) => group(year || "Year not listed", `<ol class="pubs">${papers.map((p) => entry(p, false)).join("")}</ol>`));
        papersBox.innerHTML = sections.join("");
        buttons.forEach((button) => button.setAttribute("aria-pressed", button.dataset.pubView === pubView));
        place();
      };

      buttons.forEach((button) =>
        button.addEventListener("click", () => {
          if (pubView === button.dataset.pubView) return;
          pubView = button.dataset.pubView;
          draw();
          document.dispatchEvent(new Event("views:updated"));
        })
      );
      new ResizeObserver(() => {
        if (!track.isConnected) return;
        placed = false;
        place();
      }).observe(track);

      draw();
      document.body.classList.add("reading");
    } catch (error) {
      fail(el, error);
    }
  };

  const ARROW = {
    prev: "M15 5l-7 7 7 7",
    next: "M9 5l7 7-7 7",
    close: "M6 6l12 12M18 6L6 18",
  };

  const control = (name, label) =>
    `<button class="icon-btn viewer-${name}" type="button" data-viewer="${name}" aria-label="${label}">
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${ARROW[name]}"/></svg>
    </button>`;

  const openViewer = (photos, start) => {
    let index = start;
    const dialog = document.body.appendChild(document.createElement("dialog"));
    dialog.className = "viewer";
    dialog.innerHTML = `
      <figure>
        <img alt="">
        <figcaption></figcaption>
      </figure>
      ${control("close", "Close")}
      ${photos.length > 1 ? control("prev", "Previous photo") + control("next", "Next photo") : ""}`;
    const img = dialog.querySelector("img");
    const caption = dialog.querySelector("figcaption");

    const draw = () => {
      const photo = photos[index];
      img.src = photo.src;
      img.alt = photo.caption;
      caption.textContent = [photo.caption, photos.length > 1 ? `${index + 1} / ${photos.length}` : ""].filter(Boolean).join("  ·  ");
    };
    const step = (by) => {
      index = (index + by + photos.length) % photos.length;
      draw();
    };

    dialog.addEventListener("click", (e) => {
      const action = e.target.closest("[data-viewer]")?.dataset.viewer;
      if (action === "prev") step(-1);
      else if (action === "next") step(1);
      else if (action === "close" || !e.target.closest("img")) dialog.close();
    });
    dialog.addEventListener("keydown", (e) => {
      if (photos.length < 2) return;
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
    let touchX = null;
    dialog.addEventListener("pointerdown", (e) => (touchX = e.clientX));
    dialog.addEventListener("pointerup", (e) => {
      if (touchX !== null && photos.length > 1 && Math.abs(e.clientX - touchX) > 50) step(e.clientX < touchX ? 1 : -1);
      touchX = null;
    });
    dialog.addEventListener("close", () => dialog.remove());

    draw();
    dialog.showModal();
    document.dispatchEvent(new Event("views:updated"));
  };

  const gallery = async (el) => {
    try {
      const data = await load("data/gallery.json");
      const events = list(data.events)
        .map((event) => ({
          ...event,
          photos: list(event.photos)
            .map((photo) => (typeof photo === "string" ? { file: photo } : photo))
            .filter((photo) => photo?.file)
            .map((photo) => ({
              src: `assets/gallery/${String(photo.file).split("/").map(encodeURIComponent).join("/")}`,
              caption: photo.caption ?? "",
            })),
        }))
        .filter((event) => event.photos.length);

      el.innerHTML = events.length
        ? `<div class="feed">${events
            .map((event, n) => {
              const many = event.photos.length > 1;
              return `
            <article class="post">
              <div class="post-media">
                <div class="post-track">${event.photos
                  .map(
                    (photo, i) =>
                      `<button class="photo" type="button" data-event="${n}" data-photo="${i}" aria-label="${escapeHtml(photo.caption || `${event.title ?? "Photo"} ${i + 1}`)}">
                        <img src="${escapeHtml(photo.src)}" alt="" loading="lazy" decoding="async">
                      </button>`
                  )
                  .join("")}</div>
                ${
                  many
                    ? `<span class="post-count">1 / ${event.photos.length}</span>
                       <button class="icon-btn post-prev" type="button" data-slide="-1" aria-label="Previous photo"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${ARROW.prev}"/></svg></button>
                       <button class="icon-btn post-next" type="button" data-slide="1" aria-label="Next photo"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${ARROW.next}"/></svg></button>`
                    : ""
                }
              </div>
              <div class="post-body">
                <h2 class="post-title">${escapeHtml(event.title)}</h2>
                ${event.date ? `<p class="post-date">${escapeHtml(event.date)}</p>` : ""}
                ${list(event.text).map((p) => `<p class="post-text">${escapeHtml(p)}</p>`).join("")}
              </div>
            </article>`;
            })
            .join("")}</div>`
        : `<p class="notice">Photos will be added here.</p>`;

      el.querySelectorAll(".post").forEach((post) => {
        const track = post.querySelector(".post-track");
        const count = post.querySelector(".post-count");
        const total = track.children.length;
        const cover = track.querySelector("img");
        const fit = () => {
          if (cover.naturalWidth) track.style.setProperty("--ratio", Math.max(0.8, Math.min(2.4, cover.naturalWidth / cover.naturalHeight)));
        };
        if (cover.complete) fit();
        else cover.addEventListener("load", fit, { once: true });
        if (count) {
          track.addEventListener(
            "scroll",
            () => (count.textContent = `${Math.min(total, Math.round(track.scrollLeft / track.clientWidth) + 1)} / ${total}`),
            { passive: true }
          );
        }
        post.querySelectorAll("[data-slide]").forEach((button) =>
          button.addEventListener("click", () => track.scrollBy({ left: Number(button.dataset.slide) * track.clientWidth, behavior: "smooth" }))
        );
      });
      el.querySelectorAll(".photo").forEach((button) =>
        button.addEventListener("click", () => openViewer(events[button.dataset.event].photos, Number(button.dataset.photo)))
      );
    } catch (error) {
      fail(el, error);
    }
  };

  window.views = { ...window.views, research, publications, gallery };
})();
