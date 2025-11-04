# OpenAI API Setup Instructions

## 🔑 Step 1: Get Your API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)

## 📝 Step 2: Create .env.local File

In the root of your project (`/Users/anushkarawat/firstDraft/hypothesis-app/`), create a file named `.env.local`:

```bash
# Create the file
touch .env.local
```

Or create it manually in your code editor.

## 🔐 Step 3: Add Your API Key

Open `.env.local` and paste:

```
OPENAI_API_KEY=your-api-key-here
```

Replace `sk-your-actual-key-here` with your actual key from OpenAI.

**Optional:** Choose a model (default is `gpt-4o-mini` for lower cost):

```
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-4o-mini
```

Available models:
- `gpt-4o-mini` - Faster, cheaper (~$0.15/million tokens) ✅ Recommended
- `gpt-4o` - More powerful, more expensive (~$2.50/million tokens)
- `gpt-4-turbo` - Previous generation

## 🚀 Step 3: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## ✅ That's It!

The app will now use OpenAI for:
- ✨ Parsing ANY hypothesis (not just hardcoded interventions)
- 📚 Generating knowledge cards dynamically
- 💬 Creating contextual clarifying questions
- 🎯 Suggesting relevant control variables

## 💰 Cost Estimates

With `gpt-4o-mini`:
- Parse hypothesis: ~$0.001 per hypothesis
- Generate knowledge card: ~$0.002 per card
- Generate questions: ~$0.001 per set
- **Total per experiment setup: ~$0.004 (less than half a cent)**

Creating 100 experiments = ~$0.40

## 🔒 Security Note

Never commit `.env.local` to git! It's already in `.gitignore`.

## 🧪 Test It

Try unusual interventions that weren't hardcoded:
- "Does cold showers improve my willpower?"
- "Will reducing sugar intake affect my skin?"
- "Does standing desk usage reduce my back pain?"

The AI will generate custom knowledge cards for ALL of these!

