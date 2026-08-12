#!/usr/bin/env python3
"""Build the Freyr AI static site and Markdown news articles."""

from __future__ import annotations

import argparse
import html
import json
import re
import shutil
from dataclasses import dataclass
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from string import Template
from urllib.parse import urlparse

import markdown


PROJECT_ROOT = Path(__file__).resolve().parents[1]
NEWS_SOURCE = PROJECT_ROOT / "content" / "news"
TEMPLATE_ROOT = PROJECT_ROOT / "templates"
SLUG_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
ALLOWED_SCHEMES = {"", "http", "https", "mailto"}
ALLOWED_IMAGE_SCHEMES = {""}
IMAGE_EXTENSIONS = {".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"}
IMAGE_SIZE_CLASSES = {
    "small": "articleImage articleImageSmall",
    "medium": "articleImage articleImageMedium",
    "full": "articleImage articleImageFull",
}
ASSET_FILENAME_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
ALLOWED_TAGS = {
    "a",
    "blockquote",
    "br",
    "code",
    "del",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "img",
    "li",
    "ol",
    "p",
    "pre",
    "strong",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "ul",
}
VOID_TAGS = {"br", "hr", "img"}


@dataclass(frozen=True)
class NewsItem:
    source_directory: Path
    title: str
    slug: str
    published: date
    category: str
    summary: str
    cover: str
    body_html: str

    @property
    def display_date(self) -> str:
        return self.published.strftime("%B %d, %Y").upper()

    @property
    def metadata(self) -> dict[str, str]:
        return {
            "title": self.title,
            "slug": self.slug,
            "date": self.published.isoformat(),
            "display_date": self.display_date,
            "category": self.category,
            "summary": self.summary,
            "cover": f"./news/{self.slug}/{self.cover}",
            "url": f"./news/{self.slug}/",
        }


class SafeMarkup(HTMLParser):
    """Keep Markdown-generated tags while filtering unsafe URLs and attributes."""

    def __init__(self, source_directory: Path) -> None:
        super().__init__(convert_charrefs=False)
        self.source_directory = source_directory
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag not in ALLOWED_TAGS:
            return

        image_src: str | None = None
        image_class: str | None = None
        if tag == "img":
            source = next((value for name, value in attrs if name == "src"), None)
            if source is None:
                raise ValueError("Markdown image is missing its source")
            image_src, image_class = normalize_local_image(
                self.source_directory,
                source,
            )

        safe_attrs: list[str] = []
        for name, value in attrs:
            if value is None:
                continue
            if tag == "a" and name in {"href", "title"}:
                if name == "href" and urlparse(value).scheme.lower() not in ALLOWED_SCHEMES:
                    value = "#"
                safe_attrs.append(f'{name}="{html.escape(value, quote=True)}"')
            elif tag == "img" and name in {"src", "alt", "title"}:
                if name == "src":
                    value = image_src or ""
                safe_attrs.append(f'{name}="{html.escape(value, quote=True)}"')
            elif tag == "code" and name == "class" and value.startswith("language-"):
                safe_attrs.append(f'class="{html.escape(value, quote=True)}"')

        if image_class:
            safe_attrs.append(f'class="{image_class}"')
        suffix = f" {' '.join(safe_attrs)}" if safe_attrs else ""
        self.parts.append(f"<{tag}{suffix}>")

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag: str) -> None:
        if tag in ALLOWED_TAGS and tag not in VOID_TAGS:
            self.parts.append(f"</{tag}>")

    def handle_data(self, data: str) -> None:
        self.parts.append(html.escape(data, quote=False))

    def handle_entityref(self, name: str) -> None:
        self.parts.append(f"&{name};")

    def handle_charref(self, name: str) -> None:
        self.parts.append(f"&#{name};")


def parse_frontmatter(source: Path) -> tuple[dict[str, str], str]:
    text = source.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError(f"{source}: front matter must start with ---")

    try:
        closing_index = next(
            index for index, line in enumerate(lines[1:], start=1) if line.strip() == "---"
        )
    except StopIteration as error:
        raise ValueError(f"{source}: front matter is missing the closing ---") from error

    fields: dict[str, str] = {}
    for line in lines[1:closing_index]:
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if ":" not in line:
            raise ValueError(f"{source}: invalid front matter line: {line}")
        key, value = line.split(":", 1)
        fields[key.strip()] = value.strip().strip("\"'")

    return fields, "\n".join(lines[closing_index + 1 :]).strip()


def normalize_asset_filename(source_directory: Path, value: str, label: str) -> str:
    parsed = urlparse(value)
    filename = parsed.path.removeprefix("./")
    if (
        parsed.scheme
        or parsed.netloc
        or parsed.query
        or parsed.fragment
        or not ASSET_FILENAME_PATTERN.fullmatch(filename)
        or Path(filename).suffix.lower() not in IMAGE_EXTENSIONS
    ):
        raise ValueError(
            f"{source_directory / 'index.md'}: {label} must be an image filename "
            "from the same news folder"
        )

    asset = source_directory / filename
    if not asset.is_file() or asset.is_symlink():
        raise ValueError(
            f"{source_directory / 'index.md'}: {label} image does not exist: {filename}"
        )
    return filename


def normalize_local_image(source_directory: Path, value: str) -> tuple[str, str]:
    parsed = urlparse(value)
    if (
        parsed.scheme.lower() not in ALLOWED_IMAGE_SCHEMES
        or parsed.netloc
        or parsed.query
    ):
        raise ValueError(
            f"{source_directory / 'index.md'}: Markdown images must come from "
            "the same news folder"
        )

    size = parsed.fragment.lower() or "full"
    if size not in IMAGE_SIZE_CLASSES:
        sizes = ", ".join(f"#{name}" for name in IMAGE_SIZE_CLASSES)
        raise ValueError(
            f"{source_directory / 'index.md'}: unsupported image size "
            f"#{parsed.fragment}; use {sizes}"
        )

    filename = normalize_asset_filename(
        source_directory,
        parsed.path,
        "Markdown",
    )
    return f"./{filename}", IMAGE_SIZE_CLASSES[size]


def clean_markdown(body: str, source_directory: Path) -> str:
    raw_html_disabled = html.escape(body, quote=False)
    converted = markdown.markdown(
        raw_html_disabled,
        extensions=["extra", "sane_lists"],
        output_format="html5",
    )
    cleaner = SafeMarkup(source_directory)
    cleaner.feed(converted)
    cleaner.close()
    return "".join(cleaner.parts)


def load_news_item(source: Path) -> NewsItem:
    fields, body = parse_frontmatter(source)
    required = {"title", "slug", "date", "category", "summary", "cover"}
    missing = sorted(required - fields.keys())
    if missing:
        raise ValueError(f"{source}: missing fields: {', '.join(missing)}")
    if not SLUG_PATTERN.fullmatch(fields["slug"]):
        raise ValueError(f"{source}: slug must contain lowercase letters, numbers, and hyphens")

    try:
        published = date.fromisoformat(fields["date"])
    except ValueError as error:
        raise ValueError(f"{source}: date must use YYYY-MM-DD") from error

    cover = normalize_asset_filename(source.parent, fields["cover"], "cover")

    return NewsItem(
        source_directory=source.parent,
        title=fields["title"],
        slug=fields["slug"],
        published=published,
        category=fields["category"].upper(),
        summary=fields["summary"],
        cover=cover,
        body_html=clean_markdown(body, source.parent),
    )


def render_article(item: NewsItem, article_template: Template) -> str:
    return article_template.substitute(
        title=html.escape(item.title, quote=True),
        summary=html.escape(item.summary, quote=True),
        display_date=html.escape(item.display_date),
        category=html.escape(item.category),
        article_cover=html.escape(f"./{item.cover}", quote=True),
        body=item.body_html,
    )


def render_archive_card(item: NewsItem) -> str:
    return f"""        <article class="newsArchiveCard">
          <div class="newsCardCopy">
            <p class="newsDate">{html.escape(item.published.strftime("%Y/%-m/%-d"))}</p>
            <h2><a href="./{html.escape(item.slug, quote=True)}/">{html.escape(item.title)}</a></h2>
            <p class="newsSummary">{html.escape(item.summary)}</p>
            <a class="showMore" href="./{html.escape(item.slug, quote=True)}/"><span aria-hidden="true">›</span> Show More</a>
          </div>
          <a class="newsCardImage" href="./{html.escape(item.slug, quote=True)}/">
            <img src="./{html.escape(item.slug, quote=True)}/{html.escape(item.cover, quote=True)}" alt="{html.escape(item.title, quote=True)}" loading="lazy">
          </a>
        </article>"""


def build(output_root: Path) -> list[NewsItem]:
    if output_root.exists():
        shutil.rmtree(output_root)
    output_root.mkdir(parents=True)

    for filename in ("styles.css", "script.js", "README.md", "CNAME"):
        shutil.copy2(PROJECT_ROOT / filename, output_root / filename)
    shutil.copytree(PROJECT_ROOT / "public", output_root / "public")
    for directory in ("about", "business", "investors", "model-list"):
        shutil.copytree(PROJECT_ROOT / directory, output_root / directory)

    sources = sorted(
        path
        for path in NEWS_SOURCE.glob("*/index.md")
        if not path.parent.name.startswith("_")
    )
    items = sorted(
        (load_news_item(source) for source in sources),
        key=lambda item: (item.published, item.slug),
        reverse=True,
    )
    slugs = [item.slug for item in items]
    if len(slugs) != len(set(slugs)):
        raise ValueError("News slugs must be unique")

    homepage = (PROJECT_ROOT / "index.html").read_text(encoding="utf-8")
    for item in items:
        source_cover = (
            f"./content/news/{item.source_directory.name}/{item.cover}"
        )
        homepage = homepage.replace(source_cover, item.metadata["cover"])
    (output_root / "index.html").write_text(homepage, encoding="utf-8")

    news_output = output_root / "news"
    news_output.mkdir()
    article_template = Template(
        (TEMPLATE_ROOT / "news-article.html").read_text(encoding="utf-8")
    )
    archive_template = Template(
        (TEMPLATE_ROOT / "news-index.html").read_text(encoding="utf-8")
    )

    for item in items:
        article_directory = news_output / item.slug
        article_directory.mkdir()
        for asset in sorted(item.source_directory.iterdir()):
            if asset.is_file() and asset.suffix.lower() in IMAGE_EXTENSIONS:
                if asset.is_symlink():
                    raise ValueError(f"{asset}: image assets cannot be symbolic links")
                shutil.copy2(asset, article_directory / asset.name)
        (article_directory / "index.html").write_text(
            render_article(item, article_template),
            encoding="utf-8",
        )

    (news_output / "index.json").write_text(
        json.dumps([item.metadata for item in items], ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (news_output / "index.html").write_text(
        archive_template.substitute(cards="\n".join(render_archive_card(item) for item in items)),
        encoding="utf-8",
    )
    return items


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=PROJECT_ROOT / "_site",
        help="Directory that will contain the deployable static site",
    )
    args = parser.parse_args()
    output = args.output.resolve()
    if output == PROJECT_ROOT or PROJECT_ROOT not in output.parents:
        raise SystemExit("Output must be a subdirectory of the project")

    items = build(output)
    print(f"Built {len(items)} news article(s) in {output}")


if __name__ == "__main__":
    main()
