# Pocket Outside

Write one sentence about what you want to notice outdoors. Choose your time,
surroundings and whether to stay in one spot. A local open-weight model picks
one short activity from an original catalog of seven cards. Read it, pocket
your phone, and do the activity.

The model matches language; code enforces constraints. The app never generates
routes, identifies wildlife, or checks weather and path safety.

## Demo

Watch the [34-second guided demo](assets/demo.mp4). It uses actual desktop
browser captures, including a new request after the local server was stopped.
It does not depict an outdoor field activity. The app and this repository were
created on 6 October 2026 for Hacktoberfest Week 1: Touch Grass.

## Run

The repository includes the necessary model and browser runtime assets.
Python 3 is sufficient to serve it; no package install or API key is needed.

```sh
python3 -B serve.py --port 8127
```

Open http://127.0.0.1:8127/. Click **Prepare local AI** once. The first
preparation loads about 46 MB of app, runtime and model assets. Choose only
surroundings that are actually present, then ask for an activity.

A service worker caches only the public application assets. Once the page
says **Assets cached for offline reload**, the app can reload and prepare the
model while its host is unavailable. An initial visit still needs access to
the host. Browsers may clear cached assets or restrict storage.

This is a static application. To deploy, publish this directory on any HTTPS
static host while preserving relative paths. It also works under a URL
subdirectory. Do not use file://; browser modules and service workers require
HTTP on localhost or HTTPS elsewhere.

## AI and constraints

- Model: Xenova/all-MiniLM-L6-v2, q8 ONNX, Apache 2.0.
- Revision: 751bff37182d3f1213fa05d7196b954e230abad9.
- Runtime: Transformers.js 3.8.1 and ONNX Runtime on WASM, one CPU thread.
- Mean pooling and normalization produce 384-dimensional embeddings.
- Cosine similarity ranks only cards that fit the user's time, surroundings
  and one-spot choice. Similarity is not a confidence or safety score.
- Responses are existing written cards. The model cannot add instructions.
- If inputs change during matching, the old result is discarded.

Your sentence and selections stay in memory. There is no GPS, account,
analytics, input log, stored activity history, remote AI request or API key.
The host receives ordinary requests for public assets, without the sentence.
Code and model assets can remain in the browser's app cache.

## Verification

```sh
node --test tests/core.test.mjs
```

The dependency-free tests check combined constraints, rejection of malformed
inputs/model data, deterministic ties and retrieval only from the catalog.

After loading the model, open **How the AI chooses** and run the browser
verification. It exercises the real model, embeddings and three semantic
regression examples. These examples are a small demonstration set, not a
general accuracy benchmark.

For a meaningful offline check: prepare the model online, confirm the cache
status, stop the local server, reload the page, prepare the model again, and
request a new card. Reconnect/restart the server before testing new builds.
A service worker update may require another reload to show the new shell.

## Reproduce the bundled assets

```sh
python3 -B fetch_assets.py
```

This downloads only the pinned assets and their license/provenance material
inside this directory. Existing assets must match their recorded SHA-256
hashes. No global model cache is used. The initial provenance captures the
exact source bytes and the resulting local bundle bytes.

## Limits

Seven English activity cards cannot express every interest or outdoor
situation. English semantic matches have been demonstrated; other languages
have not been evaluated. No outdoor human field study or wellbeing effect
has been measured. No weather, air quality, accessibility or route condition
is verified. Choose a place you already know is appropriate.

Cold model initialization uses more time and energy than retrieving the
next card. It runs on a CPU but has not been benchmarked on mobile hardware.

## Credits and license

Original app code is MIT licensed. Bundled dependencies and open model weights
retain their own licenses. See LICENSE, NOTICE, the model card, and the
included dependency license files. Codex assisted the implementation and
verification. This is a new project started on 6 October 2026.
