# Add a Freyr AI news article

> **Layout note:** the `date` front matter field now determines the article's
> dated URL (`news/YYYY-MM-DD/<slug>/`). Copy the template into a date folder
> named after the publication date before filling it in, and keep the `slug`
> short without a date suffix.

1. Copy the complete [`content/news/_template/`](content/news/_template/)
   directory into a date folder named after the publication date:
   `content/news/YYYY-MM-DD/` (create it if it does not exist), and rename the
   copied directory with a short descriptive name, such as
   `content/news/2026-09-30/new-platform`. The date folder becomes the dated
   URL segment; the article-name folder is only for source organization.
2. Keep the article Markdown at `index.md` inside that directory (that is,
   `content/news/YYYY-MM-DD/<name>/index.md`).
3. Put the cover and every image used by the article in the same directory as
   `index.md`. Use simple image filenames containing letters, numbers, dots,
   hyphens, or underscores.
4. Complete every front matter field:
   - `title`: article headline.
   - `slug`: unique lowercase URL using letters, numbers, and hyphens.
   - `date`: publication date in `YYYY-MM-DD` format; it must match the date
     folder in the source path.
   - `category`: short uppercase category.
   - `summary`: homepage and archive description.
   - `cover`: the cover image filename from the same directory, for example
     `cover.jpg`. It is an image path, not the article URL.
5. Write the article below the second `---` using Markdown. Reference local
   images with a same-directory path and one of the supported size markers:
   - `![Architecture](./architecture.png#small)` renders at `400px`.
   - `![Architecture](./architecture.png#medium)` renders at `680px`.
   - `![Architecture](./architecture.png#full)` fills the article width.
   - Omitting the marker defaults to `#full`.
6. Commit directly to `main` if authorized, or open a pull request for review.

GitHub Actions validates the content, orders all articles by `date` from newest
to oldest, generates the static HTML and JSON files, and deploys GitHub Pages.
Each article is published at `https://www.freyrtech.ai/news/YYYY-MM-DD/<slug>/`
(the date comes from the `date` field). Keep the `slug` short and descriptive
without a date suffix — the dated URL folder is generated automatically. Older
articles published at `news/<slug>/` keep working through generated redirects.
Open the workflow run after committing and confirm that all build and deploy
steps succeed.

Raw HTML is rendered as text. Use Markdown links and images rather than embedded
HTML or scripts. During the build, images are copied beside the generated
`news/YYYY-MM-DD/<slug>/index.html`; the `date` folder and `slug` field together
control the public article path. The selected width is enforced even when the
source image is smaller.
Every size remains limited to the available screen width for mobile
compatibility.
