# VALO media manifest and film production brief

Status as of November 2026. This file is the record the design brief asks for: what media the site uses, where it came from, and what still has to be produced.

## Honest status

The homepage layout, type, colour system and controls are built. **The service films are not.** Every moving-image slot currently shows a still image (poster preview). No animation is presented as finished cinematic work.

What this means against the brief's acceptance criteria:

| Criterion | Status |
|---|---|
| First frame reads as a composed stage, not a small diagram beside text | Met with a still poster |
| Visitor sees genuine subject/camera/scene change within 5 seconds, without scrolling | **Not met.** Needs Film A–D and the hero montage below |
| No service film is merely a zoom/pan over a still | Met by not animating stills at all |
| Each service has a distinct visual identity | Partly. Assessment and MSP use HTML document compositions; migration image is reused in hero and card 01 |
| Pause control, reduced motion, offscreen/background pause | Built and tested with a stand-in clip; activates automatically once real films are wired in |

## Assets currently used

| File | Used for | Origin / licence | Notes |
|---|---|---|---|
| `cinematic-migration.webp` (1672×941) | Homepage hero poster; service card 01 (tighter crop) | **Unknown.** Added in commit `611312b` (30 Oct 2026). Appears AI-generated. | Confirm origin and right to use before launch. |
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
