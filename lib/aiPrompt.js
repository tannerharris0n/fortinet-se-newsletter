/*
 * Builds the prompt sent to Claude for "Generate with AI".
 * This mirrors the prompt embedded in the original Word template, but asks Claude
 * to return JSON matching the app's content model (see public/template.js) instead
 * of editing the doc directly. The app then fills your real template on export.
 */
'use strict';

const SCHEMA_HINT = `{
  "month": "string e.g. June",
  "year": "string e.g. 2026",
  "leadBlurb": "a SHORT 1-3 sentence intro blurb that sets up the month and ties the top story to a defender takeaway (speed, AI, integration, zero-trust). NOT the full stories — those go in news[].",
  "tips": {
    "topic": "the Tools/Tips/Tricks topic the SE will demo this month (empty if unknown)",
    "rfTopic": "short phrase for 'a closer look at ___' (empty if unknown)",
    "seOutcome": "short phrase for 'how to ___' (empty if unknown)"
  },
  "rapidFire": { "weekday": "e.g. Friday", "monthDay": "e.g. June 12" },
  "news": [
    { "title": "headline", "body": "2-4 sentences: announcement + date, key stat/capability, implication, end with 'Read more: <url>'" }
  ],
  "firmware": ["FortiOS 7.6.5", "FortiManager 7.6.4 (May)", "... up to ~16 entries, one product+version per string"],
  "events": {
    "event2": { "name": "Fortinet Summit name", "when": "Month Day | Time Timezone", "link": "registration url", "topic": "2-4 sentence description" },
    "event3": { "name": "major industry conference e.g. Black Hat / RSA", "dateRange": "e.g. August 2-7", "desc": "1-2 sentences, Fortinet's role" },
    "event4": { "enabled": false, "name": "", "when": "", "desc": "" }
  }
}`;

function buildPrompt(month, year, prevMonthYear) {
  return `You are helping build the Fortinet SE Newsletter for ${month} ${year}. Research with web search, then return ONLY a JSON object (no prose, no markdown fences) matching this shape:

${SCHEMA_HINT}

WHAT TO PULL (past month — ${prevMonthYear}):
1. Top 3 Fortinet news items. Prioritize in order: (a) FortiGuard Labs threat research / Global Threat Landscape Report releases, (b) major product or partnership announcements (NVIDIA, AWS, Google, Microsoft, etc.), (c) new FortiGate / FortiAIGate / FortiOS hardware or platform launches. Put the FULL stories in the "news" array (headline + 2-4 sentence body, technical-but-business audience, include the announcement date, end with a link to the Fortinet press release or blog).
2. leadBlurb: a SHORT intro — 1-3 sentences only. Tease the top story and a broader defender takeaway (speed, AI, integration, zero-trust). Do NOT restate the full news items here; keep it brief and executive-level.
3. Firmware released in ${prevMonthYear}: pull from docs.fortinet.com (Recommended Releases) and support.fortinet.com (firmware RSS). Up to ~16 entries, one product+version per string (e.g. "FortiOS 7.6.5"). Add the month in parentheses for releases that crossed month boundaries.

UPCOMING (${month} ${year} and next 60 days):
4. Events — ALWAYS include in events: (event2) ONE Fortinet Summit (OT Summit, Accelerate, or Security Summit) with name, when, registration link, and a 2-4 sentence topic; (event3) ONE major industry conference where Fortinet has a presence (Black Hat, RSA, Gartner) with name, date range, and a 1-2 sentence description. The monthly RapidFire Q&A is already fixed in the template — just provide rapidFire.weekday and rapidFire.monthDay (second Friday of ${month} at 11:30 AM PT). Set event4.enabled true ONLY if there's a meaningful extra event.
6. tips: name the SE demo topic for this month if known; otherwise return empty strings (do NOT invent).

STYLE RULES:
- Technical, confident tone — no marketing fluff ("revolutionary", "game-changing", "unleash").
- Use exact published numbers; link the source.
- Only include quotes if Fortinet officially published them — never invent.
- Dates: "June 12" format (not numeric). Include timezone (PT/PDT).

Do not include the Fast Tracks / NSE / RapidFire boilerplate or the Tools/Tips screenshot section — those are fixed in the template. Return ONLY the JSON object.`;
}

module.exports = { buildPrompt, SCHEMA_HINT };
