# Lead Search (minimal)

Dashboard app to find social leads via **Puppeteer (browser Google search)** or optional **Google Custom Search API**, extract fields with **OpenRouter**, store in **PostgreSQL (Neon)**, filter by category, and **export XLSX**.

## Query format

When you pick **Instagram** and niche **dentist**, the app runs:

```text
site:instagram.com "dentist" "@gmail.com" OR "@yahoo.com" OR "@hotmail.com" OR "@outlook.com" OR "@aol.com" OR "@yahoo.co.uk" OR "@hotmail.fr" OR "@msn.com"
```

OpenRouter is prompted to return JSON with: **Name**, profile link, **Business name**, **Email**. Rows without a real email are dropped.

## Setup

1. Copy env file and fill keys:

   ```bash
   cp .env.example .env
   ```

2. **Database** — set `DATABASE_URL` to your Neon (or other Postgres) connection string.

3. **Google search (default: browser)**
   - `SEARCH_PROVIDER=browser` uses Puppeteer/Chromium on the server (works locally; needs a Node host with Chrome deps in production).
   - Optional: `PUPPETEER_HEADLESS=false` opens a visible browser while debugging CAPTCHA issues.
   - Fallback: `SEARCH_PROVIDER=cse` + `GOOGLE_API_KEY` + `GOOGLE_CSE_ID` ([Programmable Search Engine](https://programmablesearchengine.google.com/)).

4. **OpenRouter**
   - Sign up at [openrouter.ai](https://openrouter.ai/), create an API key.
   - Set `OPENROUTER_API_KEY`.
   - Default model: `meta-llama/llama-3.2-3b-instruct:free` (change via `OPENROUTER_MODEL`).

5. Install and run:

   ```bash
   npm install
   npm run db:push
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- Puppeteer searches can trigger Google CAPTCHA; use CSE or slower/manual pacing if that happens.
- CSE free tier is limited (~100 queries/day) when using `SEARCH_PROVIDER=cse`.
- Extraction quality depends on snippets containing emails; many profiles won’t appear in SERP text.
- Comply with Google’s terms, platform ToS, and applicable privacy/spam laws when contacting leads.
# googleautomatedsearch
