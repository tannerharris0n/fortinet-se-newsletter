# Fortinet SE Newsletter Builder

A simple, public, browser-based tool for assembling the monthly **Fortinet SE Newsletter** from public Fortinet sources. Fill a form, watch a live preview, and export to **Word (.docx)** or **HTML email**. An optional **"Generate with AI"** button drafts the month for you when an API key is configured.

> ### ⚠️ Disclaimer
> **This is a personal side project. It is _not_ affiliated with, endorsed by, or sponsored by Fortinet, Inc.** All product names, logos, and brands are the property of their respective owners. The use of these names does not imply endorsement. All content is compiled from **publicly available** Fortinet sources, and you are responsible for verifying every figure, date, and quote against the original source before sending anything.

---

## Table of contents

- [What this is](#what-this-is)
- [Who it's for](#who-its-for)
- [Two ways to use it](#two-ways-to-use-it)
- [Features](#features)
- [Quick start (local)](#quick-start-local)
- [Deploy to Railway](#deploy-to-railway)
- [Configuration](#configuration)
- [Editing workflow](#editing-workflow)
- [AI generation (optional)](#ai-generation-optional)
- [Exports](#exports)
- [The prompt (no app required)](#the-prompt-no-app-required)
- [Newsletter sections](#newsletter-sections)
- [Data model reference](#data-model-reference)
- [Project structure](#project-structure)
- [How it works (architecture)](#how-it-works-architecture)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [Sources & accuracy](#sources--accuracy)
- [Contributing](#contributing)
- [License](#license)

---

## What this is

Every month the SE team puts together a newsletter covering Fortinet news, firmware releases, upcoming events/webinars, the RapidFire Q&A, and a few evergreen training links. Doing this by hand in Word is tedious and easy to get inconsistent.

This tool turns that into a **structured form with a live email preview**. You type (or AI-draft) the month's content, and it renders a clean, consistent newsletter that you can export to **Word** for review or copy as **HTML email** to paste into Outlook/Gmail. It runs as a tiny Node/Express app with **no build step and no database** — everything is plain HTML/CSS/JS so it's easy to read, fork, and tweak.

## Who it's for

- **The maintainer** (you): deploy it once to Railway, open it each month, click **Generate with AI**, review, and export.
- **Other SEs**: fork it and run their own, or skip the app entirely and use [the prompt](#the-prompt-no-app-required) in Claude/ChatGPT.

---

## Two ways to use it

Pick whichever fits — they produce the same kind of output.

| | **Run the app** | **Just use the prompt** |
| --- | --- | --- |
| Best for | The maintainer; anyone who wants browser editing + exports | SEs who don't want to deploy anything |
| Setup | Deploy to Railway or `npm start` locally | Copy/paste — zero setup |
| Editing | Structured form + live preview | Edit in your own Word doc |
| AI drafting | One-click button (needs `ANTHROPIC_API_KEY`) | Paste the prompt into Claude/ChatGPT |
| Exports | Word `.docx` + HTML email | Whatever your AI tool / Word gives you |

---

## Features

- **Edit in the browser** — structured fields for the lead paragraph, top news, firmware table, RapidFire Q&A, events/webinars, and the evergreen training blocks.
- **Live email preview** — a real-time, email-safe HTML render in a side-by-side pane.
- **Two exports**:
  - **Word `.docx`** — generated server-side with the [`docx`](https://www.npmjs.com/package/docx) library.
  - **HTML email** — inline-styled, copy-to-clipboard or download `.html`, ready to paste into Outlook/Gmail.
- **Works with no API key** — the editor and both exports are fully functional with zero AI configured.
- **Optional AI draft** — set `ANTHROPIC_API_KEY` and a **✨ Generate with AI** button appears. It uses Claude with **web search** to research the month's Fortinet news, firmware, and events and fills the form.
- **Autosave** — your work persists in the browser's `localStorage`, so a refresh won't lose it.
- **Evergreen blocks preserved** — Fast Tracks and NSE Training are pre-filled and kept month to month.
- **No build step, no database** — single Express server + vanilla JS. Easy to fork.

---

## Quick start (local)

Requires **Node.js 20+**.

```bash
git clone <your-fork-url>
cd "SE Newsletter"
npm install
npm start
# open http://localhost:3000
```

To enable the AI button locally, copy the example env file and add your key:

```bash
cp .env.example .env
# then edit .env and set ANTHROPIC_API_KEY=sk-ant-...
npm start
```

You'll see `AI generation: ENABLED` in the console when the key is detected.

---

## Deploy to Railway

1. Push this repo to **GitHub** (it's safe to make public — no secrets are committed; `.env` is gitignored).
2. In [Railway](https://railway.app): **New Project → Deploy from GitHub repo** → select this repo.
3. Railway auto-detects Node via Nixpacks and runs `npm start` (configured in [`railway.json`](./railway.json)). No extra setup needed for the base app.
4. **(Optional, to enable AI)** In the project's **Variables** tab, add:
   - `ANTHROPIC_API_KEY` = your key from <https://console.anthropic.com/>
   - *(optional)* `CLAUDE_MODEL` = `claude-sonnet-4-6` (default) or another Claude model.
5. Railway assigns a public URL. Under **Settings → Networking**, generate a domain if one isn't created automatically. Open it — you're live.

> **Port:** the app binds to `process.env.PORT`, which Railway sets automatically. Don't hardcode it.

> **Cost:** the base app is tiny and cheap to host. AI generation costs per click — see [AI generation](#ai-generation-optional).

---

## Configuration

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | No | — | Enables the **Generate with AI** button. Without it, the app is a pure editor. |
| `CLAUDE_MODEL` | No | `claude-sonnet-4-6` | Claude model used for AI generation. |
| `PORT` | No | `3000` | HTTP port. Set automatically by Railway. |

All configuration is via environment variables — there is no config file to edit.

---

## Editing workflow

1. Set the **Month** and **Year** at the top.
2. Either click **✨ Generate with AI** (if enabled) to draft the whole month, or fill the sections by hand.
3. **Review every item against its source link** — especially AI-drafted figures, dates, and quotes. Never ship unverified numbers.
4. The **Tools/Tips/Tricks** teaser can be left blank for the SE who adds the demo screenshots later.
5. Watch the **live preview** update as you type.
6. Export to **Word** for review/sharing, or **Copy HTML email** and paste into Outlook/Gmail.

The **evergreen blocks** (Fast Tracks, NSE Training) are pre-filled and preserved month to month — only edit the verbatim text if the official links change.

Your work autosaves to the browser. Use **Reset** to clear everything and start from a blank template.

---

## AI generation (optional)

When `ANTHROPIC_API_KEY` is set, the **✨ Generate with AI** button appears. Clicking it:

1. Sends the current **Month/Year** to the server route `POST /api/generate`.
2. The server calls **Claude with the web-search tool** using the research prompt in [`lib/aiPrompt.js`](./lib/aiPrompt.js).
3. Claude researches the previous month's Fortinet news, firmware releases, and upcoming events, then returns a JSON object matching the [data model](#data-model-reference).
4. The app merges those fields into your draft and re-renders the preview. **Your evergreen blocks are preserved.**

Notes:
- **It overwrites** the Lead, News, Firmware, Events, RapidFire, and Tips fields (you're asked to confirm first).
- **Always verify.** The AI is a research assistant, not a source of truth. Open each link and confirm figures, dates, and any quotes before sending.
- **Model & cost:** generation uses one Claude request with web search (defaults to `claude-sonnet-4-6`). Cost is per click and depends on how much searching it does. Change the model with `CLAUDE_MODEL`.
- **Privacy:** the prompt only sends the month/year you entered; no personal data leaves the server.

---

## Exports

### Word (.docx)
Click **Export Word (.docx)**. The server builds a clean, editable Word document from your current data (headings, the firmware table, hyperlinks, and the disclaimer footer) and downloads it. Good for review, redlining, or sharing with non-email tools.

### HTML email
- **Copy HTML email** — copies a self-contained, inline-styled HTML string to your clipboard. Paste it directly into an Outlook/Gmail compose window or your email platform's HTML editor.
- **Download .html** — saves the same HTML as a file.

The HTML uses table-based layout and inline styles for broad email-client compatibility.

---

## The prompt (no app required)

Copy everything in the block below into **Claude or ChatGPT with web browsing enabled**. Paste the resulting content into your newsletter Word doc.

````text
You are helping me build the Fortinet SE Newsletter for [MONTH YEAR]. Use the section
order below and fill every [PLACEHOLDER]. Keep the layout, headings, and order unchanged.

WHAT TO PULL (past month — [MONTH YEAR MINUS 1]):
1. Top 3 Fortinet news items from the past month. Prioritize, in order: (a) FortiGuard Labs
   threat research / Global Threat Landscape Report style releases, (b) major product or
   partnership announcements (NVIDIA, AWS, Google, Microsoft, etc.), (c) new FortiGate /
   FortiAIGate / FortiOS hardware or platform launches. For each: a 2–4 sentence summary
   written for a technical-but-business audience, include the announcement date, and link to
   the Fortinet press release or blog.
2. Lead paragraph: a 3–5 sentence intro that ties the top story to a broader defender
   takeaway (speed, integration, AI, zero-trust).
3. Firmware released in the past month: pull the list from https://docs.fortinet.com
   (Recommended Releases) and https://support.fortinet.com firmware RSS. Format as a single
   column, one product+version per row (e.g. 'FortiOS 7.6.5', 'FortiMail 7.6.6'). Cap at ~16
   rows; include the month in parentheses for releases that crossed month boundaries.

UPCOMING (this [MONTH YEAR] and the next 60 days):
4. Upcoming Fortinet events and webinars. ALWAYS include: (a) the monthly Fortinet RapidFire
   Q&A — second Friday of [MONTH] at 11:30 AM PT, (b) any Fortinet Summit (OT Summit,
   Accelerate, Security Summit), (c) any major industry conference where Fortinet has a
   presence (Black Hat, RSA, Gartner Security Summit, Gartner IOCS). For each event: name,
   date + time + timezone, one-line description or topic, registration link.
   Include: RapidFire (required), 1 Fortinet-hosted summit (if available), 1–2 Fortinet
   webinars (if available), 1 major industry conference (if available).
5. Keep the evergreen blocks at the bottom: Fortinet Fast Tracks and Fortinet NSE Training
   (links don't change month-to-month — preserve them verbatim).
6. RapidFire intro line: fill the Tools/Tips/Tricks teaser with one sentence naming the topic
   the SE team will demo this month, and confirm the RapidFire date/time. If the topic isn't
   known yet, leave the placeholder for the SE filling in screenshots.

STYLE RULES:
• Voice: confident, technical, vendor-neutral-sounding. No marketing fluff ("revolutionary",
  "game-changing", "unleash").
• Numbers: cite percentages and figures exactly as Fortinet published them. Link to the source.
• Quotes: only include a leadership quote if Fortinet published one for that announcement —
  never invent.
• Dates: write as 'June 12' not '6/12'. Times in PT/PDT with timezone shown.
• Length: lead paragraph 3–5 sentences; each news item 2–4 sentences; event blurbs 1–3 sentences.

OUTPUT: replace every [PLACEHOLDER]. Do NOT touch the Tools/Tips section — that's the SE
screenshot block and stays as the <TIPS & TRICKS> marker until the SE team adds content.
Do NOT change the Fast Tracks / NSE Training / signature blocks.
````

---

## Newsletter sections

The generated newsletter, in order:

1. **Header** — "Fortinet SE Newsletter" + Month Year.
2. **Lead paragraph** — 3–5 sentence intro tying the top story to a defender takeaway.
3. **Top Fortinet News** — up to 3 items, each with headline, date, 2–4 sentence summary, and source link.
4. **Firmware Released This Month** — single-column table of product + version (+ optional month note).
5. **Upcoming Events & Webinars** — the RapidFire Q&A line plus any summits, webinars, and industry conferences.
6. **Tools / Tips / Tricks** — the SE screenshot teaser block (left as a marker if blank).
7. **Always-On Resources** — the evergreen Fast Tracks and NSE Training blocks.
8. **Footer** — month/year + the side-project disclaimer.

---

## Data model reference

Both exports and the AI route share one JSON shape (defined in [`public/template.js`](./public/template.js)):

```jsonc
{
  "month": "June",
  "year": "2026",
  "lead": "3–5 sentence intro paragraph.",
  "news": [
    { "title": "Headline", "date": "May 14", "summary": "2–4 sentences.", "link": "https://..." }
  ],
  "firmware": [
    { "product": "FortiOS", "version": "7.6.5", "note": "(May)" }
  ],
  "rapidFire": {
    "date": "June 12",
    "time": "11:30 AM PT",
    "topic": "this month's demo topic, or empty",
    "registration": "https://... or empty"
  },
  "tipsTeaser": "One sentence naming the demo topic, or empty for the SE to fill.",
  "events": [
    { "name": "Event name", "date": "June 18", "time": "9:00 AM PT",
      "description": "1–3 sentences.", "link": "https://..." }
  ],
  "evergreen": {
    "fastTracks": { "title": "...", "body": "...", "link": "https://..." },
    "nseTraining": { "title": "...", "body": "...", "link": "https://..." }
  }
}
```

The AI route returns everything **except** `evergreen` (those are fixed in the app).

---

## Project structure

```
server.js              Express server: static hosting, /api/export/docx, optional /api/generate
lib/
  aiPrompt.js          Builds the Claude research prompt + the JSON schema hint
  docx.js              Renders the newsletter data model to a Word .docx buffer
public/
  index.html           Editor UI
  app.js               Editor logic: forms, dynamic lists, live preview, exports, AI button
  styles.css           Styles
  template.js          Newsletter data model + HTML-email renderer (shared, framework-free)
railway.json           Railway deploy config (Nixpacks + npm start)
.env.example           Optional AI configuration template
.gitignore             Ignores node_modules, .env, etc.
package.json           Dependencies and start script
```

---

## How it works (architecture)

- **Frontend (`public/`)** is plain HTML/CSS/JS — no framework, no bundler. `app.js` keeps an in-memory `state` object (the [data model](#data-model-reference)), binds it to form fields, autosaves to `localStorage`, and re-renders a live preview.
- **`template.js`** is the single source of truth for the **HTML-email render**. It runs in the browser (for preview + HTML export). Keeping it framework-free means the preview and the exported email are byte-for-byte the same.
- **Word export** is done server-side (`lib/docx.js`) because generating a real `.docx` needs the `docx` library. The browser POSTs the state JSON and gets a file back.
- **AI generation** is server-side (`/api/generate` in `server.js`) so the API key never reaches the browser. It calls Claude with web search and returns parsed JSON.
- **No database** — state lives in the browser; the server is stateless.

```
Browser (state JSON) ──► live preview        (template.js, client-side)
        │
        ├─ POST /api/export/docx ──► Word file        (lib/docx.js)
        ├─ Copy/Download HTML    ──► email HTML        (template.js, client-side)
        └─ POST /api/generate    ──► Claude + web search ──► JSON draft  (server-side)
```

---

## Troubleshooting & FAQ

**The "Generate with AI" button doesn't show up.**
The server didn't detect `ANTHROPIC_API_KEY`. Set it (locally in `.env`, on Railway in **Variables**) and restart. The console logs `AI generation: ENABLED/disabled` on boot. The frontend checks `GET /api/config`.

**AI generation returns an error.**
Check the server logs. Common causes: invalid/empty API key, the model returned non-JSON (the route reports `AI did not return parseable JSON`), or a network issue reaching the Anthropic API.

**The pasted HTML email looks plain in Outlook.**
Make sure you pasted into an HTML-capable compose window (not plain-text mode). The export uses inline styles and table layout, which most clients honor.

**Will my work disappear if I refresh?**
No — it autosaves to `localStorage` in that browser. Switching browsers/devices won't carry it over. Use **Reset** to clear.

**Can I run this without ever touching AI?**
Yes. The editor and both exports work with no key at all.

**Is it safe to make the repo public?**
Yes. No secrets are committed; `.env` is gitignored and keys are only ever set as environment variables.

---

## Sources & accuracy

All content comes from **public Fortinet sources** — press releases, the FortiGuard Labs blog, `docs.fortinet.com` (Recommended Releases), and `support.fortinet.com` (firmware RSS). AI drafts are a **starting point**, not a source of truth: **verify every figure, date, and quote against the linked source before sending.** Never invent leadership quotes — only include a quote if Fortinet actually published one for that announcement.

---

## Contributing

This is a small, framework-free codebase by design. PRs and forks welcome. To run it:

```bash
npm install && npm start
```

Keep changes simple and dependency-light so other SEs can read and fork it easily.

---

## License

[MIT](./LICENSE) — do what you like, no warranty.

---

> _Reminder: personal side project, not affiliated with Fortinet, Inc. See the [disclaimer](#fortinet-se-newsletter-builder) at the top._
