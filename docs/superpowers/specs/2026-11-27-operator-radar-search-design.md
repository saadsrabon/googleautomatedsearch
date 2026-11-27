# Operator Radar Search Design

## Intent

Bring the approved Operator Radar concept into the lead-search screen so a running search feels like part of the existing cyberpunk control room and its current phase is easy to understand.

## Goals

- Replace the small pulse-and-shimmer status banner with a refined radar panel: concentric rings, measured ticks, a slow scan wedge, and a few decorative signal blips.
- Show truthful statuses for the existing idle, parsing, Google verification, and search-running states. Do not imply a lead count or sub-phase the app does not report.
- Give the search page a consistent dark navy surface with restrained cyan and magenta accents, while keeping its assistant, verification controls, settings, and live log usable.
- Keep motion subtle, responsive, and disabled or simplified for reduced-motion preferences; retain an accessible live status label.

## Non-goals

- Changing the search pipeline, collected data, or backend progress events.
- Replacing the assistant, search form, or automation log with mock content.
- Adding animation or visualization dependencies.

## Approaches considered

1. **Keep the existing light banner and add a radar icon.** Smallest change, but it would not deliver the approved screen direction or match the dark shell.
2. **Make the radar the search page's main status panel and align its surrounding surfaces to the dark control-room style.** Keeps the current workflow and data while making the animation the visual focus. **Recommended.**
3. **Rebuild the whole dashboard around a full-screen animated radar.** More dramatic, but it would displace useful controls and logs and exceed this request.

## Design calls

- Palette: deep navy `#07111c`, panel navy `#0b1724`, cyan `#39e6e6`, muted magenta `#db78f2`, and cool slate `#94a9b8`.
- Keep the existing display and mono typefaces. Use mono sparingly for live telemetry; use the display face for headings and readable sans-serif text for controls.
- Preserve the two-column workflow: assistant, verification, and settings remain together; the radar and automation log occupy the main column. On narrow screens, stack them in that order.
- Use CSS and inline SVG for the radar. Make the sweep slow and soft, with only a few decorative blips; do not make them look like counted or confirmed leads.
- Keep the status card visible at idle as a calm standby radar, then change its label and accent according to the real current phase.

## Likely files

- `components/PipelineStatusAnimation.tsx`
- `components/SearchPage.tsx`
- `components/SpotlightCard.tsx` and `components/PageHeader.tsx` for search-page surface alignment
- `components/SearchChatbot.tsx` for the assistant's bubbles and controls
- `components/AppShell.tsx` so only the search route uses a dark content surface
- `app/globals.css` for radar motion and reduced-motion rules

## Open to the implementation

Exact sizing and responsive breakpoints can follow the existing layout. No dependency or backend changes are expected.
