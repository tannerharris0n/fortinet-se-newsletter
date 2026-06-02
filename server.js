/*
 * Fortinet SE Newsletter — Express server.
 *
 * - Serves the browser editor (public/).
 * - POST /api/export/docx  -> returns a Word document built from the posted JSON.
 * - POST /api/generate     -> (optional) uses Claude + web search to draft the
 *                             newsletter. Only enabled when ANTHROPIC_API_KEY is set.
 * - GET  /api/config       -> tells the frontend whether AI generation is available.
 *
 * HTML-email export happens entirely in the browser (see public/app.js), so the
 * server stays tiny and the app works with no API key at all.
 */
'use strict';

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const fillDocx = require('./lib/fillDocx');
const { buildPrompt } = require('./lib/aiPrompt');

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
const AI_ENABLED = Boolean(process.env.ANTHROPIC_API_KEY);

// The editor and Word/HTML exports are always open. Only the PAID "Generate with
// AI" route is gated: if AI_PASSWORD is set, callers must supply it. This stops
// strangers on a public URL from running up your Claude bill, while leaving the
// rest of the app usable by other SEs.
const AI_PASSWORD = process.env.AI_PASSWORD || '';

// Constant-time password check via fixed-length digests.
function aiPasswordOk(supplied) {
  const digest = (s) => crypto.createHash('sha256').update(String(s)).digest();
  return crypto.timingSafeEqual(digest(supplied || ''), digest(AI_PASSWORD));
}

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Tells the frontend whether to show the AI button and whether it needs a password.
app.get('/api/config', (req, res) => {
  res.json({ aiEnabled: AI_ENABLED, aiGated: Boolean(AI_PASSWORD), model: AI_ENABLED ? MODEL : null });
});

// Export the posted newsletter JSON as a .docx download.
app.post('/api/export/docx', async (req, res) => {
  try {
    const data = req.body || {};
    const buffer = fillDocx.toBuffer(data);
    const fname = `Fortinet-SE-Newsletter-${(data.month || 'month')}-${(data.year || '')}.docx`
      .replace(/\s+/g, '-');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    res.send(buffer);
  } catch (err) {
    console.error('docx export failed:', err);
    res.status(500).json({ error: 'Failed to build Word document.' });
  }
});

// Optional AI drafting. Returns the newsletter JSON fields (caller merges into state).
app.post('/api/generate', async (req, res) => {
  if (!AI_ENABLED) {
    return res.status(400).json({ error: 'AI generation is disabled. Set ANTHROPIC_API_KEY to enable it.' });
  }
  // Gate the paid route.
  if (AI_PASSWORD && !aiPasswordOk(req.headers['x-ai-password'])) {
    return res.status(401).json({ error: 'Incorrect or missing AI password.' });
  }
  const { month, year } = req.body || {};
  if (!month || !year) return res.status(400).json({ error: 'month and year are required.' });

  // Compute the previous month label for the research window.
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const mi = MONTHS.indexOf(month);
  const prevIdx = (mi + 11) % 12;
  const prevYear = mi === 0 ? Number(year) - 1 : Number(year);
  const prevMonthYear = `${MONTHS[prevIdx]} ${prevYear}`;

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = buildPrompt(month, year, prevMonthYear);

    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 6000,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 10 }],
      messages: [{ role: 'user', content: prompt }]
    });

    // Concatenate the text blocks, then extract the JSON object.
    const text = (msg.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    const json = extractJSON(text);
    if (!json) {
      return res.status(502).json({ error: 'AI did not return parseable JSON.', raw: text.slice(0, 2000) });
    }
    res.json({ ok: true, data: json });
  } catch (err) {
    console.error('generate failed:', err);
    res.status(500).json({ error: err.message || 'AI generation failed.' });
  }
});

function extractJSON(text) {
  if (!text) return null;
  // Strip code fences if present.
  let t = text.replace(/```json/gi, '```').trim();
  const fence = t.match(/```([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  // Find the outermost { ... }.
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch (_) {
    return null;
  }
}

app.listen(PORT, () => {
  console.log(`Fortinet SE Newsletter running on http://localhost:${PORT}`);
  console.log(`AI generation: ${AI_ENABLED ? 'ENABLED (' + MODEL + ')' : 'disabled (set ANTHROPIC_API_KEY to enable)'}`);
  if (AI_ENABLED) {
    console.log(`AI gate: ${AI_PASSWORD ? 'ON (password required to generate)' : 'OFF — WARNING: anyone can trigger paid generation; set AI_PASSWORD on a public deploy'}`);
  }
});
