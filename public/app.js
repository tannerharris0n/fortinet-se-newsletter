/* Fortinet SE Newsletter Builder — frontend logic (framework-free). */
(function () {
  'use strict';

  var STORAGE_KEY = 'fortinet-se-newsletter';
  var state = load() || NL.defaults();

  // ---- persistence --------------------------------------------------------
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
    catch (_) { return null; }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  // ---- tiny helpers -------------------------------------------------------
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  }
  function toast(msg, isErr) {
    var t = $('toast');
    t.textContent = msg;
    t.className = 'toast' + (isErr ? ' err' : '');
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 2600);
  }

  // ---- preview ------------------------------------------------------------
  function renderPreview() {
    var frame = $('preview-frame');
    frame.srcdoc = NL.render(state);
  }

  var renderTimer;
  function touch() {
    save();
    clearTimeout(renderTimer);
    renderTimer = setTimeout(renderPreview, 120);
  }

  // ---- bind simple fields -------------------------------------------------
  function bind(id, getter, setter) {
    var node = $(id);
    if (!node) return;
    node.value = getter() || '';
    node.addEventListener('input', function () { setter(node.value); touch(); });
  }

  function bindAll() {
    bind('f-month', function () { return state.month; }, function (v) { state.month = v; });
    bind('f-year', function () { return state.year; }, function (v) { state.year = v; });
    bind('f-lead', function () { return state.lead; }, function (v) { state.lead = v; });

    state.rapidFire = state.rapidFire || {};
    bind('f-rf-date', function () { return state.rapidFire.date; }, function (v) { state.rapidFire.date = v; });
    bind('f-rf-time', function () { return state.rapidFire.time; }, function (v) { state.rapidFire.time = v; });
    bind('f-rf-topic', function () { return state.rapidFire.topic; }, function (v) { state.rapidFire.topic = v; });
    bind('f-rf-reg', function () { return state.rapidFire.registration; }, function (v) { state.rapidFire.registration = v; });
    bind('f-tips', function () { return state.tipsTeaser; }, function (v) { state.tipsTeaser = v; });

    state.evergreen = state.evergreen || NL.defaults().evergreen;
    var ft = state.evergreen.fastTracks || (state.evergreen.fastTracks = {});
    bind('f-ft-title', function () { return ft.title; }, function (v) { ft.title = v; });
    bind('f-ft-body', function () { return ft.body; }, function (v) { ft.body = v; });
    bind('f-ft-link', function () { return ft.link; }, function (v) { ft.link = v; });
    var nse = state.evergreen.nseTraining || (state.evergreen.nseTraining = {});
    bind('f-nse-title', function () { return nse.title; }, function (v) { nse.title = v; });
    bind('f-nse-body', function () { return nse.body; }, function (v) { nse.body = v; });
    bind('f-nse-link', function () { return nse.link; }, function (v) { nse.link = v; });

    renderNews();
    renderFirmware();
    renderEvents();
  }

  // ---- dynamic lists ------------------------------------------------------
  function field(label, value, oninput, type) {
    var wrap = el('label', null, label);
    var input = el(type === 'textarea' ? 'textarea' : 'input');
    if (type === 'textarea') input.rows = 2; else input.type = type || 'text';
    input.value = value || '';
    input.addEventListener('input', function () { oninput(input.value); touch(); });
    wrap.appendChild(input);
    return wrap;
  }
  function delBtn(onclick) {
    var b = el('button', { class: 'del', title: 'Remove' }, '✕');
    b.addEventListener('click', onclick);
    return b;
  }

  function renderNews() {
    var box = $('list-news'); box.innerHTML = '';
    (state.news || []).forEach(function (n, i) {
      var item = el('div', { class: 'item' });
      item.appendChild(delBtn(function () { state.news.splice(i, 1); renderNews(); touch(); }));
      item.appendChild(field('Headline', n.title, function (v) { n.title = v; }));
      var row = el('div', { class: 'row two' });
      row.appendChild(field('Date', n.date, function (v) { n.date = v; }));
      row.appendChild(field('Link', n.link, function (v) { n.link = v; }, 'url'));
      item.appendChild(row);
      item.appendChild(field('Summary (2–4 sentences)', n.summary, function (v) { n.summary = v; }, 'textarea'));
      box.appendChild(item);
    });
  }

  function renderFirmware() {
    var box = $('list-firmware'); box.innerHTML = '';
    (state.firmware || []).forEach(function (f, i) {
      var item = el('div', { class: 'item' });
      item.appendChild(delBtn(function () { state.firmware.splice(i, 1); renderFirmware(); touch(); }));
      var row = el('div', { class: 'row three' });
      row.appendChild(field('Product', f.product, function (v) { f.product = v; }));
      row.appendChild(field('Version', f.version, function (v) { f.version = v; }));
      row.appendChild(field('Note', f.note, function (v) { f.note = v; }));
      item.appendChild(row);
      box.appendChild(item);
    });
  }

  function renderEvents() {
    var box = $('list-events'); box.innerHTML = '';
    (state.events || []).forEach(function (e, i) {
      var item = el('div', { class: 'item' });
      item.appendChild(delBtn(function () { state.events.splice(i, 1); renderEvents(); touch(); }));
      item.appendChild(field('Name', e.name, function (v) { e.name = v; }));
      var row = el('div', { class: 'row two' });
      row.appendChild(field('Date', e.date, function (v) { e.date = v; }));
      row.appendChild(field('Time', e.time, function (v) { e.time = v; }));
      item.appendChild(row);
      item.appendChild(field('Description', e.description, function (v) { e.description = v; }, 'textarea'));
      item.appendChild(field('Link', e.link, function (v) { e.link = v; }, 'url'));
      box.appendChild(item);
    });
  }

  // ---- add buttons --------------------------------------------------------
  document.querySelectorAll('[data-add]').forEach(function (btn) {
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      var kind = btn.getAttribute('data-add');
      if (kind === 'news') { (state.news = state.news || []).push({ title: '', date: '', summary: '', link: '' }); renderNews(); }
      if (kind === 'firmware') { (state.firmware = state.firmware || []).push({ product: '', version: '', note: '' }); renderFirmware(); }
      if (kind === 'events') { (state.events = state.events || []).push({ name: '', date: '', time: '', description: '', link: '' }); renderEvents(); }
      touch();
    });
  });

  // ---- exports ------------------------------------------------------------
  function copyHTML() {
    var html = NL.render(state);
    navigator.clipboard.writeText(html).then(function () {
      toast('HTML email copied — paste into Outlook/Gmail.');
    }, function () {
      // fallback
      var ta = el('textarea'); ta.value = html; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      toast('HTML email copied.');
    });
  }
  function downloadHTML() {
    var blob = new Blob([NL.render(state)], { type: 'text/html' });
    triggerDownload(blob, fileName('html'));
  }
  async function exportDocx() {
    var btn = $('btn-docx'); btn.disabled = true;
    try {
      var resp = await fetch('/api/export/docx', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state)
      });
      if (!resp.ok) throw new Error('export failed');
      var blob = await resp.blob();
      triggerDownload(blob, fileName('docx'));
      toast('Word document downloaded.');
    } catch (e) {
      toast('Word export failed.', true);
    } finally { btn.disabled = false; }
  }
  function fileName(ext) {
    return ('Fortinet-SE-Newsletter-' + (state.month || 'month') + '-' + (state.year || '')).replace(/\s+/g, '-') + '.' + ext;
  }
  function triggerDownload(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = el('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  // ---- AI generate --------------------------------------------------------
  async function generate() {
    if (!confirm('Generate this month\'s content with AI? This overwrites News, Firmware, Events, Lead and Tips (your evergreen blocks are kept).')) return;
    var btn = $('btn-generate'); btn.disabled = true; btn.textContent = '✨ Researching…';
    try {
      var resp = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: state.month, year: state.year })
      });
      var out = await resp.json();
      if (!resp.ok || !out.data) throw new Error(out.error || 'generation failed');
      var d = out.data;
      // Merge AI fields; preserve evergreen + anything the model omitted.
      ['lead', 'tipsTeaser'].forEach(function (k) { if (d[k] != null) state[k] = d[k]; });
      if (Array.isArray(d.news) && d.news.length) state.news = d.news;
      if (Array.isArray(d.firmware) && d.firmware.length) state.firmware = d.firmware;
      if (Array.isArray(d.events) && d.events.length) state.events = d.events;
      if (d.rapidFire) state.rapidFire = Object.assign({}, state.rapidFire, d.rapidFire);
      if (d.month) state.month = d.month;
      if (d.year) state.year = String(d.year);
      bindAll(); touch();
      toast('Draft generated — review every item against the source links.');
    } catch (e) {
      toast(e.message || 'AI generation failed.', true);
    } finally {
      btn.disabled = false; btn.textContent = '✨ Generate with AI';
    }
  }

  // ---- reset --------------------------------------------------------------
  function reset() {
    if (!confirm('Clear everything and start from a blank template?')) return;
    state = NL.defaults(); save(); bindAll(); renderPreview();
    toast('Reset to a fresh template.');
  }

  // ---- wire up ------------------------------------------------------------
  $('btn-html').addEventListener('click', copyHTML);
  $('btn-html-dl').addEventListener('click', downloadHTML);
  $('btn-docx').addEventListener('click', exportDocx);
  $('btn-reset').addEventListener('click', reset);
  $('btn-generate').addEventListener('click', generate);

  // Show the AI button only if the server has a key configured.
  fetch('/api/config').then(function (r) { return r.json(); }).then(function (cfg) {
    if (cfg.aiEnabled) $('btn-generate').hidden = false;
  }).catch(function () {});

  bindAll();
  renderPreview();
})();
