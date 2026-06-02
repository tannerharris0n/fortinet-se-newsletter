/* Fortinet SE Newsletter Builder — frontend logic (framework-free). */
(function () {
  'use strict';

  var STORAGE_KEY = 'fortinet-se-newsletter-v2';
  var state = load() || NL.defaults();

  function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (_) { return null; } }
  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {} }

  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  }
  function toast(msg, isErr) {
    var t = $('toast'); t.textContent = msg; t.className = 'toast' + (isErr ? ' err' : ''); t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2800);
  }

  function renderPreview() { $('preview-frame').srcdoc = NL.render(state); }
  var renderTimer;
  function touch() { save(); clearTimeout(renderTimer); renderTimer = setTimeout(renderPreview, 120); }

  // bind an input to a nested path getter/setter
  function bind(id, get, set) {
    var node = $(id); if (!node) return;
    if (node.type === 'checkbox') {
      node.checked = !!get();
      node.addEventListener('change', function () { set(node.checked); touch(); syncE4(); });
    } else {
      node.value = get() || '';
      node.addEventListener('input', function () { set(node.value); touch(); });
    }
  }

  function syncE4() { $('e4-fields').style.display = state.events.event4.enabled ? '' : 'none'; }

  function bindAll() {
    var d = state, T = d.tips, RF = d.rapidFire, ev = d.events,
        e2 = ev.event2, e3 = ev.event3, e4 = ev.event4;

    bind('f-month', function () { return d.month; }, function (v) { d.month = v; });
    bind('f-year', function () { return d.year; }, function (v) { d.year = v; });
    bind('f-recipient', function () { return d.recipient; }, function (v) { d.recipient = v; });

    bind('f-leadblurb', function () { return d.leadBlurb; }, function (v) { d.leadBlurb = v; });

    bind('f-rf-weekday', function () { return RF.weekday; }, function (v) { RF.weekday = v; });
    bind('f-rf-monthday', function () { return RF.monthDay; }, function (v) { RF.monthDay = v; });
    bind('f-tips-topic', function () { return T.topic; }, function (v) { T.topic = v; });
    bind('f-tips-rftopic', function () { return T.rfTopic; }, function (v) { T.rfTopic = v; });
    bind('f-tips-outcome', function () { return T.seOutcome; }, function (v) { T.seOutcome = v; });

    bind('f-e2-name', function () { return e2.name; }, function (v) { e2.name = v; });
    bind('f-e2-when', function () { return e2.when; }, function (v) { e2.when = v; });
    bind('f-e2-link', function () { return e2.link; }, function (v) { e2.link = v; });
    bind('f-e2-topic', function () { return e2.topic; }, function (v) { e2.topic = v; });
    bind('f-e3-name', function () { return e3.name; }, function (v) { e3.name = v; });
    bind('f-e3-range', function () { return e3.dateRange; }, function (v) { e3.dateRange = v; });
    bind('f-e3-desc', function () { return e3.desc; }, function (v) { e3.desc = v; });
    bind('f-e4-enabled', function () { return e4.enabled; }, function (v) { e4.enabled = v; });
    bind('f-e4-name', function () { return e4.name; }, function (v) { e4.name = v; });
    bind('f-e4-when', function () { return e4.when; }, function (v) { e4.when = v; });
    bind('f-e4-desc', function () { return e4.desc; }, function (v) { e4.desc = v; });

    bind('f-signature', function () { return d.signature; }, function (v) { d.signature = v; });

    renderNews();
    renderFirmware();
    syncE4();
  }

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
    b.addEventListener('click', onclick); return b;
  }

  function renderNews() {
    var box = $('list-news'); box.innerHTML = '';
    (state.news || []).forEach(function (n, i) {
      var item = el('div', { class: 'item' });
      if (state.news.length > 1) item.appendChild(delBtn(function () { state.news.splice(i, 1); renderNews(); touch(); }));
      item.appendChild(field('Headline ' + (i + 1), n.title, function (v) { n.title = v; }));
      item.appendChild(field('Body (2–4 sentences, end with a link)', n.body, function (v) { n.body = v; }, 'textarea'));
      box.appendChild(item);
    });
    var add = el('button', { class: 'add' }, '+ add news item');
    add.addEventListener('click', function (e) { e.preventDefault(); state.news.push({ title: '', body: '' }); renderNews(); touch(); });
    box.appendChild(add);
  }

  function renderFirmware() {
    var box = $('list-firmware'); box.innerHTML = '';
    (state.firmware || []).forEach(function (val, i) {
      var item = el('div', { class: 'item fw' });
      item.appendChild(delBtn(function () { state.firmware.splice(i, 1); renderFirmware(); touch(); }));
      var input = el('input'); input.type = 'text'; input.value = val || ''; input.placeholder = 'FortiOS 7.6.5 (May)';
      input.addEventListener('input', function () { state.firmware[i] = input.value; touch(); });
      item.appendChild(input);
      box.appendChild(item);
    });
  }

  // add buttons in legends
  document.querySelectorAll('[data-add]').forEach(function (btn) {
    btn.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (btn.getAttribute('data-add') === 'firmware') { state.firmware.push(''); renderFirmware(); touch(); }
    });
  });

  // ---- exports ----
  function copyHTML() {
    var html = NL.render(state);
    navigator.clipboard.writeText(html).then(function () { toast('HTML email copied — paste into Outlook/Gmail.'); },
      function () {
        var ta = el('textarea'); ta.value = html; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta); toast('HTML email copied.');
      });
  }
  async function exportDocx() {
    var btn = $('btn-docx'); btn.disabled = true;
    try {
      var resp = await fetch('/api/export/docx', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) });
      if (!resp.ok) throw new Error('export failed');
      var blob = await resp.blob();
      var name = ('Fortinet-SE-Newsletter-' + (state.month || 'month') + '-' + (state.year || '')).replace(/\s+/g, '-') + '.docx';
      var url = URL.createObjectURL(blob); var a = el('a'); a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast('Word document downloaded — your real template, filled in.');
    } catch (e) { toast('Word export failed.', true); } finally { btn.disabled = false; }
  }

  // ---- AI ----
  var AI_PW_KEY = 'fortinet-ai-password';
  var aiGated = false;

  async function generate() {
    if (!confirm('Generate this month\'s content with AI? This overwrites the intro blurb, News, Firmware, Events and RapidFire date (your signature and the fixed template blocks are kept).')) return;

    // If the AI route is password-protected, collect/recall the password.
    var headers = { 'Content-Type': 'application/json' };
    if (aiGated) {
      var pw = localStorage.getItem(AI_PW_KEY);
      if (!pw) {
        pw = prompt('Enter the AI password to generate (set by the site owner):');
        if (!pw) return;
        localStorage.setItem(AI_PW_KEY, pw);
      }
      headers['x-ai-password'] = pw;
    }

    var btn = $('btn-generate'); btn.disabled = true; var label = btn.textContent; btn.textContent = '✨ Researching…';
    try {
      var resp = await fetch('/api/generate', { method: 'POST', headers: headers, body: JSON.stringify({ month: state.month, year: state.year }) });
      var out = await resp.json();
      if (resp.status === 401) { localStorage.removeItem(AI_PW_KEY); throw new Error('AI password rejected — try again.'); }
      if (!resp.ok || !out.data) throw new Error(out.error || 'generation failed');
      var d = out.data;
      if (d.leadBlurb != null) state.leadBlurb = d.leadBlurb;
      if (d.tips) state.tips = Object.assign({}, state.tips, d.tips);
      if (d.rapidFire) state.rapidFire = Object.assign({}, state.rapidFire, d.rapidFire);
      if (Array.isArray(d.news) && d.news.length) state.news = d.news;
      if (Array.isArray(d.firmware) && d.firmware.length) state.firmware = d.firmware;
      if (d.events) {
        state.events.event2 = Object.assign({}, state.events.event2, d.events.event2 || {});
        state.events.event3 = Object.assign({}, state.events.event3, d.events.event3 || {});
        if (d.events.event4) state.events.event4 = Object.assign({}, state.events.event4, d.events.event4);
      }
      if (d.month) state.month = d.month;
      if (d.year) state.year = String(d.year);
      bindAll(); touch();
      toast('Draft generated — verify every figure, date and quote against the source links.');
    } catch (e) { toast(e.message || 'AI generation failed.', true); }
    finally { btn.disabled = false; btn.textContent = label; }
  }

  function reset() {
    if (!confirm('Clear everything and start from a blank template?')) return;
    state = NL.defaults(); save(); bindAll(); renderPreview(); toast('Reset to a fresh template.');
  }

  $('btn-html').addEventListener('click', copyHTML);
  $('btn-docx').addEventListener('click', exportDocx);
  $('btn-reset').addEventListener('click', reset);
  $('btn-generate').addEventListener('click', generate);

  fetch('/api/config').then(function (r) { return r.json(); }).then(function (cfg) {
    aiGated = !!cfg.aiGated;
    if (cfg.aiEnabled) {
      $('btn-generate').hidden = false;
      if (aiGated) $('btn-generate').title = 'Requires the AI password set by the site owner';
    }
  }).catch(function () {});

  bindAll();
  renderPreview();
})();
