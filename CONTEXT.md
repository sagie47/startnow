# Backchain

## Overview

Backchain is a planner/time-block calendar with an integrated AI coach that turns vague goals into realistic plans based on the user's real constraints (time, energy, money, location, experience).

**Core loop**: Goal → Constraint fit → Skill map → Weekly sprints → Daily blocks → Proof of work → Replan → Debrief

## Tech Stack

- **Framework**: React Native + Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React hooks + AsyncStorage
- **Animations**: react-native-reanimated
- **Gestures**: react-native-gesture-handler
- **Icons**: @expo/vector-icons
- **Language**: TypeScript

## File Structure

```
rocket/
├── app/
│   ├── _layout.tsx                    # Root navigation with GestureHandlerRootView
│   ├── (tabs)/
│   │   ├── _layout.tsx              # Bottom tab navigation (5 tabs)
│   │   ├── today.tsx                # Timeline + drag/drop + drift detection
│   │   ├── sprints.tsx              # Weekly sprints (placeholder)
│   │   ├── map.tsx                  # Skill map (placeholder)
│   │   ├── coach.tsx                # AI assistant (placeholder)
│   │   └── profile.tsx              # Settings + constraints display
│   └── (modals)/
│       ├── add-block.tsx            # Create/edit block with priority/fallback
│       ├── proof.tsx                 # Capture proof of work
│       ├── constraints.tsx           # Configure time/money constraints
│       ├── goal-optimizer.tsx        # Analyze goals, generate variants
│       ├── debrief.tsx              # End-of-day review
│       └── replan.tsx               # Drift recovery + reflow algorithm
├── components/
│   ├── haptic-tab.tsx
│   ├── hello-wave.tsx
│   ├── themed-view.tsx
│   ├── themed-text.tsx
│   ├── ui/
│   │   ├── collapsible.tsx
│   │   └── icon-symbol.tsx
│   ├── parallax-scroll-view.tsx
│   └── external-link.tsx
├── hooks/
│   ├── use-blocks.ts               # Block CRUD + persistence
│   ├── use-constraints.ts           # Constraint CRUD
│   ├── use-settings.ts              # Settings CRUD
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
├── utils/
│   ├── storage.ts                   # AsyncStorage + models + algorithms
│   └── replan.ts                   # Replan algorithms (3 modes)
├── constants/
│   └── theme.ts
└── assets/
    ├── images/
    └── fonts/
```

## Features Built

### Phase 1: Planner Skeleton ✅

**Today Screen**
- Brutalist timeline with draggable blocks
- 4 block types: Deep, Admin, Health, Learning
- Type-based color coding
- Fixed vs flexible blocks
- Block completion tracking
- Stats: streak counter + planned/done
- Empty state
- FAB (+) to add blocks

**Block Management**
- Create block with: title, type, duration, priority, fallback minutes, protected flag
- Edit block (long press)
- Delete block (edit mode only)
- Drag to reorder (uses reanimated + gesture-handler)
- Instant replay after drag

**Proof Capture**
- Block preview in modal
- Link input (optional)
- Note textarea (optional)
- Checkbox rubric: "I completed planned outcome" (required)
- Skip or Submit options
- Marks block as complete

**Persistence**
- AsyncStorage for blocks, proofs, settings, constraints
- Debounced save (500ms)
- Schema versioning (v1)
- Migration system ready
- Data survives app reload

### Phase 2: Constraints Engine ✅

**Constraint Model**
```typescript
{
  sleepFloor: number;              // Min hours/night (e.g., 7)
  workHoursPerDay: number;         // Hours (e.g., 8)
  workDaysPerWeek: number;         // Days 1-7
  commuteMinutesPerDay: number;    // Minutes (e.g., 30)
  weeklyGoalHours: number;         // Target hours/week
  monthlyBudget: number;           // Dollars
}
```

**Calculations**
- `calculateAvailableHours()`: 168 - sleep - work - commute - 10h buffer
- `calculateFeasibility()`: Returns green/yellow/red with message
- `generatePlanVariants()`: MVG (30%), Standard (60%), Aggressive (90%)

**Constraints Modal**
- Sliders for: sleep floor, work hours, commute, weekly goal, budget
- Work days selector (1-7 buttons)
- Real-time available hours display
- Stoplight feedback on goal vs available

**Goal Optimizer Modal**
- Text input for goal
- 3 plan variants displayed
- Each variant shows: hours, description, feasibility dot
- Uses constraint data for math

**Profile Screen**
- Link to Constraints modal
- Time budget summary card
- Settings display (timezone, week start)

### Phase 3: Replan (Magic Moment) ✅

**Block Model Extensions**
```typescript
{
  priority: 1 | 2 | 3;           // 1 = highest
  fallbackMinutes?: number;        // Min duration when blocked
  protected?: boolean;            // Don't skip in replan
}
```

**Replan Window Logic**
- Now = current time rounded to nearest 15 min
- Replan only blocks starting >= now
- Never move fixed blocks
- Keep already-started blocks as-is

**Reflow Algorithm**
1. Generate open slots (subtract fixed + buffer)
2. Sort flexible blocks by: priority desc, then start time, then duration
3. For each block:
   - Try Move: place in earliest slot that fits
   - If no slot: try Shrink (use fallbackMinutes or 60%)
   - If still no fit: mark Skip
   - Protected blocks can shrink but not skip

**3 Replan Modes**
1. **Keep Priorities** (default): Standard reflow
2. **Salvage Streak**: More shrinking, fewer skips
3. **Hard Reset**: Clear everything except fixed + protected

**Replan Modal**
- Status line: "You're X min behind"
- Mode selector (3 cards)
- Preview: moved/shrunk/skipped counts
- Action list per block
- Apply Plan button
- Cancel option

**Drift Detection**
- Checks every 60 seconds
- Detects blocks 10+ minutes behind schedule
- Shows modal: Skip / Shrink / Replan options
- "Continue as-is" to dismiss

**Add Block Modal Updates**
- Priority selector (1/2/3 buttons)
- Fallback minutes input (optional)
- Protected toggle ("don't skip in replan")

## Design System

**Brutalist Scandinavian Futurism**

- **Colors**: Off-white / near-black base, one accent (electric but restrained)
- **Typography**: Geometric sans for headings, monospace/narrow grotesk for data
- **Shapes**: Rectangles, grid, heavy dividers, hard corners (no border-radius)
- **Style**: "Industrial" UI, engineered not cute, clean hierarchy

**Components**
- "Brutal cards": Thick stroke, no shadows
- Toggle pills: Hard corners
- Progress: Bars not circles
- Haptics: On commit actions (plan, replan, complete)

**Color Palette**
```
Background: #FFFFFF
Text: #000000
Border: #000000 (2px)
Status Green: #4CAF50
Status Yellow: #FFA000
Status Red: #FF5252
Type Deep: #FF6B6B
Type Admin: #4ECDC4
Type Health: #45B7D1
Type Learning: #FFA07A
```

**Type Colors**
- Deep: Red (#FF6B6B)
- Admin: Teal (#4ECDC4)
- Health: Blue (#45B7D1)
- Learning: Orange (#FFA07A)

## Navigation

**Bottom Tabs (5)**
1. **Today**: Timeline + stats + REPLAN button
2. **Sprints**: Week view
3. **Map**: Skill graph
4. **Coach**: AI assistant
5. **Profile**: Constraints + settings

**Modals**
- Add Block
- Proof
- Constraints
- Goal Optimizer
- Debrief
- Replan

## Data Models

**Block**
```typescript
{
  id: string;
  title: string;
  type: 'Deep' | 'Admin' | 'Health' | 'Learning';
  startTime: string;        // "HH:MM"
  duration: number;          // minutes
  fixed: boolean;
  completed: boolean;
  priority: 1 | 2 | 3;
  fallbackMinutes?: number;
  protected?: boolean;
}
```

**Proof**
```typescript
{
  id: string;
  blockId: string;
  link?: string;
  note?: string;
  timestamp: number;
}
```

**Constraints**
```typescript
{
  sleepFloor: number;
  workHoursPerDay: number;
  workDaysPerWeek: number;
  commuteMinutesPerDay: number;
  weeklyGoalHours: number;
  monthlyBudget: number;
}
```

**Settings**
```typescript
{
  timezone: string;
  weekStart: 'sunday' | 'monday';
  schemaVersion: string;
}
```

**Feasibility Status**
```typescript
'green'  // Plan fits comfortably
'yellow'  // Tight execution required
'red'     // Exceeds available time
```

**Replan Actions**
```typescript
'moved'   // Block rescheduled
'shrunk'  // Duration reduced
'skipped'  // Dropped from plan
'unchanged' // Same time
'protected' // Protected from skip
```

## Hooks

**useBlocks()**
```typescript
{
  blocks: Block[];
  proofs: Proof[];
  loading: boolean;
  updateBlocks: (update) => void;
  addBlock: (block) => void;
  updateBlock: (id, updates) => void;
  deleteBlock: (id) => void;
  addProof: (proof) => void;
  getProofForBlock: (id) => Proof | undefined;
  stats: { planned: number; done: number };
}
```

**useConstraints()**
```typescript
{
  constraints: Constraints;
  loading: boolean;
  updateConstraints: (update) => void;
}
```

**useSettings()**
```typescript
{
  settings: UserSettings;
  loading: boolean;
  updateSettings: (update) => void;
}
```

## Utilities

**Storage** (`utils/storage.ts`)
- `loadBlocks()` / `saveBlocks()`
- `loadProofs()` / `saveProofs()`
- `loadConstraints()` / `saveConstraints()`
- `loadSettings()` / `saveSettings()`
- `calculateAvailableHours()`
- `calculateFeasibility()`
- `generatePlanVariants()`
- `clearAll()`

**Replan** (`utils/replan.ts`)
- `generateReplan()` - Keep priorities mode
- `generateSalvageStreakReplan()` - More shrinking
- `generateHardResetReplan()` - Clear everything
- `checkForDrift()` - Returns block ID if >10min behind

## Running the Project

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web

# Lint
npm run lint
```

## Completed Features

✅ Navigation structure (5 tabs + 6 modals)
✅ Today screen with brutalist timeline
✅ Block CRUD (create, edit, delete)
✅ Drag to reorder blocks
✅ Proof capture modal
✅ Persistence (AsyncStorage with debouncing)
✅ Stats display (streak, planned/done)
✅ Constraints modal (time + budget)
✅ Goal optimizer (feasibility stoplight)
✅ Profile screen with constraints summary
✅ Replan algorithm (3 modes)
✅ Replan modal (preview + apply)
✅ Drift detection (every 60s)
✅ Drift action modal (skip/shrink/replan)
✅ Block priority selector
✅ Block fallback minutes
✅ Block protected flag

## Future Roadmap

**Phase 4: Tutor/Coach Layer**
- Goal → skill map conversion
- Weekly sprint generation
- Daily block templates
- Debrief → tomorrow rule

**Phase 5: Enhanced Features**
- Sprint screen implementation
- Skill map graph UI
- Coach chat interface
- Template library
- Multi-goal balancing
- Analytics dashboard (time realism, streaks)

**Phase 6: Polish**
- Animations for all transitions
- Haptic feedback refinement
- Accessibility improvements
- Offline support
- Sync across devices
- Export/import plans

## Design Principles

1. **Constraint-first**: Hard constraints are immovable
2. **Show the math**: Time/budget tradeoffs are explicit
3. **No hype**: Coach is calm, direct, non-flattering
4. **Artifacts > intentions**: Proof-of-work drives progress
5. **Plans survive chaos**: Replanning is central, not a feature

## Non-Goals

- No "get rich" leaderboard economy
- No open-ended social feed
- No medical diagnosis or clinical health advice
- No "manifestation"/hype coaching tone

## MVP Milestone

User enters constraints + a goal → App produces a "realistic week" → Today shows time blocks → User completes blocks with proof → App replans when they slip → Debrief sets tomorrow rule

---

**Built with**: React Native + Expo Router
**Design**: Scandinavian Futurist Brutalism
**Philosophy**: Show the math, say no when impossible, survive chaos
