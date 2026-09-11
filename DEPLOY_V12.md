# V12 deployment fix

V10/V11 deployments could leave a browser/CDN with an older `index.html` that referenced hashed entry files which no longer existed. That produced 404 for `/assets/index-*.js` and `/assets/index-*.css`, followed by a white screen.

This package has three protections:

1. The main Vite entry files are emitted as stable `/assets/index.js` and `/assets/index.css`.
2. Vercel rewrites old `/assets/index-<hash>.js` and `.css` requests to the current stable entry files, so stale V10/V11 HTML can recover instead of 404ing.
3. `index.html` is explicitly non-cacheable; hashed secondary assets remain immutable.

IMPORTANT: deploy the **contents of this folder as the Vercel project root**, not the outer ZIP folder name. The ZIP supplied with this fix is already flattened at its root.

Recommended Vercel settings:
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install --no-audit --no-fund`
- Redeploy once with **Clear build cache**.

The `verify-dist.mjs` build step still checks that every asset referenced by `dist/index.html` actually exists.
