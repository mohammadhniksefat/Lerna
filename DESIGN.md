---
name: Folio LMS
colors:
  surface: '#f9f9f8'
  surface-dim: '#dadad9'
  surface-bright: '#f9f9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f3'
  surface-container: '#eeeeed'
  surface-container-high: '#e8e8e7'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1f0'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#ac3400'
  on-secondary: '#ffffff'
  secondary-container: '#fd6b36'
  on-secondary-container: '#5d1900'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c1b1a'
  on-tertiary-container: '#868382'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#ffb59d'
  on-secondary-fixed: '#390c00'
  on-secondary-fixed-variant: '#832600'
  tertiary-fixed: '#e6e2df'
  tertiary-fixed-dim: '#cac6c4'
  on-tertiary-fixed: '#1c1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#f9f9f8'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display:
    fontFamily: Newsreader
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-mobile:
    fontFamily: Newsreader
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 26px
    fontWeight: '400'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Newsreader
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Newsreader
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 34px
    letterSpacing: 0.005em
  body-md:
    fontFamily: Newsreader
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: 0.01em
  body-sm:
    fontFamily: Newsreader
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 2rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.75rem
  space-xl: 3rem
---

## Brand & Style

This design system is tailored for an editorial, distraction-free Learning Management System that treats education as a deliberate reading and writing craft. The design narrative prioritizes academic depth, scholarly calm, and intellectual clarity over gamified badges and cognitive clutter. 

The aesthetic sits at the intersection of **Editorial Minimalism** and **Book Arts Humanism**:
- **Tactile Paper Quality**: Interfaces emulate the quiet dignity of archival monograph pages, literary quarterlies, and finely bound books.
- **Typography-Led Architecture**: Visual weight, typographic rhythm, and strict vertical cadence structure the interface rather than heavy borders or aggressive chromatic gradients.
- **Deep Focus (Subtractive UI)**: Chrome, metadata, and structural controls yield precedence entirely to the text during study and composition modes.
- **Audience & Resonance**: Geared toward researchers, scholars, essayists, and learners who seek an environment evocative of private study halls, clean desks, and well-curated library desks.

## Colors

The palette reproduces the chromatic behavior of ink, warm cream vellum, and archival binding cloth. 

### Palette Definition
- **Neutral Canvas (`#FBFBFA`)**: Archival cream background reducing eye strain over prolonged reading sessions compared to harsh blue-tinted whites.
- **Primary Ink (`#1A1A1A`)**: Deep soot black for continuous prose, high-contrast headings, and foundational interactive elements.
- **Secondary Accent (`#C2410C`)**: Deep, dried terracotta. Used sparingly for deliberate attention markers, active navigational indicators, marginalia calls, and text highlights.
- **Muted Slate (`#666663`)**: Neutral tonal tier for secondary metadata, timestamps, captions, reading durations, and inactive icons.
- **Surface & Rule Tier (`#E7E6E1`)**: Warm stone divider tone for hairline separators, table borders, and subtle structural demarcations.
- **Elevated Canvas (`#FFFFFF`)**: Pure sheet white reserved for reading panels, raw Markdown code blocks, and focused administrative workspace cards.

### Color Distribution Strategy
- The interface maintains an 85% surface presence of cream and paper-white backgrounds.
- High-contrast ink handles 12% of the UI (prose, primary iconography, navigation text).
- Terracotta is restricted to a surgical 3% footprint: focus halos, live block cursors, and active chapter breadcrumbs.

## Typography

Typography is the primary architecture of this design system. It uses an editorial pairing of **Newsreader** (an optical-size serif tailored for continuous reading) and **Plus Jakarta Sans** (a precise, crisp contemporary sans-serif for UI controls, technical metadata, and administrative operations).

### Typographic Principles
- **Longform Text Measure**: Continuous reading bodies (`body-lg`, `body-md`) must strictly observe an optimal reading width of 60 to 75 characters (approx. 640px–720px max-width).
- **Proportional Leading**: Reading line-heights are intentionally generous (1.65 to 1.7) to preserve ocular tracking across dense educational tracts.
- **Editorial Voice**: Course titles, article modules, syllabus summaries, and long essays use Newsreader with optical sizing. Buttons, tabs, metadata tags, breadcrumbs, and metrics leverage Plus Jakarta Sans in all-caps or title-case to clearly demarcate interface controls from curriculum content.

## Layout & Spacing

The layout philosophy implements a **Restrained Fixed Grid** for administrative overviews and an **Unobtrusive Centered Column** for immersive reading and Markdown composition.

### Layout Mechanics
- **Reading Chamber**: Fixed max-width of `740px`, centered with fluid margins. Wide margins house contextual marginalia, footnotes, and inline highlighting tools on viewport expansion.
- **Administrative & Dashboard Views**: 12-column layout pinned to a `1280px` maximum bounding box with `2rem` gutters. Elements snap along formal editorial columns reminiscent of classic broadsheet divisions.
- **Vertical Rhythm**: Built on an `8px` baseline grid. Block-level text spacing leverages vertical margins proportional to em sizes to protect typographic flow.
- **Responsive Adaptations**:
  - **Mobile (<768px)**: 4-column layout; gutter contracts to `1rem`; margins collapse to `1.25rem`. Complex sidebars tuck into slide-over sheets, leaving the text canvas unbroken.
  - **Tablet (768px–1024px)**: 8-column layout; sticky secondary indices dock below the primary reading scroll.
  - **Desktop (>1024px)**: Full dual-pane or tri-pane layout (Syllabus Navigator, Focused Reading Canvas, Marginal Annotations / Scratchpad).

## Elevation & Depth

This design system avoids simulated real-world drop shadows, heavy blur filters, or volumetric skeuomorphism. Depth is achieved via **Tonal Paper Layering** and **Low-Contrast Hairline Outlines**.

### Elevation Hierarchy
- **Level 0 (Canvas Base)**: The archival parchment background (`#FBFBFA`). Houses background structures, empty states, and unselected course track lanes.
- **Level 1 (Paper Leaf / Cards)**: Pure white sheets (`#FFFFFF`) with a `1px` crisp hairline border using `#E7E6E1`. Zero blur or shadow. Used for lesson cards, administrative tables, and syllabus modules.
- **Level 2 (Active Focus & Flyouts)**: Elevated panels (such as marginalia popovers, floating formatting toolbars, and search palettes) use `#FFFFFF`, a crisp `#1A1A1A` hairline border, accompanied by a subtle archival tone shift: an ultra-subtle tint (`rgba(26, 26, 26, 0.04)`) offset by `0px 4px 16px`.
- **Level 3 (Modal Sheets)**: Unadorned white planes bordered by `#E7E6E1`, presented over a semi-opaque warm parchment scrim (`rgba(251, 251, 250, 0.88)` with a `4px` subtle blur) to mute lower-tier content without introducing artificial night-time dimming.

## Shapes

The design system embraces an intentional, refined corner language that reflects trimmed book paper and clean architectural forms.

- **Soft Form Language (Level 1)**: All interactive components (buttons, input boxes, administrative cards, Markdown containers, tabs) employ a tight, disciplined `0.25rem` (4px) corner radius.
- **Full Precision Geometry**: Selected text callouts, inline quotes, and code blocks maintain `0px` sharp corners to anchor their structural identity against the continuous curve of serif letterforms.
- **Avoidance of Pill Shapes**: Fully rounded pills and circular buttons are avoided, as they conflict with the literary, print-inspired identity of the system.

## Components

### Buttons
- **Primary Button**: Solid ink fill (`#1A1A1A`), pure white text, Plus Jakarta Sans (`label-lg`), `4px` corner radius. Interactive state transitions cleanly to `#2E2E2D` on hover. No shadows.
- **Secondary Button**: Background in `#FBFBFA`, hairline border (`1px solid #E7E6E1`), ink text (`#1A1A1A`). Transitions to border color `#1A1A1A` on hover.
- **Tertiary / Editorial Link**: Text-only, framed by a delicate bottom border underline (`1px solid #C2410C`) positioned `4px` below the text baseline. Hover increases line weight to `1.5px`.

### Markdown Textarea Editor
- Raw, distraction-free drafting surface built on `#FFFFFF` with minimal hairline boundaries (`#E7E6E1`).
- Typography in editor mode switches between an ultra-clean monospace for raw source (`JetBrains Mono` or system mono) and live serif preview (`Newsreader`).
- Floating format dock: Compact, contextual toolbar pinned with a `1px solid #1A1A1A` border containing typography modifiers, header toggles, footnote anchors, and LaTeX notation triggers.

### Administrative Cards
- Constructed with `#FFFFFF` backgrounds and `1px solid #E7E6E1` outer rules.
- Card headers strictly divide with a horizontal `1px solid #E7E6E1` hairline separator.
- Header contains category metadata in all-caps (`label-sm`, tracking `0.04em`, `#666663`) placed alongside a bold Newsreader title.

### Tabs & Navigation
- Flat, non-segmented horizontal tab arrays.
- Active state indicated exclusively by a continuous ink (`#1A1A1A`) or terracotta (`#C2410C`) `2px` horizontal bar seated directly on the baseline border, paired with medium weight Plus Jakarta Sans text. Inactive tabs utilize `#666663`.

### Input Fields & Controls
- **Text Inputs**: Crisp white container, `1px solid #E7E6E1` perimeter, inner padding of `10px 14px`. On focus, the border shifts directly to `#1A1A1A` with a delicate `1px` terracotta highlight ring (`#C2410C`), rejecting heavy browser rings.
- **Checkboxes & Radios**: Minimalist `16px` squares/circles with `1px solid #666663`. Checked state fills solid with `#1A1A1A` displaying an off-white inner check icon.

### Reading Marginalia & Footnotes
- Sits in the right margin on screens wider than 1200px, aligned vertically with the paragraph reference.
- Typeset in `Newsreader` italic or `Plus Jakarta Sans` (`label-md`) in `#666663`. Highlights in text link directly to marginal notes via subtle terracotta reference numerals.