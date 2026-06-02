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

// Optional access gate. If APP_PASSWORD is set, the WHOLE app (pages + APIs)
// requires HTTP Basic auth — this protects the paid /api/generate route on a
// public deploy. If unset, the app is open (so forks work with zero config).
const AUTH_USER = process.env.APP_USER || 'admin';
const AUTH_PASS = process.env.APP_PASSWORD || '';

app.use(express.json({ limit: '2mb' }));

if (AUTH_PASS) {
  // Constant-time compare via fixed-length digests (avoids length leaks/throws).
  const digest = (s) => crypto.createHash('sha256').update(String(s)).digest();
  const matches = (a, b) => crypto.timingSafeEqual(digest(a), digest(b));

  app.use((req, res, next) => {
    const header = req.headers.authorization || '';
    if (header.startsWith('Basic ')) {
      const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
      const i = decoded.indexOf(':');
      const user = decoded.slice(0, i);
      const pass = decoded.slice(i + 1);
      if (matches(user, AUTH_USER) && matches(pass, AUTH_PASS)) return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Fortinet SE Newsletter", charset="UTF-8"');
    return res.status(401).send('Authentication required.');
  });
}

app.use(express.static(path.join(__dirname, 'public')));

// Does the frontend get a "Generate with AI" button?
app.get('/api/config', (req, res) => {
  res.json({ aiEnabled: AI_ENABLED, model: AI_ENABLED ? MODEL : null });
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
  console.log(`Access gate: ${AUTH_PASS ? 'ON (Basic auth, user "' + AUTH_USER + '")' : 'OFF (set APP_PASSWORD to require login)'}`);
});
