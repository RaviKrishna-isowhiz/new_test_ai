# AI Planet - Design System Documentation

## Color Palette
**Light Mode:**
- Background: #ffffff
- Foreground: #171717
- Navy (Primary): #0a192f
- Indigo (Secondary): #4338ca
- Accent: #6366f1

**Dark Mode:**
- Background: #0a0a0a
- Foreground: #ededed
- Navy (Primary): #1e293b
- Indigo (Secondary): #6366f1
- Accent: #818cf8

## Typography
- Font Family: 'Zalando Sans', ui-sans-serif, system-ui, sans-serif
- Headings: font-weight 800, letter-spacing 0.05em, line-height 1.2
- Body: line-height 1.6

## Components & Patterns

### Card Styles
**card-premium**: 
- Light: Gradient bg (f8fafc → ffffff), border slate-100, shadow-soft
- Dark: Gradient bg (1e293b → 0f172a), border slate-700
- Hover: translateY(-4px), enhanced shadow, top border gradient appears
- Border-radius: 2xl (rounded-2xl)

### Data Table (AG-Grid)
- Light mode: ag-theme-alpine with custom styling
- Dark mode: ag-theme-alpine-dark with custom styling
- Header: uppercase, font-weight 800, letter-spacing 0.05em, font-size 0.75rem
- Rows: font-size 0.875rem
- Selected rows: indigo background with opacity
- Highlight rows: slate-50 background

### Layout Structure
- Header: sticky top-0 z-50, white/slate-900 bg with backdrop blur, shadow-sm
- Sidebar: 64px header + scrollable nav, collapsible (64px → 256px), nav items use rounded-xl
- Main: flex-1 overflow-auto, background gradient (light/dark)
- Footer: fixed bottom
- Mobile: bottom navigation at bottom-3 with rounded-2xl

### Button Styles
- Primary: bg-blue-100 dark:bg-slate-700, text-blue-900 dark:text-blue-200, rounded-md
- Hover: enhanced background color, transitions duration-300
- Secondary: hover:bg-slate-50 dark:hover:bg-slate-800
- Danger: rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20

### Input/Upload Areas
- Drag-drop support with visual feedback
- Border dashed, rounded-xl, background slate-50 dark:bg-slate-800
- Active state: blue/indigo border and background
- File validation with error messages

### Loading/Processing States
- Full page loader: fixed inset-0, backdrop blur, centered spinner
- Spinner: animate-spin h-12 w-12
- Status text: font-medium text-blue-900 dark:text-blue-300

### Export Dropdown
- Absolute positioning, z-50
- Items with icons and labels
- Hover states with background color change
- Smooth transitions

## Responsive Design
- Mobile-first approach
- Sidebar hidden on md: screens (hidden md:flex)
- Mobile bottom navigation on small screens
- Grid layouts: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Responsive padding: px-2 md:px-6, py-2 md:py-4

## Dark Mode Implementation
- ThemeContext provides theme state
- Classes: dark: prefix for dark mode styles
- HTML root: classList.add('dark') / remove('dark')
- Transitions: bg-opacity-90, transition ease 0.3s
- CSS variables used throughout for consistency

## Spacing Scale (Tailwind)
- Gap: gap-2, gap-4, gap-6
- Padding: p-2, p-4, p-6
- Margin: mb-1, mb-2, mb-4
- Avoid space-* and margin/padding mix with gap

## Icons
- SVG inline with w-4 h-4 to w-10 h-10 sizing
- stroke-current, strokeWidth variations
- No emoji usage

## Shadows & Elevation
- card-premium: var(--shadow-soft) = 0 12px 24px -6px rgba(0,0,0,0.08), 0 8px 12px -4px rgba(0,0,0,0.05)
- Hover elevations: 0 20px 25px -5px rgba(0,0,0,0.1)
- Dark shadows: shadow-2xl shadow-blue-900/20

## Key Classes to Maintain
- `card-premium` for all cards
- `dark:force-dark-card` for dark mode card overrides
- `dark-mode-active` class on containers
- `force-dark-card` for forced dark backgrounds
- Gradient headers: bg-gradient-to-r from-blue-900 via-slate-400 to-blue-300

## AG-Grid Customization
- Light columns: navy/indigo gradient
- Dark columns: slate-700 colors
- Header: font-weight 800, uppercase, 0.75rem
- Border colors: slate-100 light, slate-700 dark
- Selection: indigo with opacity

## Export Functionality
- Excel, CSV, PDF exports
- Uses ExcelJS, jsPDF, file-saver
- Filtered data support via AG-Grid API
- Loading states during PDF generation
