/*
 * Newsletter data model + HTML renderer.
 * Loaded in the browser as a global (window.NL) for live preview and HTML export.
 * The SAME render output is used for the "Copy/Export HTML email" feature.
 *
 * Keep this file framework-free so it stays easy to read and fork.
 */
(function (root) {
  'use strict';

  var BRAND = '#DA291C'; // Fortinet red
  var INK = '#1a1a1a';
  var MUTED = '#5a5a5a';
  var LINE = '#e3e3e3';

  // --- date helper: second Friday of a given month -------------------------
  function secondFriday(year, monthIndex) {
    var d = new Date(year, monthIndex, 1);
    var count = 0;
    while (true) {
      if (d.getDay() === 5) { count++; if (count === 2) break; }
      d.setDate(d.getDate() + 1);
    }
    return d;
  }

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  function fmtLongDate(d) {
    return MONTHS[d.getMonth()] + ' ' + d.getDate();
  }

  // --- default / starter newsletter ---------------------------------------
  function defaults() {
    var now = new Date();
    var monthIdx = now.getMonth();
    var year = now.getFullYear();
    var rf = secondFriday(year, monthIdx);

    return {
      month: MONTHS[monthIdx],
      year: String(year),
      lead: '',
      news: [
        { title: '', date: '', summary: '', link: '' },
        { title: '', date: '', summary: '', link: '' },
        { title: '', date: '', summary: '', link: '' }
      ],
      firmware: [
        { product: 'FortiOS', version: '', note: '' }
      ],
      rapidFire: {
        date: fmtLongDate(rf),
        time: '11:30 AM PT',
        topic: '',
        registration: ''
      },
      tipsTeaser: '',
      events: [
        { name: '', date: '', time: '', description: '', link: '' }
      ],
      evergreen: {
        fastTracks: {
          title: 'Fortinet Fast Track Workshops',
          body: 'Free, hands-on technical workshops covering FortiGate, SD-WAN, the Security Fabric, SASE, OT security, and more. Great for SEs and customers who want guided labs.',
          link: 'https://www.fortinet.com/training/fast-track'
        },
        nseTraining: {
          title: 'Fortinet Training Institute (NSE Training)',
          body: 'Self-paced certification courses and free training, including the Fortinet Certified Associate/Professional/Expert tracks and free security awareness training.',
          link: 'https://training.fortinet.com/'
        }
      }
    };
  }

  // --- small html helpers --------------------------------------------------
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function linkHTML(url, label) {
    if (!url) return esc(label || '');
    return '<a href="' + esc(url) + '" style="color:' + BRAND + ';text-decoration:underline;">' + esc(label || url) + '</a>';
  }
  function has(v) { return v != null && String(v).trim() !== ''; }

  // --- render full newsletter to a self-contained, email-safe HTML string --
  function render(data) {
    data = data || defaults();
    var title = 'Fortinet SE Newsletter — ' + esc(data.month) + ' ' + esc(data.year);

    var newsHTML = (data.news || []).filter(function (n) {
      return has(n.title) || has(n.summary);
    }).map(function (n, i) {
      return '' +
        '<tr><td style="padding:14px 0;border-bottom:1px solid ' + LINE + ';">' +
          '<div style="font-size:12px;color:' + BRAND + ';font-weight:700;letter-spacing:.5px;text-transform:uppercase;">' + (i + 1) + '. News</div>' +
          '<div style="font-size:17px;font-weight:700;color:' + INK + ';margin:4px 0;">' + linkHTML(n.link, n.title || '(untitled)') + '</div>' +
          (has(n.date) ? '<div style="font-size:12px;color:' + MUTED + ';margin-bottom:6px;">' + esc(n.date) + '</div>' : '') +
          '<div style="font-size:14px;line-height:1.55;color:' + INK + ';">' + esc(n.summary) + '</div>' +
        '</td></tr>';
    }).join('');

    var firmwareRows = (data.firmware || []).filter(function (f) {
      return has(f.product) || has(f.version);
    }).map(function (f) {
      var label = [f.product, f.version].filter(has).join(' ');
      if (has(f.note)) label += ' ' + f.note;
      return '<tr><td style="padding:7px 12px;border-bottom:1px solid ' + LINE + ';font-size:14px;color:' + INK + ';">' + esc(label) + '</td></tr>';
    }).join('');

    var rf = data.rapidFire || {};
    var rfLine = 'Join the monthly Fortinet RapidFire Q&A on <strong>' + esc(rf.date) + '</strong>' +
      (has(rf.time) ? ' at <strong>' + esc(rf.time) + '</strong>' : '') + '.' +
      (has(rf.topic) ? ' This month the SE team will demo <strong>' + esc(rf.topic) + '</strong>.' : ' Tools/Tips/Tricks topic TBD.');

    var eventsHTML = (data.events || []).filter(function (e) {
      return has(e.name);
    }).map(function (e) {
      var when = [e.date, e.time].filter(has).join(' · ');
      return '' +
        '<tr><td style="padding:12px 0;border-bottom:1px solid ' + LINE + ';">' +
          '<div style="font-size:15px;font-weight:700;color:' + INK + ';">' + linkHTML(e.link, e.name) + '</div>' +
          (has(when) ? '<div style="font-size:12px;color:' + MUTED + ';margin:2px 0;">' + esc(when) + '</div>' : '') +
          (has(e.description) ? '<div style="font-size:14px;line-height:1.5;color:' + INK + ';">' + esc(e.description) + '</div>' : '') +
        '</td></tr>';
    }).join('');

    var eg = data.evergreen || {};
    function evergreenBlock(b) {
      if (!b) return '';
      return '' +
        '<div style="margin:10px 0;">' +
          '<div style="font-size:15px;font-weight:700;color:' + INK + ';">' + esc(b.title) + '</div>' +
          '<div style="font-size:14px;line-height:1.5;color:' + INK + ';margin:3px 0;">' + esc(b.body) + '</div>' +
          (has(b.link) ? '<div style="font-size:14px;">' + linkHTML(b.link, 'Learn more →') + '</div>' : '') +
        '</div>';
    }

    function section(heading) {
      return '<tr><td style="padding:22px 0 6px;"><div style="font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:' + BRAND + ';border-bottom:2px solid ' + BRAND + ';display:inline-block;padding-bottom:3px;">' + esc(heading) + '</div></td></tr>';
    }

    return '' +
'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + '</title></head>' +
'<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">' +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 12px;"><tr><td align="center">' +
'<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">' +
  // header
  '<tr><td style="background:' + BRAND + ';padding:24px 28px;">' +
    '<div style="color:#fff;font-size:13px;letter-spacing:2px;text-transform:uppercase;opacity:.9;">Fortinet SE Newsletter</div>' +
    '<div style="color:#fff;font-size:28px;font-weight:800;margin-top:4px;">' + esc(data.month) + ' ' + esc(data.year) + '</div>' +
  '</td></tr>' +
  '<tr><td style="padding:24px 28px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
      // lead
      (has(data.lead) ? '<tr><td style="font-size:15px;line-height:1.6;color:' + INK + ';padding-bottom:6px;">' + esc(data.lead) + '</td></tr>' : '') +
      // news
      section('Top Fortinet News') + '<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + newsHTML + '</table></td></tr>' +
      // firmware
      section('Firmware Released This Month') +
      '<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ' + LINE + ';border-radius:6px;overflow:hidden;margin-top:6px;">' + (firmwareRows || '<tr><td style="padding:7px 12px;font-size:14px;color:' + MUTED + ';">No releases listed.</td></tr>') + '</table></td></tr>' +
      // rapidfire + events
      section('Upcoming Events & Webinars') +
      '<tr><td style="font-size:14px;line-height:1.6;color:' + INK + ';padding:8px 0;">' + rfLine + '</td></tr>' +
      '<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + eventsHTML + '</table></td></tr>' +
      // tips teaser
      '<tr><td style="padding:14px 0;"><div style="background:#fff5f4;border-left:4px solid ' + BRAND + ';padding:12px 14px;border-radius:0 6px 6px 0;">' +
        '<div style="font-size:13px;font-weight:700;color:' + BRAND + ';text-transform:uppercase;letter-spacing:.5px;">Tools / Tips / Tricks</div>' +
        '<div style="font-size:14px;line-height:1.5;color:' + INK + ';margin-top:4px;">' + (has(data.tipsTeaser) ? esc(data.tipsTeaser) : '&lt;TIPS &amp; TRICKS&gt; — SE screenshot block. Add this month\'s demo content.') + '</div>' +
      '</div></td></tr>' +
      // evergreen
      section('Always-On Resources') +
      '<tr><td style="padding-top:6px;">' + evergreenBlock(eg.fastTracks) + evergreenBlock(eg.nseTraining) + '</td></tr>' +
    '</table>' +
  '</td></tr>' +
  // footer
  '<tr><td style="background:#fafafa;border-top:1px solid ' + LINE + ';padding:16px 28px;font-size:12px;color:' + MUTED + ';line-height:1.5;">' +
    'Fortinet SE Newsletter · Compiled from public Fortinet sources · ' + esc(data.month) + ' ' + esc(data.year) + '<br>' +
    '<span style="font-size:11px;">This is a personal side project and is not affiliated with, endorsed by, or sponsored by Fortinet, Inc. All product names and brands are property of their respective owners.</span>' +
  '</td></tr>' +
'</table>' +
'</td></tr></table></body></html>';
  }

  var api = { defaults: defaults, render: render, secondFriday: secondFriday, MONTHS: MONTHS, fmtLongDate: fmtLongDate };

  // export for browser (global) and node (require) just in case
  root.NL = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
