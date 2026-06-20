# VALO Technologies — Style Guide for Website Build

This document defines voice, visual identity, component patterns, and technical requirements for the VALO Technologies website. Hand this to Claude Code along with the architecture and page copy documents.

---

## Voice and Tone

**The voice is the founder's.** Senior security engineer who runs a small consultancy. Direct, specific, opinionated where opinions are warranted, honest about limitations.

**Write like a practitioner, not a marketer.** "We've operated inside healthcare environments under regulatory pressure" is the voice. "We empower healthcare organizations to achieve cybersecurity excellence" is not.

**Specificity beats abstraction.** Name the framework, the platform, the credential, the regulation. "HIPAA Security Rule readiness" not "regulatory compliance assistance."

**Honesty about limitations is a feature.** When VALO doesn't do something — 24/7 SOC monitoring, red team engagements, C3PAO certification, AmLaw 100 firms — say so. This builds trust faster than any marketing promise.

### Words and phrases to avoid entirely

- "Cutting-edge," "best-in-class," "world-class," "industry-leading"
- "Empower," "unlock," "leverage" (as a verb), "synergy"
- "Solutions" used as a generic stand-in for "services"
- "We are passionate about" anything
- "Our team of experts"
- Any sentence that could appear unchanged on a competitor's website

### Patterns to use

- "What we do" rather than "Our solutions"
- "Who this is for" / "Who this isn't for" — explicit segmentation
- Specific framework, regulation, and platform names
- Honest scope statements ("VALO is a consultancy, not a 24/7 NOC")
- Numbered or bulleted lists when content is genuinely list-shaped, prose otherwise

---

## Visual Identity

### Aesthetic

Dark tactical. The existing single-page site at valotechnologiellc.com already establishes this — keep it as the foundation and expand into a full visual system across multiple pages.

### Color palette

- Primary background: deep charcoal or near-black (existing palette)
- Primary accent: tactical green or steel blue (use existing brand color)
- Secondary accent: high-contrast white or off-white for body text
- Tertiary: muted gray for secondary text and dividers
- Alert/CTA color: a single high-contrast color for primary buttons (red, amber, or vivid green — pick one and stick to it)

### Typography

- Headings: a strong, slightly condensed sans-serif (Inter, Space Grotesk, or similar). Heavy weights for H1, lighter weights as the hierarchy descends.
- Body: a highly readable sans-serif at 16-18px base size, 1.6 line height minimum.
- Monospace accents: a clean monospace (JetBrains Mono, Fira Code) for technical terms, framework names, or any code snippets in articles.
- One typography family for headings, one for body. No more.

### Imagery

- No stock photos of people in suits looking at laptops. None.
- Founder headshot on About / Leadership page only.
- Abstract or technical imagery acceptable: network topology fragments, data visualizations, geometric patterns. Should reinforce the tactical aesthetic.
- Certification logos and framework logos used as small badges, not large hero elements.

### Spacing and layout

- Generous whitespace. Most security firm sites are too dense.
- Single-column for primary content, with secondary callouts in a sidebar or below.
- Content max-width: 720-800px for readability.
- Strong hierarchy through size and weight, not color tricks.

---

## Component Patterns

### Navigation

Sticky top nav with primary links: Services | Industries | About | Insights | Contact
Mobile-friendly hamburger below tablet breakpoint.
Logo top-left, primary CTA top-right ("Schedule conversation").

### Hero sections

Headline, one-sentence subhead, single primary CTA, trust strip below. No carousels. No background videos.

### Service and industry cards

Consistent card pattern across home page, services overview, and industries overview. Title, 2-3 sentence description, "Learn more" link.

### Service detail pages

Consistent structure — heading, subheading, what it is, what's included, engagement formats, who it's for, who it isn't for, FAQ where relevant, CTA.

### Industry pages

Consistent structure — heading, subheading, why this industry, what VALO brings, common engagements, who VALO serves, who VALO doesn't serve, case studies (placeholder), CTA.

### Footer

Same on every page.
- Logo
- Address (Rockwall, TX)
- Email: lk@valotechnologiellc.com
- Phone (if published)
- Four-column sitemap: Services / Industries / About / Resources
- LinkedIn icon
- Certification badges strip
- Copyright + Privacy + Terms links

### CTAs

Two primary CTAs throughout the site, used consistently:
- "Schedule a conversation" → contact form
- "Schedule a [topic-specific] conversation" → contact form (variant per page)

No "Get started today!" energy. The voice is calm and confident.

---

## Technical Requirements

- Static site, deploy-ready for GitHub Pages
- Single HTML file per page (matches existing approach)
- Mobile-responsive across breakpoints (mobile, tablet, desktop)
- Accessible: WCAG AA at minimum (color contrast, semantic HTML, alt text, keyboard navigation)
- Formspree contact form integration (endpoint xnnevpwq, lk@valotechnologiellc.com)
- Domain: valotechnologiellc.com
- Privacy policy and terms of service pages required (linked from footer, not in main nav) — Claude Code can draft these from standard templates
- Page load: under 2 seconds on 3G, all assets optimized
- No analytics tracking on launch (add later if needed)
- Open Graph and Twitter Card meta tags on every page for link previews
- Favicon and Apple touch icon
- Set up on a feature branch, not main — review before deploying

---

## Build Prompt for Claude Code

> Build a multi-page static website for VALO Technologies, LLC. Use the attached information architecture (01_architecture.md), page copy (02_page_copy.md), and this style guide (03_style_guide.md). Single HTML file per page, deploy-ready for GitHub Pages. Dark tactical aesthetic, mobile-responsive, WCAG AA accessibility. Integrate the existing Formspree contact form (endpoint xnnevpwq). Set up on a feature branch for review before deploying to main. Reference the existing single-page site at valotechnologiellc.com for visual continuity, but expand into the full multi-page architecture defined here.
