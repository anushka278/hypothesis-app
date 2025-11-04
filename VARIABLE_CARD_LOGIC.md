# Variable Card Logic Documentation

This document explains how variable cards are defined, including how their types (binary/scale/numeric) are determined and how their layouts are rendered.

## Overview

Variable cards are rendered in `components/dashboard/VariableCard.tsx` and are displayed on the Track page (`app/dashboard/page.tsx`). The card's layout and behavior are determined by:

1. **Variable Type** (`binary`, `scale`, or `numeric`) - stored in the variable object
2. **Variable Name** - used to detect special cases (exercise, hydration, sleep, nutrition, stress)
3. **Special Component Detection** - based on name patterns

---

## 1. Variable Type Assignment

Variables are created in `app/chat/page.tsx` in the `createAndSaveHypothesis()` function (lines 438-537).

### Outcome Variables (Primary)
- **Always**: `type: 'scale'` (1-10 rating)
- Example: "Focus", "Energy", "Mood"

### Intervention Variables (Primary)
- **Always**: `type: 'binary'` (Yes/No)
- Exception: Tracked even during baseline if it's exercise or meditation
- Example: "Exercise", "Meditation", "Omega-3"

### Control Variables

Control variables use a **rule-based system** that analyzes the variable name to determine type:

```typescript
// Lines 487-526 in app/chat/page.tsx

// Special cases first:
if (controlLower.includes('sleep')) {
  varType = 'scale';  // Sleep is always scale
}
else if (controlLower.includes('stress')) {
  varType = 'scale';  // Stress is always scale
}
else if (controlLower.includes('nutrition') || controlLower.includes('diet')) {
  varType = 'scale';  // Nutrition is scale (uses special input)
}

// Binary only for specific cases:
else if (
  controlLower.includes('medication') || 
  controlLower.includes('alcohol') || 
  controlLower.includes('smoking') || 
  controlLower.includes('headache') ||
  controlLower.includes('fever') ||
  controlLower.includes('nausea') ||
  controlLower.includes('symptom')
) {
  varType = 'binary';  // Yes/No for medications, alcohol, symptoms
}

// Scale for quality/level indicators:
else if (
  controlLower.includes('quality') || 
  controlLower.includes('level') || 
  controlLower.includes('mood') || 
  controlLower.includes('energy')
) {
  varType = 'scale';  // 1-10 rating
}

// Numeric for quantities:
else if (
  controlLower.includes('intake') || 
  controlLower.includes('glasses') || 
  controlLower.includes('hours')
) {
  varType = 'numeric';  // Number input
}

// Default:
else {
  varType = 'scale';  // Most things default to scale
}
```

---

## 2. Special Variable Detection

In `VariableCard.tsx`, the component detects special variable types by analyzing the variable name (lines 56-61):

```typescript
const varNameLower = variable.name.toLowerCase();
const isExercise = varNameLower.includes('exercise') || varNameLower.includes('workout');
const isHydration = varNameLower.includes('hydration') || varNameLower.includes('water');
const isSleep = varNameLower.includes('sleep');
const isNutrition = varNameLower.includes('nutrition') || varNameLower.includes('diet') || varNameLower.includes('meal');
const isStress = varNameLower.includes('stress');
```

**Important**: These flags override the stored `variable.type` in some cases. For example:
- If `isSleep` is true, it shows `SleepInput` component regardless of stored type
- If `isNutrition` is true, it shows `NutritionInput` component regardless of stored type
- If `isStress` is true and stored type is binary, it shows Yes/No buttons that lead to a scale slider

---

## 3. Layout Rendering Logic

The card layout is determined by a cascading conditional structure in `VariableCard.tsx`:

### Chart Display (Lines 287-301)
- **Shown**: Only if `chartData.length > 0` AND NOT hydration, nutrition, or stress
- **Hidden**: For hydration (uses daily total instead), nutrition, and stress variables

### Initial State (`!showInput`) - Lines 303-386

#### Hydration (Lines 343-348)
- Always shows `HydrationInput` component (no "Log Entry" button needed)
- Displays daily total in footer

#### Nutrition (Lines 350-358)
- Always shows `NutritionInput` component (no "Log Entry" button needed)
- Uses meal icons (breakfast, lunch, dinner, snack)

#### Sleep (Lines 360-367)
- Shows "Log Entry" button if `variable.type === 'scale'`
- Opens `SleepInput` component with quality and duration sliders

#### Stress (Lines 369-376)
- If `variable.type === 'scale'`: Shows "Log Entry" button
- If `variable.type === 'binary'`: Shows Yes/No buttons (lines 305-322)
  - "Yes" → Opens scale slider
  - "No" → Logs 0 immediately

#### Exercise (Lines 520-529)
- If `variable.type === 'binary'` AND `isExercise`: Shows `ExerciseInput` component
- Uses sport icons (running, cycling, swimming, etc.)

#### Generic Binary (Lines 324-341, 560-585)
- Shows Yes/No buttons for binary variables
- Excludes: exercise, hydration, nutrition, stress (they have custom inputs)

#### Generic Scale (Lines 532-546)
- Shows 1-10 slider for scale variables
- Excludes: nutrition, stress (they have custom handling)

#### Generic Numeric (Lines 548-558)
- Shows number input field
- Used for variables like "caffeine intake", "hours of sleep"

### Input State (`showInput === true`) - Lines 388-632

When the user clicks "Log Entry" or a special input trigger, the form opens:

#### Sleep Input (Lines 389-407)
- Shows `SleepInput` component (quality + duration sliders)
- Always includes "Tracking Reference" button
- Works for both scale and binary types (if detected as sleep)

#### Stress Input - Binary Type (Lines 408-463)
- If `isStress && variable.type === 'binary'`:
  - Shows 1-10 scale slider
  - Shows note field
  - Shows "Tracking Reference" button

#### Stress Input - Scale Type (Lines 464-519)
- If `isStress && variable.type === 'scale'`:
  - Shows 1-10 scale slider
  - Shows note field
  - Shows "Tracking Reference" button

#### Exercise Input (Lines 520-529)
- Shows `ExerciseInput` component (sport icons + metadata)
- Only for binary exercise variables

#### Generic Input (Lines 530-631)
- **Scale**: Shows 1-10 slider (unless nutrition/stress)
- **Numeric**: Shows number input
- **Binary**: Shows Yes/No toggle buttons (unless exercise/nutrition/stress)
- **Note Field**: Shown for all except nutrition (has its own)
- **Tracking Reference**: Always shown
- **Save/Cancel**: Always shown

---

## 4. Key Rules Summary

### Type Assignment Rules:
1. **Outcome variables**: Always `scale`
2. **Intervention variables**: Always `binary`
3. **Control variables**: Rule-based by name:
   - Sleep → `scale`
   - Stress → `scale`
   - Nutrition → `scale`
   - Medications/Symptoms → `binary`
   - Quality/Level → `scale`
   - Intake/Glasses/Hours → `numeric`
   - Default → `scale`

### Layout Override Rules:
1. **Name-based detection** overrides stored type in some cases:
   - `isSleep` → Always uses `SleepInput` component
   - `isNutrition` → Always uses `NutritionInput` component
   - `isExercise` → Always uses `ExerciseInput` component
   - `isHydration` → Always uses `HydrationInput` component
   - `isStress` → Special handling for binary (Yes → Scale slider)

2. **Chart visibility**:
   - Hidden for: hydration, nutrition, stress
   - Shown for: all other variables with data

3. **Input visibility**:
   - Always visible: hydration, nutrition (no "Log Entry" button)
   - Requires "Log Entry": sleep, stress, exercise, generic variables

---

## 5. Data Flow

1. **Variable Creation** (`app/chat/page.tsx`):
   - User creates hypothesis → variables created with type assigned
   - Types stored in `Variable` object in localStorage

2. **Variable Display** (`app/dashboard/page.tsx`):
   - Variables loaded from storage
   - Deduplicated by name (normalized)
   - Passed to `VariableCard` component

3. **Card Rendering** (`components/dashboard/VariableCard.tsx`):
   - Detects special types by name
   - Renders appropriate layout based on type + name
   - Handles data input and saving

4. **Data Saving**:
   - All save handlers save to all variables with the same name (for deduplication)
   - Data points stored with `variableId` reference

---

## 6. Example Scenarios

### Scenario 1: "Sleep" Variable
- **Type assigned**: `scale` (from control variable rules)
- **Name detection**: `isSleep = true`
- **Layout**: Shows "Log Entry" button → Opens `SleepInput` (quality + duration)
- **Chart**: Hidden

### Scenario 2: "Stress" Variable (Binary)
- **Type assigned**: `binary` (if created as symptom)
- **Name detection**: `isStress = true`
- **Layout**: Shows Yes/No buttons → "Yes" opens scale slider → "No" logs 0
- **Chart**: Hidden

### Scenario 3: "Exercise" Variable
- **Type assigned**: `binary` (intervention variable)
- **Name detection**: `isExercise = true`
- **Layout**: Shows `ExerciseInput` (sport icons + metadata)
- **Chart**: Shown (if has data)

### Scenario 4: "Medication" Variable
- **Type assigned**: `binary` (from control variable rules)
- **Name detection**: None (generic)
- **Layout**: Shows Yes/No buttons (generic binary)
- **Chart**: Shown (if has data)

### Scenario 5: "Caffeine Intake" Variable
- **Type assigned**: `numeric` (from "intake" keyword)
- **Name detection**: None (generic)
- **Layout**: Shows number input field
- **Chart**: Shown (if has data)

---

## 7. Future Considerations

- **Extensibility**: New special variable types can be added by:
  1. Adding name detection logic (lines 56-61)
  2. Creating a custom input component
  3. Adding conditional rendering in the layout logic

- **Type Migration**: Existing variables in storage maintain their stored type, but the UI can override based on name detection. This allows for backward compatibility while improving UX.

- **Deduplication**: Variables are deduplicated by normalized name, so "sleep" and "sleep quality" are treated as the same variable (see `app/dashboard/page.tsx` lines 22-32).

