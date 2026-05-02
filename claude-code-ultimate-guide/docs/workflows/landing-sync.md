# Landing Site Synchronization

Workflow for keeping `cc.bruniaux.com` in sync with the guide after significant changes.

**Landing repo**: `/Users/florianbruniaux/Sites/perso/claude-code-ultimate-guide-landing/`

## Elements to Sync

| Element | Source (guide) | Destination (landing) |
|---------|----------------|----------------------|
| Version | `VERSION` | index.html footer + FAQ |
| Templates count | Count `examples/` files | Badges, title, meta tags |
| Guide lines | `wc -l guide/ultimate-guide.md` | Badges |
| Golden Rules | README.md | index.html section |
| FAQ | README.md | index.html FAQ |

## Sync Triggers

After these modifications, **remember** to update the landing:

1. **Version bump** → Update `VERSION` here, then landing
2. **Templates added/removed** → Recalculate count, update landing
3. **Golden Rules or FAQ modified** → Propagate to landing
4. **Significant guide change** (>100 lines)

## Guide Reader Rebuild (every release)

The landing exposes guide content at `cc.bruniaux.com/guide/`. Content is generated from this repo at build time — **never committed in the landing**.

```bash
# From the landing repo, before each push to main:
cd ../claude-code-ultimate-guide-landing
node scripts/prepare-guide-content.mjs && pnpm build
```

**When to do this**: at every release (`/release patch|minor|major`) so the site reflects the latest guide version.

## Verification Command

```bash
./scripts/check-landing-sync.sh
```

**What the script checks (4 verifications):**

| Check | Source | Comparison |
|-------|--------|-----------|
| Version | `VERSION` | index.html (footer + FAQ) |
| Templates | `find examples/` | index.html + examples.html |
| Quiz questions | `questions.json` | index.html + quiz.html |
| Guide lines | `wc -l ultimate-guide.md` | index.html (tolerance ±500) |

**Expected output (if synced):**
```
=== Landing Site Sync Check ===

1. Version
   Guide:   3.8.1
   Landing: 3.8.1
   OK
...
=== Summary ===
All synced!
```

If mismatch: exit code = number of issues found. Check `landing/CLAUDE.md` for exact line numbers to modify.

## Announcement Banner

File: `src/components/global/AnnouncementBanner.astro` (landing repo)

**Update workflow**:
1. Edit banner text in the component
2. Bump `BANNER_ID` (e.g., `banner-guide-2026-04`) to reset dismissed state for all visitors
3. `pnpm build` + commit + push

**When to update**: major new page, important section added, guide milestone, visible new feature.

## RSS Feed

The landing exposes a unified RSS feed at `/rss.xml`.

**Two merged sources** (sorted by date, 50 entries max):
1. CC releases: auto from `src/data/releases.ts`
2. Guide entries: **manual** in `src/data/rss-entries.ts`

**Available types**: `guide_release | new_page | new_cheatcard | new_whitepaper | new_section`

**When to add a manual entry**:
- New page added to the site (`new_page`)
- New card series (`new_cheatcard`)
- New whitepaper available (`new_whitepaper`)
- Major new section in the guide (`new_section`)

## Sitemap

File: `src/pages/sitemap/index.astro` (landing repo)

**Rule**: add each new page to the sitemap. Sections are in the `sections` array in the Astro frontmatter.
