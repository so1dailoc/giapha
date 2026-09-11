# V11 deployment fix — blank screen / 404 hashed assets

## Root cause
The browser is receiving an `index.html` that references hashed Vite assets such as
`/assets/index-Cr81pmF1.js` and `/assets/index-DeXrZztZ.css`, but those exact files are
not present in the deployed `dist/assets/`. Vercel therefore returns a 404 text response,
which the browser rejects as CSS/JS and React never starts.

This is a deployment artifact/version mismatch, not a React component error.

## Changes in this build
- Explicit Vite framework/build/output settings in `vercel.json`.
- `base: '/'` in Vite.
- `index.html` is never long-cacheable, preventing an old HTML shell from surviving a deployment.
- Hashed `/assets/*` remain immutable and cacheable.
- `npm run build` now runs `scripts/verify-dist.mjs` after Vite. Deployment fails instead of publishing a broken HTML→asset reference.

## Deploy
1. Replace the deployed project with this source tree.
2. On Vercel, use **Redeploy** with **Clear build cache** for the first deployment of this version.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. After deployment, hard-refresh the browser once (Ctrl+Shift+R).

Do not upload a pre-built `dist` from an older version. Let Vercel build this source.
