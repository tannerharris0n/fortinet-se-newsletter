/*
 * Builds the instruction prompt sent to Claude for the "Generate with AI" feature.
 * Claude is given web search and asked to return ONLY a JSON object that matches
 * the newsletter data model in public/template.js.
 */
'use strict';

// The JSON shape the model must return. Kept in sync with public/template.js defaults().
const SCHEMA_HINT = `{
  "month": "string (e.g. May)",
  "year": "string (e.g. 2026)",
  "lead": "3-5 sentence intro paragraph",
  "news": [
    { "title": "string", "date": "string e.g. May 14", "summary": "2-4 sentences", "link": "https://..." }
  ],
  "firmware": [
    { "product": "e.g. FortiOS", "version": "e.g. 7.6.5", "note": "optional, e.g. (May)" }
  ],
  "rapidFire": { "date": "Month Day", "time": "11:30 AM PT", "topic": "string or empty", "registration": "https://... or empty" },
  "tipsTeaser": "one sentence naming this month's demo topic, or empty to leave for the SE",
  "events": [
    { "name": "string", "date": "Month Day", "time": "e.g. 9:00 AM PT", "description": "1-3 sentences", "link": "https://..." }
  ]
}`;

function buildPrompt(month, year, prevMonthYear) {
  return `You are helping build the Fortinet SE Newsletter for ${month} ${year}. Research using web search, then return ONLY a JSON object (no prose, no markdown fences) matching this shape:

${SCHEMA_HINT}

WHAT TO PULL (past month — ${prevMonthYear}):
1. Top 3 Fortinet news items from the past month. Prioritize, in order: (a) FortiGuard Labs threat research / Global Threat Landscape Report style releases, (b) major product or partnership announcements (NVIDIA, AWS, Google, Microsoft, etc.), (c) new FortiGate / FortiAIGate / FortiOS hardware or platform launches. For each: a 2-4 sentence summary for a technical-but-business audience, the announcement date, and a link to the Fortinet press release or blog.
2. lead: a 3-5 sentence intro that ties the top story to a broader defender takeaway (speed, integration, AI, zero-trust). Confident, technical, no marketing fluff.
3. firmware: releases from the past month. Pull from docs.fortinet.com (Recommended Releases) and support.fortinet.com firmware RSS. One product+version per row (e.g. FortiOS 7.6.5). Cap at ~16 rows; put the month in the "note" field for releases that crossed month boundaries.

UPCOMING (${month} ${year} and next 60 days):
4. events: ALWAYS include (a) the monthly Fortinet RapidFire Q&A as the rapidFire object — second Friday of ${month} at 11:30 AM PT; (b) any Fortinet Summit (OT Summit, Accelerate, Security Summit); (c) any major industry conference where Fortinet has a presence (Black Hat, RSA, Gartner Security/IOCS). Each event: name, date + time + timezone, one-line description, registration link.
6. tipsTeaser: one sentence naming the topic the SE team will demo this month. If unknown, return an empty string so the SE can fill it.

STYLE RULES:
- Voice: confident, technical, no marketing fluff ("revolutionary", "game-changing", "unleash").
- Numbers: cite percentages/figures exactly as Fortinet published them, and link the source.
- Quotes: only include a leadership quote if Fortinet published one — never invent.
- Dates: write as "June 12" not "6/12". Times in PT/PDT with timezone shown.
- Length: lead 3-5 sentences; each news summary 2-4 sentences; event descriptions 1-3 sentences.

Do not include the evergreen Fast Tracks / NSE Training blocks — those are fixed in the app. Return ONLY the JSON object.`;
}

module.exports = { buildPrompt, SCHEMA_HINT };
