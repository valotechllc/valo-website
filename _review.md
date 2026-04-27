# VALO Technologies Site Build — Pre-Launch Review

Generated: April 2026  
Build: multi-page rebuild from `docs/01_architecture.md`, `docs/02_page_copy.md` (v2), `docs/03_style_guide.md`

---

## Files Written (23 total)

| File | Status |
|------|--------|
| `styles.css` | New — shared CSS system |
| `index.html` | Replaced — home page |
| `contact.html` | New |
| `privacy.html` | New — **legal review required** |
| `terms.html` | New — **legal review required** |
| `about.html` | Replaced — meta-refresh redirect to `/about/` |
| `services/index.html` | New |
| `services/vciso.html` | New |
| `services/compliance.html` | New |
| `services/network-security.html` | New |
| `services/pentesting.html` | New |
| `services/compliance/hipaa.html` | New |
| `services/compliance/soc2.html` | New |
| `services/compliance/cmmc.html` | New |
| `industries/index.html` | New |
| `industries/healthcare.html` | New |
| `industries/financial-services.html` | New |
| `industries/professional-services.html` | New |
| `about/index.html` | New |
| `about/leadership.html` | New |
| `about/credentials.html` | New |
| `insights/index.html` | New |
| `_review.md` | This file |

---

## TODO Placeholders (must resolve before launch)

Every item below is preserved as an HTML comment (`<!-- TODO: ... -->`) with `href="#"` in the live markup. None were silently substituted.

### LinkedIn URL — appears in every page footer + contact.html + leadership.html

- `index.html` footer — `<!-- TODO: replace with actual LinkedIn URL -->`
- `contact.html` — direct contact block + footer
- `services/index.html` footer
- `services/vciso.html` footer
- `services/compliance.html` footer
- `services/network-security.html` footer
- `services/pentesting.html` footer
- `services/compliance/hipaa.html` footer
- `services/compliance/soc2.html` footer
- `services/compliance/cmmc.html` footer
- `industries/index.html` footer
- `industries/healthcare.html` footer
- `industries/financial-services.html` footer
- `industries/professional-services.html` footer
- `about/index.html` footer
- `about/leadership.html` — principal's personal LinkedIn link + footer
- `about/credentials.html` footer
- `insights/index.html` footer
- `privacy.html` footer
- `terms.html` footer

**Action required:** Replace every `href="#"` on LinkedIn links with the actual LinkedIn profile/company URL before launch.

### Headshot — `about/leadership.html`

- `<!-- TODO: replace with actual professional headshot -->`
- Rendered as a placeholder box (220×260px, dark background, "Photo pending" label)

**Action required:** Add actual headshot image file to repo and update `src` attribute.

### Partnerships section — `about/credentials.html`

- Section is present but content is a "coming soon" dashed-border placeholder
- Copy from `02_page_copy.md`: "As Palo Alto Networks NextWave Partner status, Ingram Micro distribution, and other formal partnerships become active, they'll be listed here with effective dates."

**Action required:** Populate when partnership agreements are formalized.

---

## "Coming Soon" Sections

| Page | Section | State |
|------|---------|-------|
| `index.html` | Insights preview | Hidden — "Insights coming soon" dashed box |
| `industries/healthcare.html` | Case studies | Dashed-border placeholder: "Case studies coming soon — pending client permission to publish." |
| `industries/financial-services.html` | Case studies | Same placeholder |
| `industries/professional-services.html` | Case studies | Same placeholder |
| `insights/index.html` | All 5 articles | Rendered as dimmed (opacity 0.5) placeholder cards with titles and excerpt text, but no live links — articles not yet written |
| `about/credentials.html` | Partnerships | Dashed-border placeholder |

**Action required for insights:** Remove the "coming soon" dashed box and activate article cards as articles publish. Each card needs a real `href` to the article page. Article pages themselves (`insights/article-slug.html`) are not yet built — the architecture doc lists them as future work.

---

## Legal Review Required

Both legal pages carry `<!-- LEGAL REVIEW REQUIRED — do not deploy without attorney review -->` as the first line of the file.

| File | Notes |
|------|-------|
| `privacy.html` | Standard template. References Formspree, Google Fonts, GitHub Pages as third parties. Includes California consumer rights mention. No CCPA-specific disclosure (Texas-focused firm). Attorney should review for applicability. |
| `terms.html` | Standard template. Texas governing law, Rockwall County jurisdiction. Limitation of liability capped at $100. Disclaimer of warranties in all-caps. Attorney should review disclaimer adequacy, limitation cap, and any engagement-specific terms needed. |

---

## External Links (all pages)

| Destination | Where used | Notes |
|-------------|-----------|-------|
| `https://fonts.googleapis.com` | Every page `<head>` | Google Fonts CDN |
| `https://fonts.gstatic.com` | Every page `<head>` | Google Fonts static assets |
| `https://formspree.io/f/xnnevpwq` | `contact.html` form action | Formspree endpoint — verify endpoint is active |
| `mailto:lk@valotechnologiellc.com` | Every page footer, contact page, privacy, terms | Email address |
| `#` (placeholder) | Every LinkedIn link | **Replace before launch** — see TODO section above |

---

## Verification Notes Preserved

### CMMC — `services/compliance/cmmc.html`

The following HTML comment appears directly above the CMMC phase-in paragraph, verbatim from `02_page_copy.md`:

```html
<!-- VERIFICATION NOTE: Confirm DFARS 252.204-7021 status and current phase-in schedule before launch. Status was evolving through 2025-2026. -->
```

**Action required:** Confirm DFARS 252.204-7021 contractual rule status and current CMMC phase-in schedule as of launch date before publishing.

---

## Items Requiring Valo's Personal Verification Before Launch

These are carried over from the `02_page_copy.md` v2 changelog and are NOT auto-applied:

1. **Years of experience** — Copy reads "approximately a decade." Confirm this matches LinkedIn and is accurate at launch date.
2. **BAA-signing posture** — Copy says "we sign BAAs as a standard part of healthcare engagements." Confirm with a healthcare-side attorney whether vCISO-only engagements legally constitute business associate functions requiring a BAA.
3. **CMMC rule status** — Verify DFARS 252.204-7021 and current phase-in schedule (see verification note above).
4. **Phone number** — Not published on any page. If publishing a phone number, add to `contact.html` direct contact block and footer.

---

## OG Image Note

All pages use `/valo-logo-dark.svg` as the `og:image` and `twitter:image`. SVG files are not reliably rendered by social media platforms (Twitter/X, LinkedIn, Facebook). A PNG fallback (minimum 1200×630px) is strongly recommended for social sharing previews.

---

## Judgment Calls Made During Build

### Shared `styles.css` vs. per-page inline CSS
**Decision:** Extracted all styles into a single `/styles.css` shared across all pages.  
**Rationale:** At 23 pages, per-page inline CSS is unmaintainable. Root-relative `/styles.css` works correctly with GitHub Pages.  
**Tradeoff:** The original `index.html` used inline styles. The new build departs from that approach deliberately.

### `about.html` redirect
**Decision:** Replaced the old single-page `about.html` (which had its own distinct design system — light background, Syne font) with a meta-refresh redirect to `/about/`.  
**Rationale:** The architecture doc specifies `/about/` as the about page. Keeping the old design would create inconsistency.  
**Note:** The old `about.html` content has been overwritten. If needed, it is recoverable from git history.

### Insights article placeholder cards
**Decision:** Rendered the 5 seed article titles as dimmed (opacity: 0.5) placeholder cards with excerpt text, not blank "coming soon" boxes.  
**Rationale:** Shows site shape to visitors and signals active content in progress. The copy doc explicitly provides titles and descriptions for this purpose.  
**Action:** Cards have no `href` links — add links as articles publish.

### `thank-you.html` not built
**Decision:** The Formspree form includes `_next` pointing to `/thank-you.html`, but `thank-you.html` was not listed in the architecture doc's 20-page inventory.  
**Action required:** Create `thank-you.html` before launch, or change the `_next` value in `contact.html` to redirect elsewhere after form submission.

### Active nav link detection
**Decision:** Used JavaScript `pathname.startsWith(href)` to highlight the active nav link on subdirectory pages. Contact and root are special-cased to avoid false positives.  
**Note:** `/contact.html` activates only on `/contact.html` exactly. `/services/compliance/hipaa.html` activates the Services nav link via startsWith `/services/`.

### OG URL paths
**Decision:** Industry and service detail pages use full absolute OG URLs based on the `valotechnologiellc.com` domain.

### `services/compliance/` subdirectory
**Decision:** HIPAA, SOC 2, and CMMC detail pages are nested under `services/compliance/` as the architecture doc specifies.  
**Note:** CSS and image paths use root-relative `/styles.css` and `/logo-*.png` — these resolve correctly regardless of nesting depth on GitHub Pages with a custom domain.

---

## Missing Pages (not in scope for this build)

The following pages are referenced in nav/footer/copy but not built in this pass:

| Page | Referenced from | Notes |
|------|----------------|-------|
| `/thank-you.html` | `contact.html` Formspree `_next` field | Form redirect — needed before form goes live |

Individual article pages under `/insights/` are not built — only the index is. These will be built as articles are written.

---

*End of review.*
