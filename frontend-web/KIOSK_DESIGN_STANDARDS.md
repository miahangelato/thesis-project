# Kiosk Design Standards

## Typography (Applied Globally)

| Element | Class | Size | Usage |
|---------|-------|------|-------|
| Page Title | `.text-page-title` or `h1` | 32px | Main page headings |
| Section Header | `.text-section-header` or `h2` | 24px | Card/section titles |
| Body Text | `.text-body` or `p` | 18px | Paragraphs, descriptions |
| Labels | `.text-label` or `label` | 18px | Form labels |
| Helper Text | `.text-helper` | 16px | Helper/hint text |
| Buttons | `.text-button` or `button` | 18px | All buttons |
| Disclaimers | `.text-disclaimer` or `small` | 16px | Legal text, notes |

## Page Layout (Standard Margins)

Use these utility classes for consistent page layouts:

```tsx
// Standard page container with responsive margins
<div className="page-container">
  {/* Content */}
</div>

// Full page wrapper with max width
<div className="page-content-max">
  {/* Content */}
</div>

// Combined usage
<div className="page-content-max">
  <main className="page-container">
    {/* Page content */}
  </main>
</div>
```

### Margin Values
- Base: `px-12` (48px)
- Large: `lg:px-16` (64px)
- XL: `xl:px-20` (80px)
- 2XL: `2xl:px-32` (128px)
- Vertical: `py-4` (16px)

## Implementation

All styles are defined in `app/globals.css` and automatically apply across the application.

### Override When Needed
If you need different sizes for specific elements, use Tailwind classes:
```tsx
<p className="text-xl">Larger than default body text</p>
<small className="text-sm">Smaller disclaimer</small>
```

## Accessibility Notes
- Base font size of 18px ensures readability on large touchscreens
- Minimum touch target size: 44×44px (maintained in buttons and interactive elements)
- Line height of 1.6 for body text improves readability
