# 🚀 Quick Start - OpenAI Integration

## ✅ What's Done

Your app now uses **OpenAI GPT** to:
- Parse ANY hypothesis (not just hardcoded ones)
- Generate custom knowledge cards for any intervention
- Create contextual clarifying questions
- Suggest relevant control variables

## 🔑 Step 1: Get Your OpenAI API Key

1. Go to: **https://platform.openai.com/api-keys**
2. Sign up or log in
3. Click **"Create new secret key"**
4. Copy the key (starts with `sk-...`)

## 📝 Step 2: Create .env.local File

In your terminal, run:

```bash
cd /Users/anushkarawat/firstDraft/hypothesis-app
echo "OPENAI_API_KEY=sk-your-key-here" > .env.local
```

**OR** create the file manually:

1. In the `hypothesis-app` folder, create a new file called `.env.local`
2. Add this line:

```
OPENAI_API_KEY=sk-your-actual-key-here
```

Replace `sk-your-actual-key-here` with your real API key.

## 🔄 Step 3: Restart the Dev Server

```bash
# Stop the current server (press Ctrl+C)
# Then restart:
npm run dev
```

## ✨ That's It!

Visit **http://localhost:3000/chat** and try:

### Test with Unusual Interventions (That Weren't Hardcoded):

1. **"Does cold showers improve my willpower?"**
   - ✅ AI will generate custom knowledge card about cold showers
   - ✅ AI will extract "cold showers" → "willpower"
   - ✅ AI will suggest relevant controls

2. **"Will reducing sugar intake clear up my skin?"**
   - ✅ AI generates nutrition science about sugar and skin
   - ✅ Suggests controls like "water intake", "sleep", etc.

3. **"Does journaling before bed improve my sleep quality?"**
   - ✅ AI provides research on journaling and sleep
   - ✅ Creates specific questions about your journaling routine

## 💰 Cost

Using `gpt-4o-mini` (default):
- **~$0.004 per experiment** (less than half a cent)
- Creating 100 experiments = ~$0.40

## 🔄 Fallback

If no API key is found, the app automatically falls back to the hardcoded knowledge base (omega-3, meditation, exercise, etc.).

## 📁 Files Modified

- ✅ `lib/openai-service.ts` - New OpenAI integration
- ✅ `app/chat/page.tsx` - Uses AI when key is present
- ✅ `next.config.ts` - Exposes env variables

---

**Need help?** Check `OPENAI_SETUP.md` for detailed troubleshooting.

