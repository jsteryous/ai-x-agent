# AI X Agent

Economic commentary on AI's cost impact. Auto-drafts tweets from AI news sources, fact-checks hype, tracks what writing style works.

## What it does

- **Drafts tab** — generates opinionated tweets from AI news sources using Claude
- **Trending tab** — loads current AI topics, fact-checks hype score, drafts grounded breakdown tweets
- **Published tab** — track likes/reposts/impressions for posts you've published to X
- **Insights tab** — Claude analyzes your published posts and builds a picture of what content patterns work
- **Setup tab** — API key, n8n automation workflow download, RSS source list

---

## Deploy to Vercel (one-time, ~15 minutes)

### Step 1 — Put the code on GitHub

1. Go to github.com → click **New repository**
2. Name it `ai-x-agent`, set to **Private**, click Create
3. On your computer, open Terminal (Mac) or Command Prompt (Windows)
4. Run these commands one by one:

```bash
cd ~/Downloads/ai-x-agent   # or wherever you extracted the zip
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/YOUR_USERNAME/ai-x-agent.git
git push -u origin main
```

### Step 2 — Connect to Vercel

1. Go to vercel.com → click **Add New Project**
2. Click **Import Git Repository** → find `ai-x-agent`
3. Leave all settings as default
4. Click **Deploy**

Vercel builds it automatically. Takes ~60 seconds.

### Step 3 — Point your domain

1. In Vercel → your project → **Settings → Domains**
2. Type your domain name → click Add
3. Vercel shows you DNS records to add
4. Go to wherever your domain is registered (GoDaddy, Namecheap, etc.)
5. Add the DNS records Vercel shows you
6. Takes 5–30 minutes to propagate

### Step 4 — Use it

Open your domain. Go to Setup tab. Add your Claude API key (from console.anthropic.com). Start generating drafts.

---

## Updating the app later

Any time you want to change something:
1. Edit the files
2. Run `git add . && git commit -m "update" && git push`
3. Vercel auto-deploys in ~60 seconds

---

## Cost

- Vercel hosting: **free**
- Claude API: **~$2–5/month** at 3–5 posts/day
- X API (write-only): **free**

---

## Going fully autonomous (n8n)

Once you've reviewed ~20–30 drafts manually and trust the output:

1. Download the n8n workflow from the Setup tab
2. Install n8n: `npm install -g n8n` then run `n8n`
3. Go to localhost:5678 → Import workflow → upload the JSON
4. Add your credentials: Anthropic API key + X API keys
5. Activate the workflow — it runs every 6 hours automatically
