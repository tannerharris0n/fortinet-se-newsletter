/*
 * Newsletter content model + a HUMBLE HTML preview renderer.
 * Loaded in the browser as window.NL (also require-able in Node for tests).
 *
 * IMPORTANT: this preview is approximate. The real, pixel-faithful output is the
 * Word export, which fills your actual template/newsletter.docx. The preview just
 * mirrors the same content + scaffolding so you can see it while editing.
 *
 * The field names here map 1:1 to the {tags} in the Word template
 * (see lib/buildTags.js).
 */
(function (root) {
  'use strict';

  var BRAND = '#DA291C';
  var INK = '#1a1a1a';
  var MUTED = '#9a9a9a';

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  function secondFriday(year, monthIndex) {
    var d = new Date(year, monthIndex, 1), count = 0;
    while (true) { if (d.getDay() === 5) { count++; if (count === 2) break; } d.setDate(d.getDate() + 1); }
    return d;
  }

  function defaults() {
    var now = new Date();
    var mi = now.getMonth(), year = now.getFullYear();
    var rf = secondFriday(year, mi);
    var weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][rf.getDay()];
    return {
      month: MONTHS[mi],
      year: String(year),
      recipient: 'everyone',
      lead: {
        headline: '', elaboration: '', takeaway: '',
        story2Headline: '', story2Summary: '', story2Quote: '',
        story3What: '', story3Models: '', story3Benefits: ''
      },
      tips: { topic: '', rfTopic: '', seOutcome: '' },
      rapidFire: { weekday: weekday, monthDay: MONTHS[mi] + ' ' + rf.getDate() },
      news: [
        { title: '', body: '' },
        { title: '', body: '' },
        { title: '', body: '' }
      ],
      firmware: [], // array of strings, e.g. "FortiOS 7.6.5 (May)"
      events: {
        event2: { name: '', when: '', link: '', topic: '' },
        event3: { name: '', dateRange: '', desc: '' },
        event4: { enabled: false, name: '', when: '', desc: '' }
      },
      signature: ''
    };
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function has(v) { return v != null && String(v).trim() !== ''; }
  // value, or a muted hint when blank, so the preview never looks broken
  function ph(v, hint) {
    return has(v) ? esc(v) : '<span style="color:' + MUTED + ';font-style:italic;">' + esc(hint) + '</span>';
  }
  function nl2br(v) { return esc(v).replace(/\n/g, '<br>'); }

  function render(data) {
    data = data || defaults();
    var L = data.lead || {}, T = data.tips || {}, RF = data.rapidFire || {};
    var news = data.news || [], ev = data.events || {}, e2 = ev.event2 || {}, e3 = ev.event3 || {}, e4 = ev.event4 || {};

    var p = 'margin:0 0 12px;font-size:14px;line-height:1.6;color:' + INK + ';';
    var h2 = 'font-size:18px;font-weight:800;color:' + BRAND + ';margin:22px 0 8px;border-bottom:2px solid ' + BRAND + ';padding-bottom:3px;';

    // firmware as a 4-col table mirroring the Word layout
    var fw = (data.firmware || []).filter(has);
    var cells = '';
    var total = Math.max(fw.length, 0);
    var rows = Math.ceil(total / 4);
    for (var r = 0; r < rows; r++) {
      cells += '<tr>';
      for (var c = 0; c < 4; c++) {
        var v = fw[r * 4 + c];
        cells += '<td style="border:1px solid #e3e3e3;padding:5px 8px;font-size:13px;color:' + INK + ';">' + (has(v) ? esc(v) : '&nbsp;') + '</td>';
      }
      cells += '</tr>';
    }
    var fwTable = rows ? '<table style="border-collapse:collapse;width:100%;margin:6px 0;">' + cells + '</table>'
      : '<p style="' + p + 'color:' + MUTED + ';font-style:italic;">No firmware rows yet.</p>';

    var event4HTML = e4.enabled ? (
      '<p style="' + p + 'margin-top:14px;"><strong>' + ph(e4.name, '[Additional event]') + '</strong><br>' +
      ph(e4.when, '[Date | Time | Timezone]') + '<br>' + ph(e4.desc, '[Description]') + '</p>'
    ) : '';

    return '' +
'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
'<body style="margin:0;background:#f4f4f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">' +
'<div style="max-width:680px;margin:0 auto;background:#fff;padding:28px 32px;">' +

  '<div style="font-size:11px;color:' + MUTED + ';text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">' +
    'Approximate preview — the Word export is the real layout' +
  '</div>' +

  '<p style="' + p + '">Hello ' + ph(data.recipient, 'everyone') + ',</p>' +

  // lead paragraph 1
  '<p style="' + p + '">In this month\'s Fortinet SE Newsletter, we lead with ' + ph(L.headline, '[lead story headline]') +
    '. ' + ph(L.elaboration, '[2–3 sentence elaboration]') +
    '. The takeaway for defenders: ' + ph(L.takeaway, '[1 sentence implication]') + '.</p>' +
  // lead paragraph 2
  '<p style="' + p + '">We are also excited to share that ' + ph(L.story2Headline, '[story 2 / partnership]') +
    '. ' + ph(L.story2Summary, '[2–3 sentence summary]') +
    (has(L.story2Quote) ? ' ' + esc(L.story2Quote) : '') + '</p>' +
  // lead paragraph 3
  '<p style="' + p + '">We are also announcing ' + ph(L.story3What, '[story 3 / new product]') +
    ' — ' + ph(L.story3Models, '[model names]') +
    ' — delivering ' + ph(L.story3Benefits, '[3 key benefits]') + '.</p>' +
  // RapidFire teaser
  '<p style="' + p + '">In the Tools, Tips and Tricks section, we discuss ' + ph(T.topic, '[SE topic this month]') +
    '. Join us for this month\'s RapidFire Demo on ' + ph(RF.weekday, '[weekday]') + ', ' + ph(RF.monthDay, '[month day]') +
    ' at 11:30 AM PT for a closer look at ' + ph(T.rfTopic || T.topic, '[topic]') +
    ' and how to ' + ph(T.seOutcome, '[SE-driven outcome]') + '. Register and download the meeting invite here as it\'s an updated Zoom link.</p>' +

  // Updates
  '<div style="' + h2 + '">Updates</div>' +
  news.map(function (n, i) {
    return '<p style="' + p + '"><strong>' + ph(n.title, '[News item ' + (i + 1) + ' headline]') + '</strong><br>' +
      (has(n.body) ? nl2br(n.body) : '<span style="color:' + MUTED + ';font-style:italic;">[news item ' + (i + 1) + ' body]</span>') + '</p>';
  }).join('') +

  // Firmware
  '<div style="' + h2 + '">New firmware released in ' + ph(data.month, '[month]') + '</div>' +
  '<p style="' + p + 'font-size:13px;">Recommended Release of FortiOS, FortiManager and FortiAnalyzer — links preserved in the Word doc.</p>' +
  fwTable +
  '<p style="' + p + 'font-size:12px;color:' + MUTED + ';">RSS feeds &amp; ' + ph(data.year, '[year]') + ' vulnerability advisories — links preserved in the Word doc.</p>' +

  // Tools/Tips marker (SE fills in Word)
  '<div style="' + h2 + '">Tools, Tips &amp; Tricks</div>' +
  '<p style="' + p + 'color:' + MUTED + ';font-style:italic;">&lt;SE team fills this section with screenshots and a walkthrough in Word — left untouched by this tool.&gt;</p>' +

  // Events
  '<div style="' + h2 + '">Events</div>' +
  '<p style="' + p + '"><strong>Fortinet RapidFire Q&amp;A</strong><br>' +
    ph(RF.weekday, '[weekday]') + ' ' + ph(RF.monthDay, '[month day]') + ' at 11:30am PT – Virtual<br>' +
    'Join your Fortinet SE team for a 30-minute rapid fire session where we discuss the latest Fortinet news, tech tips, live demos, and trivia challenge.<br>' +
    'Register here: https://events.fortinet.com/fortirapidfire</p>' +
  '<p style="' + p + '"><strong>' + ph(e2.name, '[Event 2 — summit / webinar]') + '</strong><br>' +
    ph(e2.when, '[Month Day | Time Timezone]') + '<br>' +
    (has(e2.link) ? 'Register here: ' + esc(e2.link) + '<br>' : '') +
    'Topic: ' + ph(e2.topic, '[event 2 description]') + '</p>' +
  '<p style="' + p + '"><strong>' + ph(e3.name, '[Event 3 — industry conference]') + '</strong><br>' +
    ph(e3.dateRange, '[date range]') + '<br>' +
    ph(e3.desc, '[event 3 description]') + '</p>' +
  event4HTML +

  // Evergreen (verbatim)
  '<div style="' + h2 + '">Fortinet Fast Tracks</div>' +
  '<p style="' + p + '">Fortinet continues to host interactive technical workshops with hands-on labs for a multitude of its technology solutions. Register here: https://events.fortinet.com/fortinetfasttrackworkshops/end-users</p>' +
  '<div style="' + h2 + '">Fortinet Network Security Expert Training</div>' +
  '<p style="' + p + '">Check out our highly rated Fortinet NSE Training. Hours of free on-demand training content along with a multitude of specialized training tracks. Learn more about the free training here and download the NSE program brochure here.</p>' +

  '<p style="' + p + 'margin-top:20px;">Regards,<br>' + ph(data.signature, '[Insert SE signature]') + '</p>' +

  '<p style="font-size:11px;color:' + MUTED + ';border-top:1px solid #e3e3e3;padding-top:12px;margin-top:24px;line-height:1.5;">' +
    'Personal side project — not affiliated with, endorsed by, or sponsored by Fortinet, Inc. ' +
    'All product names and brands are property of their respective owners. Content compiled from public Fortinet sources.</p>' +

'</div></body></html>';
  }

  var api = { defaults: defaults, render: render, secondFriday: secondFriday, MONTHS: MONTHS };
  root.NL = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
