# Fortinet SE Newsletter Builder

A simple, public tool for assembling the monthly **Fortinet SE Newsletter**. You edit the month's content in the browser (or let AI draft it from public Fortinet sources), and export a **Word document that fills your real newsletter template** — exact fonts, the firmware table, headers/footers, the Fast Tracks / NSE / RapidFire blocks, and your signature, all preserved. A matching **HTML email** export is included too.

> ### ⚠️ Disclaimer
> **This is a personal side project. It is _not_ affiliated with, endorsed by, or sponsored by Fortinet, Inc.** All product names, logos, and brands are the property of their respective owners. All content is compiled from **publicly available** Fortinet sources, and you are responsible for verifying every figure, date, and quote against the original source before sending.

---

## The idea

The monthly job is the same every month: take the newsletter template, update the placeholders, drop in the Tools/Tips screenshots, send. This tool keeps that exact model:

- **Your `.docx` is the source of truth.** `scripts/build-template.js` takes your original Word file and replaces each `[PLACEHOLDER]` with a [docxtemplater](https://docxtemplater.com/) `{tag}`, producing `template/newsletter.docx`. The design is never reinvented.
- **The app just holds this month's content** — preloaded with last month's (autosaved), edited in a form, and on export it fills *your* template.
- **AI is optional.** With a key set, a button drafts the month using your embedded prompt (Claude + web search). Without one, it's a plain editor.
- **The Tools/Tips section stays bracketed** in the Word output — that's the SE screenshot block, filled in Word afterward.

---

## Table of contents

- [Two ways to use it](#two-ways-to-use-it)
- [Quick start (local)](#quick-start-local)
- [Deploy to Railway](#deploy-to-railway)
- [Configuration](#configuration)
- [Securing a public deploy](#securing-a-public-deploy)
- [Editing workflow](#editing-workflow)
- [AI generation (optional)](#ai-generation-optional)
- [Exports](#exports)
- [Updating the template](#updating-the-template)
- [The prompt (no app required)](#the-prompt-no-app-required)
- [Data model](#data-model)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [Sources & accuracy](#sources--accuracy)
- [License](#license)

---

## Two ways to use it

| | **Run the app** | **Just use the prompt** |
| --- | --- | --- |
| Best for | The maintainer; browser editing + a filled `.docx` | SEs who don't want to deploy anything |
| Setup | Deploy to Railway or `npm start` locally | Copy/paste — zero setup |
| Editing | Form + live preview, fills your real template | Edit in your own Word doc |
| AI drafting | One-click button (needs `ANTHROPIC_API_KEY`) | Paste the prompt into Copilot/Claude/ChatGPT |

---

## Quick start (local)

Requires **Node.js 20+**.

```bash
npm install
npm run build:template   # generates template/newsletter.docx from your source .docx
npm start
# open http://localhost:3000
```

> `template/newsletter.docx` is committed, so `npm run build:template` is only needed if you change the source design. See [Updating the template](#updating-the-template).

To enable the AI button locally, copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`.

---

## Deploy to Railway

1. Push this repo to **GitHub** (safe to make public — no secrets are committed; `.env` is gitignored).
2. In [Railway](https://railway.app): **New Project → Deploy from GitHub repo** → select this repo.
3. Railway auto-detects Node and runs `npm start` (see `railway.json`). The committed `template/newsletter.docx` ships with the repo, so exports work out of the box.
4. **(Optional) Variables** tab:
   - `ANTHROPIC_API_KEY` — enables AI generation.
   - **`AI_PASSWORD`** — **set this whenever you set the API key on a public URL.** It gates only the paid AI button; the editor stays open. See [Securing a public deploy](#securing-a-public-deploy).
   - *(optional)* `CLAUDE_MODEL` — defaults to `claude-sonnet-4-6`.
5. Open the generated URL.

> The app binds to `process.env.PORT`, which Railway sets automatically.

---

## Configuration

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | No | — | Enables the **Generate with AI** button. |
| `CLAUDE_MODEL` | No | `claude-sonnet-4-6` | Claude model used for AI generation. |
| `AI_PASSWORD` | No | — | If set, the **paid AI route requires this password**. The editor/exports stay open. |
| `PORT` | No | `3000` | HTTP port. Set automatically by Railway. |

### Securing a public deploy

The **Generate with AI** route calls the paid Claude API (with web search) on every click. On a public URL, anyone who finds it could trigger that and run up your bill. **If you set `ANTHROPIC_API_KEY` on a public deploy, set `AI_PASSWORD` too.**

- `AI_PASSWORD` gates **only** `POST /api/generate`. The editor, live preview, and Word/HTML exports stay open for everyone — so other SEs can still use the tool, but only you can trigger paid generation.
- The browser asks for the password the first time you click **Generate with AI** and remembers it (in `localStorage`). A wrong password is rejected and cleared.
- When unset, AI generation is open to anyone who can reach the page (the boot log warns about this).
- Use a long, random passphrase. It's only read from the environment — never committed. Always serve over HTTPS (Railway does by default).

---

## Editing workflow

1. Set the **Month** and **Year**.
2. Either click **✨ Generate with AI** (if enabled) to draft the month, or fill the form by hand.
3. **Verify every item against its source link** — especially AI-drafted figures, dates, and quotes. Never ship unverified numbers.
4. Watch the **live preview** (approximate — the Word export is the real layout).
5. **Export Word (.docx)** → your real template, filled in. Open it, drop screenshots into the Tools/Tips section, and save your monthly newsletter.
6. Or **Copy HTML email** to paste into Outlook/Gmail.

Last month's content autosaves in the browser, so each month you open it, regenerate or tweak, and export. **Reset** clears to a blank template.

---

## AI generation (optional)

When `ANTHROPIC_API_KEY` is set, the **✨ Generate with AI** button appears. It sends the current Month/Year to `POST /api/generate`, which calls **Claude with web search** using the prompt in `lib/aiPrompt.js` (a JSON-returning adaptation of the prompt embedded in your template). Claude researches the previous month's Fortinet news, firmware, and events and returns structured fields that the app merges into your draft.

- **It overwrites** Lead, News, Firmware, Events, and the RapidFire date (you confirm first). Your signature and the fixed template blocks are kept.
- **Always verify.** The AI is a research assistant, not a source of truth.
- **Model & cost:** one Claude request with web search per click (defaults to `claude-sonnet-4-6`). Change with `CLAUDE_MODEL`.

---

## Exports

### Word (.docx) — your real template
`Export Word (.docx)` posts your content to the server, which fills `template/newsletter.docx` with docxtemplater and returns the finished document. All original formatting — the 4×12 firmware table, headers/footers, hyperlinks in the evergreen blocks, fonts — is preserved. Unused firmware cells are left blank; an unchecked Event 4 block is removed entirely; the Tools/Tips brackets remain for you to fill in Word.

### HTML email
`Copy HTML email` copies a self-contained, inline-styled HTML version of the same content to your clipboard — paste into an Outlook/Gmail compose window. (This is an approximate layout for email, not your exact Word design.)

---

## Updating the template

If your newsletter design changes:

1. Replace `FORTINET SE NEWSLETTER TEMPLATE.docx` in the project root with the new version (keep the `[PLACEHOLDER]` text the build script looks for, or update the patterns in `scripts/build-template.js`).
2. Run `npm run build:template`. It reports how many firmware cells were tagged and which brackets remain (should be only the Tools/Tips ones).
3. Commit the regenerated `template/newsletter.docx`.

The build script strips the prompt/how-to preamble automatically, so the exported newsletter starts at "Hello …".

---

## The prompt (no app required)

This is the prompt embedded in the template. Paste it into **Copilot / Claude / ChatGPT with web access**, and fill the `[PLACEHOLDERS]` in your Word doc.

````text
You are helping me build the Fortinet SE Newsletter for [MONTH YEAR]. Use the template below this prompt as the exact structure. Fill every [PLACEHOLDER] and leave the layout, headings, and order unchanged.

WHAT TO PULL (past month — [MONTH YEAR MINUS 1]):
1. Top 3 Fortinet news items from the past month. Prioritize, in order:
   (a) FortiGuard Labs threat research / Global Threat Landscape Report releases
   (b) major product or partnership announcements (NVIDIA, AWS, Google, Microsoft, etc.)
   (c) new FortiGate / FortiAIGate / FortiOS hardware or platform launches
   For each: 2–4 sentence summary, technical-but-business audience, include announcement date, include link to Fortinet press release or blog.
2. Lead paragraph: 3–5 sentences; tie the top story to a broader defender takeaway (speed, AI, integration, zero-trust); concise, executive-level.
3. Firmware released in the past month: pull from https://docs.fortinet.com (Recommended Releases) and https://support.fortinet.com (firmware RSS). Include up to ~16 entries. Format EXACTLY using the table in the template.

WHAT TO PULL (upcoming — [MONTH YEAR] and next 60 days):
4. Upcoming Fortinet events. ALWAYS include:
   - Fortinet RapidFire Q&A (second Friday of the month at 11:30 AM PT)
   - ONE Fortinet Summit (OT Summit, Accelerate, or Security Summit)
   - ONE major industry conference (Black Hat, RSA, Gartner, etc.)
   For each event: Name; Date + time + timezone; 1–3 sentence description; Registration link (if available).
5. Keep these sections unchanged: Fortinet Fast Tracks, Fortinet NSE Training.
6. RapidFire intro line: fill the Tools/Tips/Tricks teaser; include RapidFire date/time; if topic is unknown, leave placeholders (do NOT invent).

PRIMARY DATA SOURCES:
- Events: https://www.fortinet.com/corporate/about-us/events
- Press releases: https://www.fortinet.com/corporate/about-us/newsroom/press-releases
- Firmware: docs.fortinet.com + support.fortinet.com RSS

STYLE RULES:
• Technical, confident tone — no marketing fluff
• Use exact published numbers
• Only include quotes if officially published
• Dates: "June 12" format (not numeric); include timezone (PT/PDT)
• Lead: 3–5 sentences; News items: 2–4 sentences; Events: 1–3 sentences

STRUCTURE ENFORCEMENT (DO NOT DEVIATE):
- Firmware table is MANDATORY: use the existing table; one entry per cell (e.g. "FortiOS 7.6.4 (May)"); fill left to right, top to bottom; max ~16; leave unused cells blank.
- Events: exactly 3–4, in order — RapidFire (always first), Fortinet Summit, major industry conference, optional extra (delete if not needed).
- Replace ALL placeholders; do NOT change layout/sections/order; do NOT modify the Tools/Tips section; do NOT modify Fast Tracks / NSE / signature blocks; output clean and ready for Word (no markdown).
````

---

## Data model

The app, the AI route, and the Word fill share one content model (defined in `public/template.js`, mapped to template tags in `lib/buildTags.js`):

```jsonc
{
  "month": "June", "year": "2026", "recipient": "everyone",
  "leadBlurb": "Short 1–3 sentence intro blurb (the full stories live in news[]).",
  "tips": { "topic": "", "rfTopic": "", "seOutcome": "" },
  "rapidFire": { "weekday": "Friday", "monthDay": "June 12" },
  "news": [ { "title": "", "body": "" }, /* … */ ],
  "firmware": [ "FortiOS 7.6.5", "FortiManager 7.6.4 (May)" ],
  "events": {
    "event2": { "name": "", "when": "", "link": "", "topic": "" },
    "event3": { "name": "", "dateRange": "", "desc": "" },
    "event4": { "enabled": false, "name": "", "when": "", "desc": "" }
  },
  "signature": ""
}
```

---

## Project structure

```
server.js                 Express: static hosting, /api/export/docx, optional /api/generate, auth gate
scripts/
  build-template.js       Turns your source .docx into the tagged template/newsletter.docx
lib/
  buildTags.js            Content model -> flat {tags} (incl. fw1..fw48, optional Event 4)
  fillDocx.js             Fills template/newsletter.docx with docxtemplater
  aiPrompt.js             Claude research prompt + JSON schema
public/
  index.html              Editor UI
  app.js                  Form, dynamic lists, live preview, exports, AI button
  styles.css              Styles
  template.js             Content model defaults + humble HTML preview / email renderer
template/
  newsletter.docx         Generated, tagged Word template (committed; the export source)
FORTINET SE NEWSLETTER TEMPLATE.docx   Original source design (input to build-template.js)
railway.json              Railway deploy config
.env.example              Optional AI + auth configuration
```

---

## How it works

- **Frontend** (`public/`) is plain HTML/CSS/JS — no framework, no bundler. `app.js` holds the content model, binds it to form fields, autosaves to `localStorage`, and re-renders the preview.
- **Word export** (`/api/export/docx` → `lib/fillDocx.js`) fills your committed `template/newsletter.docx` with docxtemplater, so the output *is* your design.
- **HTML email / preview** (`public/template.js`) is a lightweight, approximate render of the same content — used for the in-browser preview and the HTML email copy.
- **AI generation** (`/api/generate`) runs server-side so the API key never reaches the browser.
- **No database** — state lives in the browser; the server is stateless.

```
Browser (content model) ──► live preview / HTML email      (template.js, client-side)
        │
        ├─ POST /api/export/docx ──► fill template/newsletter.docx  (docxtemplater)
        └─ POST /api/generate    ──► Claude + web search ──► JSON draft
```

---

## Troubleshooting & FAQ

**Export says "Tagged template not found."** Run `npm run build:template` to generate `template/newsletter.docx` (it's committed, so this only happens if it was deleted).

**The "Generate with AI" button doesn't show.** No `ANTHROPIC_API_KEY` detected. Set it and restart; the boot log prints `AI generation: ENABLED/disabled`.

**A new placeholder I added isn't being filled.** The build script only replaces patterns it knows. Add a pattern in `scripts/build-template.js`, a tag value in `lib/buildTags.js`, and (optionally) a form field — then rebuild.

**Will my work disappear if I refresh?** No — it autosaves to `localStorage` in that browser.

**Is it safe to make the repo public?** Yes. No secrets are committed; `.env` is gitignored.

---

## Sources & accuracy

All content comes from **public Fortinet sources** — press releases, the FortiGuard Labs blog, `docs.fortinet.com` (Recommended Releases), and `support.fortinet.com` (firmware RSS). AI drafts are a **starting point**: verify every figure, date, and quote against the linked source before sending. Never invent leadership quotes.

## License

[MIT](./LICENSE) — personal side project, not affiliated with Fortinet, Inc.
