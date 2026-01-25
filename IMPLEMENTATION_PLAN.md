# Push To Start - Implementation Plan

> **Vision**: An execution layer that removes negotiation between intention and action.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Styling | Tailwind CSS + ShadCN/ui |
| State | Zustand + React Query |
| Calendar | Google Calendar API |
| Vault | Obsidian (local + sync) |
| Project Tracking | Linear |
| Deployment | Vercel |

---

## Phase 1: Execution Core (MVP Foundation)

**Goal**: Get the core `/now` → `/save` loop working for daily use.

### 1.1 Project Initialization

- [ ] Initialize Next.js 15 with App Router
- [ ] Configure Tailwind CSS
- [ ] Set up Supabase project + environment variables
- [ ] Configure Supabase Auth (email + magic link)
- [ ] Create base layout with mobile-first design

### 1.2 Database Schema (Supabase)

```sql
-- Core entities from PRD Section 7

-- Goals (imported from Obsidian)
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  horizon TEXT CHECK (horizon IN ('year', 'quarter', 'week')),
  source TEXT, -- Obsidian file reference
  priority INTEGER DEFAULT 0,
  linear_issue_id TEXT, -- Optional Linear link
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocks (calendar time blocks)
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('focus', 'admin', 'recovery')) DEFAULT 'focus',
  planned_start TIMESTAMPTZ NOT NULL,
  planned_end TIMESTAMPTZ NOT NULL,
  calendar_id TEXT, -- External calendar event ID
  task_link TEXT,
  stop_condition TEXT, -- Optional exit criteria
  linear_issue_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions (actual execution records)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  block_id UUID REFERENCES blocks(id) ON DELETE SET NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  outcome TEXT CHECK (outcome IN ('done', 'aborted', 'continue')),
  abort_reason TEXT,
  resume_token TEXT, -- "What's the next obvious step?"
  time_to_start INTEGER, -- Seconds between block start and session start
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metrics (aggregated telemetry)
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  avg_time_to_start INTEGER,
  completion_rate DECIMAL(5,2),
  overrun_count INTEGER DEFAULT 0,
  abort_count INTEGER DEFAULT 0,
  total_focus_minutes INTEGER DEFAULT 0,
  best_execution_hour INTEGER, -- 0-23
  UNIQUE(user_id, date)
);

-- RLS policies
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own blocks" ON blocks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sessions" ON sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own metrics" ON daily_metrics FOR ALL USING (auth.uid() = user_id);
```

### 1.3 File Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout + providers
│   ├── page.tsx                # Landing/redirect
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/route.ts
│   ├── (app)/
│   │   ├── layout.tsx          # App shell (authenticated)
│   │   ├── now/page.tsx        # PRIMARY: Execution screen
│   │   ├── save/page.tsx       # Save point (forced after block)
│   │   ├── blocks/page.tsx     # Block management (MVP: manual)
│   │   └── stats/page.tsx      # Friction metrics view
│   └── api/
│       └── [...] 
├── components/
│   ├── execution/
│   │   ├── Timer.tsx           # Large countdown timer
│   │   ├── ActionButtons.tsx   # Start/Done/Stop
│   │   ├── BlockCard.tsx       # Current block display
│   │   └── NoBlockState.tsx    # Empty state
│   ├── save/
│   │   ├── ResumePrompt.tsx    # "Next obvious step?" input
│   │   └── AbortReasonSelect.tsx
│   └── ui/
│       └── [...shared components]
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── middleware.ts       # Auth middleware
│   ├── hooks/
│   │   ├── useCurrentBlock.ts  # Get active block
│   │   ├── useSession.ts       # Session management
│   │   └── useMetrics.ts       # Telemetry hooks
│   └── stores/
│       └── execution-store.ts  # Zustand store for timer state
└── types/
    ├── database.ts             # Supabase generated types
    └── index.ts                # Shared types
```

### 1.4 Core Components

#### `/now` Screen (Primary Execution Interface)

```
┌────────────────────────────────────────────┐
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │  🎯 Deep Work: Auth Module           │  │
│  │  Focus Block • 25 min                │  │
│  └──────────────────────────────────────┘  │
│                                            │
│           ┌─────────────────┐              │
│           │                 │              │
│           │     24:32       │              │
│           │                 │              │
│           └─────────────────┘              │
│                                            │
│  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │ START  │  │  DONE  │  │  STOP  │       │
│  └────────┘  └────────┘  └────────┘       │
│                                            │
│  Stop condition: "Complete skeleton"       │
│                                            │
└────────────────────────────────────────────┘
```

#### `/save` Screen (Forced After Block)

```
┌────────────────────────────────────────────┐
│                                            │
│  Completed: Deep Work: Auth Module         │
│  Duration: 25:00 (on time ✓)               │
│                                            │
│  ────────────────────────────────────────  │
│                                            │
│  What's the next obvious step?             │
│  ┌──────────────────────────────────────┐  │
│  │ Wire submit handler to auth API      │  │
│  │                                      │  │
│  └──────────────────────────────────────┘  │
│                                            │
│           ┌─────────────────┐              │
│           │  SAVE & RETURN  │              │
│           └─────────────────┘              │
│                                            │
└────────────────────────────────────────────┘
```

---

## Phase 2: Calendar Integration

**Goal**: Sync blocks from Google Calendar → app.

### 2.1 Google Calendar Setup

- [ ] Create Google Cloud project
- [ ] Enable Calendar API
- [ ] Configure OAuth consent screen
- [ ] Set up OAuth credentials
- [ ] Implement OAuth flow in Next.js

### 2.2 Calendar Sync

```
src/lib/
├── calendar/
│   ├── google.ts           # Google Calendar API wrapper
│   ├── sync.ts             # Bi-directional sync logic
│   └── parser.ts           # Parse block metadata from events
```

#### Block Metadata (Calendar Event Description)

```yaml
# Stored in event description
type: focus
goal: auth-module
stop_condition: Complete login skeleton
linear: PTS-42
```

### 2.3 Features

- [ ] OAuth + token refresh
- [ ] Pull events → create/update blocks
- [ ] Parse block metadata from event description
- [ ] Real-time sync via webhooks (or polling for MVP)

---

## Phase 3: Obsidian Integration

**Goal**: Extract goals and intent from Obsidian vault.

### 3.1 Ingestion Strategy

| Method | Pros | Cons |
|--------|------|------|
| Local folder | No auth needed | Desktop only |
| Obsidian Sync folder | Cross-device | Folder structure varies |
| Git sync | Version controlled | Setup complexity |

### 3.2 Parser Implementation

```
src/lib/
├── obsidian/
│   ├── parser.ts           # Markdown + frontmatter parsing
│   ├── extractor.ts        # Extract goals, routines, constraints
│   └── watcher.ts          # File system watcher (optional)
```

#### Expected Frontmatter

```yaml
---
type: goal
horizon: quarter
priority: 1
tags: [career, build]
---

# Ship Push To Start MVP

Success criteria:
- Daily usage for 14+ days
- TTS decreases week-over-week
```

### 3.3 Features

- [ ] File picker for vault location
- [ ] Parse markdown + frontmatter
- [ ] Extract: goals, weekly focus, routines, constraints
- [ ] Map to internal Goal model
- [ ] Manual sync trigger (no auto-watch in MVP)

---

## Phase 4: AI Planning Engine

**Goal**: Convert intent into actionable, realistic plans.

### 4.1 Capabilities

- [ ] Generate weekly focus (3-5 priorities)
- [ ] Suggest daily themes (build/admin/recover)
- [ ] Create task pools from goals
- [ ] Scope adjustment based on historical execution

### 4.2 Implementation

```
src/lib/
├── ai/
│   ├── planner.ts          # Core planning logic
│   ├── prompts.ts          # System prompts
│   └── context.ts          # Build context from goals + metrics
```

#### Planning Prompt Structure

```
Context:
- Identity: {from Obsidian}
- Weekly capacity: {from metrics}
- Active goals: {from goals table}
- Recent execution: {completion rate, TTS}

Task: Generate weekly focus (3-5 items)

Constraints:
- Concrete, not aspirational
- Time-aware (total available hours)
- Bounded scope
- NO motivational language
```

### 4.3 User Approval Flow

```
/plan/weekly
┌────────────────────────────────────────────┐
│  Weekly Focus (Jan 24 - Jan 30)            │
│                                            │
│  AI Suggested:                             │
│  ☑ Ship auth flow MVP                      │
│  ☑ Set up calendar sync                    │
│  ☐ Design stats dashboard                  │
│  ☑ Morning deep work routine (5 days)      │
│                                            │
│  [Approve Selected]    [Regenerate]        │
└────────────────────────────────────────────┘
```

---

## Phase 5: Telemetry & Linear Integration

**Goal**: Track friction metrics and create feedback loop.

### 5.1 Tracked Metrics (PRD Section 6.5)

| Metric | Calculation |
|--------|-------------|
| Time-to-Start (TTS) | `session.actual_start - block.planned_start` |
| Completion Rate | `done / total` (rolling 7 days) |
| Overrun Rate | `sessions where actual_end > planned_end` |
| Best Execution Hour | Mode of high-completion hours |

### 5.2 Linear Integration (PRD Sections 12-22)

#### What Gets a Linear Ticket

| Type | Example | Creates Ticket |
|------|---------|----------------|
| Goal-level work | "Ship v1 execution app" | ✓ |
| Learning tracks | "Learn React Native" | ✓ |
| System improvements | "Reduce TTS in mornings" | ✓ |
| Daily tasks | "Fix login bug" | ✗ |
| Routines | "Gym", "Walk" | ✗ |

#### Automation Triggers

```typescript
// Auto-create Linear issues when:
if (metrics.overrunRate > 0.4) {
  createLinearIssue({
    title: "Fix overrun rate (currently 40%)",
    labels: ["system"]
  });
}

if (metrics.ttsChange > 60) { // 1 min increase week-over-week
  createLinearIssue({
    title: "TTS increased - investigate morning routine",
    labels: ["system"]
  });
}
```

#### Session → Linear Updates

On session completion:
1. Check if block has `linear_issue_id`
2. Post progress comment
3. Decrement estimate (if applicable)
4. Update status on milestone

```typescript
// Auto-generated Linear comment
postLinearComment(issueId, `
Focus session completed (25m).
Progress: implemented auth UI skeleton.
Next: ${session.resumeToken}
`);
```

---

## MVP Milestones

| Milestone | Target | Key Deliverable |
|-----------|--------|-----------------|
| M1: Core Loop | Week 1 | `/now` + `/save` working |
| M2: Persistence | Week 1 | Supabase + Auth |
| M3: Manual Blocks | Week 2 | Create/edit blocks UI |
| M4: Calendar Sync | Week 3 | Google Calendar → Blocks |
| M5: Stats | Week 3 | TTS + completion rate |
| M6: Obsidian | Week 4 | Goal ingestion |
| M7: AI Planning | Week 5 | Weekly focus generation |
| M8: Linear | Week 6 | Burndown + auto-comments |

---

## Success Criteria (from PRD)

The product is successful if:

- [ ] Daily usage for 14+ days
- [ ] Time-to-start decreases week-over-week
- [ ] Hyperfocus overruns reduce
- [ ] Weekly reviews result in concrete system changes
- [ ] User reports less internal negotiation

---

## Design Principles (Non-Negotiable)

1. **Friction elimination > motivation**
2. **Binary outcomes > subjective ratings**
3. **Planning is upstream, execution is interruption-free**
4. **Stats guide system changes, not self-worth**
5. **The system adapts; the user executes**
6. **If a feature needs explanation, it doesn't belong in v1**

---

*This app does not make the user better. It makes action cheaper.*
