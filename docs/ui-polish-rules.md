# UI Polish Rules

Reference file for frontend work. Read and apply these rules when using the frontend-design skill or building any UI.

Source: Distilled from raphaelsalaja/userinterface-wiki (MIT).

---

## Motion Decision Heuristic

**Ask first: is this motion reacting to the user, or is the system speaking?**

- **User-driven** (drag, flick, press, gesture) → use **springs**. They survive interruption and reflect input energy.
- **System-driven** (state change, notification, guided transition) → use **easing curves**. They communicate clearly with a defined start and end.
- **Representing time** (progress bars, loaders, scrubbing) → use **linear**. Preserves 1:1 relationship between time and progress.
- **High-frequency** (typing, keyboard nav, fast toggles, context menus) → use **no animation**. Motion here feels slow and noisy.

## Timing Scale

| Interaction | Duration |
|-------------|----------|
| Presses, hovers | 120-180ms |
| Small state changes | 180-260ms |
| Larger transitions | up to 300ms |
| Doherty Threshold | 400ms max — beyond this, users notice the wait |

If an animation feels slow, shorten the duration before adjusting the curve. Be consistent — all buttons should animate at the same speed.

## Easing Rules

- **ease-out** for entrances (arrives fast, settles gently — feels snappy)
- **ease-in** for exits (builds momentum, gets out of the way)
- **ease-in-out** for transitions between equally important states
- **NEVER ease-in for entrances** — the initial delay reads as lag

## Spring Parameters

- High stiffness + low damping = snappy but can overshoot
- High damping + low stiffness = stable but sluggish
- Fast drags should feel snappier, slow drags heavier — springs do this naturally

## Animation Anti-Patterns

- Don't animate context menu entry (Apple doesn't — compound irritation on frequent use)
- Don't animate everything — if something doesn't need motion, skip it
- Too much stagger when a panel opens = feels slow. Stagger is for directing attention, not decoration
- Don't animate from 0 on initial render — guard with `bounds > 0` checks
- Too much squash-and-stretch turns professional software into a cartoon

## Container Bounds Pattern

Smooth width/height animation: measure inner div with ResizeObserver, animate outer div. Never measure and animate the same element (creates feedback loop).

```tsx
// Outer div: animated by Motion
// Inner div: measured by useMeasure/ResizeObserver
<motion.div animate={{ height: bounds.height }}>
  <div ref={measureRef}>{children}</div>
</motion.div>
```

Use for: buttons changing labels, accordions, expandable sections, any dynamic content resize.

## Hit Area Expansion (Fitts's Law)

Use `::before` with `position: absolute; inset: -8px` (or similar) to expand clickable area invisibly. Every pixel of padding is a usability decision. The user doesn't see it, but it feels better.

Temporal equivalent: "coyote time" — accept inputs slightly outside the expected window.

## Staging & Attention

When a complex panel opens, stagger elements so the eye has somewhere to go. If everything animates simultaneously, attention scatters. Think of it as directing a film — manipulate attention, don't just show information.

## Sound as a Design Layer

- Auditory cortex processes in ~25ms vs ~250ms for visual. A button with a click *feels* faster.
- Use sound for: confirmations, errors/warnings, state changes, notifications
- Keep it subtle, optional, and complementary (never the only feedback channel)
- Respect `prefers-reduced-motion` as a proxy for reduced audio preference
- Provide an explicit sound toggle in settings

## UX Laws to Apply

- **Doherty Threshold**: Under 400ms = feels instant. If you can't make it fast, make it *feel* fast (optimistic UI, skeletons, progress indicators)
- **Hick's Law**: More choices = slower decisions (logarithmic). Use progressive disclosure — show what matters now, reveal complexity when needed
- **Miller's Law**: Chunk information into groups of 7 +/- 2. Raw data vs chunked data is processed completely differently
- **Postel's Law**: Accept messy input, output clean data. "jan 15 2024" and "2024-01-15" mean the same thing — your interface should understand both

## Pseudo-Element Polish

- `::before` hover effects: absolute-positioned background that scales from 0.95/opacity 0 to 1/opacity 1 on hover. Tactile feel without extra markup.
- View Transitions API (`view-transition-name`) for morphing elements between states — replaces complex JS animation libraries for many cases
