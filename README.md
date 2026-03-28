# Comepaolo

Personal blog by Riccardo Maldini — built with Jekyll, hosted on GitHub Pages.

## Stack

- **Jekyll** — static site generator
- **GitHub Pages** — hosting (via `github-pages` gem)
- **jekyll-paginate** — pagination
- **jekyll-redirect-from** — legacy URL redirects (for Play Store app policy links)
- **Outfit + JetBrains Mono** — Google Fonts
- Light/dark theme with `localStorage` persistence
- RSS feed with latest 10 posts

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

## Features

- **Featured posts** — mark posts with `featured: true` to pin to homepage
- **RSS feed** — `/feed.xml` with latest 10 posts
- **Legal pages** — `/legal/*` with legacy URL redirects for app privacy policies
- **About page** — `/about/` with bio and social links
- **Hero social links** — GitHub, LinkedIn, Email, and CV download (latest MaldiniCV release)

## Project structure

```
_layouts/       # default, post, page, legal
_includes/      # nav, hero, footer
_sass/          # SCSS partials (variables, components, legal)
assets/
  css/main.scss # imports all partials
  js/main.js    # theme toggle + persist preference
  images/       # static images
  favicons/     # favicon set
  article_images/ # per-post cover images
_posts/         # blog posts (8 sample posts included)
legal/          # legal pages (privacy policies, terms)
about.md        # about page
index.html      # homepage with hero + post list + pagination
feed.xml        # RSS feed
_config.yml
```

## Legal & Privacy

This site includes privacy policies and terms for multiple apps:
- BetAssist (Android app)
- Iello (educational app)
- MotoAssist (racing stats app)
- Solaria (astronomy app)
- Website privacy policy (GDPR-compliant)

Legal pages at `/legal/*` have permanent URLs and legacy redirects (e.g. `/betAssistPrivacyPolicy` → `/legal/betassist-privacy-policy`) to support existing app links on the Play Store.
