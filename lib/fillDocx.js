/*
 * Fills template/newsletter.docx with the newsletter content model using
 * docxtemplater, preserving the original Word design exactly.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { buildTags } = require('./buildTags');

const TEMPLATE = path.join(__dirname, '..', 'template', 'newsletter.docx');

function toBuffer(data) {
  if (!fs.existsSync(TEMPLATE)) {
    throw new Error('Tagged template not found. Run: npm run build:template');
  }
  const zip = new PizZip(fs.readFileSync(TEMPLATE));
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true // turn "\n" in values into Word line breaks
  });
  doc.render(buildTags(data));
  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

module.exports = { toBuffer };
