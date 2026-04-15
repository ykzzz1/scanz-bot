# ScanZ — Autonomous Crypto Signal Bot
**By TraderYKZ** | Powered by Claude AI + X API v2

ScanZ is a fully autonomous crypto Twitter bot that posts high-signal market commentary every 2 hours and replies to on-topic @mentions using live market data.

---

## What ScanZ does

- Posts every 2 hours with live BTC/ETH/SOL/BNB/XRP data
- Rotates through 6 post types: market summary, price update, top mover, Fear & Greed commentary, news reaction, weekly check
- Polls every 3 minutes for @mentions
- Classifies every mention before replying — off-topic mentions are silently ignored
- All replies include live market data
- Never recommends buying or selling — always ends with NFA
- Survives restarts without duplicate posts or replies
- Logs every action with timestamps

---

## Prerequisites

- Node.js 20+
- X/Twitter Developer account with Basic tier (~$100/mo)
- Anthropic API key (console.anthropic.com)
- CoinGecko API key — free Demo plan (coingecko.com/api)
- CryptoPanic API key — free (cryptopanic.com/developers/api)

---

## Setup — step by step

### Step 1 — Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/scanz-bot
cd scanz-bot
npm install
```

### Step 2 — Create your .env file

Create a file named `.env` in the project root:

```
TWITTER_APP_KEY=your_twitter_app_key
TWITTER_APP_SECRET=your_twitter_app_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_token_secret
ANTHROPIC_API_KEY=your_anthropic_key
COINGECKO_API_KEY=your_coingecko_demo_key
CRYPTOPANIC_API_KEY=your_cryptopanic_key
BOT_USER_ID=numeric_twitter_user_id_of_bot_account
POST_INTERVAL_HOURS=2
MAX_REPLIES_PER_CYCLE=5
REPLY_DELAY_MS=10000
```

**How to get each key:**

- `TWITTER_APP_KEY / APP_SECRET` — developer.twitter.com → Your App → Keys and Tokens → Consumer Keys
- `TWITTER_ACCESS_TOKEN / ACCESS_SECRET` — developer.twitter.com → Your App → Keys and Tokens → Access Token and Secret (generate for your bot account)
- `ANTHROPIC_API_KEY` — console.anthropic.com → API Keys
- `COINGECKO_API_KEY` — coingecko.com/api → Demo plan → My API Keys
- `CRYPTOPANIC_API_KEY` — cryptopanic.com/developers/api → Register → Get key
- `BOT_USER_ID` — Go to tweeterid.com or api.twitter.com/2/users/by/username/YOURBOTHANDLE — copy the numeric `id` field

### Step 3 — Run locally to test

```bash
npm start
```

You should see the ScanZ banner, a boot log, and an immediate first broadcast attempt. Check your bot's Twitter profile — the first tweet should appear within 30 seconds.

### Step 4 — Deploy to Railway (recommended)

1. Push your repo to GitHub (`git push origin main`)
2. Go to railway.app → New Project → Deploy from GitHub Repo
3. Select your repo
4. Go to Variables tab → add all your .env vars one by one
5. Set Start Command: `node index.js`
6. Click Deploy
7. Monitor logs in the Railway dashboard

ScanZ will now run 24/7 automatically.

**Important:** Do NOT commit your `.env` file. Add `.env` to `.gitignore` before pushing.

---

## File guide — what each file does

| File | Purpose | When to edit |
|------|---------|--------------|
| `index.js` | Boots the bot, validates env, starts both engines | Rarely |
| `broadcaster.js` | Runs the cron schedule, posts tweets | To change posting behavior |
| `responder.js` | Polls mentions, runs topic filter, posts replies | To change reply behavior |
| `claude.js` | All Claude API calls — tweet gen, topic check, replies | To change AI output quality |
| `data.js` | Fetches market data, Fear & Greed, headlines | To add new data sources |
| `prompt.js` | System prompt + 6 post type instructions | To change ScanZ's voice/rules |
| `state.js` | Reads/writes state.json safely | Rarely |
| `logger.js` | Timestamped colored logging | Rarely |
| `state.json` | Persists last mention ID, post counters | Never edit manually |
| `.env` | All API keys and config | When rotating keys |

---

## Customization

### Change post frequency
In `.env`: set `POST_INTERVAL_HOURS=4` for every 4 hours, `POST_INTERVAL_HOURS=1` for every hour.
Note: X API Basic allows 17 posts/day max — don't go below 2 hours.

### Add a new post type
In `prompt.js`:
1. Add the type name string to the `POST_TYPES` array
2. Add the instruction to `POST_TYPE_INSTRUCTIONS`
ScanZ will automatically include it in the rotation.

### Change the bot's persona
Edit `SYSTEM_PROMPT` in `prompt.js`. This is the most powerful lever — the system prompt controls everything about tone, format, and rules.

### Track additional coins
In `data.js`, edit the `ids` parameter in `getMarketSnapshot()` — add any CoinGecko coin ID (e.g. `cardano`, `avalanche-2`, `chainlink`).

---

## Monitoring

All logs are tagged and timestamped:

```
[BOOT]      Bot starting up
[BROADCAST] Tweet posted
[REPLY]     Mention replied to
[SKIP]      Off-topic mention ignored
[DATA]      Data fetched successfully
[ERROR]     Something failed (cycle skipped, bot continues)
[INFO]      General status
```

In Railway: click your deployment → Logs tab. You'll see every action in real time.

---

## Monthly costs

| Item | Cost |
|------|------|
| X API Basic | ~$100/mo |
| Anthropic API (2hr intervals, ~5 replies/day) | ~$8–15/mo |
| Railway hosting | Free tier or ~$5/mo |
| CoinGecko Demo | Free |
| CryptoPanic | Free |
| **Total** | **~$113–120/mo** |

---

## Scaling ScanZ — full roadmap

### Month 1 — Launch & validate ($113–120/mo)
- Deploy ScanZ as-is
- Post every 2 hours, reply to mentions
- Goal: reach 500 followers organically through consistent signal quality
- TraderYKZ promotes @ScanZ from personal account
- No revenue yet — this is audience building

### Month 2–3 — Build authority (same costs)
- Manually retweet ScanZ's best posts from @TraderYKZ
- Engage with crypto KOLs who reply to ScanZ
- Add hashtags to post templates: `#Bitcoin #Crypto #DeFi`
- Goal: 2,000–5,000 followers
- Revenue possibility unlocked: X Premium monetization (requires 500+ followers + 5M impressions)

### Month 3–4 — First revenue stream: X Creator Ads
- Apply for X Ads Revenue Sharing once you hit 5M impressions/month
- At 5,000 followers + consistent posting, this is achievable
- Estimated payout: $50–200/mo (covers part of API cost)
- Stack with TraderYKZ promoting ScanZ to their audience

### Month 4–6 — Second revenue stream: sponsored posts
- Crypto projects, exchanges, and DeFi protocols pay for sponsored mentions
- At 5,000–10,000 engaged followers in the crypto niche: $100–500 per sponsored post
- 2–4 sponsored posts/month = $200–2,000/mo
- Gate this carefully — only take sponsors that are legitimate projects
- Disclose all sponsored content (both legally required and protects credibility)

### Month 6+ — Third revenue stream: premium signals
- Launch a Telegram or Substack where ScanZ's raw data + extended commentary is published
- Free Twitter = top-line signal. Paid channel = full breakdown
- Price: $15–30/month per subscriber
- At 200 subscribers: $3,000–6,000/mo recurring
- Promote the paid channel in ScanZ's bio and pinned tweet

### Upgrade to X API Pro when revenue justifies it
- Pro tier (~$5,000/mo) unlocks 1,667 posts/day — enables multiple post formats, more aggressive engagement
- Only makes sense once revenue from the above streams exceeds ~$3,000/mo

### ROI timeline summary

| Month | Cost | Revenue (est.) | Net |
|-------|------|---------------|-----|
| 1 | $120 | $0 | -$120 |
| 2 | $120 | $0 | -$120 |
| 3 | $120 | $50–200 | -$70 to +$80 |
| 4 | $120 | $200–500 | +$80–380 |
| 5 | $120 | $500–1,500 | +$380–1,380 |
| 6 | $120 | $1,000–4,000 | +$880–3,880 |

Total investment to break even: ~$360–500 over 3–4 months.
Upside at month 6 with premium channel: $3,000–6,000/mo on ~$120 cost base.

---

## Important legal notes

- Always include NFA (not financial advice) on market commentary — ScanZ does this automatically
- Disclose all sponsored content explicitly
- Do not use ScanZ to pump specific assets you hold — this is market manipulation
- Review X's automation policies at developer.twitter.com/en/developer-terms/policy
