(() => {
  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const safeUrl = (url) => (/^(https?:\/\/|mailto:)/i.test(url) || /^[\w./%-]+$/.test(url) ? url : "#");

  const list = (value) => (Array.isArray(value) ? value : value ? [value] : []);

  window.parseData = (file, text) => {
    const clean = text.replace(/^\uFEFF/, "").replace(/("(?:\\.|[^"\\])*")|,(?=\s*[}\]])/g, (match, string) => string ?? "");
    try {
      return JSON.parse(clean);
    } catch (error) {
      const position = /position (\d+)/.exec(error.message);
      const stated = /line (\d+)/.exec(error.message);
      const line = stated ? Number(stated[1]) : position ? clean.slice(0, Number(position[1])).split("\n").length : 0;
      if (!line) throw new Error(`${file}: ${error.message}`);
      const shown = (clean.split("\n")[line - 1] ?? "").trim().slice(0, 140);
      throw new Error(`${file}, line ${line}: check the commas, quotes and brackets on this line and the line above it.\n${shown}`);
    }
  };

  const readJson = async (file) => {
    const response = await fetch(file, { cache: "no-cache" });
    if (!response.ok) throw new Error(`${file}: could not be loaded (HTTP ${response.status})`);
    return window.parseData(file, await response.text());
  };

  let loading;
  const loadData = () =>
    (loading ??= Promise.all([readJson("data/members.json"), readJson("data/alumni.json")]).catch((error) => {
      loading = undefined;
      throw error;
    }));

  const avatar = (person) => {
    if (person.photo) {
      return `<span class="avatar"><img src="${escapeHtml(safeUrl(person.photo))}" alt="" loading="lazy"></span>`;
    }
    const words = String(person.name ?? "").trim().split(/\s+/);
    const initials = (words[0]?.[0] ?? "") + (words.length > 1 ? words[words.length - 1][0] : "");
    return `<span class="avatar avatar-empty" aria-hidden="true">${escapeHtml(initials.toUpperCase())}</span>`;
  };

  const card = (person, role) => `
    <a class="person" href="members.html?id=${encodeURIComponent(person.id)}">
      ${avatar(person)}
      <span class="person-name">${escapeHtml(person.name)}</span>
      ${person.name_zh ? `<span class="person-zh">${escapeHtml(person.name_zh)}</span>` : ""}
      ${role ? `<span class="person-role">${escapeHtml(role)}</span>` : ""}
    </a>`;

  const group = (title, cards, extraClass = "") => `
    <section class="group ${extraClass}">
      <h2 class="group-title">${escapeHtml(title)}</h2>
      <div class="people">${cards.join("")}</div>
    </section>`;

  let alumniOpen = false;

  const renderList = (members, alumni) => {
    const people = list(members.people);
    const groups = list(members.groups);
    const known = new Set(groups.map((g) => g.id));
    const sections = [];

    for (const g of groups) {
      const inGroup = people.filter((p) => p.group === g.id);
      if (!inGroup.length) continue;
      sections.push(
        group(
          g.title,
          inGroup.map((p) => card(p, p.title || g.role || g.title)),
          g.id === "professor" ? "group-lead" : ""
        )
      );
    }

    const stray = people.filter((p) => !known.has(p.group));
    if (stray.length) sections.push(group("Other", stray.map((p) => card(p, p.title || p.group))));

    const graduates = list(alumni.people);
    if (graduates.length) {
      const years = [...new Set(graduates.map((p) => p.year ?? ""))].sort((a, b) => Number(b) - Number(a));
      const byYear = years
        .map((year) => {
          const cards = graduates.filter((p) => (p.year ?? "") === year).map((p) => card(p, p.title || p.degree));
          return `${year ? `<h3 class="year">${escapeHtml(year)}</h3>` : ""}<div class="people">${cards.join("")}</div>`;
        })
        .join("");

      sections.push(`
        <details class="group fold alumni"${alumniOpen ? " open" : ""}>
          <summary>
            <h2 class="group-title">Alumni</h2>
            <span class="count">${graduates.length}</span>
            <svg class="icon chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </summary>
          ${byYear}
        </details>`);
    }

    return sections.join("") || `<p class="notice">No members listed yet.</p>`;
  };

  const linkChip = (label, url) =>
    `<a class="lg chip" href="${escapeHtml(safeUrl(url))}"${/^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : ""}>${escapeHtml(label)}</a>`;

  const copyChip = (text) => `
    <button type="button" class="lg chip" data-copy="${escapeHtml(text)}" title="Click to copy">
      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9h10v11H9zM5 15V4h10"/></svg>
      <span>${escapeHtml(text)}</span>
    </button>`;

  const tip = (anchor, text) => {
    document.querySelector(".tip")?.remove();
    const el = document.body.appendChild(document.createElement("span"));
    el.className = "tip";
    el.setAttribute("role", "status");
    el.textContent = text;
    const box = anchor.getBoundingClientRect();
    el.style.left = `${box.left + box.width / 2}px`;
    el.style.top = `${box.top}px`;
    requestAnimationFrame(() => el.classList.add("is-shown"));
    setTimeout(() => {
      el.classList.remove("is-shown");
      setTimeout(() => el.remove(), 300);
    }, 1300);
  };

  document.addEventListener("click", async (e) => {
    const chip = e.target.closest?.("[data-copy]");
    if (!chip) return;
    try {
      await navigator.clipboard.writeText(chip.dataset.copy);
      tip(chip, "Copied");
    } catch {
      getSelection().selectAllChildren(chip.querySelector("span"));
      tip(chip, "Press Ctrl+C to copy");
    }
  });

  const block = (title, body) => (body ? `<section class="profile-block"><h3>${escapeHtml(title)}</h3>${body}</section>` : "");

  const renderProfile = (person, role) => {
    const links = [
      person.email ? copyChip(person.email) : "",
      ...Object.entries(person.links ?? {}).map(([label, url]) => linkChip(label, url)),
    ].join("");

    const facts = (rows) => `<dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${escapeHtml(v)}</dd>`).join("")}</dl>`;

    const contact = [
      person.office ? ["Office", person.office] : null,
      person.phone ? ["Phone", person.phone] : null,
    ].filter(Boolean);

    const graduated = [
      person.degree || person.year ? ["Graduated", [person.degree, person.year].filter(Boolean).join(", ")] : null,
      person.thesis ? ["Thesis", person.thesis] : null,
      person.now ? ["Now", person.now] : null,
    ].filter(Boolean);

    const bullets = (items) => (items.length ? `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>` : "");

    return `
      <a class="lg chip back" href="members.html">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
        All members
      </a>
      <div class="profile">
        ${avatar(person)}
        <div class="profile-body">
          <h2 class="profile-name">${escapeHtml(person.name)}${person.name_zh ? ` <span>${escapeHtml(person.name_zh)}</span>` : ""}</h2>
          ${role ? `<p class="profile-role">${escapeHtml(role)}</p>` : ""}
          ${links ? `<div class="scope profile-links">${links}</div>` : ""}
          ${block("About", list(person.bio).map((p) => `<p>${escapeHtml(p)}</p>`).join(""))}
          ${block("Research interests", bullets(list(person.interests)))}
          ${block("Experience", bullets(list(person.experience)))}
          ${block("Education", bullets(list(person.education)))}
          ${block("Contact", contact.length ? facts(contact) : "")}
          ${block("After the lab", graduated.length ? facts(graduated) : "")}
        </div>
      </div>`;
  };

  const members = async (el) => {
    try {
      const [current, alumni] = await loadData();
      const id = new URLSearchParams(location.search).get("id");
      if (!id) {
        el.innerHTML = renderList(current, alumni);
        el.querySelector(".alumni")?.addEventListener("toggle", (e) => (alumniOpen = e.target.open));
        return;
      }

      const groups = list(current.groups);
      const person = [...list(current.people), ...list(alumni.people)].find((p) => p.id === id);
      if (!person) {
        el.innerHTML = `<p class="notice">This person is not listed. <a href="members.html">See all members</a>.</p>`;
        return;
      }
      const g = groups.find((x) => x.id === person.group);
      el.innerHTML = renderProfile(person, person.title || g?.role || g?.title || person.degree);
      document.body.classList.add("reading");
      document.title = `${person.name} | GESE Lab`;
    } catch (error) {
      el.innerHTML = `<p class="notice"><strong>The member list could not be shown.</strong><br>${escapeHtml(error.message)}</p>`;
    }
  };

  window.views = { ...window.views, members };
})();
