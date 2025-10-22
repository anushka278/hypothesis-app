# Natural Language Processing Features Guide

This guide explains the advanced NLP-powered features that make hypothesis creation intelligent and contextual.

## 🧠 Natural Language Hypothesis Parsing

### How It Works

The system automatically extracts structured information from free-text hypotheses using pattern matching and keyword detection.

### Supported Patterns

#### 1. **"Taking/Using" Pattern**
```
"I want to see if taking omega-3 improves my focus"
```
- **Intervention**: omega-3
- **Outcome**: focus
- **Category**: cognitive

#### 2. **"Does/Will" Pattern**
```
"Does meditation help reduce my stress?"
"Will morning exercise boost my energy?"
```
- Intervention: meditation / morning exercise
- Outcome: stress / energy
- Category: emotional / physical

#### 3. **"If/Whether" Pattern**
```
"Whether vitamin D affects my mood"
```
- Intervention: vitamin D
- Outcome: mood
- Category: emotional

### Automatic Categorization

The system categorizes hypotheses into 6 main areas:

| Category | Keywords | Example Outcomes |
|----------|----------|------------------|
| **Cognitive** | focus, concentration, memory, clarity, productivity, performance | "focus", "memory", "productivity" |
| **Physical** | energy, strength, endurance, recovery, pain, fitness | "energy", "stamina", "recovery time" |
| **Emotional** | mood, happiness, stress, anxiety, well-being | "mood", "stress level", "happiness" |
| **Sleep** | sleep, rest, insomnia, sleep quality | "sleep quality", "rest" |
| **Nutrition** | diet, nutrition, digestion, weight, appetite | "digestion", "weight" |
| **Behavioral** | habit, routine, behavior, consistency | "daily routine", "habits" |

## 📚 Knowledge Card Generation

### Built-in Knowledge Base

The system includes detailed information for common interventions:

#### Omega-3 / Fish Oil
```
Background:
• Omega-3 fatty acids (EPA and DHA) are essential fats
• Research suggests benefits for cognitive function
• Effects typically manifest after 2-4 weeks

Dosage: 250-1000 mg combined EPA+DHA per day
Timing: Best taken with meals, morning or midday
Controls: sleep quality, caffeine intake, diet, stress
```

#### Meditation
```
Background:
• Mindfulness meditation involves focused attention
• Research shows brain changes with 8+ weeks practice
• Consistency matters more than duration

Dosage: 5-20 minutes daily
Timing: Morning sets positive tone; evening helps sleep
Controls: sleep quality, stress events, exercise, screen time
```

#### Exercise
```
Background:
• Physical activity increases blood flow and endorphins
• Both immediate and long-term benefits exist
• Moderate intensity often optimal

Dosage: 20-30 minutes moderate activity, 3-5x per week
Timing: Morning energizes; evening helps sleep (finish 2-3 hours before bed)
Controls: sleep quality, nutrition, hydration, stress
```

#### Vitamin D
```
Background:
• Crucial for bone health, immune function, mood
• Many people deficient (especially winter/limited sun)
• Blood testing can determine baseline

Dosage: 1000-4000 IU per day (consult healthcare provider)
Timing: Take with fat-containing meal
Controls: sun exposure, mood, sleep, energy
```

#### Caffeine
```
Background:
• Stimulant that blocks adenosine receptors
• Effects peak 30-60 minutes after consumption
• Half-life 3-5 hours, can affect sleep

Dosage: 50-200 mg per serving (1-2 cups coffee)
Timing: Morning or early afternoon only; avoid 6+ hours before bed
Controls: sleep quality, anxiety levels, hydration, energy
```

#### Journaling
```
Background:
• Expressive writing processes emotions, reduces stress
• Gratitude journaling linked to improved well-being
• Consistency matters more than length

Dosage: 5-15 minutes daily or 3-4x per week
Timing: Evening reflection popular; morning sets intentions
Controls: mood, stress events, sleep quality, social connections
```

## 💬 Conversational Clarification

### Smart Follow-Up Questions

The system generates contextual questions based on your hypothesis:

#### Outcome Clarification
- **Focus** → "When you say 'focus,' do you mean during work, study, or throughout your daily life?"
- **Mood** → "Are you tracking overall mood, or specific aspects like anxiety, happiness, or irritability?"
- **Energy** → "Do you mean physical energy, mental energy, or both?"
- **Sleep** → "Are you focused on sleep quality, duration, or how rested you feel?"
- **Stress** → "Would you like to track perceived stress levels or physical stress symptoms?"
- **Productivity** → "How do you measure productivity - tasks completed, time focused, or quality of work?"

#### Frequency Questions
For activities (exercise, meditation):
- "How often will you practice [activity]? (e.g., daily, 3x per week)"

For supplements:
- "How often will you take [supplement]? (e.g., daily with breakfast)"

#### Timing Questions
For cognitive outcomes:
- "What time of day do you want to track your focus/performance? (morning, afternoon, evening)"

## 🎯 Smart Control Variable Suggestions

The system recommends control variables based on the outcome category:

### Cognitive Experiments
**Recommended Controls:**
- Sleep quality
- Caffeine intake
- Stress level
- Hydration
- Diet quality

**Example:** Testing omega-3 for focus
→ Track sleep, caffeine, and stress to identify confounding factors

### Physical Experiments
**Recommended Controls:**
- Sleep quality
- Nutrition
- Hydration
- Stress
- Recovery time

**Example:** Testing exercise for energy
→ Track sleep and nutrition to separate effects

### Emotional Experiments
**Recommended Controls:**
- Sleep quality
- Stress events
- Social interaction
- Exercise
- Screen time

**Example:** Testing meditation for stress
→ Track sleep and social time to understand patterns

### Sleep Experiments
**Recommended Controls:**
- Caffeine intake
- Screen time before bed
- Exercise
- Stress level
- Bedtime consistency

**Example:** Testing magnesium for sleep quality
→ Track caffeine and screen time to identify interference

## 📊 Baseline Tracking Phase

### Why Baseline Matters

A baseline period provides:
1. **Comparison Point**: Measure actual change from intervention
2. **Natural Variation**: Understand your normal range
3. **Confounding Factors**: Identify external influences
4. **Statistical Validity**: More reliable conclusions

### How It Works

1. **Recommended Duration**: 3-7 days (default: 7 days)
2. **What to Track**: Outcome variable only (without intervention)
3. **Visual Indicators**: Dashboard shows days remaining in baseline
4. **Automatic Transition**: System tracks when to start intervention

### Example Timeline

```
Day 1-7: Baseline Phase
  ✓ Track: Focus (scale 1-10)
  ✓ Track: Sleep, Caffeine, Stress (controls)
  ✗ Don't take: Omega-3

Day 8+: Intervention Phase
  ✓ Track: Focus (scale 1-10)
  ✓ Track: Omega-3 (binary: yes/no)
  ✓ Track: Sleep, Caffeine, Stress (controls)
  ✓ Take omega-3 daily
```

## 🔧 Extending the Knowledge Base

To add knowledge for a new intervention, edit `/lib/nlp-parser.ts`:

```typescript
const knowledgeBase: Record<string, Partial<KnowledgeCard>> = {
  'your-intervention': {
    backgroundInfo: [
      'First fact about your intervention',
      'Second fact',
      'Third fact'
    ],
    evidenceSummary: 'Summary of research evidence',
    typicalDosage: 'How much/how often',
    timing: 'When to do it',
    sources: ['Reference 1', 'Reference 2'],
    relatedControls: ['control1', 'control2', 'control3']
  },
  // ... more interventions
};
```

## 🚀 Example Conversations

### Example 1: Omega-3 for Focus

**User**: "I want to see if taking omega-3 improves my focus"

**System**: 
```
✨ Great! I've analyzed your hypothesis:

Intervention: omega-3
Outcome: focus
Category: cognitive

[Shows Knowledge Card with omega-3 info]

Now, let me ask a few questions...
```

**System**: "When you say 'focus,' do you mean during work, study, or throughout your daily life?"

**User**: "During work"

**System**: "How often will you take omega-3?"

**User**: "Daily with breakfast"

**System**: "Would you like to track a 7-day baseline before starting omega-3?"

**User**: "Yes"

**System**: 
```
🎯 Control Variables

I recommend also tracking:
1. sleep quality
2. caffeine intake
3. stress level
4. hydration
5. diet quality

Would you like to track these?
```

**User**: "Sleep, caffeine, and stress"

**System**:
```
🎉 Experiment Summary

Hypothesis: I want to see if taking omega-3 improves my focus

Intervention: omega-3
Outcome: focus

✓ 7-day baseline phase
✓ Tracking controls: sleep quality, caffeine intake, stress level
✓ Frequency: Daily with breakfast

Ready to start?
```

### Example 2: Meditation for Stress

**User**: "Does meditation help reduce my stress?"

**System**:
```
✨ Great! I've analyzed your hypothesis:

Intervention: meditation
Outcome: stress
Category: emotional

[Shows meditation knowledge card]
```

**System**: "Are you tracking perceived stress levels or physical stress symptoms?"

**User**: "Perceived stress levels"

**System**: "How often will you practice meditation?"

**User**: "Daily, 10 minutes in the morning"

**System**: "Would you like to track a 7-day baseline?"

**User**: "No, start immediately"

**System**:
```
🎯 Control Variables

Recommended:
1. sleep quality
2. stress events
3. social interaction
4. exercise
5. screen time

Which would you like to track?
```

**User**: "All of them"

**Result**: Creates experiment with meditation (binary), stress level (scale), and 5 control variables.

## 📈 Tips for Best Results

1. **Be Specific**: "omega-3 for work focus" > "supplements help me think"
2. **Use Common Terms**: System recognizes standard interventions better
3. **Answer Clarifiers**: More context = better variable configuration
4. **Track Controls**: They're suggested for a reason - use them!
5. **Try Baseline**: Especially for subtle interventions (supplements, diet changes)
6. **Be Consistent**: Daily logging gives best insights

## 🔮 Future Enhancements (OpenAI Integration)

When connected to OpenAI API, the system will:

1. **Parse Any Intervention**: Not limited to predefined knowledge base
2. **Generate Custom Knowledge**: Real-time research summaries
3. **Adaptive Questioning**: Dynamic follow-ups based on responses
4. **Correlation Analysis**: AI-detected patterns in control variables
5. **Personalized Recommendations**: Based on your specific data patterns

## 🛠️ Technical Details

### Parsing Confidence Score

The system calculates a confidence score (0-1) for its parsing:
- **0.5**: Generic intervention/outcome detected
- **+0.2**: Specific intervention recognized
- **+0.2**: Specific outcome recognized
- **+0.1**: Clear causal language used

Higher confidence = better parsing accuracy.

### Variable Type Auto-Selection

- **Scale (1-10)**: Outcomes (mood, energy, focus, sleep quality)
- **Binary (Yes/No)**: Activities (exercise, meditation, supplement taken)
- **Numeric**: Quantities (water glasses, hours of sleep, mg of supplement)

Control variables auto-select based on their nature (quality = scale, intake = numeric, activity = binary).

---

Ready to create smarter experiments? Head to the Chat tab and try it out! 🚀

