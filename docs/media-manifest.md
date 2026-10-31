# VALO media manifest and film production brief

Status as of November 2026. This file is the record the design brief asks for: what media the site uses, where it came from, and what still has to be produced.

## Honest status

**Homepage hero (prototype, Nov 2026):** the hero now runs a live, real-time 3D scene for firewall migration (`stage/`), built in code with three.js. It is interactive (cursor parallax, four clickable chapters) and plays a 22-second, four-shot sequence: scope, stage, cut over, validate. It looks like a stylised 3D product render, not filmed or studio-rendered footage. The other three service scenes (segmentation, risk assessment, MSP) are not built yet.

The hero posters (`media/migration-poster*.webp`) are frames rendered from that scene, so they are original assets with no third-party licence question.

| Criterion | Status |
|---|---|
| First frame reads as a composed stage | Met (live scene, poster fallback) |
| Visitor sees genuine subject/camera/scene change within 5 seconds, without scrolling | Met for the hero on devices with WebGL2; not met for the other three services yet |
| No service film is merely a zoom/pan over a still | Met |
| Each service has a distinct visual identity | Not yet: only the migration scene exists |
| Pause control, reduced motion, offscreen/background pause | Built and tested in headless Chromium; not yet tested on real phones |

## Assets currently used

| File | Used for | Origin / licence | Notes |
|---|---|---|---|
| `media/migration-poster.webp`, `media/migration-poster-portrait.webp` | Hero fallback posters | Rendered from `stage/scene-migration.js` in this repo | Re-render with the capture mode if the scene changes. |
| `cinematic-migration.webp` (1672×941) | Service card 01 (no longer the hero) | **Unknown.** Added in commit `611312b` (30 Oct 2026). Appears AI-generated. | Confirm origin and right to use before launch. |
| `cinematic-segmentation.webp` (1672×941) | Service card 02 | **Unknown**, same commit | Same as above. |
| `cinematic-network.webp` (1672×941) | MSP feature background | **Unknown**, same commit | Generic data-hall image; weak fit for the MSP story. Replace with Film D poster. |
| `me.jpg` | Founder section | Owner-supplied | |
| Certification and partner badges | Footer, procurement | Issuer marks | Existing usage, unchanged. |

HTML compositions (no image files): the findings register (card 03) and the MSP handover package (card 04) use synthetic, labelled-illustrative content taken from the existing site copy. The engineering chapter uses an inline SVG schematic labelled "Illustrative".

Unused files kept in the repo: `service-*.mp4`, `service-*-poster.webp` and `service-films-render.mjs` (diagram-style films from an earlier iteration). They are not loaded by any page. They are fine as technical explainers but do not meet the cinematic bar.

## Files to produce

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
