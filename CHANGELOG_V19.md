# V19 – Family order in member details & stale-browser recovery

## 1. Member detail – children order
- Children in the member detail panel now use the same canonical family comparator as Layout Engine V4.
- Ordering priority: explicit `orderInFamily` → meaningful `orderTitle` → `createdAt` → stable fallback.
- When children are grouped by spouse/mother, each group is sorted by the same rule.
- FamilyTreeBookView now follows the same canonical ordering so tree and detail views do not contradict each other.

## 2. Browser cache / old-version recovery
- Removed the previous Vercel asset-hash rewrites. Vite hashed JS/CSS files must be served directly from `dist/assets`.
- Added `/public/version.json` with `Cache-Control: no-store`.
- Added a lightweight startup version check. If an old bundle is still retained by a browser, it performs one automatic reload to fetch the current deployment.
- `index.html` is explicitly `no-store`; hashed assets remain immutable for fast loading.
- No Service Worker or `Clear-Site-Data` was added, so Supabase auth/local application data is not wiped.
