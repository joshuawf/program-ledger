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

## Connecting Supabase (so retirements/lineage persist)

By default, without any setup, retirements and lineage links only live in browser memory and reset on refresh. To make them persistent:

1. Create a free account at [supabase.com](https://supabase.com) and a new project.
2. In your Supabase project, go to **SQL Editor → New query**, paste in the contents of `supabase-setup.sql` (included in this repo), and click **Run**. This creates the two tables the dashboard needs.
3. In your Supabase project, go to **Settings → API**. Copy the **Project URL** and the **anon public** key.
4. **For local development:** copy `.env.local.example` to `.env.local` and paste your URL/key in.
5. **For the deployed GitHub Pages site:** go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**, and add two secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   Then re-run the deploy workflow (Actions tab → Deploy to GitHub Pages → Run workflow), or just push any small change to trigger it.

Once connected, the "Manage retirements & lineage" panel will show a green "Connected to Supabase" banner, and anything you retire or link will show up for anyone who opens the dashboard, on any device, from then on.

If these env vars aren't set, the dashboard still works exactly as before — it just falls back to browser-only memory, with an orange warning banner in the management panel.

## Known limitations

- **No persistence without Supabase.** If you skip the setup above, retirements and program-lineage links you record live only in browser memory — they reset on page refresh.
- **"Overall" is a precomputed sum**, not a live aggregate of the three campus tabs — so retiring or relinking a program at one campus won't automatically update the Overall rows.
