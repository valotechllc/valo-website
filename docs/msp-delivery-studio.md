# MSP cinematic revision — November 7, 2026

Only the MSP scene and homepage MSP feature are redesigned. The migration, segmentation and assessment scene files, their media, the shared stage engine, shared styles and shared homepage behavior remain byte-identical. `node docs/check-msp-scope.mjs 48fc758` enforces that boundary. The two hero entry/import cache queries only refresh the MSP dependency.

The original procedural delivery folio opens to reveal a recessed specialist engineering core and a separate validation layer. It closes under the MSP identity and connects to client folios. The visual is illustrative: it contains no customer data, vendor hardware model, SOC representation or SLA claim.

The revision replaces the previous text-heavy document panels and raised platform with machined edges, copper interconnects, engraved marks, a restrained validation sequence, moving signal pulses and four deliberate camera moves. The homepage feature is a full-bleed stage with an editorial overlay and chapter strip. Portrait framing places the film above the copy on phones.

- `stage/scene-msp.js`: original 24-second, four-shot Three.js scene for the existing hero.
- `media/msp-portfolio.mp4`: 1920 × 1080, 24 fps, silent H.264/yuv420p, 24 seconds.
- `media/msp-portfolio-mobile.mp4`: separately framed 800 × 1100 film, same scene and duration.
- `media/msp-feature.webp`, `media/msp-portfolio-mobile.webp`: film posters at 2.2 seconds.
- `msp-studio.css` and `stage/msp-feature.js`: layout, playback and chapter controls scoped to `#msp`.

The feature uses rendered moving geometry so it remains animated without WebGL. It honors reduced motion, pauses outside the film viewport and in background tabs, and remembers a separate MSP pause preference. Chapter buttons seek to the corresponding shot. Heading, service copy and CTA remain accessible HTML.

## Rebuild the MSP films

Node requires `@napi-rs/canvas`; Python requires `moderngl`, `numpy`, `Pillow`; FFmpeg and an EGL context are needed. The runtime canvas package can be located through `CODEX_PRIMARY_RUNTIME_NODE_MODULES`.

```sh
node docs/export-msp-scene.mjs /absolute/path/msp-frames.json film
python docs/render-msp-film.py /absolute/path/msp-frames.json media --film
python docs/render-msp-film.py /absolute/path/msp-frames.json media --film --mobile
ffmpeg -ss 2.2 -i media/msp-portfolio.mp4 -frames:v 1 -c:v libwebp -quality 88 media/msp-feature.webp
ffmpeg -ss 2.2 -i media/msp-portfolio-mobile.mp4 -frames:v 1 -c:v libwebp -quality 88 media/msp-portfolio-mobile.webp
```

The offline renderer uses the scene's geometry, textures, animated world transforms and camera poses. It adds Cook–Torrance metal/roughness shading, studio reflections, shadow mapping, four-sample antialiasing, a blurred reflective floor, bloom and a film grade. It applies an MSP-specific desktop lens offset and portrait camera framing; its lighting approximation differs from the shared Three.js environment. This is original rendered motion rather than stock footage or animated stills.

Validation: protected-file/markup guard; finite transforms and cameras for all 576 frames; syntax checks; H.264/yuv420p/duration checks; browser playback, pause/resume and chapter seeking; responsive checks at 320, 375, 390, 430 and 768 px. Actual phone hardware and the native WebGL hero path cannot be exercised in this cloud browser; the independent video feature is exercised without WebGL.
