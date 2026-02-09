Product Requirements Document (PRD)

Product Name (working): Push To Start (.gg)
Owner: Myles
Stage: Personal MVP → Iterative System
Primary Platform: Web (Next.js, mobile-first)
Primary User: Single power user (ADHD, builder, knowledge worker)

1. Product Vision
Vision Statement

Build a personal life orchestration system that translates long-term identity and goals into daily execution with minimal friction, using existing tools (Obsidian, calendar, Linear) and an execution-focused mobile interface.

The product is not a productivity app.
It is an execution layer that removes negotiation between intention and action.

2. Core Problem

The user:

Has a rich “second brain” (Obsidian)

Understands long-term goals and identity

Still loses momentum due to:

unclear daily priorities

excessive decision-making

poor task scoping

hyperfocus overruns

lack of feedback grounded in reality

Existing tools:

Optimize planning or tracking

Fail at execution under constraints

3. Product Principles (Non-Negotiable)

Friction elimination > motivation

Binary outcomes > subjective ratings

Planning is upstream, execution is interruption-free

Stats guide system changes, not self-worth

The system adapts; the user executes

If a feature needs explanation, it doesn’t belong in v1

4. Target User (MVP)

ADHD or ADHD-adjacent

Knowledge worker / builder

Already uses Obsidian as a second brain

Already blocks time on a calendar

Wants to execute, not optimize endlessly

Values autonomy and system clarity over social validation

5. High-Level Architecture

Source of Truth by Layer

Layer	Tool	Responsibility
Identity & Vision	Obsidian (read-only)	Who the user is becoming
Planning & Interpretation	App	Translate vision → intent
Time	Calendar (via FlowSavvy)	When things happen
Execution	Mobile-first app	What happens now
Learning Loop	Linear	Improve the system itself
6. Feature Set (Phased)
Phase 1 — Vision & Intent Ingestion (Foundational)
6.1 Obsidian / Notion Integration (Read-Only MVP)

Goal: Extract structured intent from the user’s existing second brain.

Requirements

Support Obsidian vault parsing (local or synced folder)

Optional Notion support (future parity, not required day one)

Read-only ingestion (no writes in MVP)

Supported Concepts

Identity / values

Long-term goals (year / quarter)

Weekly focus

Routines / habits

Constraints (work hours, sleep, limits)

Input Format (Obsidian)

Markdown files

Frontmatter for metadata

Headings + bullet lists for structure

Output

Normalized internal model:

Goals

Time horizons

Themes

Routines

Phase 2 — AI Planning Engine (Interpretation Layer)
6.2 AI Planning Engine

Goal: Convert intent into actionable, realistic plans.

Capabilities

Propose weekly focus (3–5 priorities)

Suggest daily themes (build / admin / recover)

Translate goals into task pools, not schedules

Adjust scope based on historical execution data

Constraints

AI never executes or schedules autonomously

User approval required for weekly plan

AI output must be:

concrete

time-aware

bounded

Explicit Non-Goals

No motivational language

No identity judgment

No “life advice”

Phase 3 — Calendar Orchestration (Reality Layer)
6.3 Calendar Integration (FlowSavvy-Compatible)

Goal: Make time real and unavoidable.

Strategy

Treat Google / Outlook Calendar as the integration surface

FlowSavvy remains the calendar aggregator/scheduler

The app writes blocks → FlowSavvy adapts around events

Block Types

Focus (25–50m)

Admin (15–30m)

Recovery (5–10m)

Block Metadata

Theme

Task link (internal or Linear)

Stop condition (optional)

Priority

Rules

Calendar is the authority on when

App is the authority on what

Phase 4 — Execution App (Core MVP)
6.4 Mobile-First Execution Interface

Goal: Remove all friction at execution time.

Primary Screen: /now

Shows current calendar block

Large timer

Buttons:

Start

Done

Stop

Save Point Screen: /save (forced)

One prompt: “What’s the next obvious step?”

Optional abort reason

Save → return to /now

Rules

No task editing mid-block

No reflection during execution

Binary outcomes only

Phase 5 — Telemetry & Learning Loop
6.5 Stat Tracking (Friction Metrics Only)

Tracked Metrics

Time-to-start (TTS)

Completion rate (recent only)

Overrun rate

Abort reasons

Best time-of-day execution window

Explicitly Excluded

Total hours

Lifetime streaks

Productivity scores

Mood tracking

6.6 Linear Integration (System Improvement)

Purpose: Track improvements to the system, not daily tasks.

Examples of Linear Issues

“Reduce TTS for morning deep work”

“Fix debugging overrun via stop conditions”

“Improve weekly planning template”

Automation (Future)

Create issues when metrics cross thresholds

Update issue status as metrics improve

7. Data Model (MVP)
Core Entities

Goal

id

title

horizon (year / quarter / week)

source (Obsidian)

priority

Block

id

title

plannedStart

plannedEnd

calendarId

taskLink

Session

id

blockId

actualStart

actualEnd

outcome (done / aborted / continue)

abortReason

resumeToken

8. Non-Goals (Explicit)

No social features

No leaderboards

No habit streak gamification

No public sharing

No App Store distribution (initially)

No full Obsidian write-back in MVP

9. Success Criteria (MVP)

The product is successful if:

The user uses it daily for 14+ days

Time-to-start decreases week-over-week

Hyperfocus overruns reduce

Weekly reviews result in concrete system changes

The user reports less internal negotiation

10. Design Ethos

This app does not make the user better.
It makes action cheaper.

It does not motivate.
It removes friction.

11. Future Extensions (Post-MVP)

Two-way Obsidian sync (append-only)

Native mobile app

Predictive scheduling

Task slicing via LLM

Multi-user support (far future)

Distraction blocking (OS-level)

Phase 6 — Dynamic Scheduling & Orchestration (Refactor)
6.7 Draggable Time-Grid

Goal: Allow manual re-prioritization via direct manipulation.

Requirements:
- Blocks are draggable on the calendar/list view.
- Dragging a block updates its planned_start and planned_end.
- Supports both Manual and "Push To Start" (PTS) synced blocks.
- Google Calendar "anchor" events remain fixed or provide visual collision warnings.

6.8 AI Schedule Refactor ("Magic Button")

Goal: Dynamically re-align the day based on actual progress and changing priorities.

Capabilities:
- Analyze current day's execution (skipped blocks, missed starts, overruns).
- Propose a new schedule for the remaining PTS blocks.
- Respect fixed Google Calendar events as unmovable anchors.
- Provide a "Review & Commit" flow before applying changes to the DB.

Rules:
- AI only moves blocks within the PTS ecosystem.
- Refactoring is user-triggered (button click).
- AI accounts for "Recovery" needs and "Focus" durations based on PRD principles.

PRD Extension — Linear Integration & Burndown Tracking
12. Purpose of Linear Integration

Linear is not used to manage daily life tasks.

Linear is used to:

track progressive execution against goals

visualize burndown over time

manage system-level improvements

create a feedback loop between intention → execution → learning

Linear acts as the engineering dashboard for your life system, not the to-do list.

13. What Gets a Linear Ticket (Critical Constraint)

To avoid chaos, only three things can become Linear issues:

A. Goal-Level Work

Weekly or multi-week goals derived from Obsidian vision

Example:

“Ship v1 execution app”

“Establish consistent morning deep work routine”

These are not atomic tasks—they are containers for progress.

B. Learning / Skill Tracks

Anything with a measurable progression curve

Example:

“Learn React Native fundamentals”

“Improve debugging efficiency”

These benefit from burndown visualization.

C. System Improvements

Fixes to the process itself

Example:

“Reduce Time-to-Start in mornings”

“Prevent overrun in research tasks”

This is where the app becomes a life coach instead of a tracker.

14. What Does NOT Become a Linear Ticket

Explicitly excluded:

Daily tasks

Calendar blocks

Execution sessions

Routines (“gym”, “walk”, etc.)

Those live in the calendar + execution app only.

Rule of thumb:

If it can be done in a single focus block, it does not belong in Linear.

15. Linear Data Model (Mapped to Your System)
Linear Issue Fields

Title

Clear, outcome-based

Example:
“Ship MVP execution loop (Now → Save → Review)”

Description

Linked Obsidian source (goal or note)

Success criteria

Constraints (timebox, scope limits)

Labels

goal

learning

system

Optional domain tags (health, career, build)

Estimate

Represents total effort horizon, not hours

Use Linear’s point system as “capacity units”

16. How Burndown Is Calculated (Important)

Burndown is not driven by time logged.

It is driven by execution events from your app.

Burndown Inputs

Each execution session can:

decrement remaining estimate

or mark sub-milestones complete

Examples:

Completing a focus block linked to a Linear issue reduces remaining points

Reaching a defined milestone triggers a status update

This keeps burndown tied to reality, not planning optimism.

17. Linking Execution to Linear (Mechanics)
Linking Strategy

Linear issue ID is stored in:

calendar block metadata

or execution session metadata

On Session Completion

Your app:

Logs execution data

Checks if session is linked to a Linear issue

Applies one of:

decrement estimate

add progress comment

update status (if milestone met)

Example Linear comment (auto-generated):

“Focus session completed (25m).
Progress: implemented auth UI skeleton.
Next: wire submit handler.”

18. Automated Learning Loop (This Is the Cracked Part)
Metric-Triggered Linear Issues

Your app may automatically create or update Linear issues when:

Overrun rate > threshold

TTS worsens week-over-week

Abort reason spikes

Energy curve shifts

Example:

Auto-create issue:
“Fix afternoon execution drop-off”

This turns metrics into actionable engineering work.

19. Burndown Visualization Use Case

You use Linear burndown to answer:

“Am I making progress on this goal?”

“Is my execution sustainable?”

“Is the system improving?”

You do not use it to:

judge productivity

compare days

induce guilt

Burndown is diagnostic, not evaluative.

20. Sync Direction & Ownership

Direction of truth:

System	Owns
Obsidian	Meaning, identity, intent
Calendar	Time reality
Execution App	Actual behavior
Linear	Progress & learning

Linear never dictates daily actions.
It reflects accumulated execution.

21. MVP Scope for Linear Integration
Phase 1 (Manual Linking)

Manually associate Linear issue ID with a goal or block

App posts comments only

Phase 2 (Semi-Automated)

Auto-decrement estimates

Status transitions on milestones

Phase 3 (Fully Automated)

Metric-triggered issue creation

Weekly summary posted to Linear

22. Success Criteria for Linear Integration

This feature is successful if:

Burndown reflects felt progress accurately

You can tell when you’re stuck vs progressing

System-level issues are surfaced automatically

Linear stays small, clean, and high-signal

Failure mode to avoid:

Linear becomes another task dump

Burndown becomes performative

Issues outnumber actual goals

23. Design Ethos (Extended)

Linear is not for doing work.
It is for understanding work.

Calendar is for action.
Execution app is for truth.
Linear is for learning.