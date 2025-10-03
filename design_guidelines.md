# AI Code Review Application - Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based Design inspired by developer tools (GitHub, VS Code, Linear, Vercel)

**Justification:** This is a developer-focused utility application requiring professional aesthetics, clear information hierarchy, and familiar interaction patterns. Drawing from industry-leading developer platforms ensures intuitive UX while maintaining modern visual appeal.

**Key Design Principles:**
- Developer-first interface with technical precision
- Dark mode as primary theme (light mode support)
- Clear visual hierarchy for code and review data
- Minimal distractions, maximum functionality
- Professional, trustworthy aesthetic

---

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary):**
- Background Base: 222 47% 11% (deep navy-blue)
- Surface Elevated: 222 47% 15% (card backgrounds)
- Surface Interactive: 222 47% 20% (hover states)
- Primary Brand: 217 91% 60% (vibrant blue for CTAs)
- Primary Hover: 217 91% 55%
- Success: 142 71% 45% (code fixes, positive states)
- Warning: 38 92% 50% (security warnings)
- Danger: 0 84% 60% (critical issues)
- Text Primary: 210 40% 98%
- Text Secondary: 215 20% 65%
- Border: 217 33% 25%

**Light Mode:**
- Background: 0 0% 100%
- Surface: 220 14% 96%
- Primary: 217 91% 50%
- Text: 222 47% 11%

**Accent Colors:**
- Code Suggestion: 262 83% 58% (purple highlights)
- AI Processing: 189 94% 43% (cyan for active AI states)

### B. Typography

**Font Stack:**
- **Primary UI:** Inter (Google Fonts) - 400, 500, 600, 700
- **Code/Monospace:** JetBrains Mono - 400, 500, 600
- **Headings:** Inter - 600, 700

**Type Scale:**
- Heading 1: 2.5rem (40px), weight 700, line-height 1.2
- Heading 2: 2rem (32px), weight 600, line-height 1.3
- Heading 3: 1.5rem (24px), weight 600, line-height 1.4
- Body Large: 1.125rem (18px), weight 400, line-height 1.6
- Body: 1rem (16px), weight 400, line-height 1.6
- Body Small: 0.875rem (14px), weight 400, line-height 1.5
- Code: 0.875rem (14px), JetBrains Mono, line-height 1.6

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Component padding: p-4, p-6, p-8
- Section spacing: gap-8, gap-12
- Container margins: mx-4, mx-8
- Card spacing: p-6 to p-8

**Grid Structure:**
- Max container width: max-w-7xl (1280px)
- Dashboard: Sidebar (280px fixed) + Main content (flex-1)
- Responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

### D. Component Library

**Navigation:**
- Fixed sidebar with icon + label navigation items
- Hover state: background surface-interactive, subtle scale transform
- Active state: primary brand color + background highlight
- Collapsed mode on mobile with hamburger menu

**Code Editor Area:**
- Monaco Editor integration with theme matching
- Toolbar: Language selector (dropdown), File upload button, Submit button
- Editor container: rounded-lg, border, min-height 400px
- Line numbers and syntax highlighting

**Cards & Surfaces:**
- Background: surface-elevated
- Border: 1px solid border color
- Border radius: rounded-lg (8px)
- Shadow: subtle shadow on hover (shadow-sm to shadow-md transition)

**Buttons:**
- Primary: bg-primary, text-white, px-6 py-3, rounded-lg, hover:bg-primary-hover
- Secondary: border-2 border-primary, text-primary, px-6 py-3, rounded-lg
- Ghost: text-secondary, hover:bg-surface-interactive, px-4 py-2
- Icon buttons: p-2, rounded-md, hover states

**Forms & Inputs:**
- Input fields: bg-surface-elevated, border, rounded-md, px-4 py-3
- Focus state: border-primary, ring-2 ring-primary/20
- Dark mode compatibility maintained
- Label: text-sm, text-secondary, mb-2

**Tables (Review History):**
- Header: bg-surface-elevated, border-b, text-secondary, font-medium
- Rows: border-b, hover:bg-surface-interactive transition
- Alternating rows: Optional subtle background difference
- Actions column: Icon buttons aligned right
- Pagination: Bottom aligned with page numbers + prev/next

**Tabs (Review Output):**
- Tab list: border-b, gap-8
- Active tab: border-b-2 border-primary, text-primary
- Inactive: text-secondary, hover:text-primary
- Tab panels: pt-6, code display with syntax highlighting

**Subscription Cards:**
- 3-column grid (stack on mobile)
- Featured plan: border-2 border-primary, shadow-lg
- Price display: large heading (text-4xl), period (text-secondary)
- Feature list: checkmarks (success color), gap-3
- CTA button: Full width, primary or secondary variant

### E. Iconography

**Icon Library:** Heroicons (outline and solid variants)
- Navigation: 24px icons
- Buttons: 20px icons
- Inline: 16px icons
- Code language badges: 16px custom language icons

**Language Badges:**
- Small colored pills with language icon + name
- JavaScript: Yellow accent
- Python: Blue accent
- TypeScript: Blue accent
- C/C++: Gray accent
- PHP: Purple accent
- React: Cyan accent

---

## Page-Specific Guidelines

### Landing Page

**Hero Section:**
- Full viewport height (min-h-screen)
- Large hero image: Abstract code visualization or developer workspace (blurred background)
- Centered content: Heading (text-5xl md:text-6xl), subheading, CTA buttons
- Gradient overlay on hero image for text readability
- Primary CTA: "Get Started" (primary button), Secondary: "Watch Demo" (outline button with backdrop-blur)

**Features Section:**
- 3-column grid (stack on mobile)
- Icon + heading + description cards
- Icons: 48px, primary color
- Card hover: subtle lift (transform translateY)

**Pricing Preview:**
- 3-plan comparison cards
- Pro plan highlighted/featured
- "View All Plans" link to subscription page

**Footer:**
- 4-column layout: Logo+tagline, Product, Company, Legal
- Social icons, newsletter signup
- Copyright and links

### Dashboard

**Layout:**
- Sidebar: Fixed left, full height, dark surface
- Main: Language selector (top), Code editor (center), Output tabs (bottom)
- Right panel (optional): Usage stats card

**AI Review Output:**
- Tabbed interface: Suggestions | Fixed Code | Security
- Code diff view for Fixed Code tab
- Warning/error badges for Security issues
- Copy code button, download options

### Authentication

**Layout:** Centered card (max-w-md), minimal distractions
- Logo at top
- Social login buttons: GitHub, Google (icon + label)
- Divider: "or continue with email"
- Email/password form
- Links: Forgot password, Sign up

---

## Images

### Hero Image (Landing Page)
**Description:** Modern developer workspace scene - multiple monitors showing code, subtle purple/blue ambient lighting, depth of field blur. Alternative: Abstract visualization of code analysis with flowing lines and nodes representing AI processing.
**Placement:** Full-width background of hero section with dark gradient overlay (from transparent to background-base)

### Feature Section Icons
**Description:** Custom illustrations or icon graphics representing: Multi-language support (various language logos), Security shield with checkmark, Lightning bolt for speed
**Placement:** Top of each feature card, 64px size, primary brand color

### Dashboard Empty State
**Description:** Friendly illustration of code being analyzed, minimalist line art style
**Placement:** Center of code editor when no code is loaded, 200px size

---

## Animations

**Use Sparingly:**
- Button hover: Scale 1.02, transition 150ms
- Card hover: translateY(-2px), shadow transition 200ms
- Tab switching: Fade in content, 200ms
- Loading states: Subtle pulse on submit button, spinner during AI processing
- Page transitions: Fade in content, 300ms

**Avoid:** Excessive scroll animations, complex hero animations, autoplay carousels

---

## Accessibility & Responsive Design

- Maintain WCAG AA contrast ratios (4.5:1 for text)
- Focus indicators: ring-2 ring-primary/50
- Mobile: Stack columns, hamburger navigation, touch-friendly targets (min 44px)
- Keyboard navigation: Logical tab order, visible focus states
- Screen reader: Proper ARIA labels, semantic HTML

This design system prioritizes developer experience, technical precision, and modern aesthetics while maintaining scalability and accessibility.