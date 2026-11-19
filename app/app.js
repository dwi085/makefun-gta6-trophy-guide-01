// Leonida Trophy Guide — offline tracker for the 55 GTA VI PS5 trophies.
// Loads app/data/trophies.json (same origin, no network), keeps progress in
// localStorage, and renders the roadmap, filters, spoiler mode and export/import.
const STORAGE_KEY = 'leonida-trophy-guide-v1';
const DATA_URL = 'data/trophies.json';

const params = new URLSearchParams(location.search);
const demoMode = params.has('demo');
const demoEarned = new Set([2, 3, 8, 15, 16, 20, 21, 28, 35, 42, 44, 53, 54, 55]);

const listEl = document.getElementById('trophyList');
const searchEl = document.getElementById('search');
const spoilerEl = document.getElementById('spoiler');
const gradeEl = document.getElementById('gradeFilter');
const statusEl = document.getElementById('statusFilter');
const kindRow = document.getElementById('kindFilters');
const progressText = document.getElementById('progressText');
const progressPct = document.getElementById('progressPct');
const progressFill = document.getElementById('progressFill');
const resultCount = document.getElementById('resultCount');
const statsEl = document.getElementById('stats');

let doc = null;
let trophies = [];
let hiddenIds = new Set();
let earned = loadEarned();
let activeKind = params.get('kind') || 'all';
let revealed = new Set();

function loadEarned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(ids) ? ids.filter((n) => Number.isInteger(n)) : []);
  } catch {
    return new Set();
  }
}

function saveEarned() {
  if (demoMode) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
  } catch {
    // Storage full or blocked: progress still works in memory for this visit.
  }
}

function isEarned(t) {
  return demoMode ? demoEarned.has(t.id) : earned.has(t.id);
}

function gradeLabel(t) {
  return t.grade.charAt(0).toUpperCase() + t.grade.slice(1);
}

function stageLabel(stage) {
  return stage === 1 ? 'Stage 1 · Story' : stage === 2 ? 'Stage 2 · 100%' : 'Stage 3 · Cleanup';
}

function kindLabel(kind) {
  return { story: 'Story', missable: 'Missable', collectibles: 'Collectibles', activities: 'Activities', platinum: 'Platinum', online: 'Online' }[kind] || kind;
}

function renderStats() {
  const total = trophies.length;
  const got = trophies.filter(isEarned).length;
  const byGrade = {};
  for (const t of trophies) byGrade[t.grade] = (byGrade[t.grade] || 0) + 1;
  const gotByGrade = {};
  for (const t of trophies) if (isEarned(t)) gotByGrade[t.grade] = (gotByGrade[t.grade] || 0) + 1;
  const totalByGrade = {};
  for (const t of trophies) totalByGrade[t.grade] = (totalByGrade[t.grade] || 0) + 1;
  const onlineCount = trophies.filter((t) => t.kind === 'online').length;
  const chips = [
    `${got} / ${total} trophies`,
    `Platinum ${gotByGrade.platinum || 0}/${totalByGrade.platinum || 0}`,
    `Gold ${gotByGrade.gold || 0}/${totalByGrade.gold || 0}`,
    `Silver ${gotByGrade.silver || 0}/${totalByGrade.silver || 0}`,
    `Bronze ${gotByGrade.bronze || 0}/${totalByGrade.bronze || 0}`,
    `Missable: ${trophies.filter((t) => t.missable).length} (watch Chapter 1)`,
    `Hidden: ${hiddenIds.size} until earned`,
    `Online: ${onlineCount} — all offline`,
  ];
  statsEl.replaceChildren(...chips.map((c) => {
    const s = document.createElement('span');
    s.className = 'stat';
    s.textContent = c;
    return s;
  }));
  progressText.textContent = `${got} of ${total} earned`;
  const pct = total ? Math.round((got / total) * 100) : 0;
  progressPct.textContent = `${pct}%`;
  progressFill.style.width = `${pct}%`;
}

function renderRoadmap() {
  const wrap = document.getElementById('roadmapStages');
  wrap.replaceChildren(...doc.roadmap.map((s) => {
    const div = document.createElement('div');
    div.className = 'stage';
    const h = document.createElement('h3');
    h.textContent = s.title;
    const p = document.createElement('p');
    p.textContent = s.text;
    div.append(h, p);
    return div;
  }));
  const missable = trophies.find((t) => t.missable);
  document.getElementById('missableCallout').innerHTML = '';
  const strong = document.createElement('strong');
  strong.textContent = '⚠ The one missable trophy: ';
  const rest = document.createTextNode(
    `${missable.name} — meditate at every spot across Leonida. The first meditation, at Jason's house in Chapter 1, disappears after that chapter. Do it before Chapter 1 ends, or the platinum needs a second playthrough.`,
  );
  document.getElementById('missableCallout').append(strong, rest);
}

function renderSources() {
  const ul = document.getElementById('sourceList');
  ul.replaceChildren(...doc.sources.map((s) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.name;
    li.append(a);
    return li;
  }));
}

function renderKindFilters() {
  const kinds = [
    { key: 'all', label: 'All', count: trophies.length },
    { key: 'story', label: 'Story', count: trophies.filter((t) => t.kind === 'story').length },
    { key: 'missable', label: 'Missable', count: trophies.filter((t) => t.missable).length },
    { key: 'collectibles', label: 'Collectibles', count: trophies.filter((t) => t.kind === 'collectibles').length },
    { key: 'activities', label: 'Activities', count: trophies.filter((t) => t.kind === 'activities').length },
    { key: 'platinum', label: 'Platinum', count: trophies.filter((t) => t.kind === 'platinum').length },
    { key: 'online', label: 'Online', count: trophies.filter((t) => t.kind === 'online').length },
  ];
  kindRow.replaceChildren(...kinds.map((k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('aria-pressed', String(activeKind === k.key));
    b.textContent = `${k.label} `;
    const c = document.createElement('span');
    c.className = 'count';
    c.textContent = `(${k.count})`;
    b.append(c);
    b.addEventListener('click', () => {
      activeKind = k.key;
      renderKindFilters();
      renderList();
    });
    return b;
  }));
}

function matchesFilters(t) {
  if (activeKind === 'missable' && !t.missable) return false;
  if (activeKind === 'online') return false;
  if (activeKind !== 'all' && activeKind !== 'missable' && t.kind !== activeKind) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (statusEl.value === 'earned' && !isEarned(t)) return false;
  if (statusEl.value === 'todo' && isEarned(t)) return false;
  const q = searchEl.value.trim().toLowerCase();
  if (q) {
    const hay = `${t.name} ${t.description} ${t.guide} ${(t.steps || []).join(' ')}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function buildCard(t) {
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.trophyId = String(t.id);
  if (isEarned(t)) card.classList.add('earned');
  if (t.missable) card.classList.add('missable-card');

  const top = document.createElement('div');
  top.className = 'card-top';

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned(t);
  box.setAttribute('aria-label', `Mark ${t.name} as earned`);
  box.addEventListener('change', () => {
    if (demoMode) {
      if (box.checked) demoEarned.add(t.id); else demoEarned.delete(t.id);
    } else if (box.checked) {
      earned.add(t.id);
    } else {
      earned.delete(t.id);
    }
    saveEarned();
    renderStats();
    // With no status filter active the card stays visible: update it in place
    // so the page does not jump and the checkbox keeps focus. When a status
    // filter is active the card may need to leave the list, and when spoiler
    // mode hides a story trophy it must be revealed once earned — re-render.
    const needsRerender = statusEl.value !== 'all'
      || (spoilerEl.checked && t.kind === 'story');
    if (!needsRerender) {
      card.classList.toggle('earned', isEarned(t));
      const totalGot = trophies.filter(isEarned).length;
      const shown = trophies.filter(matchesFilters).length;
      resultCount.textContent = `Showing ${shown} of ${trophies.length} trophies · ${totalGot} earned`;
    } else {
      renderList();
    }
  });

  const head = document.createElement('div');
  head.className = 'card-head';
  const spoilerOn = spoilerEl.checked && t.kind === 'story' && !isEarned(t) && !revealed.has(t.id);

  const h = document.createElement('h3');
  if (spoilerOn) {
    h.textContent = 'Hidden story trophy';
  } else {
    h.textContent = t.name;
    const badge = document.createElement('span');
    badge.className = `grade-badge grade-${t.grade}`;
    badge.textContent = gradeLabel(t);
    h.append(badge);
  }

  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = spoilerOn ? 'Complete the story to reveal this trophy.' : t.description;

  const tags = document.createElement('div');
  tags.className = 'tag-row';
  const kindTag = document.createElement('span');
  kindTag.className = 'tag';
  kindTag.textContent = kindLabel(t.kind);
  tags.append(kindTag);
  if (t.missable) {
    const m = document.createElement('span');
    m.className = 'tag missable';
    m.textContent = '⚠ Missable';
    tags.append(m);
  }
  if (hiddenIds.has(t.id)) {
    const h = document.createElement('span');
    h.className = 'tag hidden';
    h.textContent = 'Hidden';
    tags.append(h);
  }
  const stageTag = document.createElement('span');
  stageTag.className = 'tag stage';
  stageTag.textContent = stageLabel(t.stage);
  tags.append(stageTag);

  head.append(h, desc, tags);
  top.append(box, head);
  card.append(top);

  if (spoilerOn) {
    const hidden = document.createElement('div');
    hidden.className = 'spoiler-hidden';
    hidden.textContent = 'Spoiler mode is on: this story trophy stays hidden until you earn it (or reveal it).';
    const reveal = document.createElement('button');
    reveal.type = 'button';
    reveal.textContent = 'Reveal anyway';
    reveal.addEventListener('click', () => {
      revealed.add(t.id);
      renderList();
    });
    hidden.append(reveal);
    card.append(hidden);
    return card;
  }

  const body = document.createElement('div');
  body.className = 'guide-body';
  const guide = document.createElement('p');
  guide.textContent = t.guide;
  body.append(guide);

  if (t.steps && t.steps.length) {
    const ol = document.createElement('ol');
    for (const s of t.steps) {
      const li = document.createElement('li');
      li.textContent = s;
      ol.append(li);
    }
    body.append(ol);
  }

  const src = document.createElement('p');
  src.className = 'sources';
  const label = document.createElement('strong');
  label.textContent = 'Sources: ';
  src.append(label);
  t.sources.forEach((s, i) => {
    if (i > 0) src.append(document.createTextNode(' · '));
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.name;
    src.append(a);
  });
  body.append(src);
  card.append(body);
  return card;
}

function renderList() {
  const shown = trophies.filter(matchesFilters);
  listEl.replaceChildren();
  if (activeKind === 'online') {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No online trophies: all 55 trophies are single-player and offline (PowerPyx). Nothing to track here.';
    listEl.append(empty);
  } else if (shown.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No trophies match these filters. Try clearing the search or picking another kind.';
    listEl.append(empty);
  } else {
    listEl.append(...shown.map(buildCard));
  }
  const totalGot = trophies.filter(isEarned).length;
  resultCount.textContent = `Showing ${shown.length} of ${trophies.length} trophies · ${totalGot} earned`;
}

function exportProgress() {
  const payload = {
    app: 'leonida-trophy-guide',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importProgress(file) {
  if (!file) return;
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    alert('That file is not valid JSON progress.');
    return;
  }
  const ids = Array.isArray(data) ? data : data.earned;
  if (!Array.isArray(ids)) {
    alert('That file does not hold trophy progress.');
    return;
  }
  const valid = new Set(trophies.map((t) => t.id));
  earned = new Set(ids.filter((n) => Number.isInteger(n) && valid.has(n)));
  saveEarned();
  renderStats();
  renderList();
}

async function init() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`could not load ${DATA_URL}: ${res.status}`);
  doc = await res.json();
  trophies = doc.trophies;
  hiddenIds = new Set(Array.isArray(doc.hiddenIds) ? doc.hiddenIds : []);

  if (params.get('spoiler') === 'on') spoilerEl.checked = true;
  if (params.get('spoiler') === 'off') spoilerEl.checked = false;

  renderStats();
  renderRoadmap();
  renderSources();
  renderKindFilters();
  renderList();

  searchEl.addEventListener('input', renderList);
  gradeEl.addEventListener('change', renderList);
  statusEl.addEventListener('change', renderList);
  spoilerEl.addEventListener('change', renderList);
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importFile').addEventListener('change', (e) => {
    importProgress(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all earned trophies? This cannot be undone (export first if you want a backup).')) return;
    earned = new Set();
    saveEarned();
    renderStats();
    renderList();
  });

  // Screenshot helper: ?open=<id> scrolls to a trophy and reveals it.
  const openId = Number(params.get('open'));
  if (openId) {
    revealed.add(openId);
    renderList();
    const el = listEl.querySelector(`[data-trophy-id="${openId}"]`);
    if (el) el.scrollIntoView({ block: 'center' });
  }
}

init().catch((err) => {
  listEl.replaceChildren();
  const p = document.createElement('p');
  p.className = 'empty';
  p.textContent = `Could not load the trophy data: ${err.message}`;
  listEl.append(p);
});
