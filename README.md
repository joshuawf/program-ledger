# Program Ledger

An interactive dashboard tracking enrollment and graduation health across SCAD's degree programs — built with React + Vite + Tailwind.

## Run it locally

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

## Deploy to GitHub Pages

This repo already includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys automatically on every push to `main`. One-time setup after you push this repo to GitHub:

1. Go to your repo on GitHub → **Settings** → **Pages**.
2. Under "Build and deployment", set **Source** to **GitHub Actions**.
3. Push a commit to `main` (or click **Run workflow** under the Actions tab).
4. After the workflow finishes (usually ~1 minute), your site will be live at:
   `https://<your-username>.github.io/<repo-name>/`

You can watch the build progress under the **Actions** tab of your repo.

## Project structure

```
├── index.html              Vite entry HTML
├── src/
│   ├── main.jsx             Mounts the React app
│   ├── ProgramLedger.jsx    The dashboard component (all data + logic)
│   └── index.css            Tailwind directives
├── vite.config.js          Uses a relative base path — works at any Pages URL
├── tailwind.config.js
├── postcss.config.js
└── .github/workflows/deploy.yml   Build + deploy automation
```

## Updating the data

The dataset lives as a single `RAW` array at the top of `src/ProgramLedger.jsx`. It was generated from SCAD's enrollment and graduation workbooks (Winter 2021–2025 enrollment; 2021–2025 graduation), plus an inferred "founding quarter" per program/degree/location based on the first non-zero enrollment quarter on record back to Fall 2010.

## Known limitations

- **No persistence.** Retirements and program-lineage links you record in the "Manage retirements & lineage" panel live only in browser memory — they reset on page refresh. Making these durable would require a small backend or database.
- **"Overall" is a precomputed sum**, not a live aggregate of the three campus tabs — so retiring or relinking a program at one campus won't automatically update the Overall rows.
