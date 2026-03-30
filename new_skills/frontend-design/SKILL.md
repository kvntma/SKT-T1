---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces for the "Push To Start" orchestration system. Use this skill when building web components, pages, or styling the UI. Focuses on frictionless execution, mobile-first design, and high-fidelity aesthetics that avoid generic AI patterns.
---

# Frontend Design Skill (Push To Start)

This skill guides the creation of distinctive, production-grade frontend interfaces for the **Push To Start** orchestration system. Our goal is to create an "execution layer" that is visually striking, functionally frictionless, and avoids the "AI slop" aesthetic.

## Design Philosophy: "Make Action Cheaper"

Every design choice should serve the core vision: **Removing negotiation between intention and action.**

- **Frictionless**: Interfaces must be immediate. No unnecessary clicks, no cognitive load.
- **Tactical & Functional**: The UI should feel like a high-performance tool, not a generic "productivity app."
- **Bold Intentionality**: Whether it's brutalist minimalism or refined utility, commit to a clear aesthetic direction.
- **Mobile-First**: The primary execution surface is mobile. Design for thumbs and quick glances.

## Technical Stack

Always leverage the project's established stack:
- **Framework**: Next.js (App Router).
- **Styling**: Tailwind CSS v4 (using `@import "tailwindcss"` and `oklch` colors).
- **Components**: Radix UI primitives.
- **Typography**: Geist Sans & Geist Mono (Standard), paired with bold, distinctive display choices for high-impact areas.
- **Animations**: `tw-animate-css` and CSS-only micro-interactions.

## Frontend Aesthetics Guidelines

### 1. Typography & Hierarchy
- **Primary**: Use `var(--font-geist-sans)` for body and `var(--font-geist-mono)` for data/telemetry.
- **Distinctive Accents**: For headings or key execution buttons, choose characterful, high-impact fonts that elevate the design.
- **Hierarchy**: Use extreme scale differences. Large, unavoidable timers vs. tiny, precise metadata.

### 2. Color & Theme (OKLCH)
- **Palette**: Strictly use the `oklch` variables defined in `src/app/globals.css`.
- **Contrast**: High-contrast states for active execution (the `/now` view).
- **Meaningful Color**: Use color for state (Done/Aborted/Continue) but avoid "traffic light" clichés.

### 3. Spatial Composition
- **Mobile Optimized**: Generous touch targets. Bottom-heavy navigation for one-handed use.
- **Density**: High-density for planning/stats, low-density (zero distraction) for execution.
- **Layout**: Experiment with asymmetry or grid-breaking elements to create a "custom tool" feel.

### 4. Backgrounds & Details
- Use subtle textures, noise overlays, or gradient meshes (using `oklch`) to add depth.
- Avoid flat, solid-color defaults. Create atmosphere that matches the "Focus" or "Recovery" state.

## Implementation Standards

- **Component Integrity**: Build atomic, reusable components using Radix primitives.
- **State Feedback**: Every action must have immediate, tactile visual feedback.
- **CSS Variables**: Always use the project's CSS variables for colors and spacing to ensure theme compatibility (Light/Dark mode).
- **Performance**: Prioritize CSS-only solutions for animations. Avoid heavy JS libraries unless strictly necessary for complex interactions.

## Avoid "AI Slop"
- **NO** generic purple/blue gradients on white backgrounds.
- **NO** overused font pairings like Inter/Roboto.
- **NO** predictable, "SaaS-template" layouts.
- **NO** rounded corners on everything by default—be intentional with radius.

**Remember**: You are building an engineering dashboard for a human life. Make it feel powerful, precise, and beautiful.
