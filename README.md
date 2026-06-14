# LVLV — Wedding Photo Gallery

A minimalist, glassy, black-and-white password-gated photo gallery for the LVLV wedding.
Plain HTML/CSS/JS — no framework, no build step. Hosted on GitHub Pages from `docs/`.

- Enter password **`LVLV`** (case-insensitive) to view the gallery.
- Masonry grid of optimized thumbnails (`docs/thumbs/`), lightbox loads larger
  versions (`docs/web/`) with swipe/arrow navigation.
- "Download all" links to a GitHub Release asset containing the full-resolution
  originals as a single ZIP (~736 MB) — originals are **not** stored in this repo
  or served by Pages.

## Layout

```
docs/                 GitHub Pages source (index.html, styles.css, app.js, manifest.json,
                      thumbs/, web/)
build/build-images.sh regenerates docs/thumbs, docs/web, and docs/manifest.json
                      from "LVLV KAZAS/" (git-ignored originals)
dist/                 git-ignored; holds LVLV-originals.zip for the GitHub Release
```

## Manual deploy steps (one-time)

These steps require GitHub authentication and have not been run yet.

1. **Authenticate `gh`** (if not already):
   ```sh
   gh auth login
   ```

2. **Push the repo:**
   ```sh
   git push -u origin main
   ```

3. **Enable GitHub Pages from `/docs` on `main`:**
   ```sh
   gh api -X POST repos/HenrijsFilips/turbo-octo-guacamole/pages \
     -f source[branch]=main -f source[path]=/docs
   ```
   (or via repo Settings → Pages in the GitHub UI). The site will be live at:
   `https://henrijsfilips.github.io/turbo-octo-guacamole/`

4. **Create the `v1` release with the originals ZIP:**
   ```sh
   gh release create v1 dist/LVLV-originals.zip \
     -t "LVLV Originals" -n "Full-resolution wedding photos"
   ```
   The "Download all" button in `docs/index.html` / `docs/app.js` is **already wired**
   to:
   `https://github.com/HenrijsFilips/turbo-octo-guacamole/releases/download/v1/LVLV-originals.zip`
   No code change is needed after creating the release — the URL will resolve as soon
   as the `v1` release with `LVLV-originals.zip` exists.

## Regenerating image derivatives

```sh
bash build/build-images.sh
```

Reads `LVLV KAZAS/LVLV-1.jpg` … `LVLV-75.jpg` and writes `docs/thumbs/`, `docs/web/`,
and `docs/manifest.json`.

## Notes

- The password gate is client-side only — a light deterrent, not real security.
  Anyone who knows/guesses the file URLs under `docs/thumbs/` or `docs/web/` could
  load images directly. Acceptable for a family wedding gallery.
