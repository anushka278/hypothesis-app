# Hypothesis Testing Well-Being App

An interactive app that helps users design and test personal hypotheses about how specific behaviors, habits, or interventions affect their physical or mental well-being.

## Features

### 🧠 **Natural Language Hypothesis Parsing**
- Enter hypotheses in plain English (e.g., "Does taking omega-3 improve my focus?")
- Automatic extraction of:
  - **Intervention**: What you're testing (e.g., "omega-3")
  - **Outcome**: What you're measuring (e.g., "focus")
  - **Category**: Auto-categorized (cognitive, physical, emotional, sleep, nutrition, behavioral)

### 💬 **Conversational Clarification (Chat Interface)**
- Smart follow-up questions to refine your experiment
- Contextual clarifiers without repeating known information
- Examples:
  - "When you say 'focus,' do you mean during work, study, or daily life?"
  - "How often will you take omega-3?"

### 📚 **Automatic Contextual Enrichment**
- AI-generated **Knowledge Cards** provide:
  - Background information on interventions
  - Evidence summaries from research
  - Typical dosage/frequency recommendations
  - Optimal timing suggestions
  - Related control variables
- Covers common interventions: omega-3, meditation, exercise, vitamin D, caffeine, and more

### 📊 **Baseline Tracking Phase**
- Optional 3-7 day baseline period before intervention starts
- Creates a comparison point for "before vs after" analysis
- Visual indicators show baseline phase progress

### 🎯 **Smart Control Variable Suggestions**
- System recommends relevant control variables based on your goal:
  - **Focus/Cognitive**: sleep, caffeine, stress, hydration, diet
  - **Mood/Emotional**: stress events, social interaction, exercise, screen time
  - **Physical/Energy**: sleep, nutrition, hydration, recovery time
  - **Sleep**: caffeine, screen time before bed, exercise, stress
- Track both primary and control variables separately

### 📈 **Dashboard**: Track multiple variables with quick logging and mini charts
### 💡 **Insights**: AI-generated insights with data visualizations
### 📚 **Library**: Manage all your hypotheses with detailed metadata

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Framer Motion** for animations
- **Lucide React** for icons
- **localStorage** for data persistence

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How to Use

### Creating a Smart Hypothesis

1. **Enter Your Hypothesis** in natural language:
   ```
   "I want to see if taking omega-3 improves my focus"
   "Does meditation reduce my stress?"
   "Will morning exercise boost my energy?"
   ```

2. **Review the Knowledge Card** - Automatically generated with:
   - Research-backed background information
   - Dosage and timing recommendations
   - Suggested control variables

3. **Answer Clarifying Questions**:
   - Specify context (e.g., "focus during work" vs "general focus")
   - Define frequency (e.g., "daily" or "3x per week")
   - Choose timing preferences

4. **Configure Baseline** (optional):
   - Track outcome for 3-7 days *before* starting intervention
   - Creates scientifically valid comparison

5. **Select Control Variables**:
   - Choose from smart recommendations
   - Track factors that might influence results
   - Separated as "Primary" and "Control" variables

6. **Start Tracking** - Head to Dashboard to log data

### Daily Tracking

1. Navigate to **Track** tab
2. Log **Primary Variables** (intervention + outcome)
3. Log **Control Variables** (sleep, stress, etc.)
4. Add optional notes for context
5. Quick-log with binary Yes/No buttons or scales

### View Insights

1. Check **Insights** tab after 5-7 days
2. See trend charts for all variables
3. Read AI-generated pattern insights
4. Track your experiment progress

### Manage Experiments

1. Visit **Library** tab
2. View parsed hypothesis details
3. See intervention, outcome, and category
4. Archive completed experiments

## Color Scheme

- Background: Off-white/Warm Beige (#F9F8F4)
- Primary Accent: Soft Teal (#6CC5A1)
- Secondary Accent: Muted Coral (#F57C6E)
- Text: Dark Gray (#333)
- Chart Highlights: Pastel Blue, Lavender, Sage Green

## Data Storage

All data is stored locally in your browser's localStorage. No data is sent to external servers.

## Future Enhancements

- OpenAI API integration for real AI insights (replace mock-ai.ts)
- Data export functionality
- More chart types and correlation analysis
- Reminder notifications
- Data sharing capabilities

## Example Workflow

**User**: "I want to see if taking omega-3 improves my focus"

**System Parses**:
- Intervention: omega-3
- Outcome: focus
- Category: cognitive

**Knowledge Card Displays**:
```
Background:
• Omega-3 fatty acids (EPA and DHA) are essential fats
• Research suggests benefits for cognitive function
• Effects typically manifest after 2-4 weeks

Typical Dosage: 250-1000 mg combined EPA+DHA per day
Timing: Best taken with meals, morning or midday
Recommended Controls: sleep quality, caffeine intake, stress
```

**Clarifying Questions**:
1. "When you say 'focus,' do you mean during work, study, or daily life?"
   → User: "During work"

2. "How often will you take omega-3?"
   → User: "Daily with breakfast"

3. "Would you like a 7-day baseline before starting?"
   → User: "Yes"

**Result**: Experiment created with:
- Primary: Focus (scale 1-10), Omega-3 (binary)
- Controls: Sleep Quality, Caffeine, Stress
- 7-day baseline, then intervention starts

## Project Structure

```
/app
  /chat - Advanced NLP-powered chat interface
  /dashboard - Variable tracking with baseline indicators
  /insights - Graphs and AI insights
  /library - Hypothesis library with parsed details
/components
  /chat - ChatBubble, ChatInput, KnowledgeCard
  /dashboard - VariableCard (primary + control)
  /insights - Charts, InsightCard
  /ui - BottomNav, Button, Card
/lib
  /storage - localStorage utilities
  /types - Enhanced TypeScript interfaces
  /mock-ai - Mock insight generator
  /nlp-parser - Natural language parsing engine
```

## License

MIT
