# SafeVio

Industrial AI safety monitoring dashboard for edge computer-vision pipelines.

## Development

Requires Node.js ≥ 18 and npm.

```sh
git clone <this-repository-url>
cd pixel-perfect
npm install --legacy-peer-deps
npm run dev
```

## Build

```sh
npm run build
# Output: dist/
```

## Deploy to Render (Static Site)

1. Push to GitHub
2. Create a new **Static Site** on [render.com](https://render.com)
3. Set **Build Command**: `npm install --legacy-peer-deps && npm run build`
4. Set **Publish Directory**: `dist`
5. Add a **Redirect Rule**: `/*` → `/index.html` (status 200) for client-side routing

Or use the included `render.yaml` for automatic configuration.
