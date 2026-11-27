# Operator Radar Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the approved Operator Radar concept the visual focus of the search pipeline while preserving its existing workflow and truthful status.

**Architecture:** Extend the existing status component into a persistent radar panel, driven by its current phase prop. Restyle the search page's existing surfaces and controls to match the dark control-room shell, without changing pipeline logic or adding dependencies.

**Tech Stack:** Next.js, React, Tailwind CSS, CSS keyframes, inline SVG.

**Spec:** `docs/superpowers/specs/2026-11-27-operator-radar-search-design.md`

## Global Constraints

- Do not change the search pipeline, collected data, or backend progress events.
- Do not imply a lead count or sub-phase the app does not report.
- Keep the assistant, verification controls, search settings, and automation log usable.
- Use CSS and inline SVG; add no animation dependencies.
- Respect reduced-motion preferences and keep the status accessible.

## Review Focus

- Idle must present a calm standby state; parsing, verification, and running must each show a truthful label.
- Reduced-motion users must not receive a continuously rotating sweep.
- At narrow widths, controls and radar/log must remain readable and usable.
- Decorative radar blips must not read as confirmed lead counts.
- Existing form, verification, assistant, and log content must remain present.

---

### Task 1: Build the operator radar search screen

**Files:**
- Modify: `components/PipelineStatusAnimation.tsx`
- Modify: `components/SearchPage.tsx`
- Modify: `components/SpotlightCard.tsx`
- Modify: `components/PageHeader.tsx`
- Modify: `components/SearchChatbot.tsx`
- Modify: `components/AppShell.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `PipelineVisualPhase` (`idle | parsing | verifying | running`) from `PipelineStatusAnimation.tsx`.
- Produces: the same phase prop and existing search controls/status behavior, presented in a dark radar-led layout.

- [ ] Keep the status panel mounted at idle and render a standby label; map the three active phase values to the existing truthful copy.
- [ ] Build the radar with inline SVG rings/ticks/blips and CSS sweep motion; add a reduced-motion rule that stops the sweep.
- [ ] Integrate the radar into the main search column above the existing automation log; keep assistant, verification, and settings together in the controls column, stacking cleanly on small screens.
- [ ] Restyle the search page shell, header, cards, assistant, form controls, status copy, and log to the approved navy/cyan/magenta palette without changing their behavior or content; keep other routes' light content surface unchanged.
- [ ] Review the resulting source against the Review Focus list and inspect the rendered search page at desktop and narrow viewport widths.

**Completion evidence:** implementation review plus a visual inspection of idle and active-phase states; no automated tests are added or run for this UI change.
