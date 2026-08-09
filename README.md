# AI News Radar

A personal intelligence dashboard that continuously monitors reliable AI information sources, filters out noise and hype, verifies important claims, eliminates duplicate coverage across media, and presents verified AI developments.

---

## Architecture Overview

```
[Tier 1 Primary Sources]  (OpenAI, DeepMind, Anthropic, HuggingFace, arXiv)
[Tier 2 Media & News]     (TechCrunch, MIT Tech Review, Verge, VentureBeat)
[Tier 3 Community Signals] (Hacker News, RSS feeds)
           │
           ▼
[RSS / Atom Ingestion & Normalization]
   - Content Hashing & URL Cleaning
   - Timestamps & Author Normalization
           │
           ▼
[Event Clustering & Duplicate Detection]
   - Grouping multi-source articles into 1 Event
   - Title Similarity & Proximity Matching
           │
           ▼
[AI Intelligence Analysis (Gemini / Anti-Hype Engine)]
   - Factual non-clickbait title generation
   - Importance Scoring (0-100) & Category Tagging
   - Verification Status (CONFIRMED, PRIMARY_SOURCE_ONLY, etc.)
   - "Why It Matters" developer impact extraction
           │
           ▼
[SQLite Storage & Next.js API]
           │
 ┌─────────┴─────────┐
 ▼                   ▼
[Dashboard UI]     [07:00 AM Daily Email Briefing]
 (React + CSS)      (Nodemailer / Hostinger SMTP)
```

---

## Features

- **RSS-First Architecture**: Zero dependency on paid commercial APIs or scrapers.
- **Fundamental Event Deduplication**: Combines multiple news outlets writing about the same story into **ONE underlying event** with primary and secondary source links.
- **Anti-Hype & Anti-Clickbait System**: Detects sensational vocabulary (`revolutionary`, `destroys`, `AGI achieved`) and transforms headlines into objective factual statements.
- **Verification Hierarchy**: Tags events as `CONFIRMED`, `PRIMARY_SOURCE_ONLY`, `MULTI_SOURCE_REPORTED`, `REPORTED`, or `UNVERIFIED`.
- **07:00 AM Daily Email Digest**: Automates a morning summary email containing top developments, research watch, and open-source releases using Hostinger or standard SMTP.
- **Since Last Visit Tracker**: Highlights newly detected events since your last visit.
- **Admin & Health Monitor**: Hidden `/admin` dashboard to inspect ingestion logs, RSS failures, database stats, and trigger manual pipeline runs.

---

## Environment Variables (`.env`)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLite database file location | `file:./prisma/dev.db` |
| `GEMINI_API_KEY` | Server-side Gemini API key | `AIzaSy...` |
| `SMTP_HOST` | Google Gmail SMTP Host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP Port | `587` |
| `SMTP_USER` | Gmail Address | `i621311@gmail.com` |
| `SMTP_PASSWORD` | Google App Password | `xxxx xxxx xxxx xxxx` |
| `SMTP_FROM` | From Header | `i621311@gmail.com` |
| `SMTP_TO` | Recipient Email | `i621311@gmail.com` |
| `SMTP_SECURE` | Set `true` for Port 465 | `false` |
| `TIMEZONE` | Timezone for 7 AM cron | `Asia/Kolkata` |

*Note: If `GEMINI_API_KEY` is omitted, the application seamlessly runs in deterministic rule-based fallback mode without crashing.*

---

## Quick Setup & Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Initialize Database & Seed Sources**:
   ```bash
   npx prisma db push
   npm run seed
   ```

3. **Start Next.js Dashboard**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

4. **Start Ingestion Worker & Email Scheduler**:
   In a separate terminal:
   ```bash
   npm run worker
   ```

---

## Testing

Run unit tests covering URL normalization, duplicate title matching, and email generation:

```bash
npm test
```

---

## How to Add New RSS Sources

Edit `config/sources.json`:

```json
{
  "name": "New AI Source",
  "url": "https://example.com/ai",
  "rssUrl": "https://example.com/rss.xml",
  "type": "primary",
  "credibilityTier": 1,
  "reliabilityScore": 95,
  "pollingInterval": 5,
  "priority": 90,
  "enabled": true
}
```

Then run `npm run seed` to refresh the sources database.

---

## Deployment & Netlify Setup

### Deploying to Netlify (Recommended Serverless Deployment)

1. **Push your code to GitHub / GitLab / Bitbucket**.
2. **Import project into Netlify**:
   - Go to [Netlify App](https://app.netlify.com) -> **Add new site** -> **Import an existing project**.
   - Build Command: `npx prisma generate && npm run build`
   - Publish Directory: `.next`
3. **Configure Netlify Environment Variables** (Site settings -> Environment variables):
   - `DATABASE_URL`: `file:./prisma/dev.db` (or a hosted database like Turso / Supabase if persisting across serverless restarts)
   - `GEMINI_API_KEY`: `Your Gemini API Key`
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: `i621311@gmail.com`
   - `SMTP_PASSWORD`: `Your 16-character Google App Password`
   - `SMTP_FROM`: `i621311@gmail.com`
   - `SMTP_TO`: `i621311@gmail.com`
   - `TIMEZONE`: `Asia/Kolkata`
4. **Scheduled Automations on Netlify**:
   The app includes `netlify.toml` and Netlify Scheduled Functions:
   - `scheduled-fetch`: Automatically ingests RSS & clusters news every 15 minutes.
   - `scheduled-email`: Automatically sends the 07:00 AM daily briefing email to `i621311@gmail.com`.

---

## Deploying to VPS / Hostinger

- Use `pm2` to run both the Next.js app and background worker:
  ```bash
  pm2 start npm --name "ai-radar-app" -- start
  pm2 start worker.js --name "ai-radar-worker"
  ```
