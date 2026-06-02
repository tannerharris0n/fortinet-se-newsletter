/*
 * Renders the newsletter data model to a Word (.docx) buffer using the `docx` library.
 * Mirrors the structure of the HTML email but as a clean, editable Word document.
 */
'use strict';

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ExternalHyperlink, BorderStyle
} = require('docx');

const BRAND = 'DA291C';

function has(v) { return v != null && String(v).trim() !== ''; }

function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 320, after: 120 },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, color: BRAND, size: 24 })],
    border: { bottom: { color: BRAND, space: 2, style: BorderStyle.SINGLE, size: 12 } }
  });
}

function link(url, label) {
  if (!has(url)) return new TextRun({ text: label || '' });
  return new ExternalHyperlink({
    link: url,
    children: [new TextRun({ text: label || url, style: 'Hyperlink', color: BRAND, underline: {} })]
  });
}

function build(data) {
  data = data || {};
  const children = [];

  // Header
  children.push(new Paragraph({
    children: [new TextRun({ text: 'FORTINET SE NEWSLETTER', bold: true, color: BRAND, size: 20 })]
  }));
  children.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: `${data.month || ''} ${data.year || ''}`.trim(), bold: true, size: 44 })]
  }));

  // Lead
  if (has(data.lead)) {
    children.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: data.lead, size: 22 })] }));
  }

  // News
  children.push(sectionHeading('Top Fortinet News'));
  (data.news || []).filter(n => has(n.title) || has(n.summary)).forEach((n, i) => {
    children.push(new Paragraph({
      spacing: { before: 120 },
      children: [
        new TextRun({ text: `${i + 1}. `, bold: true, color: BRAND, size: 22 }),
        link(n.link, n.title || '(untitled)')
      ]
    }));
    if (has(n.date)) {
      children.push(new Paragraph({ children: [new TextRun({ text: n.date, italics: true, color: '5A5A5A', size: 18 })] }));
    }
    if (has(n.summary)) {
      children.push(new Paragraph({ children: [new TextRun({ text: n.summary, size: 21 })] }));
    }
  });

  // Firmware
  children.push(sectionHeading('Firmware Released This Month'));
  const fw = (data.firmware || []).filter(f => has(f.product) || has(f.version));
  if (fw.length) {
    children.push(new Table({
      width: { size: 60, type: WidthType.PERCENTAGE },
      rows: fw.map(f => {
        let label = [f.product, f.version].filter(has).join(' ');
        if (has(f.note)) label += ' ' + f.note;
        return new TableRow({
          children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, size: 21 })] })] })]
        });
      })
    }));
  } else {
    children.push(new Paragraph({ children: [new TextRun({ text: 'No releases listed.', italics: true, color: '5A5A5A', size: 21 })] }));
  }

  // RapidFire + events
  children.push(sectionHeading('Upcoming Events & Webinars'));
  const rf = data.rapidFire || {};
  const rfRuns = [new TextRun({ text: 'Fortinet RapidFire Q&A — ', bold: true, size: 21 })];
  rfRuns.push(new TextRun({ text: `${rf.date || ''}${has(rf.time) ? ' at ' + rf.time : ''}. `, size: 21 }));
  if (has(rf.topic)) rfRuns.push(new TextRun({ text: `This month the SE team will demo ${rf.topic}.`, size: 21 }));
  else rfRuns.push(new TextRun({ text: 'Tools/Tips/Tricks topic TBD.', size: 21 }));
  if (has(rf.registration)) { rfRuns.push(new TextRun({ text: ' ', size: 21 })); rfRuns.push(link(rf.registration, 'Register')); }
  children.push(new Paragraph({ spacing: { after: 120 }, children: rfRuns }));

  (data.events || []).filter(e => has(e.name)).forEach(e => {
    children.push(new Paragraph({
      spacing: { before: 100 },
      children: [link(e.link, e.name)]
    }));
    const when = [e.date, e.time].filter(has).join(' · ');
    if (has(when)) children.push(new Paragraph({ children: [new TextRun({ text: when, italics: true, color: '5A5A5A', size: 18 })] }));
    if (has(e.description)) children.push(new Paragraph({ children: [new TextRun({ text: e.description, size: 21 })] }));
  });

  // Tips teaser
  children.push(sectionHeading('Tools / Tips / Tricks'));
  children.push(new Paragraph({
    children: [new TextRun({
      text: has(data.tipsTeaser) ? data.tipsTeaser : '<TIPS & TRICKS> — SE screenshot block. Add this month\'s demo content.',
      size: 21, italics: !has(data.tipsTeaser)
    })]
  }));

  // Evergreen
  children.push(sectionHeading('Always-On Resources'));
  const eg = data.evergreen || {};
  [eg.fastTracks, eg.nseTraining].filter(Boolean).forEach(b => {
    children.push(new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: b.title || '', bold: true, size: 22 })] }));
    if (has(b.body)) children.push(new Paragraph({ children: [new TextRun({ text: b.body, size: 21 })] }));
    if (has(b.link)) children.push(new Paragraph({ children: [link(b.link, b.link)] }));
  });

  // Disclaimer footer
  children.push(new Paragraph({
    spacing: { before: 360 },
    border: { top: { color: 'E3E3E3', space: 4, style: BorderStyle.SINGLE, size: 6 } },
    children: [new TextRun({
      text: 'This is a personal side project and is not affiliated with, endorsed by, or sponsored by Fortinet, Inc. All product names and brands are property of their respective owners. Content is compiled from publicly available Fortinet sources.',
      italics: true, color: '5A5A5A', size: 16
    })]
  }));

  return new Document({
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{ children }]
  });
}

async function toBuffer(data) {
  return Packer.toBuffer(build(data));
}

module.exports = { toBuffer };
