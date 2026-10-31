# VALO media manifest and film production brief

Status as of November 2026. This file is the record the design brief asks for: what media the site uses, where it came from, and what still has to be produced.

## Honest status

**Homepage hero (Nov 2026):** the hero runs four live, real-time 3D service scenes built in code with three.js (`stage/`): firewall migration, network segmentation, risk assessment and MSP white-label. Each is a 22-second, four-shot sequence with its own subject and story. The hero rotates through them Shield-style and stops rotating once the visitor clicks a service or step, or moves keyboard focus into the controls. Interaction: cursor parallax, service tabs, step buttons, and HTML labels projected from the scenes.

They look like stylised 3D product renders, not filmed or studio-rendered footage. Higher-end footage would still need a 3D studio or motion designer (brief below).

| Criterion | Status |
|---|---|
| First frame reads as a composed stage | Met (live scene, poster fallback) |
| Visitor sees genuine subject/camera/scene change within 5 seconds, without scrolling | Met on devices with WebGL2 |
| No service film is merely a zoom/pan over a still | Met |
| Each service has a distinct visual identity | Met: hardware/rack aisle, architectural zones, evidence table, hub and clients |
| Pause control, reduced motion, offscreen/background pause | Built and tested in headless Chromium; not yet tested on real phones |

## Assets currently used

| File | Used for | Origin / licence | Notes |
|---|---|---|---|
| `media/migration-poster.webp`, `media/migration-poster-portrait.webp` | Hero fallback posters | Rendered from `stage/scene-migration.js` | Re-render with `?capture` if the scene changes. |
| `media/card-migration.webp`, `card-segmentation.webp`, `card-assessment.webp`, `card-msp.webp` | Service gallery cards | Rendered from the four `stage/scene-*.js` files | Same. |
| `media/msp-feature.webp` | MSP feature background | Rendered from `stage/scene-msp.js` | Same. |
| `me.jpg` | Founder section | Owner-supplied | |
| Certification and partner badges | Footer, procurement | Issuer marks | Existing usage, unchanged. |

All in-scene text (config extracts, findings, the roadmap, the handover document, "YOUR MSP") is synthetic and labelled illustrative where it could be mistaken for real data. The engineering chapter's inline SVG is labelled "Illustrative".

No longer used by any page, kept in the repo: `cinematic-migration.webp`, `cinematic-segmentation.webp`, `cinematic-network.webp` (origin and licence unknown, added in commit `611312b`), and `service-*.mp4`, `service-*-poster.webp`, `service-films-render.mjs` (earlier diagram films). They can be deleted.

## If you commission filmed or studio-rendered footage later

### Files to produce

| File | Size target | Notes |
|---|---|---|
| `hero-desktop.mp4` + `hero-poster.webp` | 1920 px wide, ≤ 5 MB | Montage: strongest 3–5 s of each service film |
| `hero-mobile.mp4` | 720 px wide, portrait-aware crop, ≤ 2.5 MB | Separately framed, not a centre crop of desktop |
| `migration-desktop.mp4` / `-mobile.mp4` + poster | as above | Film A |
| `segmentation-desktop.mp4` / `-mobile.mp4` + poster | as above | Film B |
| `assessment-desktop.mp4` / `-mobile.mp4` + poster | as above | Film C |
| `msp-desktop.mp4` / `-mobile.mp4` + poster | as above | Film D |

All films: silent, 18–24 s seamless loop, 24 or 30 fps, H.264 MP4, no text burned in (all copy stays in HTML), negative space kept for the headline. For every file record origin, licence or permission, dimensions, duration and final size in the table above.

## Shot direction (summary of the brief, section 12)

One visual system across all four: dark navy environment, believable materials and lighting, restrained orange accent light, controlled camera moves, no glowing particle fields, no SOC dashboards, no client data.

- **Film A: Firewall migration.** Macro move over a modern, vendor-neutral gateway with the current path subtly marked → staged replacement and limited policy-mapping annotation → camera tracks traffic shifting in a planned sequence (no zero-downtime claim) → validation and a clean handover frame that loops back.
- **Film B: Network segmentation.** One connected environment (workforce, applications, guest/devices) → camera pulls back as groups separate into zones → a few permitted paths, one blocked path stopping quietly at a boundary → settled, controlled network.
- **Film C: Risk assessment.** Deliberate scan of a believable configuration/network model revealing a few exposures → findings become evidence objects → arranged by priority → resolve into a remediation roadmap that looks like a real deliverable. Engineer-led, not "AI detection".
- **Film D: White-label MSP engineering.** MSP as the customer-facing hub of several client environments → a scoped work package enters → configuration, validation, documentation → completed handover returned to the MSP, relationship intact.

## Wiring a finished film in

1. Add the files to the repo root (or a `/media/` folder).
2. On the stage element in `index.html`, add the attributes and replace the poster `src`:
   ```html
   <section class="h-hero" ... data-film-desktop="/media/hero-desktop.mp4" data-film-mobile="/media/hero-mobile.mp4">
   ```
   The MSP section (`#msp`) accepts the same attributes for Film D.
3. `home.js` then attaches a muted, looping, inline `<video>` over the poster, shows the "Pause motion" control, remembers the visitor's choice, starts paused for reduced-motion users, and pauses when the stage is offscreen or the tab is hidden.
4. Change `data-media-status="poster-preview"` to `"film"` and update the table above.
