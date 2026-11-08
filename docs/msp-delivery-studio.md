# MSP kinetic film — November 7, 2026

This revision addresses the slow pacing and amateur appearance of the previous 24-second film. The edit is rebuilt as twelve seconds of continuous work, rather than accelerating the previous film. There are four three-second shots: scope, engineer, validate, hand over. Modules arrive in the first second, routed work moves through them, a validation sweep completes, and the identity layer closes over the work before handover to client deliveries.

The original illustrative service cartridges show migration, policy review and remediation. An open identity frame reveals the engineering behind the MSP brand. There are no oversized blank cover panels, fake dashboards, vendor hardware models, customer information or new service claims.

The migration, segmentation and assessment scenes and assets, shared stage engine, shared styles and shared homepage behavior remain byte-identical. Run `node docs/check-msp-scope.mjs 48fc758` or use `5df62e4` as the baseline. Only the MSP hero caption and dependency cache query change inside the shared hero entry.

## Production

- `stage/scene-msp.js`: the original 12-second Three.js geometry and deterministic choreography.
- `docs/export-msp-scene.mjs`: exports the actual geometry, textures, transforms and camera poses at 24 fps.
- `docs/render-msp-blender.py`: Blender Cycles studio renderer, real area lights, physical materials, contact shadows, satin floor reflections, depth of field and AgX color management. Adaptive sampling uses 12 samples maximum. A render border omits the desktop copy-safe region and masked floor edge.
- `docs/denoise-msp-frame.py`: persistent Intel Open Image Denoise process, kept separate from Blender's runtime libraries.
- `docs/frame-msp-mobile.py`: a portrait edit with a crop chosen per shot and padding in the site background color; it retains all the original moving geometry.
- Desktop film: 1280 × 720, 24 fps, 12 seconds, silent H.264/yuv420p.
- Portrait film: 640 × 880, 24 fps, same edit and duration.

Blender 4.3+, FFmpeg, Node with `@napi-rs/canvas`, and Python with `oidn`, `numpy` and `Pillow` are required. If the denoiser dependencies are outside the default Python installation, set `MSP_OIDN_DIR` to their directory. `MSP_DENOISE_PYTHON` optionally selects the external Python executable.

```sh
node docs/export-msp-scene.mjs /absolute/path/msp-frames.json film
blender -b -t 8 --python-exit-code 1 -P docs/render-msp-blender.py -- /absolute/path/msp-frames.json /absolute/output --resume
python docs/frame-msp-mobile.py /absolute/output/msp-portfolio.mp4 media/msp-portfolio-mobile.mp4
```

Copy the desktop film from the output directory into `media/`. Extract the two WebP posters at 1.7 seconds with FFmpeg. The renderer's `--stills --draft` flags use four review frames; `--test` restricts output to the first frame. Each production PNG is retained so an interrupted render can resume. The old EGL renderer remains available for lower-cost motion proofs; it is not used for the final studio films.

The browser controller derives chapter seeking from the actual video duration. Motion pauses offscreen, in background tabs and for reduced-motion users; a local MSP pause preference is retained. The feature uses a compact desktop stage and a portrait layout through 900 px, chapter selection that returns the film into view on narrow screens, with readable copy below the film on phones and tablets.

Validation covers protected files/markup, all 288 transforms/cameras, syntax, media duration/codec/frame rate, pause/resume, chapter selection, and responsive layouts at 320, 375, 390, 430 and 768 px. The cloud browser has no WebGL2; the independent video feature is testable here, while native hero rendering and physical phone hardware remain outside this browser verification.
