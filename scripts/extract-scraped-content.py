#!/usr/bin/env python3
"""
Extract content from scraped HTML files and write to Astro content markdown files.
Parses sqs-html-content divs, excludes boilerplate, cleans HTML, preserves frontmatter.
"""

import re
from pathlib import Path

from bs4 import BeautifulSoup

# Paths
SCRAPED_DIR = Path(__file__).resolve().parent.parent.parent / "scraped"
CONTENT_DIR = Path(__file__).resolve().parent.parent / "src" / "content" / "pages"

# Pages to process: (scraped_html_name, content_md_name)
PAGES = [
    ("healthcare.html", "healthcare.md"),
    ("bakken-shale-oil-formation.html", "bakken-shale-oil-formation.md"),
    ("oil-gas-jobs.html", "oil-gas-jobs.md"),
    ("oilfield-services-jobs.html", "oilfield-services-jobs.md"),
    ("midstream-jobs.html", "midstream-jobs.md"),
    ("oilfield-service-companies.html", "oilfield-service-companies.md"),
    ("pipeline-midstream-companies.html", "pipeline-midstream-companies.md"),
    ("chamber-of-commerce-directory.html", "chamber-of-commerce-directory.md"),
]

# Patterns to exclude from extracted content
EXCLUDE_PATTERNS = [
    r"Your Custom Text Here",
    r"As seen in",
    r"©\s*COPYRIGHT\s+\d{4}-\d{4}\s+KED INTERESTS",
    r"ALL RIGHTS RESERVED",
]


def should_exclude_content(text: str) -> bool:
    """Check if content should be excluded."""
    if not text or not text.strip():
        return True
    text_lower = text.strip().lower()
    for pattern in EXCLUDE_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False


def clean_html(html: str) -> str:
    """Clean extracted HTML: remove inline styles, normalize whitespace."""
    soup = BeautifulSoup(html, "html.parser")

    # Remove style attributes from all elements
    for tag in soup.find_all(True):
        if "style" in tag.attrs:
            del tag["style"]
        if "class" in tag.attrs:
            # Keep classes that might be useful, remove Squarespace-specific ones
            classes = tag["class"]
            if "text-align-center" in classes or "text-align-right" in classes:
                pass  # keep for alignment
            # Remove sqs-*, data-* attributes
        for attr in list(tag.attrs):
            if attr.startswith("data-"):
                del tag[attr]

    # Normalize: convert &nbsp; to space, fix &amp; etc.
    result = str(soup)
    result = result.replace("&nbsp;", " ")
    result = re.sub(r"\s+", " ", result)
    result = re.sub(r">\s+<", "><", result)
    result = result.strip()
    return result


def extract_content_from_html(html_path: Path) -> str:
    """Extract main content from scraped HTML file."""
    with open(html_path, "r", encoding="utf-8", errors="replace") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    # Find the main content section (section#page or data-content-field="main-content")
    main_section = soup.find("section", {"id": "page"}) or soup.find(
        attrs={"data-content-field": "main-content"}
    )
    if not main_section:
        main_section = soup

    # Find all sqs-html-content divs within main section
    content_divs = main_section.find_all("div", class_="sqs-html-content")
    parts = []

    for div in content_divs:
        inner_html = div.decode_contents()
        if not inner_html.strip():
            continue
        # Check if this is excluded content
        text_content = BeautifulSoup(inner_html, "html.parser").get_text()
        if should_exclude_content(text_content):
            continue
        cleaned = clean_html(inner_html)
        if cleaned:
            parts.append(cleaned)

    return "\n\n".join(parts) if parts else ""


def get_frontmatter(md_path: Path) -> tuple[str, str]:
    """Extract title and description from existing markdown frontmatter."""
    if not md_path.exists():
        return "", ""
    with open(md_path, "r", encoding="utf-8") as f:
        content = f.read()
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n", content, re.DOTALL)
    if not match:
        return "", ""
    frontmatter = match.group(1)
    title = ""
    description = ""
    for line in frontmatter.split("\n"):
        if line.startswith("title:"):
            title = line.split(":", 1)[1].strip().strip('"')
        elif line.startswith("description:"):
            description = line.split(":", 1)[1].strip().strip('"')
    return title, description


def write_markdown(
    md_path: Path, title: str, description: str, body_content: str
) -> None:
    """Write markdown file with frontmatter and content-body div."""
    if not title:
        title = "Untitled"
    if not description:
        description = ""

    frontmatter = f'---\ntitle: "{title}"\ndescription: "{description}"\n---\n\n'
    content = f'<div class="content-body">\n{body_content}\n</div>\n'

    md_path.parent.mkdir(parents=True, exist_ok=True)
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(frontmatter + content)


def main():
    for html_name, md_name in PAGES:
        html_path = SCRAPED_DIR / html_name
        md_path = CONTENT_DIR / md_name

        if not html_path.exists():
            print(f"Skip (HTML not found): {html_name}")
            continue

        print(f"Processing: {html_name} -> {md_name}")
        content = extract_content_from_html(html_path)
        title, description = get_frontmatter(md_path)

        # Fallback: extract title from HTML if not in frontmatter
        if not title and html_path.exists():
            with open(html_path, "r", encoding="utf-8", errors="replace") as f:
                soup = BeautifulSoup(f.read(), "html.parser")
            title_tag = soup.find("title")
            if title_tag:
                title = title_tag.get_text().split("—")[0].strip()

        write_markdown(md_path, title, description, content)
        print(f"  Wrote {len(content)} chars to {md_path}")


if __name__ == "__main__":
    main()
