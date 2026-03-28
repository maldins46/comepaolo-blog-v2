# Comepaolo

Personal blog by Riccardo Maldini — built with Jekyll, hosted on GitHub Pages.

## Stack

- **Jekyll** — static site generator
- **GitHub Pages** — hosting (via `github-pages` gem)
- **jekyll-paginate** — pagination
- **Outfit + JetBrains Mono** — Google Fonts
- Light/dark theme with `localStorage` persistence

## Local development

```bash
bundle install
bundle exec jekyll serve
```

Then visit `http://localhost:4000`.

## Writing a post

Create a file in `_posts/` following the naming convention `YYYY-MM-DD-slug.md`:

```markdown
---
title: "Post title"
date: 2026-01-01
excerpt: "One or two sentences shown in the post list."
tags: [tag1, tag2]
image: https://... # optional cover image URL
featured: true     # optional — pins post to the Featured section
---

Post content in Markdown.
```

## Project structure

```
_layouts/       # default, post, page
_includes/      # nav, hero, footer
_sass/          # SCSS partials (variables, components)
assets/
  css/main.scss # imports all partials
  js/main.js    # theme toggle
_posts/         # blog posts
about.md        # about page
index.html      # homepage with hero + post list
_config.yml
```
