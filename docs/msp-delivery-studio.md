# MSP delivery studio — November 7, 2026

Only the MSP scene and homepage MSP feature are changed. The migration, segmentation and assessment scenes, their media, shared stage engine, shared styles and shared homepage behavior are preserved. `docs/check-msp-scope.mjs 48fc758` enforces this boundary.

The MSP visual is an original procedural delivery portfolio. The MSP cover opens to expose scoped responsibilities, specialist configuration, validation evidence and a handover record. It closes under the MSP identity and connects to client environments. All in-scene records are synthetic.

- `stage/scene-msp.js`: live 24-second, four-shot scene for the existing hero. No vendor hardware, customer data or new service claims.
- `media/msp-portfolio.mp4`: 1280 × 960, 24 fps, H.264, silent, 24 seconds.
- `media/msp-portfolio-mobile.mp4`: separately framed 720 × 900 delivery, same scene and duration.
- `media/msp-feature.webp`, `media/msp-portfolio-mobile.webp`: posters from the film at 2.2 seconds.
- `msp-studio.css` and `stage/msp-feature.js`: styles and playback/chapter controls scoped to `#msp`.

The feature uses authored video so it remains animated without WebGL. It honors reduced motion, pauses outside the film viewport or in background tabs, and keeps a separate MSP pause preference. Chapter buttons seek to the corresponding shot. Text, CTA and service descriptions are HTML.

## Rebuild only the MSP films

Node requires `@napi-rs/canvas`; Python requires `moderngl`, `numpy`, `Pillow`; FFmpeg and an EGL software/hardware context are needed. The runtime canvas package can be located through `CODEX_PRIMARY_RUNTIME_NODE_MODULES`.

```sh
node docs/export-msp-scene.mjs /absolute/path/msp-frames.json film
python docs/render-msp-film.py /absolute/path/msp-frames.json media --film
python docs/render-msp-film.py /absolute/path/msp-frames.json media --film --mobile
```

The offline renderer uses the scene's actual geometry, document textures, animated world transforms and camera poses. Its lighting approximation differs from Three.js's environment lighting. Output is original rendered material, not stock footage or animated still images.

Validation: protected-file/markup guard; finite transforms/cameras for all 576 frames; syntax checks; H.264/yuv420p/duration checks; browser playback, pause/resume and chapter seeking; responsive viewport checks at 320, 375, 390, 430 and 768 px. Actual phone hardware and the WebGL hero path have not been exercised in this browser environment; the video feature was exercised without WebGL.
