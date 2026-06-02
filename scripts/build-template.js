/*
 * build-template.js — one-time (re-runnable) generator.
 *
 * Reads the ORIGINAL Fortinet SE newsletter Word doc, strips the prompt / how-to
 * preamble, and replaces every [PLACEHOLDER] with a docxtemplater {tag}, producing
 * template/newsletter.docx. The app fills that tagged template each month.
 *
 * The Tools/Tips section keeps its [brackets] on purpose — SEs fill it in Word.
 * Everything else (fonts, the 4x12 firmware table, headers/footers, Fast Tracks,
 * NSE, RapidFire boilerplate, signature scaffolding) is preserved exactly.
 *
 * Usage: npm run build:template
 */
'use strict';

const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const SRC = path.join(__dirname, '..', 'FORTINET SE NEWSLETTER TEMPLATE.docx');
const OUT_DIR = path.join(__dirname, '..', 'template');
const OUT = path.join(OUT_DIR, 'newsletter.docx');

// Remove the whole <w:p>…</w:p> that contains `marker`.
function removeParagraphContaining(xml, marker) {
  const idx = xml.indexOf(marker);
  if (idx === -1) throw new Error('marker not found: ' + marker);
  const pStart = xml.lastIndexOf('<w:p ', idx);
  const pEnd = xml.indexOf('</w:p>', idx);
  if (pStart === -1 || pEnd === -1) throw new Error('paragraph bounds not found for: ' + marker);
  return xml.slice(0, pStart) + xml.slice(pEnd + '</w:p>'.length);
}

// Replace the text inside the <w:t> run that contains `marker` with `newInner`.
function replaceRunTextContaining(xml, marker, newInner) {
  const idx = xml.indexOf(marker);
  if (idx === -1) throw new Error('marker not found: ' + marker);
  const open = Math.max(xml.lastIndexOf('<w:t>', idx), xml.lastIndexOf('<w:t ', idx));
  const openEnd = xml.indexOf('>', open);
  const close = xml.indexOf('</w:t>', idx);
  if (open === -1 || openEnd === -1 || close === -1) throw new Error('run bounds not found for: ' + marker);
  return xml.slice(0, openEnd + 1) + newInner + xml.slice(close);
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error('Source not found:', SRC);
    console.error('Place the original "FORTINET SE NEWSLETTER TEMPLATE.docx" in the project root.');
    process.exit(1);
  }

  const zip = new PizZip(fs.readFileSync(SRC));
  let xml = zip.file('word/document.xml').asText();

  // 1) Strip the preamble: keep <w:body ...> then jump straight to the
  //    "Hello [RECIPIENT FIRST NAME]" paragraph.
  const bodyOpen = xml.match(/<w:body[^>]*>/);
  if (!bodyOpen) throw new Error('No <w:body> found.');
  const bodyOpenEnd = bodyOpen.index + bodyOpen[0].length;

  const helloTextIdx = xml.indexOf('Hello [RECIPIENT FIRST NAME]');
  if (helloTextIdx === -1) throw new Error('Could not find the "Hello [RECIPIENT FIRST NAME]" anchor.');
  const helloParaStart = xml.lastIndexOf('<w:p ', helloTextIdx);
  if (helloParaStart === -1 || helloParaStart < bodyOpenEnd) throw new Error('Could not locate the Hello paragraph start.');

  xml = xml.slice(0, bodyOpenEnd) + xml.slice(helloParaStart);

  // 1b) Collapse the lead: the original has three big paragraphs (stories 1-3).
  //     We want a SHORT intro blurb instead — the detailed stories live in the
  //     Updates/news section. Keep paragraph 1 (as {leadBlurb}) and drop 2 & 3.
  xml = removeParagraphContaining(xml, 'We are also excited to share that');
  xml = removeParagraphContaining(xml, 'We are also announcing');
  xml = replaceRunTextContaining(xml, 'we lead with [LEAD STORY HEADLINE', '{leadBlurb}');

  // 2) Firmware: 48 identical "[Product] [Version]" cells -> {fw1}..{fw48}
  let fwCount = 0;
  xml = xml.replace(/\[Product\] \[Version\]/g, () => '{fw' + (++fwCount) + '}');

  // 3) Replace the remaining known placeholders (most-specific first).
  //    [^\]]* matches the placeholder body up to its closing bracket.
  const reps = [
    // greeting
    [/\[RECIPIENT FIRST NAME\]/g, '{recipient}'],

    // (lead paragraphs are collapsed into {leadBlurb} above)

    // RapidFire teaser paragraph
    [/\[SE TOPIC THIS MONTH\]/g, '{tipsTopic}'],
    [/\[WEEKDAY\], \[MONTH DAY\]/g, '{rfWeekday}, {rfMonthDay}'],
    [/\[TOPIC\]/g, '{rfTopic}'],
    [/\[SE-DRIVEN OUTCOME\]/g, '{seOutcome}'],

    // Updates / news
    [/\[NEWS ITEM 1 HEADLINE\]/g, '{news1Title}'],
    [/\[NEWS ITEM 1 BODY[^\]]*\]/g, '{news1Body}'],
    [/\[NEWS ITEM 2 HEADLINE\]/g, '{news2Title}'],
    [/\[NEWS ITEM 2 BODY[^\]]*\]/g, '{news2Body}'],
    [/\[NEWS ITEM 3 HEADLINE\]/g, '{news3Title}'],
    [/\[NEWS ITEM 3 BODY[^\]]*\]/g, '{news3Body}'],

    // firmware heading month + advisories year
    [/New firmware released in \[MONTH\]:/g, 'New firmware released in {month}:'],
    [/\[YEAR\]/g, '{year}'],

    // Events — RapidFire date line: [WEEKDAY] [MONTH] [DAY]
    [/\[WEEKDAY\] \[MONTH\] \[DAY\]/g, '{rfWeekday} {rfMonthDay}'],
    // Event 2 (summit / webinar)
    [/\[EVENT 2 NAME[^\]]*\]/g, '{event2Name}'],
    [/\[MONTH DAY\] \| \[TIME\] \[TIMEZONE\]/g, '{event2When}'],
    [/\[Registration link\]/g, '{event2Link}'],
    [/\[2[^\]]*describing the event topic[^\]]*\]/g, '{event2Topic}'],
    // Event 3 (industry conference)
    [/\[EVENT 3 NAME[^\]]*\]/g, '{event3Name}'],
    [/\[DATE RANGE\]/g, '{event3DateRange}'],
    [/\[1[^\]]*Fortinet[^\]]*role[^\]]*\]/g, '{event3Desc}'],
    // Event 4 (optional) — wrap the block in a docxtemplater section
    [/\[ADD'?L EVENT[^\]]*\]/g, '{#event4}{event4Name}'],
    [/\[DATE \| TIME \| TIMEZONE\]/g, '{event4When}'],
    [/\[1[^\]]*description and registration link\.\]/g, '{event4Desc}{/event4}'],

    // signature
    [/\[Insert SE Signature\]/g, '{signature}']
  ];

  const applied = [];
  for (const [re, tag] of reps) {
    const before = xml;
    xml = xml.replace(re, tag);
    applied.push({ tag, hit: before !== xml });
  }

  // 4) Report any tags that didn't match (so we catch template drift early).
  const missed = applied.filter(a => !a.hit);
  if (missed.length) {
    console.warn('WARNING: these replacements matched nothing:', missed.map(m => m.tag).join(', '));
  }

  zip.file('word/document.xml', xml);
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }));

  // Quick visibility into what remains bracketed (should be only Tools/Tips).
  const leftover = (xml.match(/\[[^\]]+\]/g) || []);
  console.log('Wrote', path.relative(process.cwd(), OUT));
  console.log('Firmware cells tagged:', fwCount);
  console.log('Remaining [brackets] (expected: Tools/Tips placeholders):', leftover.length);
  leftover.slice(0, 20).forEach(b => console.log('  ', b));
}

main();
