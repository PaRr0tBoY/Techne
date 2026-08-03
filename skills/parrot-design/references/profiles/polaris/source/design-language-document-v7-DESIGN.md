# Design Language Document · v7

> Style codename: **Technical Editorial Minimalism + Tactile Motion**. Quiet structure, paper-like material, dispersed accents rather than concentrated decoration, invisible editing, and restrained but lively motion.

**Theme:** dark

## Tokens – Colors

| Name | Value | Token | Role |
|---|---|---|---|
| Background | `#20211f` | `--bg` | Global page background in dark mode |
| Surface | `#282925` | `--surface` | Opaque matte paper-card surface for floating navigation, menus, cards, and mobile menu panels |
| Surface 2 | `rgba(255,255,255,.035)` | `--surface-2` | Subtle raised surface for cards and media slots |
| Ink | `#e8e6de` | `--ink` | Primary text color in dark mode |
| Muted | `#aaa79e` | `--muted` | Secondary text and labels |
| Faint | `#77756e` | `--faint` | Tertiary text, placeholders, and tags |
| Line | `rgba(232,230,222,.14)` | `--line` | Default border and divider color |
| Line Strong | `rgba(232,230,222,.24)` | `--line-strong` | Stronger border for hover and emphasis |
| Grid | `rgba(232,230,222,.10)` | `--grid` | Background dot-matrix grid color |
| Accent | `#6aa99f` | `--accent` | Theme-color linework for Hero background curves and primary actions |
| Accent Soft | `rgba(106,169,159,.15)` | `--accent-soft` | Subtle accent tint for hover states and fills |
| Accent Ink | `#17201e` | `--accent-ink` | Text color on accent backgrounds |
| Shadow | `rgba(0,0,0,.18)` | `--shadow` | Restrained shadow for floating elements |

- Use off-black and off-white; neither mode uses pure `#000` or `#FFF`.
- Warm gray is the confirmed neutral foundation; do not shift it toward a cooler or more industrial tone.
- Theme palettes: Graphite, Cobalt, **Verdigris** (default), Amber, and Violet. Each must support both light and dark states.
- The default combination is Verdigris with dark mode.

## Tokens – Typography

### IBM Plex Sans — --font-sans
- **Substitute:** JetBrains Mono NF, a more engineering-oriented alternative
- **Weights:** 400, 500, 600, 700
- **Role:** English body copy and UI

### IBM Plex Mono — --font-mono
- **Substitute:** Not specified
- **Weights:** 400, 500, 600
- **Role:** Monospace text, code, and labels

### IBM Plex Sans SC — --font-sans-sc
- **Substitute:** Not specified
- **Weights:** 400, 500, 600, 700; avoid Light weights, which create a visually weak or “thin” impression
- **Role:** Chinese text

| Role | Size | Line Height | Letter Spacing | Token |
|---|---|---|---|---|
| Display / H1 | `clamp(38px, 4.6vw, 60px)` | `1.03` | `-0.05em` | `--type-display` |
| Lead / Body | `16px` | `1.8` | `0` | `--type-lead` |
| Body / Card | `13px` | `1.75` | `0` | `--type-body` |
| Card Title | `15px` | `1.2` | `0` | `--type-card-title` |
| UI / Small | `12px` | `1.4` | `0` | `--type-ui` |
| Label / Mono | `11px` | `1.4` | `0.02em` | `--type-label` |
| Eyebrow / Mono | `12px` | `1.4` | `0.08em` | `--type-eyebrow` |

## Tokens – Spacing & Shapes

### Spacing Scale

| Name | Value | Token |
|---|---|---|
| Background dot interval | `19px` | `--spacing-dot-grid` |
| Fold navigation safety spacing | `72px` | `--spacing-nav-safe` |
| Hero vertical padding | `12px` | `--spacing-hero-block` |
| Card padding | `22px` | `--spacing-card-padding` |
| Section gap | `76px` | `--spacing-section` |
| Bento gap | `12px` | `--spacing-bento-gap` |

### Border Radius

| Name | Value | Token |
|---|---|---|
| Unified floating-card radius | `14px` | `--radius-card` |
| Small control radius | `8px` | `--radius-small` |
| Pill radius | `999px` | `--radius-pill` |

### Shadows

| Name | Value | Token |
|---|---|---|
| Floating-card shadow | `0 4px 14px var(--shadow)` | `--shadow-card` |
| Dropdown shadow | `0 14px 35px var(--shadow)` | `--shadow-dropdown` |
| Mobile panel shadow | `0 16px 40px var(--shadow)` | `--shadow-panel` |

- **Density:** Fine dot matrix at approximately `0.85px` dots with low contrast; extremely light SVG turbulence noise at `opacity 0.035`.
- The confirmed paper texture values must not be changed.
- Floating elements use a solid `var(--surface)`, a `1px` border, a unified radius token, and a restrained shadow. They are opaque and unblurred.

## Components

### Editable Container Control
**Role:** Low-chrome editing control

The container itself is the control. Do not nest another input, border, or background layer inside a container. This rule extends beyond text inputs: any component—code blocks, media slots, data panels—must not be wrapped in an additional card or surface container when it already sits inside a card. A code block inside a card should render directly as the code block, not as a card within a card.

Editing must not alter geometry. Use `contenteditable`, not `<input>`. This is the key conclusion of this revision: `<input>` inherently introduces two problems—its width is fixed and does not match the actual text length, causing the container to jump before and after editing; and default styles easily introduce borders or highlights. `contenteditable` gives the same element editing capability in place. Before and after editing, container size, background color, and font size remain identical; only the caret and selection become visible.

Tab renaming and the navigation site title use this implementation. They support double-click editing as well as keyboard entry after focus with `Enter` or `F2`.

Affordance is implicit: do not use text or graphics to announce “this can be clicked.” Double-click or focus and press Enter to edit. Discoverability comes from the interaction itself, not decoration.

### Paper Surface
**Role:** Matte paper material for cards and floating UI

The global background combines a fine dot matrix with extremely light noise: a `19px` interval, approximately `0.85px` dots at low contrast, and SVG turbulence noise at `opacity 0.035`.

This is paper, not glass. Glassmorphism—`backdrop-filter: blur()` combined with a translucent background and a large shadow—is explicitly prohibited. The floating navigation originally used that combination, but it conflicted with the paper dot-and-noise foundation and was judged “too abrupt.”

The navigation, `.menu`, and `.card` use the same matte material: solid `var(--surface)`, a `1px` border, a unified border-radius token, and a restrained shadow. Any element floating above the page—navigation bar, dropdown menu, or mobile menu panel—must retain this matte-card material language. Floating does not authorize a separate glass treatment.

### Dividers
**Role:** Minimal use of visible separators to reduce visual clutter

Excessive lines make a design look busy. Prefer spacing, grouping, and surface-level differences to distinguish regions over visible dividers.

- **Between cards:** Use the bento gap and distinct surface backgrounds; do not insert `<hr>` or hard-border separators between cards.
- **Inside a card:** Separate sections with padding and typographic hierarchy. If a divider is unavoidable, use a single `1px` line at `var(--line)` opacity, and only between semantically distinct blocks.
- **In lists:** Omit dividers between items when spacing alone provides sufficient separation. When a list is dense and dividers are necessary, use the lowest contrast available and keep them to `1px`.
- **Inline editing areas:** Follow the Editable Container Control rule—no inner borders or separator lines. The container surface itself defines the boundary.

### Icon-First Controls
**Role:** Compact, icon-priority functional buttons

When a functional button's action can be clearly expressed by a universally recognized icon, use the icon alone without a text label. The button's function is conveyed through the icon itself; a text description appears only on hover after a short delay via the `title` attribute, with `aria-label` providing accessibility fallback.

- **Applicable scenarios:** Download, share, bookmark, search toggle, theme toggle, language switch, close, and similar actions with well-established icon conventions.
- **Not applicable:** Actions with less intuitive semantics (e.g., dropdown menu items, mobile navigation panel entries) should retain icon-plus-text treatment for clarity.
- Icon-only buttons must carry both `aria-label` and `title`, dynamically updated when the language changes.

### Decorative Accent System
**Role:** Distributed visual punctuation across the page

Curves, dots, and geometric forms are dispersed accents on backgrounds and cards, not an illustration concentrated in one location. An earlier version stacked all decoration into one composite SVG scene in the Hero area, which could be misread as “an illustration slot” rather than a page-wide accent method.

Split the same visual language—thin-line curves, small dots, dashed folded corners, and rounded small squares—into small pieces placed across the Hero background, logo mark, and corners of multiple cards. Each instance remains restrained, generally at opacity between `0.2` and `0.55`; together they create the impression of one system.

Hero background curves must use a continuous single-stroke line, not a dashed line. Dashed lines resemble reference lines or grid guides rather than hand-drawn marks. Use the theme color `var(--accent)`, not a neutral-gray line color. A thinner, lower-opacity ghost line may be layered to create a slight brushstroke feel, but the main line must remain one continuous stroke. The intended effect is “a casually drawn stroke,” not a precise geometric curve: control points may be asymmetrical to avoid an appearance generated by a mathematical formula.

### Floating Navigation Bar
**Role:** Persistent site navigation with contextual controls

The navigation bar is floating rather than flush-top fixed: use `position: fixed`, leave whitespace above and at both sides, and do not make it full-width edge-to-edge.

When scrolling down, hide it by translating it out of the viewport with `translateY`. When scrolling up or returning to the top of the page at `scrollY ≤ ~24px`, show it again. When hiding, simultaneously collapse every expanded child panel—search, menu, and mobile navigation panel—to avoid the strange state where the navigation bar leaves the screen while a dropdown remains suspended.

The fold reserves `72px` of top safety spacing for this floating navigation so initial rendering does not cover content.

Apply `justify-content: space-between` directly to the navigation container. Do not rely on a child element’s `margin-inline-end: auto` to push other elements apart. That approach fails at responsive breakpoints when an element is hidden, causing all elements to pile up on the left while the right side is empty. The brand area, navigation items, and action area must each continue to occupy their respective ends at both wide and narrow widths.

The left side contains the site icon—a geometric logo mark that is also part of the distributed-accent system—and an editable site title. The center contains regular navigation items on desktop; at `≤760px`, these move into the mobile menu. The right side contains search, language, light/dark mode, theme color, and the mobile hamburger menu.

### Navigation Icon Controls
**Role:** Compact language, appearance, and theme controls

In the navigation bar, language, light/dark mode, and theme controls retain icons only and do not include text. The navigation already includes brand, navigation items, and search, so additional text would feel crowded.

This is a contextual exception, not a reversal of the general principle that ambiguous semantics should include text. The icons are sufficiently conventional—globe for language, sun/moon for light/dark mode, palette for theme—and `aria-label` and `title` provide accessibility fallback.

In other contexts, such as dropdown menu actions and the mobile navigation panel, follow the principle that less-direct semantics require text. Use icon and text together consistently; do not mix icon-only and icon-plus-text treatments there.

Icon buttons without visible text require both `aria-label` and `title`, dynamically updated when the language changes, including the current theme name and current light/dark state.

### Search Control
**Role:** Expandable navigation search

The default state shows only an icon button. On click, it expands rightward into a borrowing-space input field.

Do not allow a circular icon background and a rectangular highlighted input field to clash as two competing shapes. When expanded, place the icon and input together inside one unified rounded pill rather than maintaining separate visual boundaries.

The input itself does not use the default `:focus-visible` outline, because that outline is a square-cornered rectangle that conflicts with the surrounding rounded environment. The pill container border already communicates the current search state and does not need another outline layer.

The icon reuses the “form is state” motion language: search and close use two switchable SVGs and share the same icon-state switching logic as the hamburger menu and `+` button.

### Mobile Navigation Menu
**Role:** Responsive navigation panel at `≤760px`

At `≤760px`, the hamburger button changes into a close icon using the shared icon-morph animation.

The submenu must be a floating layer and must not enter document flow or push page content downward. An earlier implementation stacked four links vertically and directly increased page height; this is an explicit bug to avoid.

The floating layer sits close to the hamburger button, expands right-aligned, and uses a bento-style `2×2` grid of cards. Each item includes a small icon and text, rather than forming a single-column text-only list. This reuses the existing bento visual language while making touch targets larger and easier to tap.

### Motion System
**Role:** Restrained, accessible interaction feedback

Icon morphing is shared across the site: `+` ⇄ `×`, hamburger ⇄ close, and search ⇄ close use the same transformation logic, instantiated separately by context.

Viewport reveal fades sections in as they enter the viewport using opacity plus `translateY`. It triggers once and does not repeat.

Loading uses a skeleton screen with structural placeholder stripes, not spinning indicators or ellipsis animation.

Floating-navigation visibility transitions use `transform`, not abrupt `display` switching.

All motion respects `prefers-reduced-motion`. Under `prefers-reduced-motion`, site-wide animation duration is reduced to near `0`.

#### Global Transition Softening
**Role:** Smoothing all instantaneous UI changes

Every instantaneous UI change—page transitions, background color shifts, state toggles, panel open/close, theme switching—must be softened with a CSS `transition`. Use `transition-all duration-200 ease-out` as the default, adjusting duration per context but never exceeding `400ms`.

- Apply transitions to `background-color`, `color`, `border-color`, `opacity`, and `transform` on interactive elements by default.
- Page-level or route transitions should use a brief crossfade (`opacity`) rather than abrupt replacements.
- All softened transitions must respect `prefers-reduced-motion`, collapsing to near-zero duration when the user prefers reduced motion.
- Use only `opacity` and `transform` for animated properties; avoid transitioning layout-triggering properties like `width`, `height`, `left`, or `margin`.

#### Tab Indicator Slider
**Role:** Smooth highlight transition between tab states

When the active tab changes, the background highlight indicator slides from the old position to the new position using `transform: translateX` with a CSS `transition`. The indicator is a single absolutely-positioned element whose `width` and `translateX` are updated to match the target tab's dimensions and offset.

- Use `transform` only; do not animate `left`, `width`, or `margin`, which trigger layout recalculations.
- Match the transition duration to the site's general motion pace—typically `200–300ms` with an ease-out curve.
- On mobile, the same slider logic applies to the bottom tab bar or segmented controls.

#### Lightweight Micro-Animations
**Role:** Adding liveliness without performance cost

Where the performance cost is low and no layout or paint recalculation is triggered, prefer `transform` and `opacity` to add micro-animations that make the page feel alive without drawing attention away from content.

- **Toggle switches:** A subtle `translateX` on the thumb with a background color transition.
- **Selection states:** A brief scale pulse (`transform: scale(0.96 → 1)`) on click or tap to provide tactile feedback.
- **Hover expansions:** Card or row hover states that slightly lift (`translateY(-2px)`) or scale, accompanied by a shadow change.
- **Accent reveals:** Decorative dots or curves that fade in with a staggered delay as their parent card enters the viewport.

These animations are supplementary, not structural. They must never block interaction, delay content display, or run continuously without user initiation.

### Footer Elastic Pull-Down
**Role:** Simulated bottom-of-page elastic interaction

This interaction references diabrowser.com’s “pulling at the bottom creates an elastic rebound” effect, simulated through ordinary webpage scrolling events because browsers do not expose a native pull-distance interface.

It must use fixed positioning above page content rather than new document-flow content. Adding content in document flow continuously changes `document.scrollHeight`, which is also used to determine whether the page has reached the bottom; this feedback loop causes stutter and inconsistent behavior. With `position: fixed`, the feedback loop is fully removed.

Use discrete layered reveal instead of continuous pixel-level interpolation. Changing `height` directly on each wheel or touch event with a CSS transition continuously interrupts and redirects transition targets, producing visible stutter. Instead, reveal and hide by thresholds: five tower-card layers, each with independent transform and opacity transitions. Each layer triggers one clean transition only when crossing its threshold.

Map accumulated pull distance through an exponential easing function to the displayed value. Resistance increases as the user pulls farther, approaching a maximum without abruptly hard-stopping, which better matches the intuition of elasticity than linear mapping.

The shape is a layered tower, not one large gradient triangle. Five layers stack from wide to narrow, representing base to tip. They appear sequentially during pull-down and retract in reverse order after approximately `220ms` without input.

As an easter egg, if the tower is fully expanded at its upper limit and the user releases it, the tower retracts and the page smoothly scrolls back to the top. This is an optional detail: if it feels too playful, remove the `wasFull` condition lines in `release()`.

This remains a simulation using `wheel` and `touch` events rather than native browser overscroll physics. Its feel on trackpads and touchscreens is somewhat less smooth than native behavior. Matching diabrowser’s smoothness completely would generally require a dedicated smooth-scrolling library, such as Lenis, to take over page scrolling; this template does not currently do that.

### Bento Grid
**Role:** Content-weighted page composition

The bento grid is composed of rounded-rectangle cards of varying sizes. Card size is determined by content importance: higher-importance cards occupy larger areas, while cards of equal importance share the same size. Regardless of the number of cards, the grid must be fully filled with no empty gaps or missing corners.

The template additionally includes two image-placeholder grid positions for later replacement with real images or screenshots: one `4:3` position in the Hero and one `21:9` wide banner position in the bento grid.

Dimensions and proportions follow three principles: container size matches content expectations; interactive-state size changes match the element's own proportions; and distance communicates relatedness.

### Fold and Hero
**Role:** Complete desktop first-screen composition

On desktop, Tab navigation plus the Hero fill one screen with `min-height:100svh`. Avoid a container taller than the viewport where only half of a box is visible in the first screen.

On mobile, this rule is not forced because mobile is inherently scroll-based; forcing it can create empty space when content is insufficiently tall.

The floating navigation requires safety spacing above the Hero. This can make the desktop composition feel too low, with more top whitespace than visually necessary. This revision tightened two values: reserved spacing changed from approximately `86px` to `72px`, and the Hero’s vertical padding changed from `34px` to `12px`. This places more centering logic in the available space itself rather than stacking it across two padding layers.

If the composition still feels too low after adjustment, a possible next step is to replace “brand area/navigation items fixed at the top, Hero centered separately” with “Tab plus Hero centered as one unit in the remaining space.” That would place the Tab in a nonstandard position rather than directly below the navigation bar, so confirm whether that placement meets expectations before changing it.

### Horizontal Scroll Container
**Role:** Touch-safe horizontal navigation and overflow content

Touch horizontal-scroll containers must explicitly declare `overflow-y:hidden` and `touch-action:pan-x`.

Using only `overflow-x:auto` allows browsers to infer `overflow-y:auto`. Even without vertical overflow, touch devices may then allow the entire horizontal container to be dragged vertically. The Tab bar encountered this issue. Apply this rule to all horizontal scrolling containers in the template.

### Footer
**Role:** Page-ending content aligned with the main shell

The Footer must retain the same horizontal whitespace as `.shell`. It must not lose padding simply because it is outside the `.shell` container.

An earlier version placed the footer as a sibling of `.shell`, where it did not inherit inner padding and nearly touched both edges. The footer now declares its own `max-width`, `margin:auto`, and independent padding rather than relying on its parent container.

### Internationalization and Accessibility
**Role:** Bilingual, keyboard-accessible, semantic interface

For Chinese and English bilingual content, translatable copy uses paired `data-zh` and `data-en` spans. JavaScript switches them with the `hidden` attribute, removing inactive content from the accessibility tree rather than merely hiding it with CSS. User-created content, including Tab names and the site title, is not wrapped in translation pairs.

Use semantic navigation and ARIA state: `aria-expanded`, `aria-current`, `role="menu"`, and `role="menuitem"`.

## Do's and Don'ts

### Do

- Use containers as controls, with `contenteditable` for in-place editing.
- Keep editing geometry unchanged before and after editing; only the caret and selection should visibly change.
- Let interaction itself provide discoverability through double-click, focus, and Enter.
- Use off-black, off-white, and warm-gray neutral foundations rather than pure black or white.
- Use the five theme palettes—Graphite, Cobalt, Verdigris, Amber, and Violet—in both light and dark states.
- Keep floating navigation, menus, cards, and mobile panels matte, opaque, bordered, rounded, and lightly shadowed.
- Distribute decorative curves, dots, dashed folded corners, and rounded small squares across the system rather than concentrating them in one Hero illustration.
- Draw Hero curves as continuous, slightly irregular theme-color strokes using `var(--accent)`.
- Use `justify-content: space-between` on the navigation container to preserve two-ended alignment responsively.
- Collapse open navigation child panels when the floating navigation hides.
- Use a unified rounded pill when the search control expands.
- Use icon morphing consistently for `+` ⇄ `×`, hamburger ⇄ close, and search ⇄ close.
- Reveal viewport content once with opacity and `translateY`.
- Use structural skeleton stripes for loading.
- Use `transform` transitions for floating-navigation visibility.
- Respect `prefers-reduced-motion` throughout the site.
- Make mobile menus floating layers with a bento-style `2×2` card grid.
- Explicitly set `overflow-y:hidden` and `touch-action:pan-x` on horizontal touch-scroll containers.
- Use `hidden` for bilingual-content switching and retain user-customized names outside translation wrappers.
- Provide `aria-label` and `title` for icon-only buttons, updating them with language changes.
- Prefer spacing, grouping, and surface-level differences to distinguish regions over visible dividers. Let whitespace do the work that lines would otherwise do.
- Use `transform: translateX` for tab indicator slider animations; do not animate layout-triggering properties.
- Add lightweight micro-animations—toggle thumb slides, selection pulses, hover lifts—using only `transform` and `opacity` to keep the page feeling alive without performance cost.
- Soften all instantaneous UI changes—page transitions, background color shifts, state toggles—with CSS transitions using `opacity` and `transform`.
- When a functional button's action can be clearly expressed by an icon, use the icon alone without a text label; provide `title` and `aria-label` for accessibility.
- For content-heavy pages or short-input forms, constrain the main content area to roughly one-third of the full page width, centered, with generous side margins to improve readability, match user expectations, and leave room for future components.

### Don't

- Do not create a “box inside a box” by nesting a complete input, border, or background inside a container. This applies universally: code blocks, media slots, and data panels must not be wrapped in an additional card when they already sit inside a surface container.
- Do not use `<input>` to simulate in-place editing; fixed widths and default styling cause geometry jumps and unwanted borders or highlights.
- Do not use pure black `#000` or pure white `#FFF`.
- Do not use Glassmorphism: `backdrop-filter: blur()` with translucent background and large shadow, including on floating elements. Floating does not mean glass.
- Do not use loading ellipsis animation, “Scroll to reveal” text, or dedicated graphical prompts such as a drawn downward-scroll arrow.
- Do not use words or graphics to explain UI when state itself can communicate the information.
- Do not create a standalone decorative Hero illustration that is detached from the content system.
- Do not use dashed lines for the main Hero background curve.
- Do not use neutral-gray lines for Hero curves when `var(--accent)` is required.
- Do not allow navigation layout to depend on `margin: auto` on a sibling that may be hidden responsively.
- Do not combine a circular icon background with a rectangular highlighted search input as competing forms.
- Do not apply the default square-cornered `:focus-visible` outline directly to the expanded search input.
- Do not push mobile dropdown navigation into document flow or expand page height.
- Do not make all bento cards the same size.
- Do not leave large areas of empty whitespace.
- Do not use interaction dimensions that conflict with content expectations or create disproportionate state changes.
- Do not omit `overflow-y` or `touch-action` from horizontal scroll containers, causing unintended vertical dragging.
- Do not let the Footer lose horizontal padding because it is outside `.shell`.
- Do not use `<hr>` or hard-border dividers to separate regions inside cards or between cards. Excessive lines make a design look cluttered and undermine the quiet, paper-like aesthetic.
- Do not animate `left`, `width`, `margin`, or any property that triggers layout recalculation for indicator sliders or micro-animations.
- Do not use arrow symbols (such as `→`, `↓`, `‹`, `›`) as interface elements; use icons, spacing, or state changes to convey direction instead.
- Do not use separator characters such as `·`, `\`, or `&` to join small text labels (e.g., "LOOKEY · SYSTEM INFO DASHBOARD"); use explicit words to describe relationships.

## Imagery

- The visual system does not use a concentrated illustration slot. Decorative content is a distributed system of small curves, dots, dashed folded corners, rounded small squares, and the geometric logo mark.
- The Hero includes one `4:3` image placeholder for future replacement with a real image or screenshot.
- The bento grid includes one `21:9` wide-banner image placeholder for future replacement with a real image or screenshot.
- Decorative opacity is generally between `0.2` and `0.55`.
- The global material texture uses a low-contrast fine dot matrix and extremely light SVG turbulence noise at `opacity 0.035`.

## Layout

- **Section gap:** The Fold reserves `72px` of top safety spacing for the floating navigation; Hero vertical padding is `12px`.
- **Card padding:** `22px`; floating cards use the shared matte surface language with a `1px` border, unified radius token, and restrained shadow.
- **Element gap:** The background dot matrix uses a `19px` interval.
- **Max content width:** The Footer declares its own `max-width` with `margin:auto` and independent padding; no numeric maximum width is specified.

### Content Width Constraint
**Role:** Improving readability and extensibility through constrained width

When a page section contains large amounts of reading content or input fields whose expected input is short, the main content area should occupy roughly one-third of the full page width, centered, with generous side margins.

- **Readability:** Narrower text columns reduce the distance the eye must travel across lines, improving reading comfort and speed.
- **Input expectations:** Short-input fields (e.g., name, email, search terms) do not need full-width space; a constrained width matches user expectations and prevents inputs from feeling disproportionately wide.
- **Extensibility:** Reserved side space leaves room for future components—sidebars, contextual panels, or auxiliary information—without requiring layout restructuring.
- **Responsive adaptation:** A centered, constrained-width layout naturally adapts to mobile viewports, where the content simply expands to fill the available width.

This constraint applies contextually, not universally. Dashboards, bento grids, and data-dense views may still use the full page width. The decision is content-driven: reading-heavy or short-input sections use constrained width; data-dense or card-grid sections use full width.