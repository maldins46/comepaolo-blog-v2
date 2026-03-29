# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Comepaolo is a personal blog built with **Jekyll** (static site generator) and hosted on GitHub Pages. It's a hybrid project with Ruby backend (Jekyll) and vanilla JavaScript frontend.

**Key stack:**
- Jekyll for static site generation
- Bundler for Ruby dependency management
- SASS for styling (modular structure)
- Vanilla JavaScript (theme toggle, PWA, delegated navigation)
- Service Worker for offline support
- GitHub Pages for hosting (via `github-pages` gem)

## Development Commands

```bash
# Install dependencies (required once per new environment)
bundle install

# Run development server (auto-recompiles)
bundle exec jekyll serve

# Build for production (_site/ directory)
bundle exec jekyll build
```

After running `bundle exec jekyll serve`, visit `http://localhost:4000` to preview changes.

## Architecture & Structure

### Layout hierarchy
- **`_layouts/default.html`** — base template; includes nav, footer, PWA manifest, theme script, service worker registration
- **`_layouts/post.html`** — post-specific layout; wraps default; renders featured image (if present) or text header with metadata (author, date, read time, tags)
- **`_layouts/page.html`** — simple page wrapper
- **`_layouts/legal.html`** — legal pages (privacy policies, terms)

### Key components
- **`_includes/nav.html`** — navigation with theme toggle button (`#themeBtn`)
- **`_includes/hero.html`** — homepage hero section with social links
- **`_includes/footer.html`** — footer

### Styling (_sass/)
- **`_variables.scss`** — colors, fonts, spacing (light/dark theme defined via CSS custom properties)
- **`_base.scss`** — resets, html/body theming
- **`_hero.scss`** — homepage hero
- **`_posts.scss`** — post list, featured section, pagination
- **`_article.scss`** — article/post page styles
- **`_nav.scss`** — navigation bar
- **`_responsive.scss`** — mobile breakpoints
- **`assets/css/main.scss`** — main entry point; imports all partials

Theme switching is CSS-based: `data-theme="light"` or `data-theme="dark"` attribute on `<html>` element.

### JavaScript (assets/js/main.js)
- **Theme toggle**: reads/writes `localStorage.theme`, respects system preference as fallback
- **Delegated navigation**: `[data-href]` elements navigate on click (used for post/featured item cards)
- **System theme listener**: updates theme if localStorage is unset and system preference changes

### Service Worker (sw.js)
Registers offline support; see file for cache strategy details.

## Content & Posts

### Writing posts
Create file in `_posts/` with naming: `YYYY-MM-DD-slug.md`

```markdown
---
title: "Post title"
date: 2026-01-01
excerpt: "One or two sentences for post list preview."
tags: [tag1, tag2]
image: https://url.com/image.jpg  # optional — featured image for post hero
featured: true                     # optional — pins to "Featured" section on homepage
---

Post content in Markdown.
```

### Post metadata
- **read time**: auto-calculated as `word_count / 200` (min 1); displayed in article meta bar
- **tags**: link to `/tags/#tag-{slug}` anchors
- **featured**: only one featured post recommended; appears in separate section on homepage

### Homepage (_config.yml)
- `paginate: 6` — posts per page
- `permalink: /blog/:title/` — post URLs as `/blog/{title}/`
- `paginate_path: "/page/:num/"` — pagination paths `/page/2/`, etc.

### Legal pages (legal/)
- Legacy URL redirects via `jekyll-redirect-from` plugin for old app policy links (e.g., `/betAssistPrivacyPolicy` → `/legal/betassist-privacy-policy`)
- Permanent URLs in `/legal/*` to maintain Play Store links across app versions

## Configuration (_config.yml)

Key Jekyll plugins:
- **`jekyll-paginate`** — homepage post pagination
- **`jekyll-redirect-from`** — legacy URL redirects for legal pages

Excluded from build: `prototype.html`, `Gemfile.lock`, `README.md`, `LICENSE`, `original-website/`

## Theme System

Theme is applied three ways (in order of precedence):
1. **localStorage** — user's explicit choice (`localStorage.setItem('theme', 'dark')`)
2. **System preference** — `window.matchMedia('(prefers-color-scheme: dark)')` if no localStorage
3. **Default** — light theme in HTML template

CSS custom properties for colors are defined in `_variables.scss` under `html[data-theme="light"]` and `html[data-theme="dark"]` selectors. All color rules use these variables.

When modifying theme colors:
- Update `_variables.scss` for both light and dark variants
- No inline colors; always use CSS variables
- Theme button tooltip shows next theme ("Light" or "Dark")

## Common Workflows

### Adding a new post
1. Create `_posts/YYYY-MM-DD-slug.md`
2. Add frontmatter (title, date, excerpt, tags, optional image/featured)
3. Write content in Markdown
4. Run `bundle exec jekyll serve` to preview
5. Commit & push

### Updating styling
1. Edit relevant `.scss` file in `_sass/`
2. Changes auto-compile via `bundle exec jekyll serve`
3. Refresh browser to see changes

### Adding a new page
1. Create `.md` or `.html` file in root
2. Add frontmatter with layout (default, page, or custom)
3. Appears at `/{filename}/`

### Changing theme colors
1. Open `_sass/_variables.scss`
2. Update colors under `html[data-theme="light"]` and `html[data-theme="dark"]` blocks
3. Ensure all color properties are CSS custom properties (e.g., `--color-text: #...`)

## Git & Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) for all commits. This keeps history clean and enables automated changelog generation.

**Format:** `<type>(<scope>): <description>`

**Common types:**
- `feat:` — new feature (e.g., `feat(posts): add reading time estimate`)
- `fix:` — bug fix (e.g., `fix(theme): correct dark mode color contrast`)
- `style:` — styling changes (e.g., `style(nav): update spacing`)
- `refactor:` — code refactoring without feature change
- `docs:` — documentation updates
- `chore:` — build, dependencies, config changes (e.g., `chore: exclude CLAUDE.md from build`)

**Examples:**
```
feat(post): add featured posts section to homepage
fix(theme-toggle): persist user theme preference
docs: update README with new deployment steps
chore(deps): update jekyll to 4.2
```

## Build & Deploy

- **GitHub Pages** deploys `main` branch automatically
- `CNAME` file points to `riccardomaldini.it`
- Build artifacts in `_site/` (git-ignored)
- `.jekyll-cache/`, `.sass-cache/` are auto-ignored

## Notes on Gems & Dependencies

- `github-pages` gem includes Jekyll + common plugins (updates to match GitHub Pages versions)
- `jekyll-paginate` and `jekyll-redirect-from` are explicit dependencies in `Gemfile`
- Run `bundle install` after modifying `Gemfile`
- `Gemfile.lock` is committed; use it for consistent builds

## PWA & Offline Support

- `manifest.json` — installability metadata
- `sw.js` — service worker (registers on page load via `default.html` script)
- `offline.html` — fallback page when offline (if implemented in sw.js)
- Apple PWA: uses `apple-touch-icon.png`, `apple-mobile-web-app-*` meta tags

## Performance & SEO

- **Open Graph** meta tags — post image, title, excerpt (auto-populated in `default.html`)
- **Twitter Card** — large image card with post metadata
- **RSS feed** (`feed.xml`) — latest 10 posts
- **Favicons** — SVG + PNG sets in `assets/favicons/`

## Editing Guidelines

- **Layouts**: Avoid duplicating logic; use Jekyll `{% if %}` for conditional blocks (e.g., featured image vs. text header in post layout)
- **SASS**: Keep partials focused (one component per file); use variables for colors/spacing
- **JavaScript**: Vanilla JS only; no dependencies; use event delegation for dynamic content (see main.js example)
- **Posts**: Always include `excerpt` for SEO and post list previews
- **Images**: Use external URLs for featured images to avoid bloating repo; local images in `assets/article_images/` if needed
