# Portfolio migration

The current Notion powered site is preserved at the `notion-site-2026-10-27` tag and `archive/notion-site-2026-10-27` branch. The new portfolio is developed on `portfolio-v2`. Production remains on `main` until the new site is reviewed and published.

## Content

- `data/portfolio-content.json` is the versioned, static snapshot used by the site. It contains 81 pages and 678 media references, with no expiring Notion file URLs or API token.
- The Works index contains 69 entries. A work can have several practice tags, so it appears under every relevant filter. One secondary presentation of the same sculpture links from the primary work page instead of appearing as a duplicate card.
- `scripts/export-notion-content.mjs` creates the snapshot from the existing Notion integration. Use `--media` to download media, `--media-only` to retry downloads from an existing export, or `--sanitize-only` to regenerate the versioned snapshot from the ignored raw export.
- `scripts/audit-portfolio.mjs` reports page, media and failure counts.

## Media

- 43 existing Imgur images use their existing URLs.
- Two YouTube videos use their existing URLs.
- 628 media references were copied locally to `public/media/` and originals to `.media-source/`. Both directories are ignored by Git. Duplicate references and optimization mean the versioned snapshot uses 523 distinct files totaling about 151 MiB. The directory also contains superseded files from an early export run; upload only paths referenced in the snapshot.
- Five legacy external images could not be fetched: two in *Night Watch Bull Run Edition*, and one each in *In Between Sips*, *Bifokalus* and *Passage*. Their sources returned HTTP 403 or 404. Their positions are shown as unavailable media in the portfolio.
- For deployment on Vercel, connect a public Blob store to the project and pull `BLOB_READ_WRITE_TOKEN` into `.env.local`. Run `node scripts/upload-vercel-media.mjs --dry-run` to audit, then `node scripts/upload-vercel-media.mjs` to upload only referenced files. The script resumes safely if interrupted and writes the public origin to `data/media-origin.json`. Commit that file with the site. `NEXT_PUBLIC_MEDIA_BASE_URL` can override the origin if another object store is used. An empty origin uses local `public/media/` for preview.

The exported snapshot does not change when Notion is edited. A future selective Notion publishing workflow can be added separately.
