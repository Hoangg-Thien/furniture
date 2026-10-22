---
name: design-taste-frontend
description: High-taste modern frontend design system guidelines, aesthetics principles, and UI/UX craftsmanship for standalone admin dashboards and web applications.
---

# Design Taste Frontend - Guidelines & Aesthetic Standards

## 1. Aesthetic Philosophy & Visual Excellence
- **Design Philosophy**: Never settle for generic or boilerplate templates. Interfaces must feel bespoke, premium, and meticulously crafted.
- **Color Systems**:
  - Primary Canvas: Deep obsidian slate (`#0B0F17`, `#111827`, `#0d1117`) or ultra-refined clean warm minimal (`#F8FAFC`, `#FFFFFF`, `#F1F5F9`).
  - Brand & Accent: Tailored hues like Electric Indigo (`#6366F1`), Amber Bronze (`#D97706`), Emerald Spark (`#10B981`), Rosewood (`#E11D48`), or Warm Ochre / Wood Grain tones matching the furniture domain (`#B45309`, `#78350F`, `#92400E`).
  - Borders & Dividers: Subtle 1px translucent borders (`rgba(255, 255, 255, 0.08)` or `rgba(15, 23, 42, 0.08)`), never thick solid gray lines.
  - Surface Glassmorphism: Light backdrops with subtle blur (`backdrop-filter: blur(12px)`), crisp 1px borders, and soft multi-layered shadows.

## 2. Typography & Hierarchy
- Modern font families: Inter, Plus Jakarta Sans, Outfit, or system-ui.
- Clear typographic scale:
  - Micro copy: 11px - 12px (caps tracking `0.05em`, uppercase badges).
  - Body: 13.5px - 14.5px, line-height 1.5 - 1.6.
  - Subheaders: 16px - 18px, font-weight 600.
  - Section titles: 22px - 28px, font-weight 700 with high contrast.
- Balance contrast: High-contrast primary headings, muted slate body (`#94A3B8` or `#64748B`), and subtle helper text.

## 3. Standalone Admin Dashboard Architecture
- **Completely Independent Layout**:
  - Independent from the client storefront: does not render the storefront navbar, footer, or hero section.
  - Standalone layout composed of:
    1. **Collapsible High-Taste Sidebar**:
       - Brand logo with admin badge ("FuniStore Admin").
       - Grouped navigation links (Overview, Orders, Products, Vouchers, Customers/Users, Settings).
       - Badge counts on interactive tabs (e.g., pending vouchers count, active orders count).
       - Quick return to Storefront button with distinct styling.
    2. **Modern Header Bar**:
       - Page title and contextual breadcrumbs.
       - Quick search bar across admin data.
       - System connectivity badge (API Live / Offline status indicator).
       - Current logged-in admin user avatar with role badge ("Quản trị viên").
    3. **Content Workspace**:
       - Hero metric cards with sparkline/progress bars, KPI trends (+12% vs last month).
       - Filterable, sortable interactive data tables with search, status filters, and pagination.
       - Slide-over drawers or modal dialogs for item inspection, creation, and approval workflows.
       - Non-blocking toast notifications for instant operation feedback.

## 4. Craftsmanship & Micro-Interactions
- Smooth transitions: `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`.
- Interactive hover lifts: `transform: translateY(-2px)` on cards with subtle shadow depth changes.
- Status badges: Soft pastel backgrounds with glowing dot indicators (e.g. green pulse for Active, amber for Pending, blue for Shipped).
- Empty states: Beautiful illustrations or themed icon containers with actionable guide text instead of bare blank areas.
- Responsive adaptability: Seamlessly handles mobile viewports with drawer sidebar and touch-friendly tap targets.
