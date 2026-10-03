# Putting Curiomatic online

Curiomatic is a folder of plain files (`apps/curiosities/`) with no build step, so any free static host can serve it. Once it is online it can be installed like an app, and it keeps working with no connection (`sw.js`, `offline.js`, `manifest.webmanifest`). People's work stays in their own browser and in `.curio` files they save. Nothing is uploaded.

Before anything goes online, run this from `apps/curiosities/`:

    node core/site-check.js

It checks that every file the page loads is committed, because a host only serves committed files.

The repository is public, so both choices below are free. Jeremy picks one.

## Choice A: GitHub Pages (simplest, nothing new to sign up for)

1. Merge the app into `main` (the beta branch, `curiosities-beta`, holds everything; Jeremy decides when).
2. On GitHub: the repository's **Settings > Pages**. Under "Build and deployment", pick **Deploy from a branch**, branch `main`, folder `/ (root)`, and press **Save**.
3. After a minute or two the app is at
   `https://jeremybelzer-web.github.io/wish-myself-well/apps/curiosities/`

Good to know: the whole repository becomes browsable as a website, including the show's `web/`, `bible/` and `memos/` folders. If that matters, choose B.

## Choice B: Cloudflare Pages (the plan's recommendation; only the app goes online)

1. Make a free Cloudflare account and open **Workers & Pages > Create > Pages > Connect to Git**. Pick `jeremybelzer-web/wish-myself-well`.
2. Production branch: `main` (or `curiosities-beta` to put the beta online before merging). Framework preset: **None**. Build command: leave empty. Build output directory: `apps/curiosities`.
3. Press **Save and Deploy**. The app is at `https://<name-you-pick>.pages.dev`. A custom domain costs about $12 a year and is optional.

Every push to that branch updates the site by itself. Each branch also gets its own preview address, which is handy for showing Sharani a branch.

## Until then

The whole app opens from one private link, rebuilt from the beta with `docs/beta/one-page/bundle.js`. Jeremy shares it from that page's Share menu.
