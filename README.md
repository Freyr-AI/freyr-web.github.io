# Freyr AI Web

Freyr AI company website built with plain HTML, CSS, and JavaScript. The
deployed website has no framework, npm runtime, backend, database, or API.
GitHub Actions uses a small Python build script to turn Markdown news files into
static HTML before deployment.

The static site includes:

- `/` — company homepage.
- `/business/gpuaas/` — GPUaaS business page.
- `/about/` — company and platform information.
- `/investors/` — milestones and investor roadmap.
- `/news/` — generated news archive and Markdown article pages.

The Business menu links Token Platform to
`https://www.token-exchange-ai.com/`.

## Add a news article

1. Copy the complete `content/news/_template/` directory into a date folder
   named after the publication date, for example
   `content/news/2026-09-30/new-platform/`.
2. Keep the article at `index.md` and put its cover and content images in that
   same directory.
3. Complete the front matter and write the article in Markdown. The `slug`
   field sets the article name in the public URL
   (`news/YYYY-MM-DD/<slug>/`) independently of the source directory
   path. Append `#small`, `#medium`, or `#full` to a Markdown image path to
   choose a forced responsive width.
4. Commit the directory to the public repository's `main` branch, directly or
   through a reviewed pull request.

See [`NEWS_AUTHORING.md`](NEWS_AUTHORING.md) for the editor checklist.

The `date` field must use `YYYY-MM-DD`. It controls the newest-first ordering;
filesystem modification times are not used. GitHub Actions automatically
generates:

- `news/index.json` for the homepage.
- `news/index.html` for the full archive.
- `news/<slug>/index.html` and its colocated images for each article.

## Local preview

Opening `index.html` directly shows the built-in fallback news item. To preview
generated Markdown news pages locally, use a Python environment that has the
locked dependency from `requirements-news.txt` installed:

```bash
python3 scripts/build_news.py --output _site
python3 -m http.server 8080 --directory _site
```

Then open `http://localhost:8080`.

## Deployment

The public website is deployed through GitHub Pages from:

- Repository: `Freyr-AI/freyr-ai-web`
- Deployment workflow: `.github/workflows/deploy-pages.yml`
- Website: `https://newhome.token-exchange-ai.com/`

GitHub Actions builds the static `_site/` artifact and deploys it with GitHub
Pages. Python and the Markdown package are build-time tools only; the published
site contains only static HTML, CSS, JavaScript, JSON, and images.
