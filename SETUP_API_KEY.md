# 🔑 OpenAI API Key Setup

## Quick Setup (Using .env file)

### 1. Get Your API Key
Go to: **https://platform.openai.com/api-keys**
- Sign up or log in
- Click "Create new secret key"
- Copy the key (starts with `sk-...`)

### 2. Add to .env File

Open the `.env` file in the `hypothesis-app` folder and replace the placeholder:

```
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-actual-key-here
```

**Important:**
- ✅ Use `NEXT_PUBLIC_OPENAI_API_KEY` (not just `OPENAI_API_KEY`)
- ✅ No spaces around the `=` sign
- ✅ Replace the placeholder with your real key

### 3. Restart Dev Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

### 4. Test It

Visit http://localhost:3000/chat and try:
- "Does running reduce stress?"
- AI will extract: running → stress
- AI will generate custom knowledge card

## ✅ Verify It's Working

You should see in the browser console:
```
AI Parsed: {intervention: "running", outcome: "stress", ...}
AI Knowledge Card: {...}
```

## 💰 Cost

Using `gpt-4o-mini`:
- ~$0.004 per experiment setup
- Very affordable for testing

## 🔒 Security

The `.env` file is in `.gitignore` - your API key won't be committed to git.

