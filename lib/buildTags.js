/*
 * Maps the app's newsletter content model (see public/template.js) to the flat
 * set of {tags} used by template/newsletter.docx.
 *
 * Every tag the template references MUST get a value here (empty string if blank),
 * or docxtemplater would treat it as undefined.
 */
'use strict';

const FW_CELLS = 48; // 4 columns x 12 rows in the firmware table

function s(v) { return v == null ? '' : String(v); }

function buildTags(data) {
  data = data || {};
  const lead = data.lead || {};
  const tips = data.tips || {};
  const rf = data.rapidFire || {};
  const news = data.news || [];
  const ev = data.events || {};
  const e2 = ev.event2 || {};
  const e3 = ev.event3 || {};
  const e4 = ev.event4 || {};

  const tags = {
    recipient: s(data.recipient) || 'everyone',
    month: s(data.month),
    year: s(data.year),

    // lead
    leadHeadline: s(lead.headline),
    leadElaboration: s(lead.elaboration),
    leadTakeaway: s(lead.takeaway),
    story2Headline: s(lead.story2Headline),
    story2Summary: s(lead.story2Summary),
    story2Quote: s(lead.story2Quote),
    story3What: s(lead.story3What),
    story3Models: s(lead.story3Models),
    story3Benefits: s(lead.story3Benefits),

    // RapidFire teaser
    tipsTopic: s(tips.topic),
    rfTopic: s(tips.rfTopic) || s(tips.topic),
    seOutcome: s(tips.seOutcome),
    rfWeekday: s(rf.weekday),
    rfMonthDay: s(rf.monthDay),

    // news
    news1Title: s((news[0] || {}).title),
    news1Body: s((news[0] || {}).body),
    news2Title: s((news[1] || {}).title),
    news2Body: s((news[1] || {}).body),
    news3Title: s((news[2] || {}).title),
    news3Body: s((news[2] || {}).body),

    // events
    event2Name: s(e2.name),
    event2When: s(e2.when),
    event2Link: s(e2.link),
    event2Topic: s(e2.topic),
    event3Name: s(e3.name),
    event3DateRange: s(e3.dateRange),
    event3Desc: s(e3.desc),
    event4: e4.enabled ? true : false,
    event4Name: s(e4.name),
    event4When: s(e4.when),
    event4Desc: s(e4.desc),

    signature: s(data.signature)
  };

  // firmware cells fw1..fw48
  const fw = Array.isArray(data.firmware) ? data.firmware : [];
  for (let i = 0; i < FW_CELLS; i++) {
    const entry = fw[i];
    let val = '';
    if (typeof entry === 'string') val = entry;
    else if (entry && typeof entry === 'object') val = [entry.product, entry.version, entry.note].filter(Boolean).join(' ');
    tags['fw' + (i + 1)] = val;
  }

  return tags;
}

module.exports = { buildTags, FW_CELLS };
